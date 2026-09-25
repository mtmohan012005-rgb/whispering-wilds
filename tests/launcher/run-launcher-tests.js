/**
 * tests/launcher/run-launcher-tests.js
 * Standalone Node.js test runner executing all 10 launcher test suites.
 */

const path = require('path');
const fs = require('fs');

// Global mock setup for Node execution
global.window = global;
global.LauncherState = require('../../launcher/src/launcher-state');
global.ManifestManager = require('../../launcher/src/manifest-manager');
global.FileValidator = require('../../launcher/src/file-validator');
global.VersionManager = require('../../launcher/src/version-manager');
global.DownloadManager = require('../../launcher/src/download-manager');
global.InstallManager = require('../../launcher/src/install-manager');
global.UpdateManager = require('../../launcher/src/update-manager');
global.RepairManager = require('../../launcher/src/repair-manager');
global.RollbackManager = require('../../launcher/src/rollback-manager');
global.LauncherSettings = require('../../launcher/src/launcher-settings');
global.LauncherUI = require('../../launcher/src/launcher-ui');

// Load test files
require('./test-install');
require('./test-manifest');
require('./test-checksum');
require('./test-update');
require('./test-repair');
require('./test-rollback');
require('./test-offline');
require('./test-crash-recovery');
require('./test-save-safety');
require('./test-version-compatibility');

async function runAll() {
  console.log('=== RUNNING LAUNCHER TEST SUITES ===');
  const suites = [
    { name: 'Install', fn: global.runTestLauncherInstall },
    { name: 'Manifest', fn: global.runTestLauncherManifest },
    { name: 'Checksum', fn: global.runTestLauncherChecksum },
    { name: 'Update', fn: global.runTestLauncherUpdate },
    { name: 'Repair', fn: global.runTestLauncherRepair },
    { name: 'Rollback', fn: global.runTestLauncherRollback },
    { name: 'Offline', fn: global.runTestLauncherOffline },
    { name: 'CrashRecovery', fn: global.runTestLauncherCrashRecovery },
    { name: 'SaveSafety', fn: global.runTestLauncherSaveSafety },
    { name: 'VersionCompatibility', fn: global.runTestLauncherVersionCompatibility }
  ];

  let allPassed = true;
  for (const s of suites) {
    try {
      const res = await s.fn();
      if (!res.passed) {
        console.error(`❌ Suite ${s.name} FAILED:`, res.checks.filter(c => !c.passed));
        allPassed = false;
      } else {
        console.log(`✅ Suite ${s.name} PASSED (${res.checks.length} checks)`);
      }
    } catch (err) {
      console.error(`💥 Suite ${s.name} EXCEPTION:`, err);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('🎉 ALL LAUNCHER TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('⚠️ SOME LAUNCHER TESTS FAILED.');
    process.exit(1);
  }
}

runAll();
