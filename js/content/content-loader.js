// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT LOADER
// Asynchronous content loading, region streaming, hot-reloading (dev mode),
// and graceful missing asset fallbacks.
// ============================================================================

(function () {
  'use strict';

  class ContentLoader {
    constructor(registry = null) {
      this.registry = registry || window.ContentRegistry;
      this.loadedBundles = new Set();
      this.isLoading = false;
      this.cache = new Map();
      this.hotReloadEnabled = true;
    }

    /**
     * Load all core bundled content into registry
     */
    async loadAllContent(bundles = null) {
      const startTime = performance.now();
      this.isLoading = true;

      const reg = this.registry || window.ContentRegistry;
      const dataBundle = bundles || window.CONTENT_DATA_BUNDLE || {};

      console.log('[ContentLoader] Loading content database into ContentRegistry...');

      let totalLoaded = 0;
      for (const [type, items] of Object.entries(dataBundle)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            try {
              reg.register(type, item);
              totalLoaded++;
            } catch (err) {
              console.warn(`[ContentLoader] Warning registering ${type} item:`, err.message);
            }
          }
        }
      }

      const elapsed = performance.now() - startTime;
      console.log(`[ContentLoader] Successfully loaded ${totalLoaded} content definitions in ${elapsed.toFixed(1)}ms.`);

      if (window.ContentTelemetry) {
        window.ContentTelemetry.recordLoadTime(elapsed);
        window.ContentTelemetry.updateSnapshot();
      }

      this.isLoading = false;
      return { totalLoaded, elapsedMs: elapsed };
    }

    /**
     * Hot-reload a specific content definition by type and ID without resetting player save
     */
    async hotReloadContent(type, id, updatedDef = null) {
      const reg = this.registry || window.ContentRegistry;
      if (!reg) return { success: false, reason: 'REGISTRY_NOT_AVAILABLE' };

      console.log(`[ContentLoader] Hot-reloading content '${id}' of type '${type}'...`);

      let newDef = updatedDef;
      if (!newDef) {
        // Try fetching updated JSON file if in local server
        try {
          const resp = await fetch(`content/${type}/${id}.json?t=${Date.now()}`);
          if (resp.ok) {
            newDef = await resp.json();
          }
        } catch (e) {
          console.warn(`[ContentLoader] Could not fetch remote file for hot reload:`, e);
        }
      }

      if (!newDef) {
        return { success: false, reason: 'NO_UPDATED_DATA' };
      }

      // Re-register (ContentRegistry supports overwrite with warning)
      const registered = reg.register(type, newDef);

      // Re-validate content
      if (window.ContentValidator) {
        window.ContentValidator.validateAll();
      }

      // Notify systems via ContentEvents
      if (window.ContentEvents) {
        window.ContentEvents.emit('content_hot_reloaded', { type, id, def: registered });
      }

      console.log(`[ContentLoader] Hot-reload complete for '${id}'. Save state preserved.`);
      return { success: true, type, id, def: registered };
    }

    /**
     * Load asset with graceful fallback
     */
    async loadAssetSafe(assetPath, fallbackUrl = 'assets/textures/placeholder.png') {
      try {
        const resp = await fetch(assetPath, { method: 'HEAD' });
        if (resp.ok) return { path: assetPath, isFallback: false };
      } catch (_) {}

      console.warn(`[ContentLoader] Asset missing '${assetPath}', using fallback '${fallbackUrl}'`);
      if (window.ContentTelemetry) {
        window.ContentTelemetry.recordFailedAsset(assetPath, 'File not found');
      }
      return { path: fallbackUrl, isFallback: true };
    }
  }

  const instance = new ContentLoader();

  if (typeof window !== 'undefined') {
    window.ContentLoader = instance;
    window.contentLoader = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})();
