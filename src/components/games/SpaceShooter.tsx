import React, { useEffect, useRef, useState } from 'react';

const SpaceShooter: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const [shake, setShake] = useState(false);

    // Game constants
    const SHIP_SIZE = 20;
    const BULLET_SPEED = 7;
    const ENEMY_SPEED = 2;
    const SPAWN_RATE = 60; // Frames

    // Game state refs
    const ship = useRef({ x: 0, y: 0, velocity: { x: 0, y: 0 } });
    const bullets = useRef<{ x: number; y: number }[]>([]);
    const enemies = useRef<{ x: number; y: number; size: number; hp: number }[]>([]);
    const particles = useRef<{ x: number; y: number; velocity: { x: number; y: number }; color: string; alpha: number; decay: number }[]>([]);
    const keys = useRef<{ [key: string]: boolean }>({});
    const frameCount = useRef(0);
    const animationFrameId = useRef<number>();

    useEffect(() => {
        const savedHighScore = localStorage.getItem('neonShooterHighScore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }
    }, []);

    const createExplosion = (x: number, y: number, count: number, color: string) => {
        for (let i = 0; i < count; i++) {
            particles.current.push({
                x,
                y,
                velocity: {
                    x: (Math.random() - 0.5) * 5,
                    y: (Math.random() - 0.5) * 5
                },
                color,
                alpha: 1,
                decay: Math.random() * 0.05 + 0.02
            });
        }
    };

    const resetGame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        ship.current = { x: canvas.width / 2, y: canvas.height - 50, velocity: { x: 0, y: 0 } };
        bullets.current = [];
        enemies.current = [];
        particles.current = [];
        frameCount.current = 0;
        setScore(0);
        setGameState('START');
        setShake(false);
    };

    const startGame = () => {
        setGameState('PLAYING');
    };

    const handleGameOver = () => {
        setGameState('GAMEOVER');
        createExplosion(ship.current.x, ship.current.y, 50, '#00f3ff');
        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('neonShooterHighScore', score.toString());
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            if (gameState === 'START') {
                ship.current.x = canvas.width / 2;
                ship.current.y = canvas.height - 50;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = () => {
            // Clear screen
            ctx.fillStyle = '#050b14';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Stars/Background
            ctx.fillStyle = '#ffffff';
            for (let i = 0; i < 50; i++) {
                const x = (Math.sin(i * 132.1 + frameCount.current * 0.002) * 0.5 + 0.5) * canvas.width;
                const y = (Math.cos(i * 45.3 + frameCount.current * 0.005) * 0.5 + 0.5) * canvas.height;
                ctx.globalAlpha = Math.random() * 0.5 + 0.2;
                ctx.fillRect(x, y, 2, 2);
            }
            ctx.globalAlpha = 1;

            if (gameState === 'PLAYING') {
                // Ship Movement
                if (keys.current['ArrowLeft'] || keys.current['a']) ship.current.x -= 5;
                if (keys.current['ArrowRight'] || keys.current['d']) ship.current.x += 5;
                if (keys.current['ArrowUp'] || keys.current['w']) ship.current.y -= 5;
                if (keys.current['ArrowDown'] || keys.current['s']) ship.current.y += 5;

                // Clamp ship position
                ship.current.x = Math.max(SHIP_SIZE, Math.min(canvas.width - SHIP_SIZE, ship.current.x));
                ship.current.y = Math.max(SHIP_SIZE, Math.min(canvas.height - SHIP_SIZE, ship.current.y));

                // Shooting
                if ((keys.current[' '] || keys.current['Enter']) && frameCount.current % 10 === 0) {
                    bullets.current.push({ x: ship.current.x, y: ship.current.y - SHIP_SIZE });
                }

                // Spawn Enemies
                if (frameCount.current % SPAWN_RATE === 0) {
                    enemies.current.push({
                        x: Math.random() * (canvas.width - 40) + 20,
                        y: -20,
                        size: 15,
                        hp: 1
                    });
                }

                // Update Bullets
                for (let i = bullets.current.length - 1; i >= 0; i--) {
                    bullets.current[i].y -= BULLET_SPEED;
                    if (bullets.current[i].y < 0) bullets.current.splice(i, 1);
                }

                // Update Enemies
                for (let i = enemies.current.length - 1; i >= 0; i--) {
                    const enemy = enemies.current[i];
                    enemy.y += ENEMY_SPEED;

                    // Collision with Ship
                    const dx = enemy.x - ship.current.x;
                    const dy = enemy.y - ship.current.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < enemy.size + SHIP_SIZE) {
                        handleGameOver();
                    }

                    // Collision with Bullets
                    for (let j = bullets.current.length - 1; j >= 0; j--) {
                        const bullet = bullets.current[j];
                        const bdx = enemy.x - bullet.x;
                        const bdy = enemy.y - bullet.y;
                        const bdist = Math.sqrt(bdx * bdx + bdy * bdy);

                        if (bdist < enemy.size + 5) {
                            createExplosion(enemy.x, enemy.y, 10, '#ff00ff');
                            enemies.current.splice(i, 1);
                            bullets.current.splice(j, 1);
                            setScore(prev => prev + 10);
                            break;
                        }
                    }

                    if (enemy.y > canvas.height) enemies.current.splice(i, 1);
                }

                frameCount.current++;
            }

            // Draw Ship
            if (gameState !== 'GAMEOVER') {
                ctx.save();
                ctx.translate(ship.current.x, ship.current.y);
                ctx.fillStyle = '#00f3ff';
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00f3ff';
                ctx.beginPath();
                ctx.moveTo(0, -SHIP_SIZE);
                ctx.lineTo(SHIP_SIZE, SHIP_SIZE);
                ctx.lineTo(0, SHIP_SIZE / 2);
                ctx.lineTo(-SHIP_SIZE, SHIP_SIZE);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }

            // Draw Bullets
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffff00';
            bullets.current.forEach(b => {
                ctx.beginPath();
                ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw Enemies
            ctx.fillStyle = '#ff00ff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ff00ff';
            enemies.current.forEach(e => {
                ctx.beginPath();
                ctx.moveTo(e.x, e.y + e.size);
                ctx.lineTo(e.x + e.size, e.y - e.size);
                ctx.lineTo(e.x - e.size, e.y - e.size);
                ctx.closePath();
                ctx.fill();
            });

            // Draw Particles
            particles.current.forEach((p, index) => {
                p.x += p.velocity.x;
                p.y += p.velocity.y;
                p.alpha -= p.decay;

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                if (p.alpha <= 0) particles.current.splice(index, 1);
            });

            animationFrameId.current = requestAnimationFrame(loop);
        };

        loop();

        const handleKeyDown = (e: KeyboardEvent) => {
            keys.current[e.key] = true;
            if (gameState === 'START' && (e.key === 'Enter' || e.key === ' ')) {
                startGame();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            keys.current[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameState]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full bg-gray-900 overflow-hidden ${shake ? 'animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]' : ''}`}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* HUD */}
            {gameState === 'PLAYING' && (
                <div className="absolute top-4 left-0 w-full flex justify-between px-6 pointer-events-none z-10">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 tracking-widest font-heading">SCORE</span>
                        <span className="text-3xl font-bold text-[#00f3ff] drop-shadow-[0_0_10px_#00f3ff] font-heading">{score}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 tracking-widest font-heading">HIGH SCORE</span>
                        <span className="text-3xl font-bold text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff] font-heading">{highScore}</span>
                    </div>
                </div>
            )}

            {/* Start Screen */}
            {gameState === 'START' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                    <h1 className="text-5xl font-black mb-2 text-[#00f3ff] drop-shadow-[0_0_10px_#00f3ff] text-center font-heading">
                        SPACE<br /><span className="text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff]">SHOOTER</span>
                    </h1>
                    <p className="text-gray-300 mb-8 text-sm tracking-widest animate-pulse font-heading">PRESS START</p>

                    <button
                        onClick={startGame}
                        className="px-8 py-3 rounded text-lg font-bold uppercase tracking-wider bg-black/60 border-2 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_#00f3ff] hover:bg-[#00f3ff] hover:text-black hover:shadow-[0_0_20px_#00f3ff] transition-all duration-200 font-heading"
                    >
                        START MISSION
                    </button>

                    <div className="mt-8 text-gray-500 text-xs text-center font-heading">
                        Use Arrow Keys to Move<br />Spacebar to Shoot
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 backdrop-blur-md">
                    <h2 className="text-4xl font-bold mb-6 text-red-500 drop-shadow-[0_0_15px_red] font-heading">MISSION FAILED</h2>

                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 w-64 mb-8 text-center backdrop-blur-xl">
                        <div className="mb-4">
                            <p className="text-gray-400 text-xs uppercase mb-1 font-heading">SCORE</p>
                            <p className="text-4xl font-bold text-white font-heading">{score}</p>
                        </div>
                        <div className="border-t border-gray-600 pt-4">
                            <p className="text-gray-400 text-xs uppercase mb-1 font-heading">HIGH SCORE</p>
                            <p className="text-2xl font-bold text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff] font-heading">{highScore}</p>
                        </div>
                    </div>

                    <button
                        onClick={resetGame}
                        className="px-8 py-3 rounded text-lg font-bold uppercase tracking-wider mb-4 bg-black/60 border-2 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_#00f3ff] hover:bg-[#00f3ff] hover:text-black hover:shadow-[0_0_20px_#00f3ff] transition-all duration-200 font-heading"
                    >
                        RETRY
                    </button>
                </div>
            )}

            <style>{`
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </div>
    );
};

export default SpaceShooter;
