/**
 * js/systems/state-integrity-system.js
 * Enforces player position safety, last-safe transform snapshots,
 * anti-cheat interaction distance validation, quest prerequisite checks,
 * and zero-reward duplication integrity.
 */

(function () {
  'use strict';

  class StateIntegritySystem {
    constructor() {
      this._lastSafePosition = { x: 0, y: 2.5, z: 0 };
      this._lastSafeRotation = { y: 0 };
      this._lastValidCurrency = 0;
      this._claimedRewardIds = new Set();
      this._maxInteractDistance = 6.0; // 6m interaction bubble
    }

    /**
     * Updates the last safe position if the proposed position passes physical sanity checks.
     */
    updateSafeTransform(x, y, z, rotY = 0) {
      if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') return;
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) return;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;

      // Ensure inside world bounds and above world floor
      if (x >= -4900 && x <= 4900 && z >= -4900 && z <= 4900 && y >= -10 && y <= 1500) {
        this._lastSafePosition.x = x;
        this._lastSafePosition.y = y;
        this._lastSafePosition.z = z;
        this._lastSafeRotation.y = rotY || 0;
      }
    }

    getLastSafePosition() {
      return { ...this._lastSafePosition };
    }

    getLastSafeRotation() {
      return { ...this._lastSafeRotation };
    }

    /**
     * Validates an interaction attempt between player and target.
     * Prevents interaction beyond allowed distance.
     */
    validateInteraction(playerPos, targetPos, maxDistance = this._maxInteractDistance) {
      if (!playerPos || !targetPos) return { valid: false, reason: 'MISSING_POSITIONS' };

      const dx = playerPos.x - targetPos.x;
      const dy = (playerPos.y || 0) - (targetPos.y || 0);
      const dz = playerPos.z - targetPos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > maxDistance) {
        return { valid: false, reason: 'OUT_OF_RANGE', dist, maxDistance };
      }

      return { valid: true, dist };
    }

    /**
     * Verifies that a quest reward has not been claimed previously.
     * Prevents duplicate quest rewards.
     */
    claimQuestReward(questId, rewardId) {
      const claimKey = `${questId}:${rewardId}`;
      if (this._claimedRewardIds.has(claimKey)) {
        console.warn(`[StateIntegritySystem] Duplicate reward claim prevented for '${claimKey}'.`);
        return { granted: false, reason: 'DUPLICATE_CLAIM' };
      }

      this._claimedRewardIds.add(claimKey);
      return { granted: true };
    }

    hasClaimedReward(questId, rewardId) {
      return this._claimedRewardIds.has(`${questId}:${rewardId}`);
    }

    /**
     * Validates transport travel request.
     */
    validateTransport(routeId, isUnlocked, fare) {
      if (!routeId) return { valid: false, reason: 'INVALID_ROUTE' };
      if (!isUnlocked) return { valid: false, reason: 'LOCKED_DESTINATION' };
      if (typeof fare !== 'number' || fare < 0 || Number.isNaN(fare)) {
        return { valid: false, reason: 'NEGATIVE_OR_INVALID_FARE' };
      }
      return { valid: true };
    }

    /**
     * Validates and updates player currency safely.
     */
    safelyUpdateCurrency(currentCurrency, delta) {
      if (typeof delta !== 'number' || Number.isNaN(delta) || !Number.isFinite(delta)) {
        return currentCurrency;
      }
      const newTotal = currentCurrency + delta;
      if (newTotal < 0) {
        console.warn(`[StateIntegritySystem] Insufficient currency: have ₹${currentCurrency}, deduction ₹${-delta} rejected.`);
        return currentCurrency;
      }
      this._lastValidCurrency = newTotal;
      return newTotal;
    }

    healthCheck() {
      return { status: 'healthy', details: { hasSafePos: !!this._lastSafePosition } };
    }
  }

  window.StateIntegritySystem = new StateIntegritySystem();
  window.stateIntegritySystem = window.StateIntegritySystem;
})();
