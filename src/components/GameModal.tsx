import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { GameType } from '../types';

import BinaryHacker from './games/BinaryHacker';
import Game2048 from './games/Game2048';
import LogicGates from './games/LogicGates';
import FlappyBird from './games/FlappyBird';
import SpaceShooter from './games/SpaceShooter';
import FlexboxDefense from './games/FlexboxDefense';
import Gomoku from './games/Gomoku';
import MemoryMatrix from './games/MemoryMatrix';

interface GameModalProps {
    gameType: GameType;
    onClose: () => void;
}

const GameModal: React.FC<GameModalProps> = ({ gameType, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const getGameTitle = (type: GameType) => {
        switch (type) {

            case GameType.BINARY:
                return 'games.binary.title';
            case GameType.MEMORY:
                return 'games.memory.title';
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
            case GameType.GOMOKU:
                return 'Neon Gomoku';
            default:
                return 'Game';
        }
    };

    return (
        <div className="fixed inset-0 z-50 w-full h-full bg-gray-900 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center p-4 border-b border-gray-800 bg-gray-900/50 relative shrink-0">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all duration-200 group z-10 border border-gray-700 hover:border-gray-500"
                >
                    <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                    <span className="font-bold">{t('common.backToList')}</span>
                </button>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        {t(getGameTitle(gameType))}
                    </h2>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 overflow-auto p-4 bg-gray-950 relative flex flex-col items-center">

                {gameType === GameType.BINARY && <BinaryHacker />}
                {gameType === GameType.MEMORY && <MemoryMatrix />}
                {gameType === GameType.GAME2048 && <Game2048 />}
                {gameType === GameType.LOGIC_GATES && <LogicGates />}
                {gameType === GameType.FLAPPY_BIRD && <FlappyBird />}
                {gameType === GameType.SHOOTER && <SpaceShooter />}
                {gameType === GameType.FLEXBOX_DEFENSE && <FlexboxDefense />}
                {gameType === GameType.GOMOKU && <Gomoku />}
            </div>
        </div>
    );
};

export default GameModal;