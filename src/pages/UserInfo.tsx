import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';

const UserInfo: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-cyber-dark text-white font-body bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-fixed">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <Navbar />

            <div className="relative z-10 pt-24 px-4 max-w-4xl mx-auto">
                <div className="glass-card p-8 rounded-2xl animate-float">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-cyber-accent to-blue-600 flex items-center justify-center text-4xl font-bold shadow-lg shadow-cyan-500/50">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-heading font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent to-cyber-pink">
                                {t('profile.title')}
                            </h2>
                            <div className="space-y-2 text-gray-300">
                                <p><span className="text-cyber-accent font-bold">{t('profile.username')}:</span> {user.username}</p>
                                <p><span className="text-cyber-accent font-bold">{t('profile.email')}:</span> {user.email}</p>
                                <p><span className="text-cyber-accent font-bold">{t('profile.joined')}:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="mt-6 px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-all duration-300"
                            >
                                {t('profile.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;
