/**
 * js/systems/resource-leak-detector.js
 * Tracks allocations for Three.js objects, geometries, materials, audio nodes,
 * listeners, and timers to detect resource leaks across scene and region transitions.
 */

(function () {
  'use strict';

  class ResourceLeakDetector {
    constructor() {
      this._refCounts = new Map(); // resId -> number
      this._resourceRegistry = new Map(); // resId -> { type, owner, metadata }
      this._snapshots = new Map(); // name -> snapshotObj
    }

    /**
     * Retains a shared resource.
     */
    retain(resId, type = 'generic', owner = 'global') {
      const current = this._refCounts.get(resId) || 0;
      this._refCounts.set(resId, current + 1);
      if (!this._resourceRegistry.has(resId)) {
        this._resourceRegistry.set(resId, { type, owner, registeredAt: Date.now() });
      }
      return current + 1;
    }

    /**
     * Releases a shared resource. If count drops to 0, returns true (safe to dispose).
     */
    release(resId) {
      const current = this._refCounts.get(resId) || 0;
      if (current <= 1) {
        this._refCounts.delete(resId);
        this._resourceRegistry.delete(resId);
        return true; // 0 remaining, safe to dispose
      }
      this._refCounts.set(resId, current - 1);
      return false; // Still referenced by others
    }

    getRefCount(resId) {
      return this._refCounts.get(resId) || 0;
    }

    /**
     * Captures a comprehensive snapshot of current engine resources.
     */
    takeSnapshot(name = 'default') {
      const memory = window.performance?.memory ? {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize
      } : null;

      const listenersCount = window.EventListenerRegistry ? window.EventListenerRegistry.getTotalCount() : 0;
      const timersCount = window.TimerRegistry ? window.TimerRegistry.getActiveTimerCount() : 0;
      const renderLoopActive = window.RenderLoopRegistry ? window.RenderLoopRegistry.hasActiveLoop() : false;

      let sceneCount = 0;
      if (window.ThreeWorld?.scene) {
        sceneCount = window.ThreeWorld.scene.children.length;
      }

      const snapshot = {
        name,
        timestamp: Date.now(),
        memory,
        listenersCount,
        timersCount,
        renderLoopActive,
        sceneCount,
        activeSharedResources: this._refCounts.size
      };

      this._snapshots.set(name, snapshot);
      return snapshot;
    }

    /**
     * Compares two snapshots to evaluate memory and resource growth.
     */
    compareSnapshots(beforeName, afterName) {
      const b = this._snapshots.get(beforeName);
      const a = this._snapshots.get(afterName);

      if (!b || !a) {
        return { valid: false, error: 'One or both snapshots missing' };
      }

      const diff = {
        valid: true,
        listenerDelta: a.listenersCount - b.listenersCount,
        timerDelta: a.timersCount - b.timersCount,
        sceneDelta: a.sceneCount - b.sceneCount,
        sharedResourceDelta: a.activeSharedResources - b.activeSharedResources,
        heapDeltaBytes: (a.memory && b.memory) ? (a.memory.usedJSHeapSize - b.memory.usedJSHeapSize) : null
      };

      // Unbounded growth flags
      diff.potentialLeak = diff.listenerDelta > 50 || diff.timerDelta > 20 || diff.sceneDelta > 200;

      return diff;
    }

    healthCheck() {
      return {
        status: 'healthy',
        details: {
          trackedSharedResources: this._refCounts.size,
          snapshotsTaken: this._snapshots.size
        }
      };
    }
  }

  window.ResourceLeakDetector = new ResourceLeakDetector();
})();
