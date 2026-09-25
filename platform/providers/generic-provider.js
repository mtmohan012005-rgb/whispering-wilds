/**
 * GenericPlatformProvider - Standalone & Direct Distribution Provider
 * Default provider for DRM-free direct release and offline mode.
 * Functions 100% locally with zero external storefront dependencies.
 */

(function(root) {
  const PlatformUser = typeof require !== 'undefined' ? require('../platform-user') : root.PlatformUser;
  const PlatformCapabilities = typeof require !== 'undefined' ? require('../platform-capabilities') : root.PlatformCapabilities;

  class GenericPlatformProvider {
    constructor() {
      this.id = 'generic';
      this.name = 'Direct Distribution';
      this.initialized = false;
      this.localAchievements = new Set();
      this.localCloudSaves = new Map();
      this.capabilities = PlatformCapabilities.createCapabilities({
        achievements: true,
        cloudSave: false, // Cloud save not supported in generic offline mode
        overlay: false,
        richPresence: false,
        friends: false,
        controller: true,
        userIdentity: true
      });
    }

    async initialize() {
      this.initialized = true;
      return true;
    }

    async shutdown() {
      this.initialized = false;
      return true;
    }

    async isAvailable() {
      return true;
    }

    async getUser() {
      const UserClass = typeof require !== 'undefined' ? require('../platform-user') : (root.PlatformUser || (typeof window !== 'undefined' && window.PlatformUser));
      return new UserClass({
        provider: this.id,
        platformId: 'local_player',
        displayName: 'Local Explorer',
        isGuest: true
      });
    }

    async signIn() {
      return this.getUser();
    }

    async signOut() {
      return true;
    }

    async unlockAchievement(id) {
      this.localAchievements.add(id);
      return { success: true, achievementId: id, provider: this.id };
    }

    async getAchievements() {
      return Array.from(this.localAchievements);
    }

    async saveCloud(slotId, pkg) {
      return { status: 'NOT_SUPPORTED', message: 'Cloud save is not supported in direct distribution.' };
    }

    async loadCloud(slotId) {
      return { status: 'NOT_SUPPORTED', message: 'Cloud save is not supported in direct distribution.' };
    }

    showOverlay(dialog) {
      return false; // Not supported
    }

    setRichPresence(status) {
      return false; // Not supported
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenericPlatformProvider;
  } else {
    root.GenericPlatformProvider = GenericPlatformProvider;
  }
})(typeof window !== 'undefined' ? window : global);
