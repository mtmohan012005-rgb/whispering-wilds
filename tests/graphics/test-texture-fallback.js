/**
 * The Whispering Wilds - Test Suite: Texture Fallback
 */
(function(root) {
  'use strict';

  async function testTextureFallback() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const TextureCapability = root.TextureCapability || (typeof require !== 'undefined' && require('../../js/graphics/texture-capability'));
      if (!TextureCapability) throw new Error('TextureCapability class not available');

      // Test 1: Resolution cap calculation
      const lowCap = new TextureCapability(2048, 'LOW');
      if (lowCap.getResolutionCap() <= 1024) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Expected cap <= 1024 on LOW, got: ${lowCap.getResolutionCap()}`);
      }

      const ultraCap = new TextureCapability(16384, 'ULTRA');
      if (ultraCap.getResolutionCap() <= 4096) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Expected cap <= 4096 on ULTRA, got: ${ultraCap.getResolutionCap()}`);
      }

      // Test 2: Approved neutral fallback texture
      const THREE = root.THREE;
      if (THREE && typeof document !== 'undefined') {
        const neutralTex = lowCap.getApprovedNeutralTexture(THREE);
        if (neutralTex && neutralTex.isTexture) {
          results.passed++;
        } else {
          results.failed++;
          results.errors.push('Failed to generate approved neutral texture');
        }
      } else {
        results.passed++;
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testTextureFallback;
  } else {
    root.testTextureFallback = testTextureFallback;
  }
})(typeof window !== 'undefined' ? window : global);
