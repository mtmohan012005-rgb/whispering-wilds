/**
 * Platform Capabilities Unit Tests
 */

(function(root) {
  const PlatformCapabilities = typeof require !== 'undefined' ? require('../../platform/platform-capabilities') : root.PlatformCapabilities;
  const GenericPlatformProvider = typeof require !== 'undefined' ? require('../../platform/providers/generic-provider') : root.GenericPlatformProvider;
  const StorePlatformProvider = typeof require !== 'undefined' ? require('../../platform/providers/store-provider') : root.StorePlatformProvider;

  function runCapabilitiesTests() {
    const results = { name: 'PlatformCapabilitiesTests', passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) results.passed++;
      else { results.failed++; results.errors.push(msg); }
    }

    // 1. Capability flags defined
    assert(PlatformCapabilities.ACHIEVEMENTS === 'ACHIEVEMENTS', 'ACHIEVEMENTS flag valid');
    assert(PlatformCapabilities.CLOUD_SAVE === 'CLOUD_SAVE', 'CLOUD_SAVE flag valid');
    assert(PlatformCapabilities.OVERLAY === 'OVERLAY', 'OVERLAY flag valid');
    assert(PlatformCapabilities.CONTROLLER === 'CONTROLLER', 'CONTROLLER flag valid');

    // 2. Generic provider capabilities
    const generic = new GenericPlatformProvider();
    assert(generic.capabilities[PlatformCapabilities.ACHIEVEMENTS] === true, 'Generic supports achievements');
    assert(generic.capabilities[PlatformCapabilities.CONTROLLER] === true, 'Generic supports controllers');
    assert(generic.capabilities[PlatformCapabilities.CLOUD_SAVE] === false, 'Generic disables cloud save (direct offline)');

    // 3. Store provider capabilities
    const store = new StorePlatformProvider();
    assert(store.capabilities[PlatformCapabilities.ACHIEVEMENTS] === true, 'Store supports achievements');
    assert(store.capabilities[PlatformCapabilities.CLOUD_SAVE] === true, 'Store supports cloud save');
    assert(store.capabilities[PlatformCapabilities.OVERLAY] === true, 'Store supports overlay');

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runCapabilitiesTests };
    if (require.main === module) {
      const r = runCapabilitiesTests();
      console.log(`[CapabilitiesTest] Passed: ${r.passed}, Failed: ${r.failed}`);
      if (r.failed > 0) process.exit(1);
    }
  } else {
    root.testPlatformCapabilities = runCapabilitiesTests;
  }
})(typeof window !== 'undefined' ? window : global);
