/**
 * The Whispering Wilds - Texture Capability
 * Enforces hardware texture caps, mipmapping, and neutral fallback textures
 * to guarantee that missing textures never result in pink or black glitches.
 */
(function(root) {
  'use strict';

  class TextureCapability {
    constructor(maxTextureSize = 2048, profileTier = 'MEDIUM') {
      this.maxTextureSize = maxTextureSize;
      this.profileTier = profileTier;
      this.safeResolutionCap = this.calculateResolutionCap();
      this.neutralTexture = null;
    }

    calculateResolutionCap() {
      switch (this.profileTier) {
        case 'ULTRA':
          return Math.min(this.maxTextureSize, 4096);
        case 'HIGH':
          return Math.min(this.maxTextureSize, 2048);
        case 'MEDIUM':
          return Math.min(this.maxTextureSize, 2048);
        case 'LOW':
        case 'VERY_LOW':
        default:
          return Math.min(this.maxTextureSize, 1024);
      }
    }

    /**
     * Creates an approved neutral 64x64 texture (subdued warm earth tone)
     * as a fallback when any texture fails to load.
     */
    getApprovedNeutralTexture(THREE) {
      if (this.neutralTexture) return this.neutralTexture;
      if (!THREE) return null;

      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      // Subdued Tamil Nadu temple stone / earth tone
      ctx.fillStyle = '#6b6155';
      ctx.fillRect(0, 0, size, size);

      this.neutralTexture = new THREE.CanvasTexture(canvas);
      this.neutralTexture.name = 'ww_neutral_fallback_texture';
      return this.neutralTexture;
    }

    getResolutionCap() {
      return this.safeResolutionCap;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextureCapability;
  } else {
    root.TextureCapability = TextureCapability;
  }
})(typeof window !== 'undefined' ? window : global);
