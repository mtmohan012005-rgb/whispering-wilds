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

  window.GraphicsProfileManager = GraphicsProfileManager;
  window.graphicsProfileManager = new GraphicsProfileManager();
})();
