/**
 * UpdateAPI - IPC Endpoint for Desktop Updates & Patch Verification
 */

const updateManager = require('../update-manager');

function registerUpdateIPC(ipcMain) {
  if (!ipcMain) return;

  ipcMain.handle('update:get-status', async () => {
    return {
      success: true,
      data: updateManager.getUpdateStatus()
    };
  });

  ipcMain.handle('update:set-auto-update', async (event, payload) => {
    if (payload && typeof payload.enabled === 'boolean') {
      updateManager.setAutoUpdate(payload.enabled);
      return { success: true, enabled: payload.enabled };
    }
    return { success: false, error: 'Invalid argument' };
  });

  ipcMain.handle('update:stage', async (event, manifest) => {
    try {
      const res = await updateManager.stageUpdate(manifest);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('update:apply', async (event, payload) => {
    try {
      const isGameplay = payload && payload.isGameplayActive;
      const res = await updateManager.applyStagedUpdate(isGameplay);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('update:rollback', async () => {
    try {
      const res = await updateManager.rollbackUpdate();
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { registerUpdateIPC };
