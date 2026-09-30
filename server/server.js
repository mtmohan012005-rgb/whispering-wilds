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
const authRoutes = require('./auth/auth-routes');
const profileRoutes = require('./profile/profile-routes');
const saveRoutes = require('./saves/save-routes');
const persistenceRoutes = require('./routes/persistence-routes');
const { socketAuthMiddleware } = require('./auth/auth-middleware');
const FirebaseAdmin = require('./firebase/admin');
const { requestContext, requestLogger, errorHandler } = require('./middleware/request-context');

const app = express();
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Request identity + structured access log. Registered before routes so every
// request (including errors) carries a requestId.
app.use(requestContext());
app.use(requestLogger());

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
// DEPRECATED (transitional): the custom JWT + JSON/PostgreSQL stack below is
// being superseded by Firebase. Kept mounted so existing sessions keep working
// during migration. Do not treat as a persistence authority.
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/saves', saveRoutes);

// CANONICAL: Firebase-backed persistence. Requires a verified ID token.
app.use('/api/v1/persistence', persistenceRoutes);


// Health & Readiness Endpoints
const startTime = Date.now();
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        game: 'The Whispering Wilds (Kaattu Vazhi)',
        players: playerManager ? (playerManager.players ? playerManager.players.size : 0) : 0,
        rooms: roomManager ? (roomManager.rooms ? roomManager.rooms.size : 0) : 0,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        uptimeSec: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString()
    });
});

// Versioned health endpoint — used by OnlineConnectionManager client-side check
app.get('/api/v1/health', (req, res) => {
    const memory = process.memoryUsage();
    res.status(200).json({
        status: 'ok',
        version: '1',
        game: 'The Whispering Wilds',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        timestamp: new Date().toISOString(),
        server: {
            players: playerManager ? (playerManager.players ? playerManager.players.size : 0) : 0,
            rooms: roomManager ? (roomManager.rooms ? roomManager.rooms.size : 0) : 0,
            memoryMB: Math.round(memory.heapUsed / 1024 / 1024)
        }
    });
});

// Readiness endpoint. Unlike /health (which is a liveness check and always
// reports ok while the process is up), /ready actually probes each backing
// dependency and returns 503 when the service cannot serve traffic.
app.get('/ready', async (req, res) => {
    const checks = {};
    let ready = true;

    // In-process subsystems
    try {
        checks.rooms = {
            ok: typeof roomManager.rooms.size === 'number',
            activeRooms: roomManager.rooms.size
        };
        checks.players = {
            ok: typeof playerManager.players.size === 'number',
            activePlayers: playerManager.players.size
        };
    } catch (err) {
        ready = false;
        checks.rooms = { ok: false, reason: err.message };
    }

    // Firebase persistence. Reported honestly: when credentials are absent the
    // service is NOT ready to serve persistent traffic, because the persistence
    // routes fail closed rather than silently accepting writes.
    const firebaseProbe = await FirebaseAdmin.probe();
    checks.firebase = firebaseProbe;
    if (!firebaseProbe.ok) ready = false;

    const memory = process.memoryUsage();
    checks.memory = {
        ok: true,
        heapUsedMB: Math.round(memory.heapUsed / 1024 / 1024),
        rssMB: Math.round(memory.rss / 1024 / 1024)
    };

    res.status(ready ? 200 : 503).json({
        ready,
        service: 'whispering-wilds-multiplayer',
        checks,
        timestamp: new Date().toISOString()
    });
});


// Test results ingestion endpoint (strictly development-only, isolated from production)
if (process.env.NODE_ENV === 'development') {
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
}

// Serve static game files from project root
app.use(express.static(path.join(__dirname, '..')));

// Terminal error handler. Must be registered after all routes and static
// middleware so every thrown/rejected error is converted to a canonical code
// instead of leaking a stack trace to the client.
app.use(errorHandler());

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

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
    const authDesc = socket.user ? `[Authenticated: ${socket.user.email} (${socket.accountId})]` : '[Guest]';
    Logger.info(`[Socket] Connected: ${socket.id} ${authDesc}`);
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
