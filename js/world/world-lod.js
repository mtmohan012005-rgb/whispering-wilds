/**
 * The Whispering Wilds (Kaattu Vazhi) - World LOD & HLOD Manager
 * Computes discrete Level-Of-Detail tiers (LOD0 to LOD4) based on distance, screen size,
 * hardware capability, and cultural landmark protection (Thanjavur, Chettinad, Shore Temple).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldLOD = factory();
    if (typeof window !== 'undefined') {
      window.WorldLOD = root.WorldLOD;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LOD_LEVELS = Object.freeze({
    LOD0: 0, // Hero Quality: Full mesh, PBR shaders, dynamic shadow, full vertex bones
    LOD1: 1, // Medium Quality: 60% polycount, standard materials, low bones
    LOD2: 2, // Low Quality: 30% polycount, simplified shader, no shadows
    LOD3: 3, // Very Low: 10% polycount, unlit/vertex-lit
    LOD4: 4  // Impostor/Billboard: 2D quad oriented to camera
  });

  // Base Distance Thresholds (meters)
  const DEFAULT_THRESHOLDS = Object.freeze({
    LOD0_MAX: 30.0,
    LOD1_MAX: 75.0,
    LOD2_MAX: 150.0,
    LOD3_MAX: 280.0
    // Beyond 280m -> LOD4 Billboard
  });

  class WorldLODEngine {
    constructor() {
      this.LOD_LEVELS = LOD_LEVELS;
      this.thresholds = { ...DEFAULT_THRESHOLDS };
      this.bias = 1.0; // Scaled by hardware profile (e.g. 1.3 on ULTRA, 0.7 on LOW)
      this._culturalBias = 2.0; // Cultural landmarks get double distance before dropping LOD
    }

    setHardwareTier(tier) {
      if (tier === 'ULTRA') this.bias = 1.4;
      else if (tier === 'HIGH') this.bias = 1.1;
      else if (tier === 'MEDIUM') this.bias = 1.0;
      else if (tier === 'LOW') this.bias = 0.75;
    }

    /**
     * Compute appropriate LOD level for an asset
     * @param {number} distance - Distance to camera
     * @param {Object} options - { isCulturalLandmark, isHero, baseRadius }
     * @returns {number} LOD index (0..4)
     */
    computeLOD(distance, options = {}) {
      const isLandmark = !!options.isCulturalLandmark;
      const isHero = !!options.isHero;

      // Apply generous budget multiplier for cultural heritage and hero character
      let effDistance = distance / this.bias;
      if (isLandmark) effDistance /= this._culturalBias;
      if (isHero) effDistance /= 1.5;

      if (effDistance <= this.thresholds.LOD0_MAX) return LOD_LEVELS.LOD0;
      if (effDistance <= this.thresholds.LOD1_MAX) return LOD_LEVELS.LOD1;
      if (effDistance <= this.thresholds.LOD2_MAX) return LOD_LEVELS.LOD2;
      if (effDistance <= this.thresholds.LOD3_MAX) return LOD_LEVELS.LOD3;
      return LOD_LEVELS.LOD4;
    }

    /**
     * Clusters distant vegetation or props into an HLOD group
     */
    clusterInstances(instances, clusterRadius = 40.0) {
      if (!Array.isArray(instances) || instances.length <= 1) return [];

      const clusters = [];
      const assigned = new Set();

      for (let i = 0; i < instances.length; i++) {
        if (assigned.has(i)) continue;
        const root = instances[i];
        const group = [root];
        assigned.add(i);

        for (let j = i + 1; j < instances.length; j++) {
          if (assigned.has(j)) continue;
          const candidate = instances[j];
          const d = Math.hypot(root.x - candidate.x, (root.z || root.y) - (candidate.z || candidate.y));
          if (d <= clusterRadius) {
            group.push(candidate);
            assigned.add(j);
          }
        }

        // Calculate centroid
        const avgX = group.reduce((s, it) => s + it.x, 0) / group.length;
        const avgZ = group.reduce((s, it) => s + (it.z || it.y || 0), 0) / group.length;
        clusters.push({
          center: { x: avgX, z: avgZ },
          items: group,
          count: group.length
        });
      }

      return clusters;
    }
  }

  return new WorldLODEngine();
});
