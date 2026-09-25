/**
 * js/core/system-registry.js
 * Single authoritative system registry preventing duplicate subsystem instantiation,
 * resolving dependencies in topological order, and verifying critical subsystem health.
 */

(function () {
  'use strict';

  class SystemRegistry {
    constructor() {
      this._systems = new Map();
      this._criticalSystems = new Set([
        'GameState',
        'Player',
        'Renderer',
        'Input',
        'Lifecycle',
        'SaveManager',
        'Collision',
        'WorldStreaming'
      ]);
    }

    /**
     * Registers a subsystem. Prevents duplicate registration.
     * @returns {boolean} true if newly registered, false if already present
     */
    register(id, instance, metadata = {}) {
      if (!id || typeof id !== 'string') {
        throw new Error('[SystemRegistry] Invalid system id: must be non-empty string');
      }

      if (this._systems.has(id)) {
        console.warn(`[SystemRegistry] Duplicate system registration prevented for '${id}'. Retaining active authority.`);
        if (window.DiagnosticsConsole) {
          window.DiagnosticsConsole.recordEvent('DUPLICATE_SYSTEM_PREVENTED', { id });
        }
        return false;
      }

      const entry = {
        id,
        instance,
        version: metadata.version || '1.0.0',
        dependencies: Array.isArray(metadata.dependencies) ? [...metadata.dependencies] : [],
        isCritical: metadata.isCritical !== undefined ? !!metadata.isCritical : this._criticalSystems.has(id),
        status: 'registered',
        registeredAt: Date.now()
      };

      this._systems.set(id, entry);
      return true;
    }

    has(id) {
      return this._systems.has(id);
    }

    get(id) {
      const entry = this._systems.get(id);
      return entry ? entry.instance : null;
    }

    getEntry(id) {
      return this._systems.get(id) || null;
    }

    unregister(id) {
      return this._systems.delete(id);
    }

    isCritical(id) {
      const entry = this._systems.get(id);
      return entry ? entry.isCritical : this._criticalSystems.has(id);
    }

    setCritical(id, isCritical = true) {
      if (isCritical) {
        this._criticalSystems.add(id);
      } else {
        this._criticalSystems.delete(id);
      }
      if (this._systems.has(id)) {
        this._systems.get(id).isCritical = isCritical;
      }
    }

    /**
     * Resolves systems in dependency order using topological sorting.
     */
    getDependencyOrder() {
      const visited = new Set();
      const temp = new Set();
      const order = [];

      const visit = (id) => {
        if (temp.has(id)) {
          throw new Error(`[SystemRegistry] Circular dependency detected in system graph involving '${id}'`);
        }
        if (!visited.has(id)) {
          temp.add(id);
          const entry = this._systems.get(id);
          if (entry && Array.isArray(entry.dependencies)) {
            for (const dep of entry.dependencies) {
              if (this._systems.has(dep)) {
                visit(dep);
              }
            }
          }
          temp.delete(id);
          visited.add(id);
          order.push(id);
        }
      };

      for (const id of this._systems.keys()) {
        if (!visited.has(id)) {
          visit(id);
        }
      }

      return order;
    }

    /**
     * Runs health check across all registered systems.
     * @returns {{ healthy: boolean, criticalFailed: string[], report: Object }}
     */
    healthCheckAll() {
      const report = {};
      const criticalFailed = [];
      let allHealthy = true;

      for (const [id, entry] of this._systems.entries()) {
        let status = 'healthy';
        let details = null;

        try {
          if (entry.instance && typeof entry.instance.healthCheck === 'function') {
            const res = entry.instance.healthCheck();
            if (typeof res === 'string') {
              status = res;
            } else if (res && typeof res === 'object') {
              status = res.status || 'healthy';
              details = res.details || null;
            }
          }
        } catch (err) {
          status = 'failed';
          details = err.message;
        }

        entry.status = status;
        report[id] = { status, isCritical: entry.isCritical, details };

        if (status === 'failed') {
          allHealthy = false;
          if (entry.isCritical) {
            criticalFailed.push(id);
          }
        } else if (status === 'degraded' && entry.isCritical) {
          // Degraded critical systems are monitored but do not automatically crash
        }
      }

      return {
        healthy: criticalFailed.length === 0,
        allHealthy,
        criticalFailed,
        report
      };
    }

    /**
     * Shuts down all registered systems in reverse dependency order.
     */
    shutdownAll() {
      let order = [];
      try {
        order = this.getDependencyOrder().reverse();
      } catch (_) {
        order = Array.from(this._systems.keys()).reverse();
      }

      for (const id of order) {
        const entry = this._systems.get(id);
        if (entry && entry.instance && typeof entry.instance.shutdown === 'function') {
          try {
            entry.instance.shutdown();
          } catch (err) {
            console.error(`[SystemRegistry] Error shutting down system '${id}':`, err);
          }
        }
      }
    }

    /**
     * Validates that all critical systems exist and are registered.
     */
    validateCriticalSystems() {
      // Auto-register known global instances if not yet explicitly registered
      const fallbackMap = {
        'GameState': () => window.GameState,
        'Player': () => window.player || window.Production3DPlayer || window.Player,
        'Renderer': () => window.threeWorld?.renderer || window.ThreeWorld || window.Renderer || window.THREE,
        'Input': () => window.inputManager || window.InputManager || window.controls,
        'Lifecycle': () => window.GameLifecycle,
        'SaveManager': () => window.saveManager || window.gameSaveManager || window.SaveManager,
        'Collision': () => window.collisionResolver || window.WorldCollisionResolver || window.WorldCollision || window.Collision,
        'WorldStreaming': () => window.worldStreamingSystem || window.WorldStreamingSystem || window.threeWorld?.worldStreaming
      };

      for (const [id, resolver] of Object.entries(fallbackMap)) {
        if (!this._systems.has(id)) {
          const inst = resolver();
          if (inst) {
            this.register(id, inst, { isCritical: true });
          }
        }
      }

      const missing = [];
      for (const id of this._criticalSystems) {
        if (!this._systems.has(id)) {
          missing.push(id);
        }
      }
      return {
        valid: missing.length === 0,
        missing
      };
    }
  }

  window.SystemRegistry = new SystemRegistry();
})();
