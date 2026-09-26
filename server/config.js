// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI)
// PRODUCTION MULTIPLAYER SERVER CONFIG
// ============================================================================

const config = {
    // ------------------------------------------------------------------------
    // SERVER
    // ------------------------------------------------------------------------
    PORT: parseInt(process.env.PORT || '3000', 10),

    HOST: process.env.HOST || '0.0.0.0',

    // In production, set CORS_ORIGIN in Render environment variables.
    // Supports comma-separated list or fallback to known deployment domains.
    CORS_ORIGIN: process.env.CORS_ORIGIN 
      ? (process.env.CORS_ORIGIN.includes(',') ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) : process.env.CORS_ORIGIN)
      : (process.env.NODE_ENV === 'production' 
          ? ['https://whispering-wilds.netlify.app'] 
          : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080']),

    // ------------------------------------------------------------------------
    // MULTIPLAYER ROOM SETTINGS
    // ------------------------------------------------------------------------
    // The game UI and test configuration use a maximum of 5 players.
    // Keep these values consistent throughout the server.
    DEFAULT_ROOM_CAP: 5,
    MAX_PLAYERS_PER_ROOM: 5,
    MIN_PLAYERS_PER_ROOM: 2,

    // ------------------------------------------------------------------------
    // GAME LOOP
    // ------------------------------------------------------------------------
    // 20 server updates per second.
    TICK_RATE: 20,

    // 1000ms / 20 = 50ms per tick.
    TICK_INTERVAL_MS: 50,

    // ------------------------------------------------------------------------
    // SOCKET.IO CONNECTION SETTINGS
    // ------------------------------------------------------------------------
    // How often the server sends ping packets.
    PING_INTERVAL: 10000,

    // How long the server waits for a pong response.
    PING_TIMEOUT: 5000,

    // ------------------------------------------------------------------------
    // RATE LIMITS
    // ------------------------------------------------------------------------
    RATE_LIMITS: {
        // Maximum 5 chat messages every 10 seconds.
        chat: {
            max: 5,
            windowMs: 10000
        },

        // Maximum 35 movement packets per second.
        movement: {
            max: 35,
            windowMs: 1000
        },

        // Maximum 10 actions per second.
        action: {
            max: 10,
            windowMs: 1000
        }
    },

    // ------------------------------------------------------------------------
    // MOVEMENT / ANTI-CHEAT LIMITS
    // ------------------------------------------------------------------------
    SPEED_LIMITS: {
        // Maximum allowed movement speed in game units per second.
        MAX_MOVE_SPEED: 18.0,

        // Maximum distance allowed for a sudden position change
        // before the movement can be treated as suspicious.
        MAX_TELEPORT_DIST: 50.0
    },

    // ------------------------------------------------------------------------
    // PLAYER CUSTOMIZATION
    // ------------------------------------------------------------------------
    CUSTOMIZATION_RULES: {
        // Maximum number of customization changes allowed.
        MAX_PLAYER_CHANGES: 5
    }
};

// ============================================================================
// EXPORT
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}
