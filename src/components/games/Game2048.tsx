import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface Tile {
    id: string;
    r: number;
    c: number;
    value: number;
    mergedFrom?: Tile[] | null;
    isNew?: boolean;
    isDead?: boolean;
}

const Game2048: React.FC = () => {
    const { t } = useTranslation();
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [keepPlaying, setKeepPlaying] = useState(false);

    const GRID_SIZE = 4;
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (tiles.some(t => t.isDead)) {
            const timer = setTimeout(() => {
                setTiles(prev => prev.filter(t => !t.isDead));
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [tiles]);

    useEffect(() => {
        const savedBest = localStorage.getItem('cyber2048_best');
        if (savedBest) setBestScore(parseInt(savedBest, 10));
        initializeGame();
    }, []);

    const initializeGame = () => {
        setTiles([]);
        setScore(0);
        setGameOver(false);
        setWon(false);
        setKeepPlaying(false);

        // Add initial tiles
        const initialTiles: Tile[] = [];
        addRandomTile(initialTiles);
        addRandomTile(initialTiles);
        setTiles(initialTiles);
    };

    const getTile = (list: Tile[], r: number, c: number) => {
        return list.find(t => t.r === r && t.c === c && !t.isDead);
    };

    const addRandomTile = (currentTiles: Tile[]) => {
        const available = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!getTile(currentTiles, r, c)) available.push({ r, c });
            }
        }

        if (available.length > 0) {
            const spot = available[Math.floor(Math.random() * available.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            currentTiles.push({
                id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                r: spot.r,
                c: spot.c,
                value,
                isNew: true
            });
        }
    };

    const move = useCallback((direction: 0 | 1 | 2 | 3) => {
        if (gameOver || (won && !keepPlaying)) return;

        setTiles(prevTiles => {
            const vector = {
                0: { r: -1, c: 0 }, // Up
                1: { r: 0, c: 1 },  // Right
                2: { r: 1, c: 0 },  // Down
                3: { r: 0, c: -1 }  // Left
            }[direction];

            const traversal = { r: [] as number[], c: [] as number[] };
            for (let i = 0; i < GRID_SIZE; i++) {
                traversal.r.push(i);
                traversal.c.push(i);
            }
            if (vector.r === 1) traversal.r.reverse();
            if (vector.c === 1) traversal.c.reverse();

            let moved = false;
            let newScore = score;
            let newWon = won;

            // Clone tiles and reset merge status
            let nextTiles = prevTiles.map(t => ({ ...t, mergedFrom: null, isNew: false }));

            // Mark dead tiles for removal (from previous turn animations)
            nextTiles = nextTiles.filter(t => !t.isDead);

            traversal.r.forEach(r => {
                traversal.c.forEach(c => {
                    const tile = getTile(nextTiles, r, c);
                    if (tile) {
                        let previous = { r: tile.r, c: tile.c };
                        let cell = { r: previous.r + vector.r, c: previous.c + vector.c };

                        // Find farthest position
                        while (
                            cell.r >= 0 && cell.r < GRID_SIZE &&
                            cell.c >= 0 && cell.c < GRID_SIZE &&
                            !getTile(nextTiles, cell.r, cell.c)
                        ) {
                            previous = cell;
                            cell = { r: previous.r + vector.r, c: previous.c + vector.c };
                        }

                        const next = getTile(nextTiles, cell.r, cell.c);

                        if (next && next.value === tile.value && !next.mergedFrom) {
                            // Merge
                            const merged: Tile = {
                                id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                r: cell.r,
                                c: cell.c,
                                value: tile.value * 2,
                                mergedFrom: [tile, next],
                                isNew: false
                            };

                            nextTiles.push(merged);

                            // Mark merged tiles as dead
                            tile.r = cell.r;
                            tile.c = cell.c;
                            tile.isDead = true;
                            next.isDead = true;

                            newScore += merged.value;
                            if (merged.value === 2048) newWon = true;
                            moved = true;
                        } else {
                            // Move
                            if (tile.r !== previous.r || tile.c !== previous.c) {
                                tile.r = previous.r;
                                tile.c = previous.c;
                                moved = true;
                            }
                        }
                    }
                });
            });

            if (moved) {
                addRandomTile(nextTiles);
                setScore(newScore);
                if (newScore > bestScore) {
                    setBestScore(newScore);
                    localStorage.setItem('cyber2048_best', newScore.toString());
                }
                if (newWon && !won) setWon(true);

                // Check Game Over
                if (nextTiles.filter(t => !t.isDead).length >= GRID_SIZE * GRID_SIZE) {
                    let canMove = false;
                    const directions = [{ r: 1, c: 0 }, { r: 0, c: 1 }];
                    for (let r = 0; r < GRID_SIZE; r++) {
                        for (let c = 0; c < GRID_SIZE; c++) {
                            const t = getTile(nextTiles, r, c);
                            if (t) {
                                for (let d of directions) {
                                    const nr = r + d.r, nc = c + d.c;
                                    const next = getTile(nextTiles, nr, nc);
                                    if (next && next.value === t.value) canMove = true;
                                }
                            }
                        }
                    }
                    if (!canMove) setGameOver(true);
                }

                return nextTiles;
            }

            return prevTiles;
        });
    }, [score, bestScore, gameOver, won, keepPlaying]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const map: { [key: string]: 0 | 1 | 2 | 3 } = {
                'ArrowUp': 0, 'ArrowRight': 1, 'ArrowDown': 2, 'ArrowLeft': 3
            };
            if (map[e.key] !== undefined) {
                e.preventDefault();
                move(map[e.key]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length > 1) return;
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStartRef.current) return;

        const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
        const dy = e.changedTouches[0].clientY - touchStartRef.current.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (Math.abs(dx) > 30) move(dx > 0 ? 1 : 3);
        } else {
            if (Math.abs(dy) > 30) move(dy > 0 ? 2 : 0);
        }

        touchStartRef.current = null;
    };

    // CSS Variables for grid layout
    const style = {
        '--grid-size': GRID_SIZE,
        '--cell-size': '80px',
        '--gap': '12px',
    } as React.CSSProperties;

    const getTileStyle = (tile: Tile) => {
        const gap = 12;
        const size = 80;
        const top = gap + tile.r * (size + gap);
        const left = gap + tile.c * (size + gap);

        return {
            top: `${top}px`,
            left: `${left}px`,
            zIndex: tile.mergedFrom ? 20 : 10,
        };
    };

    const getTileClass = (value: number) => {
        const base = "w-full h-full rounded-md flex justify-center items-center font-bold";
        const colors: { [key: number]: string } = {
            2: 'bg-[rgba(0,243,255,0.15)] border-2 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_#00f3ff] text-3xl',
            4: 'bg-[rgba(0,110,255,0.15)] border-2 border-[#006eff] text-[#006eff] shadow-[0_0_10px_#006eff] text-3xl',
            8: 'bg-[rgba(157,0,255,0.15)] border-2 border-[#9d00ff] text-[#9d00ff] shadow-[0_0_15px_#9d00ff] text-3xl',
            16: 'bg-[rgba(255,0,221,0.15)] border-2 border-[#ff00dd] text-[#ff00dd] shadow-[0_0_15px_#ff00dd] text-3xl',
            32: 'bg-[rgba(255,0,85,0.25)] border-2 border-[#ff0055] text-[#ff0055] shadow-[0_0_20px_#ff0055] text-3xl',
            64: 'bg-[rgba(255,60,0,0.25)] border-2 border-[#ff3c00] text-[#ff3c00] shadow-[0_0_20px_#ff3c00] text-3xl',
            128: 'bg-[rgba(255,166,0,0.25)] border-2 border-[#ffa600] text-[#ffa600] shadow-[0_0_25px_#ffa600] text-2xl',
            256: 'bg-[rgba(255,230,0,0.25)] border-2 border-[#ffe600] text-[#ffe600] shadow-[0_0_30px_#ffe600] text-2xl',
            512: 'bg-[rgba(50,255,0,0.25)] border-2 border-[#32ff00] text-[#32ff00] shadow-[0_0_30px_#32ff00] text-2xl',
            1024: 'bg-[rgba(255,255,255,0.2)] border-2 border-white text-white shadow-[0_0_35px_white] text-xl',
            2048: 'bg-gradient-to-tr from-[#ff00ff] to-[#00f3ff] border-2 border-white text-white shadow-[0_0_50px_white] text-xl',
        };
        return `${base} ${colors[value] || 'bg-gray-900 text-white'}`;
    };

    return (
        <div className="relative flex flex-col items-center justify-center w-full h-full font-heading" style={style}>
            {/* Background Animation */}
            <div className="absolute inset-0 pointer-events-none opacity-15 z-0" style={{
                background: `linear-gradient(rgba(18, 16, 30, 0.95), rgba(18, 16, 30, 0.95)),
                            repeating-linear-gradient(0deg, transparent, transparent 1px, #00f3ff 1px, #00f3ff 2px)`,
                backgroundSize: '100% 40px',
                animation: 'scanline 8s linear infinite'
            }} />

            {/* Header */}
            <div className="w-full max-w-[380px] px-4 mb-4 flex justify-between items-end z-10">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400 drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">2048</h1>
                    <p className="text-xs text-cyan-300 tracking-widest opacity-80">CYBER EDITION</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex flex-col items-center min-w-[70px]">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{t('game2048.score')}</span>
                        <span className="text-lg font-bold text-white">{score}</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 flex flex-col items-center min-w-[70px]">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{t('game2048.best')}</span>
                        <span className="text-lg font-bold text-pink-500">{bestScore}</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-[380px] px-4 mb-4 flex justify-end z-10">
                <button
                    onClick={initializeGame}
                    className="bg-black/60 border border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.3)] px-4 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-[#00f3ff] hover:text-black hover:shadow-[0_0_20px_#00f3ff] transition-all"
                >
                    {t('game2048.newGame')}
                </button>
            </div>

            {/* Game Board */}
            <div
                ref={containerRef}
                className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_0_50px_rgba(0,243,255,0.1)] touch-none"
                style={{
                    width: 'calc(80px * 4 + 12px * 5)',
                    height: 'calc(80px * 4 + 12px * 5)',
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Background Grid */}
                {Array.from({ length: 16 }).map((_, i) => {
                    const r = Math.floor(i / 4);
                    const c = i % 4;
                    const top = 12 + r * (80 + 12);
                    const left = 12 + c * (80 + 12);
                    return (
                        <div
                            key={i}
                            className="absolute w-[80px] h-[80px] bg-black/30 rounded-md shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                            style={{ top: `${top}px`, left: `${left}px` }}
                        />
                    );
                })}

                {/* Tiles */}
                {tiles.map(tile => (
                    <div
                        key={tile.id}
                        className={`absolute w-[80px] h-[80px] rounded-md bg-[#050b14] transition-all duration-150 ease-in-out select-none ${tile.isNew ? 'animate-[pop_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]' : ''} ${tile.mergedFrom ? 'animate-[pop_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] z-20' : ''}`}
                        style={getTileStyle(tile)}
                    >
                        <div className={getTileClass(tile.value)}>
                            {tile.value}
                        </div>
                    </div>
                ))}

                {/* Overlays */}
                {(gameOver || (won && !keepPlaying)) && (
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl animate-fade-in">
                        <h2 className={`text-4xl font-bold mb-2 ${won ? 'text-yellow-400 drop-shadow-[0_0_20px_yellow]' : 'text-red-500 drop-shadow-[0_0_20px_red]'}`}>
                            {won ? t('game2048.victory') : t('game2048.gameOver')}
                        </h2>
                        <p className="text-gray-300 mb-6">{won ? t('game2048.reached2048') : t('game2048.tryAgain')}</p>
                        <div className="flex gap-4">
                            <button
                                onClick={initializeGame}
                                className="bg-black/60 border border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.3)] px-6 py-3 rounded text-lg font-bold hover:bg-[#00f3ff] hover:text-black hover:shadow-[0_0_20px_#00f3ff] transition-all"
                            >
                                {won ? t('game2048.replay') : t('game2048.retry')}
                            </button>
                            {won && (
                                <button
                                    onClick={() => setKeepPlaying(true)}
                                    className="bg-black/60 border border-pink-500 text-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)] px-6 py-3 rounded text-lg font-bold hover:bg-pink-500 hover:text-black hover:shadow-[0_0_20px_#ec4899] transition-all"
                                >
                                    {t('game2048.continue')}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 text-gray-500 text-xs tracking-widest text-center px-4">
                {t('game2048.instructions')}
            </div>

            <style>{`
                @keyframes scanline {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 100%; }
                }
                @keyframes pop {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Game2048;
