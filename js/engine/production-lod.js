/**
 * The Whispering Wilds (Kaattu Vazhi) - Production LOD Manager
 * Distance-based Level of Detail and Frustum/Range Culling.
 *
 * Tiers:
 * - LOD0: 0 - 25m (Full fidelity PBR, shadows cast & received, active colliders)
 * - LOD1: 25 - 70m (Mid fidelity, simplified shading, non-critical shadows off)
 * - LOD2: 70 - 150m (Low fidelity silhouette / imposter)
 * - CULLED: 150m+ (Visibility toggled off, zero render-pass overhead)
 *
 * Landmarks override culling threshold up to 350m.
 */

class ProductionLOD {
  constructor(options = {}) {
    this.lod0Dist = options.lod0 || 25.0;
    this.lod1Dist = options.lod1 || 70.0;
    this.lod2Dist = options.lod2 || 150.0;
    this.isHeroLandmark = options.isHeroLandmark || false;

    if (this.isHeroLandmark) {
      this.lod0Dist = options.lod0 || 50.0;
      this.lod1Dist = options.lod1 || 120.0;
      this.lod2Dist = options.lod2 || 350.0;
    }

    // Square distances for fast distance comparisons without Math.sqrt
    this.lodBias = options.lodBias || 1.0;
    const bSq = this.lodBias * this.lodBias;
    this.lod0Sq = (this.lod0Dist * this.lod0Dist) * bSq;
    this.lod1Sq = (this.lod1Dist * this.lod1Dist) * bSq;
    this.lod2Sq = (this.lod2Dist * this.lod2Dist) * bSq;

    this.currentLevel = 0; // 0: LOD0, 1: LOD1, 2: LOD2, -1: Culled
    this.isVisible = true;
  }

  setLODBias(bias) {
    if (typeof bias !== 'number' || bias <= 0) return;
    this.lodBias = bias;
    const bSq = bias * bias;
    this.lod0Sq = (this.lod0Dist * this.lod0Dist) * bSq;
    this.lod1Sq = (this.lod1Dist * this.lod1Dist) * bSq;
    this.lod2Sq = (this.lod2Dist * this.lod2Dist) * bSq;
  }

  /**
   * Evaluates distance squared from camera/player position to target object
   * @param {number} distSq - Distance squared
   * @returns {number} Current LOD index: 0, 1, 2, or -1 (Culled)
   */
  evaluateDistSq(distSq) {
    if (distSq > this.lod2Sq) {
      this.currentLevel = -1;
      this.isVisible = false;
    } else if (distSq > this.lod1Sq) {
      this.currentLevel = 2;
      this.isVisible = true;
    } else if (distSq > this.lod0Sq) {
      this.currentLevel = 1;
      this.isVisible = true;
    } else {
      this.currentLevel = 0;
      this.isVisible = true;
    }
    return this.currentLevel;
  }

  /**
   * Applies LOD state to a Three.js Object3D / Group
   * @param {THREE.Object3D} object - The target 3D instance
   * @param {number} distSq - Distance squared
   */
  applyToObject(object, distSq) {
    const prevLevel = this.currentLevel;
    const prevVis = this.isVisible;
    const level = this.evaluateDistSq(distSq);

    if (object.visible !== this.isVisible) {
      object.visible = this.isVisible;
    }

    if (!this.isVisible) return level;

    // Apply shadow & fidelity optimizations if LOD changed
    if (level !== prevLevel) {
      if (level === 0) {
        object.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      } else if (level === 1) {
        object.traverse(child => {
          if (child.isMesh) {
            child.castShadow = false; // Disable dynamic shadow casting at medium range
            child.receiveShadow = true;
          }
        });
      } else if (level === 2) {
        object.traverse(child => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
          }
        });
      }
    }

    return level;
  }
}

if (typeof window !== 'undefined') {
  window.ProductionLOD = ProductionLOD;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProductionLOD };
}
