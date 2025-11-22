import React from 'react';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-white/5 dark:bg-black/40 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <i className="fas fa-gamepad text-3xl text-cyber-accent"></i>
                            <span className="font-heading text-2xl font-bold tracking-wider text-gray-900 dark:text-white">
                                NEON<span className="text-cyber-pink">ARCADE</span>
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
                            {t('footer.desc')}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-gray-900 dark:text-white font-bold mb-4 uppercase tracking-wider">{t('footer.links')}</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-cyber-accent transition-colors">{t('footer.about')}</a></li>
                            <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-cyber-accent transition-colors">{t('footer.terms')}</a></li>
                            <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-cyber-accent transition-colors">{t('footer.privacy')}</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-gray-900 dark:text-white font-bold mb-4 uppercase tracking-wider">{t('footer.connect')}</h4>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-cyber-accent hover:text-black transition-all">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-cyber-pink hover:text-white transition-all">
                                <i className="fab fa-discord"></i>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-purple-500 hover:text-white transition-all">
                                <i className="fab fa-github"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 text-center text-gray-500 dark:text-gray-500 text-sm">
                    &copy; 2024 Neon Arcade. {t('footer.rights')}
                </div>
            </div>
        </footer>
    );
};

export default Footer;