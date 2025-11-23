import React, { useState, useEffect, useRef, useCallback } from 'react';

const MemoryMatrix: React.FC = () => {
    // Game Configuration
    const START_GRID_SIZE = 3;

    // State
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [gridSize, setGridSize] = useState(START_GRID_SIZE);
    const [sequence, setSequence] = useState<number[]>([]);
    const [playerSequence, setPlayerSequence] = useState<number[]>([]);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [isGameActive, setIsGameActive] = useState(false);
    const [statusText, setStatusText] = useState("Bấm 'Start Hack' để bắt đầu");
    const [statusColor, setStatusColor] = useState("text-gray-400");
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [successTiles, setSuccessTiles] = useState<boolean>(false);
    const [errorTile, setErrorTile] = useState<number | null>(null);
    const [gameOver, setGameOver] = useState(false);

    // Refs for audio context to avoid recreation
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Initialize Audio Context
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

    const playSound = useCallback((type: 'light' | 'click' | 'success' | 'error') => {
        initAudio();
        switch (type) {
            case 'light': playTone(600, 'square', 0.2); break;
            case 'click': playTone(800, 'sine', 0.1); break;
            case 'success': playTone(1200, 'triangle', 0.3); break;
            case 'error':
                playTone(150, 'sawtooth', 0.4);
                setTimeout(() => playTone(100, 'sawtooth', 0.4), 100);
                break;
        }
    }, [playTone, initAudio]);

    // Game Logic
    const startGame = () => {
        initAudio();
        setIsGameActive(true);
        setLevel(1);
        setScore(0);
        setGridSize(START_GRID_SIZE);
        setGameOver(false);
        setStatusText("Đang tải dữ liệu...");
        setStatusColor("text-gray-400");

        // Small delay before first round
        setTimeout(() => nextRound(1, START_GRID_SIZE), 1000);
    };

    const nextRound = (currentLevel: number, currentGridSize: number) => {
        // Increase difficulty
        let newGridSize = currentGridSize;
        if (currentLevel > 1 && currentLevel % 3 === 0) {
            if (newGridSize < 5) newGridSize++;
        }
        setGridSize(newGridSize);

        setSequence([]);
        setPlayerSequence([]);
        setIsPlayerTurn(false);
        setStatusText("GHI NHỚ MẪU...");
        setStatusColor("text-[#00f3ff]");

        // Generate sequence
        const steps = currentLevel + 2;
        const totalTiles = newGridSize * newGridSize;
        const newSequence: number[] = [];

        for (let i = 0; i < steps; i++) {
            newSequence.push(Math.floor(Math.random() * totalTiles));
        }
        setSequence(newSequence);
    };

    // Play sequence effect
    useEffect(() => {
        if (sequence.length > 0 && !isPlayerTurn) {
            const playSequence = async () => {
                await new Promise(r => setTimeout(r, 800));

                for (let i = 0; i < sequence.length; i++) {
                    const index = sequence[i];

                    setActiveTile(index);
                    playSound('light');

                    await new Promise(r => setTimeout(r, 500));
                    setActiveTile(null);

                    await new Promise(r => setTimeout(r, 200));
                }

                setIsPlayerTurn(true);
                setStatusText("NHẬP LẠI DỮ LIỆU");
                setStatusColor("text-[#00ff66]");
            };
            playSequence();
        }
    }, [sequence, isPlayerTurn, playSound]);

    const handleTileClick = (index: number) => {
        if (!isGameActive || !isPlayerTurn || successTiles) return;

        // Visual feedback
        setActiveTile(index);
        playSound('click');
        setTimeout(() => setActiveTile(null), 200);

        const currentStep = playerSequence.length;

        if (index === sequence[currentStep]) {
            // Correct
            const newPlayerSequence = [...playerSequence, index];
            setPlayerSequence(newPlayerSequence);

            if (newPlayerSequence.length === sequence.length) {
                // Round Complete
                setIsPlayerTurn(false);
                const newScore = score + level * 10;
                setScore(newScore);
                const newLevel = level + 1;
                setLevel(newLevel);

                setStatusText("XÂM NHẬP THÀNH CÔNG!");
                playSound('success');
                setSuccessTiles(true);

                setTimeout(() => {
                    setSuccessTiles(false);
                    nextRound(newLevel, gridSize); // Use current gridSize, nextRound will update if needed
                }, 1000);
            }
        } else {
            // Wrong - Game Over
            setIsPlayerTurn(false);
            setErrorTile(index);
            playSound('error');
            setStatusText("CẢNH BÁO: BỊ PHÁT HIỆN!");
            setStatusColor("text-[#ff0055]");

            setTimeout(() => {
                setGameOver(true);
                setIsGameActive(false);
                setErrorTile(null);
            }, 800);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505] text-[#00f3ff] font-['Chakra_Petch'] relative overflow-hidden p-4 rounded-xl">

            {/* Custom Styles for Animations */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;700&display=swap');
                
                .bg-grid {
                    background-image: 
                        linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px);
                    background-size: 40px 40px;
                    animation: gridMove 20s linear infinite;
                }

                @keyframes gridMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 40px 40px; }
                }

                .tile-shadow {
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
                }

                .tile-active {
                    background-color: #00f3ff;
                    box-shadow: 0 0 20px #00f3ff, inset 0 0 10px #ffffff;
                    border-color: #fff;
                }

                .tile-success {
                    background-color: #00ff66;
                    box-shadow: 0 0 20px #00ff66;
                }

                .tile-error {
                    background-color: #ff0055;
                    box-shadow: 0 0 20px #ff0055;
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }

                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }

                .scanline {
                    background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 51%);
                    background-size: 100% 4px;
                }
                
                .glitch {
                    text-shadow: 2px 0 #ff0055, -2px 0 #00f3ff;
                }
            `}</style>

            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid pointer-events-none opacity-50"></div>
            <div className="absolute inset-0 scanline pointer-events-none z-10"></div>

            {/* Header */}
            <div className="z-20 text-center mb-6">
                <h1 className="text-3xl md:text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                    CYBER MEMORY
                </h1>
                <div className="mt-4 flex justify-center gap-8 text-lg">
                    <div>LEVEL: <span className="text-white font-bold">{level}</span></div>
                    <div>SCORE: <span className="text-white font-bold">{score}</span></div>
                </div>
                <div className={`mt-2 text-sm h-6 font-bold ${statusColor}`}>{statusText}</div>
            </div>

            {/* Game Board */}
            <div className="relative z-20 p-4 bg-black/60 border border-cyan-500/30 rounded-xl backdrop-blur-sm shadow-[0_0_30px_rgba(0,243,255,0.1)]">
                <div
                    className="grid gap-3 transition-all duration-300"
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                        width: gridSize > 4 ? (window.innerWidth < 500 ? '220px' : '320px') : (window.innerWidth < 500 ? '200px' : '260px')
                    }}
                >
                    {Array.from({ length: gridSize * gridSize }).map((_, i) => {
                        let tileClass = "bg-[rgba(10,20,30,0.8)] border border-[#1a2f3a] rounded transition-all duration-200 cursor-pointer tile-shadow active:scale-95";

                        if (activeTile === i) tileClass += " tile-active";
                        if (successTiles) tileClass += " tile-success";
                        if (errorTile === i) tileClass += " tile-error";

                        const tileSize = gridSize > 4
                            ? (window.innerWidth < 500 ? '40px' : '60px')
                            : (window.innerWidth < 500 ? '60px' : '80px');

                        return (
                            <div
                                key={i}
                                className={tileClass}
                                style={{ width: tileSize, height: tileSize }}
                                onClick={() => handleTileClick(i)}
                            />
                        );
                    })}
                </div>

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-xl z-30 animate-fade-in">
                        <h2 className="text-3xl text-red-500 font-bold mb-2 glitch">SYSTEM FAILURE</h2>
                        <p className="text-gray-300 mb-4">Điểm số: <span className="text-white font-bold">{score}</span></p>
                        <button
                            onClick={startGame}
                            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded shadow-[0_0_15px_#00f3ff] transition-all"
                        >
                            REBOOT SYSTEM
                        </button>
                    </div>
                )}
            </div>

            {/* Start Button */}
            {!isGameActive && !gameOver && (
                <div className="z-20 mt-8">
                    <button
                        onClick={startGame}
                        className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold rounded border border-cyan-400 shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all transform hover:scale-105"
                    >
                        START HACK
                    </button>
                </div>
            )}
        </div>
    );
};

export default MemoryMatrix;
