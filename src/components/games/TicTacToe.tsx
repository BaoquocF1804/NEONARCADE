import React, { useState, useEffect } from 'react';

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const TicTacToe: React.FC = () => {
    const [board, setBoard] = useState<string[]>(Array(9).fill(""));
    const [isXNext, setIsXNext] = useState<boolean>(true);
    const [gameActive, setGameActive] = useState<boolean>(true);
    const [winner, setWinner] = useState<string | null>(null);
    const [winningLine, setWinningLine] = useState<number[]>([]);

    useEffect(() => {
        checkWinner();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [board]);

    const checkWinner = () => {
        let roundWon = false;
        let winningCondition: number[] = [];

        for (let i = 0; i <= 7; i++) {
            const winCondition = winningConditions[i];
            const a = board[winCondition[0]];
            const b = board[winCondition[1]];
            const c = board[winCondition[2]];

            if (a === '' || b === '' || c === '') {
                continue;
            }
            if (a === b && b === c) {
                roundWon = true;
                winningCondition = winCondition;
                break;
            }
        }

        if (roundWon) {
            setWinner(isXNext ? 'O' : 'X'); // Inverse because state flipped after click but before check
            setGameActive(false);
            setWinningLine(winningCondition);
            return;
        }

        if (!board.includes("")) {
            setWinner("Draw");
            setGameActive(false);
        }
    };

    const handleClick = (index: number) => {
        if (board[index] !== "" || !gameActive) return;

        const newBoard = [...board];
        newBoard[index] = isXNext ? "X" : "O";
        setBoard(newBoard);
        setIsXNext(!isXNext);
    };

    const resetGame = () => {
        setBoard(Array(9).fill(""));
        setIsXNext(true);
        setGameActive(true);
        setWinner(null);
        setWinningLine([]);
    };

    // Correct turn display logic (since isXNext flips immediately after click)
    // If game is over, use winner. If not, use isXNext.
    const currentPlayer = isXNext ? "X" : "O";

    let statusMessage;
    if (winner === "Draw") {
        statusMessage = <span className="text-gray-300">Hòa nhau rồi! 🤝</span>;
    } else if (winner) {
        statusMessage = (
            <>
                Người chơi <span className={winner === 'X' ? 'text-cyber-accent' : 'text-cyber-pink'}>{winner}</span> Thắng! 🎉
            </>
        );
    } else {
        statusMessage = (
            <>
                Lượt của <span className={currentPlayer === 'X' ? 'text-cyber-accent' : 'text-cyber-pink'}>{currentPlayer}</span>
            </>
        );
    }

    return (
        <div className="h-full flex items-center justify-center">
            <div className="bg-gray-900/90 p-8 rounded-2xl border border-cyber-pink shadow-[0_0_30px_rgba(217,70,239,0.3)] backdrop-blur-xl animate-fade-in-up">
                <div className="flex justify-between mb-6 text-white font-heading text-xl font-bold text-center w-full">
                    <div className="w-full">{statusMessage}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    {board.map((cell, index) => {
                        const isWinningCell = winningLine.includes(index);
                        const cellStyle = isWinningCell
                            ? { backgroundColor: 'rgba(6, 182, 212, 0.3)', borderColor: '#06b6d4' }
                            : {};

                        const textColor = cell === 'X' ? 'text-cyber-accent shadow-[0_0_10px_#06b6d4]' : 'text-cyber-pink shadow-[0_0_10px_#d946ef]';

                        return (
                            <div
                                key={index}
                                onClick={() => handleClick(index)}
                                className={`
                                    w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center 
                                    text-4xl sm:text-5xl font-bold cursor-pointer 
                                    bg-white/5 border-2 border-slate-700 transition-all duration-200
                                    hover:bg-white/10 hover:border-cyber-accent font-heading
                                    ${cell ? textColor : ''}
                                `}
                                style={cellStyle}
                            >
                                {cell}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={resetGame}
                        className="bg-gradient-to-r from-purple-600 to-cyber-pink hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-transform transform active:scale-95"
                    >
                        <i className="fas fa-redo mr-2"></i> Chơi Lại
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TicTacToe;