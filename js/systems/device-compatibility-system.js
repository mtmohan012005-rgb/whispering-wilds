// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DEVICE COMPATIBILITY SYSTEM
// Screen resolution, high-DPI scaling cap, ultrawide (21:9), Alt-Tab & sleep/wake
// ============================================================================

(function() {
  'use strict';

  class DeviceCompatibilitySystem {
    constructor() {
      this.isUltrawide = false;
      this.aspectRatio = 16 / 9;
      this.dprCap = 1.5;
      this.effectiveDPR = 1.0;
      this.displayMode = 'windowed';
      this.resolutionWidth = 1920;
      this.resolutionHeight = 1080;
      this.isPageVisible = true;
      this.lastVisibilityChangeTime = performance.now();

      this._initListeners();
      this.updateDisplayMetrics();
    }

    _initListeners() {
      if (typeof window === 'undefined') return;

      window.addEventListener('resize', () => {
        this.updateDisplayMetrics();
        this._notifyRendererResize();
      });

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          this._handleVisibilityChange();
        });

        window.addEventListener('focus', () => {
          this._handleFocusRestored();
        });
      }
    }

    setDprCap(cap) {
      this.dprCap = Math.max(1.0, Math.min(2.5, cap || 1.5));
      this.updateDisplayMetrics();
      this._notifyRendererResize();
    }

    updateDisplayMetrics() {
      if (typeof window === 'undefined') return;

      const w = window.innerWidth || 1920;
      const h = window.innerHeight || 1080;
      this.resolutionWidth = w;
      this.resolutionHeight = h;
      this.aspectRatio = w / Math.max(1, h);

      // Ultrawide check (>= 2.1:1, e.g. 21:9 is ~2.33)
      this.isUltrawide = this.aspectRatio >= 2.1;

      const rawDPR = window.devicePixelRatio || 1.0;
      this.effectiveDPR = Math.min(rawDPR, this.dprCap);
    }

    _notifyRendererResize() {
      if (window.threeWorld?.renderer && window.threeWorld?.camera) {
        const w = this.resolutionWidth;
        const h = this.resolutionHeight;

        window.threeWorld.renderer.setPixelRatio(this.effectiveDPR);
        window.threeWorld.renderer.setSize(w, h, false);

        window.threeWorld.camera.aspect = this.aspectRatio;

        // Ultrawide FOV adjustment: prevent stretching
        if (this.isUltrawide) {
          window.threeWorld.camera.fov = 55; // Slightly narrower vertical FOV to maintain horizontal composition
        } else {
          window.threeWorld.camera.fov = 60;
        }
        window.threeWorld.camera.updateProjectionMatrix();
      }
    }

    _handleVisibilityChange() {
      const isHidden = document.hidden;
      this.isPageVisible = !isHidden;
      this.lastVisibilityChangeTime = performance.now();

      if (isHidden) {
        console.log('[DeviceCompatibilitySystem] Tab/Window lost focus (Alt-Tab). Auto-pausing simulation.');
        if (window.GameLifecycle && typeof window.GameLifecycle.pause === 'function') {
          window.GameLifecycle.pause('ALT_TAB_FOCUS_LOST');
        }
      } else {
        console.log('[DeviceCompatibilitySystem] Tab/Window restored. Clamping frame delta & resetting timing baseline.');
        this._handleFocusRestored();
      }
    }

    _handleFocusRestored() {
      // 1. Reset frame budget timing baseline to avoid giant deltas
      if (window.frameBudgetSystem) {
        window.frameBudgetSystem.lastFrameTimestamp = performance.now();
      }

      // 2. Clear stuck input states
      if (window.InputManager && typeof window.InputManager.clearAllKeys === 'function') {
        window.InputManager.clearAllKeys();
      }
    }

    async requestFullscreen() {
      if (typeof document === 'undefined') return false;
      const el = document.documentElement;
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
        this.displayMode = 'fullscreen';
        return true;
      } catch (err) {
        console.warn('[DeviceCompatibilitySystem] Fullscreen request was denied:', err);
        return false;
      }
    }

    async exitFullscreen() {
      if (typeof document === 'undefined') return false;
      try {
        if (document.exitFullscreen && document.fullscreenElement) {
          await document.exitFullscreen();
        }
        this.displayMode = 'windowed';
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  const instance = new DeviceCompatibilitySystem();

  if (typeof window !== 'undefined') {
    window.DeviceCompatibilitySystem = DeviceCompatibilitySystem;
    window.deviceCompatibilitySystem = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DeviceCompatibilitySystem, deviceCompatibilitySystem: instance };
  }
})();
