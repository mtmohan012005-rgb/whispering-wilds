/**
 * The Whispering Wilds (Kaattu Vazhi) - World Memory Budget Manager
 * Monitors geometry, texture VRAM, audio buffers, animation tracks, and entity heaps.
 * Dynamically sheds non-essential LOD and distant sector caches under memory pressure.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldMemory = factory();
    if (typeof window !== 'undefined') {
      window.WorldMemory = root.WorldMemory;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Hardware Tier Memory Budgets (Megabytes)
  const MEMORY_BUDGETS_MB = Object.freeze({
    LOW: { total: 512, textures: 256, geometry: 128, audio: 64, entities: 64 },
    MEDIUM: { total: 1024, textures: 512, geometry: 256, audio: 128, entities: 128 },
    HIGH: { total: 2048, textures: 1024, geometry: 512, audio: 256, entities: 256 },
    ULTRA: { total: 4096, textures: 2048, geometry: 1024, audio: 512, entities: 512 }
  });

  class WorldMemoryEngine {
    constructor(tier = 'MEDIUM') {
      this.currentTier = tier;
      this.budget = { ...MEMORY_BUDGETS_MB[tier] };

      this.usage = {
        texturesMb: 0,
        geometryMb: 0,
        audioMb: 0,
        entitiesMb: 0,
        totalMb: 0
      };

      this.isUnderPressure = false;
    }

    setTier(tier) {
      if (MEMORY_BUDGETS_MB[tier]) {
        this.currentTier = tier;
        this.budget = { ...MEMORY_BUDGETS_MB[tier] };
      }
    }

    updateUsage(metrics = {}) {
      if (metrics.texturesMb !== undefined) this.usage.texturesMb = metrics.texturesMb;
      if (metrics.geometryMb !== undefined) this.usage.geometryMb = metrics.geometryMb;
      if (metrics.audioMb !== undefined) this.usage.audioMb = metrics.audioMb;
      if (metrics.entitiesMb !== undefined) this.usage.entitiesMb = metrics.entitiesMb;

      this.usage.totalMb = this.usage.texturesMb + this.usage.geometryMb + this.usage.audioMb + this.usage.entitiesMb;
      this.isUnderPressure = this.usage.totalMb >= this.budget.total * 0.85;

      return this.isUnderPressure;
    }

    getMemoryReport() {
      return {
        tier: this.currentTier,
        budget: this.budget,
        usage: this.usage,
        utilizationPercent: Math.round((this.usage.totalMb / (this.budget.total || 1)) * 100),
        isUnderPressure: this.isUnderPressure
      };
    }
  }

  return new WorldMemoryEngine();
});
