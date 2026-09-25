/**
 * tests/launcher/test-repair.js
 * Verifies targeted file repair: downloads only missing or corrupted files,
 * leaving intact files untouched.
 */

(function () {
  'use strict';

  async function runTestLauncherRepair() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const FileValidator = window.FileValidator;
    const DownloadManager = window.DownloadManager;
    const RepairManager = window.RepairManager;

    assert('RepairManager dependencies are loaded', !!RepairManager);

    const fv = new FileValidator();
    const dm = new DownloadManager();
    const rm = new RepairManager(fv, dm);

    const manifest = {
      files: [
        { path: 'index.html', size: 100, sha256: 'a'.repeat(64), critical: true },
        { path: 'js/main.js', size: 500, sha256: 'valid_main'.padEnd(64, '0'), critical: true },
        { path: 'assets/characters/player/player.glb', size: 8000, sha256: 'valid_hero'.padEnd(64, '0'), critical: true }
      ]
    };

    // Installed map has 1 corrupted file ('js/main.js')
    const installedFiles = new Map([
      ['index.html', { path: 'index.html', size: 100, sha256: 'a'.repeat(64) }],
      ['js/main.js', { path: 'js/main.js', size: 500, sha256: 'corrupted_hash'.padEnd(64, '0') }], // CORRUPT
      ['assets/characters/player/player.glb', { path: 'assets/characters/player/player.glb', size: 8000, sha256: 'valid_hero'.padEnd(64, '0') }]
    ]);

    const repairRes = await rm.verifyAndRepair(installedFiles, manifest);
    assert('Repair reported success', repairRes.success === true);
    assert('Repaired exactly 1 corrupted file', repairRes.repairedCount === 1);
    assert('Repaired file was js/main.js', repairRes.repairedFiles[0] === 'js/main.js');
    assert('Repaired file now holds valid checksum in installed map', installedFiles.get('js/main.js').sha256 === 'valid_main'.padEnd(64, '0'));

    return results;
  }

  window.runTestLauncherRepair = runTestLauncherRepair;
})();
