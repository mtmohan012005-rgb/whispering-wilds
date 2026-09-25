/**
 * DevelopmentPlatformProvider - Mock Provider for Local Testing & Simulation
 * Allows simulating failures, offline states, and provider switching.
 * Never shipped as default production provider.
 */

(function(root) {
  const PlatformUser = typeof require !== 'undefined' ? require('../platform-user') : root.PlatformUser;
  const PlatformCapabilities = typeof require !== 'undefined' ? require('../platform-capabilities') : root.PlatformCapabilities;

  class DevelopmentPlatformProvider {
    constructor() {
      this.id = 'dev_mock';
      this.name = 'Development Mock Provider';
      this.initialized = false;
      this.simulatedAvailable = true;
      this.simulatedCloudFailure = false;
      this.simulatedAchievementFailure = false;
      this.achievements = new Set();
      this.cloudStorage = new Map();
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
      return this.initialized && this.simulatedAvailable;
    }

    async getUser() {
      const UserClass = typeof require !== 'undefined' ? require('../platform-user') : (root.PlatformUser || (typeof window !== 'undefined' && window.PlatformUser));
      return new UserClass({
        provider: this.id,
        platformId: 'dev_user_001',
        displayName: 'Developer Tester',
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
      if (this.simulatedAchievementFailure) {
        throw new Error('Simulated platform achievement API failure');
      }
      this.achievements.add(id);
      return { success: true, achievementId: id, provider: this.id };
    }

    async getAchievements() {
      return Array.from(this.achievements);
    }

    async saveCloud(slotId, pkg) {
      if (this.simulatedCloudFailure) {
        throw new Error('Simulated platform cloud API error');
      }
      this.cloudStorage.set(slotId, JSON.parse(JSON.stringify(pkg)));
      return { success: true, slotId };
    }

    async loadCloud(slotId) {
      if (this.simulatedCloudFailure) {
        throw new Error('Simulated platform cloud API error');
      }
      const data = this.cloudStorage.get(slotId);
      if (!data) throw new Error('Not found in mock cloud');
      return data;
    }

    showOverlay(dialog = 'friends') {
      if (this.overlayCallback) {
        this.overlayCallback(true);
      }
      return true;
    }

    closeOverlay() {
      if (this.overlayCallback) {
        this.overlayCallback(false);
      }
      return true;
    }

    onOverlayStateChanged(callback) {
      this.overlayCallback = callback;
    }

    setRichPresence(status) {
      return true;
    }

    // Simulation helpers
    simulateOffline(isOffline) {
      this.simulatedAvailable = !isOffline;
    }

    simulateCloudError(hasError) {
      this.simulatedCloudFailure = !!hasError;
    }

    simulateAchievementError(hasError) {
      this.simulatedAchievementFailure = !!hasError;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DevelopmentPlatformProvider;
  } else {
    root.DevelopmentPlatformProvider = DevelopmentPlatformProvider;
  }
})(typeof window !== 'undefined' ? window : global);
