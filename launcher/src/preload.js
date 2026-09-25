/**
 * launcher/src/preload.js
 * Electron context bridge exposing safe desktop launcher APIs to the renderer window.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcherAPI', {
  getState: () => ipcRenderer.invoke('launcher:getState'),
  checkUpdates: () => ipcRenderer.invoke('launcher:checkUpdates'),
  install: (options) => ipcRenderer.invoke('launcher:install', options),
  update: () => ipcRenderer.invoke('launcher:update'),
  verifyAndRepair: () => ipcRenderer.invoke('launcher:verifyAndRepair'),
  rollback: () => ipcRenderer.invoke('launcher:rollback'),
  launchGame: (options) => ipcRenderer.invoke('launcher:launchGame', options),
  getSettings: () => ipcRenderer.invoke('launcher:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('launcher:saveSettings', settings),
  onStatusUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('launcher:statusUpdate', handler);
    return () => ipcRenderer.removeListener('launcher:statusUpdate', handler);
  }
});
