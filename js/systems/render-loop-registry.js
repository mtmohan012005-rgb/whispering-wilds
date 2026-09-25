/**
 * js/systems/render-loop-registry.js
 * Enforces exactly one authoritative gameplay requestAnimationFrame render loop.
 * Detects and terminates duplicate loop attempts to prevent runaway frame rates or memory spikes.
 */

(function () {
  'use strict';

  class RenderLoopRegistry {
    constructor() {
      this._activeLoopId = null;
      this._loops = new Map(); // id -> { id, owner, callback, rafId, isActive }
    }

    /**
     * Registers a render loop definition.
     */
    registerLoop(id, owner, callback) {
      if (!id || typeof callback !== 'function') return false;

      this._loops.set(id, {
        id,
        owner: owner || 'global',
        callback,
        rafId: null,
        isActive: false
      });

      return true;
    }

    /**
     * Starts the specified loop as the authoritative render loop.
     * Prevents duplicate active loops.
     */
    startLoop(id) {
      const entry = this._loops.get(id);
      if (!entry) {
        console.warn(`[RenderLoopRegistry] Loop '${id}' not found`);
        return false;
      }

      // If another loop is already running, prevent duplicate
      if (this._activeLoopId && this._activeLoopId !== id) {
        console.warn(`[RenderLoopRegistry] Duplicate render loop attempt prevented: '${id}' blocked while '${this._activeLoopId}' is running.`);
        if (window.DiagnosticsConsole) {
          window.DiagnosticsConsole.recordEvent('DUPLICATE_RENDER_LOOP', { attempted: id, active: this._activeLoopId });
        }
        return false;
      }

      if (entry.isActive) return true; // Already active

      entry.isActive = true;
      this._activeLoopId = id;

      const loopFn = (timestamp) => {
        if (!entry.isActive) return;
        entry.callback(timestamp);
        entry.rafId = requestAnimationFrame(loopFn);
      };

      entry.rafId = requestAnimationFrame(loopFn);
      return true;
    }

    /**
     * Stops the specified loop or active loop.
     */
    stopLoop(id = null) {
      const targetId = id || this._activeLoopId;
      if (!targetId) return false;

      const entry = this._loops.get(targetId);
      if (entry && entry.isActive) {
        entry.isActive = false;
        if (entry.rafId) {
          cancelAnimationFrame(entry.rafId);
          entry.rafId = null;
        }
        if (this._activeLoopId === targetId) {
          this._activeLoopId = null;
        }
        return true;
      }
      return false;
    }

    hasActiveLoop() {
      return this._activeLoopId !== null;
    }

    getActiveLoopId() {
      return this._activeLoopId;
    }

    healthCheck() {
      return {
        status: 'healthy',
        details: { activeLoop: this._activeLoopId, registeredLoops: this._loops.size }
      };
    }
  }

  window.RenderLoopRegistry = new RenderLoopRegistry();
})();
