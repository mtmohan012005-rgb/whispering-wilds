/**
 * tests/launcher/test-install.js
 * Verifies clean game installation, atomic staging, disk space checks,
 * and user savedata preservation during uninstall.
 */

(function () {
  'use strict';

  async function runTestLauncherInstall() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const InstallManager = window.InstallManager;
    assert('InstallManager is loaded', !!InstallManager);

    const im = new InstallManager('C:\\Games\\TheWhisperingWilds\\app', 'C:\\Users\\User\\AppData\\Local\\TheWhisperingWilds\\savedata');

    // Test 1: Disk space check - sufficient space
    const spaceOk = im.checkDiskSpace(10 * 1024 * 1024 * 1024, 1024 * 1024 * 1024); // 10GB avail vs 1GB req
    assert('Sufficient disk space passes check', spaceOk.isSufficient === true && spaceOk.shortfallBytes === 0);

    // Test 2: Disk space check - insufficient space
    const spaceFail = im.checkDiskSpace(500 * 1024 * 1024, 1024 * 1024 * 1024); // 500MB avail vs 1GB req
    assert('Insufficient disk space flagged with shortfall', spaceFail.isSufficient === false && spaceFail.shortfallBytes > 0);

    // Test 3: Atomic Installation
    const mockManifest = {
      gameId: 'the-whispering-wilds',
      version: '1.2.0',
      buildId: 'WW_BUILD_2026_PROD',
      saveSchemaVersion: 3,
      files: [
        { path: 'index.html', size: 1000, sha256: 'a'.repeat(64), critical: true },
        { path: 'assets/characters/player/player.glb', size: 5000, sha256: 'b'.repeat(64), critical: true }
      ]
    };

    const mockDownloaded = new Map([
      ['index.html', { path: 'index.html', size: 1000, sha256: 'a'.repeat(64) }],
      ['assets/characters/player/player.glb', { path: 'assets/characters/player/player.glb', size: 5000, sha256: 'b'.repeat(64) }]
    ]);

    const installRes = await im.install(mockManifest, mockDownloaded, { createDesktopShortcut: true });
    assert('Install operation succeeded', installRes && installRes.success === true);
    assert('Installed file count matches manifest', im.getInstalledFiles().size === 2);
    assert('Install path matches configured path', im.installPath === 'C:\\Games\\TheWhisperingWilds\\app');
    assert('User savedata path separated from game path', im.userDataPath !== im.installPath);

    // Test 4: Uninstall without deleting savedata
    const uninstRes = im.uninstall(false);
    assert('Uninstaller cleared game files', uninstRes.gameFilesDeleted === true && im.getInstalledFiles().size === 0);
    assert('User savedata explicitly preserved', uninstRes.userDataPreserved === true);

    return results;
  }

  window.runTestLauncherInstall = runTestLauncherInstall;
})();
