/**
 * Platform Cloud Save & Conflict Resolution Unit Tests
 */

(function(root) {
  const PlatformCloud = typeof require !== 'undefined' ? require('../../platform/platform-cloud') : root.PlatformCloud;
  const DevelopmentPlatformProvider = typeof require !== 'undefined' ? require('../../platform/providers/development-provider') : root.DevelopmentPlatformProvider;
  const PlatformSession = typeof require !== 'undefined' ? require('../../platform/platform-session') : root.PlatformSession;

  async function runCloudTests() {
    const results = { name: 'PlatformCloudTests', passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) results.passed++;
      else { results.failed++; results.errors.push(msg); }
    }

    const provider = new DevelopmentPlatformProvider();
    await provider.initialize();
    const session = new PlatformSession(provider);
    await session.init();

    const cloud = new PlatformCloud(provider, session);

    // 1. Prepare valid cloud package
    const localSave = {
      version: '3.0.0',
      profileId: 'prof_test',
      timestamp: 1720000000000,
      world: { currentRegion: 'pichavaram' },
      story: { chapter: 2 },
      player: { customizationChangesUsed: 4 }
    };

    const pkg = cloud.preparePackage(localSave);
    assert(pkg.checksum && pkg.checksum.startsWith('ck_'), 'Checksum generated on package');
    assert(pkg.regionId === 'pichavaram', 'Region metadata packaged');
    assert(pkg.customizationChangesUsed === 4, 'Customization ceiling packaged');

    // 2. Validate cloud package
    const validation = cloud.validateCloudPackage(pkg);
    assert(validation.valid === true, 'Package passed validation');

    // 3. Reject corrupted checksum
    const corruptPkg = { ...pkg, checksum: 'ck_invalid' };
    const corruptVal = cloud.validateCloudPackage(corruptPkg);
    assert(corruptVal.valid === false, 'Corrupted package rejected by validator');

    // 4. Reject illegal customization ceiling (>5)
    const illegalSave = { ...localSave, player: { customizationChangesUsed: 6 } };
    const illegalPkg = {
      ...pkg,
      payload: JSON.stringify(illegalSave),
      checksum: cloud._calculateChecksum(JSON.stringify(illegalSave))
    };
    const illegalVal = cloud.validateCloudPackage(illegalPkg);
    assert(illegalVal.valid === false, 'Cloud package violating customization ceiling (>5) rejected');

    // 5. Upload & Download
    const uploadRes = await cloud.uploadSave('slot_1', localSave);
    assert(uploadRes.success === true, 'Upload succeeded');

    const downloadRes = await cloud.downloadSave('slot_1');
    assert(downloadRes.success === true && downloadRes.data.profileId === 'prof_test', 'Download succeeded');

    // 6. Conflict detection
    const conflictingLocal = {
      timestamp: (pkg.timestamp || Date.now()) + 60000, // Genuinely newer local
      checksum: 'ck_diff',
      regionId: 'nilgiris',
      storyChapter: 3
    };
    const conflict = cloud.detectConflict(conflictingLocal, pkg);
    assert(conflict.hasConflict === true, 'Conflict detected when local and cloud differ');
    assert(conflict.recommended === 'LOCAL', 'Recommended LOCAL when local is newer');

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runCloudTests };
    if (require.main === module) {
      runCloudTests().then(r => {
        console.log(`[CloudTest] Passed: ${r.passed}, Failed: ${r.failed}`);
        if (r.failed > 0) process.exit(1);
      });
    }
  } else {
    root.testPlatformCloud = runCloudTests;
  }
})(typeof window !== 'undefined' ? window : global);
