/**
 * js/animation/pose-controller.js
 * The Whispering Wilds (Kaattu Vazhi) - Procedural Pose & Secondary Dynamics
 *
 * Coordinates slope-aware spine adaptation, secondary cloth bone physics (veshti, thundu),
 * and cultural attire collision constraints (preventing leg/body mesh clipping).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PoseController = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class PoseController {
    constructor() {
      this.spineBones = [];
      this.clothBones = [];
      this.clothInertia = { x: 0, y: 0, z: 0 };
      this.prevPosition = { x: 0, y: 0, z: 0 };
      this.windForce = { x: 0, y: 0, z: 0 };

      // Slope adaptation limits (radians)
      this.maxSlopePitch = 0.35; // ~20 degrees
      this.maxSlopeRoll = 0.25;  // ~14 degrees

      // Cultural attire constraints
      this.outfitLimits = {
        veshti: { maxKneeFlexion: 1.9, maxStrideAngle: 0.8 },
        lungi_tucked: { maxKneeFlexion: 2.3, maxStrideAngle: 1.1 },
        cargo_trousers: { maxKneeFlexion: 2.4, maxStrideAngle: 1.2 },
        saree: { maxKneeFlexion: 1.7, maxStrideAngle: 0.75 }
      };
    }

    /**
     * Binds skeleton nodes for procedural manipulation
     */
    bindSkeleton(rootNode) {
      this.spineBones = [];
      this.clothBones = [];

      if (!rootNode) return;

      rootNode.traverse((node) => {
        if (node.isBone) {
          if (node.name === 'Spine' || node.name === 'Spine1' || node.name === 'Spine2') {
            this.spineBones.push(node);
          }
          if (node.name.startsWith('Cloth_')) {
            this.clothBones.push(node);
          }
        }
      });
    }

    /**
     * Applies slope alignment to spine based on ground normal
     * @param {THREE.Vector3|Object} groundNormal
     * @param {number} blendFactor
     */
    applySlopeAdaptation(groundNormal, blendFactor = 0.6) {
      if (!groundNormal || this.spineBones.length === 0) return;

      // Normal y is up; x is lateral slope; z is forward/backward slope
      const nx = groundNormal.x || 0;
      const ny = groundNormal.y || 1;
      const nz = groundNormal.z || 0;

      // Calculate pitch (forward/back) and roll (side) tilts
      let pitch = -Math.atan2(nz, ny) * blendFactor;
      let roll = Math.atan2(nx, ny) * blendFactor;

      // Clamp within anatomical boundaries
      pitch = Math.max(-this.maxSlopePitch, Math.min(this.maxSlopePitch, pitch));
      roll = Math.max(-this.maxSlopeRoll, Math.min(this.maxSlopeRoll, roll));

      const perBonePitch = pitch / this.spineBones.length;
      const perBoneRoll = roll / this.spineBones.length;

      for (const bone of this.spineBones) {
        bone.rotation.x += perBonePitch;
        bone.rotation.z += perBoneRoll;
      }
    }

    /**
     * Applies secondary inertia and wind dynamics to cloth bones (Veshti, Thundu)
     * @param {number} deltaTime
     * @param {Object} currentPos - Character world position {x, y, z}
     * @param {Object} wind - Wind vector {x, y, z}
     * @param {string} outfitType - 'veshti' | 'saree' | 'urban_explorer'
     */
    applyClothSecondaryMotion(deltaTime, currentPos, wind = null, outfitType = 'veshti') {
      if (this.clothBones.length === 0) return;

      const dt = Math.max(deltaTime, 0.001);
      const velX = (currentPos.x - this.prevPosition.x) / dt;
      const velZ = (currentPos.z - this.prevPosition.z) / dt;

      this.prevPosition = { ...currentPos };

      // Spring-damper integration for cloth trailing
      const spring = 8.0;
      const damping = 0.82;

      this.clothInertia.x = (this.clothInertia.x - velX * 0.02) * damping;
      this.clothInertia.z = (this.clothInertia.z - velZ * 0.02) * damping;

      if (wind) {
        this.clothInertia.x += (wind.x || 0) * 0.01;
        this.clothInertia.z += (wind.z || 0) * 0.01;
      }

      // Clamp secondary cloth rotation to prevent leg clipping
      const maxClothAngle = outfitType === 'saree' ? 0.25 : 0.35;
      const rotX = Math.max(-maxClothAngle, Math.min(maxClothAngle, this.clothInertia.z));
      const rotZ = Math.max(-maxClothAngle, Math.min(maxClothAngle, this.clothInertia.x));

      for (const bone of this.clothBones) {
        bone.rotation.x = rotX;
        bone.rotation.z = rotZ;
      }
    }

    /**
     * Enforces cultural attire knee limits to prevent cloth tearing
     */
    enforceAttireLimits(kneeAngleRad, outfitType = 'veshti') {
      const limits = this.outfitLimits[outfitType] || this.outfitLimits.veshti;
      return Math.min(kneeAngleRad, limits.maxKneeFlexion);
    }
  }

  return PoseController;
});
