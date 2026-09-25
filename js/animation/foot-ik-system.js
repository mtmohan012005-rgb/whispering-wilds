/**
 * js/animation/foot-ik-system.js
 * The Whispering Wilds (Kaattu Vazhi) - Two-Bone Foot IK System
 *
 * Implements analytical Two-Bone inverse kinematics for left and right legs,
 * conforming feet to uneven terrain, preventing floating/penetration,
 * clamping knee hyperextension, and supporting LOD throttling.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FootIKSystem = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class FootIKSystem {
    constructor() {
      this.enabled = true;
      this.maxCorrectionMeters = 0.38; // Max displacement before fallback to avoid leg stretching
      this.raycastOffsetUp = 0.6;
      this.raycastDistance = 1.2;

      // Leg lengths for analytical solver (meters)
      this.upperLegLength = 0.44; // Thigh
      this.lowerLegLength = 0.42; // Calf
      this.footHeight = 0.08;

      // Quality LOD
      this.qualityLevel = 'HIGH'; // 'HIGH' (full), 'MEDIUM' (interpolated), 'LOW' (disabled)

      // Plant phase blending
      this.plantWeightLeft = 1.0;
      this.plantWeightRight = 1.0;

      // Current foot offsets
      this.leftFootOffset = 0.0;
      this.rightFootOffset = 0.0;
      this.leftFootPitch = 0.0;
      this.rightFootPitch = 0.0;
    }

    setQualityLevel(level) {
      this.qualityLevel = level;
      this.enabled = level !== 'LOW';
    }

    /**
     * Analytical Two-Bone IK solver for knee flexion
     * @param {number} targetDistance - Distance between hip and target foot placement
     * @returns {{ valid: boolean, hipAngle: number, kneeAngle: number }}
     */
    solveTwoBoneIK(targetDistance) {
      const a = this.upperLegLength;
      const b = this.lowerLegLength;
      const c = Math.max(0.1, Math.min(targetDistance, a + b - 0.005)); // Prevent singular extension

      // Law of cosines: c^2 = a^2 + b^2 - 2ab*cos(kneeAngle)
      const cosKnee = (a * a + b * b - c * c) / (2 * a * b);
      const clampedCosKnee = Math.max(-1.0, Math.min(1.0, cosKnee));
      const kneeInterior = Math.acos(clampedCosKnee);
      const kneeFlexion = Math.PI - kneeInterior;

      // Hip angle
      const cosHip = (a * a + c * c - b * b) / (2 * a * c);
      const clampedCosHip = Math.max(-1.0, Math.min(1.0, cosHip));
      const hipFlexion = Math.acos(clampedCosHip);

      return {
        valid: true,
        hipAngle: hipFlexion,
        kneeAngle: kneeFlexion,
        isStretched: targetDistance >= (a + b - 0.01)
      };
    }

    /**
     * Solves and updates foot offsets against ground elevation
     * @param {Object} leftFootWorld - { x, y, z }
     * @param {Object} rightFootWorld - { x, y, z }
     * @param {Function} terrainElevationFn - (x, z) => groundY
     * @param {Object} contactPhases - Planted status from clip metadata
     */
    evaluateFeet(leftFootWorld, rightFootWorld, terrainElevationFn, contactPhases = null) {
      if (!this.enabled || !terrainElevationFn) {
        return {
          leftOffset: 0, rightOffset: 0,
          leftPitch: 0, rightPitch: 0,
          pelvisDrop: 0
        };
      }

      // Sample ground height under each foot
      const groundYLeft = terrainElevationFn(leftFootWorld.x, leftFootWorld.z);
      const groundYRight = terrainElevationFn(rightFootWorld.x, rightFootWorld.z);

      // Raw discrepancy
      let rawDiffLeft = (groundYLeft + this.footHeight) - leftFootWorld.y;
      let rawDiffRight = (groundYRight + this.footHeight) - rightFootWorld.y;

      // Limit correction to prevent unnatural stretching
      rawDiffLeft = Math.max(-this.maxCorrectionMeters, Math.min(this.maxCorrectionMeters, rawDiffLeft));
      rawDiffRight = Math.max(-this.maxCorrectionMeters, Math.min(this.maxCorrectionMeters, rawDiffRight));

      // Weight by foot plant if provided
      const weightLeft = contactPhases && typeof contactPhases.leftPlanted === 'boolean'
        ? (contactPhases.leftPlanted ? 1.0 : 0.35)
        : 1.0;
      const weightRight = contactPhases && typeof contactPhases.rightPlanted === 'boolean'
        ? (contactPhases.rightPlanted ? 1.0 : 0.35)
        : 1.0;

      // Smooth interpolation
      const smoothFactor = 0.25;
      this.leftFootOffset += (rawDiffLeft * weightLeft - this.leftFootOffset) * smoothFactor;
      this.rightFootOffset += (rawDiffRight * weightRight - this.rightFootOffset) * smoothFactor;

      // Pelvis drop is determined by the lowest foot to allow both feet to reach ground
      const pelvisDrop = Math.min(0.0, Math.min(this.leftFootOffset, this.rightFootOffset));

      // Foot pitch based on ground slope
      const sampleDist = 0.2;
      const groundAheadLeft = terrainElevationFn(leftFootWorld.x, leftFootWorld.z + sampleDist);
      const slopeLeft = (groundAheadLeft - groundYLeft) / sampleDist;
      this.leftFootPitch = Math.max(-0.6, Math.min(0.6, Math.atan(slopeLeft)));

      const groundAheadRight = terrainElevationFn(rightFootWorld.x, rightFootWorld.z + sampleDist);
      const slopeRight = (groundAheadRight - groundYRight) / sampleDist;
      this.rightFootPitch = Math.max(-0.6, Math.min(0.6, Math.atan(slopeRight)));

      return {
        leftOffset: this.leftFootOffset,
        rightOffset: this.rightFootOffset,
        leftPitch: this.leftFootPitch,
        rightPitch: this.rightFootPitch,
        pelvisDrop
      };
    }
  }

  return FootIKSystem;
});
