// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLATFORM SESSION SYSTEM
// Manages platform connection lifecycle, offline state transitions, and auto-sync.
// ============================================================================

(function() {
  class PlatformSessionSystem {
    constructor() {
      this.isOnline = false;
      this.reconnectTimer = null;
    }

    init() {
      if (window.PlatformService && window.PlatformService.session) {
        window.PlatformService.session.addListener((sessionData) => {
          this._onSessionChanged(sessionData);
        });
        this.isOnline = window.PlatformService.session.isOnline;
      }
      return this;
    }

    _onSessionChanged(sessionData) {
      this.isOnline = !!sessionData.isOnline;

      if (this.isOnline) {
        // Automatically sync queued achievements and pending cloud saves
        if (window.PlatformService && window.PlatformService.achievements) {
          window.PlatformService.achievements.syncPendingQueue();
        }
      }
    }
  }

  window.PlatformSessionSystem = new PlatformSessionSystem();
})();
