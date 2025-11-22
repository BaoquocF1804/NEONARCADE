import React from 'react';
import { Game } from '../types';
import { useTranslation } from 'react-i18next';

interface GameCardProps {
    game: Game;
    onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
    const { t } = useTranslation();

    return (
        <div
            onClick={onClick}
            className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-cyber-accent transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer transform hover:-translate-y-2"
        >
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${game.gradientClass} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>

            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-2xl ${game.colorClass} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <i className={game.icon}></i>
                    </div>
                    {game.rating && (
                        <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full text-xs font-bold">
                            <i className="fas fa-star"></i> {game.rating}
                        </div>
                    )}
                </div>

                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white group-hover:text-cyber-accent transition-colors">{t(game.title)}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{t(game.description)}</p>

                <div className="flex flex-wrap gap-2">
                    {game.isNew && <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30">{t('common.new')}</span>}
                    {game.isHot && <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30">{t('common.hot')}</span>}
                    {game.isOnline && <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">{t('common.online')}</span>}
                    {game.isComingSoon && <span className="px-2 py-1 rounded text-xs font-bold bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30">{t('common.soon')}</span>}
                </div>
            </div>
        </div>
    );
};

export default GameCard;