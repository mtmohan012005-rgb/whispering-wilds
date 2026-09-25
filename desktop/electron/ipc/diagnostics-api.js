/**
 * DiagnosticsAPI - IPC Endpoint for Sanitized Diagnostics, Crash Breadcrumbs & Safe Mode Recovery
 */

const crashHandler = require('../crash-handler');
const pathManager = require('../path-manager');
const fs = require('fs');

function registerDiagnosticsIPC(ipcMain) {
  if (!ipcMain) return;

  ipcMain.handle('diagnostics:get-summary', async (event, extra) => {
    const summary = crashHandler.exportDiagnostics(extra);
    return { success: true, data: summary };
  });

  ipcMain.handle('diagnostics:add-breadcrumb', async (event, payload) => {
    if (payload && payload.category && payload.message) {
      crashHandler.addBreadcrumb(payload.category, payload.message, payload.metadata || {});
      return { success: true };
    }
    return { success: false, error: 'Invalid breadcrumb payload' };
  });

  ipcMain.handle('diagnostics:check-safe-mode', async () => {
    return {
      success: true,
      safeMode: crashHandler.shouldOfferSafeMode()
    };
  });

  ipcMain.handle('diagnostics:reset-safe-mode', async () => {
    crashHandler.resetCrashCounter();
    return { success: true };
  });

  ipcMain.handle('diagnostics:save-screenshot', async (event, payload) => {
    try {
      if (!payload || !payload.base64Data) {
        return { success: false, error: 'Missing base64 screenshot data' };
      }
      const filename = payload.filename || `shot_${Date.now()}.png`;
      const targetPath = pathManager.resolveUserFilePath('screenshot', filename);
      const cleanData = payload.base64Data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanData, 'base64');
      await fs.promises.writeFile(targetPath, buffer);
      return { success: true, filePath: targetPath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { registerDiagnosticsIPC };
