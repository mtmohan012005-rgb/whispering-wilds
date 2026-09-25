/**
 * tests/launcher/test-update.js
 * Verifies differential updates, downloading only modified files,
 * and post-update manifest validation.
 */

(function () {
  'use strict';

  async function runTestLauncherUpdate() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const ManifestManager = window.ManifestManager;
    const FileValidator = window.FileValidator;
    const DownloadManager = window.DownloadManager;
    const RollbackManager = window.RollbackManager;
    const UpdateManager = window.UpdateManager;

    assert('UpdateManager dependencies are loaded', !!UpdateManager);

    const mm = new ManifestManager();
    const fv = new FileValidator();
    const dm = new DownloadManager();
    const rm = new RollbackManager();
    const um = new UpdateManager(mm, fv, dm, rm);

    const currentManifest = {
      version: '1.1.0',
      files: [
        { path: 'index.html', size: 100, sha256: 'a'.repeat(64), critical: true },
        { path: 'js/main.js', size: 200, sha256: 'old_main'.padEnd(64, '0'), critical: true }
      ]
    };

    const targetManifest = {
      version: '1.2.0',
      buildId: 'WW_BUILD_2026_PROD',
      files: [
        { path: 'index.html', size: 100, sha256: 'a'.repeat(64), critical: true }, // Unchanged
        { path: 'js/main.js', size: 250, sha256: 'new_main'.padEnd(64, '0'), critical: true } // Modified
      ]
    };

    const installedFiles = new Map([
      ['index.html', { path: 'index.html', size: 100, sha256: 'a'.repeat(64) }],
      ['js/main.js', { path: 'js/main.js', size: 200, sha256: 'old_main'.padEnd(64, '0') }]
    ]);

    let progressReported = false;
    const updateRes = await um.applyUpdate(installedFiles, currentManifest, targetManifest, (p) => {
      progressReported = true;
    });

    assert('Update operation reported success', updateRes.success === true);
    assert('Progress callback was triggered during update', progressReported === true);
    assert('Only modified file was downloaded (updatedFilesCount = 1)', updateRes.updatedFilesCount === 1);
    assert('Target version updated to 1.2.0', updateRes.version === '1.2.0');
    assert('Merged files map contains both unchanged and updated files', updateRes.mergedFiles.size === 2);

    return results;
  }

  window.runTestLauncherUpdate = runTestLauncherUpdate;
})();
