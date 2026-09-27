/**
 * js/systems/graphics-profile-manager.js
 * Graphics Profile Manager Migration Shim
 * Migrated to authoritative PerformanceManager per Universal PC Performance Architecture.
 */

(function () {
  'use strict';

  class GraphicsProfileManager {
    constructor() {
      // Delegates directly to authoritative PerformanceManager
    }

    get currentProfile() {
      return window.performanceManager ? window.performanceManager.currentProfile : 'MEDIUM';
    }

    applyProfile(profileId) {
      if (window.performanceManager) {
        return window.performanceManager.applyProfile(profileId, true);
      }
      return false;
    }

    getSettings() {
      return window.performanceManager ? window.performanceManager.runtimeSettings : null;
    }
  }

  // The authoritative singleton lives in js/core/graphics-profile.js and is
  // exposed as window.GraphicsProfileManager with the instance API
  // (.profile, .getEffectiveDPR, .getSummary, .updateDynamicResolution, .autoSelect).
  // This shim must NOT overwrite that global, otherwise every consumer of the
  // real instance loses it and crashes. Expose the shim under its own name.
  window.GraphicsProfileMigrationShim = GraphicsProfileManager;
  window.graphicsProfileManager = window.GraphicsProfileManager || new GraphicsProfileManager();
})();
