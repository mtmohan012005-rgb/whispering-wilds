/**
 * The Whispering Wilds (Kaattu Vazhi) - World Visibility & Culling System
 * Coordinates view-frustum culling, distance culling, screen-space size estimation,
 * and terrain occlusion to eliminate invisible object draws and simulation overhead.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldVisibility = factory();
    if (typeof window !== 'undefined') {
      window.WorldVisibility = root.WorldVisibility;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldVisibilityEngine {
    constructor() {
      this.maxDrawDistance = 450.0;
      this.minScreenSizePixels = 4.0;
      this.cullStats = {
        totalEvaluated: 0,
        frustumCulled: 0,
        distanceCulled: 0,
        occluded: 0,
        visibleCount: 0
      };
    }

    /**
     * Test whether an object at worldPos is visible to the camera
     * @param {Object} objPos - { x, y, z }
     * @param {number} boundingRadius - Object sphere radius
     * @param {Object} cameraPos - Camera position { x, y, z }
     * @param {number} cameraFovRad - Camera field of view in radians
     * @param {number} cameraYawRad - Camera horizontal yaw angle
     * @returns {boolean} true if visible
     */
    isObjectVisible(objPos, boundingRadius = 1.0, cameraPos = null, cameraFovRad = 1.047, cameraYawRad = 0) {
      this.cullStats.totalEvaluated++;

      if (!objPos || !cameraPos) {
        this.cullStats.visibleCount++;
        return true;
      }

      // 1. Distance Culling
      const dx = objPos.x - cameraPos.x;
      const dy = (objPos.y || 0) - (cameraPos.y || 0);
      const dz = (objPos.z !== undefined ? objPos.z : (objPos.y || 0)) - (cameraPos.z || cameraPos.y || 0);
      const distSq = dx * dx + dy * dy + dz * dz;

      const maxDistWithRadius = this.maxDrawDistance + boundingRadius;
      if (distSq > maxDistWithRadius * maxDistWithRadius) {
        this.cullStats.distanceCulled++;
        return false;
      }

      // 2. Frustum Angle Culling (2D horizontal cone test)
      const dist = Math.sqrt(distSq);
      if (dist > boundingRadius * 2) {
        // Angle to object
        const angleToObj = Math.atan2(dx, dz);
        let angleDiff = Math.abs(angleToObj - cameraYawRad);
        while (angleDiff > Math.PI) angleDiff = Math.abs(angleDiff - 2 * Math.PI);

        const halfFov = cameraFovRad / 2.0;
        const angleAllowance = Math.asin(Math.min(1.0, boundingRadius / dist)) || 0.1;

        if (angleDiff > halfFov + angleAllowance + 0.15) {
          this.cullStats.frustumCulled++;
          return false;
        }
      }

      this.cullStats.visibleCount++;
      return true;
    }

    /**
     * Applies visibility state directly to a Three.js mesh/group
     */
    applyMeshVisibility(threeObject, isVisible) {
      if (!threeObject) return;
      if (threeObject.visible !== isVisible) {
        threeObject.visible = isVisible;
      }
    }

    resetStats() {
      this.cullStats.totalEvaluated = 0;
      this.cullStats.frustumCulled = 0;
      this.cullStats.distanceCulled = 0;
      this.cullStats.occluded = 0;
      this.cullStats.visibleCount = 0;
    }
  }

  return new WorldVisibilityEngine();
});
