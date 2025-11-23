import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, RefreshCw, Trophy, Clock, Lock, Unlock, AlertTriangle } from 'lucide-react';

// Hiệu ứng nền Matrix Rain
const MatrixBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const columns = Math.floor(width / 20);
        const drops = Array(columns).fill(1);
        const chars = "01010101ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#0F0';
            ctx.font = '15px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);

                if (drops[i] * 20 > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 opacity-20 pointer-events-none" />;
};

export default function BinaryHacker() {
    // Game State
    const [target, setTarget] = useState<number>(0);
    const [bits, setBits] = useState<boolean[]>(Array(8).fill(false)); // 8 bits: 128, 64, ..., 1
    const [score, setScore] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(60);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle'); // idle, playing, won, lost
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | ''>(''); // 'correct', 'wrong', ''

    // Bit values constants
    const BIT_VALUES = [128, 64, 32, 16, 8, 4, 2, 1];

    // Calculate current value based on active bits
    const currentValue = bits.reduce((acc, bit, index) => {
        return bit ? acc + BIT_VALUES[index] : acc;
    }, 0);

    // Start Game
    const startGame = () => {
        setScore(0);
        setTimeLeft(60);
        setGameState('playing');
        generateNewTarget();
        setBits(Array(8).fill(false));
        setFeedback('');
    };

    // Generate new target number
    const generateNewTarget = () => {
        // Random number between 1 and 255
        setTarget(Math.floor(Math.random() * 255) + 1);
    };

    // Timer Effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('lost');
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    // Check Win Condition
    useEffect(() => {
        if (gameState === 'playing') {
            if (currentValue === target) {
                // Correct Answer
                setFeedback('correct');
                const bonusTime = 5;
                setTimeout(() => {
                    setScore((prev) => prev + 10 + Math.floor(timeLeft / 10)); // Score formula
                    setTimeLeft((prev) => Math.min(prev + bonusTime, 60)); // Add time back but max 60
                    generateNewTarget();
                    setBits(Array(8).fill(false));
                    setFeedback('');
                }, 600);
            } else if (currentValue > target) {
                // Overshot the target - visual warning could go here
            }
        }
    }, [currentValue, target, gameState]);

    // Toggle Bit
    const toggleBit = (index: number) => {
        if (gameState !== 'playing') return;
        const newBits = [...bits];
        newBits[index] = !newBits[index];
        setBits(newBits);
    };

    // Helper to format numbers (e.g. 05)
    const pad = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono flex flex-col items-center justify-center relative overflow-hidden selection:bg-green-900 selection:text-white w-full">
            <MatrixBackground />

            {/* CRT Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />

            {/* Main Container */}
            <div className={`relative z-10 w-full max-w-4xl p-6 transition-all duration-300 ${feedback === 'correct' ? 'scale-105' : ''}`}>

                {/* Header HUD */}
                <div className="flex justify-between items-center mb-8 border-b-2 border-green-800 pb-4 bg-black/80 backdrop-blur-sm p-4 rounded-t-lg shadow-[0_0_15px_rgba(0,255,0,0.2)]">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-6 h-6 animate-pulse" />
                        <h1 className="text-2xl font-bold tracking-widest">BINARY_HACKER_V2.0</h1>
                    </div>

                    <div className="flex gap-8">
                        <div className="flex flex-col md:flex-row items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="text-xl">ĐIỂM: <span className="text-white">{pad(score)}</span></span>
                        </div>
                        <div className={`flex flex-col md:flex-row items-center gap-2 ${timeLeft < 10 ? 'text-red-500 animate-bounce' : ''}`}>
                            <Clock className="w-5 h-5" />
                            <span className="text-xl">THỜI GIAN: <span className="text-white">{pad(timeLeft)}s</span></span>
                        </div>
                    </div>
                </div>

                {/* Game Area */}
                <div className="bg-black/90 border border-green-500/50 rounded-lg p-8 shadow-[0_0_30px_rgba(0,255,0,0.15)] backdrop-blur-md relative">

                    {/* Status Overlay */}
                    {gameState === 'idle' && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 rounded-lg">
                            <Lock className="w-16 h-16 mb-4 text-green-500" />
                            <h2 className="text-3xl font-bold mb-2">SYSTEM LOCKED</h2>
                            <p className="mb-6 text-green-400/70">Giải mã nhị phân để truy cập hệ thống</p>
                            <button
                                onClick={startGame}
                                className="group relative px-8 py-3 bg-green-900/20 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-all duration-300 font-bold tracking-widest uppercase overflow-hidden"
                            >
                                <span className="relative z-10">Bắt đầu Hack</span>
                                <div className="absolute inset-0 h-full w-full bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                            </button>
                        </div>
                    )}

                    {gameState === 'lost' && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/90 rounded-lg backdrop-blur-sm">
                            <AlertTriangle className="w-16 h-16 mb-4 text-red-500" />
                            <h2 className="text-4xl font-bold mb-2 text-white">TRUY CẬP BỊ TỪ CHỐI</h2>
                            <p className="mb-6 text-red-200">Hệ thống đã phát hiện xâm nhập.</p>
                            <div className="text-xl mb-6 text-white">Điểm cuối cùng: {score}</div>
                            <button
                                onClick={startGame}
                                className="px-8 py-3 bg-white text-red-900 font-bold hover:bg-gray-200 transition-colors rounded shadow-lg"
                            >
                                THỬ LẠI
                            </button>
                        </div>
                    )}

                    {/* Core Mechanics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-12">

                        {/* Target Display */}
                        <div className="text-center space-y-2">
                            <div className="text-sm text-green-500/60 uppercase tracking-widest">MÃ KHÓA CẦN GIẢI</div>
                            <div className="text-6xl md:text-8xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(0, 255, 0, 0.7), 0 0 20px rgba(0, 255, 0, 0.5)' }}>
                                {target}
                            </div>
                        </div>

                        {/* Current Sum Display */}
                        <div className="text-center space-y-2">
                            <div className="text-sm text-green-500/60 uppercase tracking-widest">GIÁ TRỊ HIỆN TẠI</div>
                            <div className={`text-6xl md:text-8xl font-bold transition-colors duration-300 ${currentValue === target ? 'text-green-400 scale-110' :
                                    currentValue > target ? 'text-red-500' : 'text-green-800'
                                }`}>
                                {currentValue}
                            </div>
                        </div>
                    </div>

                    {/* Bits Controls */}
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-8">
                        {bits.map((isOn, index) => (
                            <div key={index} className="flex flex-col items-center gap-3">

                                {/* Visual Bit Representation (0 or 1) */}
                                <div className={`text-2xl font-bold transition-all duration-300 ${isOn ? 'text-white translate-y-[-5px]' : 'text-green-900'}`}>
                                    {isOn ? '1' : '0'}
                                </div>

                                {/* Switch Button */}
                                <button
                                    onClick={() => toggleBit(index)}
                                    className={`
                    w-12 h-20 md:w-16 md:h-24 rounded border-2 transition-all duration-200 relative overflow-hidden group
                    ${isOn
                                            ? 'bg-green-500 border-green-400 shadow-[0_0_20px_rgba(0,255,0,0.6)] translate-y-1'
                                            : 'bg-black border-green-800 hover:border-green-500 hover:shadow-[0_0_10px_rgba(0,255,0,0.3)]'
                                        }
                  `}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Cpu className={`w-6 h-6 transition-colors ${isOn ? 'text-black' : 'text-green-900 group-hover:text-green-500'}`} />
                                    </div>
                                </button>

                                {/* Bit Value Label */}
                                <div className="text-xs text-green-500/50 font-bold">
                                    {BIT_VALUES[index]}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar/Visualizer */}
                    <div className="w-full h-2 bg-green-900/30 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${currentValue > target ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((currentValue / 255) * 100, 100)}%` }}
                        />
                    </div>

                </div>

                {/* Footer Instructions */}
                <div className="mt-6 text-center text-green-500/40 text-sm flex justify-center items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Unlock className="w-4 h-4" />
                        <span>KẾT HỢP CÁC BIT ĐỂ TỔNG BẰNG MÃ KHÓA</span>
                    </div>
                    <span>|</span>
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        <span>R = RESET</span>
                    </div>
                </div>

            </div>
        </div>
    );
}