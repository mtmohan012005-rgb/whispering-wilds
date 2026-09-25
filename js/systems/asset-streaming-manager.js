/**
 * The Whispering Wilds (Kaattu Vazhi) - Asset Streaming Manager
 * Priority queue for asynchronous asset streaming, staged LOAD -> PREPARE -> ACTIVATE execution,
 * and per-frame CPU/GPU upload batching to prevent frame drops.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AssetStreamingManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class AssetStreamingManager {
    constructor(scene = null, budgetManager = null) {
      this.scene = scene;
      this.budget = budgetManager;

      // Priority queues
      this.queue = []; // Array of tasks sorted by priority (1 = CRITICAL, 4 = LOW)
      this.activeTasks = new Map(); // taskId -> task

      // Task ID counter
      this._nextTaskId = 1;

      // Staged task lists
      this.pendingPrepare = [];
      this.pendingActivate = [];

      // Telemetry
      this.completedTasksCount = 0;
      this.failedTasksCount = 0;
    }

    /**
     * Enqueues an asset or cell chunk task into the streaming pipeline (Section 15, 19)
     * @param {Object} options - { cellId, assetId, type, priority, estimatedCost, onComplete, onFail }
     */
    enqueueTask(options) {
      const taskId = `task_${this._nextTaskId++}`;
      const task = {
        id: taskId,
        cellId: options.cellId || 'GLOBAL',
        assetId: options.assetId || 'unknown_asset',
        type: options.type || 'prop', // 'terrain' | 'prop' | 'npc' | 'water' | 'collision'
        priority: options.priority || 3, // 1: CRITICAL, 2: HIGH, 3: NORMAL, 4: LOW
        stage: 'QUEUED', // 'QUEUED' -> 'LOADING' -> 'PREPARED' -> 'ACTIVATING' -> 'DONE'
        estimatedCost: options.estimatedCost || 1.0,
        data: null,
        createdObject: null,
        onComplete: options.onComplete || null,
        onFail: options.onFail || null,
        queuedAt: performance.now()
      };

      this.queue.push(task);
      // Sort ascending by priority number (1 first)
      this.queue.sort((a, b) => a.priority - b.priority);

      return task;
    }

    /**
     * Per-frame execution loop throttled by StreamingBudgetManager (Section 16, 17, 93)
     */
    processFrame(budgetManager = null) {
      const budget = budgetManager || this.budget;
      const startMs = performance.now();

      // 1. Process batch activations first (Stage 3: ACTIVATE)
      while (this.pendingActivate.length > 0) {
        if (budget && (!budget.canActivateTask() || !budget.canDoCpuWork(0.5))) {
          break; // Defer remaining activations to next frame
        }

        const task = this.pendingActivate.shift();
        const tStart = performance.now();
        this._activateTask(task);
        const dur = performance.now() - tStart;
        if (budget) budget.recordActivationTask(dur);
      }

      // 2. Process staged preparation (Stage 2: PREPARE)
      while (this.pendingPrepare.length > 0) {
        if (budget && (!budget.canDoGpuUpload() || !budget.canDoCpuWork(1.0))) {
          break; // Defer remaining preparations to next frame
        }

        const task = this.pendingPrepare.shift();
        const tStart = performance.now();
        this._prepareTask(task);
        const dur = performance.now() - tStart;
        if (budget) {
          budget.recordCpuWork(dur);
          budget.recordGpuUpload();
        }
      }

      // 3. Process queued tasks (Stage 1: LOAD)
      while (this.queue.length > 0) {
        if (budget && (!budget.canLoadTask() || !budget.canDoCpuWork(0.8))) {
          break; // Frame budget reached; defer remaining tasks
        }

        const task = this.queue.shift();
        const tStart = performance.now();
        this._loadTask(task);
        const dur = performance.now() - tStart;
        if (budget) budget.recordLoadTask(dur);
      }

      return performance.now() - startMs;
    }

    /**
     * Stage 1: Asynchronous load or generation of asset data
     */
    _loadTask(task) {
      task.stage = 'LOADING';

      try {
        // Build or resolve mesh data
        if (task.type === 'terrain') {
          // Terrain data resolution
          task.data = { isTerrain: true, cellId: task.cellId };
          this.pendingPrepare.push(task);
        } else if (task.type === 'npc') {
          task.data = { isNpc: true, npcId: task.assetId };
          this.pendingPrepare.push(task);
        } else {
          // General mesh prop
          task.data = { isProp: true, assetId: task.assetId };
          this.pendingPrepare.push(task);
        }
      } catch (err) {
        task.stage = 'FAILED';
        this.failedTasksCount++;
        if (typeof task.onFail === 'function') task.onFail(err);
      }
    }

    /**
     * Stage 2: Prepare geometry, materials, and GPU textures
     */
    _prepareTask(task) {
      task.stage = 'PREPARED';

      try {
        // Construct Object3D representation if Three.js is present
        if (typeof THREE !== 'undefined') {
          if (task.type === 'terrain') {
            const geo = new THREE.PlaneGeometry(45, 45, 12, 12);
            geo.rotateX(-Math.PI / 2);
            const mat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            task.createdObject = new THREE.Mesh(geo, mat);
          } else {
            const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            const mat = new THREE.MeshLambertMaterial({ color: 0x4a752c });
            task.createdObject = new THREE.Mesh(geo, mat);
          }
          if (task.createdObject) {
            task.createdObject.name = `${task.cellId}_${task.assetId}`;
          }
        }
        this.pendingActivate.push(task);
      } catch (err) {
        task.stage = 'FAILED';
        this.failedTasksCount++;
        if (typeof task.onFail === 'function') task.onFail(err);
      }
    }

    /**
     * Stage 3: Scene insertion and activation
     */
    _activateTask(task) {
      task.stage = 'DONE';

      try {
        if (this.scene && task.createdObject) {
          this.scene.add(task.createdObject);
        }
        this.completedTasksCount++;
        if (typeof task.onComplete === 'function') {
          task.onComplete(task.createdObject);
        }
      } catch (err) {
        task.stage = 'FAILED';
        this.failedTasksCount++;
        if (typeof task.onFail === 'function') task.onFail(err);
      }
    }

    /**
     * Clears all queued and pending tasks
     */
    clear() {
      this.queue = [];
      this.pendingPrepare = [];
      this.pendingActivate = [];
      this.activeTasks.clear();
    }

    getQueueLength() {
      return this.queue.length + this.pendingPrepare.length + this.pendingActivate.length;
    }
  }

  return AssetStreamingManager;
});
