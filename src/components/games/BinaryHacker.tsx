import React, { useState, useEffect } from 'react';

const BinaryHacker: React.FC = () => {
    const [target, setTarget] = useState<number>(0);
    const [bits, setBits] = useState<number[]>(Array(8).fill(0));
    const [message, setMessage] = useState<string>("");
    const [isWin, setIsWin] = useState<boolean>(false);

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = () => {
        // Random target between 1 and 255
        const newTarget = Math.floor(Math.random() * 255) + 1;
        setTarget(newTarget);
        setBits(Array(8).fill(0));
        setMessage("");
        setIsWin(false);
    };

    const toggleBit = (index: number) => {
        if (isWin) return;
        const newBits = [...bits];
        newBits[index] = newBits[index] === 0 ? 1 : 0;
        setBits(newBits);
    };

    const calculateCurrentValue = () => {
        return bits.reduce((acc, bit, index) => {
            return acc + (bit * Math.pow(2, index));
        }, 0);
    };

    const currentValue = calculateCurrentValue();

    useEffect(() => {
        if (target > 0 && currentValue === target && !isWin) {
            setMessage("SYSTEM HACKED! ACCESS GRANTED.");
            setIsWin(true);
            // Auto restart after 2 seconds
            setTimeout(() => {
               // startNewGame(); // Optional: Auto restart
            }, 2000);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentValue, target]);

    // Color logic for current value display
    let valueColorClass = 'text-cyber-accent';
    if (currentValue > target) valueColorClass = 'text-red-500';
    if (currentValue === target) valueColorClass = 'text-green-400';

    return (
        <div className="bg-gray-900/90 p-8 rounded-2xl border border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] backdrop-blur-xl w-full max-w-3xl animate-fade-in-up">
            <div className="text-center mb-8">
                <p className="text-gray-400 mb-2 font-heading tracking-widest">MỤC TIÊU</p>
                <div className="text-6xl font-black text-white tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] font-heading">
                    {target}
                </div>
            </div>
            
            <div className="flex justify-center items-end gap-1 sm:gap-3 mb-8 flex-wrap">
                {/* Render bits from 7 down to 0 (128 down to 1) */}
                {[...Array(8)].map((_, i) => {
                    const bitIndex = 7 - i; // Reverse index
                    const bitValue = Math.pow(2, bitIndex);
                    const isActive = bits[bitIndex] === 1;

                    return (
                        <div key={bitIndex} className="flex flex-col items-center gap-2">
                            <button 
                                onClick={() => toggleBit(bitIndex)}
                                className={`
                                    w-8 h-14 sm:w-12 sm:h-20 rounded border-2 font-bold text-xl transition-all duration-200
                                    ${isActive 
                                        ? 'bg-green-500 text-black border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.6)]' 
                                        : 'bg-gray-800 text-gray-500 border-gray-600 hover:border-green-400'}
                                `}
                            >
                                {bits[bitIndex]}
                            </button>
                            <span className="text-[10px] sm:text-xs text-gray-500 font-mono">{bitValue}</span>
                        </div>
                    );
                })}
            </div>

            <div className="text-center mb-6">
                <p className="text-gray-400 text-sm mb-1">GIÁ TRỊ HIỆN TẠI</p>
                <div className={`text-4xl font-bold ${valueColorClass} transition-colors font-heading`}>
                    {currentValue}
                </div>
            </div>

            <div className="text-center h-8 mb-4 font-bold text-green-400 font-heading tracking-wider">
                {message}
            </div>

            <div className="flex justify-center">
                <button 
                    onClick={startNewGame} 
                    className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold py-2 px-8 rounded-full shadow-lg transition-transform transform active:scale-95"
                >
                    <i className="fas fa-random mr-2"></i> Số Mới
                </button>
            </div>
        </div>
    );
};

export default BinaryHacker;