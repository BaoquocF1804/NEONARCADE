import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'vi' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <nav className="fixed w-full z-50 glass-card border-b border-gray-800 dark:border-gray-800 border-gray-200 bg-white/10 dark:bg-gray-900/50 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2 animate-float">
                        <i className="fas fa-gamepad text-3xl text-cyber-accent"></i>
                        <span className="font-heading text-2xl font-bold tracking-wider text-gray-900 dark:text-white">
                            NEON<span className="text-cyber-pink">ARCADE</span>
                        </span>
                    </Link>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-cyber-accent bg-gray-100/50 dark:bg-gray-900/50 transition-colors">{t('navbar.home')}</Link>
                            <Link to="/leaderboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-cyber-pink transition-colors">{t('navbar.leaderboard')}</Link>
                            <a href="#" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-cyber-pink transition-colors">{t('navbar.community')}</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors font-bold text-xs flex items-center justify-center border border-gray-300 dark:border-gray-600"
                            title="Switch Language"
                        >
                            {i18n.language === 'en' ? 'VI' : 'EN'}
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-yellow-400 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
                        </button>

                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link to="/profile" className="flex items-center gap-2 text-gray-900 dark:text-white hover:text-cyber-accent transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyber-accent to-blue-600 flex items-center justify-center font-bold text-sm text-white">
                                        {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <span className="hidden sm:block">{user.username}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    title={t('navbar.logout')}
                                >
                                    <i className="fas fa-sign-out-alt"></i>
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="bg-gradient-to-r from-cyber-accent to-blue-600 hover:from-cyber-pink hover:to-purple-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/50 flex items-center">
                                <i className="fas fa-user-astronaut mr-2"></i> {t('navbar.login')}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;