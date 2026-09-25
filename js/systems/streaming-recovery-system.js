/**
 * The Whispering Wilds (Kaattu Vazhi) - Streaming Recovery System
 * Fallback handling for missing collision, void fall prevention, stuck player restoration,
 * infinite retry lockout, missing asset fallbacks, and camera target re-anchoring.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreamingRecoverySystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class StreamingRecoverySystem {
    constructor() {
      // Last safe ground position
      this.lastSafePosition = { x: -250, y: 1.5, z: 0 };
      this.safePositionUpdateTimer = 0;

      // Infinite retry protection registry (Section 82)
      // cellId -> { retries: number, lastError: string, cooldownUntil: number }
      this.cellRetryRecords = new Map();
      this.MAX_RETRIES = 3;
      this.BASE_COOLDOWN_MS = 2000;

      // Void fall threshold
      this.VOID_Y_THRESHOLD = -25.0;

      // Fallback assets cache
      this.fallbackAssets = new Map();

      // Recovery event logs
      this.recoveryHistory = [];
    }

    /**
     * Periodically records validated safe player ground positions
     */
    recordSafePosition(pos, isGrounded = true) {
      if (!pos || !isGrounded) return;
      if (pos.y > this.VOID_Y_THRESHOLD && !Number.isNaN(pos.x) && !Number.isNaN(pos.z)) {
        this.lastSafePosition.x = pos.x;
        this.lastSafePosition.y = Math.max(0.5, pos.y);
        this.lastSafePosition.z = pos.z;
      }
    }

    /**
     * Checks if player has fallen into the void or lacks valid collision (Section 65, 66, 147)
     */
    checkPlayerSafety(playerObj, currentCellState) {
      if (!playerObj) return false;

      const pos = typeof playerObj.getPosition === 'function' ? playerObj.getPosition() : playerObj.position;
      if (!pos) return false;

      // Check void fall condition
      if (pos.y < this.VOID_Y_THRESHOLD || Number.isNaN(pos.y)) {
        console.warn(`[STREAMING_COLLISION_RECOVERY] Player fell below void threshold (${pos.y}). Restoring to last safe position.`);
        this.restoreStuckPlayer(playerObj, 'VOID_FALL_PREVENTION');
        return true;
      }

      // Check if player entered an unloaded cell
      if (currentCellState === 'UNLOADED' || currentCellState === 'FAILED') {
        console.warn(`[STREAMING_COLLISION_RECOVERY] Player entered ${currentCellState} geometry. Soft gating player to safe coordinates.`);
        this.restoreStuckPlayer(playerObj, 'UNLOADED_CELL_ENTRY');
        return true;
      }

      return false;
    }

    /**
     * Restores stuck or falling player back to the last safe ground position
     */
    restoreStuckPlayer(playerObj, reason = 'STREAMING_COLLISION_RECOVERY') {
      const targetPos = { ...this.lastSafePosition };

      if (typeof playerObj.setPosition === 'function') {
        playerObj.setPosition(targetPos.x, targetPos.z, null);
        if (playerObj.mesh && playerObj.mesh.position) {
          playerObj.mesh.position.y = targetPos.y;
        }
      } else if (playerObj.position) {
        playerObj.position.x = targetPos.x;
        playerObj.position.y = targetPos.y;
        playerObj.position.z = targetPos.z;
      }

      if (playerObj.velocity) {
        playerObj.velocity.x = 0;
        playerObj.velocity.y = 0;
        playerObj.velocity.z = 0;
      }

      const logEntry = {
        timestamp: Date.now(),
        reason,
        restoredTo: targetPos
      };
      this.recoveryHistory.push(logEntry);
      console.log(`[StreamingRecovery] Logged: STREAMING_COLLISION_RECOVERY -> (${targetPos.x.toFixed(1)}, ${targetPos.y.toFixed(1)}, ${targetPos.z.toFixed(1)})`);

      return targetPos;
    }

    /**
     * Infinite Retry Lockout (Section 81, 82)
     * Returns true if retry is permitted, false if on cooldown or max retries exceeded
     */
    canRetryCell(cellId) {
      if (!cellId) return false;
      const rec = this.cellRetryRecords.get(cellId);
      if (!rec) return true;

      const now = performance.now();
      if (rec.retries >= this.MAX_RETRIES) {
        if (now < rec.cooldownUntil) {
          return false; // Still locked out
        }
        // Cooldown passed: allow one probationary attempt
        rec.retries = 2;
        rec.cooldownUntil = now + this.BASE_COOLDOWN_MS * 4;
        return true;
      }

      return now >= rec.cooldownUntil;
    }

    recordCellFailure(cellId, errorMsg = 'Unknown load error') {
      const now = performance.now();
      let rec = this.cellRetryRecords.get(cellId);
      if (!rec) {
        rec = { retries: 0, lastError: errorMsg, cooldownUntil: 0 };
        this.cellRetryRecords.set(cellId, rec);
      }

      rec.retries++;
      rec.lastError = errorMsg;
      // Exponential backoff
      const cooldown = this.BASE_COOLDOWN_MS * Math.pow(2, Math.min(rec.retries - 1, 3));
      rec.cooldownUntil = now + cooldown;

      console.warn(`[StreamingRecovery] Cell ${cellId} failure #${rec.retries}: ${errorMsg}. Cooldown: ${(cooldown / 1000).toFixed(1)}s`);
      return rec;
    }

    recordCellSuccess(cellId) {
      this.cellRetryRecords.delete(cellId);
    }

    /**
     * Camera Target Recovery (Section 148)
     * Validates camera target and re-anchors to player if target was disposed
     */
    recoverCameraTarget(cameraController, playerPos) {
      if (!cameraController) return;

      const currentTarget = cameraController.currentTarget;
      const isBadTarget = !currentTarget ||
        Number.isNaN(currentTarget.x) ||
        Number.isNaN(currentTarget.y) ||
        Number.isNaN(currentTarget.z);

      if (isBadTarget && playerPos) {
        cameraController.currentTarget = new THREE.Vector3(playerPos.x, (playerPos.y || 0) + 1.35, playerPos.z);
        console.log('[StreamingRecovery] Camera target re-anchored to player position.');
      }
    }

    /**
     * Returns diagnostic fallback mesh for missing non-critical assets (Section 80, 140)
     */
    createFallbackMesh(assetId, assetType = 'prop') {
      if (typeof THREE === 'undefined') return null;

      let geo, mat;
      if (assetType === 'tree') {
        geo = new THREE.ConeGeometry(1.5, 5, 5);
        mat = new THREE.MeshLambertMaterial({ color: 0x2e5c30 });
      } else if (assetType === 'building') {
        geo = new THREE.BoxGeometry(4, 4, 4);
        mat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
      } else {
        geo = new THREE.BoxGeometry(1, 1, 1);
        mat = new THREE.MeshLambertMaterial({ color: 0x78909c });
      }

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `Fallback_${assetId}`;
      mesh.isFallbackMesh = true;
      return mesh;
    }
  }

  return StreamingRecoverySystem;
});
