import React, { useState, useEffect, useCallback } from 'react';

type Grid = number[][];

const Game2048: React.FC = () => {
    const [grid, setGrid] = useState<Grid>(Array(4).fill(Array(4).fill(0)));
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);

    // Initialize game
    useEffect(() => {
        initializeGame();
    }, []);

    const initializeGame = () => {
        let newGrid = Array(4).fill(null).map(() => Array(4).fill(0));
        addRandomTile(newGrid);
        addRandomTile(newGrid);
        setGrid(newGrid);
        setScore(0);
        setGameOver(false);
        setWon(false);
    };

    const addRandomTile = (currentGrid: Grid) => {
        const emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (currentGrid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            currentGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
        }
    };

    const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (gameOver || won) return;

        let newGrid = grid.map(row => [...row]);
        let moved = false;
        let scoreToAdd = 0;

        const rotateGrid = (g: Grid) => g[0].map((val, index) => g.map(row => row[index]).reverse());
        const rotateGridCounter = (g: Grid) => g[0].map((val, index) => g.map(row => row[row.length - 1 - index]));

        if (direction === 'UP') newGrid = rotateGridCounter(newGrid);
        if (direction === 'DOWN') newGrid = rotateGrid(newGrid);
        if (direction === 'RIGHT') newGrid = newGrid.map(row => row.reverse());

        // Shift and Merge logic
        for (let r = 0; r < 4; r++) {
            let row = newGrid[r].filter(val => val !== 0);
            for (let c = 0; c < row.length - 1; c++) {
                if (row[c] === row[c + 1]) {
                    row[c] *= 2;
                    scoreToAdd += row[c];
                    row.splice(c + 1, 1);
                    if (row[c] === 2048) setWon(true);
                }
            }
            const newRow = [...row, ...Array(4 - row.length).fill(0)];
            if (JSON.stringify(newGrid[r]) !== JSON.stringify(newRow)) moved = true;
            newGrid[r] = newRow;
        }

        // Rotate back
        if (direction === 'UP') newGrid = rotateGrid(newGrid);
        if (direction === 'DOWN') newGrid = rotateGridCounter(newGrid);
        if (direction === 'RIGHT') newGrid = newGrid.map(row => row.reverse());

        if (moved) {
            addRandomTile(newGrid);
            setGrid(newGrid);
            setScore(prev => prev + scoreToAdd);
            checkGameOver(newGrid);
        }
    }, [grid, gameOver, won]);

    const checkGameOver = (currentGrid: Grid) => {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (currentGrid[r][c] === 0) return;
                if (c < 3 && currentGrid[r][c] === currentGrid[r][c + 1]) return;
                if (r < 3 && currentGrid[r][c] === currentGrid[r + 1][c]) return;
            }
        }
        setGameOver(true);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp': move('UP'); break;
                case 'ArrowDown': move('DOWN'); break;
                case 'ArrowLeft': move('LEFT'); break;
                case 'ArrowRight': move('RIGHT'); break;
                default: return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [move]);

    const getTileColor = (value: number) => {
        const colors: { [key: number]: string } = {
            2: 'bg-gray-200 text-gray-800',
            4: 'bg-gray-300 text-gray-800',
            8: 'bg-orange-200 text-white',
            16: 'bg-orange-400 text-white',
            32: 'bg-orange-500 text-white',
            64: 'bg-orange-600 text-white',
            128: 'bg-yellow-400 text-white shadow-[0_0_10px_#facc15]',
            256: 'bg-yellow-500 text-white shadow-[0_0_15px_#eab308]',
            512: 'bg-yellow-600 text-white shadow-[0_0_20px_#ca8a04]',
            1024: 'bg-yellow-700 text-white shadow-[0_0_25px_#a16207]',
            2048: 'bg-yellow-800 text-white shadow-[0_0_30px_#854d0e]',
        };
        return colors[value] || 'bg-gray-900 text-white';
    };

    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto p-4">
            <div className="flex justify-between w-full mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs font-bold uppercase">Score</div>
                    <div className="text-white text-2xl font-bold">{score}</div>
                </div>
                <button
                    onClick={initializeGame}
                    className="bg-cyber-accent hover:bg-cyber-accent/80 text-black font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    New Game
                </button>
            </div>

            <div className="relative bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-2xl">
                <div className="grid grid-cols-4 gap-3">
                    {grid.map((row, r) => (
                        row.map((value, c) => (
                            <div
                                key={`${r}-${c}`}
                                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 transform ${getTileColor(value)}`}
                            >
                                {value !== 0 && value}
                            </div>
                        ))
                    ))}
                </div>

                {(gameOver || won) && (
                    <div className="absolute inset-0 bg-black/80 rounded-xl flex flex-col items-center justify-center animate-fade-in z-10">
                        <h2 className={`text-4xl font-bold mb-4 ${won ? 'text-yellow-400' : 'text-red-500'}`}>
                            {won ? 'YOU WIN!' : 'GAME OVER'}
                        </h2>
                        <button
                            onClick={initializeGame}
                            className="bg-white text-black font-bold py-3 px-8 rounded-full hover:scale-105 transition-transform"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-6 text-gray-400 text-sm text-center">
                Use <span className="font-bold text-white">Arrow Keys</span> to move tiles
            </div>
        </div>
    );
};

export default Game2048;
