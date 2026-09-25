/**
 * launcher/src/version-manager.js
 * SemVer comparison, update requirement classification (force vs optional),
 * and save schema compatibility auditing.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VersionManager = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class VersionManager {
    constructor() {}

    /**
     * Parses a semver string 'X.Y.Z' into { major, minor, patch }.
     */
    parseSemVer(verStr) {
      if (!verStr || typeof verStr !== 'string') return null;
      const clean = verStr.replace(/^[vV]/, '');
      const parts = clean.split('.').map(n => parseInt(n, 10));
      if (parts.length < 3 || parts.some(n => Number.isNaN(n))) return null;
      return { major: parts[0], minor: parts[1], patch: parts[2] };
    }

    /**
     * Compares two semver strings.
     * Returns: 1 if vA > vB, -1 if vA < vB, 0 if vA === vB.
     */
    compare(vA, vB) {
      const a = this.parseSemVer(vA);
      const b = this.parseSemVer(vB);
      if (!a || !b) return 0;

      if (a.major !== b.major) return a.major > b.major ? 1 : -1;
      if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
      if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
      return 0;
    }

    isNewer(remoteVer, currentVer) {
      return this.compare(remoteVer, currentVer) > 0;
    }

    /**
     * Determines whether an update is optional, mandatory, or unnecessary.
     */
    evaluateUpdateRequirement(currentVer, targetManifest, versionHistory = []) {
      if (!currentVer) {
        return { type: 'INSTALL_REQUIRED', reason: 'Game not installed' };
      }

      if (!targetManifest || !targetManifest.version) {
        return { type: 'NONE', reason: 'Target manifest not available' };
      }

      const cmp = this.compare(targetManifest.version, currentVer);
      if (cmp <= 0) {
        return { type: 'NONE', reason: 'Installed version is up to date' };
      }

      // Check if current version is below minimum supported in version history
      let isUnsupported = false;
      if (Array.isArray(versionHistory)) {
        const found = versionHistory.find(v => v.version === currentVer);
        if (found && found.minimumSupported === false) {
          isUnsupported = true;
        }
      }

      if (isUnsupported) {
        return {
          type: 'FORCE_UPDATE',
          reason: `Installed version '${currentVer}' is no longer supported for online play`
        };
      }

      return {
        type: 'OPTIONAL_UPDATE',
        reason: `Newer version '${targetManifest.version}' available`
      };
    }

    /**
     * Verifies save schema compatibility.
     * Save migration is strictly performed by the game, not the launcher.
     */
    isSaveSchemaCompatible(currentSchema, targetSchema) {
      return typeof currentSchema === 'number' && typeof targetSchema === 'number' && currentSchema <= targetSchema;
    }
  }

  return VersionManager;
});
