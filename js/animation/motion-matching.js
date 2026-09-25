/**
 * js/animation/motion-matching.js
 * The Whispering Wilds (Kaattu Vazhi) - Locomotion Motion Matching
 *
 * Evaluates current velocity, heading, angular momentum, terrain slope,
 * and future intent trajectory against curated motion database clips.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MotionMatching = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class MotionMatching {
    constructor(registry = null) {
      this.registry = registry || (typeof window !== 'undefined' ? window.ProductionAnimationRegistry : null);

      // Scoring weights
      this.weights = {
        speed: 2.5,
        direction: 3.0,
        turnAngle: 2.0,
        continuityBonus: -0.5 // Favors continuing current clip to reduce jitter
      };

      this.currentBestClipId = 'Player_Idle';
      this.lastQueryTime = 0;
      this.queryCooldownSec = 0.08; // ~12Hz evaluation to save CPU cycles
    }

    setRegistry(registry) {
      this.registry = registry;
    }

    /**
     * Finds the best matching clip in the curated database for the given motion state
     * @param {Object} motionQuery
     *   - speed: desired speed (m/s)
     *   - direction: desired relative movement angle (radians: 0 = forward, PI = backward)
     *   - turnAngle: yaw angular velocity or delta (radians)
     *   - isGrounded: boolean
     *   - futureIntentSpeed: anticipated speed in 0.5s (acceleration predictor)
     *   - currentClipId: currently playing clip
     *   - qualityTier: 'HIGH' | 'MEDIUM' | 'LOW'
     * @returns {{ clipId: string, score: number, meta: Object }}
     */
    queryBestMatch(motionQuery) {
      if (!this.registry) {
        return { clipId: 'Player_Idle', score: 0, meta: null };
      }

      const desiredSpeed = motionQuery.speed || 0.0;
      const desiredDir = motionQuery.direction || 0.0;
      const desiredTurn = motionQuery.turnAngle || 0.0;
      const currentClip = motionQuery.currentClipId;
      const isGrounded = motionQuery.isGrounded !== false;

      // Aerial states bypass locomotion matching
      if (!isGrounded) {
        const fallClip = this.registry.getClip('Player_Fall');
        return { clipId: 'Player_Fall', score: 0, meta: fallClip };
      }

      // Rest / Idle check
      if (desiredSpeed < 0.2 && Math.abs(desiredTurn) < 0.3) {
        const idleClip = this.registry.getClip('Player_Idle');
        return { clipId: 'Player_Idle', score: 0, meta: idleClip };
      }

      // Query only locomotion category
      const candidates = this.registry.queryClips({ category: 'locomotion' });
      if (candidates.length === 0) {
        return { clipId: 'Player_Idle', score: 999, meta: null };
      }

      let bestClip = null;
      let lowestCost = Infinity;

      for (const cand of candidates) {
        // Calculate speed cost
        const speedDiff = cand.speed - desiredSpeed;
        const speedCost = this.weights.speed * (speedDiff * speedDiff);

        // Calculate direction cost (angular distance wrapped [-PI, PI])
        let dirDiff = (cand.direction || 0) - desiredDir;
        while (dirDiff > Math.PI) dirDiff -= 2 * Math.PI;
        while (dirDiff < -Math.PI) dirDiff += 2 * Math.PI;
        const dirCost = this.weights.direction * (dirDiff * dirDiff);

        // Turn cost
        const turnDiff = (cand.turnAngle || 0) - desiredTurn;
        const turnCost = this.weights.turnAngle * (turnDiff * turnDiff);

        // Continuity bonus (reduces jitter if candidate matches current clip)
        const bonus = (cand.clipId === currentClip) ? this.weights.continuityBonus : 0.0;

        const totalCost = speedCost + dirCost + turnCost + bonus;

        if (totalCost < lowestCost) {
          lowestCost = totalCost;
          bestClip = cand;
        }
      }

      this.currentBestClipId = bestClip ? bestClip.clipId : 'Player_Idle';

      return {
        clipId: this.currentBestClipId,
        score: lowestCost,
        meta: bestClip
      };
    }
  }

  return MotionMatching;
});
