/**
 * The Whispering Wilds (Kaattu Vazhi) - Production Asset Adapter
 * Global coordinator, configuration profiles, and diagnostics for production 3D assets.
 */

class ProductionAssetsAdapter {
  constructor() {
    this.textureQuality = '2K'; // '4K' for hero, '2K' for normal, '1K' for props
    this.targetFPS = 60;
    this.isPCOptimized = true;
    this.worldAssets = null;
  }

  init(worldAssets) {
    this.worldAssets = worldAssets;
    console.log('[ProductionAssets] Initialized Production Asset Adapter for Tamil Nadu Open-World (PC 60 FPS Target)');
  }

  /**
   * Diagnostic report of all registered vs missing assets
   */
  getAssetCompletenessReport() {
    if (!this.worldAssets) return { total: 0, loaded: 0, missing: 0, percentage: 0 };

    const total = this.worldAssets.registry.size;
    const loaded = this.worldAssets.loadedAssets.size;
    const missing = this.worldAssets.missingAssets.size;

    return {
      totalRegistered: total,
      loadedOnDisk: loaded,
      missingLocalGLBs: missing,
      completionPercentage: total > 0 ? ((loaded / total) * 100).toFixed(1) + '%' : '0%',
      missingList: Array.from(this.worldAssets.missingAssets.entries()).map(([id, info]) => ({
        id,
        region: info.region,
        expected: info.expected
      }))
    };
  }

  /**
   * Validates whether a given asset ID is verified local GLB on disk
   * @param {string} id
   */
  isAssetProductionReady(id) {
    return this.worldAssets ? this.worldAssets.loadedAssets.has(id) : false;
  }
}

if (typeof window !== 'undefined') {
  window.productionAssetsAdapter = new ProductionAssetsAdapter();
  window.ProductionAssetsAdapter = ProductionAssetsAdapter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProductionAssetsAdapter };
}
