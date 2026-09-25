/**
 * The Whispering Wilds - Display Compatibility System
 * Coordinates window resize, DPR changes, and monitor hot-swaps.
 * Safely updates renderer size and camera aspect ratio without rebuilding GameState.
 */
(function(root) {
  'use strict';

  class DisplayCompatibilitySystem {
    constructor() {
      this.bindEvents();
    }

    bindEvents() {
      if (typeof window === 'undefined') return;

      window.addEventListener('resize', () => {
        this.recalculateDisplayLayout();
      }, { passive: true });
    }

    recalculateDisplayLayout() {
      if (typeof window === 'undefined') return;

      const width = window.innerWidth || 1920;
      const height = window.innerHeight || 1080;
      const dpr = Math.min(window.devicePixelRatio || 1.0, 1.5);
      const aspect = width / Math.max(1, height);

      // 1. Update ThreeWorld camera and renderer
      if (root.ThreeWorld) {
        if (root.ThreeWorld.camera) {
          root.ThreeWorld.camera.aspect = aspect;
          root.ThreeWorld.camera.updateProjectionMatrix();
        }
        if (root.ThreeWorld.renderer) {
          root.ThreeWorld.renderer.setSize(width, height, false);
          root.ThreeWorld.renderer.setPixelRatio(dpr);
        }
      }

      // 2. Adjust HUD containment for ultrawide (21:9)
      const hudContainer = document.getElementById('hud-container');
      if (hudContainer) {
        if (aspect >= 2.2) {
          // Ultrawide: Center HUD horizontally to keep status within player's peripheral vision
          hudContainer.style.maxWidth = '1920px';
          hudContainer.style.margin = '0 auto';
        } else {
          hudContainer.style.maxWidth = '100%';
        }
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisplayCompatibilitySystem;
  } else {
    root.DisplayCompatibilitySystem = DisplayCompatibilitySystem;
  }
})(typeof window !== 'undefined' ? window : global);
