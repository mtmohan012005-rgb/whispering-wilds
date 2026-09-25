/**
 * Window Management & Resolution Unit Tests
 */

const windowManager = require('../electron/window-manager');

function runWindowTests() {
  const results = { name: 'WindowTests', passed: 0, failed: 0, errors: [] };

  function assert(condition, message) {
    if (condition) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(message);
    }
  }

  // 1. Standard resolutions supported
  const standard = windowManager.standardResolutions;
  assert(standard.length >= 6, 'Must support at least 6 standard resolutions');

  // Verify 720p, 1080p, 1440p, 4K, and 21:9 ultrawide exist
  const has720p = standard.some(r => r.width === 1280 && r.height === 720);
  const has1080p = standard.some(r => r.width === 1920 && r.height === 1080);
  const has1440p = standard.some(r => r.width === 2560 && r.height === 1440);
  const has4k = standard.some(r => r.width === 3840 && r.height === 2160);
  const hasUltrawide = standard.some(r => r.aspect === '21:9');

  assert(has720p, '720p resolution supported');
  assert(has1080p, '1080p resolution supported');
  assert(has1440p, '1440p resolution supported');
  assert(has4k, '4K resolution supported');
  assert(hasUltrawide, '21:9 ultrawide resolution supported');

  // 2. Offscreen recovery test logic
  let recovered = false;
  const mockScreen = {
    getAllDisplays: () => [
      { id: 1, bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1080 } }
    ],
    getPrimaryDisplay: () => ({ workAreaSize: { width: 1920, height: 1080 } }),
    getDisplayMatching: () => ({ id: 1, scaleFactor: 1.0, workAreaSize: { width: 1920, height: 1080 } })
  };

  const mockWindow = {
    bounds: { x: -5000, y: -5000, width: 1280, height: 720 },
    getBounds() { return this.bounds; },
    center() { recovered = true; this.bounds.x = 320; this.bounds.y = 180; },
    setFullScreen() {},
    maximize() {},
    unmaximize() {},
    setSize(w, h) { this.bounds.width = w; this.bounds.height = h; },
    webContents: { send() {} },
    isDestroyed() { return false; }
  };

  windowManager.mainWindow = mockWindow;
  windowManager.ensureWindowOnScreen(mockScreen);
  assert(recovered, 'Off-screen window correctly recovered to center of primary display');

  // 3. Mode switching
  windowManager.setWindowMode('FULLSCREEN');
  assert(windowManager.currentMode === 'FULLSCREEN', 'Switched to FULLSCREEN');

  windowManager.setWindowMode('BORDERLESS');
  assert(windowManager.currentMode === 'BORDERLESS', 'Switched to BORDERLESS');

  windowManager.setWindowMode('WINDOWED');
  assert(windowManager.currentMode === 'WINDOWED', 'Switched to WINDOWED');

  return results;
}

if (require.main === module) {
  const r = runWindowTests();
  console.log(`[WindowTest] Passed: ${r.passed}, Failed: ${r.failed}`);
  if (r.failed > 0) {
    r.errors.forEach(e => console.error(' *', e));
    process.exit(1);
  }
}

module.exports = { runWindowTests };
