/**
 * The Whispering Wilds (Kaattu Vazhi) - World Streaming System
 * SINGLE AUTHORITATIVE STREAMING SYSTEM for the entire game.
 * Orchestrates cell loading, activation, deactivation, unloading, priority scheduling,
 * per-frame budgets, distance hysteresis, floating world-origin, and leak-free resource lifecycles.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.WorldStreamingSystem = factory();
    if (typeof window !== 'undefined' && !window.worldStreamingSystem) {
      window.worldStreamingSystem = new root.WorldStreamingSystem(null, null);
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldStreamingSystem {
    /**
     * @param {THREE.Scene} scene - The main Three.js Scene
     * @param {Object} worldAssets - ProductionWorldAssets registry
     */
    constructor(scene = null, worldAssets = null) {
      this.scene = scene;
      this.worldAssets = worldAssets || (typeof window !== 'undefined' ? window.productionWorldAssets : null);

      // 1. Instantiate Subsystems
      const cellData = typeof window !== 'undefined' ? window.WORLD_CELL_DATA : null;
      const regionData = typeof window !== 'undefined' ? window.WORLD_REGION_DATA : null;
      const streamData = typeof window !== 'undefined' ? window.STREAMING_DATA : null;

      this.cellManager = new (typeof WorldCellManager !== 'undefined' ? WorldCellManager : (typeof window !== 'undefined' && window.WorldCellManager)) (cellData);
      this.budgetManager = new (typeof StreamingBudgetManager !== 'undefined' ? StreamingBudgetManager : (typeof window !== 'undefined' && window.StreamingBudgetManager)) ('MEDIUM');
      this.priorityManager = new (typeof StreamingPriorityManager !== 'undefined' ? StreamingPriorityManager : (typeof window !== 'undefined' && window.StreamingPriorityManager)) ();
      this.recoverySystem = new (typeof StreamingRecoverySystem !== 'undefined' ? StreamingRecoverySystem : (typeof window !== 'undefined' && window.StreamingRecoverySystem)) ();
      this.originManager = new (typeof WorldOriginManager !== 'undefined' ? WorldOriginManager : (typeof window !== 'undefined' && window.WorldOriginManager)) (1500.0);
      this.cache = new (typeof StreamingCache !== 'undefined' ? StreamingCache : (typeof window !== 'undefined' && window.StreamingCache)) ({ coldCapacity: 8 });
      this.renderer = new (typeof StreamingRenderer !== 'undefined' ? StreamingRenderer : (typeof window !== 'undefined' && window.StreamingRenderer)) (scene, null);
      this.culling = new (typeof StreamingCulling !== 'undefined' ? StreamingCulling : (typeof window !== 'undefined' && window.StreamingCulling)) ();
      this.assetManager = new (typeof AssetStreamingManager !== 'undefined' ? AssetStreamingManager : (typeof window !== 'undefined' && window.AssetStreamingManager)) (scene, this.budgetManager);
      this.debugger = (typeof StreamingDebugger !== 'undefined' ? new StreamingDebugger(this) : (typeof window !== 'undefined' && window.StreamingDebugger ? new window.StreamingDebugger(this) : null));

      // 2. Authoritative Active Region & Cell States
      this.currentRegionId = 'CHENNAI';
      this.currentPlayerCellId = 'CELL_CHE_001';
      this.activeRegionData = regionData ? regionData.getRegion('CHENNAI') : null;

      // Active / Preload / Unload Radii (Profile Scaled)
      this.activeRadius = 75.0;
      this.preloadRadius = 130.0;
      this.unloadRadius = 180.0;

      // 8 Streaming Regions for backwards compatibility and Regional Hysteresis validation (Step 23)
      this.regions = {
        george_town: {
          id: 'george_town',
          name: 'George Town (Madras)',
          bounds: { minX: -300, maxX: -100, minZ: -100, maxZ: 100 },
          assetGroup: 'chennai',
          loadDistance: 70,
          unloadDistance: 110,
          priority: 1,
          loaded: false,
          activeInstances: new Set()
        },
        cauvery_delta: {
          id: 'cauvery_delta',
          name: 'Cauvery Farmlands',
          bounds: { minX: -100, maxX: 100, minZ: -100, maxZ: 100 },
          assetGroup: 'farmland',
          loadDistance: 70,
          unloadDistance: 110,
          priority: 2,
          loaded: false,
          activeInstances: new Set()
        },
        pichavaram: {
          id: 'pichavaram',
          name: 'Pichavaram Mangrove Wetlands',
          bounds: { minX: 100, maxX: 170, minZ: -100, maxZ: 100 },
          assetGroup: 'mangrove',
          loadDistance: 65,
          unloadDistance: 105,
          priority: 2,
          loaded: false,
          activeInstances: new Set()
        },
        chettinad: {
          id: 'chettinad',
          name: 'Chettinad Heritage Belt',
          bounds: { minX: 120, maxX: 190, minZ: -100, maxZ: 100 },
          assetGroup: 'heritage',
          loadDistance: 65,
          unloadDistance: 105,
          priority: 3,
          loaded: false,
          activeInstances: new Set()
        },
        thanjavur: {
          id: 'thanjavur',
          name: 'Thanjavur Temple Plains',
          bounds: { minX: 130, maxX: 210, minZ: -100, maxZ: 100 },
          assetGroup: 'temple',
          loadDistance: 70,
          unloadDistance: 110,
          priority: 3,
          loaded: false,
          activeInstances: new Set()
        },
        mamallapuram: {
          id: 'mamallapuram',
          name: 'Mamallapuram Coastal Monoliths',
          bounds: { minX: 150, maxX: 230, minZ: -100, maxZ: 100 },
          assetGroup: 'monolith',
          loadDistance: 70,
          unloadDistance: 110,
          priority: 3,
          loaded: false,
          activeInstances: new Set()
        },
        nilgiris: {
          id: 'nilgiris',
          name: 'Nilgiri Mountain Cloud Forest',
          bounds: { minX: 200, maxX: 269, minZ: -100, maxZ: 100 },
          assetGroup: 'mountain',
          loadDistance: 75,
          unloadDistance: 120,
          priority: 2,
          loaded: false,
          activeInstances: new Set()
        },
        final_sanctuary: {
          id: 'final_sanctuary',
          name: 'Pasumai Thadam Subterranean Sanctuary',
          bounds: { minX: 270, maxX: 300, minZ: -100, maxZ: 100 },
          assetGroup: 'sanctuary',
          loadDistance: 60,
          unloadDistance: 95,
          priority: 1,
          loaded: false,
          activeInstances: new Set()
        }
      };

      // Evaluation Triggers (Section 13, 14)
      this.lastEvalPos = { x: -250, y: 1.5, z: 0 };
      this.lastEvalTime = 0;
      this.evalIntervalSec = 0.15; // 150ms
      this.minMoveEvalDist = 2.0;  // 2 meters

      // Safe Unload Queue (Section 49)
      this.pendingUnloadQueue = []; // array of cellIds
      this.deactivatingGraceFrames = new Map(); // cellId -> framesLeft

      // Simulation freeze / pause state (Section 129)
      this.isPaused = false;
      this.isInitialBoot = true;

      // Audio crossfade tracking (Section 35)
      this.currentAmbienceTheme = null;

      // Hardware Profile initialization
      this.applyHardwareProfile('MEDIUM');

      // Bind GameLifecycle hooks if available (Section 129, 130)
      this._bindLifecycle();
    }

    _bindLifecycle() {
      if (typeof window === 'undefined' || !window.GameLifecycle) return;

      window.GameLifecycle.on('stateChanged', (data) => {
        if (data.to === 'PAUSED') {
          this.pause();
        } else if (data.to === 'PLAYING') {
          this.resume();
        } else if (['RETURNING_TO_MENU', 'EXITING'].includes(data.to)) {
          this.unloadAllCells();
        } else if (data.to === 'LOADING_GAME') {
          this.isInitialBoot = true;
        }
      });
    }

    applyHardwareProfile(tierKey) {
      this.budgetManager.applyProfile(tierKey);
      const prof = this.budgetManager.profile;
      if (prof) {
        this.activeRadius = prof.activeCellRadius;
        this.preloadRadius = prof.preloadCellRadius;
        this.unloadRadius = prof.unloadCellRadius;
        if (prof.coldCacheCapacity) {
          this.cache.coldCapacity = prof.coldCacheCapacity;
        }
      }
      console.log(`[WorldStreamingSystem] ⚙ Applied hardware profile ${tierKey}: Active=${this.activeRadius}m, Preload=${this.preloadRadius}m, Unload=${this.unloadRadius}m`);
    }

    pause() {
      this.isPaused = true;
      console.log('[WorldStreamingSystem] ⏸ Streaming simulation PAUSED.');
    }

    resume() {
      this.isPaused = false;
      this.lastEvalTime = performance.now() / 1000.0;
      console.log('[WorldStreamingSystem] ▶ Streaming simulation RESUMED.');
    }

    /**
     * Main update loop called every frame by ThreeWorld
     */
    update(playerPos, dt = 0.016, camera = null, movementMode = 'WALK') {
      if (this.isPaused || !playerPos) return;

      this.budgetManager.beginFrame();

      // 1. Kinematics & predictive velocity update (Section 6)
      this.priorityManager.updatePlayerKinematics(playerPos, dt, null, movementMode);

      // 2. Camera culling update (Section 10)
      if (camera) {
        this.culling.updateFrustum(camera);
        this.recoverySystem.recoverCameraTarget(window.threeWorld?.cameraController, playerPos);
      }

      // 3. Staggered Evaluation Trigger Check (Section 13, 14)
      const nowSec = performance.now() / 1000.0;
      const movedDist = Math.hypot(playerPos.x - this.lastEvalPos.x, playerPos.z - this.lastEvalPos.z);
      const timeElapsed = nowSec - this.lastEvalTime;

      if (movedDist >= this.minMoveEvalDist || timeElapsed >= this.evalIntervalSec || this.isInitialBoot) {
        this.lastEvalTime = nowSec;
        this.lastEvalPos.x = playerPos.x;
        this.lastEvalPos.y = playerPos.y;
        this.lastEvalPos.z = playerPos.z;
        this.isInitialBoot = false;

        this.evaluateStreaming(playerPos, movementMode);
      }

      // 4. Floating Origin Check (Section 62, 63)
      this.originManager.checkAndShift(playerPos, {
        player: window.threeWorld?.player,
        cameraController: window.threeWorld?.cameraController
      });

      // 5. Collision Fallback / Stuck Player Guard (Section 65, 66, 147)
      const currentCellState = this.cellManager.getCellState(this.currentPlayerCellId);
      this.recoverySystem.checkPlayerSafety(window.threeWorld?.player, currentCellState);
      this.recoverySystem.recordSafePosition(playerPos, true);

      // 6. Process per-frame asynchronous asset queue within budget (Section 15, 16, 93)
      this.assetManager.processFrame(this.budgetManager);

      // 7. Process pending unloads with grace period (Section 49, 96)
      this.processPendingUnloads();

      // 8. Update Developer Debugger (Section 99, 100)
      if (this.debugger && this.debugger.isVisible) {
        this.updateDiagnostics(playerPos);
      }

      this.budgetManager.endFrame();
    }

    /**
     * Core Streaming Decision Loop (Section 14)
     */
    evaluateStreaming(playerPos, movementMode = 'WALK') {
      // 1. Identify current player cell via AABB spatial index (Section 12)
      const currentCell = this.cellManager.getCellAt(playerPos.x, playerPos.y, playerPos.z);
      if (!currentCell) return;

      const previousCellId = this.currentPlayerCellId;
      this.currentPlayerCellId = currentCell.id;

      // 2. Check Region Boundary Transition (Section 46)
      if (currentCell.regionId !== this.currentRegionId) {
        this.handleRegionTransition(this.currentRegionId, currentCell.regionId);
      }

      // 3. Fast neighbor graph traversal from current cell (Section 11)
      const candidateCells = new Set();
      candidateCells.add(currentCell);

      const neighbors = this.cellManager.getNeighbors(currentCell.id);
      for (const n of neighbors) {
        candidateCells.add(n);
        // Include secondary neighbors for wider coverage
        const secondNeighbors = this.cellManager.getNeighbors(n.id);
        for (const sn of secondNeighbors) {
          candidateCells.add(sn);
        }
      }

      // 4. Evaluate each candidate cell against radii with hysteresis (Section 5, 60)
      for (const cell of candidateCells) {
        const dist = this.cellManager.getDistanceToCell(cell.id, playerPos.x, playerPos.z);
        const state = this.cellManager.getCellState(cell.id);

        if (dist <= this.activeRadius) {
          // Must be ACTIVE
          if (state !== 'ACTIVE') {
            this.activateCell(cell);
          }
        } else if (dist <= this.preloadRadius) {
          // Must be PRELOADED (LOADED in WARM cache)
          if (state === 'UNLOADED' || state === 'QUEUED') {
            this.preloadCell(cell, movementMode);
          } else if (state === 'ACTIVE') {
            // Player moved further away; de-escalate to LOADED
            this.deactivateCell(cell.id);
          }
        }
      }

      // 5. Hysteresis Unload Check for currently active/warm cells
      for (const cellId of Array.from(this.cellManager.activeCellIds)) {
        // Protect player cell, collision, and quests (Section 8, 9)
        if (this.priorityManager.isCellProtected(cellId, this.currentPlayerCellId)) {
          continue;
        }

        // Photo Mode lock protection (Section 75)
        if (this.culling.isLockedByPhotoMode(cellId)) {
          continue;
        }

        const dist = this.cellManager.getDistanceToCell(cellId, playerPos.x, playerPos.z);
        if (dist >= this.unloadRadius) {
          this.queueCellForUnload(cellId);
        }
      }

      // Synchronize Authoritative GameState World Region & Cell
      if (typeof window !== 'undefined' && window.GameState && window.GameState.world) {
        window.GameState.world.currentRegion = this.currentRegionId.toLowerCase();
        window.GameState.world.currentCell = this.currentPlayerCellId;
        window.GameState.world.activeCells = Array.from(this.cellManager.activeCellIds);
      }
    }

    /**
     * Staged Cell Loading (Stage 1: LOAD)
     */
    preloadCell(cell, movementMode = 'WALK') {
      if (!this.recoverySystem.canRetryCell(cell.id)) {
        return; // Cell is on failure cooldown
      }

      this.cellManager.setCellState(cell.id, 'QUEUED');

      const priority = this.priorityManager.calculatePriority(
        cell,
        this.lastEvalPos,
        this.currentPlayerCellId,
        this.culling.frustum,
        movementMode
      );

      // Enqueue terrain chunk task
      this.assetManager.enqueueTask({
        cellId: cell.id,
        assetId: `terrain_${cell.id}`,
        type: 'terrain',
        priority,
        estimatedCost: 1.5,
        onComplete: (mesh) => {
          this.cellManager.setCellState(cell.id, 'LOADED');
          this.cache.markWarm(cell.id, { cell, meshes: [mesh], assets: cell.assets });
        },
        onFail: (err) => {
          this.cellManager.setCellState(cell.id, 'FAILED');
          this.recoverySystem.recordCellFailure(cell.id, err.message);
        }
      });
    }

    /**
     * Cell Scene Activation (Stage 3: ACTIVATE) (Section 94, 95)
     */
    activateCell(cell) {
      if (!cell) return;
      const state = this.cellManager.getCellState(cell.id);
      if (state === 'ACTIVE') return;

      if (state === 'UNLOADED') {
        this.cellManager.setCellState(cell.id, 'QUEUED');
        this.cellManager.setCellState(cell.id, 'LOADING');
        this.cellManager.setCellState(cell.id, 'LOADED');
      } else if (state === 'QUEUED') {
        this.cellManager.setCellState(cell.id, 'LOADING');
        this.cellManager.setCellState(cell.id, 'LOADED');
      } else if (state === 'LOADING') {
        this.cellManager.setCellState(cell.id, 'LOADED');
      }

      this.cellManager.setCellState(cell.id, 'ACTIVE');

      // 1. Create Terrain Chunk Mesh (Section 20)
      const terrainMesh = this.renderer.createCellTerrainChunk(cell);

      // 2. Create Water Mesh if applicable (Section 23, 24)
      const waterMesh = this.renderer.createCellWaterSurface(cell);

      // 3. Scatter deterministic vegetation (Section 25, 26)
      const vegMeshes = this.renderer.scatterCellVegetation(cell);

      // 4. Create local streaming lights (Section 38)
      this.renderer.createCellLocalLights(cell);

      // 5. Register gameplay props with duplicate protection (Section 101)
      if (cell.gameplayObjects) {
        for (const objId of cell.gameplayObjects) {
          this.cellManager.registerGameObject(cell.id, objId);
        }
      }

      // 6. Connect LivingWorldSystem NPCs & Wildlife (Section 27, 31)
      this.syncLivingEntitiesForCell(cell, true);

      // 7. Retain shared assets & mark HOT cache (Section 50, 51)
      if (cell.assets) {
        for (const aKey of cell.assets) {
          this.cache.retainAsset(aKey, null, 'prop');
        }
      }

      const allMeshes = [terrainMesh, waterMesh, ...vegMeshes].filter(Boolean);
      this.cache.markHot(cell.id, { cell, meshes: allMeshes, assets: cell.assets });

      this.recoverySystem.recordCellSuccess(cell.id);
      console.log(`[WorldStreamingSystem] 🟢 Cell ACTIVATED: ${cell.id} (${cell.regionId})`);
    }

    /**
     * Safe Cell Deactivation (Section 96)
     */
    deactivateCell(cellId) {
      const state = this.cellManager.getCellState(cellId);
      if (state !== 'ACTIVE') return;

      this.cellManager.setCellState(cellId, 'DEACTIVATING');
      this.deactivatingGraceFrames.set(cellId, 3); // 3 frames grace

      // Transition living NPCs/wildlife to ABSTRACT_SIMULATION (Section 28)
      const cell = this.cellManager.getCell(cellId);
      if (cell) {
        this.syncLivingEntitiesForCell(cell, false);
      }

      // Demote to COLD cache (Section 51)
      this.cache.demoteToCold(cellId);
      console.log(`[WorldStreamingSystem] 🟡 Cell DEACTIVATING: ${cellId}`);
    }

    /**
     * Safe Unload Queue (Section 48, 49)
     */
    queueCellForUnload(cellId) {
      if (this.priorityManager.isCellProtected(cellId, this.currentPlayerCellId)) {
        return; // Protected!
      }
      if (!this.pendingUnloadQueue.includes(cellId)) {
        this.pendingUnloadQueue.push(cellId);
        this.deactivateCell(cellId);
      }
    }

    /**
     * Processes safe unload queue after grace period (Section 49, 97)
     */
    processPendingUnloads() {
      for (const [cellId, framesLeft] of this.deactivatingGraceFrames.entries()) {
        if (framesLeft > 0) {
          this.deactivatingGraceFrames.set(cellId, framesLeft - 1);
        } else {
          this.deactivatingGraceFrames.delete(cellId);
          this.unloadCell(cellId);
        }
      }
    }

    /**
     * Complete resource disposal for unneeded cell (Section 97)
     */
    unloadCell(cellId) {
      // 1. Remove from scene via StreamingRenderer
      this.renderer.unloadCellRenderer(cellId);

      // 2. Clear scene children & unregister duplicates
      this.cellManager.clearSceneChildren(cellId);

      // 3. Release shared assets in cache
      const cell = this.cellManager.getCell(cellId);
      if (cell && cell.assets) {
        for (const aKey of cell.assets) {
          this.cache.releaseAsset(aKey, false);
        }
      }

      // 4. Update cell state
      this.cellManager.setCellState(cellId, 'UNLOADED');

      // 5. Remove from pending queue
      const idx = this.pendingUnloadQueue.indexOf(cellId);
      if (idx >= 0) this.pendingUnloadQueue.splice(idx, 1);

      console.log(`[WorldStreamingSystem] ⚪ Cell UNLOADED & Disposed: ${cellId}`);
    }

    /**
     * Region Transition Flow (Section 46, 89)
     */
    handleRegionTransition(fromRegionId, toRegionId) {
      console.log(`[WorldStreamingSystem] 🌄 SEAMLESS REGION TRANSITION: ${fromRegionId} ➔ ${toRegionId}`);

      // 1. Request checkpoint before transition (Section 89)
      if (typeof window !== 'undefined' && window.checkpointSystem) {
        window.checkpointSystem.requestCheckpoint('region_transition', { from: fromRegionId, to: toRegionId });
      }

      this.currentRegionId = toRegionId;
      const regData = typeof window !== 'undefined' ? window.WORLD_REGION_DATA : null;
      this.activeRegionData = regData ? regData.getRegion(toRegionId) : null;

      // 2. Deactivate active cells from outgoing regions (Section 46, 89)
      for (const cellId of Array.from(this.cellManager.activeCellIds)) {
        const cell = this.cellManager.getCell(cellId);
        if (cell && cell.regionId !== toRegionId && !this.priorityManager.isCellProtected(cellId, this.currentPlayerCellId)) {
          this.deactivateCell(cellId);
        }
      }

      // 3. Crossfade regional ambient audio (Section 35)
      this.crossfadeRegionAmbience(toRegionId);

      // 4. Notify Performance & Adaptive Quality systems (Section 90, 142)
      if (typeof window !== 'undefined' && window.performanceManager) {
        window.performanceManager.loadedRegionsCount = 1;
      }
    }

    /**
     * Smooth Region Ambience Crossfading (Section 35)
     */
    crossfadeRegionAmbience(regionId) {
      const reg = this.activeRegionData;
      if (!reg || !reg.ambientThemes) return;

      const newTheme = reg.ambientThemes.day || reg.ambientThemes.morning;
      if (newTheme === this.currentAmbienceTheme) return;

      this.currentAmbienceTheme = newTheme;
      console.log(`[WorldStreamingSystem] 🎵 Crossfading regional audio theme ➔ ${newTheme}`);

      if (typeof window !== 'undefined' && window.audioManager && typeof window.audioManager.crossfadeAmbience === 'function') {
        window.audioManager.crossfadeAmbience(newTheme, 2.0);
      }
    }

    /**
     * Entity presence coordination with LivingWorldSystem (Section 27-32)
     */
    syncLivingEntitiesForCell(cell, isActive) {
      const livingSys = typeof window !== 'undefined' ? window.livingWorld : null;
      if (!livingSys) return;

      // NPCs (Section 27, 28, 30)
      if (cell.npcs && Array.isArray(cell.npcs)) {
        for (const npcId of cell.npcs) {
          if (isActive) {
            // Restore from schedule without duplication
            if (this.cellManager.registerNPC(cell.id, npcId)) {
              if (livingSys.npcs && livingSys.npcs.has(npcId)) {
                const npc = livingSys.npcs.get(npcId);
                if (npc.mesh) npc.mesh.visible = true;
                npc.isAbstractSimulation = false;
              }
            }
          } else {
            // Transition to ABSTRACT_SIMULATION
            this.cellManager.unregisterNPC(cell.id, npcId);
            if (livingSys.npcs && livingSys.npcs.has(npcId)) {
              const npc = livingSys.npcs.get(npcId);
              if (npc.mesh) npc.mesh.visible = false;
              npc.isAbstractSimulation = true;
            }
          }
        }
      }
    }

    /**
     * Unloads all gameplay cells (Section 130 - Menu Return, New Game, Profile Switch)
     */
    unloadAllCells() {
      for (const cellId of Array.from(this.cellManager.activeCellIds)) {
        this.unloadCell(cellId);
      }
      this.pendingUnloadQueue = [];
      this.deactivatingGraceFrames.clear();
      this.cache.clear();
      this.cellManager.reset();
      console.log('[WorldStreamingSystem] 🧹 All gameplay cells unloaded. Active cell count: 0');
    }

    /**
     * Rebuilds state for New Game or Save Restore (Section 88, 131)
     */
    restoreFromSave(regionId = 'CHENNAI', cellId = 'CELL_CHE_001') {
      this.unloadAllCells();
      this.currentRegionId = regionId;
      this.currentPlayerCellId = cellId;

      const cell = this.cellManager.getCell(cellId);
      if (cell) {
        this.activateCell(cell);
        // Preload immediate neighbors
        const neighbors = this.cellManager.getNeighbors(cellId);
        for (const n of neighbors) {
          this.preloadCell(n);
        }
      }
      if (typeof window !== 'undefined' && window.GameState && window.GameState.world) {
        window.GameState.world.currentRegion = regionId.toLowerCase();
        window.GameState.world.currentCell = cellId;
        window.GameState.world.activeCells = Array.from(this.cellManager.activeCellIds);
      }
      console.log(`[WorldStreamingSystem] 💾 Restored world streaming for ${regionId} (${cellId})`);
    }

    /**
     * Gathers telemetry for Debugger overlay (Section 99, 100)
     */
    updateDiagnostics(playerPos) {
      if (!this.debugger) return;

      const cellStates = {};
      for (const [id, rec] of this.cellManager.cellRecords.entries()) {
        cellStates[id] = rec.state;
      }

      this.debugger.update({
        tier: this.budgetManager.currentTier,
        currentRegion: this.currentRegionId,
        currentCell: this.currentPlayerCellId,
        activeCellsCount: this.cellManager.activeCellIds.size,
        preloadCellsCount: this.cache.warm.size,
        queuedTasksCount: this.assetManager.getQueueLength(),
        failedCellsCount: this.recoverySystem.cellRetryRecords.size,
        cpuUsedMs: this.budgetManager.metrics.lastFrameCpuMs,
        cpuBudgetMs: this.budgetManager.cpuBudgetMs,
        gpuUploads: this.budgetManager.currentGpuUploadsThisFrame,
        gpuBudget: this.budgetManager.gpuUploadBudget,
        hotCount: this.cache.hot.size,
        warmCount: this.cache.warm.size,
        coldCount: this.cache.cold.size,
        memoryPressure: this.budgetManager.isFrameStressed ? 'HIGH' : 'NORMAL',
        cellStates,
        playerPos
      });
    }

    getActiveCellCount() {
      return this.cellManager.activeCellIds.size;
    }
  }

  return WorldStreamingSystem;
});
