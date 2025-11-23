import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';

// Mock Data Interfaces
interface UserStats {
    totalGames: number;
    rank: string;
    highScores: {
        [key: string]: number;
    };
}

interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    unlocked: boolean;
}

interface MatchHistory {
    id: string;
    game: string;
    score: number;
    result: 'Win' | 'Loss' | 'Complete' | 'Top 1';
    date: string;
}

const UserInfo: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<UserStats>({
        totalGames: 0,
        rank: 'Bronze I',
        highScores: {}
    });
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Mock Data
    const level = 15;
    const currentExp = 750;
    const maxExp = 1000;
    const title = "Cyber Punk";
    const bio = "Coding is life, bug is wife. 🐛";
    const currency = 1250;

    const badges: Badge[] = [
        { id: '1', name: 'Binary Beast', icon: '👾', description: 'Complete Binary Hacker Hard Mode', unlocked: true },
        { id: '2', name: 'Flexbox God', icon: '🎨', description: 'Perfect score in Flexbox Defense', unlocked: true },
        { id: '3', name: 'Speed Demon', icon: '⚡', description: 'Reach 2000 score in Space Shooter', unlocked: false },
        { id: '4', name: 'Puzzle Master', icon: '🧩', description: 'Solve 50 puzzles', unlocked: true },
    ];

    const history: MatchHistory[] = [
        { id: '1', game: 'Binary Hacker', score: 500, result: 'Complete', date: '2 minutes ago' },
        { id: '2', game: 'Neon 2048', score: 2048, result: 'Win', date: 'Yesterday' },
        { id: '3', game: 'Space Shooter', score: 1500, result: 'Loss', date: '2 days ago' },
        { id: '4', game: 'Flappy Bird', score: 42, result: 'Loss', date: '3 days ago' },
    ];

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser || storedUser === 'undefined') {
            if (storedUser === 'undefined') localStorage.removeItem('user');
            navigate('/login');
            return;
        }

        try {
            setUser(JSON.parse(storedUser));
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('user');
            navigate('/login');
            return;
        }

        // Load High Scores from LocalStorage
        const scores = {
            '2048': parseInt(localStorage.getItem('cyber2048_best') || '0'),
            'Flappy': parseInt(localStorage.getItem('neonFlappyHighScore') || '0'),
            'Shooter': parseInt(localStorage.getItem('neonShooterHighScore') || '0'),
            'Binary': 0 // Not stored in LS yet based on previous file read
        };

        setStats({
            totalGames: 142, // Mock
            rank: 'Gold II', // Mock
            highScores: scores
        });

    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#050b14] text-white font-body relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2076&auto=format&fit=crop')] bg-cover bg-center opacity-20 fixed"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050b14]/80 to-[#050b14] fixed"></div>

            <Navbar />

            <div className="relative z-10 pt-24 px-4 pb-12 max-w-6xl mx-auto">

                {/* Profile Header Card */}
                <div className="glass-card p-0 rounded-2xl overflow-hidden mb-8 animate-fade-in border border-gray-800">
                    {/* Banner */}
                    <div className="h-48 bg-gradient-to-r from-purple-900 to-blue-900 relative">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                        <button
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md transition-all border border-white/10"
                        >
                            <i className="fas fa-pen mr-2"></i> Edit Profile
                        </button>
                    </div>

                    <div className="px-8 pb-8 relative">
                        {/* Avatar & Basic Info */}
                        <div className="flex flex-col md:flex-row gap-6 items-start -mt-16">

                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyber-accent to-purple-600 p-1 shadow-[0_0_20px_rgba(0,243,255,0.5)]">
                                    <div className="w-full h-full bg-gray-900 rounded-xl flex items-center justify-center text-4xl font-bold overflow-hidden relative">
                                        {/* Placeholder Avatar Image or Initials */}
                                        <span className="z-10">{user.username.charAt(0).toUpperCase()}</span>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10"></div>
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 -right-3 bg-gray-900 text-cyber-accent text-xs font-bold px-2 py-1 rounded border border-cyber-accent">
                                    LVL {level}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 pt-16 md:pt-0 mt-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
                                            {user.username}
                                            <span className="text-sm bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/50 font-mono">
                                                {title}
                                            </span>
                                        </h1>
                                        <p className="text-gray-400 mt-1 flex items-center gap-2 text-sm">
                                            <i className="fas fa-envelope"></i> {user.email}
                                            <span className="text-gray-600">|</span>
                                            <i className="fas fa-calendar-alt"></i> Joined {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Social Links */}
                                    <div className="flex gap-3">
                                        <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#333] hover:text-white transition-colors border border-gray-700">
                                            <i className="fab fa-github text-xl"></i>
                                        </a>
                                        <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#5865F2] hover:text-white transition-colors border border-gray-700">
                                            <i className="fab fa-discord text-xl"></i>
                                        </a>
                                        <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-colors border border-gray-700">
                                            <i className="fab fa-twitter text-xl"></i>
                                        </a>
                                    </div>
                                </div>

                                {/* Bio */}
                                <p className="mt-4 text-gray-300 italic border-l-2 border-cyber-accent pl-4">
                                    "{bio}"
                                </p>

                                {/* XP Bar */}
                                <div className="mt-6 max-w-xl">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-cyber-accent">XP PROGRESS</span>
                                        <span className="text-gray-400">{currentExp} / {maxExp}</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyber-accent to-purple-500 shadow-[0_0_10px_#00f3ff]"
                                            style={{ width: `${(currentExp / maxExp) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Currency / Assets */}
                            <div className="hidden md:flex flex-col items-end gap-2 mt-2">
                                <div className="bg-gray-900/80 border border-yellow-500/30 px-4 py-2 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                                    <i className="fas fa-coins text-yellow-400"></i>
                                    <span className="font-bold text-yellow-100">{currency} NC</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2 mt-2 px-3 py-1 rounded hover:bg-red-500/10 transition-colors"
                                >
                                    <i className="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Stats & Badges */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="glass-card p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:border-cyber-accent/50 transition-colors group">
                                <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-trophy text-2xl"></i>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats.rank}</div>
                                <div className="text-xs text-gray-400 uppercase tracking-widest">Current Rank</div>
                            </div>
                            <div className="glass-card p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:border-cyber-accent/50 transition-colors group">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-gamepad text-2xl"></i>
                                </div>
                                <div className="text-2xl font-bold text-white">{stats.totalGames}</div>
                                <div className="text-xs text-gray-400 uppercase tracking-widest">Games Played</div>
                            </div>
                            <div className="glass-card p-6 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-2 hover:border-cyber-accent/50 transition-colors group">
                                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                    <i className="fas fa-star text-2xl"></i>
                                </div>
                                <div className="text-2xl font-bold text-white">
                                    {Object.values(stats.highScores).reduce((a, b) => a + b, 0)}
                                </div>
                                <div className="text-xs text-gray-400 uppercase tracking-widest">Total Score</div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="glass-card p-6 rounded-xl border border-gray-800">
                            <h3 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                                <i className="fas fa-medal text-cyber-accent"></i> Badges & Achievements
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {badges.map(badge => (
                                    <div key={badge.id} className={`p-4 rounded-lg border ${badge.unlocked ? 'bg-gray-800/50 border-gray-700 hover:border-cyber-accent' : 'bg-gray-900/30 border-gray-800 opacity-50'} transition-all flex flex-col items-center text-center gap-2 group`}>
                                        <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">{badge.icon}</div>
                                        <div className="font-bold text-sm text-white">{badge.name}</div>
                                        <div className="text-xs text-gray-500 hidden group-hover:block">{badge.description}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* High Scores Detail */}
                        <div className="glass-card p-6 rounded-xl border border-gray-800">
                            <h3 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                                <i className="fas fa-chart-bar text-pink-500"></i> High Scores
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(stats.highScores).map(([game, score]) => (
                                    <div key={game} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                        <span className="font-bold text-gray-300">{game}</span>
                                        <span className="font-mono text-cyber-accent text-lg">{score}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="space-y-8">
                        <div className="glass-card p-6 rounded-xl border border-gray-800 h-full">
                            <h3 className="text-xl font-heading font-bold mb-6 flex items-center gap-2">
                                <i className="fas fa-history text-green-400"></i> Recent Activity
                            </h3>
                            <div className="space-y-4 relative">
                                {/* Timeline Line */}
                                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-800"></div>

                                {history.map((match) => (
                                    <div key={match.id} className="relative pl-8 pb-4">
                                        {/* Timeline Dot */}
                                        <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 ${match.result === 'Win' || match.result === 'Complete' || match.result === 'Top 1'
                                                ? 'bg-green-500 border-green-900 shadow-[0_0_10px_#00ff66]'
                                                : 'bg-red-500 border-red-900'
                                            }`}></div>

                                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 hover:bg-gray-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-white">{match.game}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${match.result === 'Win' || match.result === 'Complete' || match.result === 'Top 1'
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-red-500/20 text-red-400'
                                                    }`}>{match.result}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm text-gray-400">Score: <span className="text-white">{match.score}</span></span>
                                                <span className="text-xs text-gray-600">{match.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-4 py-2 text-sm text-gray-500 hover:text-white transition-colors border border-transparent hover:border-gray-700 rounded">
                                View Full History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfo;
