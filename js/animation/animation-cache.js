/**
 * js/animation/animation-cache.js
 * The Whispering Wilds (Kaattu Vazhi) - Animation Resource Cache & Pose Pool
 *
 * Caches reusable AnimationClips, bone indices, and matrix calculation buffers
 * to eliminate GC memory allocations and prevent duplicate AnimationMixers.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationCache = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AnimationCache {
    constructor() {
      this.clipCache = new Map();     // urlOrKey -> Array<THREE.AnimationClip>
      this.rigMetadata = new Map();   // modelId -> boneMap
      this.activeMixers = new Set();  // Set of registered mixers (prevents duplicates)

      // Object pool for IK & procedural math (avoids per-frame `new THREE.Vector3()`)
      this.vectorPool = [];
      this.quaternionPool = [];
      this.poolCapacity = 64;

      this._initPools();
    }

    _initPools() {
      for (let i = 0; i < this.poolCapacity; i++) {
        this.vectorPool.push({ x: 0, y: 0, z: 0 });
        this.quaternionPool.push({ x: 0, y: 0, z: 0, w: 1 });
      }
    }

    /**
     * Stores clips associated with an asset key
     */
    cacheClips(assetKey, clips) {
      if (!assetKey || !Array.isArray(clips)) return;
      this.clipCache.set(assetKey, clips);
    }

    getClips(assetKey) {
      return this.clipCache.get(assetKey) || null;
    }

    hasClips(assetKey) {
      return this.clipCache.has(assetKey);
    }

    /**
     * Registers an active mixer and flags duplicate registrations
     */
    registerMixer(mixer) {
      if (this.activeMixers.has(mixer)) {
        console.warn('[AnimationCache] Detected duplicate AnimationMixer registration');
        return false;
      }
      this.activeMixers.add(mixer);
      return true;
    }

    unregisterMixer(mixer) {
      if (this.activeMixers.has(mixer)) {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
        this.activeMixers.delete(mixer);
        return true;
      }
      return false;
    }

    getActiveMixerCount() {
      return this.activeMixers.size;
    }

    /**
     * Obtains a pooled temporary vector
     */
    acquireVector(x = 0, y = 0, z = 0) {
      const v = this.vectorPool.length > 0 ? this.vectorPool.pop() : { x: 0, y: 0, z: 0 };
      v.x = x; v.y = y; v.z = z;
      return v;
    }

    releaseVector(v) {
      if (this.vectorPool.length < this.poolCapacity) {
        this.vectorPool.push(v);
      }
    }

    clear() {
      this.clipCache.clear();
      this.rigMetadata.clear();
      for (const mixer of this.activeMixers) {
        try {
          mixer.stopAllAction();
        } catch (_) {}
      }
      this.activeMixers.clear();
    }
  }

  // Global singleton
  if (typeof window !== 'undefined') {
    window.ProductionAnimationCache = new AnimationCache();
  }

  return AnimationCache;
});
