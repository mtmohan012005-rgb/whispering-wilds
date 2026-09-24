// ============================================================================
// THE WHISPERING WILDS - WORLD STREAMING SYSTEM ADAPTER
// Exposes authoritative WorldStreamingSystem interface with lifecycle safety.
// Ensures resources are disposed cleanly and avoid duplicate render loops.
// ============================================================================

(function () {
  'use strict';

  // Ensure WorldStreamingSystem class is globally accessible
  if (typeof window.WorldStreamingSystem !== 'undefined') {
    // If threeWorld already has an instance, expose it
    if (window.threeWorld?.worldStreaming) {
      window.worldStreamingSystem = window.threeWorld.worldStreaming;
    }
  }

  // Lifecycle hook: when region is transitioning or returning to menu,
  // unload non-shared region instances
  if (window.GameLifecycle) {
    window.GameLifecycle.on('stateChanged', (data) => {
      if (['RETURNING_TO_MENU', 'EXITING'].includes(data.to)) {
        if (window.worldStreamingSystem?.activeRegions) {
          for (const regionId of Object.keys(window.worldStreamingSystem.regions || {})) {
            try {
              window.worldStreamingSystem.unloadRegion(regionId);
            } catch (_) {}
          }
        }
      }
    });
  }
})();
