/**
 * The Whispering Wilds - Test Suite: Input Adapter
 */
(function(root) {
  'use strict';

  async function testInputAdapter() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const InputAdapter = root.InputAdapter || (typeof require !== 'undefined' && require('../../js/platform/input-adapter'));
      if (!InputAdapter) throw new Error('InputAdapter class not available');

      const adapter = new InputAdapter();
      const caps = adapter.getCapabilities();

      if (caps.keyboard === true && caps.mouse === true) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Keyboard or mouse missing in input capabilities');
      }

      if (typeof caps.gamepad === 'boolean') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Gamepad boolean capability missing');
      }

      // Reset transient inputs test
      adapter.resetTransientInputs();
      results.passed++;

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testInputAdapter;
  } else {
    root.testInputAdapter = testInputAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
