import React, { useState, useEffect, useRef, useCallback } from 'react';

// Types
type GameMode = 'campaign' | 'endless' | 'zen';
type TileType = 'normal' | 'trap' | 'freeze' | 'reverse';
type PowerUpType = 'replay' | 'slowmo' | 'shield';

interface SequenceItem {
    index: number;
    type: TileType;
}

const MemoryMatrix: React.FC = () => {
    // Game Configuration
    const START_GRID_SIZE = 3;

    // State - Game Flow
    const [mode, setMode] = useState<GameMode | null>(null);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [gridSize, setGridSize] = useState(START_GRID_SIZE);
    const [lives, setLives] = useState(3);
    const [timeLeft, setTimeLeft] = useState(0);

    // State - Round Logic
    const [sequence, setSequence] = useState<SequenceItem[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [isGameActive, setIsGameActive] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [statusColor, setStatusColor] = useState("text-gray-400");
    const [gameOver, setGameOver] = useState(false);

    // State - Visuals & Distractions
    const [activeTile, setActiveTile] = useState<{ index: number, type: TileType } | null>(null);
    const [successTiles, setSuccessTiles] = useState<boolean>(false);
    const [errorTile, setErrorTile] = useState<number | null>(null);
    const [gridRotation, setGridRotation] = useState(0);
    const [phantomTile, setPhantomTile] = useState<number | null>(null);

    // State - Power-ups
    const [powerUps, setPowerUps] = useState<Record<PowerUpType, number>>({
        replay: 1,
        slowmo: 1,
        shield: 1
    });
    const [shieldActive, setShieldActive] = useState(false);

    // Refs
    const audioCtxRef = useRef<AudioContext | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const phantomRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Audio
    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    const playTone = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, []);

    const playSound = useCallback((type: 'light' | 'click' | 'success' | 'error' | 'trap' | 'powerup') => {
        initAudio();
        switch (type) {
            case 'light': playTone(600, 'square', 0.2); break;
            case 'click': playTone(800, 'sine', 0.1); break;
            case 'success': playTone(1200, 'triangle', 0.3); break;
            case 'error':
                playTone(150, 'sawtooth', 0.4);
                setTimeout(() => playTone(100, 'sawtooth', 0.4), 100);
                break;
            case 'trap': playTone(200, 'sawtooth', 0.3); break;
            case 'powerup': playTone(1500, 'sine', 0.5); break;
        }
    }, [playTone, initAudio]);

    // Timer Logic
    useEffect(() => {
        if (isGameActive && isPlayerTurn && mode === 'endless' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleGameOver();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isGameActive, isPlayerTurn, mode, timeLeft]);

    // Phantom Lights Logic
    useEffect(() => {
        if (isPlayerTurn && level > 5) {
            const interval = setInterval(() => {
                if (Math.random() > 0.7) {
                    const randomTile = Math.floor(Math.random() * (gridSize * gridSize));
                    setPhantomTile(randomTile);
                    setTimeout(() => setPhantomTile(null), 200);
                }
            }, 2000);
            phantomRef.current = interval;
        }
        return () => {
            if (phantomRef.current) clearInterval(phantomRef.current);
        };
    }, [isPlayerTurn, level, gridSize]);

    // Game Control
    const selectMode = (selectedMode: GameMode) => {
        setMode(selectedMode);
        startGame(selectedMode);
    };

    const startGame = (selectedMode: GameMode) => {
        initAudio();
        setIsGameActive(true);
        setLevel(1);
        setScore(0);
        setGridSize(START_GRID_SIZE);
        setLives(selectedMode === 'zen' ? 999 : 3);
        setPowerUps({ replay: 1, slowmo: 1, shield: 1 });
        setGameOver(false);
        setGridRotation(0);

        nextRound(1, START_GRID_SIZE, selectedMode);
    };

    const nextRound = (currentLevel: number, currentGridSize: number, currentMode: GameMode) => {
        // Difficulty Progression
        let newGridSize = currentGridSize;
        if (currentLevel > 1 && currentLevel % 3 === 0 && newGridSize < 5) {
            newGridSize++;
        }
        setGridSize(newGridSize);
        setGridRotation(0);

        // Timer for Endless
        if (currentMode === 'endless') {
            setTimeLeft(Math.max(5, 15 - Math.floor(currentLevel / 2)));
        }

        setSequence([]);
        setPlayerSequence([]);
        setIsPlayerTurn(false);
        setStatusText("GHI NHỚ MẪU...");
        setStatusColor("text-[#00f3ff]");

        // Generate Sequence
        const steps = currentLevel + 2;
        const totalTiles = newGridSize * newGridSize;
        const newSequence: SequenceItem[] = [];

        for (let i = 0; i < steps; i++) {
            const index = Math.floor(Math.random() * totalTiles);
            let type: TileType = 'normal';

            // Special Tiles Probability (starting level 3)
            if (currentLevel >= 3 && Math.random() < 0.2) {
                const rand = Math.random();
                if (rand < 0.4) type = 'trap'; // 40% chance if special
                else if (rand < 0.7) type = 'freeze'; // 30% chance
                else if (i === steps - 1) type = 'reverse'; // Only last can be reverse
            }

            newSequence.push({ index, type });
        }
        setSequence(newSequence);
    };

    // Play Sequence
    useEffect(() => {
        if (sequence.length > 0 && !isPlayerTurn) {
            const play = async () => {
                await new Promise(r => setTimeout(r, 1000));

                for (let i = 0; i < sequence.length; i++) {
                    const item = sequence[i];
                    setActiveTile(item);

                    if (item.type === 'trap') playSound('trap');
                    else playSound('light');

                    await new Promise(r => setTimeout(r, 600));
                    setActiveTile(null);
                    await new Promise(r => setTimeout(r, 200));
                }

                // Rotating Grid Distraction (Level 4+)
                if (level >= 4) {
                    setGridRotation(90);
                    await new Promise(r => setTimeout(r, 500));
                }

                setIsPlayerTurn(true);
                const hasReverse = sequence.some(s => s.type === 'reverse');
                setStatusText(hasReverse ? "NHẬP NGƯỢC LẠI!" : "NHẬP LẠI DỮ LIỆU");
                setStatusColor(hasReverse ? "text-purple-400" : "text-[#00ff66]");
            };
            play();
        }
    }, [sequence, isPlayerTurn, playSound, level]);

    const handleTileClick = (index: number) => {
        if (!isGameActive || !isPlayerTurn || successTiles) return;

        // Check if clicked a Trap in the sequence (Traps shouldn't be clicked!)
        // Wait, logic: Trap tiles are IN the sequence but should NOT be clicked? 
        // "Người chơi tuyệt đối không được nhớ và nhấp vào ô này." -> So we skip them in input?
        // Let's assume Trap tiles are distractions IN the sequence display, but not part of the required input.
        // OR they are part of the sequence but clicking them kills you.
        // Re-reading: "Ô Bom... nhấp nháy màu ĐỎ... Người chơi tuyệt đối không được nhớ và nhấp vào ô này."
        // This implies they are NOT part of the valid input sequence.

        // Filter out traps for the target sequence
        const validSequence = sequence.filter(s => s.type !== 'trap');
        const isReverse = sequence.some(s => s.type === 'reverse');
        const targetSequence = isReverse ? [...validSequence].reverse() : validSequence;

        const currentStepIndex = playerSequence.length;
        const targetItem = targetSequence[currentStepIndex];

        // Visual Feedback
        setActiveTile({ index, type: 'normal' }); // Just light up normal on click
        playSound('click');
        setTimeout(() => setActiveTile(null), 200);

        // Check correctness
        if (targetItem && index === targetItem.index) {
            // Correct
            const newPlayerSequence = [...playerSequence, index];
            setPlayerSequence(newPlayerSequence);

            // Handle Effects
            if (targetItem.type === 'freeze') {
                setTimeLeft(prev => prev + 3); // Bonus time
            }

            if (newPlayerSequence.length === targetSequence.length) {
                // Round Complete
                setIsPlayerTurn(false);
                const newScore = score + level * 10 + (timeLeft * 2);
                setScore(newScore);
                const newLevel = level + 1;
                setLevel(newLevel);

                setStatusText("XÂM NHẬP THÀNH CÔNG!");
                playSound('success');
                setSuccessTiles(true);

                setTimeout(() => {
                    setSuccessTiles(false);
                    nextRound(newLevel, gridSize, mode!);
                }, 1000);
            }
        } else {
            // Wrong
            handleMistake(index);
        }
    };

    const handleMistake = (index: number) => {
        if (shieldActive) {
            setShieldActive(false);
            setStatusText("SHIELD ACTIVATED!");
            return;
        }

        setErrorTile(index);
        playSound('error');

        if (lives > 1) {
            setLives(prev => prev - 1);
            setStatusText("CẢNH BÁO: MẤT MẠNG!");
            setStatusColor("text-orange-500");
            // Reset input for this round? Or just continue? Usually reset.
            setPlayerSequence([]);
            setTimeout(() => setErrorTile(null), 500);
        } else {
            handleGameOver();
        }
    };

    const handleGameOver = () => {
        setIsGameActive(false);
        setGameOver(true);
        setStatusText("SYSTEM FAILURE");
        setStatusColor("text-[#ff0055]");
        playSound('error');
    };

    // Power-ups
    const usePowerUp = (type: PowerUpType) => {
        if (!isPlayerTurn || powerUps[type] <= 0) return;

        setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
        playSound('powerup');

        switch (type) {
            case 'replay':
                setIsPlayerTurn(false); // Triggers useEffect to replay
                break;
            case 'slowmo':
                setTimeLeft(prev => prev + 5);
                break;
            case 'shield':
                setShieldActive(true);
                break;
        }
    };

    // Render
    if (!mode) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505] text-[#00f3ff] font-['Chakra_Petch'] gap-6">
                <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                    SELECT MODE
                </h1>
                <div className="grid gap-4 w-64">
                    <button onClick={() => selectMode('campaign')} className="p-4 border border-cyan-500 hover:bg-cyan-900/30 rounded text-xl font-bold transition-all">
                        CAMPAIGN
                        <div className="text-xs text-gray-400 mt-1">Story Mode • Bosses</div>
                    </button>
                    <button onClick={() => selectMode('endless')} className="p-4 border border-purple-500 hover:bg-purple-900/30 rounded text-xl font-bold transition-all">
                        ENDLESS
                        <div className="text-xs text-gray-400 mt-1">Time Attack • High Score</div>
                    </button>
                    <button onClick={() => selectMode('zen')} className="p-4 border border-green-500 hover:bg-green-900/30 rounded text-xl font-bold transition-all">
                        ZEN
                        <div className="text-xs text-gray-400 mt-1">Relax • No Fail</div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505] text-[#00f3ff] font-['Chakra_Petch'] relative overflow-hidden p-4 rounded-xl">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&display=swap');
                .bg-grid { background-image: linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px); background-size: 40px 40px; animation: gridMove 20s linear infinite; }
                @keyframes gridMove { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
                .tile-active { background-color: #00f3ff; box-shadow: 0 0 20px #00f3ff; border-color: #fff; }
                .tile-trap { background-color: #ff0055; box-shadow: 0 0 20px #ff0055; }
                .tile-freeze { background-color: #0088ff; box-shadow: 0 0 20px #0088ff; }
                .tile-reverse { background-color: #aa00ff; box-shadow: 0 0 20px #aa00ff; }
                .tile-success { background-color: #00ff66; box-shadow: 0 0 20px #00ff66; }
                .tile-error { background-color: #ff0055; animation: shake 0.4s; }
                @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } }
            `}</style>

            {/* HUD */}
            <div className="w-full max-w-md flex justify-between items-center mb-4 px-4 z-20">
                <div className="flex gap-4">
                    <div className="text-sm">LVL <span className="text-xl font-bold text-white">{level}</span></div>
                    <div className="text-sm">PTS <span className="text-xl font-bold text-white">{score}</span></div>
                </div>
                <div className="flex gap-4">
                    {mode === 'endless' && (
                        <div className={`text-xl font-bold ${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {timeLeft}s
                        </div>
                    )}
                    {mode !== 'zen' && (
                        <div className="flex text-red-500 gap-1">
                            {Array.from({ length: lives }).map((_, i) => <i key={i} className="fas fa-heart"></i>)}
                        </div>
                    )}
                </div>
            </div>

            <div className={`mb-4 h-6 font-bold ${statusColor} z-20`}>{statusText}</div>

            {/* Board */}
            <div className="relative z-20 p-4 bg-black/60 border border-cyan-500/30 rounded-xl backdrop-blur-sm transition-transform duration-500"
                style={{ transform: `rotate(${gridRotation}deg)` }}>
                <div className="grid gap-3"
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                        width: gridSize > 4 ? '300px' : '260px'
                    }}>
                    {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                        let tileClass = "bg-[rgba(10,20,30,0.8)] border border-[#1a2f3a] rounded transition-all duration-200 cursor-pointer active:scale-95 h-full w-full";

                        // Active State (Playback)
                        if (activeTile?.index === i) {
                            if (activeTile.type === 'trap') tileClass += " tile-trap";
                            else if (activeTile.type === 'freeze') tileClass += " tile-freeze";
                            else if (activeTile.type === 'reverse') tileClass += " tile-reverse";
                            else tileClass += " tile-active";
                        }

                        // Phantom Distraction
                        if (phantomTile === i) tileClass += " bg-gray-700 shadow-[0_0_10px_rgba(255,255,255,0.2)]";

                        // Feedback States
                        if (successTiles) tileClass += " tile-success";
                        if (errorTile === i) tileClass += " tile-error";

                        const tileSize = gridSize > 4 ? '50px' : '70px';

                        return (
                            <div key={i}
                                className={tileClass}
                                style={{ width: tileSize, height: tileSize }}
                                onClick={() => handleTileClick(i)}
                            />
                        );
                    })}
                </div>

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-xl z-30">
                        <h2 className="text-3xl text-red-500 font-bold mb-2">GAME OVER</h2>
                        <p className="text-gray-300 mb-4">Final Score: {score}</p>
                        <div className="flex gap-4">
                            <button onClick={() => startGame(mode)} className="px-4 py-2 bg-cyan-600 rounded font-bold text-white">RETRY</button>
                            <button onClick={() => setMode(null)} className="px-4 py-2 bg-gray-700 rounded font-bold text-white">MENU</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Power-ups Bar */}
            {mode !== 'zen' && !gameOver && (
                <div className="mt-8 flex gap-4 z-20">
                    <button onClick={() => usePowerUp('replay')} disabled={powerUps.replay === 0} className="flex flex-col items-center gap-1 disabled:opacity-30">
                        <div className="w-12 h-12 rounded-full border border-yellow-400 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 transition-all">
                            <i className="fas fa-redo"></i>
                        </div>
                        <span className="text-xs text-yellow-400">{powerUps.replay}</span>
                    </button>
                    <button onClick={() => usePowerUp('slowmo')} disabled={powerUps.slowmo === 0} className="flex flex-col items-center gap-1 disabled:opacity-30">
                        <div className="w-12 h-12 rounded-full border border-blue-400 flex items-center justify-center text-blue-400 hover:bg-blue-400/20 transition-all">
                            <i className="fas fa-hourglass-half"></i>
                        </div>
                        <span className="text-xs text-blue-400">{powerUps.slowmo}</span>
                    </button>
                    <button onClick={() => usePowerUp('shield')} disabled={powerUps.shield === 0} className={`flex flex-col items-center gap-1 disabled:opacity-30 ${shieldActive ? 'animate-pulse' : ''}`}>
                        <div className="w-12 h-12 rounded-full border border-green-400 flex items-center justify-center text-green-400 hover:bg-green-400/20 transition-all">
                            <i className="fas fa-shield-alt"></i>
                        </div>
                        <span className="text-xs text-green-400">{powerUps.shield}</span>
                    </button>
                </div>
            )}

            {/* Background Elements */}
            <div className="absolute inset-0 bg-grid pointer-events-none opacity-50"></div>
        </div>
    );
};

export default MemoryMatrix;
