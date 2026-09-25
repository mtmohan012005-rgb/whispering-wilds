/**
 * launcher/src/repair-manager.js
 * Scans installed files against the release manifest and repairs only missing
 * or corrupted files without redownloading the entire game.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RepairManager = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class RepairManager {
    constructor(fileValidator, downloadManager) {
      this.fileValidator = fileValidator;
      this.downloadManager = downloadManager;
    }

    /**
     * Inspects game files, finds corrupt/missing entries, and downloads replacements.
     */
    async verifyAndRepair(installedFiles, manifest, onProgress = null) {
      if (!manifest || !Array.isArray(manifest.files)) {
        return { success: false, error: 'Manifest missing or invalid' };
      }

      const fileMap = {};
      for (const [p, f] of installedFiles.entries()) {
        fileMap[p] = f;
      }

      // 1. Verify all files against manifest
      const valRes = await this.fileValidator.validateFiles(fileMap, manifest);
      if (valRes.allValid) {
        return {
          success: true,
          repairedCount: 0,
          message: 'All game files verified successfully. No repairs needed.'
        };
      }

      // 2. Identify files needing repair
      const neededPaths = new Set([...valRes.missing, ...valRes.corrupted.map(c => c.path)]);
      const filesToDownload = manifest.files.filter(f => neededPaths.has(f.path));

      // 3. Download targeted replacements
      const dlRes = await this.downloadManager.downloadFiles(filesToDownload, onProgress);
      if (!dlRes.success) {
        return { success: false, error: 'Failed to download repair files' };
      }

      // 4. Atomically apply repaired files
      for (const [path, file] of dlRes.downloadedFiles.entries()) {
        installedFiles.set(path, file);
      }

      return {
        success: true,
        repairedCount: filesToDownload.length,
        repairedFiles: filesToDownload.map(f => f.path),
        message: `Successfully verified and repaired ${filesToDownload.length} files.`
      };
    }
  }

  return RepairManager;
});
