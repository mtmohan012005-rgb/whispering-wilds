/**
 * js/animation/full-body-ik.js
 * The Whispering Wilds (Kaattu Vazhi) - Full-Body IK & Grounding
 *
 * Coordinates pelvis height compensation, spine slope leveling,
 * and quadruped animal ground alignment (Nilgiri Tahr, elephant, gaur, cattle).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FullBodyIK = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class FullBodyIK {
    constructor() {
      this.pelvisOffset = 0.0;
      this.spineLean = { pitch: 0, roll: 0 };
      this.maxPelvisDrop = 0.35; // Maximum pelvis depression in meters
      this.smoothFactor = 0.2;
    }

    /**
     * Calculates human pelvis height and spine balance from foot IK offsets
     * @param {number} leftFootOffset - Left foot height delta
     * @param {number} rightFootOffset - Right foot height delta
     * @param {Object} groundNormal - Terrain normal vector {x, y, z}
     * @returns {{ pelvisYOffset: number, spinePitch: number, spineRoll: number }}
     */
    solveHumanGrounding(leftFootOffset, rightFootOffset, groundNormal = null) {
      // The pelvis drops to allow the higher foot's knee to flex while the lower foot reaches down
      const lowerFoot = Math.min(leftFootOffset, rightFootOffset);
      const targetDrop = Math.max(-this.maxPelvisDrop, Math.min(0.0, lowerFoot * 0.75));

      this.pelvisOffset += (targetDrop - this.pelvisOffset) * this.smoothFactor;

      let targetPitch = 0.0;
      let targetRoll = 0.0;

      if (groundNormal) {
        // Counter-lean to keep upper torso vertical
        targetPitch = -Math.atan2(groundNormal.z || 0, groundNormal.y || 1) * 0.4;
        targetRoll = Math.atan2(groundNormal.x || 0, groundNormal.y || 1) * 0.4;
      }

      this.spineLean.pitch += (targetPitch - this.spineLean.pitch) * this.smoothFactor;
      this.spineLean.roll += (targetRoll - this.spineLean.roll) * this.smoothFactor;

      return {
        pelvisYOffset: this.pelvisOffset,
        spinePitch: this.spineLean.pitch,
        spineRoll: this.spineLean.roll
      };
    }

    /**
     * Quadruped animal ground alignment for ungulates / wildlife
     * @param {Object} foreFeetPos - Average front feet position {x, y, z}
     * @param {Object} hindFeetPos - Average rear feet position {x, y, z}
     * @param {Function} terrainElevationFn - Ground sampler
     * @returns {{ bodyPitch: number, bodyRoll: number, avgGroundY: number }}
     */
    solveQuadrupedGrounding(foreFeetPos, hindFeetPos, terrainElevationFn) {
      if (!terrainElevationFn || !foreFeetPos || !hindFeetPos) {
        return { bodyPitch: 0, bodyRoll: 0, avgGroundY: 0 };
      }

      const foreY = terrainElevationFn(foreFeetPos.x, foreFeetPos.z);
      const hindY = terrainElevationFn(hindFeetPos.x, hindFeetPos.z);

      const spineLength = Math.hypot(foreFeetPos.x - hindFeetPos.x, foreFeetPos.z - hindFeetPos.z) || 1.5;
      const heightDiff = foreY - hindY;

      // Pitch angle: positive when uphill, negative downhill
      const bodyPitch = Math.max(-0.45, Math.min(0.45, Math.atan2(heightDiff, spineLength)));
      const avgGroundY = (foreY + hindY) * 0.5;

      return {
        bodyPitch,
        bodyRoll: 0.0,
        avgGroundY,
        foreY,
        hindY
      };
    }
  }

  return FullBodyIK;
});
