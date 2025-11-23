import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            let data;
            if (isLogin) {
                data = await api.login(email, password);
                localStorage.setItem('token', data.token);
                // Backend returns user in 'result' field
                localStorage.setItem('user', JSON.stringify(data.result));
                navigate('/');
                window.location.reload();
            } else {
                if (password !== confirmPassword) {
                    setError('Mật khẩu không khớp');
                    return;
                }
                await api.register(username, email, password);
                setIsLogin(true);
                setError('Đăng ký thành công! Vui lòng đăng nhập.');
                // Clear form fields
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra');
        }
    };

    return (
        <div className="min-h-screen bg-cyber-dark text-white font-body bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-fixed">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            <Navbar />

            <div className="relative z-10 flex items-center justify-center min-h-screen pt-16 px-4">
                <div className="w-full max-w-md glass-card p-8 rounded-2xl animate-float">
                    <h2 className="text-3xl font-heading font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent to-cyber-pink">
                        {isLogin ? t('login.loginTitle') : t('login.registerTitle')}
                    </h2>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-2 rounded mb-4 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-2">{t('login.username')}</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all"
                                    placeholder={t('login.username')}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2">{t('login.email')}</label>
                            <input
                                type="email"
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all"
                                placeholder={t('login.email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm font-bold mb-2">{t('login.password')}</label>
                            <input
                                type="password"
                                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all"
                                placeholder={t('login.password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-gray-400 text-sm font-bold mb-2">{t('login.confirmPassword')}</label>
                                <input
                                    type="password"
                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all"
                                    placeholder={t('login.confirmPassword')}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-cyber-accent to-blue-600 hover:from-cyber-pink hover:to-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-cyan-500/50"
                        >
                            {isLogin ? t('login.submitLogin') : t('login.submitRegister')}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            {isLogin ? t('login.noAccount') : t('login.haveAccount')} {' '}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-cyber-accent hover:text-cyber-pink font-bold transition-colors"
                            >
                                {isLogin ? t('login.registerNow') : t('login.loginNow')}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
