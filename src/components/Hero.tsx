import React from 'react';
import { useTranslation } from 'react-i18next';

const Hero: React.FC = () => {
    const { t } = useTranslation();

    const scrollToGames = () => {
        const gamesSection = document.getElementById('games-section');
        if (gamesSection) {
            gamesSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="relative rounded-2xl overflow-hidden mb-12 border border-gray-700 shadow-2xl group h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 pointer-events-none"></div>

            {/* Abstract Background for Hero */}
            <div
                className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')" }}
            >
            </div>

            <div className="absolute inset-0 z-20 flex flex-col justify-center items-start p-8 md:p-16 pointer-events-none">
                <span className="inline-block py-1 px-3 rounded-full bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/50 text-xs font-bold tracking-wider mb-4 font-heading">
                    {t('hero.newUpdate')}
                </span>
                <h1 className="text-4xl md:text-6xl font-heading font-black text-white dark:text-white mb-4 leading-tight">
                    {t('hero.welcome')} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent to-purple-500">NEON ARCADE</span>
                </h1>
                <p className="text-gray-300 dark:text-gray-300 max-w-lg mb-8 text-lg">
                    {t('hero.subtitle')}
                </p>
                <button
                    onClick={scrollToGames}
                    className="pointer-events-auto bg-white text-black hover:bg-cyber-accent hover:text-white font-heading font-bold py-3 px-8 rounded transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                    {t('common.playNow')} <i className="fas fa-play ml-2"></i>
                </button>
            </div>
        </div>
    );
};

export default Hero;