/**
 * launcher/src/file-validator.js
 * Computes cryptographic SHA-256 checksums, validates file integrity,
 * and enforces critical vs non-critical launch gating.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('crypto'), require('fs'), require('path'));
  } else {
    root.FileValidator = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (cryptoModule, fsModule, pathModule) {
  'use strict';

  class FileValidator {
    constructor() {}

    /**
     * Computes the SHA-256 hash of a string or buffer.
     */
    async computeHash(content) {
      if (cryptoModule && cryptoModule.createHash) {
        return cryptoModule.createHash('sha256').update(content).digest('hex');
      }

      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const enc = new TextEncoder();
        const data = typeof content === 'string' ? enc.encode(content) : content;
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Safe deterministic fallback hash for test environments
      let hash = 0;
      const str = String(content);
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash).toString(16).padStart(64, '0');
    }

    /**
     * Validates an in-memory or filesystem map of files against manifest requirements.
     * @param {Object} fileMap - Map of relative path -> content (or metadata { size, content/sha256 })
     * @param {Object} manifest - Release manifest
     */
    async validateFiles(fileMap, manifest) {
      const missing = [];
      const corrupted = [];
      const valid = [];
      let criticalFailure = false;

      if (!manifest || !Array.isArray(manifest.files)) {
        return { valid: false, error: 'Invalid manifest', canLaunch: false };
      }

      for (const expected of manifest.files) {
        const fileEntry = fileMap[expected.path];

        if (!fileEntry) {
          missing.push(expected.path);
          if (expected.critical) criticalFailure = true;
          continue;
        }

        let actualHash = null;
        if (typeof fileEntry === 'object' && fileEntry.sha256) {
          actualHash = fileEntry.sha256;
        } else {
          actualHash = await this.computeHash(fileEntry);
        }

        if (actualHash !== expected.sha256) {
          corrupted.push({ path: expected.path, expected: expected.sha256, actual: actualHash });
          if (expected.critical) criticalFailure = true;
        } else {
          valid.push(expected.path);
        }
      }

      // Xbot and external CDN check
      let hasExternalDemoModel = false;
      for (const expected of manifest.files) {
        if (expected.path.includes('Xbot') || expected.path.includes('cdn.jsdelivr')) {
          hasExternalDemoModel = true;
          criticalFailure = true;
          break;
        }
      }

      const allValid = missing.length === 0 && corrupted.length === 0 && !hasExternalDemoModel;
      return {
        allValid,
        canLaunch: !criticalFailure,
        criticalFailure,
        missing,
        corrupted,
        valid,
        hasExternalDemoModel
      };
    }
  }

  return FileValidator;
});
