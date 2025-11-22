import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useTranslation } from 'react-i18next';

interface LeaderboardEntry {
    rank: number;
    username: string;
    score: number;
    game: string;
    avatar: string;
}

const Leaderboard: React.FC = () => {
    const { t } = useTranslation();
    const [selectedGame, setSelectedGame] = React.useState<string>('all');

    // Mock data for leaderboard
    const leaderboardData: LeaderboardEntry[] = [
        { rank: 1, username: "CyberKing", score: 9999, game: "games.game2048.title", avatar: "C" },
        { rank: 2, username: "PixelMaster", score: 8888, game: "games.shooter.title", avatar: "P" },
        { rank: 3, username: "LogicWizard", score: 7777, game: "games.logicGates.title", avatar: "L" },
        { rank: 4, username: "RetroGamer", score: 6666, game: "games.game2048.title", avatar: "R" },
        { rank: 5, username: "CodeNinja", score: 5555, game: "games.binary.title", avatar: "N" },
        { rank: 6, username: "SynthWave", score: 4900, game: "games.shooter.title", avatar: "S" },
        { rank: 7, username: "ByteCode", score: 4200, game: "games.binary.title", avatar: "B" },
        { rank: 8, username: "LaserBeam", score: 3800, game: "games.memory.title", avatar: "L" },
        { rank: 9, username: "VoidWalker", score: 3100, game: "games.tictactoe.title", avatar: "V" },
        { rank: 10, username: "DataMiner", score: 2500, game: "games.shooter.title", avatar: "D" },
    ];

    // Get unique games for filter
    const games = Array.from(new Set(leaderboardData.map(entry => entry.game)));

    // Filter data
    const filteredData = selectedGame === 'all'
        ? leaderboardData
        : leaderboardData.filter(entry => entry.game === selectedGame);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-cyber-dark text-white font-body">
            <Navbar />

            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyber-accent/5 rounded-full blur-3xl animate-pulse-slow"></div>
            </div>

            <main className="flex-grow relative z-10 px-4 pt-24 pb-12 max-w-6xl mx-auto w-full">
                <div className="text-center mb-12">
                    <h1 className="font-heading text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent to-cyber-pink mb-4 animate-float">
                        {t('leaderboard.title')}
                    </h1>
                    <p className="text-gray-400 text-lg">Top players dominating the Neon Arcade</p>
                </div>

                {/* Filter Controls */}
                <div className="mb-8 flex justify-center">
                    <div className="bg-gray-900/80 backdrop-blur-md p-2 rounded-xl border border-white/10 flex flex-wrap gap-2 justify-center">
                        <button
                            onClick={() => setSelectedGame('all')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 ${selectedGame === 'all'
                                    ? 'bg-cyber-accent text-black shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            All Games
                        </button>
                        {games.map(game => (
                            <button
                                key={game}
                                onClick={() => setSelectedGame(game)}
                                className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 ${selectedGame === game
                                        ? 'bg-cyber-accent text-black shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {t(game)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-6 bg-gray-900/50 border-b border-gray-800 font-heading text-cyber-accent font-bold tracking-wider">
                        <div className="col-span-2 md:col-span-1 text-center">{t('leaderboard.rank')}</div>
                        <div className="col-span-6 md:col-span-5">{t('leaderboard.player')}</div>
                        <div className="col-span-4 md:col-span-3 text-right">{t('leaderboard.score')}</div>
                        <div className="hidden md:block md:col-span-3 text-right">{t('leaderboard.game')}</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-gray-800">
                        {filteredData.length > 0 ? (
                            filteredData.map((entry) => (
                                <div
                                    key={entry.rank}
                                    className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/5 transition-colors group"
                                >
                                    <div className="col-span-2 md:col-span-1 flex justify-center">
                                        {entry.rank <= 3 ? (
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-black shadow-lg ${entry.rank === 1 ? 'bg-yellow-400 shadow-yellow-500/50' :
                                                entry.rank === 2 ? 'bg-gray-300 shadow-gray-400/50' :
                                                    'bg-amber-600 shadow-amber-700/50'
                                                }`}>
                                                {entry.rank}
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 font-bold text-xl">#{entry.rank}</span>
                                        )}
                                    </div>

                                    <div className="col-span-6 md:col-span-5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center font-bold text-white border border-gray-600 group-hover:border-cyber-accent transition-colors">
                                            {entry.avatar}
                                        </div>
                                        <span className="font-bold text-white group-hover:text-cyber-accent transition-colors">
                                            {entry.username}
                                        </span>
                                    </div>

                                    <div className="col-span-4 md:col-span-3 text-right font-mono text-xl text-cyber-pink font-bold">
                                        {entry.score.toLocaleString()}
                                    </div>

                                    <div className="hidden md:block md:col-span-3 text-right text-gray-400 text-sm">
                                        {t(entry.game)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No scores found for this game.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Leaderboard;
