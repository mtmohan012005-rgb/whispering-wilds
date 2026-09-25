// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLATFORM INTEGRATION SYSTEM
// Sole authority for external storefront/platform services (Steam/Epic/GOG/Direct).
// Providers are adapters. Game systems remain 100% offline-playable.
// ============================================================================

(function() {
  class PlatformIntegrationSystem {
    constructor() {
      this.service = null;
      this.initialized = false;
      this.currentProviderId = 'generic';
      this.listeners = new Set();
    }

    async init(options = {}) {
      const provider = options.provider || (window.PLATFORM_DATA ? window.PLATFORM_DATA.DEFAULT_PROVIDER : 'generic');
      this.currentProviderId = provider;

      if (window.PlatformService) {
        this.service = window.PlatformService;
        await this.service.init({ provider });
      }

      this.initialized = true;
      this._hookIntoGameSystems();
      this._notifyListeners({ event: 'initialized', provider: this.currentProviderId });
      return this;
    }

    _hookIntoGameSystems() {
      // 1. Hook into AchievementSystem: Dispatch completed achievements to platform provider
      if (window.AchievementSystem) {
        const origComplete = window.AchievementSystem.completeAchievement.bind(window.AchievementSystem);
        window.AchievementSystem.completeAchievement = (achievementId) => {
          const res = origComplete(achievementId);
          if (res && res.success) {
            this.unlockAchievement(achievementId);
          }
          return res;
        };
      }

      // 2. Hook into World Region Transitions for Rich Presence
      if (window.WorldStreamingSystem) {
        // Listen or poll region transitions
        const checkRegion = () => {
          if (window.GameState && window.GameState.world) {
            const region = window.GameState.world.currentRegion || 'chennai';
            this.setRichPresence(region, 'exploring');
          }
        };
        setTimeout(checkRegion, 2000);
      }
    }

    async unlockAchievement(id) {
      if (!this.service || !this.service.achievements) return false;

      // Invariant check: Player customization ceiling <= 5
      if (window.GameState && window.GameState.player) {
        if (window.GameState.player.customizationChangesUsed > 5) {
          window.GameState.player.customizationChangesUsed = 5;
        }
      }

      return await this.service.achievements.unlock(id);
    }

    setRichPresence(regionId, activity = 'exploring') {
      if (this.service && this.service.richPresence) {
        this.service.richPresence.setPresence(regionId, activity);
      }
    }

    showOverlay(dialog = 'friends') {
      if (this.service && this.service.overlay) {
        return this.service.overlay.showOverlay(dialog);
      }
      return false;
    }

    isFeatureSupported(featureName) {
      if (!this.service) return false;
      const caps = this.service.getCapabilities();
      return !!caps[featureName];
    }

    getPlatformUser() {
      return this.service ? this.service.getUser() : null;
    }

    isOnline() {
      return this.service ? this.service.isOnline() : false;
    }

    addListener(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    _notifyListeners(data) {
      this.listeners.forEach(fn => {
        try { fn(data); } catch (e) {}
      });
    }
  }

  window.PlatformIntegrationSystem = new PlatformIntegrationSystem();
})();
