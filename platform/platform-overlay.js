/**
 * PlatformOverlay - Storefront Overlay Integration & Input Lock Guard
 * Pauses single-player gameplay and resets transient input state when external overlays open.
 */

(function(root) {
  class PlatformOverlay {
    constructor(provider) {
      this.provider = provider;
      this.isOverlayActive = false;
      this.listeners = new Set();
    }

    init() {
      if (this.provider && typeof this.provider.onOverlayStateChanged === 'function') {
        this.provider.onOverlayStateChanged((active) => {
          this.setOverlayActive(active);
        });
      }
      return this;
    }

    setOverlayActive(active) {
      this.isOverlayActive = !!active;

      // Automatically reset transient game input to prevent stuck movement / camera spins
      if (typeof window !== 'undefined' && window.InputManager && typeof window.InputManager.resetTransientInputs === 'function') {
        window.InputManager.resetTransientInputs();
      }

      // Automatically trigger single-player pause if overlay opens
      if (this.isOverlayActive) {
        if (typeof window !== 'undefined' && window.PauseMenu && typeof window.PauseMenu.open === 'function') {
          window.PauseMenu.open();
        }
      }

      this._notifyListeners(this.isOverlayActive);
    }

    showOverlay(dialog = 'friends') {
      if (!this.provider || typeof this.provider.showOverlay !== 'function') {
        return false;
      }
      try {
        return this.provider.showOverlay(dialog);
      } catch (e) {
        return false;
      }
    }

    addListener(fn) {
      this.listeners.add(fn);
      return () => this.listeners.delete(fn);
    }

    _notifyListeners(active) {
      this.listeners.forEach(fn => {
        try { fn(active); } catch (e) {}
      });
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlatformOverlay;
  } else {
    root.PlatformOverlay = PlatformOverlay;
  }
})(typeof window !== 'undefined' ? window : global);
