/**
 * SaveAPI - Secure Native Save Filesystem IPC
 * Provides atomic file writing, payload size caps, structure validation, and path traversal protection.
 * Preserves the absolute player customization ceiling (changes <= 5).
 */

const fs = require('fs');
const path = require('path');
const pathManager = require('../path-manager');
const crashHandler = require('../crash-handler');

const MAX_SAVE_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB safety cap

function registerSaveIPC(ipcMain) {
  if (!ipcMain) return;

  // Handle write save
  ipcMain.handle('save:write', async (event, payload) => {
    try {
      if (!payload || typeof payload !== 'object') {
        return { success: false, error: 'Invalid payload structure' };
      }

      const { slotId = 'slot_1', data } = payload;
      if (!data || typeof data !== 'object') {
        return { success: false, error: 'Missing or malformed save data object' };
      }

      // Check payload size
      const serialized = JSON.stringify(data);
      if (Buffer.byteLength(serialized, 'utf8') > MAX_SAVE_PAYLOAD_BYTES) {
        return { success: false, error: 'Save payload exceeds maximum allowed size (10MB)' };
      }

      // Validate absolute player customization ceiling invariant
      if (data.player && typeof data.player.customizationChangesUsed === 'number') {
        if (data.player.customizationChangesUsed > 5 || data.player.customizationChangesUsed < 0) {
          crashHandler.addBreadcrumb('save', 'Blocked save attempt violating customization ceiling (>5).');
          return { success: false, error: 'Security rejection: Player customization changes cannot exceed 5.' };
        }
      }

      const safeSlot = pathManager.sanitizeFilename(slotId);
      const targetPath = pathManager.resolveUserFilePath('save', `${safeSlot}.json`);
      const tempPath = pathManager.resolveUserFilePath('save', `${safeSlot}.tmp`);

      // Atomic write: write to temp file then rename
      await fs.promises.writeFile(tempPath, serialized, 'utf8');
      await fs.promises.rename(tempPath, targetPath);

      // Create backup copy
      const backupPath = pathManager.resolveUserFilePath('save', `${safeSlot}.bak`);
      try {
        await fs.promises.copyFile(targetPath, backupPath);
      } catch (e) {}

      crashHandler.addBreadcrumb('save', `Successfully wrote save slot: ${safeSlot}`);
      return { success: true, slotId: safeSlot, timestamp: new Date().toISOString() };
    } catch (err) {
      crashHandler.recordCrash('SaveWriteFailure', err);
      return { success: false, error: err.message };
    }
  });

  // Handle read save
  ipcMain.handle('save:read', async (event, payload) => {
    try {
      const slotId = (payload && payload.slotId) ? payload.slotId : 'slot_1';
      const safeSlot = pathManager.sanitizeFilename(slotId);
      const targetPath = pathManager.resolveUserFilePath('save', `${safeSlot}.json`);

      if (!fs.existsSync(targetPath)) {
        // Try backup if main file does not exist
        const backupPath = pathManager.resolveUserFilePath('save', `${safeSlot}.bak`);
        if (fs.existsSync(backupPath)) {
          const rawBackup = await fs.promises.readFile(backupPath, 'utf8');
          const data = JSON.parse(rawBackup);
          return { success: true, slotId: safeSlot, data, recoveredFromBackup: true };
        }
        return { success: false, error: 'Save file not found', notFound: true };
      }

      const raw = await fs.promises.readFile(targetPath, 'utf8');
      const data = JSON.parse(raw);

      // Verify customization ceiling integrity
      if (data.player && typeof data.player.customizationChangesUsed === 'number') {
        data.player.customizationChangesUsed = Math.min(5, Math.max(0, data.player.customizationChangesUsed));
      }

      return { success: true, slotId: safeSlot, data };
    } catch (err) {
      crashHandler.recordCrash('SaveReadFailure', err);
      return { success: false, error: err.message };
    }
  });

  // Handle list saves
  ipcMain.handle('save:list', async (event) => {
    try {
      const saveDir = pathManager.getSaveDir();
      if (!fs.existsSync(saveDir)) {
        return { success: true, saves: [] };
      }
      const files = await fs.promises.readdir(saveDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.bak'));
      const slots = [];

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(saveDir, file);
          const stat = await fs.promises.stat(filePath);
          const slotId = path.basename(file, '.json');
          slots.push({
            slotId,
            modifiedTime: stat.mtimeMs,
            sizeBytes: stat.size
          });
        } catch (e) {}
      }

      return { success: true, saves: slots };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Handle delete save
  ipcMain.handle('save:delete', async (event, payload) => {
    try {
      if (!payload || !payload.slotId) return { success: false, error: 'Missing slotId' };
      const safeSlot = pathManager.sanitizeFilename(payload.slotId);
      const targetPath = pathManager.resolveUserFilePath('save', `${safeSlot}.json`);
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
      }
      return { success: true, slotId: safeSlot };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { registerSaveIPC };
