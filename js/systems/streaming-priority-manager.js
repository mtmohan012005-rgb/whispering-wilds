/**
 * The Whispering Wilds (Kaattu Vazhi) - Streaming Priority Manager
 * Computes authoritative streaming priority, directional velocity lookahead,
 * quest dependency protection, and emergency preload escalation.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreamingPriorityManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class StreamingPriorityManager {
    constructor() {
      this.PRIORITIES = {
        PLAYER_CELL: 1,
        COLLISION_CELL: 2,
        ACTIVE_QUEST_CELL: 3,
        NEXT_MOVEMENT_CELL: 4,
        CAMERA_VISIBLE_CELL: 5,
        NPC_WILDLIFE_CELL: 6,
        TRANSPORT_ROUTE_CELL: 7,
        DISTANT_VISUAL_CELL: 8
      };

      // Protected entities and cells
      this.protectedCellIds = new Set();
      this.protectedQuestCellIds = new Set();
      this.protectedInteractionCellIds = new Set();

      // Velocity history for predictive smoothing
      this.lastPlayerPos = { x: 0, y: 0, z: 0 };
      this.hasLastPos = false;
      this.velocity = { x: 0, y: 0, z: 0 };
      this.smoothedSpeed = 0;
      this.headingAngleRad = 0;

      // Emergency preload trigger threshold (speed in m/s)
      this.EMERGENCY_SPEED_THRESHOLD = 9.0;
      this.isEmergencyPreloadActive = false;
    }

    /**
     * Updates player kinematics for directional prediction
     */
    updatePlayerKinematics(playerPos, dt = 0.016, facingAngleRad = null, movementMode = 'WALK') {
      if (!playerPos) return;

      if (!this.hasLastPos) {
        this.lastPlayerPos.x = playerPos.x;
        this.lastPlayerPos.y = playerPos.y;
        this.lastPlayerPos.z = playerPos.z;
        this.hasLastPos = true;
        if (facingAngleRad !== null) {
          this.headingAngleRad = facingAngleRad;
        }
        return;
      }

      if (dt > 0.001) {
        const vx = (playerPos.x - this.lastPlayerPos.x) / dt;
        const vz = (playerPos.z - this.lastPlayerPos.z) / dt;
        const speed = Math.hypot(vx, vz);

        // Exponential smoothing on velocity
        const alpha = Math.min(1.0, dt * 8.0);
        this.velocity.x += (vx - this.velocity.x) * alpha;
        this.velocity.z += (vz - this.velocity.z) * alpha;
        this.smoothedSpeed += (speed - this.smoothedSpeed) * alpha;

        if (facingAngleRad !== null) {
          this.headingAngleRad = facingAngleRad;
        } else if (speed > 0.3) {
          this.headingAngleRad = Math.atan2(this.velocity.z, this.velocity.x);
        }
      }

      this.lastPlayerPos.x = playerPos.x;
      this.lastPlayerPos.y = playerPos.y;
      this.lastPlayerPos.z = playerPos.z;

      // Check emergency preload state
      this.isEmergencyPreloadActive = (this.smoothedSpeed >= this.EMERGENCY_SPEED_THRESHOLD) || (movementMode === 'SPRINT');
    }

    /**
     * Synchronizes active quest dependencies (Section 9)
     */
    updateQuestDependencies(activeQuestCellIds = []) {
      this.protectedQuestCellIds.clear();
      for (const cellId of activeQuestCellIds) {
        if (cellId) this.protectedQuestCellIds.add(cellId);
      }
    }

    /**
     * Protects cell containing current interaction target (Section 8, 39)
     */
    setInteractionCellProtection(cellId, isProtected) {
      if (!cellId) return;
      if (isProtected) {
        this.protectedInteractionCellIds.add(cellId);
      } else {
        this.protectedInteractionCellIds.delete(cellId);
      }
    }

    /**
     * Checks if a cell is protected from unloading under any condition
     */
    isCellProtected(cellId, currentPlayerCellId) {
      if (!cellId) return false;
      // 1. Current player cell cannot unload (Section 8)
      if (cellId === currentPlayerCellId) return true;
      // 2. Active quest cell protected (Section 9)
      if (this.protectedQuestCellIds.has(cellId)) return true;
      // 3. Current interaction cell protected (Section 8)
      if (this.protectedInteractionCellIds.has(cellId)) return true;
      // 4. Manually protected
      if (this.protectedCellIds.has(cellId)) return true;
      return false;
    }

    /**
     * Calculates streaming priority score for candidate cell
     * Lower score = higher priority (1 to 8)
     */
    calculatePriority(cell, playerPos, currentPlayerCellId, cameraFrustum = null, movementMode = 'WALK') {
      if (!cell || !playerPos) return this.PRIORITIES.DISTANT_VISUAL_CELL;

      // 1. Current player cell
      if (cell.id === currentPlayerCellId) {
        return this.PRIORITIES.PLAYER_CELL;
      }

      // 2. Collision requirement (cells within immediate collision buffer around player)
      const b = cell.bounds;
      const clampedX = Math.max(b.minX, Math.min(playerPos.x, b.maxX));
      const clampedZ = Math.max(b.minZ, Math.min(playerPos.z, b.maxZ));
      const dist = Math.hypot(playerPos.x - clampedX, playerPos.z - clampedZ);

      if (dist <= 3.0) {
        return this.PRIORITIES.COLLISION_CELL;
      }

      // 3. Active quest dependency
      if (this.protectedQuestCellIds.has(cell.id)) {
        return this.PRIORITIES.ACTIVE_QUEST_CELL;
      }

      // 4. Next movement cell (Predictive directional lookahead cone)
      let lookaheadSec = 2.0;
      if (movementMode === 'BOAT') lookaheadSec = 4.0;
      if (movementMode === 'TRAFFIC') lookaheadSec = 5.0;
      if (movementMode === 'SPRINT') lookaheadSec = 3.0;

      const predictedX = playerPos.x + this.velocity.x * lookaheadSec;
      const predictedZ = playerPos.z + this.velocity.z * lookaheadSec;

      if (predictedX >= b.minX && predictedX <= b.maxX && predictedZ >= b.minZ && predictedZ <= b.maxZ) {
        return this.PRIORITIES.NEXT_MOVEMENT_CELL;
      }

      // Check directional dot product: is cell ahead of player's heading?
      const cellCenterX = (b.minX + b.maxX) * 0.5;
      const cellCenterZ = (b.minZ + b.maxZ) * 0.5;
      const toCellX = cellCenterX - playerPos.x;
      const toCellZ = cellCenterZ - playerPos.z;
      const toCellLen = Math.hypot(toCellX, toCellZ);

      if (toCellLen > 0.001) {
        const dirX = toCellX / toCellLen;
        const dirZ = toCellZ / toCellLen;
        const forwardX = Math.cos(this.headingAngleRad);
        const forwardZ = Math.sin(this.headingAngleRad);
        const dot = dirX * forwardX + dirZ * forwardZ;

        // If cell is in front (+/- 60 degrees) and reasonably close
        if (dot > 0.5 && dist < 120.0) {
          return this.PRIORITIES.NEXT_MOVEMENT_CELL;
        }
      }

      // 5. Camera-visible nearby cell
      if (cameraFrustum && typeof cameraFrustum.intersectsBox === 'function') {
        // Frustum check can be done via caller
        return this.PRIORITIES.CAMERA_VISIBLE_CELL;
      }

      // 6. NPC/Wildlife required cell (within simulation distance)
      if (cell.npcs && cell.npcs.length > 0 && dist < 120.0) {
        return this.PRIORITIES.NPC_WILDLIFE_CELL;
      }

      // 7. Transport route cell (within active route distance)
      if (cell.trafficRoutes && cell.trafficRoutes.length > 0 && dist < 150.0) {
        return this.PRIORITIES.TRANSPORT_ROUTE_CELL;
      }

      // 8. Distant visual cell
      return this.PRIORITIES.DISTANT_VISUAL_CELL;
    }
  }

  return StreamingPriorityManager;
});
