import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameType } from '../types';
import TicTacToe from './games/TicTacToe';
import BinaryHacker from './games/BinaryHacker';
import Game2048 from './games/Game2048';
import LogicGates from './games/LogicGates';

interface GameModalProps {
    gameType: GameType;
    onClose: () => void;
}

const GameModal: React.FC<GameModalProps> = ({ gameType, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const getGameTitle = (type: GameType) => {
        switch (type) {
            case GameType.TICTACTOE:
                return 'games.tictactoe.title';
            case GameType.BINARY:
                return 'games.binary.title';
            case GameType.GAME2048:
                return 'games.game2048.title';
            case GameType.LOGIC_GATES:
                return 'games.logicGates.title';
            default:
                return 'Game';
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] bg-cyber-dark flex flex-col animate-fade-in"
        >
            {/* Header */}
            <div className="h-16 border-b border-gray-800 bg-gray-900 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <i className="fas fa-arrow-left text-xl"></i>
                        <span className="hidden sm:inline">Quay lại</span>
                    </button>
                    <h2 className="text-xl font-heading font-bold text-cyber-accent">{t(getGameTitle(gameType))}</h2>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-sm hidden sm:inline">
                        <i className="fas fa-trophy text-yellow-500 mr-1"></i> Điểm cao: <span>0</span>
                    </span>
                    <button onClick={toggleFullScreen} className="text-gray-400 hover:text-white">
                        <i className="fas fa-expand text-lg"></i>
                    </button>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-grow flex items-center justify-center bg-black/50 relative overflow-hidden p-4">
                {/* Background Decoration */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <i className="fas fa-gamepad text-[20rem] text-white"></i>
                </div>

                {/* Specific Game Component */}
                {gameType === GameType.TICTACTOE && <TicTacToe />}
                {gameType === GameType.BINARY && <BinaryHacker />}
                {gameType === GameType.GAME2048 && <Game2048 />}
                {gameType === GameType.LOGIC_GATES && <LogicGates />}
            </div>
        </div>
    );
};

export default GameModal;