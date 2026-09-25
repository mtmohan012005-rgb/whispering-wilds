/**
 * The Whispering Wilds - Test Suite: OS Adapter
 */
(function(root) {
  'use strict';

  async function testOSAdapter() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const OSAdapter = root.OSAdapter || (typeof require !== 'undefined' && require('../../js/platform/os-adapter'));
      if (!OSAdapter) throw new Error('OSAdapter class not available');

      const adapter = new OSAdapter();
      const os = adapter.getOS();
      const arch = adapter.getArchitecture();
      const path = adapter.getUserDataPath();

      // Check OS detection validity
      if (['WINDOWS', 'MACOS', 'LINUX', 'UNKNOWN'].includes(os)) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Invalid OS returned: ${os}`);
      }

      // Check Architecture validity
      if (['x64', 'arm64', 'UNKNOWN'].includes(arch)) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Invalid Architecture returned: ${arch}`);
      }

      // Check UserDataPath validity
      if (typeof path === 'string' && path.length > 0) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Empty or invalid user data path');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testOSAdapter;
  } else {
    root.testOSAdapter = testOSAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
