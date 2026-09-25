// ============================================================================
// THE WHISPERING WILDS - AUDIO REGISTRY TEST SUITE
// Validates asset catalog, license integrity, query interfaces, and fallbacks.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Audio Registry QA Tests ---');
    let passed = 0;
    let failed = 0;
    const errors = [];

    function assert(cond, msg) {
      if (cond) {
        passed++;
      } else {
        failed++;
        errors.push(msg);
        console.error(`[FAIL] ${msg}`);
      }
    }

    try {
      const registry = window.AudioRegistry;
      assert(registry !== null && (typeof registry === 'object' || typeof registry === 'function'), 'AudioRegistry must be instantiated on window');

      // 1. Initialize registry with manifest
      registry.init();
      const allAssets = registry.getAll();
      assert(allAssets.length >= 20, `Registry must contain registered assets (found ${allAssets.length})`);

      // 2. Querying by ID
      const introAsset = registry.get('audio.voice.murugan.intro_01');
      assert(introAsset !== null, 'Murugan intro voice asset must exist');
      assert(introAsset.language === 'ta', 'Murugan intro must be registered as Tamil (ta)');
      assert(introAsset.type === 'voice', 'Murugan intro type must be voice');
      assert(introAsset.critical === true, 'Murugan story line must be marked critical');

      // 3. Querying by Category
      const musicAssets = registry.getByCategory('music');
      assert(musicAssets.length >= 6, `Music category must contain regional and score cues (found ${musicAssets.length})`);

      const wildlifeAssets = registry.getByCategory('wildlife');
      assert(wildlifeAssets.length >= 3, `Wildlife category must contain species cues (found ${wildlifeAssets.length})`);

      // 4. Querying by Region
      const nilgiriAssets = registry.getByRegion('nilgiris');
      assert(nilgiriAssets.length >= 2, `Nilgiris region must have regional assets (found ${nilgiriAssets.length})`);

      // 5. License Integrity Check
      const licenseReport = registry.validateLicenseIntegrity();
      assert(licenseReport.valid === true, `All production audio assets must have valid licenses (violations: ${JSON.stringify(licenseReport.violations)})`);

      // 6. Unknown asset handling
      const missing = registry.get('audio.nonexistent.fake');
      assert(missing === null, 'Nonexistent asset must return null');

      // 7. Customization Invariant
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;
      assert(customUsed <= 5, `Customization limit <= 5 preserved (used: ${customUsed})`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled exception in testAudioRegistry: ${err.message}`);
    }

    console.log(`✓ Audio Registry QA Tests: ${passed} passed, ${failed} failed`);
    return { passed, failed, errors };
  }

  window.testAudioRegistry = runTests;
})();
