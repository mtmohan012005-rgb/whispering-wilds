// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLATFORM OVERLAY SYSTEM
// Listens to storefront overlay events, auto-pauses single-player, and resets inputs.
// ============================================================================

(function() {
  class PlatformOverlaySystem {
    constructor() {
      this.isOverlayActive = false;
    }

    init() {
      if (window.PlatformService && window.PlatformService.overlay) {
        window.PlatformService.overlay.addListener((active) => {
          this.handleOverlayState(active);
        });
      }
      return this;
    }

    handleOverlayState(active) {
      this.isOverlayActive = !!active;

      if (this.isOverlayActive) {
        // 1. Reset transient input state in InputManager
        if (window.InputManager && typeof window.InputManager.resetTransientInputs === 'function') {
          window.InputManager.resetTransientInputs();
        }

        // 2. Open pause menu in single-player
        if (window.PauseMenu && typeof window.PauseMenu.open === 'function') {
          window.PauseMenu.open();
        }
      }
    }
  }

  window.PlatformOverlaySystem = new PlatformOverlaySystem();
})();
