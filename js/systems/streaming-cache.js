/**
 * The Whispering Wilds (Kaattu Vazhi) - Streaming Cache & Resource Lifecycle
 * Multi-tier cache (HOT, WARM, COLD), shared asset reference counting,
 * memory pressure response, and leak-free resource disposal.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreamingCache = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class StreamingCache {
    constructor(options = {}) {
      this.coldCapacity = options.coldCapacity || 8;

      // Multi-tier cache maps (cellId -> CacheEntry)
      this.hot = new Map();   // Currently active rendered cells
      this.warm = new Map();  // Preloaded nearby cells ready for activation
      this.cold = new Map();  // Recently deactivated cells (cellId -> { cellData, lastUsedTime })

      // Shared asset reference counting (Section 50)
      // assetKey -> { refCount: number, asset: any, type: string }
      this.sharedAssets = new Map();

      // Disposal hooks
      this.disposedCount = 0;
    }

    /**
     * Retains reference to a shared asset (texture, geometry, material)
     */
    retainAsset(assetKey, assetObj = null, type = 'mesh') {
      if (!assetKey) return;
      let entry = this.sharedAssets.get(assetKey);
      if (!entry) {
        entry = { refCount: 0, asset: assetObj, type };
        this.sharedAssets.set(assetKey, entry);
      }
      entry.refCount++;
      return entry.refCount;
    }

    /**
     * Releases reference to a shared asset. Disposes if refCount <= 0 and not pinned
     */
    releaseAsset(assetKey, immediateDispose = false) {
      if (!assetKey) return;
      const entry = this.sharedAssets.get(assetKey);
      if (!entry) return;

      entry.refCount--;
      if (entry.refCount <= 0) {
        entry.refCount = 0;
        if (immediateDispose) {
          this.disposeAsset(entry.asset);
          this.sharedAssets.delete(assetKey);
        }
      }
    }

    getAssetRefCount(assetKey) {
      const entry = this.sharedAssets.get(assetKey);
      return entry ? entry.refCount : 0;
    }

    /**
     * Moves cell into HOT cache
     */
    markHot(cellId, cellPayload) {
      this.cold.delete(cellId);
      this.warm.delete(cellId);
      this.hot.set(cellId, {
        cellId,
        payload: cellPayload,
        lastUsedTime: performance.now(),
        tier: 'HOT'
      });
    }

    /**
     * Promotes cell to WARM cache (preloaded ahead of player)
     */
    markWarm(cellId, cellPayload) {
      this.cold.delete(cellId);
      this.hot.delete(cellId);
      this.warm.set(cellId, {
        cellId,
        payload: cellPayload,
        lastUsedTime: performance.now(),
        tier: 'WARM'
      });
    }

    /**
     * Demotes cell into COLD cache when deactivated (retains for quick reactivation)
     */
    demoteToCold(cellId, cellPayload = null) {
      const existing = this.hot.get(cellId) || this.warm.get(cellId);
      const payload = cellPayload || (existing ? existing.payload : null);

      this.hot.delete(cellId);
      this.warm.delete(cellId);

      this.cold.set(cellId, {
        cellId,
        payload,
        lastUsedTime: performance.now(),
        tier: 'COLD'
      });

      // Check if cold cache exceeds capacity
      if (this.cold.size > this.coldCapacity) {
        this.evictOldestCold();
      }
    }

    /**
     * Evicts the oldest entry in COLD cache
     */
    evictOldestCold() {
      let oldestKey = null;
      let oldestTime = Infinity;

      for (const [key, entry] of this.cold.entries()) {
        if (entry.lastUsedTime < oldestTime) {
          oldestTime = entry.lastUsedTime;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.evictCell(oldestKey);
      }
    }

    /**
     * Fully unloads and disposes a cell from the cache
     */
    evictCell(cellId) {
      const entry = this.cold.get(cellId) || this.warm.get(cellId);
      if (!entry) return null;

      this.cold.delete(cellId);
      this.warm.delete(cellId);

      // Dispose resources if payload has meshes
      if (entry.payload) {
        if (entry.payload.meshes && Array.isArray(entry.payload.meshes)) {
          for (const mesh of entry.payload.meshes) {
            this.disposeObject(mesh);
          }
        }
        if (entry.payload.assets && Array.isArray(entry.payload.assets)) {
          for (const assetKey of entry.payload.assets) {
            this.releaseAsset(assetKey, true);
          }
        }
      }

      this.disposedCount++;
      return entry;
    }

    /**
     * Memory pressure response (Section 52)
     * Pressure levels: 'NORMAL', 'HIGH', 'CRITICAL'
     */
    handleMemoryPressure(pressureLevel) {
      if (pressureLevel === 'CRITICAL') {
        // Evict ALL cold entries and unused shared assets
        for (const cellId of Array.from(this.cold.keys())) {
          this.evictCell(cellId);
        }
        // Sweep zero-ref shared assets
        for (const [key, entry] of this.sharedAssets.entries()) {
          if (entry.refCount <= 0) {
            this.disposeAsset(entry.asset);
            this.sharedAssets.delete(key);
          }
        }
      } else if (pressureLevel === 'HIGH') {
        // Evict half of cold cache entries
        const toEvict = Math.ceil(this.cold.size * 0.5);
        for (let i = 0; i < toEvict; i++) {
          this.evictOldestCold();
        }
      }
    }

    /**
     * Safely disposes Three.js Object3D hierarchy (Section 97)
     */
    disposeObject(obj) {
      if (!obj) return;
      if (obj.parent) obj.parent.remove(obj);

      if (typeof obj.traverse === 'function') {
        obj.traverse(child => {
          if (child.geometry && typeof child.geometry.dispose === 'function') {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => this.disposeMaterial(m));
            } else {
              this.disposeMaterial(child.material);
            }
          }
        });
      }
    }

    disposeMaterial(mat) {
      if (!mat) return;
      if (typeof mat.dispose === 'function') mat.dispose();
      ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap'].forEach(p => {
        if (mat[p] && typeof mat[p].dispose === 'function') {
          mat[p].dispose();
        }
      });
    }

    disposeAsset(asset) {
      if (!asset) return;
      if (asset.isObject3D) {
        this.disposeObject(asset);
      } else if (asset.isTexture && typeof asset.dispose === 'function') {
        asset.dispose();
      }
    }

    clear() {
      for (const cellId of Array.from(this.cold.keys())) {
        this.evictCell(cellId);
      }
      for (const cellId of Array.from(this.warm.keys())) {
        this.evictCell(cellId);
      }
      this.hot.clear();
      this.warm.clear();
      this.cold.clear();
      this.sharedAssets.clear();
    }
  }

  return StreamingCache;
});
