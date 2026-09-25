/**
 * The Whispering Wilds (Kaattu Vazhi) - World Origin Manager
 * Floating origin system to eliminate 32-bit floating point precision jitter
 * over massive open-world Tamil Nadu distances.
 * Gated by safe points (never shifts during cinematics, saving, or dialogue).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldOriginManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldOriginManager {
    constructor(threshold = 1500.0) {
      this.SHIFT_THRESHOLD = threshold;
      this.accumulatedOffset = { x: 0, y: 0, z: 0 };
      this.shiftCount = 0;
      this.shiftListeners = [];

      // Safety locks (Section 63)
      this.isCinematicActive = false;
      this.isSavingActive = false;
      this.isInteractionActive = false;
      this.isMultiplayerCorrectionActive = false;
    }

    /**
     * Checks if environment is safe for an origin shift (Section 63)
     */
    isSafeToShift() {
      if (this.isCinematicActive) return false;
      if (this.isSavingActive) return false;
      if (this.isInteractionActive) return false;
      if (this.isMultiplayerCorrectionActive) return false;

      const lc = typeof window !== 'undefined' ? window.GameLifecycle : null;
      if (lc && (lc.state === 'LOADING' || lc.state === 'TRANSITIONING')) return false;

      return true;
    }

    /**
     * Evaluates player position and executes origin shift if threshold is exceeded
     */
    checkAndShift(playerPos, entitiesToShift = {}) {
      if (!playerPos || !this.isSafeToShift()) return false;

      const distFromOrigin = Math.hypot(playerPos.x, playerPos.z);
      if (distFromOrigin < this.SHIFT_THRESHOLD) return false;

      // Calculate shift amount to bring player near center
      const shiftX = playerPos.x;
      const shiftZ = playerPos.z;

      return this.executeShift(shiftX, shiftZ, entitiesToShift);
    }

    /**
     * Executes the floating origin translation
     */
    executeShift(shiftX, shiftZ, entities = {}) {
      if (!this.isSafeToShift()) {
        console.warn('[WorldOriginManager] Shift aborted — unsafe game state.');
        return false;
      }

      console.log(`[WorldOriginManager] 🌐 Shifting world origin by Δ(${shiftX.toFixed(1)}, ${shiftZ.toFixed(1)})`);

      // 1. Update accumulated offset
      this.accumulatedOffset.x += shiftX;
      this.accumulatedOffset.z += shiftZ;
      this.shiftCount++;

      // 2. Shift player
      if (entities.player) {
        if (typeof entities.player.shiftPosition === 'function') {
          entities.player.shiftPosition(-shiftX, 0, -shiftZ);
        } else if (entities.player.position) {
          entities.player.position.x -= shiftX;
          entities.player.position.z -= shiftZ;
        }
      }

      // 3. Shift camera
      if (entities.cameraController) {
        if (entities.cameraController.camera) {
          entities.cameraController.camera.position.x -= shiftX;
          entities.cameraController.camera.position.z -= shiftZ;
        }
        if (entities.cameraController.currentTarget) {
          entities.cameraController.currentTarget.x -= shiftX;
          entities.cameraController.currentTarget.z -= shiftZ;
        }
      }

      // 4. Shift scene objects or terrain chunks if provided
      if (entities.sceneRoots && Array.isArray(entities.sceneRoots)) {
        for (const root of entities.sceneRoots) {
          if (root && root.position) {
            root.position.x -= shiftX;
            root.position.z -= shiftZ;
          }
        }
      }

      // 5. Notify registered listeners (e.g. physics, terrain, particles)
      const eventData = {
        deltaX: -shiftX,
        deltaZ: -shiftZ,
        accumulatedOffset: { ...this.accumulatedOffset },
        shiftCount: this.shiftCount
      };

      for (const listener of this.shiftListeners) {
        try {
          listener(eventData);
        } catch (err) {
          console.error('[WorldOriginManager] Error in shift listener:', err);
        }
      }

      return true;
    }

    onOriginShift(callback) {
      if (typeof callback === 'function') {
        this.shiftListeners.push(callback);
      }
    }

    /**
     * Converts a shifted local position to absolute persistent world coordinates
     */
    toAbsoluteWorld(localPos) {
      if (!localPos) return { x: 0, y: 0, z: 0 };
      return {
        x: localPos.x + this.accumulatedOffset.x,
        y: localPos.y || 0,
        z: localPos.z + this.accumulatedOffset.z
      };
    }

    /**
     * Converts absolute persistent coordinates into current local frame
     */
    toLocalCoordinates(absPos) {
      if (!absPos) return { x: 0, y: 0, z: 0 };
      return {
        x: absPos.x - this.accumulatedOffset.x,
        y: absPos.y || 0,
        z: absPos.z - this.accumulatedOffset.z
      };
    }

    reset() {
      this.accumulatedOffset = { x: 0, y: 0, z: 0 };
      this.shiftCount = 0;
      this.isCinematicActive = false;
      this.isSavingActive = false;
      this.isInteractionActive = false;
      this.isMultiplayerCorrectionActive = false;
    }
  }

  return WorldOriginManager;
});
