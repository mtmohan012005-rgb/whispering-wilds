/**
 * The Whispering Wilds (Kaattu Vazhi) - Streaming Culling & Frustum Protection
 * Camera frustum culling for streaming cells, camera visibility weighting,
 * and Photo Mode visual cell locking.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreamingCulling = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class StreamingCulling {
    constructor(camera = null) {
      this.camera = camera;
      this.frustum = (typeof THREE !== 'undefined') ? new THREE.Frustum() : null;
      this.projScreenMatrix = (typeof THREE !== 'undefined') ? new THREE.Matrix4() : null;

      // Photo Mode Locking (Section 75, 76)
      this.isPhotoModeActive = false;
      this.photoModeLockedCellIds = new Set();

      // Scratch Box3 for fast intersection tests
      this._scratchBox = (typeof THREE !== 'undefined') ? new THREE.Box3() : null;
      this._scratchMin = (typeof THREE !== 'undefined') ? new THREE.Vector3() : null;
      this._scratchMax = (typeof THREE !== 'undefined') ? new THREE.Vector3() : null;
    }

    /**
     * Updates camera frustum planes from view-projection matrix
     */
    updateFrustum(camera = null) {
      const cam = camera || this.camera;
      if (!cam || typeof THREE === 'undefined') return;

      cam.updateMatrixWorld();
      this.projScreenMatrix.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    }

    /**
     * Tests if cell AABB intersects camera frustum
     */
    isCellInFrustum(cell) {
      if (!cell || !this.frustum || typeof THREE === 'undefined') return true;

      const b = cell.bounds;
      this._scratchMin.set(b.minX, b.minY || -10, b.minZ);
      this._scratchMax.set(b.maxX, b.maxY || 150, b.maxZ);
      this._scratchBox.set(this._scratchMin, this._scratchMax);

      return this.frustum.intersectsBox(this._scratchBox);
    }

    /**
     * Photo Mode visual cell locking (Section 75, 76)
     */
    setPhotoMode(active, currentActiveCellIds = []) {
      this.isPhotoModeActive = !!active;
      if (this.isPhotoModeActive) {
        this.photoModeLockedCellIds.clear();
        for (const id of currentActiveCellIds) {
          this.photoModeLockedCellIds.add(id);
        }
        console.log(`[StreamingCulling] 📷 Photo Mode ACTIVE: Locked ${this.photoModeLockedCellIds.size} visible cells.`);
      } else {
        this.photoModeLockedCellIds.clear();
        console.log('[StreamingCulling] 📷 Photo Mode INACTIVE: Visual cell locks released.');
      }
    }

    /**
     * Checks if a cell is locked by Photo Mode
     */
    isLockedByPhotoMode(cellId) {
      if (!this.isPhotoModeActive) return false;
      return this.photoModeLockedCellIds.has(cellId);
    }
  }

  return StreamingCulling;
});
