import React, { useState, useEffect } from 'react';

interface Level {
    id: number;
    name: string;
    inputs: number;
    gates: { type: 'AND' | 'OR' | 'NOT' | 'XOR', inputs: (number | string)[] }[];
    target: boolean;
}

const LEVELS: Level[] = [
    {
        id: 1,
        name: "Basic AND",
        inputs: 2,
        gates: [{ type: 'AND', inputs: [0, 1] }],
        target: true
    },
    {
        id: 2,
        name: "OR Gate",
        inputs: 2,
        gates: [{ type: 'OR', inputs: [0, 1] }],
        target: true
    },
    {
        id: 3,
        name: "Inverter (NOT)",
        inputs: 1,
        gates: [{ type: 'NOT', inputs: [0] }],
        target: false
    },
    {
        id: 4,
        name: "XOR Puzzle",
        inputs: 2,
        gates: [{ type: 'XOR', inputs: [0, 1] }],
        target: true
    },
    {
        id: 5,
        name: "Complex Circuit",
        inputs: 3,
        gates: [
            { type: 'AND', inputs: [0, 1] }, // Gate 0
            { type: 'OR', inputs: [2, 'g0'] as any } // Gate 1 (takes input 2 and output of Gate 0)
        ],
        target: true
    }
];

const LogicGates: React.FC = () => {
    const [currentLevel, setCurrentLevel] = useState(0);
    const [inputs, setInputs] = useState<boolean[]>([]);
    const [gateOutputs, setGateOutputs] = useState<boolean[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const level = LEVELS[currentLevel];

    useEffect(() => {
        setInputs(Array(level.inputs).fill(false));
        setIsComplete(false);
    }, [currentLevel]);

    useEffect(() => {
        evaluateCircuit();
    }, [inputs]);

    const evaluateCircuit = () => {
        const newGateOutputs: boolean[] = [];

        level.gates.forEach((gate, index) => {
            const gateInputs = gate.inputs.map(inputIndex => {
                if (typeof inputIndex === 'number') {
                    return inputs[inputIndex];
                } else if (typeof inputIndex === 'string' && inputIndex.startsWith('g')) {
                    const gateIdx = parseInt(inputIndex.substring(1));
                    return newGateOutputs[gateIdx];
                }
                return false;
            });

            let output = false;
            switch (gate.type) {
                case 'AND': output = gateInputs.every(i => i); break;
                case 'OR': output = gateInputs.some(i => i); break;
                case 'NOT': output = !gateInputs[0]; break;
                case 'XOR': output = gateInputs[0] !== gateInputs[1]; break;
            }
            newGateOutputs.push(output);
        });

        setGateOutputs(newGateOutputs);

        // Check win condition (last gate output matches target)
        const finalOutput = newGateOutputs[newGateOutputs.length - 1];
        if (finalOutput === level.target) {
            setIsComplete(true);
        } else {
            setIsComplete(false);
        }
    };

    const toggleInput = (index: number) => {
        const newInputs = [...inputs];
        newInputs[index] = !newInputs[index];
        setInputs(newInputs);
    };

    const nextLevel = () => {
        if (currentLevel < LEVELS.length - 1) {
            setCurrentLevel(prev => prev + 1);
        } else {
            alert("Congratulations! You completed all levels!");
            setCurrentLevel(0);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-4">
            <div className="flex justify-between w-full mb-6 items-center">
                <div>
                    <h2 className="text-cyber-accent font-heading text-2xl font-bold">{level.name}</h2>
                    <p className="text-gray-400 text-sm">Level {currentLevel + 1}/{LEVELS.length}</p>
                </div>
                <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                    <span className="text-gray-400 text-xs font-bold uppercase mr-2">Target Output:</span>
                    <span className={`font-bold ${level.target ? 'text-green-400' : 'text-red-400'}`}>
                        {level.target ? 'ON (1)' : 'OFF (0)'}
                    </span>
                </div>
            </div>

            <div className="relative bg-gray-900/80 p-8 rounded-xl border border-gray-700 shadow-2xl w-full min-h-[300px] flex items-center justify-between gap-8">
                {/* Inputs */}
                <div className="flex flex-col gap-6">
                    {inputs.map((isActive, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleInput(idx)}
                            className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${isActive
                                ? 'bg-green-500/20 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                                : 'bg-gray-800 border-gray-600 hover:border-gray-500'
                                }`}
                        >
                            <div className={`w-4 h-4 rounded-full ${isActive ? 'bg-green-400' : 'bg-gray-600'}`}></div>
                            <span className="ml-2 font-mono font-bold text-white">{isActive ? '1' : '0'}</span>
                        </button>
                    ))}
                </div>

                {/* Circuit Visualization (Simplified) */}
                <div className="flex-grow flex flex-col items-center justify-center gap-4">
                    {level.gates.map((gate, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-24 h-24 bg-gray-800 border border-cyber-accent rounded-lg flex flex-col items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                                <span className="text-cyber-accent font-bold text-xl">{gate.type}</span>
                                <div className="text-xs text-gray-500 mt-1">Gate {idx}</div>
                            </div>
                            {/* Connection Line */}
                            <div className={`h-1 w-8 transition-colors duration-300 ${gateOutputs[idx] ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-700'}`}></div>
                        </div>
                    ))}
                </div>

                {/* Output */}
                <div className="flex flex-col items-center justify-center">
                    <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${gateOutputs[gateOutputs.length - 1]
                        ? 'bg-yellow-400/20 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]'
                        : 'bg-gray-900 border-gray-700'
                        }`}>
                        <i className={`fas fa-lightbulb text-4xl ${gateOutputs[gateOutputs.length - 1] ? 'text-yellow-400' : 'text-gray-700'
                            }`}></i>
                    </div>
                    <span className="mt-2 font-mono text-gray-400">OUTPUT</span>
                </div>
            </div>

            {isComplete && (
                <div className="mt-8 animate-bounce">
                    <button
                        onClick={nextLevel}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-green-500/30 transition-all transform hover:scale-105"
                    >
                        NEXT LEVEL <i className="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LogicGates;
