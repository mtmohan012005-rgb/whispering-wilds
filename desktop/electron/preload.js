/**
 * Preload Script - Secure Context Isolation Bridge
 * Exposes only safe, validated desktop APIs via window.desktopAPI.
 * Under no circumstances are Node.js, require, fs, or child_process exposed.
 */

const { contextBridge, ipcRenderer } = require('electron');

const desktopAPI = {
  isDesktop: true,
  appVersion: '1.0.0',
  buildId: 'PROD-2026.1',

  // System & Capabilities
  getSystemInfo: async () => {
    const res = await ipcRenderer.invoke('system:get-info');
    return res.data;
  },

  getCapabilities: async () => {
    const res = await ipcRenderer.invoke('system:get-capabilities');
    return res.data;
  },

  // Display & Window Controls
  setWindowMode: async (mode) => {
    const res = await ipcRenderer.invoke('system:set-window-mode', { mode });
    return res.success;
  },

  setResolution: async (width, height) => {
    const res = await ipcRenderer.invoke('system:set-resolution', { width, height });
    return res.success;
  },

  setUnsavedProgress: (hasUnsaved) => {
    ipcRenderer.send('system:set-unsaved-progress', { hasUnsaved });
  },

  confirmSafeExit: () => {
    ipcRenderer.send('system:confirm-exit');
  },

  // Native Save File API
  readSave: async (slotId) => {
    return await ipcRenderer.invoke('save:read', { slotId });
  },

  writeSave: async (slotId, data) => {
    return await ipcRenderer.invoke('save:write', { slotId, data });
  },

  listSaves: async () => {
    const res = await ipcRenderer.invoke('save:list');
    return res.saves || [];
  },

  deleteSave: async (slotId) => {
    return await ipcRenderer.invoke('save:delete', { slotId });
  },

  // Diagnostics & Screenshots
  getDiagnostics: async (extra) => {
    const res = await ipcRenderer.invoke('diagnostics:get-summary', extra);
    return res.data;
  },

  addBreadcrumb: async (category, message, metadata) => {
    return await ipcRenderer.invoke('diagnostics:add-breadcrumb', { category, message, metadata });
  },

  checkSafeMode: async () => {
    const res = await ipcRenderer.invoke('diagnostics:check-safe-mode');
    return res.safeMode;
  },

  resetSafeMode: async () => {
    return await ipcRenderer.invoke('diagnostics:reset-safe-mode');
  },

  saveScreenshot: async (filename, base64Data) => {
    return await ipcRenderer.invoke('diagnostics:save-screenshot', { filename, base64Data });
  },

  // Updates
  getUpdateStatus: async () => {
    const res = await ipcRenderer.invoke('update:get-status');
    return res.data;
  },

  stageUpdate: async (manifest) => {
    return await ipcRenderer.invoke('update:stage', manifest);
  },

  applyUpdate: async (isGameplayActive) => {
    return await ipcRenderer.invoke('update:apply', { isGameplayActive });
  },

  rollbackUpdate: async () => {
    return await ipcRenderer.invoke('update:rollback');
  },

  // Subscribed Lifecycle Events
  onWindowResized: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('desktop:window-resized', handler);
    return () => ipcRenderer.removeListener('desktop:window-resized', handler);
  },

  onWindowModeChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('desktop:window-mode-changed', handler);
    return () => ipcRenderer.removeListener('desktop:window-mode-changed', handler);
  },

  onFocusChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('desktop:focus-changed', handler);
    return () => ipcRenderer.removeListener('desktop:focus-changed', handler);
  },

  onVisibilityChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('desktop:visibility-changed', handler);
    return () => ipcRenderer.removeListener('desktop:visibility-changed', handler);
  },

  onPowerEvent: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('desktop:power-event', handler);
    return () => ipcRenderer.removeListener('desktop:power-event', handler);
  },

  onDisplayChanged: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('desktop:display-changed', handler);
    return () => ipcRenderer.removeListener('desktop:display-changed', handler);
  },

  onRequestSafeExit: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('desktop:request-safe-exit', handler);
    return () => ipcRenderer.removeListener('desktop:request-safe-exit', handler);
  }
};

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI);
