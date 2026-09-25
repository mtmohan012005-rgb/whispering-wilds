/**
 * launcher/src/manifest-manager.js
 * Loads, validates, and computes differential manifests for The Whispering Wilds.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ManifestManager = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class ManifestManager {
    constructor() {}

    /**
     * Validates a release manifest object against schema requirements.
     */
    validateManifest(manifest) {
      if (!manifest || typeof manifest !== 'object') {
        return { valid: false, error: 'Manifest must be an object' };
      }

      if (manifest.gameId !== 'the-whispering-wilds') {
        return { valid: false, error: `Invalid gameId: expected 'the-whispering-wilds', got '${manifest.gameId}'` };
      }

      if (!manifest.version || typeof manifest.version !== 'string') {
        return { valid: false, error: 'Missing or invalid version string' };
      }

      if (!manifest.buildId || typeof manifest.buildId !== 'string') {
        return { valid: false, error: 'Missing or invalid buildId' };
      }

      if (typeof manifest.saveSchemaVersion !== 'number') {
        return { valid: false, error: 'Missing saveSchemaVersion' };
      }

      if (!Array.isArray(manifest.files)) {
        return { valid: false, error: 'Manifest files must be an array' };
      }

      for (let i = 0; i < manifest.files.length; i++) {
        const f = manifest.files[i];
        if (!f.path || typeof f.path !== 'string') {
          return { valid: false, error: `File entry at index ${i} missing path` };
        }
        if (typeof f.size !== 'number' || f.size < 0) {
          return { valid: false, error: `File '${f.path}' has invalid size` };
        }
        if (!f.sha256 || typeof f.sha256 !== 'string' || f.sha256.length !== 64) {
          return { valid: false, error: `File '${f.path}' missing valid 64-char SHA-256 hash` };
        }
      }

      return { valid: true, fileCount: manifest.files.length };
    }

    /**
     * Calculates the differential between the current installed manifest and a target remote manifest.
     * @returns {{ toDownload: Array, unchanged: Array, totalDownloadBytes: number }}
     */
    computeDiff(currentManifest, targetManifest) {
      const currentMap = new Map();
      if (currentManifest && Array.isArray(currentManifest.files)) {
        for (const file of currentManifest.files) {
          currentMap.set(file.path, file);
        }
      }

      const toDownload = [];
      const unchanged = [];
      let totalDownloadBytes = 0;

      if (targetManifest && Array.isArray(targetManifest.files)) {
        for (const targetFile of targetManifest.files) {
          const installed = currentMap.get(targetFile.path);

          // Check if file is missing or has a different hash/size
          if (!installed || installed.sha256 !== targetFile.sha256 || installed.size !== targetFile.size) {
            toDownload.push(targetFile);
            totalDownloadBytes += targetFile.size;
          } else {
            unchanged.push(targetFile);
          }
        }
      }

      return {
        toDownload,
        unchanged,
        totalDownloadBytes,
        isUpdateNeeded: toDownload.length > 0
      };
    }
  }

  return ManifestManager;
});
