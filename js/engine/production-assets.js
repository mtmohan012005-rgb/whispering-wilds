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

  setQualityProfile(presetId) {
    const config = window.GRAPHICS_CONFIG;
    if (config && config.PRESETS[presetId]) {
      const p = config.PRESETS[presetId];
      this.textureQuality = p.textureQuality;
      if (this.worldAssets && typeof this.worldAssets.setLODBias === 'function') {
        this.worldAssets.setLODBias(p.lodBias);
      }
    }
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

  /**
   * Section 137: External Asset Audit
   * Validates that all registered production assets are strictly local.
   *
   * NOTE: this previously read `window.WORLD_ASSET_REGISTRY`, a global that no
   * file in the project ever defines, so the loop always iterated an empty
   * object and reported `passed: true` without checking anything. It now walks
   * the real registry map populated by ProductionWorldAssets.
   */
  auditExternalDependencies() {
    const issues = [];
    const registry = this.worldAssets && this.worldAssets.registry;
    if (!registry) {
      return { passed: false, issues, count: 0, error: 'asset registry unavailable' };
    }
    for (const [id, item] of registry.entries()) {
      const url = (item && (item.url || item.path)) || '';
      if (/^https?:\/\//i.test(url) || /^\/\//.test(url) || /(^|\/)cdn\./i.test(url)) {
        issues.push({ id, url });
      }
    }
    return {
      passed: issues.length === 0,
      issues,
      count: issues.length,
      audited: registry.size
    };
  }
}

if (typeof window !== 'undefined') {
  window.productionAssetsAdapter = new ProductionAssetsAdapter();
  window.ProductionAssetsAdapter = ProductionAssetsAdapter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProductionAssetsAdapter };
}
