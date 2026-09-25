/**
 * StorePlatformProvider - Storefront Adapter (Steam / Epic / GOG Compatible)
 * Implements standard PC storefront API contracts for achievements, cloud sync, overlay, and presence.
 */

(function(root) {
  const PlatformUser = typeof require !== 'undefined' ? require('../platform-user') : root.PlatformUser;
  const PlatformCapabilities = typeof require !== 'undefined' ? require('../platform-capabilities') : root.PlatformCapabilities;

  class StorePlatformProvider {
    constructor(storeId = 'store_pc', storeName = 'PC Storefront') {
      this.id = storeId;
      this.name = storeName;
      this.initialized = false;
      this.achievements = new Set();
      this.cloudStorage = new Map();
      this.currentPresence = '';
      this.overlayCallback = null;
      this.capabilities = PlatformCapabilities.createCapabilities({
        achievements: true,
        cloudSave: true,
        overlay: true,
        richPresence: true,
        friends: true,
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
      return this.initialized;
    }

    async getUser() {
      const UserClass = typeof require !== 'undefined' ? require('../platform-user') : (root.PlatformUser || (typeof window !== 'undefined' && window.PlatformUser));
      return new UserClass({
        provider: this.id,
        platformId: 'store_user_7701',
        displayName: 'Tamil Explorer',
        isGuest: false
      });
    }

    async signIn() {
      return this.getUser();
    }

    async signOut() {
      return true;
    }

    async unlockAchievement(id) {
      this.achievements.add(id);
      return { success: true, achievementId: id, provider: this.id, timestamp: Date.now() };
    }

    async getAchievements() {
      return Array.from(this.achievements);
    }

    async saveCloud(slotId, pkg) {
      if (!pkg || !pkg.payload) {
        throw new Error('Invalid cloud package');
      }
      this.cloudStorage.set(slotId, JSON.parse(JSON.stringify(pkg)));
      return { success: true, slotId, checksum: pkg.checksum, timestamp: Date.now() };
    }

    async loadCloud(slotId) {
      const data = this.cloudStorage.get(slotId);
      if (!data) {
        throw new Error('Save package not found on store cloud');
      }
      return data;
    }

    showOverlay(dialog = 'friends') {
      if (this.overlayCallback) {
        this.overlayCallback(true);
        setTimeout(() => {
          if (this.overlayCallback) this.overlayCallback(false);
        }, 100);
      }
      return true;
    }

    onOverlayStateChanged(callback) {
      this.overlayCallback = callback;
    }

    setRichPresence(status) {
      this.currentPresence = String(status || '');
      return true;
    }

    async getFriends() {
      return [
        { name: 'Kavitha M', status: 'In Game', richPresence: 'Exploring Nilgiris' },
        { name: 'Arun K', status: 'Online', richPresence: 'At Mamallapuram Shore' }
      ];
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorePlatformProvider;
  } else {
    root.StorePlatformProvider = StorePlatformProvider;
  }
})(typeof window !== 'undefined' ? window : global);
