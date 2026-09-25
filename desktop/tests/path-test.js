/**
 * Platform-Safe Paths & Separation Unit Tests
 */

const pathManager = require('../electron/path-manager');
const path = require('path');

function runPathTests() {
  const results = { name: 'PathTests', passed: 0, failed: 0, errors: [] };

  function assert(condition, message) {
    if (condition) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(message);
    }
  }

  // 1. Separation of install data and user data
  const installDir = pathManager.getInstallDir();
  const userDataDir = pathManager.getUserDataDir();
  assert(installDir && userDataDir, 'Both installDir and userDataDir must be non-empty strings');
  assert(path.resolve(installDir) !== path.resolve(userDataDir), 'installDir and userDataDir must be separate paths');

  // 2. Subdirectories in userDataDir
  const saveDir = pathManager.getSaveDir();
  const settingsDir = pathManager.getSettingsDir();
  const logsDir = pathManager.getLogsDir();
  const screenshotsDir = pathManager.getScreenshotsDir();

  assert(saveDir.startsWith(userDataDir), 'saveDir is inside userDataDir');
  assert(settingsDir.startsWith(userDataDir), 'settingsDir is inside userDataDir');
  assert(logsDir.startsWith(userDataDir), 'logsDir is inside userDataDir');
  assert(screenshotsDir.startsWith(userDataDir), 'screenshotsDir is inside userDataDir');

  // 3. Filename sanitization against traversal attacks
  const clean1 = pathManager.sanitizeFilename('slot_1.json');
  assert(clean1 === 'slot_1.json', 'Standard filename preserved');

  const traversal = pathManager.sanitizeFilename('../../etc/passwd');
  assert(!traversal.includes('..') && !traversal.includes('/'), 'Directory traversal stripped from filename');

  // 4. Safe write path validator
  assert(pathManager.isSafeWritePath(path.join(saveDir, 'slot_1.json')) === true, 'Writing inside saveDir is allowed');
  assert(pathManager.isSafeWritePath(path.join(installDir, 'index.html')) === false, 'Writing inside installDir is blocked');

  return results;
}

if (require.main === module) {
  const r = runPathTests();
  console.log(`[PathTest] Passed: ${r.passed}, Failed: ${r.failed}`);
  if (r.failed > 0) {
    r.errors.forEach(e => console.error(' *', e));
    process.exit(1);
  }
}

module.exports = { runPathTests };
