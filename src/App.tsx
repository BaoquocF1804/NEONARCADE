import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import GameCard from './components/GameCard';
import GameModal from './components/GameModal';
import Login from './pages/Login';
import UserInfo from './pages/UserInfo';
import Leaderboard from './pages/Leaderboard';
import { Game, GameType } from './types';

const GAMES: Game[] = [
    {
        id: GameType.TICTACTOE,
        title: "games.tictactoe.title",
        description: "games.tictactoe.desc",
        rating: 4.8,
        icon: "fas fa-hashtag",
        colorClass: "text-cyber-accent",
        gradientClass: "from-purple-900 to-indigo-900",
        isOnline: true
    },
    {
        id: GameType.BINARY,
        title: "games.binary.title",
        description: "games.binary.desc",
        rating: 4.9,
        icon: "fas fa-microchip",
        colorClass: "text-green-400",
        gradientClass: "from-green-900 to-emerald-900",
        isHot: true
    },
    {
        id: GameType.MEMORY,
        title: "games.memory.title",
        description: "games.memory.desc",
        rating: 4.9,
        icon: "fas fa-brain",
        colorClass: "text-green-400",
        gradientClass: "from-green-900 to-emerald-800",
        isComingSoon: true
    },
    {
        id: GameType.GAME2048,
        title: "games.game2048.title",
        description: "games.game2048.desc",
        rating: 4.9,
        icon: "fas fa-th",
        colorClass: "text-yellow-400",
        gradientClass: "from-yellow-900 to-orange-900",
        isNew: true
    },
    {
        id: GameType.LOGIC_GATES,
        title: "games.logicGates.title",
        description: "games.logicGates.desc",
        rating: 4.6,
        icon: "fas fa-project-diagram",
        colorClass: "text-cyan-400",
        gradientClass: "from-cyan-900 to-blue-900",
        isNew: true
    },
    {
        id: GameType.SHOOTER,
        title: "games.shooter.title",
        description: "games.shooter.desc",
        rating: 4.7,
        icon: "fas fa-rocket",
        colorClass: "text-blue-400",
        gradientClass: "from-blue-900 to-cyan-900",
        isComingSoon: true
    }
];

const Home: React.FC = () => {
    const [activeGame, setActiveGame] = useState<GameType | null>(null);

    const handleOpenGame = (game: Game) => {
        if (game.isComingSoon) {
            alert('Game này đang phát triển!');
            return;
        }
        setActiveGame(game.id);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseGame = () => {
        setActiveGame(null);
        document.body.style.overflow = 'auto';
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <Navbar />

            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1535295972055-1c762f4483e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#050b14] to-[#050b14]"></div>

                {/* Animated Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-accent/20 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-pink/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
            </div>

            <main className="flex-grow pt-20 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full min-h-screen flex flex-col">
                <Hero />

                {/* Filter/Category Bar */}
                <div className="flex flex-wrap gap-4 mb-8 justify-center md:justify-start" id="games-section">
                    <button className="px-6 py-2 rounded-full bg-cyber-accent text-black font-bold shadow-lg shadow-cyan-500/30 transition-transform transform hover:scale-105">
                        Tất cả
                    </button>
                    <button className="px-6 py-2 rounded-full glass-card hover:bg-gray-700 text-gray-300 transition-all hover:text-white">
                        Lập trình
                    </button>
                    <button className="px-6 py-2 rounded-full glass-card hover:bg-gray-700 text-gray-300 transition-all hover:text-white">
                        Hành động
                    </button>
                    <button className="px-6 py-2 rounded-full glass-card hover:bg-gray-700 text-gray-300 transition-all hover:text-white">
                        Trí tuệ
                    </button>
                    <button className="px-6 py-2 rounded-full glass-card hover:bg-gray-700 text-gray-300 transition-all hover:text-white">
                        Thể thao
                    </button>
                </div>

                {/* Game Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {GAMES.map((game) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            onClick={() => handleOpenGame(game)}
                        />
                    ))}
                </div>
            </main>

            <Footer />

            {/* Game Modal Overlay */}
            {activeGame && (
                <GameModal
                    gameType={activeGame}
                    onClose={handleCloseGame}
                />
            )}
        </div>
    );
};

import { ThemeProvider } from './context/ThemeContext';

// ...

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/profile" element={<UserInfo />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
};

export default App;