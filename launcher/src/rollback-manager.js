/**
 * launcher/src/rollback-manager.js
 * Manages rollback snapshots to ensure failed updates can safely revert
 * to the previous working build without altering player saves or settings.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RollbackManager = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class RollbackManager {
    constructor() {
      this.snapshot = null;
    }

    /**
     * Captures a snapshot of the current working game files and manifest.
     */
    createSnapshot(manifest, installedFiles) {
      if (!manifest) return false;

      const fileCopies = new Map();
      if (installedFiles) {
        for (const [p, f] of installedFiles.entries()) {
          fileCopies.set(p, { ...f });
        }
      }

      this.snapshot = {
        version: manifest.version,
        buildId: manifest.buildId,
        manifest: JSON.parse(JSON.stringify(manifest)),
        files: fileCopies,
        createdAt: Date.now()
      };

      return true;
    }

    hasSnapshot() {
      return this.snapshot !== null;
    }

    /**
     * Restores the snapshot. Strictly preserves user savedata.
     */
    restoreSnapshot() {
      if (!this.snapshot) {
        return { success: false, error: 'No rollback snapshot available' };
      }

      const restoredFiles = new Map();
      for (const [p, f] of this.snapshot.files.entries()) {
        restoredFiles.set(p, { ...f });
      }

      const result = {
        success: true,
        restoredVersion: this.snapshot.version,
        restoredBuildId: this.snapshot.buildId,
        manifest: this.snapshot.manifest,
        restoredFiles,
        userSavesUntouched: true
      };

      return result;
    }

    clearSnapshot() {
      this.snapshot = null;
    }
  }

  return RollbackManager;
});
