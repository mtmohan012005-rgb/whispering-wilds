/**
 * PlatformService - Master Platform Integration Singleton & Service Facade
 * Central entry point for all storefront and platform subsystems.
 * Maintains full offline autonomy for single-player exploration.
 */

(function(root) {
  const GenericPlatformProvider = typeof require !== 'undefined' ? require('./providers/generic-provider') : root.GenericPlatformProvider;
  const StorePlatformProvider = typeof require !== 'undefined' ? require('./providers/store-provider') : root.StorePlatformProvider;
  const DevelopmentPlatformProvider = typeof require !== 'undefined' ? require('./providers/development-provider') : root.DevelopmentPlatformProvider;

  const PlatformSession = typeof require !== 'undefined' ? require('./platform-session') : root.PlatformSession;
  const PlatformAchievements = typeof require !== 'undefined' ? require('./platform-achievements') : root.PlatformAchievements;
  const PlatformCloud = typeof require !== 'undefined' ? require('./platform-cloud') : root.PlatformCloud;
  const PlatformOverlay = typeof require !== 'undefined' ? require('./platform-overlay') : root.PlatformOverlay;
  const PlatformRichPresence = typeof require !== 'undefined' ? require('./platform-rich-presence') : root.PlatformRichPresence;
  const PlatformFriends = typeof require !== 'undefined' ? require('./platform-friends') : root.PlatformFriends;
  const PlatformController = typeof require !== 'undefined' ? require('./platform-controller') : root.PlatformController;
  const PlatformInput = typeof require !== 'undefined' ? require('./platform-input') : root.PlatformInput;

  class PlatformService {
    constructor() {
      this.provider = null;
      this.session = null;
      this.achievements = null;
      this.cloud = null;
      this.overlay = null;
      this.richPresence = null;
      this.friends = null;
      this.controller = null;
      this.input = null;
      this.initialized = false;
    }

    async init(config = {}) {
      const GenClass = typeof require !== 'undefined' ? require('./providers/generic-provider') : (root.GenericPlatformProvider || (typeof window !== 'undefined' && window.GenericPlatformProvider));
      const StoreClass = typeof require !== 'undefined' ? require('./providers/store-provider') : (root.StorePlatformProvider || (typeof window !== 'undefined' && window.StorePlatformProvider));
      const DevClass = typeof require !== 'undefined' ? require('./providers/development-provider') : (root.DevelopmentPlatformProvider || (typeof window !== 'undefined' && window.DevelopmentPlatformProvider));

      const SessionClass = typeof require !== 'undefined' ? require('./platform-session') : (root.PlatformSession || (typeof window !== 'undefined' && window.PlatformSession));
      const AchClass = typeof require !== 'undefined' ? require('./platform-achievements') : (root.PlatformAchievements || (typeof window !== 'undefined' && window.PlatformAchievements));
      const CloudClass = typeof require !== 'undefined' ? require('./platform-cloud') : (root.PlatformCloud || (typeof window !== 'undefined' && window.PlatformCloud));
      const OverlayClass = typeof require !== 'undefined' ? require('./platform-overlay') : (root.PlatformOverlay || (typeof window !== 'undefined' && window.PlatformOverlay));
      const PresenceClass = typeof require !== 'undefined' ? require('./platform-rich-presence') : (root.PlatformRichPresence || (typeof window !== 'undefined' && window.PlatformRichPresence));
      const FriendsClass = typeof require !== 'undefined' ? require('./platform-friends') : (root.PlatformFriends || (typeof window !== 'undefined' && window.PlatformFriends));
      const CtrlClass = typeof require !== 'undefined' ? require('./platform-controller') : (root.PlatformController || (typeof window !== 'undefined' && window.PlatformController));
      const InputClass = typeof require !== 'undefined' ? require('./platform-input') : (root.PlatformInput || (typeof window !== 'undefined' && window.PlatformInput));

      const providerType = config.provider || 'generic';

      switch (providerType) {
        case 'store':
          this.provider = new StoreClass();
          break;
        case 'development':
        case 'dev':
          this.provider = new DevClass();
          break;
        case 'generic':
        default:
          this.provider = new GenClass();
          break;
      }

      await this.provider.initialize();

      this.session = new SessionClass(this.provider);
      await this.session.init();

      this.achievements = new AchClass(this.provider, this.session);
      this.achievements.init();

      this.cloud = new CloudClass(this.provider, this.session);
      this.overlay = new OverlayClass(this.provider);
      this.overlay.init();

      this.richPresence = new PresenceClass(this.provider);
      this.friends = new FriendsClass(this.provider);

      this.controller = new CtrlClass();
      this.controller.init();

      this.input = new InputClass(this.controller);
      this.input.init();

      this.initialized = true;
      return this;
    }

    getCapabilities() {
      return this.provider ? this.provider.capabilities : {};
    }

    getUser() {
      return this.session ? this.session.currentUser : null;
    }

    isOnline() {
      return this.session ? this.session.isOnline : false;
    }

    async shutdown() {
      if (this.provider) {
        await this.provider.shutdown();
      }
      this.initialized = false;
    }
  }

  const instance = new PlatformService();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  } else {
    root.PlatformService = instance;
  }
})(typeof window !== 'undefined' ? window : global);
