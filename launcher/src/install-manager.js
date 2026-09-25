/**
 * launcher/src/install-manager.js
 * Manages clean game installation, atomic staging, disk-space verification,
 * and strict separation of game binaries from player savedata.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.InstallManager = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class InstallManager {
    constructor(installPath = 'C:\\Games\\TheWhisperingWilds\\app', userDataPath = 'C:\\Users\\User\\AppData\\Local\\TheWhisperingWilds\\savedata') {
      this.installPath = installPath;
      this.userDataPath = userDataPath;
      this.installedFiles = new Map();
      this.installedManifest = null;
    }

    /**
     * Checks if available disk space is sufficient for install or patch.
     * @param {number} availableBytes - Available bytes on target drive
     * @param {number} requiredBytes - Base installation size
     * @param {number} bufferMultiplier - Overhead for staging + rollback (default 2.2x)
     */
    checkDiskSpace(availableBytes, requiredBytes, bufferMultiplier = 2.2) {
      const totalNeeded = Math.ceil(requiredBytes * bufferMultiplier);
      const isSufficient = availableBytes >= totalNeeded;
      return {
        isSufficient,
        availableBytes,
        requiredBytes,
        totalNeeded,
        shortfallBytes: isSufficient ? 0 : (totalNeeded - availableBytes)
      };
    }

    /**
     * Performs atomic installation staging.
     */
    async install(manifest, downloadedFiles, options = {}) {
      if (!manifest || !Array.isArray(manifest.files)) {
        return { success: false, error: 'Invalid manifest for installation' };
      }

      // 1. Stage in temporary sandbox
      const staging = new Map();
      for (const expected of manifest.files) {
        const file = downloadedFiles.get ? downloadedFiles.get(expected.path) : downloadedFiles[expected.path];
        if (!file) {
          return { success: false, error: `Missing file during staging: ${expected.path}` };
        }
        staging.set(expected.path, file);
      }

      // 2. Commit atomic swap
      this.installedFiles = staging;
      this.installedManifest = manifest;

      const result = {
        success: true,
        installedFilesCount: staging.size,
        version: manifest.version,
        buildId: manifest.buildId,
        installPath: this.installPath,
        userDataPath: this.userDataPath,
        createdDesktopShortcut: !!options.createDesktopShortcut,
        createdStartMenuShortcut: !!options.createStartMenuShortcut
      };

      return result;
    }

    getInstalledManifest() {
      return this.installedManifest;
    }

    getInstalledFiles() {
      return this.installedFiles;
    }

    /**
     * Uninstall game binaries without deleting user savedata unless explicitly opted in.
     */
    uninstall(deleteUserData = false) {
      this.installedFiles.clear();
      this.installedManifest = null;

      return {
        gameFilesDeleted: true,
        userDataPreserved: !deleteUserData,
        userDataDeleted: deleteUserData
      };
    }
  }

  return InstallManager;
});
