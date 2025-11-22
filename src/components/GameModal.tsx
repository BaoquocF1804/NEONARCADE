import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameType } from '../types';
import TicTacToe from './games/TicTacToe';
import BinaryHacker from './games/BinaryHacker';
import Game2048 from './games/Game2048';
import LogicGates from './games/LogicGates';
import FlappyBird from './games/FlappyBird';
import SpaceShooter from './games/SpaceShooter';
import FlexboxDefense from './games/FlexboxDefense';

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
            case GameType.FLAPPY_BIRD:
                return 'games.flappyBird.title';
            case GameType.SHOOTER:
                return 'games.shooter.title';
            case GameType.FLEXBOX_DEFENSE:
                return 'games.flexboxDefense.title';
            default:
                return 'Game';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-6xl bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
                    <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        {t(getGameTitle(gameType))}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-800"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Game Area */}
                <div className="flex-1 overflow-auto p-4 bg-gray-950 relative">
                    {gameType === GameType.TICTACTOE && <TicTacToe />}
                    {gameType === GameType.BINARY && <BinaryHacker />}
                    {gameType === GameType.GAME2048 && <Game2048 />}
                    {gameType === GameType.LOGIC_GATES && <LogicGates />}
                    {gameType === GameType.FLAPPY_BIRD && <FlappyBird />}
                    {gameType === GameType.SHOOTER && <SpaceShooter />}
                    {gameType === GameType.FLEXBOX_DEFENSE && <FlexboxDefense />}
                </div>
            </div>
        </div>
    );
};

export default GameModal;