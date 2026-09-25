/**
 * The Whispering Wilds - Test Suite: Storage Adapter
 */
(function(root) {
  'use strict';

  async function testStorageAdapter() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const StorageAdapter = root.StorageAdapter || (typeof require !== 'undefined' && require('../../js/platform/storage-adapter'));
      if (!StorageAdapter) throw new Error('StorageAdapter class not available');

      const adapter = new StorageAdapter();
      const caps = adapter.getCapabilities();

      if (caps.localStorageAvailable || caps.filesystemAvailable) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('No viable storage mechanism reported');
      }

      // Safe write test
      const testKey = '__ww_test_write_key__';
      const testData = JSON.stringify({ version: '1.0.0', timestamp: Date.now() });

      await adapter.safeWrite(testKey, testData);
      results.passed++;

      // Clean up
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(testKey);
        window.localStorage.removeItem(testKey + '_backup');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testStorageAdapter;
  } else {
    root.testStorageAdapter = testStorageAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
