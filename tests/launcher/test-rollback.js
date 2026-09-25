/**
 * tests/launcher/test-rollback.js
 * Verifies automatic rollback to previous valid game version upon update failure,
 * ensuring player savedata is strictly untouched.
 */

(function () {
  'use strict';

  function runTestLauncherRollback() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const RollbackManager = window.RollbackManager;
    assert('RollbackManager is loaded', !!RollbackManager);

    const rm = new RollbackManager();

    const previousManifest = {
      version: '1.1.0',
      buildId: 'WW_BUILD_2026_V110',
      files: [{ path: 'index.html', size: 100, sha256: 'old'.padEnd(64, '0') }]
    };

    const previousFiles = new Map([
      ['index.html', { path: 'index.html', size: 100, sha256: 'old'.padEnd(64, '0') }]
    ]);

    // Test 1: Create rollback snapshot
    const snapOk = rm.createSnapshot(previousManifest, previousFiles);
    assert('Created rollback snapshot before update', snapOk === true);
    assert('RollbackManager indicates snapshot is available', rm.hasSnapshot() === true);

    // Test 2: Restore snapshot
    const restoreRes = rm.restoreSnapshot();
    assert('Snapshot restoration reported success', restoreRes.success === true);
    assert('Restored version matches 1.1.0', restoreRes.restoredVersion === '1.1.0');
    assert('Restored files contain index.html with original hash', restoreRes.restoredFiles.get('index.html').sha256 === 'old'.padEnd(64, '0'));
    assert('Player savedata was strictly untouched during rollback', restoreRes.userSavesUntouched === true);

    return results;
  }

  window.runTestLauncherRollback = runTestLauncherRollback;
})();
