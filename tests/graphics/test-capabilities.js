/**
 * The Whispering Wilds - Test Suite: Graphics Capabilities
 */
(function(root) {
  'use strict';

  async function testCapabilities() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const Detector = root.GraphicsCapabilityDetector || (typeof require !== 'undefined' && require('../../js/graphics/graphics-capability-detector'));
      if (!Detector) throw new Error('GraphicsCapabilityDetector class not available');

      const detector = new Detector();
      const caps = detector.getCapabilities();

      // Check texture limits
      if (caps.maxTextureSize >= 2048) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`maxTextureSize below required floor: ${caps.maxTextureSize}`);
      }

      // Check shader precision
      if (['highp', 'mediump', 'lowp'].includes(caps.shaderPrecision)) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Invalid shader precision: ${caps.shaderPrecision}`);
      }

      // Check WebGL availability
      if (caps.webgl1 || caps.webgl2) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Neither WebGL1 nor WebGL2 detected');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testCapabilities;
  } else {
    root.testCapabilities = testCapabilities;
  }
})(typeof window !== 'undefined' ? window : global);
