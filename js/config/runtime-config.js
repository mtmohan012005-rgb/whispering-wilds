/**
 * The Whispering Wilds (Kaattu Vazhi) - Runtime Frontend Configuration
 * Authoritative single configuration source for environment, URLs, and feature flags.
 * Production defaults ensure developer tools, telemetry, and debug logs are disabled.
 */
(function() {
  const isLocal = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:'
  );

  // In production, fallback to the configured Render multiplayer backend
  const defaultProdServer = 'https://whispering-wilds-server.onrender.com';
  const defaultDevServer = 'http://localhost:3000';

  const environment = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production')
    ? 'production'
    : (isLocal ? 'development' : 'production');

  const multiplayerServerUrl = (typeof window !== 'undefined' && window.MULTIPLAYER_SERVER_URL)
    ? window.MULTIPLAYER_SERVER_URL
    : (environment === 'production' ? defaultProdServer : defaultDevServer);

  const RUNTIME_CONFIG = {
    environment: environment,
    multiplayerServerUrl: multiplayerServerUrl,
    assetBaseUrl: '',
    enableMultiplayer: true,
    enableDeveloperTools: environment === 'development',
    enableTelemetry: false, // Never send private telemetry in production
    enableDebugLogs: environment === 'development'
  };

  // Expose globally
  if (typeof window !== 'undefined') {
    window.RUNTIME_CONFIG = RUNTIME_CONFIG;
    window.MULTIPLAYER_SERVER_URL = RUNTIME_CONFIG.multiplayerServerUrl;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RUNTIME_CONFIG;
  }
})();
