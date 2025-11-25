import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
    ArrowLeft, RefreshCw, Trophy, RotateCcw, X, Circle, Cpu, Users, Globe, Copy, Check, Clock, Menu as MenuIcon
} from 'lucide-react';

// --- CONSTANTS & UTILS ---
const BOARD_SIZE = 15;
const WIN_STREAK = 5;
const TURN_TIME = 30;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    || (window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`);

const checkWinner = (board: (string | null)[], size = BOARD_SIZE) => {
    const directions = [
        [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = board[r * size + c];
            if (!cell) continue;

            for (let [dr, dc] of directions) {
                let count = 1;
                let winCells = [r * size + c];

                for (let i = 1; i < WIN_STREAK; i++) {
                    const nr = r + dr * i;
                    const nc = c + dc * i;
                    if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
                    if (board[nr * size + nc] === cell) {
                        count++;
                        winCells.push(nr * size + nc);
                    } else break;
                }

                if (count >= WIN_STREAK) return { winner: cell, line: winCells };
            }
        }
    }
    if (!board.includes(null)) return { winner: 'draw', line: [] };
    return null;
};

// --- AI LOGIC ---
const getBestMove = (board: (string | null)[]) => {
    const size = BOARD_SIZE;
    const emptyCells: number[] = [];
    board.forEach((cell, idx) => {
        if (!cell) emptyCells.push(idx);
    });

    if (emptyCells.length === 0) return -1;
    if (emptyCells.length === size * size) return Math.floor((size * size) / 2);

    const evaluatePos = (idx: number, player: string) => {
        const r = Math.floor(idx / size);
        const c = idx % size;
        let score = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (let [dr, dc] of directions) {
            let count = 0;
            let openEnds = 0;

            for (let i = 1; i < 5; i++) {
                const nr = r + dr * i;
                const nc = c + dc * i;
                if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
                if (board[nr * size + nc] === player) count++;
                else if (board[nr * size + nc] === null) { openEnds++; break; }
                else break;
            }
            for (let i = 1; i < 5; i++) {
                const nr = r - dr * i;
                const nc = c - dc * i;
                if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
                if (board[nr * size + nc] === player) count++;
                else if (board[nr * size + nc] === null) { openEnds++; break; }
                else break;
            }

            if (count >= 4) score += 100000;
            else if (count === 3 && openEnds > 0) score += 1000;
            else if (count === 2 && openEnds === 2) score += 100;
            else if (count === 1 && openEnds === 2) score += 10;
        }
        return score;
    };

    let bestMove = emptyCells[0];
    let maxScore = -1;

    for (let idx of emptyCells) {
        let attackScore = evaluatePos(idx, 'O');
        let defenseScore = evaluatePos(idx, 'X');
        let currentScore = attackScore * 1.2 + defenseScore;

        if (currentScore > maxScore) {
            maxScore = currentScore;
            bestMove = idx;
        }
    }
    return bestMove;
};

// --- SUB-COMPONENTS ---

const GameStatus = ({ isXNext, winner, onReset, onUndo, canUndo, timeLeft, mode, onlineStatus, roomId, mySide, onMenu, onlineMessage }) => {
    const [isCopied, setIsCopied] = useState(false);

    const copyRoomId = () => {
        if (!roomId) return;
        navigator.clipboard.writeText(roomId);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex flex-col gap-4 mb-4 z-20 w-full max-w-[450px]">
            {/* Main Status Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 bg-slate-900/80 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-xl">

                {/* Menu Button */}
                <button
                    onClick={onMenu}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-sm font-medium border border-slate-700"
                >
                    <MenuIcon size={16} />
                    <span className="hidden sm:inline">Menu</span>
                </button>

                <div className="h-6 w-[1px] bg-slate-700 hidden sm:block"></div>

                {/* Player X */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${isXNext && !winner ? 'bg-cyan-900/30 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'opacity-50 grayscale'}`}>
                    <X className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,1)]" strokeWidth={3} size={18} />
                    <span className="text-slate-200 font-medium text-xs sm:text-sm">
                        {mode === 'bot' ? 'Bạn (X)' : 'X'}
                    </span>
                </div>

                {/* Timer */}
                {!winner && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg font-mono font-bold text-lg ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-300'}`}>
                        <Clock size={16} />
                        <span>{timeLeft}s</span>
                    </div>
                )}

                {/* Player O */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 ${!isXNext && !winner ? 'bg-fuchsia-900/30 border border-fuchsia-500/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'opacity-50 grayscale'}`}>
                    <Circle className="text-fuchsia-500 drop-shadow-[0_0_5px_rgba(236,72,153,1)]" strokeWidth={3} size={18} />
                    <span className="text-slate-200 font-medium text-xs sm:text-sm">
                        {mode === 'bot' ? 'Máy (O)' : 'O'}
                    </span>
                </div>

                <div className="h-6 w-[1px] bg-slate-700 hidden sm:block"></div>

                <div className="flex gap-2">
                    {/* Undo */}
                    {(mode === 'local' || mode === 'bot') && !winner && (
                        <button
                            onClick={onUndo}
                            disabled={!canUndo}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-yellow-400 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700"
                            title="Undo"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}

                    {/* Reset */}
                    <button
                        onClick={onReset}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 rounded-lg transition-colors border border-slate-700"
                        title="Reset"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Online Info Bar */}
            {mode === 'online-play' && (
                <div className="w-full bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 backdrop-blur-md">
                    <div className="flex items-center gap-3 text-center sm:text-left">
                        <span
                            className={`w-2 h-2 rounded-full animate-pulse ${
                                onlineStatus === 'ready'
                                    ? 'bg-green-500'
                                    : onlineStatus === 'error'
                                        ? 'bg-red-500'
                                        : onlineStatus === 'opponent-left'
                                            ? 'bg-orange-400'
                                            : 'bg-yellow-500'
                            }`}
                        />
                        <div className="flex flex-col">
                            <span className="text-slate-300 text-sm font-medium">
                                {onlineStatus === 'ready' && 'Đang đấu'}
                                {onlineStatus === 'waiting' && 'Đang chờ đối thủ...'}
                                {onlineStatus === 'creating' && 'Đang tạo phòng...'}
                                {onlineStatus === 'joining' && 'Đang vào phòng...'}
                                {onlineStatus === 'disconnected' && 'Mất kết nối tới máy chủ'}
                                {onlineStatus === 'error' && 'Không thể kết nối'}
                                {onlineStatus === 'opponent-left' && 'Đối thủ đã thoát'}
                                {!onlineStatus && 'Đang chuẩn bị...'}
                            </span>
                            {onlineMessage && (
                                <span className="text-xs text-slate-500 max-w-xs">{onlineMessage}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-lg border border-slate-800">
                        <span className="text-slate-400 text-xs uppercase tracking-wider">Mã phòng:</span>
                        <span className="font-mono text-yellow-400 font-bold tracking-widest">{roomId || '------'}</span>
                        <button
                            onClick={copyRoomId}
                            className="ml-2 text-slate-400 hover:text-white transition-colors disabled:opacity-40"
                            disabled={!roomId}
                        >
                            {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                    <div className="text-slate-400 text-sm">Bạn là: <span className="font-bold text-white">{mySide || '--'}</span></div>
                </div>
            )}
        </div>
    );
};

const WinnerModal = ({ winner, onReset, onMenu }) => {
    if (!winner) return null;
    const isX = winner === 'X';
    const isDraw = winner === 'draw';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center max-w-sm w-full transform animate-bounce-in">
                <div className="mb-4 relative">
                    <div className={`absolute inset-0 blur-2xl opacity-70 ${isX ? 'bg-cyan-500' : isDraw ? 'bg-slate-500' : 'bg-fuchsia-500'}`}></div>
                    <Trophy size={64} className={`relative z-10 ${isX ? 'text-cyan-400' : isDraw ? 'text-slate-400' : 'text-fuchsia-400'}`} />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 tracking-wide text-center">
                    {isDraw ? 'HÒA NHAU!' : 'CHIẾN THẮNG!'}
                </h2>
                <p className={`text-xl font-bold mb-8 ${isX ? 'text-cyan-400 drop-shadow-glow-cyan' : isDraw ? 'text-slate-400' : 'text-fuchsia-400 drop-shadow-glow-pink'}`}>
                    {isDraw ? 'Một ván đấu cân sức' : `Người chơi ${winner} đã thắng`}
                </p>

                <div className="flex flex-col gap-3 w-full">
                    <button
                        onClick={onReset}
                        className={`w-full py-3 px-6 rounded-xl font-bold text-lg text-white shadow-lg transition-transform active:scale-95 hover:brightness-110
                ${isX ? 'bg-gradient-to-r from-cyan-600 to-blue-600 shadow-cyan-500/25' : isDraw ? 'bg-slate-700' : 'bg-gradient-to-r from-fuchsia-600 to-pink-600 shadow-fuchsia-500/25'}`}
                    >
                        Chơi ván mới
                    </button>
                    <button
                        onClick={onMenu}
                        className="w-full py-3 px-6 rounded-xl font-bold text-lg text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        Về Menu
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export default function Gomoku() {
    const [mode, setMode] = useState('menu');
    const [board, setBoard] = useState<(string | null)[]>(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
    const [turn, setTurn] = useState('X');
    const [winner, setWinner] = useState<string | null>(null);
    const [winLine, setWinLine] = useState<number[]>([]);
    const [lastMove, setLastMove] = useState<number | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState(TURN_TIME);

    // Online State
    const [roomId, setRoomId] = useState('');
    const [roomInput, setRoomInput] = useState('');
    const [mySide, setMySide] = useState<string | null>(null);
    const [onlineStatus, setOnlineStatus] = useState('');
    const [onlineMessage, setOnlineMessage] = useState('');
    const [socketReady, setSocketReady] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        const handleRoomUpdate = (payload: {
            board: (string | null)[];
            turn: 'X' | 'O';
            lastMove: number | null;
            winner: string | null;
            winLine?: number[];
            playersReady: boolean;
        }) => {
            setBoard(payload.board);
            setTurn(payload.turn);
            setLastMove(payload.lastMove);
            setWinner(payload.winner);
            setWinLine(payload.winLine || []);
            setOnlineStatus(payload.playersReady ? 'ready' : 'waiting');
            setOnlineMessage('');
        };

        socket.on('connect', () => {
            setSocketReady(true);
            setOnlineStatus((prev) => (prev === 'disconnected' ? '' : prev));
            setOnlineMessage('');
        });
        socket.on('disconnect', () => {
            setSocketReady(false);
            setOnlineStatus('disconnected');
            setOnlineMessage('Mất kết nối tới máy chủ, vui lòng thử lại.');
        });
        socket.on('roomUpdate', handleRoomUpdate);
        socket.on('roomError', (message: string) => {
            setOnlineStatus('error');
            setOnlineMessage(message);
        });
        socket.on('opponentLeft', (message: string) => {
            setOnlineStatus('opponent-left');
            setOnlineMessage(message || 'Đối thủ đã rời phòng');
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Timer
    useEffect(() => {
        if (mode === 'menu' || mode === 'online-setup' || winner) return;
        if (mode === 'online-play' && onlineStatus !== 'ready') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) return TURN_TIME;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [turn, mode, winner, onlineStatus]);

    useEffect(() => setTimeLeft(TURN_TIME), [turn]);

    useEffect(() => {
        if (mode === 'online-setup') {
            setOnlineMessage('');
        }
    }, [mode]);

    // Game Logic
    const resetGame = () => {
        setBoard(Array(BOARD_SIZE * BOARD_SIZE).fill(null));
        setTurn('X');
        setWinner(null);
        setWinLine([]);
        setLastMove(null);
        setHistory([]);
        setTimeLeft(TURN_TIME);
    };

    const undoMove = () => {
        if (history.length === 0 || winner || mode === 'online-play') return;
        const stepsToUndo = mode === 'bot' ? 2 : 1;
        if (history.length < stepsToUndo) return;

        const newHistory = [...history];
        const prevGameState = newHistory[newHistory.length - stepsToUndo];
        newHistory.splice(newHistory.length - stepsToUndo, stepsToUndo);

        setBoard(prevGameState.board);
        setTurn(prevGameState.turn);
        setLastMove(prevGameState.lastMove);
        setHistory(newHistory);
        setWinner(null);
        setWinLine([]);
    };

    const handleMove = (idx: number) => {
        if (board[idx] || winner) return;
        if (mode === 'online-play') {
            if (!mySide || turn !== mySide) return;
            if (onlineStatus !== 'ready') return;
            if (!socketRef.current || !roomId) {
                setOnlineMessage('Không tìm thấy kết nối tới phòng.');
                return;
            }
            socketRef.current.emit('makeMove', { roomId, index: idx }, (response?: { error?: string }) => {
                if (response?.error) setOnlineMessage(response.error);
            });
            return;
        }

        // Local & Bot
        if (mode === 'local' || mode === 'bot') {
            const newBoard = [...board];
            setHistory(prev => [...prev, { board: [...board], turn, lastMove }]);
            newBoard[idx] = turn;
            setBoard(newBoard);
            setLastMove(idx);

            const winResult = checkWinner(newBoard);
            if (winResult) {
                setWinner(winResult.winner);
                setWinLine(winResult.line);
                return;
            }

            const nextTurn = turn === 'X' ? 'O' : 'X';
            setTurn(nextTurn);

            if (mode === 'bot' && nextTurn === 'O') {
                setTimeout(() => {
                    const botMoveIdx = getBestMove(newBoard);
                    if (botMoveIdx !== -1) {
                        const botBoard = [...newBoard];
                        botBoard[botMoveIdx] = 'O';
                        setBoard(botBoard);
                        setLastMove(botMoveIdx);

                        const botWin = checkWinner(botBoard);
                        if (botWin) {
                            setWinner(botWin.winner);
                            setWinLine(botWin.line);
                        } else {
                            setTurn('X');
                        }
                    }
                }, 500);
            }
        }
    };

    // Room Functions
    const leaveOnlineRoom = () => {
        if (socketRef.current && roomId) {
            socketRef.current.emit('leaveRoom', { roomId });
        }
        setRoomId('');
        setMySide(null);
        setOnlineStatus('');
        setOnlineMessage('');
    };

    const handleReset = () => {
        if (mode === 'online-play') {
            if (socketRef.current && roomId) {
                socketRef.current.emit('resetRoom', { roomId });
                setOnlineMessage('Đang chờ máy chủ đặt lại ván...');
            }
            return;
        }
        resetGame();
    };

    const createRoom = () => {
        if (!socketRef.current) {
            setOnlineStatus('error');
            setOnlineMessage('Không thể kết nối tới máy chủ');
            return;
        }
        if (roomId) leaveOnlineRoom();
        setOnlineStatus('creating');
        setOnlineMessage('');
        socketRef.current.emit('createRoom', (response?: { roomId?: string; side?: string; error?: string }) => {
            if (response?.error || !response?.roomId || !response?.side) {
                setOnlineStatus('error');
                setOnlineMessage(response?.error || 'Không thể tạo phòng');
                return;
            }
            setRoomId(response.roomId);
            setMySide(response.side);
            setMode('online-play');
            setOnlineStatus('waiting');
            resetGame();
        });
    };

    const joinRoom = (code?: string) => {
        const roomCode = (code || roomInput).trim().toUpperCase();
        if (!roomCode) {
            setOnlineMessage('Vui lòng nhập mã phòng');
            return;
        }
        if (!socketRef.current) {
            setOnlineStatus('error');
            setOnlineMessage('Không thể kết nối tới máy chủ');
            return;
        }
        if (roomId) leaveOnlineRoom();
        setOnlineStatus('joining');
        setOnlineMessage('');
        socketRef.current.emit('joinRoom', { roomId: roomCode }, (response?: { error?: string; side?: string; playersReady?: boolean }) => {
            if (response?.error || !response?.side) {
                setOnlineStatus('error');
                setOnlineMessage(response?.error || 'Không thể tham gia phòng');
                return;
            }
            setRoomId(roomCode);
            setMySide(response.side);
            setMode('online-play');
            setOnlineStatus(response.playersReady ? 'ready' : 'waiting');
            setOnlineMessage('');
            setRoomInput('');
        });
    };

    const goToMenu = () => {
        if (mode === 'online-play') {
            leaveOnlineRoom();
        }
        setMode('menu');
        resetGame();
        setRoomInput('');
    };

    // --- RENDER ---

    const Menu = () => (
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto p-6 animate-fade-in z-20 relative">
            <h1 className="text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 mb-2 tracking-tight drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                NEON GOMOKU
            </h1>
            <p className="text-slate-400 text-center mb-8 text-sm font-medium tracking-widest uppercase">Cyberpunk Edition</p>

            <button onClick={() => { setMode('bot'); resetGame(); }}
                className="group relative p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-cyan-500 hover:bg-slate-800 transition-all flex items-center gap-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                <div className="p-3 bg-cyan-500/20 rounded-lg text-cyan-400 group-hover:scale-110 transition-transform">
                    <Cpu size={24} />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-white text-lg">Đấu với Máy</h3>
                    <p className="text-slate-400 text-xs">Luyện tập với AI thông minh</p>
                </div>
            </button>

            <button onClick={() => { setMode('local'); resetGame(); }}
                className="group relative p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-fuchsia-500 hover:bg-slate-800 transition-all flex items-center gap-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                <div className="p-3 bg-fuchsia-500/20 rounded-lg text-fuchsia-400 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-white text-lg">2 Người chơi</h3>
                    <p className="text-slate-400 text-xs">Chơi cùng nhau trên 1 máy</p>
                </div>
            </button>

            <button onClick={() => setMode('online-setup')}
                className="group relative p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-yellow-500 hover:bg-slate-800 transition-all flex items-center gap-4 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                <div className="p-3 bg-yellow-500/20 rounded-lg text-yellow-400 group-hover:scale-110 transition-transform">
                    <Globe size={24} />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-white text-lg">Đấu Online</h3>
                    <p className="text-slate-400 text-xs">Tạo phòng chơi với bạn bè</p>
                </div>
            </button>
        </div>
    );

    const OnlineSetup = () => (
        <div className="w-full max-w-md mx-auto p-6 bg-slate-800/50 border border-slate-700 rounded-2xl backdrop-blur-sm z-20 relative">
            <button onClick={goToMenu} className="flex items-center text-slate-400 hover:text-white mb-6 text-sm font-medium">
                <ArrowLeft size={16} className="mr-2" /> Quay lại
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Globe className="text-yellow-400" /> Đấu Online
            </h2>

            {!socketReady && (
                <div className="mb-4 text-sm text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 rounded-lg">
                    Đang kết nối tới máy chủ trò chơi...
                </div>
            )}

            {onlineMessage && (
                <div className="mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-lg">
                    {onlineMessage}
                </div>
            )}

            <div className="space-y-6">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-slate-300 font-semibold mb-3">Tạo phòng mới</h3>
                    <button
                        onClick={createRoom}
                        disabled={!socketReady || onlineStatus === 'creating'}
                        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Tạo phòng ngay
                    </button>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-700"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">Hoặc tham gia</span>
                    <div className="flex-grow border-t border-slate-700"></div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-slate-300 font-semibold mb-3">Nhập mã phòng</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <input
                                value={roomInput}
                                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                                placeholder="Nhập mã (VD: X9A2...)"
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors font-mono uppercase"
                            />
                            <button
                                onClick={() => joinRoom(roomInput)}
                                disabled={!socketReady || !roomInput}
                                className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Vào
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Chia sẻ mã phòng với bạn bè để họ có thể tham gia nhanh chóng.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col items-center justify-center font-sans selection:bg-cyan-500/30 w-full py-4 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)]"></div>

                {/* Grid pattern background */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {mode === 'menu' && <Menu />}
            {mode === 'online-setup' && <OnlineSetup />}

            {(mode === 'local' || mode === 'bot' || mode === 'online-play') && (
                <div className="w-full h-full flex flex-col items-center justify-center z-10 px-4 relative">

                    <div className="w-full flex flex-col items-center gap-4">
                        <GameStatus
                            isXNext={turn === 'X'}
                            winner={winner}
                            onReset={handleReset}
                            onUndo={undoMove}
                            canUndo={history.length > 0}
                            timeLeft={timeLeft}
                            mode={mode}
                            onlineStatus={onlineStatus}
                            roomId={roomId}
                            mySide={mySide}
                            onMenu={goToMenu}
                            onlineMessage={onlineMessage}
                        />

                        {/* Board Container */}
                        <div className="relative p-2 md:p-3 bg-slate-900/80 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-slate-700/50 backdrop-blur-sm">
                            {/* Neon Border Glow */}
                            <div className={`absolute -inset-[2px] rounded-lg opacity-50 blur-sm transition-colors duration-1000 ${turn === 'X' ? 'bg-gradient-to-br from-cyan-500/50 to-transparent' : 'bg-gradient-to-br from-fuchsia-500/50 to-transparent'}`}></div>

                            <div
                                className="grid bg-slate-900 border-t border-l border-slate-700 relative z-10 overflow-hidden rounded shadow-inner"
                                style={{
                                    gridTemplateColumns: `repeat(${BOARD_SIZE}, 30px)`,
                                    gridTemplateRows: `repeat(${BOARD_SIZE}, 30px)`,
                                    width: '450px',
                                    height: '450px',
                                }}
                            >
                                {board.map((cell, idx) => {
                                    const isWinningCell = winLine.includes(idx);
                                    const isLastMove = lastMove === idx;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => handleMove(idx)}
                                            className={`
                                relative flex items-center justify-center cursor-pointer transition-all duration-200
                                border-r border-b border-slate-700
                                hover:bg-slate-800
                                ${isWinningCell ? 'bg-yellow-900/30' : ''}
                            `}
                                        >
                                            {/* Hover Guide */}
                                            {!cell && !winner && (
                                                <div className={`absolute w-2 h-2 rounded-full opacity-0 hover:opacity-100 transition-opacity ${turn === 'X' ? 'bg-cyan-500/30' : 'bg-fuchsia-500/30'}`}></div>
                                            )}

                                            {cell === 'X' && (
                                                <div className={`relative flex items-center justify-center w-full h-full ${isWinningCell ? 'scale-110' : ''}`}>
                                                    <X
                                                        className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                                                        strokeWidth={3}
                                                        style={{ width: '80%', height: '80%' }}
                                                    />
                                                    {isLastMove && !winner && (
                                                        <div className="absolute inset-0 border-2 border-cyan-200/50 rounded-sm shadow-[inset_0_0_10px_rgba(34,211,238,0.5)] animate-pulse"></div>
                                                    )}
                                                </div>
                                            )}

                                            {cell === 'O' && (
                                                <div className={`relative flex items-center justify-center w-full h-full ${isWinningCell ? 'scale-110' : ''}`}>
                                                    <Circle
                                                        className="text-fuchsia-500 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                                                        strokeWidth={3}
                                                        style={{ width: '75%', height: '75%' }}
                                                    />
                                                    {isLastMove && !winner && (
                                                        <div className="absolute inset-0 border-2 border-fuchsia-200/50 rounded-sm shadow-[inset_0_0_10px_rgba(236,72,153,0.5)] animate-pulse"></div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <WinnerModal winner={winner} onReset={handleReset} onMenu={goToMenu} />

            {/* Footer */}
            <div className="absolute bottom-2 md:bottom-4 text-slate-500 text-[10px] md:text-xs font-mono opacity-50 pointer-events-none">
                NEON GOMOKU
            </div>
        </div>
    );
}
