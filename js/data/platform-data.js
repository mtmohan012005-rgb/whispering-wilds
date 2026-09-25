// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLATFORM DATA CONFIGURATION
// Authoritative definitions for PC storefronts, platform presets, and features.
// ============================================================================

(function() {
  const PLATFORM_CONFIG = {
    DEFAULT_PROVIDER: 'generic', // 'generic' (Direct/Offline), 'store', 'dev'
    SUPPORTED_STORES: ['GENERIC_DIRECT', 'STEAM_COMPATIBLE', 'EPIC_COMPATIBLE', 'GOG_COMPATIBLE'],
    MAX_PLAYER_CUSTOMIZATIONS: 5, // STRICT CEILING PRESERVED EVERYWHERE
    CLOUD_SYNC_ENABLED: true,
    OVERLAY_AUTO_PAUSE: true,
    RICH_PRESENCE_DEBOUNCE_MS: 5000,
    PRESENCE_KEYS: {
      EXPLORING: 'exploring',
      BOAT: 'boat',
      FESTIVAL: 'festival',
      INVESTIGATION: 'investigation',
      PHOTO: 'photo',
      CAMPING: 'camping'
    },
    ERROR_CODES: {
      OFFLINE: 'ERR_PLATFORM_OFFLINE',
      NOT_SUPPORTED: 'ERR_FEATURE_NOT_SUPPORTED',
      CORRUPT_CLOUD_PAYLOAD: 'ERR_CLOUD_PAYLOAD_INVALID',
      CUSTOMIZATION_LIMIT_EXCEEDED: 'ERR_CUSTOMIZATION_CEILING_VIOLATION'
    }
  };

  window.PLATFORM_DATA = PLATFORM_CONFIG;
})();
