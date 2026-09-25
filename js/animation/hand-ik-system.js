/**
 * js/animation/hand-ik-system.js
 * The Whispering Wilds (Kaattu Vazhi) - Two-Bone Hand IK System
 *
 * Solves inverse kinematics for left and right arms to snap hands to
 * interaction anchors (door handles, gates, well pumps, oars, artifacts)
 * with reach limit verification and safe authored fallback.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HandIKSystem = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class HandIKSystem {
    constructor() {
      this.enabled = true;
      this.upperArmLength = 0.34; // Shoulder to elbow
      this.forearmLength = 0.32;  // Elbow to wrist/hand
      this.maxReach = this.upperArmLength + this.forearmLength - 0.01; // ~0.65m

      // Active target anchors
      this.rightHandTarget = null;
      this.leftHandTarget = null;
      this.blendWeight = 1.0;
    }

    setTarget(side, anchorTransform) {
      if (side === 'right' || side === 'both') {
        this.rightHandTarget = anchorTransform ? { ...anchorTransform } : null;
      }
      if (side === 'left' || side === 'both') {
        this.leftHandTarget = anchorTransform ? { ...anchorTransform } : null;
      }
    }

    clearTargets() {
      this.rightHandTarget = null;
      this.leftHandTarget = null;
    }

    /**
     * Analytical Two-Bone IK solver for arm
     * @param {Object} shoulderPos - World position { x, y, z }
     * @param {Object} targetPos - World position of interaction anchor { x, y, z }
     * @returns {{ reachable: boolean, elbowAngle: number, shoulderAngle: number, distance: number }}
     */
    solveArmIK(shoulderPos, targetPos) {
      if (!shoulderPos || !targetPos) {
        return { reachable: false, elbowAngle: 0, shoulderAngle: 0, distance: 0 };
      }

      const dx = targetPos.x - shoulderPos.x;
      const dy = targetPos.y - shoulderPos.y;
      const dz = targetPos.z - shoulderPos.z;
      const distance = Math.hypot(dx, dy, dz);

      // Check reach limit
      if (distance > this.maxReach) {
        // Target is out of reach -> do not stretch arm; signal fallback
        return {
          reachable: false,
          elbowAngle: 0.1,
          shoulderAngle: 0.0,
          distance,
          outOfReachBy: distance - this.maxReach
        };
      }

      const a = this.upperArmLength;
      const b = this.forearmLength;
      const c = Math.max(0.08, Math.min(distance, a + b - 0.005));

      // Law of cosines for elbow interior angle
      const cosElbow = (a * a + b * b - c * c) / (2 * a * b);
      const clampedCosElbow = Math.max(-1.0, Math.min(1.0, cosElbow));
      const elbowInterior = Math.acos(clampedCosElbow);
      const elbowFlexion = Math.PI - elbowInterior;

      // Shoulder elevation angle
      const cosShoulder = (a * a + c * c - b * b) / (2 * a * c);
      const clampedCosShoulder = Math.max(-1.0, Math.min(1.0, cosShoulder));
      const shoulderElevation = Math.acos(clampedCosShoulder);

      return {
        reachable: true,
        elbowAngle: elbowFlexion,
        shoulderAngle: shoulderElevation,
        distance
      };
    }
  }

  return HandIKSystem;
});
