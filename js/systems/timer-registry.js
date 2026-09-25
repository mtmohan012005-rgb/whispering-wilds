/**
 * js/systems/timer-registry.js
 * Tracks active setTimeout and setInterval calls by owner to prevent memory leaks
 * and ghost updates after region transitions or UI destruction.
 */

(function () {
  'use strict';

  class TimerRegistry {
    constructor() {
      this._timers = new Map(); // id -> { rawId, type, owner, purpose, createdAt }
      this._nextId = 1;
    }

    /**
     * Registers and starts a setTimeout.
     */
    setTimeout(callback, delay, owner = 'global', purpose = 'unspecified') {
      const regId = this._nextId++;
      const rawId = window.setTimeout(() => {
        this._timers.delete(regId);
        callback();
      }, delay);

      this._timers.set(regId, {
        rawId,
        type: 'timeout',
        owner,
        purpose,
        createdAt: Date.now()
      });

      return regId;
    }

    /**
     * Registers and starts a setInterval.
     */
    setInterval(callback, interval, owner = 'global', purpose = 'unspecified') {
      const regId = this._nextId++;
      const rawId = window.setInterval(callback, interval);

      this._timers.set(regId, {
        rawId,
        type: 'interval',
        owner,
        purpose,
        createdAt: Date.now()
      });

      return regId;
    }

    clearTimeout(regId) {
      const entry = this._timers.get(regId);
      if (entry && entry.type === 'timeout') {
        window.clearTimeout(entry.rawId);
        this._timers.delete(regId);
        return true;
      }
      return false;
    }

    clearInterval(regId) {
      const entry = this._timers.get(regId);
      if (entry && entry.type === 'interval') {
        window.clearInterval(entry.rawId);
        this._timers.delete(regId);
        return true;
      }
      return false;
    }

    /**
     * Cleans up all timers registered under a specific owner.
     */
    cleanupByOwner(owner) {
      if (!owner) return 0;
      let count = 0;

      for (const [regId, entry] of this._timers.entries()) {
        if (entry.owner === owner) {
          if (entry.type === 'timeout') {
            window.clearTimeout(entry.rawId);
          } else if (entry.type === 'interval') {
            window.clearInterval(entry.rawId);
          }
          this._timers.delete(regId);
          count++;
        }
      }

      return count;
    }

    getActiveTimerCount(owner = null) {
      if (!owner) return this._timers.size;
      let count = 0;
      for (const entry of this._timers.values()) {
        if (entry.owner === owner) count++;
      }
      return count;
    }

    healthCheck() {
      return {
        status: 'healthy',
        details: { activeTimers: this._timers.size }
      };
    }
  }

  window.TimerRegistry = new TimerRegistry();
})();
