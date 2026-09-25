/**
 * WindowManager - Desktop Display, Resolution, Aspect Ratio & Window Mode Controller
 * Supports WINDOWED, BORDERLESS, FULLSCREEN, ultrawide (21:9), High-DPI/Retina, and multi-monitor recovery.
 */

const path = require('path');
const securityManager = require('./security-manager');
const crashHandler = require('./crash-handler');

class WindowManager {
  constructor() {
    this.mainWindow = null;
    this.currentMode = 'WINDOWED'; // 'WINDOWED', 'BORDERLESS', 'FULLSCREEN'
    this.currentResolution = { width: 1280, height: 720 };
    this.standardResolutions = [
      { width: 1280, height: 720, aspect: '16:9', label: '720p HD' },
      { width: 1366, height: 768, aspect: '16:9', label: '1366x768' },
      { width: 1600, height: 900, aspect: '16:9', label: '900p HD+' },
      { width: 1920, height: 1080, aspect: '16:9', label: '1080p Full HD' },
      { width: 2560, height: 1440, aspect: '16:9', label: '1440p QHD' },
      { width: 3840, height: 2160, aspect: '16:9', label: '4K UHD' },
      { width: 2560, height: 1080, aspect: '21:9', label: '2560x1080 Ultrawide' },
      { width: 3440, height: 1440, aspect: '21:9', label: '3440x1440 Ultrawide QHD' },
      { width: 1920, height: 1200, aspect: '16:10', label: '1920x1200 (16:10)' }
    ];
  }

  createWindow(BrowserWindow, screen, preloadPath, isDev = false) {
    const primaryDisplay = screen ? screen.getPrimaryDisplay() : { workAreaSize: { width: 1920, height: 1080 } };
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Pick sensible starting window size fitting within primary display
    let initialWidth = 1280;
    let initialHeight = 720;
    if (screenWidth >= 1920 && screenHeight >= 1080) {
      initialWidth = 1600;
      initialHeight = 900;
    }

    const webPrefs = securityManager.getSecureWebPreferences(preloadPath);

    this.mainWindow = new BrowserWindow({
      width: initialWidth,
      height: initialHeight,
      minWidth: 1024,
      minHeight: 576,
      center: true,
      backgroundColor: '#0a0d0a',
      show: false, // Show when ready to prevent visual flicker
      frame: true,
      autoHideMenuBar: true,
      webPreferences: webPrefs
    });

    this.currentResolution = { width: initialWidth, height: initialHeight };

    // Setup window security
    securityManager.configureWindowSecurity(this.mainWindow);

    // Window events
    this.mainWindow.once('ready-to-show', () => {
      this.ensureWindowOnScreen(screen);
      this.mainWindow.show();
      this.mainWindow.focus();
      crashHandler.addBreadcrumb('window', 'Window shown and focused successfully.');
    });

    // Handle monitor movement / DPI change
    this.mainWindow.on('moved', () => {
      this._handleDisplayOrDpiChange(screen);
    });

    this.mainWindow.on('resize', () => {
      if (!this.mainWindow) return;
      const bounds = this.mainWindow.getBounds();
      this.currentResolution = { width: bounds.width, height: bounds.height };
      this.notifyRenderer('desktop:window-resized', {
        width: bounds.width,
        height: bounds.height,
        mode: this.currentMode
      });
    });

    return this.mainWindow;
  }

  getMainWindow() {
    return this.mainWindow;
  }

  setWindowMode(mode) {
    if (!this.mainWindow) return false;
    crashHandler.addBreadcrumb('window', `Switching window mode to: ${mode}`);

    try {
      if (mode === 'FULLSCREEN') {
        this.mainWindow.setFullScreen(true);
        this.currentMode = 'FULLSCREEN';
      } else if (mode === 'BORDERLESS') {
        this.mainWindow.setFullScreen(false);
        this.mainWindow.setMenuBarVisibility(false);
        this.mainWindow.maximize();
        this.currentMode = 'BORDERLESS';
      } else {
        // WINDOWED
        this.mainWindow.setFullScreen(false);
        if (this.mainWindow.isMaximized()) {
          this.mainWindow.unmaximize();
        }
        this.mainWindow.setSize(this.currentResolution.width, this.currentResolution.height);
        this.mainWindow.center();
        this.currentMode = 'WINDOWED';
      }

      this.notifyRenderer('desktop:window-mode-changed', {
        mode: this.currentMode,
        resolution: this.currentResolution
      });
      return true;
    } catch (err) {
      console.warn('[WindowManager] Window mode change failed, falling back to WINDOWED:', err.message);
      // Fallback safely to windowed mode
      try {
        this.mainWindow.setFullScreen(false);
        this.currentMode = 'WINDOWED';
      } catch (e) {}
      return false;
    }
  }

  setResolution(width, height) {
    if (!this.mainWindow) return false;
    if (this.currentMode === 'FULLSCREEN') {
      // In fullscreen, resolution changes report to renderer for viewport scaling
      this.currentResolution = { width, height };
      this.notifyRenderer('desktop:resolution-changed', { width, height });
      return true;
    }

    try {
      this.mainWindow.setSize(width, height);
      this.mainWindow.center();
      this.currentResolution = { width, height };
      this.notifyRenderer('desktop:resolution-changed', { width, height });
      return true;
    } catch (e) {
      console.warn('[WindowManager] Failed resizing window:', e.message);
      return false;
    }
  }

  ensureWindowOnScreen(screen) {
    if (!this.mainWindow || !screen) return;
    const bounds = this.mainWindow.getBounds();
    const displays = screen.getAllDisplays();

    // Check if the current bounds intersect with any connected display
    const visible = displays.some(disp => {
      const db = disp.bounds;
      return (
        bounds.x < db.x + db.width &&
        bounds.x + bounds.width > db.x &&
        bounds.y < db.y + db.height &&
        bounds.y + bounds.height > db.y
      );
    });

    if (!visible) {
      // Offscreen! Re-center on primary display
      console.warn('[WindowManager] Window off-screen detected! Recovering to center of primary display.');
      this.mainWindow.center();
      crashHandler.addBreadcrumb('window', 'Recovered off-screen window to primary display center.');
    }
  }

  _handleDisplayOrDpiChange(screen) {
    if (!this.mainWindow || !screen) return;
    const currentBounds = this.mainWindow.getBounds();
    const currentDisplay = screen.getDisplayMatching(currentBounds);
    const scaleFactor = currentDisplay.scaleFactor || 1.0;

    this.notifyRenderer('desktop:display-changed', {
      displayId: currentDisplay.id,
      scaleFactor,
      workArea: currentDisplay.workAreaSize
    });
  }

  notifyRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = new WindowManager();
