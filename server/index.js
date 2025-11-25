import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import sequelize from './config/database.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const allowedOrigins = process.env.CLIENT_ORIGIN
    ? process.env.CLIENT_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const io = new SocketIOServer(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// --- GOMOKU ONLINE STATE ---
const BOARD_SIZE = 15;
const WIN_STREAK = 5;
const rooms = new Map();

const createEmptyBoard = () => Array(BOARD_SIZE * BOARD_SIZE).fill(null);

const resetRoomState = (room) => {
    room.board = createEmptyBoard();
    room.turn = 'X';
    room.lastMove = null;
    room.winner = null;
    room.winLine = [];
};

const generateRoomId = () => {
    let id = '';
    do {
        id = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (rooms.has(id));
    return id;
};

const checkWinner = (board) => {
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = board[r * BOARD_SIZE + c];
            if (!cell) continue;

            for (const [dr, dc] of directions) {
                let count = 1;
                const winCells = [r * BOARD_SIZE + c];

                for (let i = 1; i < WIN_STREAK; i++) {
                    const nr = r + dr * i;
                    const nc = c + dc * i;
                    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
                    if (board[nr * BOARD_SIZE + nc] === cell) {
                        count++;
                        winCells.push(nr * BOARD_SIZE + nc);
                    } else {
                        break;
                    }
                }

                if (count >= WIN_STREAK) return { winner: cell, line: winCells };
            }
        }
    }

    if (!board.includes(null)) return { winner: 'draw', line: [] };
    return null;
};

const serializeRoom = (roomId, room) => ({
    roomId,
    board: room.board,
    turn: room.turn,
    lastMove: room.lastMove,
    winner: room.winner,
    winLine: room.winLine,
    playersReady: Boolean(room.players.X && room.players.O)
});

const broadcastRoom = (roomId) => {
    const room = rooms.get(roomId);
    if (!room) return;
    io.to(roomId).emit('roomUpdate', serializeRoom(roomId, room));
};

const handleLeaveRoom = (socket, explicitRoomId) => {
    const roomId = explicitRoomId || socket.data?.roomId;
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;

    const side = socket.data?.side;
    if (side && room.players[side] === socket.id) {
        room.players[side] = null;
    } else {
        if (room.players.X === socket.id) room.players.X = null;
        if (room.players.O === socket.id) room.players.O = null;
    }

    socket.leave(roomId);
    socket.data.roomId = null;
    socket.data.side = null;

    if (!room.players.X && !room.players.O) {
        rooms.delete(roomId);
        return;
    }

    resetRoomState(room);
    io.to(roomId).emit('opponentLeft', 'Đối thủ đã thoát phòng');
    broadcastRoom(roomId);
};

io.on('connection', (socket) => {
    socket.on('createRoom', (callback = () => { }) => {
        const roomId = generateRoomId();
        rooms.set(roomId, {
            board: createEmptyBoard(),
            turn: 'X',
            lastMove: null,
            winner: null,
            winLine: [],
            players: { X: socket.id, O: null }
        });

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.side = 'X';
        callback({ roomId, side: 'X' });
        broadcastRoom(roomId);
    });

    socket.on('joinRoom', ({ roomId } = {}, callback = () => { }) => {
        if (!roomId) {
            callback({ error: 'Mã phòng không hợp lệ' });
            return;
        }

        const room = rooms.get(roomId);
        if (!room) {
            callback({ error: 'Không tìm thấy phòng' });
            return;
        }

        let side = null;
        if (!room.players.X) side = 'X';
        else if (!room.players.O) side = 'O';

        if (!side) {
            callback({ error: 'Phòng đã đủ người' });
            return;
        }

        room.players[side] = socket.id;
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.side = side;

        callback({ side, playersReady: Boolean(room.players.X && room.players.O) });
        broadcastRoom(roomId);
    });

    socket.on('makeMove', ({ roomId, index } = {}, callback = () => { }) => {
        const room = rooms.get(roomId);
        if (!room) {
            callback({ error: 'Phòng không tồn tại' });
            return;
        }
        if (socket.data?.roomId !== roomId) {
            callback({ error: 'Bạn không ở trong phòng này' });
            return;
        }
        if (typeof index !== 'number' || index < 0 || index >= room.board.length) {
            callback({ error: 'Nước đi không hợp lệ' });
            return;
        }
        if (!room.players.X || !room.players.O) {
            callback({ error: 'Đang chờ đối thủ' });
            return;
        }
        if (room.winner) {
            callback({ error: 'Ván đã kết thúc' });
            return;
        }
        if (room.board[index]) {
            callback({ error: 'Ô đã được đánh' });
            return;
        }

        const side = socket.data?.side;
        if (!side) {
            callback({ error: 'Không xác định người chơi' });
            return;
        }
        if (room.turn !== side) {
            callback({ error: 'Chưa tới lượt bạn' });
            return;
        }

        room.board[index] = side;
        room.lastMove = index;
        const result = checkWinner(room.board);

        if (result) {
            room.winner = result.winner;
            room.winLine = result.line;
        } else {
            room.turn = side === 'X' ? 'O' : 'X';
            room.winLine = [];
            room.winner = null;
        }

        broadcastRoom(roomId);
        callback({ ok: true });
    });

    socket.on('resetRoom', ({ roomId } = {}, callback = () => { }) => {
        const room = rooms.get(roomId);
        if (!room) {
            callback({ error: 'Phòng không tồn tại' });
            return;
        }
        if (socket.data?.roomId !== roomId) {
            callback({ error: 'Bạn không ở trong phòng này' });
            return;
        }

        resetRoomState(room);
        broadcastRoom(roomId);
        callback({ ok: true });
    });

    socket.on('leaveRoom', ({ roomId } = {}) => {
        handleLeaveRoom(socket, roomId);
    });

    socket.on('disconnect', () => {
        handleLeaveRoom(socket);
    });
});

// Sync Database and Start Server
sequelize.sync()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });
