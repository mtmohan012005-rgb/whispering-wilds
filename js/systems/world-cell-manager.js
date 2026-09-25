/**
 * The Whispering Wilds (Kaattu Vazhi) - World Cell Manager
 * Spatial AABB indexing, cell lifecycle state transitions, neighbor graph navigation,
 * duplicate object detection, and scene child tracking.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldCellManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldCellManager {
    constructor(cellData = null) {
      const dataModule = cellData || (typeof window !== 'undefined' ? window.WORLD_CELL_DATA : null);
      this.cellDefinitions = dataModule ? dataModule.CELLS : {};

      // Cell runtime states: cellId -> { state, cell, loadStartTime, activeSince }
      this.cellRecords = new Map();

      // Duplicate prevention registries (Section 30, 101)
      this.activeCellIds = new Set();
      this.activeObjectIds = new Set();
      this.activeNpcIds = new Set();
      this.activeAssetIds = new Set();

      // Scene child count tracking per cell (Section 102)
      this.cellSceneChildren = new Map(); // cellId -> Set<string/object>

      // Initialize all cell records to UNLOADED state
      this._initRecords();
    }

    _initRecords() {
      const CELL_STATES = (typeof window !== 'undefined' && window.STREAMING_DATA)
        ? window.STREAMING_DATA.CELL_STATES
        : {
            UNLOADED: 'UNLOADED',
            QUEUED: 'QUEUED',
            LOADING: 'LOADING',
            LOADED: 'LOADED',
            ACTIVE: 'ACTIVE',
            DEACTIVATING: 'DEACTIVATING',
            UNLOADING: 'UNLOADING',
            FAILED: 'FAILED'
          };

      for (const cellId in this.cellDefinitions) {
        this.cellRecords.set(cellId, {
          id: cellId,
          cell: this.cellDefinitions[cellId],
          state: CELL_STATES.UNLOADED,
          loadStartTime: 0,
          activeSince: 0,
          retryCount: 0,
          lastError: null
        });
        this.cellSceneChildren.set(cellId, new Set());
      }
    }

    /**
     * Retrieves cell definition by ID
     */
    getCell(cellId) {
      return this.cellDefinitions[cellId] || null;
    }

    /**
     * Retrieves runtime record including state
     */
    getRecord(cellId) {
      return this.cellRecords.get(cellId) || null;
    }

    /**
     * Gets state of a given cell
     */
    getCellState(cellId) {
      const rec = this.cellRecords.get(cellId);
      return rec ? rec.state : 'UNLOADED';
    }

    /**
     * Validates and transitions cell state (Section 4)
     */
    setCellState(cellId, newState) {
      const rec = this.cellRecords.get(cellId);
      if (!rec) return false;

      const oldState = rec.state;
      if (oldState === newState) return true;

      // Validate transitions
      const validTransitions = {
        UNLOADED: ['QUEUED', 'LOADING'],
        QUEUED: ['LOADING', 'UNLOADED', 'FAILED'],
        LOADING: ['LOADED', 'FAILED', 'UNLOADED'],
        LOADED: ['ACTIVE', 'DEACTIVATING', 'UNLOADING', 'UNLOADED'],
        ACTIVE: ['DEACTIVATING', 'UNLOADED'],
        DEACTIVATING: ['UNLOADING', 'ACTIVE', 'UNLOADED'],
        UNLOADING: ['UNLOADED', 'FAILED'],
        FAILED: ['QUEUED', 'UNLOADED']
      };

      const allowed = validTransitions[oldState] || [];
      if (!allowed.includes(newState)) {
        console.warn(`[WorldCellManager] Illegal state transition for ${cellId}: ${oldState} -> ${newState}`);
        return false;
      }

      rec.state = newState;

      // Maintain active cell IDs set
      if (newState === 'ACTIVE') {
        this.activeCellIds.add(cellId);
        rec.activeSince = performance.now();
      } else if (oldState === 'ACTIVE') {
        this.activeCellIds.delete(cellId);
      }

      return true;
    }

    /**
     * Spatial query to find the cell containing coordinates (X, Y, Z) using simple AABB (Section 12)
     */
    getCellAt(x, y, z) {
      for (const [cellId, rec] of this.cellRecords.entries()) {
        const b = rec.cell.bounds;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
          return rec.cell;
        }
      }
      // Fallback nearest cell center
      let closest = null;
      let minDistSq = Infinity;
      for (const [cellId, rec] of this.cellRecords.entries()) {
        const b = rec.cell.bounds;
        const cx = (b.minX + b.maxX) * 0.5;
        const cz = (b.minZ + b.maxZ) * 0.5;
        const dSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          closest = rec.cell;
        }
      }
      return closest;
    }

    /**
     * Returns distance from point (x, z) to cell AABB bounds
     */
    getDistanceToCell(cellId, x, z) {
      const cell = this.getCell(cellId);
      if (!cell) return Infinity;
      const b = cell.bounds;
      const clampedX = Math.max(b.minX, Math.min(x, b.maxX));
      const clampedZ = Math.max(b.minZ, Math.min(z, b.maxZ));
      const dx = x - clampedX;
      const dz = z - clampedZ;
      return Math.hypot(dx, dz);
    }

    /**
     * Fast neighbor graph traversal (Section 11)
     * Returns array of neighbor cell objects for a given cell ID
     */
    getNeighbors(cellId) {
      const cell = this.getCell(cellId);
      if (!cell || !Array.isArray(cell.neighbors)) return [];
      const neighbors = [];
      for (const nId of cell.neighbors) {
        const nCell = this.getCell(nId);
        if (nCell) neighbors.push(nCell);
      }
      return neighbors;
    }

    /**
     * Duplicate Object Protection (Section 101)
     * Checks and registers unique gameplay objects in scene
     */
    registerGameObject(cellId, objectId) {
      if (!objectId) return true;
      if (this.activeObjectIds.has(objectId)) {
        console.warn(`[WorldCellManager] Duplicate object detected: ${objectId} in cell ${cellId}. Blocking duplicate instantiation.`);
        return false;
      }
      this.activeObjectIds.add(objectId);
      const childSet = this.cellSceneChildren.get(cellId);
      if (childSet) childSet.add(objectId);
      return true;
    }

    unregisterGameObject(cellId, objectId) {
      this.activeObjectIds.delete(objectId);
      const childSet = this.cellSceneChildren.get(cellId);
      if (childSet) childSet.delete(objectId);
    }

    /**
     * Duplicate NPC Protection (Section 30, 101)
     */
    registerNPC(cellId, npcId) {
      if (!npcId) return true;
      if (this.activeNpcIds.has(npcId)) {
        console.warn(`[WorldCellManager] Duplicate NPC detected: ${npcId} already active in world.`);
        return false;
      }
      this.activeNpcIds.add(npcId);
      return true;
    }

    unregisterNPC(cellId, npcId) {
      this.activeNpcIds.delete(npcId);
    }

    /**
     * Duplicate Asset ID Tracking
     */
    registerAsset(cellId, assetId) {
      if (!assetId) return true;
      this.activeAssetIds.add(assetId);
      return true;
    }

    unregisterAsset(cellId, assetId) {
      this.activeAssetIds.delete(assetId);
    }

    /**
     * Scene Child Tracking per cell (Section 102)
     */
    getSceneChildCount(cellId) {
      const set = this.cellSceneChildren.get(cellId);
      return set ? set.size : 0;
    }

    clearSceneChildren(cellId) {
      const set = this.cellSceneChildren.get(cellId);
      if (set) {
        for (const objId of set) {
          this.activeObjectIds.delete(objId);
        }
        set.clear();
      }
    }

    /**
     * Reset all runtime data (e.g., returning to menu or new game)
     */
    reset() {
      this.activeCellIds.clear();
      this.activeObjectIds.clear();
      this.activeNpcIds.clear();
      this.activeAssetIds.clear();
      this._initRecords();
    }
  }

  return WorldCellManager;
});
