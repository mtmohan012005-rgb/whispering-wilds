// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MULTIPLAYER CO-OP BACKEND SERVER
// Node.js + Express + Socket.io (Max 5 Players per Room with Dynamic Host Reassignment)
// ============================================================================

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

// Serve static game files directly from current directory
app.use(express.static(path.join(__dirname, '.')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const MAX_PLAYERS = 5;

// Room state storage:
// { roomCode: { hostId: string, createdAt: number, players: { socketId: { id, name, role, position, rotationY, currentAnim } } } }
const rooms = {};

io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Join or Host a Room
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const code = (roomCode || 'CHENNAI_EXP').trim().toUpperCase();
        const name = (playerName || 'Explorer').trim().slice(0, 24);

        if (!rooms[code]) {
            // First connected player becomes the expedition HOST
            rooms[code] = {
                hostId: socket.id,
                createdAt: Date.now(),
                players: {}
            };
            console.log(`[Room ${code}] Created with HOST: ${name} (${socket.id})`);
        }

        const room = rooms[code];
        const currentCount = Object.keys(room.players).length;

        // Enforce strict 5-Player Room Cap
        if (currentCount >= MAX_PLAYERS && !room.players[socket.id]) {
            socket.emit('roomFull', {
                message: `Expedition lobby is full (Max ${MAX_PLAYERS} players reached). Try another room code.`
            });
            return;
        }

        const isHost = (room.hostId === socket.id);
        const role = isHost ? 'HOST' : 'EXPLORER';

        // Register player
        room.players[socket.id] = {
            id: socket.id,
            name: name,
            role: role,
            position: { x: -250, y: 0, z: 0 },
            rotationY: 0,
            currentAnim: 'idle'
        };

        socket.join(code);
        socket.currentRoom = code;

        // Acknowledge connection to client
        socket.emit('joinedSuccess', {
            roomCode: code,
            playerId: socket.id,
            isHost: isHost,
            role: role,
            currentPlayers: room.players,
            maxPlayers: MAX_PLAYERS
        });

        // Broadcast to other players in this room
        socket.to(code).emit('playerJoined', room.players[socket.id]);
        console.log(`[Room ${code}] ${name} joined as ${role}. Total: ${Object.keys(room.players).length}/${MAX_PLAYERS}`);
    });

    // Real-Time 3D Movement Synchronization
    socket.on('playerMove', ({ roomCode, position, rotationY, currentAnim }) => {
        const code = (roomCode || socket.currentRoom);
        if (!code || !rooms[code] || !rooms[code].players[socket.id]) return;

        const player = rooms[code].players[socket.id];
        if (position) {
            player.position = {
                x: Number(position.x) || 0,
                y: Number(position.y) || 0,
                z: Number(position.z) || 0
            };
        }
        if (typeof rotationY === 'number') {
            player.rotationY = rotationY;
        }
        if (currentAnim) {
            player.currentAnim = currentAnim;
        }

        // Broadcast updated transform to other explorers in the room
        socket.to(code).emit('playerMoved', {
            id: socket.id,
            position: player.position,
            rotationY: player.rotationY,
            currentAnim: player.currentAnim
        });
    });

    // Handle Disconnect & Host Reassignment
    const handleLeave = () => {
        const code = socket.currentRoom;
        if (!code || !rooms[code]) return;

        const room = rooms[code];
        const leavingPlayer = room.players[socket.id];
        delete room.players[socket.id];

        const remainingIds = Object.keys(room.players);
        console.log(`[Room ${code}] Player disconnected: ${leavingPlayer ? leavingPlayer.name : socket.id}. Remaining: ${remainingIds.length}`);

        if (remainingIds.length === 0) {
            delete rooms[code];
            console.log(`[Room ${code}] Room disbanded (0 players).`);
        } else {
            // If the HOST left, reassign HOST to the next available explorer
            if (room.hostId === socket.id) {
                const newHostId = remainingIds[0];
                room.hostId = newHostId;
                room.players[newHostId].role = 'HOST';

                io.to(code).emit('newHostAssigned', {
                    hostId: newHostId,
                    hostName: room.players[newHostId].name
                });
                console.log(`[Room ${code}] Host reassigned to: ${room.players[newHostId].name} (${newHostId})`);
            }

            io.to(code).emit('playerLeft', { id: socket.id });
        }
    };

    socket.on('disconnecting', handleLeave);
    socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🌿 The Whispering Wilds Co-op Multiplayer Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`👥 Max Players per Room: ${MAX_PLAYERS}`);
    console.log(`=======================================================`);
});
