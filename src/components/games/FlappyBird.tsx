import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type PowerUpType = 'slowmo' | 'ghost' | 'magnet' | null;
type ObstacleType = 'pipe' | 'movingPipe' | 'laser' | 'gear';

interface Obstacle {
    x: number;
    top: number;
    bottom: number;
    passed: boolean;
    type: ObstacleType;
    moveOffset?: number;
    moveDirection?: number;
    laserActive?: boolean;
    laserTimer?: number;
    rotation?: number;
}

interface PowerUp {
    x: number;
    y: number;
    type: PowerUpType;
    collected: boolean;
}

const FlappyBird: React.FC = () => {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const [shake, setShake] = useState(false);
    const [feverMode, setFeverMode] = useState(false);
    const [activePowerUp, setActivePowerUp] = useState<PowerUpType>(null);
    const [powerUpTimer, setPowerUpTimer] = useState(0);
    const [feverTimer, setFeverTimer] = useState(0);
    const [consecutiveScore, setConsecutiveScore] = useState(0);

    // Game constants
    const GRAVITY = 0.25;
    const JUMP = -5.5;
    const PIPE_WIDTH = 55;
    const PIPE_GAP = 160;
    const COLOR_BIRD = '#ff00ff';
    const COLOR_PIPE = '#00f3ff';
    const FEVER_SCORE_THRESHOLD = 5;

    // Game state refs
    const bird = useRef({
        x: 50,
        y: 150,
        radius: 12,
        velocity: 0,
        trail: [] as { x: number; y: number; alpha: number; size: number }[]
    });
    const obstacles = useRef<Obstacle[]>([]);
    const powerUps = useRef<PowerUp[]>([]);
    const particles = useRef<{ x: number; y: number; radius: number; color: string; velocity: { x: number; y: number }; alpha: number; decay: number }[]>([]);
    const frameCount = useRef(0);
    const gameSpeed = useRef(3);
    const animationFrameId = useRef<number>();
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioAnalyserRef = useRef<AnalyserNode | null>(null);
    const audioDataRef = useRef<Uint8Array | null>(null);
    const backgroundOffset = useRef(0);
    const cityOffset = useRef(0);

    // Audio initialization
    const initAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    }, []);

    const playSound = useCallback((freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
        initAudio();
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
    }, [initAudio]);

    useEffect(() => {
        const savedHighScore = localStorage.getItem('neonFlappyHighScore');
        if (savedHighScore) {
            setHighScore(parseInt(savedHighScore, 10));
        }
    }, []);

    // Power-up timer
    useEffect(() => {
        if (activePowerUp && powerUpTimer > 0) {
            const timer = setInterval(() => {
                setPowerUpTimer(prev => {
                    if (prev <= 1) {
                        setActivePowerUp(null);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [activePowerUp, powerUpTimer]);

    // Fever mode timer
    useEffect(() => {
        if (feverMode && feverTimer > 0) {
            const timer = setInterval(() => {
                setFeverTimer(prev => {
                    if (prev <= 1) {
                        setFeverMode(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [feverMode, feverTimer]);

    const createExplosion = (x: number, y: number, count: number, color: string) => {
        for (let i = 0; i < count; i++) {
            particles.current.push({
                x,
                y,
                radius: Math.random() * 4 + 2,
                color,
                velocity: {
                    x: (Math.random() - 0.5) * 8,
                    y: (Math.random() - 0.5) * 8
                },
                alpha: 1,
                decay: Math.random() * 0.03 + 0.01
            });
        }
    };

    const createJumpParticles = (x: number, y: number) => {
        for (let i = 0; i < 8; i++) {
            particles.current.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + bird.current.radius,
                radius: Math.random() * 2 + 1,
                color: i % 2 === 0 ? '#00f3ff' : '#ff00ff',
                velocity: {
                    x: (Math.random() - 0.5) * 3,
                    y: Math.random() * 2 + 1
                },
                alpha: 1,
                decay: 0.02
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
        obstacles.current = [];
        powerUps.current = [];
        particles.current = [];
        frameCount.current = 0;
        gameSpeed.current = 3;
        backgroundOffset.current = 0;
        cityOffset.current = 0;
        setScore(0);
        setGameState('START');
        setShake(false);
        setFeverMode(false);
        setActivePowerUp(null);
        setPowerUpTimer(0);
        setFeverTimer(0);
        setConsecutiveScore(0);
    };

    const startGame = () => {
        setGameState('PLAYING');
        bird.current.velocity = JUMP;
        createJumpParticles(bird.current.x, bird.current.y);
        playSound(800, 'square', 0.1);
    };

    const jump = () => {
        if (gameState === 'PLAYING') {
            bird.current.velocity = JUMP;
            createJumpParticles(bird.current.x, bird.current.y);
            playSound(800, 'square', 0.1);
        } else if (gameState === 'START') {
            startGame();
        }
    };

    const activatePowerUp = (type: PowerUpType) => {
        setActivePowerUp(type);
        if (type === 'slowmo') {
            setPowerUpTimer(5);
        } else if (type === 'ghost') {
            setPowerUpTimer(3);
        } else if (type === 'magnet') {
            setPowerUpTimer(8);
        }
        playSound(1500, 'sine', 0.3);
    };

    const activateFeverMode = () => {
        setFeverMode(true);
        setFeverTimer(5);
        setConsecutiveScore(0);
        playSound(1200, 'triangle', 0.5);
    };

    const handleGameOver = () => {
        setGameState('GAMEOVER');
        createExplosion(bird.current.x, bird.current.y, 50, COLOR_BIRD);
        createExplosion(bird.current.x, bird.current.y, 30, '#ffffff');
        playSound(150, 'sawtooth', 0.5);

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
    }, [gameState]);

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

        // Audio reactive setup (simulated with time-based animation)
        let audioBeat = 0;
        let beatCounter = 0;

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Audio reactive beat (simulated)
            beatCounter++;
            if (beatCounter % 30 === 0) {
                audioBeat = Math.random() * 0.5 + 0.5;
            } else {
                audioBeat *= 0.95;
            }

            // Draw Parallax Background
            ctx.save();
            
            // Far background - City skyline
            cityOffset.current -= gameSpeed.current * 0.3;
            ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw city buildings
            ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
            for (let i = 0; i < 20; i++) {
                const x = (i * 100 + cityOffset.current) % (canvas.width + 100) - 50;
                const height = 50 + Math.sin(i) * 30;
                ctx.fillRect(x, canvas.height - height, 40, height);
            }

            // Grid with parallax
            backgroundOffset.current -= gameSpeed.current * 0.5;
            ctx.strokeStyle = `rgba(180, 0, 255, ${0.2 + audioBeat * 0.3})`;
            ctx.lineWidth = 1;
            const spacing = 40;
            const offset = backgroundOffset.current % spacing;

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

            // Synthwave sun
            const sunY = canvas.height * 0.3;
            const gradient = ctx.createRadialGradient(canvas.width / 2, sunY, 0, canvas.width / 2, sunY, 150);
            gradient.addColorStop(0, `rgba(255, 100, 200, ${0.3 + audioBeat * 0.2})`);
            gradient.addColorStop(1, 'rgba(255, 100, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);

            // Gradient overlay
            const overlayGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            overlayGradient.addColorStop(0, 'rgba(15, 15, 31, 0.8)');
            overlayGradient.addColorStop(0.2, 'rgba(15, 15, 31, 0)');
            overlayGradient.addColorStop(0.8, 'rgba(15, 15, 31, 0)');
            overlayGradient.addColorStop(1, 'rgba(15, 15, 31, 0.8)');
            ctx.fillStyle = overlayGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            // Fever mode overlay
            if (feverMode) {
                ctx.save();
                ctx.fillStyle = `rgba(255, 0, 255, ${Math.sin(frameCount.current * 0.2) * 0.2 + 0.1})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }

            // Update Game Logic
            if (gameState === 'PLAYING') {
                const timeScale = activePowerUp === 'slowmo' ? 0.5 : 1;
                const speedMultiplier = feverMode ? 1.5 : 1;

                // Update Bird
                bird.current.velocity += GRAVITY * timeScale;
                bird.current.y += bird.current.velocity * timeScale;

                // Enhanced Trail
                if (frameCount.current % 2 === 0) {
                    bird.current.trail.push({ 
                        x: bird.current.x, 
                        y: bird.current.y, 
                        alpha: 1,
                        size: bird.current.radius
                    });
                }
                if (bird.current.trail.length > 20) bird.current.trail.shift();

                // Update trail
                bird.current.trail.forEach(point => {
                    point.alpha -= 0.08;
                    point.size *= 0.95;
                });

                // Floor/Ceiling collision
                if (bird.current.y + bird.current.radius >= canvas.height) {
                    bird.current.y = canvas.height - bird.current.radius;
                    if (activePowerUp !== 'ghost' && !feverMode) {
                        handleGameOver();
                    }
                }
                if (bird.current.y - bird.current.radius <= 0) {
                    bird.current.y = bird.current.radius;
                    bird.current.velocity = 0;
                }

                // Spawn obstacles
                if (frameCount.current % 120 === 0) {
                    const maxTop = canvas.height - PIPE_GAP - 50;
                    const topHeight = Math.floor(Math.random() * (maxTop - 50 + 1)) + 50;
                    const obstacleType: ObstacleType = Math.random() < 0.3 ? 'movingPipe' : 
                                                      Math.random() < 0.5 ? 'laser' : 
                                                      Math.random() < 0.7 ? 'gear' : 'pipe';
                    
                    obstacles.current.push({
                        x: canvas.width,
                        top: topHeight,
                        bottom: canvas.height - (topHeight + PIPE_GAP),
                        passed: false,
                        type: obstacleType,
                        moveOffset: obstacleType === 'movingPipe' ? 0 : undefined,
                        moveDirection: obstacleType === 'movingPipe' ? (Math.random() > 0.5 ? 1 : -1) : undefined,
                        laserActive: obstacleType === 'laser' ? Math.random() > 0.5 : undefined,
                        laserTimer: obstacleType === 'laser' ? 0 : undefined,
                        rotation: obstacleType === 'gear' ? 0 : undefined
                    });
                }

                // Spawn power-ups
                if (frameCount.current % 200 === 0 && Math.random() < 0.4) {
                    const powerUpType: PowerUpType = Math.random() < 0.33 ? 'slowmo' : 
                                                     Math.random() < 0.66 ? 'ghost' : 'magnet';
                    powerUps.current.push({
                        x: canvas.width,
                        y: canvas.height / 2 + (Math.random() - 0.5) * 100,
                        type: powerUpType,
                        collected: false
                    });
                }

                // Update obstacles
                for (let i = 0; i < obstacles.current.length; i++) {
                    const obs = obstacles.current[i];
                    obs.x -= gameSpeed.current * speedMultiplier;

                    // Moving pipe
                    if (obs.type === 'movingPipe' && obs.moveOffset !== undefined && obs.moveDirection !== undefined) {
                        obs.moveOffset += obs.moveDirection * 0.5;
                        if (obs.moveOffset > 30 || obs.moveOffset < -30) {
                            obs.moveDirection *= -1;
                        }
                    }

                    // Laser
                    if (obs.type === 'laser' && obs.laserTimer !== undefined) {
                        obs.laserTimer++;
                        if (obs.laserTimer > 60) {
                            obs.laserActive = !obs.laserActive;
                            obs.laserTimer = 0;
                        }
                    }

                    // Gear rotation
                    if (obs.type === 'gear' && obs.rotation !== undefined) {
                        obs.rotation += 0.1;
                    }

                    // Collision detection
                    if (activePowerUp !== 'ghost' && !feverMode) {
                        const birdLeft = bird.current.x - bird.current.radius + 4;
                        const birdRight = bird.current.x + bird.current.radius - 4;
                        const birdTop = bird.current.y - bird.current.radius + 4;
                        const birdBottom = bird.current.y + bird.current.radius - 4;

                        const obsLeft = obs.x;
                        const obsRight = obs.x + PIPE_WIDTH;
                        let topPipeBottom = obs.top;
                        let bottomPipeTop = canvas.height - obs.bottom;

                        if (obs.type === 'movingPipe' && obs.moveOffset !== undefined) {
                            topPipeBottom += obs.moveOffset;
                            bottomPipeTop += obs.moveOffset;
                        }

                        if (birdRight > obsLeft && birdLeft < obsRight) {
                            if (obs.type === 'laser' && obs.laserActive) {
                                const laserY = obs.top + PIPE_GAP / 2;
                                if (Math.abs(bird.current.y - laserY) < 10) {
                                    handleGameOver();
                                }
                            } else if (birdTop < topPipeBottom || birdBottom > bottomPipeTop) {
                                handleGameOver();
                            }
                        }
                    }

                    // Score
                    if (obs.x + PIPE_WIDTH < bird.current.x && !obs.passed) {
                        setScore(prev => {
                            const newScore = prev + 1;
                            if (newScore % 5 === 0) gameSpeed.current += 0.2;
                            return newScore;
                        });
                        setConsecutiveScore(prev => {
                            const newConsecutive = prev + 1;
                            if (newConsecutive >= FEVER_SCORE_THRESHOLD && !feverMode) {
                                activateFeverMode();
                            }
                            return newConsecutive;
                        });
                        obs.passed = true;
                        playSound(1200, 'triangle', 0.1);
                    }

                    // Remove off-screen
                    if (obs.x + PIPE_WIDTH < 0) {
                        obstacles.current.splice(i, 1);
                        i--;
                    }
                }

                // Update power-ups
                for (let i = 0; i < powerUps.current.length; i++) {
                    const pu = powerUps.current[i];
                    pu.x -= gameSpeed.current * speedMultiplier;

                    // Magnet effect
                    if (activePowerUp === 'magnet') {
                        const dx = pu.x - bird.current.x;
                        const dy = pu.y - bird.current.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 150) {
                            pu.x -= dx * 0.1;
                            pu.y -= dy * 0.1;
                        }
                    }

                    // Collection
                    const dx = pu.x - bird.current.x;
                    const dy = pu.y - bird.current.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < bird.current.radius + 15 && !pu.collected) {
                        pu.collected = true;
                        activatePowerUp(pu.type);
                        createExplosion(pu.x, pu.y, 15, '#ffff00');
                    }

                    // Remove off-screen
                    if (pu.x < -50) {
                        powerUps.current.splice(i, 1);
                        i--;
                    }
                }

                frameCount.current++;
            }

            // Draw Obstacles
            obstacles.current.forEach(obs => {
                ctx.save();
                
                // Enhanced glow
                const glowIntensity = audioBeat * 20 + 15;
                ctx.shadowBlur = glowIntensity;
                ctx.shadowColor = feverMode ? '#ff00ff' : COLOR_PIPE;
                ctx.lineWidth = 3;

                if (obs.type === 'laser' && obs.laserActive) {
                    // Draw laser beam
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(obs.x + PIPE_WIDTH / 2, obs.top);
                    ctx.lineTo(obs.x + PIPE_WIDTH / 2, obs.top + PIPE_GAP);
                    ctx.stroke();
                } else if (obs.type === 'gear') {
                    // Draw rotating gear
                    const centerX = obs.x + PIPE_WIDTH / 2;
                    const centerY = obs.top + PIPE_GAP / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate(obs.rotation || 0);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.strokeStyle = COLOR_PIPE;
                    ctx.beginPath();
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        const radius = 20;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.resetTransform();
                } else {
                    // Regular or moving pipe
                    let topOffset = 0;
                    if (obs.type === 'movingPipe' && obs.moveOffset !== undefined) {
                        topOffset = obs.moveOffset;
                    }

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    ctx.strokeStyle = feverMode ? '#ff00ff' : COLOR_PIPE;

                    // Top pipe
                    ctx.fillRect(obs.x, 0, PIPE_WIDTH, obs.top + topOffset);
                    ctx.strokeRect(obs.x, 0, PIPE_WIDTH, obs.top + topOffset);

                    // Bottom pipe
                    ctx.fillRect(obs.x, canvas.height - obs.bottom - topOffset, PIPE_WIDTH, obs.bottom);
                    ctx.strokeRect(obs.x, canvas.height - obs.bottom - topOffset, PIPE_WIDTH, obs.bottom);

                    // Decor
                    ctx.fillStyle = feverMode ? '#ff00ff' : COLOR_PIPE;
                    ctx.globalAlpha = 0.3 + audioBeat * 0.2;
                    ctx.fillRect(obs.x + 10, 0, 5, obs.top + topOffset);
                    ctx.fillRect(obs.x + PIPE_WIDTH - 15, canvas.height - obs.bottom - topOffset, 5, obs.bottom);
                }

                ctx.restore();
            });

            // Draw Power-ups
            powerUps.current.forEach(pu => {
                if (pu.collected) return;
                ctx.save();
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffff00';
                ctx.fillStyle = '#ffff00';
                ctx.globalAlpha = 0.8 + Math.sin(frameCount.current * 0.3) * 0.2;
                ctx.beginPath();
                ctx.arc(pu.x, pu.y, 12, 0, Math.PI * 2);
                ctx.fill();
                
                // Icon
                ctx.fillStyle = '#000';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const icon = pu.type === 'slowmo' ? '⏱' : pu.type === 'ghost' ? '👻' : '🧲';
                ctx.fillText(icon, pu.x, pu.y);
                ctx.restore();
            });

            // Draw Enhanced Bird Trail
            bird.current.trail.forEach((point, index) => {
                ctx.save();
                const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.size);
                gradient.addColorStop(0, COLOR_BIRD);
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.globalAlpha = point.alpha * 0.6;
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Draw Bird with enhanced glow
            ctx.save();
            const birdGlow = feverMode ? 40 : 25 + audioBeat * 10;
            ctx.shadowBlur = birdGlow;
            ctx.shadowColor = feverMode ? '#ff00ff' : COLOR_BIRD;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(bird.current.x, bird.current.y, bird.current.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = feverMode ? '#ff00ff' : COLOR_BIRD;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Power-up indicator
            if (activePowerUp === 'ghost') {
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            ctx.restore();

            // Update and Draw Particles
            particles.current.forEach((p, index) => {
                p.x += p.velocity.x;
                p.y += p.velocity.y;
                p.alpha -= p.decay;

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 15;
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
    }, [gameState, activePowerUp, feverMode, powerUpTimer, feverTimer]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-full min-h-[600px] bg-gray-900 overflow-hidden ${shake ? 'animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]' : ''} ${feverMode ? 'animate-pulse' : ''}`}
            onClick={jump}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* HUD */}
            {gameState === 'PLAYING' && (
                <div className="absolute top-4 left-0 w-full flex justify-between px-6 pointer-events-none z-10">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 tracking-widest font-heading">{t('flappy.score')}</span>
                        <span className={`text-3xl font-bold drop-shadow-[0_0_10px_#00f3ff] font-heading ${feverMode ? 'text-[#ff00ff]' : 'text-[#00f3ff]'}`}>{score}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 tracking-widest font-heading">{t('flappy.highScore')}</span>
                        <span className="text-3xl font-bold text-[#ff00ff] drop-shadow-[0_0_10px_#ff00ff] font-heading">{highScore}</span>
                    </div>
                </div>
            )}

            {/* Power-up indicator */}
            {gameState === 'PLAYING' && activePowerUp && (
                <div className="absolute top-20 left-6 pointer-events-none z-10">
                    <div className="bg-black/60 border-2 border-cyan-400 px-4 py-2 rounded-lg">
                        <div className="text-cyan-400 text-sm font-bold">
                            {activePowerUp === 'slowmo' ? '⏱ SLOW-MO' : 
                             activePowerUp === 'ghost' ? '👻 GHOST' : '🧲 MAGNET'}
                        </div>
                        <div className="text-cyan-300 text-xs">{powerUpTimer}s</div>
                    </div>
                </div>
            )}

            {/* Fever mode indicator */}
            {gameState === 'PLAYING' && feverMode && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400 animate-pulse">
                        FEVER MODE!
                    </div>
                </div>
            )}

            {/* Start Screen */}
            {gameState === 'START' && (
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
            )}

            {/* Game Over Screen */}
            {gameState === 'GAMEOVER' && (
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
