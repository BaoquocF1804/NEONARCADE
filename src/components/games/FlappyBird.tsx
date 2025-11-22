import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const FlappyBird: React.FC = () => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const [shake, setShake] = useState(false);

    // ... (rest of the component state and logic)

    // ... (inside return)

    {/* HUD */ }
    {
        gameState === 'PLAYING' && (
            <div className="absolute top-4 left-0 w-full flex justify-between px-6 pointer-events-none z-10">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400 tracking-widest font-heading">{t('flappy.score')}</span>
                    <span className="text-3xl font-bold text-[#00f3ff] drop-shadow-[0_0_10px_#00f3ff] font-heading">{score}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-400 tracking-widest font-heading">{t('flappy.highScore')}</span>
                    <span className="text-3xl font-bold text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff] font-heading">{highScore}</span>
                </div>
            </div>
        )
    }

    {/* Start Screen */ }
    {
        gameState === 'START' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                <h1 className="text-5xl font-black mb-2 text-[#00f3ff] drop-shadow-[0_0_10px_#00f3ff] text-center font-heading">
                    NEON<br /><span className="text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff]">FLAPPY</span>
                </h1>
                <p className="text-gray-300 mb-8 text-sm tracking-widest animate-pulse font-heading">{t('flappy.tapToStart')}</p>

                <button
                    onClick={(e) => { e.stopPropagation(); startGame(); }}
                    className="px-8 py-3 rounded text-lg font-bold uppercase tracking-wider bg-black/60 border-2 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_#00f3ff] hover:bg-[#00f3ff] hover:text-black hover:shadow-[0_0_20px_#00f3ff] transition-all duration-200 font-heading"
                >
                    {t('flappy.playNow')}
                </button>

                <div className="mt-8 text-gray-500 text-xs text-center font-heading">
                    {t('flappy.instructions').split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                            {line}
                            {i < t('flappy.instructions').split('\n').length - 1 && <br />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        )
    }

    {/* Game Over Screen */ }
    {
        gameState === 'GAMEOVER' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 backdrop-blur-md">
                <h2 className="text-4xl font-bold mb-6 text-red-500 drop-shadow-[0_0_15px_red] font-heading">{t('flappy.gameOver')}</h2>

                <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 w-64 mb-8 text-center backdrop-blur-xl">
                    <div className="mb-4">
                        <p className="text-gray-400 text-xs uppercase mb-1 font-heading">{t('flappy.yourScore')}</p>
                        <p className="text-4xl font-bold text-white font-heading">{score}</p>
                    </div>
                    <div className="border-t border-gray-600 pt-4">
                        <p className="text-gray-400 text-xs uppercase mb-1 font-heading">{t('flappy.record')}</p>
                        <p className="text-2xl font-bold text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff] font-heading">{highScore}</p>
                    </div>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); resetGame(); }}
                    className="px-8 py-3 rounded text-lg font-bold uppercase tracking-wider mb-4 bg-black/60 border-2 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_#00f3ff] hover:bg-[#00f3ff] hover:text-black hover:shadow-[0_0_20px_#00f3ff] transition-all duration-200 font-heading"
                >
                    {t('flappy.playAgain')}
                </button>
            </div>
        )
    }

    // Game constants
    const GRAVITY = 0.25;
    const JUMP = -5.5;
    const PIPE_WIDTH = 55;
    const PIPE_GAP = 160;
    const COLOR_BIRD = '#ff00ff';
    const COLOR_PIPE = '#00f3ff';

    // Game state refs
    const bird = useRef({
        x: 50,
        y: 150,
        radius: 12,
        velocity: 0,
        trail: [] as { x: number; y: number; alpha: number }[]
    });
    const pipes = useRef<{ x: number; top: number; bottom: number; passed: boolean }[]>([]);
    const particles = useRef<{ x: number; y: number; radius: number; color: string; velocity: { x: number; y: number }; alpha: number; decay: number }[]>([]);
    const frameCount = useRef(0);
    const gameSpeed = useRef(3);
    const animationFrameId = useRef<number>();

    useEffect(() => {
        const savedHighScore = localStorage.getItem('neonFlappyHighScore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }
    }, []);

    const createExplosion = (x: number, y: number, count: number, color: string) => {
        for (let i = 0; i < count; i++) {
            particles.current.push({
                x,
                y,
                radius: Math.random() * 3 + 1,
                color,
                velocity: {
                    x: (Math.random() - 0.5) * 5,
                    y: (Math.random() - 0.5) * 5
                },
                alpha: 1,
                decay: Math.random() * 0.03 + 0.01
            });
        }
    };

    const resetGame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        bird.current = {
            x: 50,
            y: canvas.height / 2,
            radius: 12,
            velocity: 0,
            trail: []
        };
        pipes.current = [];
        particles.current = [];
        frameCount.current = 0;
        gameSpeed.current = 3;
        setScore(0);
        setGameState('START');
        setShake(false);
    };

    const startGame = () => {
        setGameState('PLAYING');
        bird.current.velocity = JUMP; // Jump on start
        createExplosion(bird.current.x, bird.current.y + bird.current.radius, 5, '#ffffff');
    };

    const jump = () => {
        if (gameState === 'PLAYING') {
            bird.current.velocity = JUMP;
            createExplosion(bird.current.x, bird.current.y + bird.current.radius, 5, '#ffffff');
        } else if (gameState === 'START') {
            startGame();
        }
    };

    const handleGameOver = () => {
        setGameState('GAMEOVER');
        createExplosion(bird.current.x, bird.current.y, 30, COLOR_BIRD);
        createExplosion(bird.current.x, bird.current.y, 20, '#ffffff');

        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('neonFlappyHighScore', score.toString());
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                jump();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]); // Re-bind when gameState changes to ensure jump uses latest state

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            if (gameState === 'START') {
                bird.current.y = canvas.height / 2;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = () => {
            // Clear screen
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Background Grid
            ctx.save();
            ctx.strokeStyle = 'rgba(180, 0, 255, 0.2)';
            ctx.lineWidth = 1;
            const spacing = 40;
            const offset = frameCount.current * (gameSpeed.current * 0.5) % spacing;

            for (let x = -offset; x < canvas.width; x += spacing) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < canvas.height; y += spacing) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            // Gradient overlay
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(15, 15, 31, 1)');
            gradient.addColorStop(0.2, 'rgba(15, 15, 31, 0)');
            gradient.addColorStop(0.8, 'rgba(15, 15, 31, 0)');
            gradient.addColorStop(1, 'rgba(15, 15, 31, 1)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            // Update Game Logic
            if (gameState === 'PLAYING') {
                // Update Bird
                bird.current.velocity += GRAVITY;
                bird.current.y += bird.current.velocity;

                // Trail logic
                if (frameCount.current % 3 === 0) {
                    bird.current.trail.push({ x: bird.current.x, y: bird.current.y, alpha: 0.8 });
                }
                if (bird.current.trail.length > 10) bird.current.trail.shift();

                // Floor collision
                if (bird.current.y + bird.current.radius >= canvas.height) {
                    bird.current.y = canvas.height - bird.current.radius;
                    handleGameOver();
                }
                // Ceiling collision
                if (bird.current.y - bird.current.radius <= 0) {
                    bird.current.y = bird.current.radius;
                    bird.current.velocity = 0;
                }

                // Update Pipes
                if (frameCount.current % 120 === 0) {
                    const maxTop = canvas.height - PIPE_GAP - 50;
                    const topHeight = Math.floor(Math.random() * (maxTop - 50 + 1)) + 50;
                    pipes.current.push({
                        x: canvas.width,
                        top: topHeight,
                        bottom: canvas.height - (topHeight + PIPE_GAP),
                        passed: false
                    });
                }

                for (let i = 0; i < pipes.current.length; i++) {
                    const p = pipes.current[i];
                    p.x -= gameSpeed.current;

                    // Collision
                    const birdLeft = bird.current.x - bird.current.radius + 4;
                    const birdRight = bird.current.x + bird.current.radius - 4;
                    const birdTop = bird.current.y - bird.current.radius + 4;
                    const birdBottom = bird.current.y + bird.current.radius - 4;

                    const pipeLeft = p.x;
                    const pipeRight = p.x + PIPE_WIDTH;
                    const topPipeBottom = p.top;
                    const bottomPipeTop = canvas.height - p.bottom;

                    if (birdRight > pipeLeft && birdLeft < pipeRight) {
                        if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
                            handleGameOver();
                        }
                    }

                    // Score
                    if (p.x + PIPE_WIDTH < bird.current.x && !p.passed) {
                        setScore(prev => {
                            const newScore = prev + 1;
                            if (newScore % 5 === 0) gameSpeed.current += 0.2;
                            return newScore;
                        });
                        p.passed = true;
                    }

                    // Remove off-screen pipes
                    if (p.x + PIPE_WIDTH < 0) {
                        pipes.current.shift();
                        i--;
                    }
                }

                frameCount.current++;
            }

            // Draw Pipes
            pipes.current.forEach(p => {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.strokeStyle = COLOR_PIPE;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = COLOR_PIPE;

                // Top Pipe
                ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
                ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.top);

                // Bottom Pipe
                ctx.fillRect(p.x, canvas.height - p.bottom, PIPE_WIDTH, p.bottom);
                ctx.strokeRect(p.x, canvas.height - p.bottom, PIPE_WIDTH, p.bottom);

                // Decor
                ctx.fillStyle = COLOR_PIPE;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(p.x + 10, 0, 5, p.top);
                ctx.fillRect(p.x + PIPE_WIDTH - 15, canvas.height - p.bottom, 5, p.bottom);
                ctx.restore();
            });

            // Draw Bird Trail
            bird.current.trail.forEach((point, index) => {
                ctx.save();
                ctx.fillStyle = COLOR_BIRD;
                ctx.globalAlpha = point.alpha * (index / bird.current.trail.length) * 0.5;
                ctx.beginPath();
                ctx.arc(point.x, point.y, bird.current.radius * (index / bird.current.trail.length), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                if (gameState === 'PLAYING') {
                    point.x -= gameSpeed.current;
                    point.alpha -= 0.05;
                }
            });

            // Draw Bird
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.shadowBlur = 20;
            ctx.shadowColor = COLOR_BIRD;
            ctx.beginPath();
            ctx.arc(bird.current.x, bird.current.y, bird.current.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = COLOR_BIRD;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // Update and Draw Particles
            particles.current.forEach((p, index) => {
                p.x += p.velocity.x;
                p.y += p.velocity.y;
                p.alpha -= p.decay;

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                if (p.alpha <= 0) particles.current.splice(index, 1);
            });

            animationFrameId.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameState]); // Re-bind loop when gameState changes

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full min-h-[600px] bg-gray-900 overflow-hidden ${shake ? 'animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]' : ''}`}
            onClick={jump}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* HUD */}
            {gameState === 'PLAYING' && (
                <div className="absolute top-4 left-0 w-full flex justify-between px-6 pointer-events-none z-10">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 tracking-widest font-heading">ĐIỂM</span>
                        <span className="text-3xl font-bold text-[#00f3ff] drop-shadow-[0_0_10px_#00f3ff] font-heading">{score}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 tracking-widest font-heading">CAO NHẤT</span>
                        <span className="text-3xl font-bold text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff] font-heading">{highScore}</span>
                    </div>
                </div>
            )}

            {/* Start Screen */}
            {gameState === 'START' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
                    <h1 className="text-5xl font-black mb-2 text-[#00f3ff] drop-shadow-[0_0_10px_#00f3ff] text-center font-heading">
                        NEON<br /><span className="text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff]">FLAPPY</span>
                    </h1>
                    <p className="text-gray-300 mb-8 text-sm tracking-widest animate-pulse font-heading">CHẠM ĐỂ BẮT ĐẦU</p>

                    <button
                        onClick={(e) => { e.stopPropagation(); startGame(); }}
                        className="px-8 py-3 rounded text-lg font-bold uppercase tracking-wider bg-black/60 border-2 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_#00f3ff] hover:bg-[#00f3ff] hover:text-black hover:shadow-[0_0_20px_#00f3ff] transition-all duration-200 font-heading"
                    >
                        Chơi Ngay
                    </button>

                    <div className="mt-8 text-gray-500 text-xs text-center font-heading">
                        Dùng phím Space hoặc Click chuột<br />để bay lên
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 backdrop-blur-md">
                    <h2 className="text-4xl font-bold mb-6 text-red-500 drop-shadow-[0_0_15px_red] font-heading">GAME OVER</h2>

                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 w-64 mb-8 text-center backdrop-blur-xl">
                        <div className="mb-4">
                            <p className="text-gray-400 text-xs uppercase mb-1 font-heading">Điểm của bạn</p>
                            <p className="text-4xl font-bold text-white font-heading">{score}</p>
                        </div>
                        <div className="border-t border-gray-600 pt-4">
                            <p className="text-gray-400 text-xs uppercase mb-1 font-heading">Kỷ lục</p>
                            <p className="text-2xl font-bold text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff] font-heading">{highScore}</p>
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); resetGame(); }}
                        className="px-8 py-3 rounded text-lg font-bold uppercase tracking-wider mb-4 bg-black/60 border-2 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_#00f3ff] hover:bg-[#00f3ff] hover:text-black hover:shadow-[0_0_20px_#00f3ff] transition-all duration-200 font-heading"
                    >
                        Chơi Lại
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

export default FlappyBird;
