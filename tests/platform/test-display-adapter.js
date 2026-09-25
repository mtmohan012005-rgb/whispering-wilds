/**
 * The Whispering Wilds - Test Suite: Display Adapter
 */
(function(root) {
  'use strict';

  async function testDisplayAdapter() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const DisplayAdapter = root.DisplayAdapter || (typeof require !== 'undefined' && require('../../js/platform/display-adapter'));
      if (!DisplayAdapter) throw new Error('DisplayAdapter class not available');

      const adapter = new DisplayAdapter();
      const info = adapter.getDisplayInfo();

      if (info.screenWidth > 0 && info.screenHeight > 0) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Invalid screen dimensions');
      }

      if (['16:9', '16:10', '21:9', 'UNUSUAL'].includes(info.aspectClass)) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Invalid aspect class: ${info.aspectClass}`);
      }

      // Safe render DPR clamp test
      const safeDpr = adapter.getSafeRenderDpr(1.5);
      if (safeDpr <= 1.5 && safeDpr > 0) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Safe render DPR not correctly clamped: ${safeDpr}`);
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testDisplayAdapter;
  } else {
    root.testDisplayAdapter = testDisplayAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
