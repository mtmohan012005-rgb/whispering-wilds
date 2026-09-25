/**
 * Platform Detection & Capability Unit Tests
 */

const platformManager = require('../electron/platform-manager');

function runPlatformTests() {
  const results = { name: 'PlatformTests', passed: 0, failed: 0, errors: [] };

  function assert(condition, message) {
    if (condition) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(message);
    }
  }

  // 1. Valid platform identification
  const isWin = platformManager.isWindows();
  const isMac = platformManager.isMacOS();
  const isLinux = platformManager.isLinux();
  assert(isWin || isMac || isLinux, 'Must recognize Windows, macOS, or Linux platform');

  // Exactly one OS is true
  const osCount = [isWin, isMac, isLinux].filter(Boolean).length;
  assert(osCount === 1, 'Only one OS identity can be true simultaneously');

  // 2. Architecture identification
  const isX64 = platformManager.isX64();
  const isArm = platformManager.isArm64();
  assert(isX64 || isArm, 'Must recognize x64 or arm64 architecture');

  // 3. Capabilities introspected
  const caps = platformManager.getCapabilities();
  assert(caps.fullscreen === true, 'Fullscreen capability must be enabled');
  assert(caps.nativePaths === true, 'Native paths capability must be enabled');
  assert(caps.fileSave === true, 'File save capability must be enabled');

  // 4. Memory and CPU summary
  const summary = platformManager.getSystemSummary();
  assert(typeof summary.totalMemoryMB === 'number' && summary.totalMemoryMB > 0, 'Memory summary valid');
  assert(typeof summary.cpuCores === 'number' && summary.cpuCores >= 1, 'CPU cores valid');

  // 5. Hardware profile recommendation
  const profileLow = platformManager.recommendHardwareProfile('LOW');
  assert(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'].includes(profileLow), 'Valid hardware profile output');

  return results;
}

if (require.main === module) {
  const r = runPlatformTests();
  console.log(`[PlatformTest] Passed: ${r.passed}, Failed: ${r.failed}`);
  if (r.failed > 0) {
    r.errors.forEach(e => console.error(' *', e));
    process.exit(1);
  }
}

module.exports = { runPlatformTests };
