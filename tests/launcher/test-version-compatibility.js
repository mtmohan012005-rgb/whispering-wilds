/**
 * tests/launcher/test-version-compatibility.js
 * Verifies semver compatibility, save schema bounds, and force/optional update rules.
 */

(function () {
  'use strict';

  function runTestLauncherVersionCompatibility() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const VersionManager = window.VersionManager;
    assert('VersionManager is loaded', !!VersionManager);

    const vm = new VersionManager();

    // Test 1: Semver comparison
    assert('1.2.0 is newer than 1.1.0', vm.compare('1.2.0', '1.1.0') === 1);
    assert('1.1.0 is older than 1.2.0', vm.compare('1.1.0', '1.2.0') === -1);
    assert('1.2.0 equals 1.2.0', vm.compare('1.2.0', '1.2.0') === 0);

    // Test 2: Major/Minor/Patch parsing
    const parsed = vm.parseSemVer('v1.2.4');
    assert('Correctly parsed major version', parsed.major === 1);
    assert('Correctly parsed minor version', parsed.minor === 2);
    assert('Correctly parsed patch version', parsed.patch === 4);

    // Test 3: Save schema compatibility
    assert('Save schema 3 is compatible with target schema 3', vm.isSaveSchemaCompatible(3, 3) === true);
    assert('Older save schema 1 is compatible with target schema 3', vm.isSaveSchemaCompatible(1, 3) === true);
    assert('Future save schema 4 is incompatible with older engine 3', vm.isSaveSchemaCompatible(4, 3) === false);

    // Test 4: Force update when build is explicitly unsupported
    const versionHistory = [
      { version: '0.9.0', minimumSupported: false },
      { version: '1.2.0', minimumSupported: true }
    ];
    const targetManifest = { version: '1.2.0' };
    const req = vm.evaluateUpdateRequirement('0.9.0', targetManifest, versionHistory);
    assert('Unsupported old build triggers FORCE_UPDATE', req.type === 'FORCE_UPDATE');

    return results;
  }

  window.runTestLauncherVersionCompatibility = runTestLauncherVersionCompatibility;
})();
