/**
 * tests/launcher/test-manifest.js
 * Verifies release manifest schema validation, required fields,
 * and differential manifest computation.
 */

(function () {
  'use strict';

  function runTestLauncherManifest() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const ManifestManager = window.ManifestManager;
    assert('ManifestManager is loaded', !!ManifestManager);

    const mm = new ManifestManager();

    // Test 1: Valid manifest passes
    const validManifest = {
      gameId: 'the-whispering-wilds',
      version: '1.2.0',
      buildId: 'WW_BUILD_2026_PROD',
      saveSchemaVersion: 3,
      files: [
        { path: 'index.html', size: 100, sha256: 'a'.repeat(64), critical: true }
      ]
    };
    const vRes = mm.validateManifest(validManifest);
    assert('Valid release manifest passes validation', vRes.valid === true);

    // Test 2: Invalid gameId rejected
    const badGameId = { ...validManifest, gameId: 'unauthorized-game' };
    assert('Manifest with invalid gameId is rejected', mm.validateManifest(badGameId).valid === false);

    // Test 3: Missing saveSchemaVersion rejected
    const noSaveSchema = { ...validManifest };
    delete noSaveSchema.saveSchemaVersion;
    assert('Manifest missing saveSchemaVersion is rejected', mm.validateManifest(noSaveSchema).valid === false);

    // Test 4: Manifest Differential Computation
    const installedManifest = {
      version: '1.1.0',
      files: [
        { path: 'index.html', size: 100, sha256: 'a'.repeat(64) },
        { path: 'js/main.js', size: 500, sha256: 'old_hash'.padEnd(64, '0') }
      ]
    };

    const targetManifest = {
      version: '1.2.0',
      files: [
        { path: 'index.html', size: 100, sha256: 'a'.repeat(64) }, // Unchanged
        { path: 'js/main.js', size: 550, sha256: 'new_hash'.padEnd(64, '0') }, // Modified
        { path: 'js/new-feature.js', size: 200, sha256: 'brand_new'.padEnd(64, '0') } // New
      ]
    };

    const diff = mm.computeDiff(installedManifest, targetManifest);
    assert('Diff correctly identifies 2 files to download', diff.toDownload.length === 2);
    assert('Diff correctly identifies index.html as unchanged', diff.unchanged.length === 1 && diff.unchanged[0].path === 'index.html');
    assert('Diff calculates correct total download bytes (750)', diff.totalDownloadBytes === 750);

    return results;
  }

  window.runTestLauncherManifest = runTestLauncherManifest;
})();
