// ============================================================================
// THE WHISPERING WILDS - CLIENT NETWORK CONFIGURATION
// ============================================================================

const NetworkConfig = {
    DEFAULT_SERVER_PORT: 3000,
    EMIT_RATE_HZ: 20,
    EMIT_INTERVAL_SEC: 0.05, // 50ms
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY_MS: 1500,
    TIMEOUT_MS: 6000,

    getServerUrl() {
        if (typeof window !== 'undefined' && window.MULTIPLAYER_SERVER_URL) {
            return window.MULTIPLAYER_SERVER_URL;
        }
        if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
            const port = window.location.port;
            if (port === '3000' || port === '10000' || port === '8080') {
                return window.location.origin;
            }
        }
        return 'http://localhost:3000';
    }
};

if (typeof window !== 'undefined') {
    window.NetworkConfig = NetworkConfig;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkConfig;
}
