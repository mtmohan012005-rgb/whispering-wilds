/**
 * The Whispering Wilds - Display Adapter
 * Introspects screen geometry, aspect ratios, DPI scaling, and multi-monitor hot-swap.
 * Enforces safe render limits to prevent Retina/4K performance collapses.
 */
(function(root) {
  'use strict';

  class DisplayAdapter {
    constructor() {
      this.screenWidth = 1920;
      this.screenHeight = 1080;
      this.windowWidth = 1920;
      this.windowHeight = 1080;
      this.dpr = 1.0;
      this.safeDprLimit = 2.0;
      this.aspectRatio = 16 / 9;
      this.aspectClass = '16:9';
      this.isFullscreen = false;
      this.fullscreenCapable = true;
      this.listeners = [];

      this.detect();
      this.bindEvents();
    }

    detect() {
      if (typeof window === 'undefined') return;

      this.screenWidth = (window.screen && window.screen.width) || 1920;
      this.screenHeight = (window.screen && window.screen.height) || 1080;
      this.windowWidth = window.innerWidth || this.screenWidth;
      this.windowHeight = window.innerHeight || this.screenHeight;
      this.dpr = window.devicePixelRatio || 1.0;

      // Aspect ratio
      if (this.windowHeight > 0) {
        this.aspectRatio = this.windowWidth / this.windowHeight;
      } else {
        this.aspectRatio = 16 / 9;
      }

      if (Math.abs(this.aspectRatio - (16 / 9)) < 0.05) {
        this.aspectClass = '16:9';
      } else if (Math.abs(this.aspectRatio - (16 / 10)) < 0.05) {
        this.aspectClass = '16:10';
      } else if (this.aspectRatio >= 2.2) {
        this.aspectClass = '21:9';
      } else {
        this.aspectClass = 'UNUSUAL';
      }

      this.isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );

      this.fullscreenCapable = !!(
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled
      );
    }

    bindEvents() {
      if (typeof window === 'undefined') return;

      const onResize = () => {
        const prevW = this.windowWidth;
        const prevH = this.windowHeight;
        const prevDpr = this.dpr;

        this.detect();

        if (prevW !== this.windowWidth || prevH !== this.windowHeight || prevDpr !== this.dpr) {
          this.notifyListeners({
            type: 'RESIZE',
            windowWidth: this.windowWidth,
            windowHeight: this.windowHeight,
            dpr: this.dpr,
            aspectClass: this.aspectClass
          });
        }
      };

      window.addEventListener('resize', onResize, { passive: true });

      // Screen change detection (for multi-monitor hot-swap)
      if (window.screen && 'onchange' in window.screen) {
        window.screen.addEventListener('change', () => {
          this.detect();
          this.notifyListeners({ type: 'SCREEN_CHANGE', screenWidth: this.screenWidth, screenHeight: this.screenHeight });
        });
      }
    }

    /**
     * Get safe clamped DPR for 3D rendering.
     * Prevents rendering at native 4K/Retina (e.g. 3.0 DPR) when it would exhaust GPU fillrate.
     */
    getSafeRenderDpr(maxAllowed = 1.5) {
      return Math.min(this.dpr, maxAllowed);
    }

    addListener(fn) {
      if (typeof fn === 'function' && !this.listeners.includes(fn)) {
        this.listeners.push(fn);
      }
    }

    removeListener(fn) {
      this.listeners = this.listeners.filter(l => l !== fn);
    }

    notifyListeners(event) {
      for (const listener of this.listeners) {
        try {
          listener(event);
        } catch (err) {
          console.error('[DisplayAdapter] Error in listener:', err);
        }
      }
    }

    getDisplayInfo() {
      return {
        screenWidth: this.screenWidth,
        screenHeight: this.screenHeight,
        windowWidth: this.windowWidth,
        windowHeight: this.windowHeight,
        dpr: this.dpr,
        safeRenderDpr: this.getSafeRenderDpr(),
        aspectRatio: this.aspectRatio,
        aspectClass: this.aspectClass,
        isFullscreen: this.isFullscreen,
        fullscreenCapable: this.fullscreenCapable
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisplayAdapter;
  } else {
    root.DisplayAdapter = DisplayAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
