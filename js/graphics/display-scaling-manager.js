/**
 * The Whispering Wilds - Display Scaling Manager
 * Enforces DPR capping, ultrawide aspect ratio camera preservation, and UI containment.
 * Prevents extreme FOV distortion and protects GPU fillrate on 4K/Retina displays.
 */
(function(root) {
  'use strict';

  class DisplayScalingManager {
    constructor() {
      this.baseVerticalFov = 60.0;
      this.minSafeFov = 45.0;
      this.maxSafeFov = 95.0;
      this.maxRenderDpr = 1.5; // Cap 3D pixel ratio to 1.5 to protect fillrate
    }

    /**
     * Calculates optimal render dimensions based on window size, DPR, and performance renderScale.
     */
    calculateRenderDimensions(width, height, dpr = 1.0, renderScale = 1.0) {
      const clampedDpr = Math.min(dpr, this.maxRenderDpr);
      const scaledWidth = Math.floor(width * clampedDpr * renderScale);
      const scaledHeight = Math.floor(height * clampedDpr * renderScale);

      return {
        width: Math.max(320, scaledWidth),
        height: Math.max(240, scaledHeight),
        dpr: clampedDpr
      };
    }

    /**
     * Calculates safe camera FOV for ultrawide (21:9) and unusual aspect ratios.
     * Keeps vertical FOV consistent while adjusting horizontal framing naturally.
     */
    calculateSafeCameraFov(aspectRatio) {
      if (aspectRatio >= 2.2) {
        // Ultrawide (21:9 or 32:9): Slightly reduce vertical FOV to maintain natural eye-level framing
        const adjustedFov = this.baseVerticalFov * 0.95;
        return Math.max(this.minSafeFov, Math.min(this.maxSafeFov, adjustedFov));
      } else if (aspectRatio < 1.3) {
        // Tall aspect ratios (e.g. 4:3 or 5:4)
        const adjustedFov = this.baseVerticalFov * 1.1;
        return Math.max(this.minSafeFov, Math.min(this.maxSafeFov, adjustedFov));
      }
      return this.baseVerticalFov;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisplayScalingManager;
  } else {
    root.DisplayScalingManager = DisplayScalingManager;
  }
})(typeof window !== 'undefined' ? window : global);
