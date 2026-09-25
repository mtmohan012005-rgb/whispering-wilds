/**
 * Platform Capabilities & Feature Detection Flags
 * Defines the standardized capabilities that platform providers may expose.
 */

(function(root) {
  const PlatformCapabilities = {
    ACHIEVEMENTS: 'ACHIEVEMENTS',
    CLOUD_SAVE: 'CLOUD_SAVE',
    OVERLAY: 'OVERLAY',
    RICH_PRESENCE: 'RICH_PRESENCE',
    FRIENDS: 'FRIENDS',
    CONTROLLER: 'CONTROLLER',
    USER_IDENTITY: 'USER_IDENTITY',

    createCapabilities(flags = {}) {
      return {
        [PlatformCapabilities.ACHIEVEMENTS]: !!flags.achievements,
        [PlatformCapabilities.CLOUD_SAVE]: !!flags.cloudSave,
        [PlatformCapabilities.OVERLAY]: !!flags.overlay,
        [PlatformCapabilities.RICH_PRESENCE]: !!flags.richPresence,
        [PlatformCapabilities.FRIENDS]: !!flags.friends,
        [PlatformCapabilities.CONTROLLER]: flags.controller !== false, // Controllers supported by default
        [PlatformCapabilities.USER_IDENTITY]: !!flags.userIdentity
      };
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformCapabilities;
  } else {
    root.PlatformCapabilities = PlatformCapabilities;
  }
})(typeof window !== 'undefined' ? window : global);
