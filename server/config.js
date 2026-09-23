// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION MULTIPLAYER SERVER CONFIG
// ============================================================================

const config = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOST: process.env.HOST || '0.0.0.0',
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    DEFAULT_ROOM_CAP: 8,
    MAX_PLAYERS_PER_ROOM: 16,
    MIN_PLAYERS_PER_ROOM: 2,
    TICK_RATE: 20, // 20 updates/second (50ms)
    TICK_INTERVAL_MS: 50,
    PING_INTERVAL: 10000,
    PING_TIMEOUT: 5000,
    RATE_LIMITS: {
        chat: { max: 5, windowMs: 10000 },      // 5 messages per 10s
        movement: { max: 35, windowMs: 1000 },  // up to 35 movement packets per sec
        action: { max: 10, windowMs: 1000 }     // 10 actions per sec
    },
    SPEED_LIMITS: {
        MAX_MOVE_SPEED: 18.0,     // units/sec (sprint is ~8.5, allowance for lag spike)
        MAX_TELEPORT_DIST: 50.0   // allowed distance jump before flagged as suspicious
    },
    CUSTOMIZATION_RULES: {
        MAX_PLAYER_CHANGES: 5
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}
