/**
 * Main Process - Electron Desktop Application Shell
 * Owns only: window lifecycle, desktop paths, application lifecycle, IPC, update integration, crash handling, and platform integration.
 * It must NOT own: player position, quests, inventory, NPC simulation, weather, or GameState.
 */

const { app, BrowserWindow, ipcMain, screen, powerMonitor, protocol, session } = require('electron');
const path = require('path');
const platformManager = require('./platform-manager');
const pathManager = require('./path-manager');
const securityManager = require('./security-manager');
const protocolHandler = require('./protocol-handler');
const crashHandler = require('./crash-handler');
const windowManager = require('./window-manager');
const appLifecycle = require('./app-lifecycle');

const { registerSystemIPC } = require('./ipc/system-api');
const { registerSaveIPC } = require('./ipc/save-api');
const { registerUpdateIPC } = require('./ipc/update-api');
const { registerDiagnosticsIPC } = require('./ipc/diagnostics-api');

// Hardware acceleration configuration
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Register custom protocol privileges before app ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: protocolHandler.getScheme(),
    privileges: {
      standard: true,
      secure: true,
      allowServiceWorkers: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

// 1. Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Main] Another instance is already running. Quitting.');
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our existing window
    const win = windowManager.getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      crashHandler.addBreadcrumb('lifecycle', 'Second instance attempt blocked, focused main window.');
    }
  });

  // 2. Application Ready
  app.whenReady().then(async () => {
    const isDev = process.argv.includes('--dev') || !app.isPackaged;
    const appVersion = app.getVersion ? app.getVersion() : '1.0.0';

    crashHandler.onAppStartup(appVersion, 'PROD-2026.1');
    securityManager.configureSessionSecurity(session.defaultSession, isDev);
    protocolHandler.registerProtocol(protocol);

    // Register all secure IPC handlers
    registerSystemIPC(ipcMain);
    registerSaveIPC(ipcMain);
    registerUpdateIPC(ipcMain);
    registerDiagnosticsIPC(ipcMain);

    // Create Main Game Window
    const preloadPath = path.join(__dirname, 'preload.js');
    const mainWindow = windowManager.createWindow(BrowserWindow, screen, preloadPath, isDev);

    // Initialize App Lifecycle & Power Monitor
    appLifecycle.init(app, powerMonitor, windowManager);

    // Load Game Frontend
    const entryHtml = path.resolve(__dirname, '..', '..', 'index.html');
    mainWindow.loadFile(entryHtml);

    // Renderer Crash Detection
    mainWindow.webContents.on('render-process-gone', (event, details) => {
      crashHandler.recordCrash('RendererProcessGone', details);
      console.error('[Main] Renderer process died:', details.reason);
    });

    mainWindow.webContents.on('unresponsive', () => {
      crashHandler.addBreadcrumb('renderer', 'Renderer process became unresponsive.');
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        windowManager.createWindow(BrowserWindow, screen, preloadPath, isDev);
      }
    });
  });

  // 3. Graceful Shutdown
  app.on('window-all-closed', () => {
    crashHandler.onAppCleanShutdown();
    app.quit();
  });
}
