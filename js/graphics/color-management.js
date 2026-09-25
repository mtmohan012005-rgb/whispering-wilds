/**
 * The Whispering Wilds - Color Management
 * Enforces correct sRGB output color space and tone mapping.
 * Audits against double-gamma correction and provides safe SDR fallback for HDR displays.
 */
(function(root) {
  'use strict';

  class ColorManagement {
    constructor() {
      this.isHdrSupported = false;
      this.detectHdr();
    }

    detectHdr() {
      if (typeof window !== 'undefined' && window.matchMedia) {
        try {
          this.isHdrSupported = window.matchMedia('(dynamic-range: high)').matches;
        } catch (_) {
          this.isHdrSupported = false;
        }
      }
    }

    applyColorPipeline(THREE, renderer) {
      if (!THREE || !renderer) return;

      // In Three.js r150+, SRGBColorSpace ensures linear workflow internally with sRGB display encoding
      if (THREE.SRGBColorSpace) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }

      // Consistent tone mapping (ACES Filmic) prevents washed-out highlights and blown-out whites
      if (THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
      }
    }

    /**
     * Audit texture encoding to prevent double gamma correction.
     * Color maps (albedo, diffuse) must use sRGB; Data maps (normal, roughness, metalness) must remain Linear.
     */
    auditTextureColorSpace(THREE, texture, isDataMap = false) {
      if (!THREE || !texture) return;

      if (isDataMap) {
        // Normal, roughness, metallic must NOT be gamma corrected
        texture.colorSpace = THREE.NoColorSpace || THREE.LinearSRGBColorSpace;
      } else {
        // Base color / albedo
        texture.colorSpace = THREE.SRGBColorSpace;
      }
    }

    getHdrStatus() {
      return {
        hdrSupported: this.isHdrSupported,
        outputMode: this.isHdrSupported ? 'SDR_COMPATIBLE' : 'SDR'
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorManagement;
  } else {
    root.ColorManagement = ColorManagement;
  }
})(typeof window !== 'undefined' ? window : global);
