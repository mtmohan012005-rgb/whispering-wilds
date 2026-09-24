// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ELECTRON DESKTOP RUNNER
// Standalone Windows PC & Laptop Native Application Container
// ============================================================================

const { app, BrowserWindow, globalShortcut, Menu } = require('electron');
const path = require('path');

// Hardware acceleration & GPU performance optimizations
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-renderer-backgrounding');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    backgroundColor: '#0c1017',
    title: 'The Whispering Wilds (காட்டு வழி) - PC Edition',
    icon: path.join(__dirname, 'assets/icons/app-icon.svg'),
    autoHideMenuBar: true,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      spellcheck: false
    }
  });

  // Load the game
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // F11 Fullscreen toggle
  globalShortcut.register('F11', () => {
    if (mainWindow) {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    }
  });

  // F12 Developer Tools toggle
  globalShortcut.register('F12', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
