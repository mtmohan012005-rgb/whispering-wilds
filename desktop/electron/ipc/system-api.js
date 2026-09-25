/**
 * SystemAPI - IPC Endpoint for System, Window & Hardware Information
 * Validates all requests, enforces allowed operations, and isolates Node internals.
 */

const platformManager = require('../platform-manager');
const windowManager = require('../window-manager');
const appLifecycle = require('../app-lifecycle');

function registerSystemIPC(ipcMain) {
  if (!ipcMain) return;

  // Handle get system info
  ipcMain.handle('system:get-info', async (event) => {
    return {
      success: true,
      data: platformManager.getSystemSummary()
    };
  });

  // Handle get capabilities
  ipcMain.handle('system:get-capabilities', async (event) => {
    return {
      success: true,
      data: platformManager.getCapabilities()
    };
  });

  // Handle window mode change
  ipcMain.handle('system:set-window-mode', async (event, payload) => {
    if (!payload || typeof payload.mode !== 'string') {
      return { success: false, error: 'Invalid mode argument' };
    }
    const mode = payload.mode.toUpperCase();
    if (!['WINDOWED', 'BORDERLESS', 'FULLSCREEN'].includes(mode)) {
      return { success: false, error: `Unsupported window mode: ${mode}` };
    }
    const ok = windowManager.setWindowMode(mode);
    return { success: ok, mode };
  });

  // Handle resolution change
  ipcMain.handle('system:set-resolution', async (event, payload) => {
    if (!payload || typeof payload.width !== 'number' || typeof payload.height !== 'number') {
      return { success: false, error: 'Invalid resolution dimensions' };
    }
    const { width, height } = payload;
    if (width < 800 || height < 600 || width > 7680 || height > 4320) {
      return { success: false, error: 'Resolution out of acceptable bounds' };
    }
    const ok = windowManager.setResolution(width, height);
    return { success: ok, width, height };
  });

  // Handle unsaved progress notify
  ipcMain.on('system:set-unsaved-progress', (event, payload) => {
    if (payload && typeof payload.hasUnsaved === 'boolean') {
      appLifecycle.setUnsavedProgress(payload.hasUnsaved);
    }
  });

  // Handle exit confirmation response
  ipcMain.on('system:confirm-exit', (event) => {
    appLifecycle.forceExit();
  });
}

module.exports = { registerSystemIPC };
