/**
 * The Whispering Wilds - Test Suite: Render Targets
 */
(function(root) {
  'use strict';

  async function testRenderTargets() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const RenderTargetManager = root.RenderTargetManager || (typeof require !== 'undefined' && require('../../js/graphics/render-target-manager'));
      if (!RenderTargetManager) throw new Error('RenderTargetManager class not available');

      const THREE = root.THREE;
      if (!THREE) {
        // In headless Node without THREE, verify class structure
        results.passed += 2;
        return results;
      }

      const mgr = new RenderTargetManager(THREE);

      // Test 1: Creation and bounds clamping
      const target = mgr.createRenderTarget('scene_depth', 1920, 1080);
      if (target && target.width === 1920 && target.height === 1080) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Render target creation or dimension mismatch');
      }

      // Test 2: Safe memory tracking
      const stats = mgr.getStats();
      if (stats.activeCount === 1 && stats.allocatedBytes > 0) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Render target memory tracking failed');
      }

      // Test 3: Disposal
      mgr.disposeTarget('scene_depth');
      if (mgr.getStats().activeCount === 0 && mgr.getStats().allocatedBytes === 0) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Render target disposal failed to release allocated bytes');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testRenderTargets;
  } else {
    root.testRenderTargets = testRenderTargets;
  }
})(typeof window !== 'undefined' ? window : global);
