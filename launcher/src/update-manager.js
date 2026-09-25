/**
 * launcher/src/update-manager.js
 * Coordinates differential updates, staging, rollback backups,
 * and post-update verification.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.UpdateManager = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class UpdateManager {
    constructor(manifestManager, fileValidator, downloadManager, rollbackManager) {
      this.manifestManager = manifestManager;
      this.fileValidator = fileValidator;
      this.downloadManager = downloadManager;
      this.rollbackManager = rollbackManager;
    }

    /**
     * Executes the complete differential update pipeline.
     */
    async applyUpdate(installedFiles, currentManifest, targetManifest, onProgress = null) {
      if (!targetManifest) {
        return { success: false, error: 'Target manifest missing' };
      }

      // 1. Compute diff (download only modified/new files)
      const diff = this.manifestManager.computeDiff(currentManifest, targetManifest);
      if (!diff.isUpdateNeeded) {
        return { success: true, message: 'Already up to date', updatedFilesCount: 0 };
      }

      // 2. Create rollback snapshot before modifying anything
      if (this.rollbackManager) {
        this.rollbackManager.createSnapshot(currentManifest, installedFiles);
      }

      // 3. Download differential files
      const dlRes = await this.downloadManager.downloadFiles(diff.toDownload, onProgress);
      if (!dlRes.success) {
        return { success: false, error: 'Download failed' };
      }

      // 4. Stage & merge: copy unchanged files + new files into staged map
      const mergedFiles = new Map();
      for (const unchanged of diff.unchanged) {
        const existing = installedFiles.get ? installedFiles.get(unchanged.path) : installedFiles[unchanged.path];
        if (existing) mergedFiles.set(unchanged.path, existing);
      }
      for (const [path, file] of dlRes.downloadedFiles.entries()) {
        mergedFiles.set(path, file);
      }

      // 5. Post-update verification
      const fileMap = {};
      for (const [p, f] of mergedFiles.entries()) {
        fileMap[p] = f;
      }

      const valRes = await this.fileValidator.validateFiles(fileMap, targetManifest);
      if (!valRes.allValid && valRes.criticalFailure) {
        // Validation failed! Trigger rollback
        if (this.rollbackManager) {
          const rolledBack = this.rollbackManager.restoreSnapshot();
          return {
            success: false,
            rolledBack: true,
            error: 'Post-update verification failed. Successfully rolled back to previous valid version.'
          };
        }
        return { success: false, error: 'Update validation failed' };
      }

      return {
        success: true,
        updatedFilesCount: diff.toDownload.length,
        version: targetManifest.version,
        buildId: targetManifest.buildId,
        mergedFiles
      };
    }
  }

  return UpdateManager;
});
