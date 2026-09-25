/**
 * js/animation/look-at-system.js
 * The Whispering Wilds (Kaattu Vazhi) - Priority Look-At & Gaze Controller
 *
 * Implements anatomical neck/head gaze targeting with multi-tier priority
 * (Dialogue Speaker > Interaction > Story Event > Player > Environment)
 * and behind-back turn notifications.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LookAtSystem = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PRIORITIES = {
    DIALOGUE_SPEAKER: 5,
    ACTIVE_INTERACTION: 4,
    STORY_EVENT: 3,
    NEARBY_PLAYER: 2,
    ENVIRONMENT: 1,
    NONE: 0
  };

  class LookAtSystem {
    constructor() {
      this.currentTarget = null;
      this.currentPriority = PRIORITIES.NONE;
      this.currentYaw = 0.0;
      this.currentPitch = 0.0;

      // Anatomical boundaries (radians)
      this.maxYaw = 1.2;    // ~68 degrees
      this.maxPitch = 0.6;  // ~35 degrees

      this.smoothSpeed = 4.5; // Slerp responsiveness
      this.requiresBodyTurn = false;
    }

    /**
     * Sets a gaze target with given priority tier
     * @param {Object} targetPos - { x, y, z }
     * @param {number|string} priority - Tier number or key
     */
    setTarget(targetPos, priority = PRIORITIES.NEARBY_PLAYER) {
      const prioValue = typeof priority === 'string' ? (PRIORITIES[priority] || 1) : priority;
      if (prioValue >= this.currentPriority) {
        this.currentTarget = targetPos ? { ...targetPos } : null;
        this.currentPriority = targetPos ? prioValue : PRIORITIES.NONE;
      }
    }

    clearTarget(priority = PRIORITIES.NONE) {
      const prioValue = typeof priority === 'string' ? (PRIORITIES[priority] || 0) : priority;
      if (prioValue >= this.currentPriority) {
        this.currentTarget = null;
        this.currentPriority = PRIORITIES.NONE;
      }
    }

    /**
     * Evaluates look-at angles relative to character facing
     * @param {number} deltaTime
     * @param {Object} characterHeadPos - { x, y, z }
     * @param {number} characterFacingAngle - World yaw in radians
     * @returns {{ neckYaw: number, neckPitch: number, headYaw: number, headPitch: number, requiresBodyTurn: boolean }}
     */
    update(deltaTime, characterHeadPos, characterFacingAngle) {
      let targetYaw = 0.0;
      let targetPitch = 0.0;
      this.requiresBodyTurn = false;

      if (this.currentTarget && characterHeadPos) {
        const dx = this.currentTarget.x - characterHeadPos.x;
        const dy = this.currentTarget.y - characterHeadPos.y;
        const dz = this.currentTarget.z - characterHeadPos.z;
        const distXZ = Math.hypot(dx, dz);

        if (distXZ > 0.1) {
          // Angle to target in world space
          const angleToTarget = Math.atan2(dx, dz);

          // Relative yaw relative to character facing
          let relYaw = angleToTarget - characterFacingAngle;
          while (relYaw > Math.PI) relYaw -= 2 * Math.PI;
          while (relYaw < -Math.PI) relYaw += 2 * Math.PI;

          // If target is behind character (beyond ~85 deg), signal body turn and relax neck
          if (Math.abs(relYaw) > 1.48) {
            this.requiresBodyTurn = true;
            targetYaw = 0.0;
            targetPitch = 0.0;
          } else {
            targetYaw = Math.max(-this.maxYaw, Math.min(this.maxYaw, relYaw));
            const rawPitch = Math.atan2(dy, distXZ);
            targetPitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, rawPitch));
          }
        }
      }

      // Smooth interpolation toward target angles
      const factor = Math.min(1.0, this.smoothSpeed * deltaTime);
      this.currentYaw += (targetYaw - this.currentYaw) * factor;
      this.currentPitch += (targetPitch - this.currentPitch) * factor;

      // Distribute gaze across neck (40%) and head (60%)
      return {
        neckYaw: this.currentYaw * 0.4,
        neckPitch: this.currentPitch * 0.4,
        headYaw: this.currentYaw * 0.6,
        headPitch: this.currentPitch * 0.6,
        requiresBodyTurn: this.requiresBodyTurn,
        activePriority: this.currentPriority
      };
    }
  }

  LookAtSystem.PRIORITIES = PRIORITIES;

  return LookAtSystem;
});
