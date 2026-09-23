// ============================================================================
// THE WHISPERING WILDS - PRODUCTION MULTIPLAYER & GAME SERVER
// ============================================================================

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const config = require('./config');
const Logger = require('./logger');
const RoomManager = require('./room-manager');
const PlayerManager = require('./player-manager');
const { registerSocketHandlers } = require('./connection-handler');

const app = express();
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));

// Health & Readiness Endpoints
const startTime = Date.now();
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        game: 'The Whispering Wilds (Kaattu Vazhi)',
        uptimeSec: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
    });
});

app.get('/ready', (req, res) => {
    const memory = process.memoryUsage();
    res.status(200).json({
        ready: true,
        activeRooms: roomManager.rooms.size,
        activePlayers: playerManager.players.size,
        memory: {
            heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
            rssMB: Math.round(memory.rss / 1024 / 1024)
        }
    });
});

// Test results ingestion endpoint (for automated testing & headless test-runner)
app.post('/api/test-results', (req, res) => {
    try {
        const fs = require('fs');
        const results = req.body;
        const outPath = path.join(__dirname, '..', 'test_results.json');
        fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
        Logger.info(`Saved test results (${Array.isArray(results) ? results.length : 0} steps)`);
        res.status(200).json({ saved: true });
    } catch (err) {
        Logger.error('Failed to save test results', { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// Serve static game files from project root
app.use(express.static(path.join(__dirname, '..')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: config.CORS_ORIGIN,
        methods: ['GET', 'POST']
    },
    pingInterval: config.PING_INTERVAL,
    pingTimeout: config.PING_TIMEOUT
});

const roomManager = new RoomManager();
const playerManager = new PlayerManager();

io.on('connection', (socket) => {
    Logger.info(`[Socket] Connected: ${socket.id}`);
    registerSocketHandlers(io, socket, roomManager, playerManager);
});

function start(port = config.PORT) {
    return new Promise((resolve) => {
        server.listen(port, () => {
            Logger.info(`=======================================================`);
            Logger.info(`🌿 The Whispering Wilds Co-op Multiplayer Server`);
            Logger.info(`📡 Server running on port ${port}`);
            Logger.info(`👥 Room Capacity: ${config.DEFAULT_ROOM_CAP}-${config.MAX_PLAYERS_PER_ROOM} Players`);
            Logger.info(`=======================================================`);
            resolve(server);
        });
    });
}

// Graceful shutdown
function shutdown() {
    Logger.info('Initiating graceful shutdown...');
    io.close(() => {
        Logger.info('Socket.io server closed.');
        server.close(() => {
            Logger.info('HTTP server closed.');
            process.exit(0);
        });
    });
    setTimeout(() => {
        Logger.error('Forced shutdown timeout.');
        process.exit(1);
    }, 5000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

if (require.main === module) {
    start();
}

module.exports = {
    app,
    server,
    io,
    roomManager,
    playerManager,
    start,
    shutdown
};
