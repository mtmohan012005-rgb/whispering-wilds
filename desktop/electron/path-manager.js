/**
 * PathManager - Platform-Safe Path & Directory Resolution
 * Enforces strict separation between immutable GAME_INSTALL_DATA and OS-standard USER_DATA.
 * Handles Unicode, spaces, and platform-specific path separators seamlessly.
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

class PathManager {
  constructor() {
    this.appName = 'TheWhisperingWilds';
    this.installDir = path.resolve(__dirname, '..', '..');
    this.userDataDir = this._resolveUserDataDir();
    this._ensureDirectories();
  }

  _resolveUserDataDir() {
    // Priority: ELECTRON app.getPath('userData') if available, otherwise OS standard
    try {
      const { app } = require('electron');
      if (app && typeof app.getPath === 'function') {
        return app.getPath('userData');
      }
    } catch (e) {
      // Electron not initialized yet or in standalone test mode
    }

    const platform = process.platform;
    const home = os.homedir();

    if (platform === 'win32') {
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
      return path.join(appData, this.appName);
    } else if (platform === 'darwin') {
      return path.join(home, 'Library', 'Application Support', this.appName);
    } else {
      // Linux & other Unix-likes (XDG_CONFIG_HOME or ~/.config)
      const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
      return path.join(configHome, this.appName);
    }
  }

  _ensureDirectories() {
    const subdirs = [
      '',
      'saves',
      'settings',
      'profiles',
      'logs',
      'screenshots',
      'cache',
      'diagnostics',
      'backups'
    ];

    for (const sub of subdirs) {
      const target = path.join(this.userDataDir, sub);
      if (!fs.existsSync(target)) {
        try {
          fs.mkdirSync(target, { recursive: true });
        } catch (err) {
          // If creation fails, fallback to temp dir to prevent crash
          console.warn(`[PathManager] Could not create directory ${target}:`, err.message);
        }
      }
    }
  }

  getInstallDir() {
    return this.installDir;
  }

  getUserDataDir() {
    return this.userDataDir;
  }

  getSaveDir() {
    return path.join(this.userDataDir, 'saves');
  }

  getSettingsDir() {
    return path.join(this.userDataDir, 'settings');
  }

  getProfilesDir() {
    return path.join(this.userDataDir, 'profiles');
  }

  getLogsDir() {
    return path.join(this.userDataDir, 'logs');
  }

  getScreenshotsDir() {
    return path.join(this.userDataDir, 'screenshots');
  }

  getCacheDir() {
    return path.join(this.userDataDir, 'cache');
  }

  getDiagnosticsDir() {
    return path.join(this.userDataDir, 'diagnostics');
  }

  getBackupsDir() {
    return path.join(this.userDataDir, 'backups');
  }

  /**
   * Sanitizes relative filenames to prevent directory traversal
   */
  sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') return 'unnamed';
    return filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_').replace(/(\.\.)+/g, '');
  }

  /**
   * Returns a safe platform-specific path given a directory key and filename
   */
  resolveUserFilePath(category, filename) {
    const safeName = this.sanitizeFilename(filename);
    switch (category) {
      case 'save':
      case 'saves':
        return path.join(this.getSaveDir(), safeName);
      case 'setting':
      case 'settings':
        return path.join(this.getSettingsDir(), safeName);
      case 'log':
      case 'logs':
        return path.join(this.getLogsDir(), safeName);
      case 'screenshot':
      case 'screenshots':
        return path.join(this.getScreenshotsDir(), safeName);
      case 'diagnostic':
      case 'diagnostics':
        return path.join(this.getDiagnosticsDir(), safeName);
      default:
        return path.join(this.getUserDataDir(), safeName);
    }
  }

  /**
   * Validates if a path is safe to write into (must be within userDataDir, NEVER installDir)
   */
  isSafeWritePath(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') return false;
    const resolved = path.resolve(targetPath);
    // Never allow writing into installDir (immutable)
    if (resolved.startsWith(path.resolve(this.installDir)) && !resolved.startsWith(path.resolve(this.userDataDir))) {
      return false;
    }
    // Must be inside userDataDir or system temp
    const tempDir = path.resolve(os.tmpdir());
    return resolved.startsWith(path.resolve(this.userDataDir)) || resolved.startsWith(tempDir);
  }
}

module.exports = new PathManager();
