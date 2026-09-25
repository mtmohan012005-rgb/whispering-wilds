/**
 * The Whispering Wilds (Kaattu Vazhi) - Core System Manager
 * Manages subsystem lifecycle (init, update, destroy), tracks memory allocations,
 * disposes orphaned resources, and coordinates safe game restarts and shutdowns.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const sysMgr = factory();
    root.SystemManager = sysMgr;
    if (typeof window !== 'undefined') {
      window.SystemManager = sysMgr;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class SystemManagerEngine {
    constructor() {
      this._systems = new Map();
      this._disposables = new Set();
      this._updateableSystems = [];
      this._isInitialized = false;
    }

    /**
     * Register a subsystem with standardized lifecycle methods
     * @param {string} id - Unique system ID
     * @param {Object} system - Instance implementing init, update, destroy
     * @param {number} priority - Execution order priority (higher runs first)
     */
    register(id, system, priority = 0) {
      if (!id || !system) return false;

      if (this._systems.has(id)) {
        console.warn(`[SystemManager] Subsystem '${id}' already registered. Retaining existing instance.`);
        return false;
      }

      const record = { id, system, priority, initialized: false };
      this._systems.set(id, record);

      if (typeof system.update === 'function') {
        this._updateableSystems.push(record);
        this._updateableSystems.sort((a, b) => b.priority - a.priority);
      }

      // If SystemManager was already initialized, initialize this system now
      if (this._isInitialized && typeof system.init === 'function') {
        try {
          system.init();
          record.initialized = true;
        } catch (err) {
          console.error(`[SystemManager] Error initializing '${id}':`, err);
        }
      }

      return true;
    }

    get(id) {
      return this._systems.get(id)?.system || null;
    }

    has(id) {
      return this._systems.has(id);
    }

    unregister(id) {
      const record = this._systems.get(id);
      if (!record) return false;

      if (typeof record.system.destroy === 'function') {
        try { record.system.destroy(); } catch (err) { console.error(`[SystemManager] Error destroying '${id}':`, err); }
      }

      this._systems.delete(id);
      this._updateableSystems = this._updateableSystems.filter(r => r.id !== id);
      return true;
    }

    /**
     * Track disposable resource (mesh, texture, audio buffer, listener)
     */
    addDisposable(resource) {
      if (resource && typeof resource.dispose === 'function') {
        this._disposables.add(resource);
      }
    }

    /**
     * Initialize all registered subsystems
     */
    initAll() {
      if (this._isInitialized) return;
      this._isInitialized = true;

      for (const [id, record] of this._systems.entries()) {
        if (!record.initialized && typeof record.system.init === 'function') {
          try {
            record.system.init();
            record.initialized = true;
          } catch (err) {
            console.error(`[SystemManager] Error during init of '${id}':`, err);
          }
        }
      }
    }

    /**
     * Update all registered subsystems with priority ordering
     */
    updateAll(dt) {
      for (let i = 0; i < this._updateableSystems.length; i++) {
        const record = this._updateableSystems[i];
        try {
          record.system.update(dt);
        } catch (err) {
          console.error(`[SystemManager] Error updating '${record.id}':`, err);
        }
      }
    }

    /**
     * Clean shutdown of all subsystems, stopping loops and freeing GPU/memory resources
     */
    shutdownAll() {
      // 1. Destroy subsystems in reverse order
      const reversed = [...this._systems.values()].reverse();
      for (const record of reversed) {
        if (typeof record.system.destroy === 'function') {
          try {
            record.system.destroy();
          } catch (err) {
            console.error(`[SystemManager] Error destroying '${record.id}':`, err);
          }
        }
        record.initialized = false;
      }

      // 2. Dispose tracked GPU & audio disposables
      for (const res of this._disposables) {
        try {
          res.dispose();
        } catch (_) {}
      }
      this._disposables.clear();

      this._isInitialized = false;
    }

    destroy() {
      this.shutdownAll();
      this._systems.clear();
      this._updateableSystems = [];
    }
  }

  return new SystemManagerEngine();
});
