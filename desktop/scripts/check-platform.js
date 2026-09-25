/**
 * Platform Diagnostic & Verification Script
 * Validates OS detection, CPU architecture, platform capabilities, and path safety.
 */

const platformManager = require('../electron/platform-manager');
const pathManager = require('../electron/path-manager');
const fs = require('fs');
const path = require('path');

function checkPlatform() {
  const summary = platformManager.getSystemSummary();
  const caps = platformManager.getCapabilities();
  const installDir = pathManager.getInstallDir();
  const userDataDir = pathManager.getUserDataDir();

  // Test Unicode path safety
  const unicodeTestDir = path.join(userDataDir, 'விளையாட்டு_unicode_test');
  let unicodeSafe = false;
  try {
    if (!fs.existsSync(unicodeTestDir)) {
      fs.mkdirSync(unicodeTestDir, { recursive: true });
    }
    const testFile = path.join(unicodeTestDir, 'சேமிப்பு_test.txt');
    fs.writeFileSync(testFile, 'தமிழ் உரை - Tamil Text UTF-8', 'utf8');
    const readBack = fs.readFileSync(testFile, 'utf8');
    unicodeSafe = readBack.includes('தமிழ் உரை');
    fs.unlinkSync(testFile);
    fs.rmdirSync(unicodeTestDir);
  } catch (e) {
    unicodeSafe = false;
  }

  // Verify installDir and userDataDir separation
  const pathsSeparated = path.resolve(installDir) !== path.resolve(userDataDir);

  return {
    platform: summary.platform,
    architecture: summary.arch,
    capabilities: caps,
    installDir,
    userDataDir,
    pathsSeparated,
    unicodeSafe,
    status: pathsSeparated && unicodeSafe ? 'PASSED' : 'FAILED'
  };
}

if (require.main === module) {
  const res = checkPlatform();
  console.log('=== PLATFORM COMPATIBILITY VERIFICATION ===');
  console.log('Platform:', res.platform);
  console.log('Architecture:', res.architecture);
  console.log('Paths Separated:', res.pathsSeparated);
  console.log('Unicode Paths Safe:', res.unicodeSafe);
  console.log('Overall Status:', res.status);
  if (res.status !== 'PASSED') {
    process.exit(1);
  }
}

module.exports = { checkPlatform };
