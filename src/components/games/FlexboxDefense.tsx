import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface Enemy {
    id: string;
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    speed: number;
    pathIndex: number;
    frozen?: boolean;
}

interface Projectile {
    id: string;
    x: number;
    y: number;
    targetId: string;
    speed: number;
    damage: number;
    color: string;
}

const FlexboxDefense: React.FC = () => {
    const { t } = useTranslation();
    const [cssInput, setCssInput] = useState('justify-content: center;\nalign-items: center;');
    const [validCss, setValidCss] = useState<React.CSSProperties>({ justifyContent: 'center', alignItems: 'center' });
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WAVE_CLEARED' | 'GAMEOVER'>('START');
    const [wave, setWave] = useState(1);
    const [lives, setLives] = useState(10);
    const [money, setMoney] = useState(100);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number>();
    const lastTimeRef = useRef<number>(0);
    const spawnTimerRef = useRef<number>(0);
    const enemiesToSpawnRef = useRef<number>(0);

    // Game Constants
    const PATH_POINTS = [
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 300 },
        { x: 300, y: 300 },
        { x: 300, y: 100 },
        { x: 500, y: 100 },
        { x: 500, y: 400 },
        { x: 200, y: 400 },
        { x: 200, y: 500 },
        { x: 600, y: 500 }
    ];

    const TOWER_RANGE = 150;
    const TOWER_DAMAGE = 20;
    const TOWER_COOLDOWN = 500; // ms

    const towerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const lastShotTime = useRef<number[]>([]);

    useEffect(() => {
        // Initialize tower refs
        towerRefs.current = towerRefs.current.slice(0, 5);
        lastShotTime.current = new Array(5).fill(0);
    }, []);

    const handleCssChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = e.target.value;
        setCssInput(input);

        // Simple parser to convert CSS string to React.CSSProperties
        const newStyle: any = {};
        const rules = input.split(';');
        rules.forEach(rule => {
            const [prop, value] = rule.split(':');
            if (prop && value) {
                const camelProp = prop.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                newStyle[camelProp] = value.trim();
            }
        });
        setValidCss(newStyle);
    };

    const startGame = () => {
        setGameState('PLAYING');
        setLives(10);
        setMoney(100);
        setWave(1);
        startWave(1);
    };

    const startWave = (waveNum: number) => {
        setEnemies([]);
        setProjectiles([]);
        enemiesToSpawnRef.current = 5 + waveNum * 2;
        spawnTimerRef.current = 0;
        setGameState('PLAYING');
    };

    const spawnEnemy = () => {
        const id = `e_${Date.now()}_${Math.random()}`;
        const newEnemy: Enemy = {
            id,
            x: PATH_POINTS[0].x,
            y: PATH_POINTS[0].y,
            hp: 100 + wave * 20,
            maxHp: 100 + wave * 20,
            speed: 1 + wave * 0.1,
            pathIndex: 0
        };
        setEnemies(prev => [...prev, newEnemy]);
    };

    const gameLoop = (timestamp: number) => {
        if (gameState !== 'PLAYING') return;

        const deltaTime = timestamp - lastTimeRef.current;
        lastTimeRef.current = timestamp;

        // Spawning Logic
        if (enemiesToSpawnRef.current > 0) {
            spawnTimerRef.current += deltaTime;
            if (spawnTimerRef.current > 1500) { // Spawn every 1.5s
                spawnEnemy();
                enemiesToSpawnRef.current--;
                spawnTimerRef.current = 0;
            }
        } else if (enemies.length === 0 && enemiesToSpawnRef.current === 0) {
            setGameState('WAVE_CLEARED');
            return;
        }

        // Update Enemies
        setEnemies(prevEnemies => {
            const nextEnemies = prevEnemies.map(enemy => {
                const target = PATH_POINTS[enemy.pathIndex + 1];
                if (!target) return null; // Reached end

                const dx = target.x - enemy.x;
                const dy = target.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.speed) {
                    enemy.pathIndex++;
                    if (enemy.pathIndex >= PATH_POINTS.length - 1) {
                        setLives(l => l - 1);
                        return null; // Reached end
                    }
                    return enemy;
                }

                const vx = (dx / dist) * enemy.speed;
                const vy = (dy / dist) * enemy.speed;

                return { ...enemy, x: enemy.x + vx, y: enemy.y + vy };
            }).filter(Boolean) as Enemy[];

            if (lives <= 0) setGameState('GAMEOVER');
            return nextEnemies;
        });

        // Tower Logic (Shooting)
        towerRefs.current.forEach((tower, index) => {
            if (!tower || !containerRef.current) return;

            // Get tower position relative to game container
            const containerRect = containerRef.current.getBoundingClientRect();
            const towerRect = tower.getBoundingClientRect();
            const towerX = towerRect.left - containerRect.left + towerRect.width / 2;
            const towerY = towerRect.top - containerRect.top + towerRect.height / 2;

            if (timestamp - lastShotTime.current[index] > TOWER_COOLDOWN) {
                // Find target
                const target = enemies.find(e => {
                    const dist = Math.sqrt(Math.pow(e.x - towerX, 2) + Math.pow(e.y - towerY, 2));
                    return dist <= TOWER_RANGE;
                });

                if (target) {
                    // Shoot
                    setProjectiles(prev => [...prev, {
                        id: `p_${Date.now()}_${index}`,
                        x: towerX,
                        y: towerY,
                        targetId: target.id,
                        speed: 8,
                        damage: TOWER_DAMAGE,
                        color: '#00f3ff'
                    }]);
                    lastShotTime.current[index] = timestamp;
                }
            }
        });

        // Update Projectiles
        setProjectiles(prev => {
            return prev.map(p => {
                const target = enemies.find(e => e.id === p.targetId);
                if (!target) return null;

                const dx = target.x - p.x;
                const dy = target.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < p.speed) {
                    // Hit
                    setEnemies(currentEnemies =>
                        currentEnemies.map(e =>
                            e.id === target.id ? { ...e, hp: e.hp - p.damage } : e
                        ).filter(e => {
                            if (e.hp <= 0) {
                                setMoney(m => m + 10);
                                return false;
                            }
                            return true;
                        })
                    );
                    return null;
                }

                const vx = (dx / dist) * p.speed;
                const vy = (dy / dist) * p.speed;

                return { ...p, x: p.x + vx, y: p.y + vy };
            }).filter(Boolean) as Projectile[];
        });

        animationFrameId.current = requestAnimationFrame(() => gameLoop(performance.now()));
    };

    useEffect(() => {
        if (gameState === 'PLAYING') {
            animationFrameId.current = requestAnimationFrame(() => gameLoop(performance.now()));
        }
        return () => {
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [gameState, enemies, lives]); // Dependencies for loop restart

    const nextWave = () => {
        setWave(w => w + 1);
        startWave(wave + 1);
    };

    return (
        <div className="flex flex-col md:flex-row w-full h-full max-w-6xl mx-auto gap-4 p-4 text-white font-heading">
            {/* Game Area */}
            <div className="relative flex-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-2xl" style={{ minHeight: '500px' }}>
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                />

                {/* Path */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <polyline
                        points={PATH_POINTS.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="rgba(255, 0, 255, 0.3)"
                        strokeWidth="40"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <polyline
                        points={PATH_POINTS.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#ff00ff"
                        strokeWidth="2"
                        strokeDasharray="10 10"
                        className="animate-[dash_1s_linear_infinite]"
                    />
                </svg>

                {/* Tower Container (Flexbox) */}
                <div
                    ref={containerRef}
                    className="absolute inset-0 z-10 flex"
                    style={{ ...validCss, pointerEvents: 'none' }}
                >
                    {/* Towers */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            ref={el => towerRefs.current[i] = el}
                            className="w-12 h-12 bg-cyan-500/20 border-2 border-cyan-400 rounded-lg flex items-center justify-center m-2 shadow-[0_0_15px_rgba(6,182,212,0.5)] relative"
                        >
                            <div className="w-8 h-8 bg-cyan-400 rounded-full animate-pulse" />
                            {/* Range Indicator (Optional) */}
                            {/* <div className="absolute w-[300px] h-[300px] border border-cyan-500/30 rounded-full -z-10" /> */}
                        </div>
                    ))}
                </div>

                {/* Enemies */}
                {enemies.map(enemy => (
                    <div
                        key={enemy.id}
                        className="absolute w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-[0_0_10px_red] z-20 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform"
                        style={{ left: enemy.x, top: enemy.y }}
                    >
                        <div className="absolute -top-4 w-full h-1 bg-gray-700 rounded">
                            <div
                                className="h-full bg-green-500 rounded"
                                style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}

                {/* Projectiles */}
                {projectiles.map(p => (
                    <div
                        key={p.id}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_5px_yellow] z-30"
                        style={{ left: p.x, top: p.y }}
                    />
                ))}

                {/* HUD */}
                <div className="absolute top-4 left-4 flex gap-4 z-40">
                    <div className="bg-black/60 px-3 py-1 rounded border border-red-500 text-red-500 font-bold">
                        LIVES: {lives}
                    </div>
                    <div className="bg-black/60 px-3 py-1 rounded border border-yellow-500 text-yellow-500 font-bold">
                        MONEY: ${money}
                    </div>
                    <div className="bg-black/60 px-3 py-1 rounded border border-blue-500 text-blue-500 font-bold">
                        WAVE: {wave}
                    </div>
                </div>

                {/* Overlays */}
                {gameState === 'START' && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
                        <h1 className="text-4xl font-bold text-cyan-400 mb-4">FLEXBOX DEFENSE</h1>
                        <p className="mb-8 text-gray-300 max-w-md text-center">
                            Use CSS Flexbox to position your towers along the path.
                            Defend against incoming waves!
                        </p>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-cyan-500 text-black font-bold rounded hover:bg-cyan-400 transition"
                        >
                            START GAME
                        </button>
                    </div>
                )}

                {gameState === 'WAVE_CLEARED' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50">
                        <h2 className="text-3xl font-bold text-green-400 mb-4">WAVE CLEARED!</h2>
                        <button
                            onClick={nextWave}
                            className="px-8 py-3 bg-green-500 text-black font-bold rounded hover:bg-green-400 transition"
                        >
                            NEXT WAVE
                        </button>
                    </div>
                )}

                {gameState === 'GAMEOVER' && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
                        <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
                        <p className="text-xl mb-8">Waves Survived: {wave - 1}</p>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition"
                        >
                            TRY AGAIN
                        </button>
                    </div>
                )}
            </div>

            {/* Controls / Code Editor */}
            <div className="w-full md:w-80 bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col shadow-xl">
                <h3 className="text-xl font-bold text-cyan-400 mb-4">CSS CONTROL</h3>
                <p className="text-xs text-gray-400 mb-2">
                    Control the container of your 5 towers.
                    <br />
                    Container is <code>display: flex</code> by default.
                </p>

                <div className="bg-black rounded-lg p-4 font-mono text-sm flex-1 border border-gray-600 relative">
                    <div className="text-gray-500 mb-2">.tower-container {'{'}</div>
                    <textarea
                        value={cssInput}
                        onChange={handleCssChange}
                        className="w-full h-32 bg-transparent text-green-400 outline-none resize-none"
                        spellCheck={false}
                    />
                    <div className="text-gray-500 mt-2">{'}'}</div>
                </div>

                <div className="mt-4 space-y-2">
                    <p className="text-xs font-bold text-gray-300">Common Properties:</p>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                        <code className="bg-gray-700 p-1 rounded text-pink-400">justify-content: flex-start | center | flex-end | space-between | space-around</code>
                        <code className="bg-gray-700 p-1 rounded text-pink-400">align-items: flex-start | center | flex-end | stretch</code>
                        <code className="bg-gray-700 p-1 rounded text-pink-400">flex-direction: row | column | row-reverse | column-reverse</code>
                        <code className="bg-gray-700 p-1 rounded text-pink-400">flex-wrap: nowrap | wrap</code>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes dash {
                    to { stroke-dashoffset: -20; }
                }
            `}</style>
        </div>
    );
};

export default FlexboxDefense;
