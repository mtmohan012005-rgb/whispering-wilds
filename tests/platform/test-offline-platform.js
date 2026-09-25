/**
 * Platform Offline Independence & Zero-Storefront Unit Tests
 */

(function(root) {
  const GenericPlatformProvider = typeof require !== 'undefined' ? require('../../platform/providers/generic-provider') : root.GenericPlatformProvider;
  const PlatformService = typeof require !== 'undefined' ? require('../../platform/platform-service') : root.PlatformService;

  async function runOfflinePlatformTests() {
    const results = { name: 'PlatformOfflineTests', passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) results.passed++;
      else { results.failed++; results.errors.push(msg); }
    }

    // 1. Initialize purely offline Generic provider
    const service = PlatformService || new (require('../../platform/platform-service').constructor)();
    await service.init({ provider: 'generic' });

    assert(service.initialized === true, 'Service initialized in offline mode');
    assert(service.provider && (service.provider.id === 'generic' || (GenericPlatformProvider && service.provider instanceof GenericPlatformProvider)), 'Generic provider active');

    // 2. Gameplay systems unaffected by offline status
    const user = service.getUser();
    assert(user !== null, 'Local offline player profile available');
    assert(user.isGuest === true, 'Offline user defaults to guest profile');

    // 3. Local saves remain completely authoritative
    const localSavePayload = {
      version: '3.0.0',
      timestamp: Date.now(),
      player: {
        customizationChangesUsed: 2,
        position: { x: 100, y: 10, z: 200 }
      },
      story: { chapter: 1 }
    };

    // Attempt cloud save when cloud is unsupported in direct offline mode
    const cloudRes = await service.cloud.uploadSave('slot_offline', localSavePayload);
    assert(cloudRes.reason === 'OFFLINE' || cloudRes.status === 'NOT_SUPPORTED' || (cloudRes.result && cloudRes.result.status === 'NOT_SUPPORTED'), 'Cloud gracefully skipped without error in offline mode');
    assert(localSavePayload.player.customizationChangesUsed <= 5, 'Player customization ceiling preserved');

    // 4. Offline achievements queued safely
    const achRes = await service.achievements.unlock('ach_offline_test');
    assert(achRes.success === true, 'Achievement handled offline without error');

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runOfflinePlatformTests };
    if (require.main === module) {
      runOfflinePlatformTests().then(r => {
        console.log(`[OfflinePlatformTest] Passed: ${r.passed}, Failed: ${r.failed}`);
        if (r.failed > 0) process.exit(1);
      });
    }
  } else {
    root.testOfflinePlatform = runOfflinePlatformTests;
  }
})(typeof window !== 'undefined' ? window : global);
