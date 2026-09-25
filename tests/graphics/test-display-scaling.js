/**
 * The Whispering Wilds - Test Suite: Display Scaling
 */
(function(root) {
  'use strict';

  async function testDisplayScaling() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const DisplayScalingManager = root.DisplayScalingManager || (typeof require !== 'undefined' && require('../../js/graphics/display-scaling-manager'));
      if (!DisplayScalingManager) throw new Error('DisplayScalingManager class not available');

      const mgr = new DisplayScalingManager();

      // Test 1: Retina DPR clamping (DPR = 3.0 on high-end Retina clamped to max 1.5 for 3D)
      const dims = mgr.calculateRenderDimensions(1920, 1080, 3.0, 1.0);
      if (dims.dpr <= 1.5 && dims.width === 1920 * 1.5) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Retina DPR was not clamped safely: ${dims.dpr}`);
      }

      // Test 2: Dynamic render scale scaling
      const scaledDims = mgr.calculateRenderDimensions(1920, 1080, 1.0, 0.75);
      if (scaledDims.width === 1440 && scaledDims.height === 810) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Render scale mismatch: ${scaledDims.width}x${scaledDims.height}`);
      }

      // Test 3: Ultrawide FOV protection (21:9 aspect ratio)
      const ultrawideFov = mgr.calculateSafeCameraFov(21 / 9);
      if (ultrawideFov >= 45 && ultrawideFov <= 95) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Ultrawide FOV outside safe bounds: ${ultrawideFov}`);
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testDisplayScaling;
  } else {
    root.testDisplayScaling = testDisplayScaling;
  }
})(typeof window !== 'undefined' ? window : global);
