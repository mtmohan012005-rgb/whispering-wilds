/**
 * The Whispering Wilds - Antialiasing Manager
 * Safely configures AA tiers (NONE, LOW, MEDIUM, HIGH) with automatic fallback.
 */
(function(root) {
  'use strict';

  class AntialiasingManager {
    constructor(capabilities = {}) {
      this.msaaSupported = capabilities.msaaSupported || false;
      this.maxSamples = capabilities.maxMsaaSamples || 1;
      this.currentMode = 'LOW';
    }

    resolveAntialiasing(requestedMode = 'MEDIUM') {
      switch (requestedMode) {
        case 'HIGH':
          if (this.msaaSupported && this.maxSamples >= 4) {
            this.currentMode = 'HIGH';
            return { mode: 'HIGH', samples: 4, postFxaa: false };
          }
          // Fall through to MEDIUM
        case 'MEDIUM':
          if (this.msaaSupported && this.maxSamples >= 2) {
            this.currentMode = 'MEDIUM';
            return { mode: 'MEDIUM', samples: 2, postFxaa: false };
          }
          // Fall through to LOW
        case 'LOW':
          this.currentMode = 'LOW';
          return { mode: 'LOW', samples: 0, postFxaa: true };
        case 'NONE':
        default:
          this.currentMode = 'NONE';
          return { mode: 'NONE', samples: 0, postFxaa: false };
      }
    }

    getCurrentMode() {
      return this.currentMode;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AntialiasingManager;
  } else {
    root.AntialiasingManager = AntialiasingManager;
  }
})(typeof window !== 'undefined' ? window : global);
