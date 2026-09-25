/**
 * The Whispering Wilds (Kaattu Vazhi) - World Asset Cache
 * Reference-counted, LRU asset caching across sectors for GLTF meshes, textures,
 * audio buffers, and PBR materials. Eliminates duplicate network/disk requests.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldAssetCache = factory();
    if (typeof window !== 'undefined') {
      window.WorldAssetCache = root.WorldAssetCache;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldAssetCacheEngine {
    constructor(maxCapacity = 64) {
      this.maxCapacity = maxCapacity;
      // Map of assetId -> { asset, refCount, lastUsed, sizeBytes, type }
      this._cache = new Map();
      this.hits = 0;
      this.misses = 0;
    }

    /**
     * Store or acquire an asset with reference counting
     */
    acquire(assetId, assetLoaderFn, type = 'model') {
      if (this._cache.has(assetId)) {
        const record = this._cache.get(assetId);
        record.refCount++;
        record.lastUsed = Date.now();
        this.hits++;
        return Promise.resolve(record.asset);
      }

      this.misses++;
      if (typeof assetLoaderFn !== 'function') {
        return Promise.reject(new Error(`[WorldAssetCache] No loader function provided for '${assetId}'`));
      }

      return Promise.resolve(assetLoaderFn()).then(loadedAsset => {
        this._cache.set(assetId, {
          asset: loadedAsset,
          refCount: 1,
          lastUsed: Date.now(),
          type
        });
        return loadedAsset;
      });
    }

    get(assetId) {
      const rec = this._cache.get(assetId);
      if (rec) {
        rec.lastUsed = Date.now();
        this.hits++;
        return rec.asset;
      }
      this.misses++;
      return null;
    }

    has(assetId) {
      return this._cache.has(assetId);
    }

    /**
     * Decrement reference count when a sector or object releases an asset
     */
    release(assetId) {
      const record = this._cache.get(assetId);
      if (record) {
        record.refCount = Math.max(0, record.refCount - 1);
        record.lastUsed = Date.now();
      }
    }

    /**
     * Evicts unreferenced assets (refCount === 0) starting with oldest lastUsed
     */
    trim(targetCount = 10) {
      const unreferenced = [];
      for (const [id, rec] of this._cache.entries()) {
        if (rec.refCount === 0) {
          unreferenced.push({ id, ...rec });
        }
      }

      // Sort oldest first
      unreferenced.sort((a, b) => a.lastUsed - b.lastUsed);

      const evicted = [];
      const toRemove = Math.min(targetCount, unreferenced.length);
      for (let i = 0; i < toRemove; i++) {
        const item = unreferenced[i];
        this._disposeAsset(item.asset);
        this._cache.delete(item.id);
        evicted.push(item.id);
      }

      if (evicted.length > 0) {
        console.log(`[WorldAssetCache] 🧹 Trimmed ${evicted.length} unreferenced assets from cache.`);
      }
      return evicted;
    }

    _disposeAsset(asset) {
      if (!asset) return;
      try {
        if (typeof asset.dispose === 'function') asset.dispose();
        if (asset.geometry && typeof asset.geometry.dispose === 'function') asset.geometry.dispose();
        if (asset.material) {
          if (Array.isArray(asset.material)) {
            asset.material.forEach(m => m && typeof m.dispose === 'function' && m.dispose());
          } else if (typeof asset.material.dispose === 'function') {
            asset.material.dispose();
          }
        }
      } catch (_) {}
    }

    clear() {
      for (const rec of this._cache.values()) {
        this._disposeAsset(rec.asset);
      }
      this._cache.clear();
    }
  }

  return new WorldAssetCacheEngine();
});
