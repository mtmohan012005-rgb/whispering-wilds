/**
 * The Whispering Wilds - OS Adapter
 * Detects operating system and CPU architecture safely without identity tracking.
 * Strictly used for windowing, user data paths, and platform integration.
 * NEVER used for gameplay rules.
 */
(function(root) {
  'use strict';

  class OSAdapter {
    constructor() {
      this.os = 'UNKNOWN';
      this.architecture = 'UNKNOWN';
      this.isElectron = false;
      this.userDataPath = '';
      this.detect();
    }

    detect() {
      // 1. Check Desktop API (Electron preload bridge)
      if (typeof window !== 'undefined' && window.desktopAPI) {
        this.isElectron = true;
        const plat = window.desktopAPI.platform || '';
        const arch = window.desktopAPI.arch || '';
        
        if (plat === 'win32' || plat.includes('win')) this.os = 'WINDOWS';
        else if (plat === 'darwin' || plat.includes('mac')) this.os = 'MACOS';
        else if (plat === 'linux') this.os = 'LINUX';
        else this.os = 'UNKNOWN';

        if (arch === 'x64' || arch === 'x86_64') this.architecture = 'x64';
        else if (arch === 'arm64' || arch === 'aarch64') this.architecture = 'arm64';
        else this.architecture = 'UNKNOWN';

        if (typeof window.desktopAPI.getUserDataPath === 'function') {
          this.userDataPath = window.desktopAPI.getUserDataPath();
        }
        return;
      }

      // 2. Check Node.js process if available
      if (typeof process !== 'undefined' && process.platform) {
        if (process.platform === 'win32') this.os = 'WINDOWS';
        else if (process.platform === 'darwin') this.os = 'MACOS';
        else if (process.platform === 'linux') this.os = 'LINUX';
        else this.os = 'UNKNOWN';

        if (process.arch === 'x64') this.architecture = 'x64';
        else if (process.arch === 'arm64') this.architecture = 'arm64';
        else this.architecture = 'UNKNOWN';
        return;
      }

      // 3. Fallback to Browser Navigator safely
      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent || '';
        const platform = navigator.platform || '';

        if (/Win/i.test(platform) || /Windows/i.test(ua)) {
          this.os = 'WINDOWS';
        } else if (/Mac/i.test(platform) || /Macintosh/i.test(ua)) {
          this.os = 'MACOS';
        } else if (/Linux/i.test(platform) || /X11/i.test(ua)) {
          this.os = 'LINUX';
        } else {
          this.os = 'UNKNOWN';
        }

        // Architecture detection in browser
        if (/x86_64|x64|Win64|WOW64|x86-64/i.test(ua)) {
          this.architecture = 'x64';
        } else if (/arm64|aarch64|Apple/i.test(ua) || (this.os === 'MACOS' && navigator.maxTouchPoints > 0)) {
          this.architecture = 'arm64';
        } else {
          this.architecture = 'UNKNOWN';
        }
      }
    }

    getOS() {
      return this.os;
    }

    getArchitecture() {
      return this.architecture;
    }

    getUserDataPath() {
      if (this.userDataPath) return this.userDataPath;
      switch (this.os) {
        case 'WINDOWS':
          return '%APPDATA%/WhisperingWilds';
        case 'MACOS':
          return '~/Library/Application Support/WhisperingWilds';
        case 'LINUX':
          return '~/.config/whispering-wilds';
        default:
          return 'localStorage://whispering-wilds';
      }
    }

    getPlatformSummary() {
      return {
        os: this.os,
        architecture: this.architecture,
        isDesktopNative: this.isElectron,
        userDataPath: this.getUserDataPath()
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OSAdapter;
  } else {
    root.OSAdapter = OSAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
