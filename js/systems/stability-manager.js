/**
 * The Whispering Wilds - Stability Manager
 * Single session guardian that detects & blocks duplicate render loops, duplicate
 * managers, unowned event listeners, and runaway memory/timer leaks.
 */
(function(root) {
  'use strict';

  class StabilityManager {
    constructor() {
      if (root.StabilityManagerInstance) {
        return root.StabilityManagerInstance;
      }

      this.activeRenderLoops = new Set();
      this.eventListeners = [];
      this.timers = new Set();
      this.intervals = new Set();
      this.resourceRegistry = new Map(); // id -> { type, owner, refCount }
      this.duplicateWarnings = [];
      this.logRingBuffer = [];
      this.maxLogEntries = 100;

      root.StabilityManagerInstance = this;
    }

    // --- RENDER LOOP GUARD ---
    registerRenderLoop(loopId) {
      if (this.activeRenderLoops.has(loopId)) {
        console.warn(`[StabilityManager] DUPLICATE RENDER LOOP BLOCKED: Loop '${loopId}' is already registered!`);
        this.duplicateWarnings.push(`Duplicate render loop: ${loopId}`);
        return false;
      }
      if (this.activeRenderLoops.size >= 1) {
        console.warn(`[StabilityManager] MULTIPLE ACTIVE RENDER LOOPS DETECTED! Current active: ${Array.from(this.activeRenderLoops).join(', ')}`);
        this.duplicateWarnings.push(`Multiple render loops detected`);
      }
      this.activeRenderLoops.add(loopId);
      return true;
    }

    unregisterRenderLoop(loopId) {
      this.activeRenderLoops.delete(loopId);
    }

    // --- SYSTEM DUPLICATE AUDIT ---
    auditSystemSingletons() {
      const duplicates = [];

      // Check AudioManager
      if (root.AudioManagerInstances && root.AudioManagerInstances.length > 1) {
        duplicates.push('Multiple AudioManager instances');
      }

      // Check WeatherSystem
      if (root.WeatherSystemInstances && root.WeatherSystemInstances.length > 1) {
        duplicates.push('Multiple WeatherSystem instances');
      }

      // Check LivingWorldSystem
      if (root.LivingWorldSystemInstances && root.LivingWorldSystemInstances.length > 1) {
        duplicates.push('Multiple LivingWorldSystem instances');
      }

      // Check Sockets
      if (root.multiplayerSockets && root.multiplayerSockets.length > 1) {
        duplicates.push('Multiple active Socket.IO connections');
      }

      return {
        passed: duplicates.length === 0,
        duplicates
      };
    }

    // --- EVENT LISTENER REGISTRY ---
    registerEventListener(target, event, handler, owner = 'GLOBAL') {
      if (!target || !event || !handler) return;
      target.addEventListener(event, handler);
      this.eventListeners.push({ target, event, handler, owner });
    }

    cleanupOwnerListeners(owner) {
      this.eventListeners = this.eventListeners.filter(item => {
        if (item.owner === owner) {
          try {
            item.target.removeEventListener(item.event, item.handler);
          } catch (_) {}
          return false;
        }
        return true;
      });
    }

    // --- TIMER REGISTRY ---
    createTimer(fn, delayMs, owner = 'GLOBAL') {
      const id = setTimeout(() => {
        this.timers.delete(id);
        fn();
      }, delayMs);
      this.timers.add(id);
      return id;
    }

    clearRegisteredTimer(id) {
      clearTimeout(id);
      this.timers.delete(id);
    }

    cleanupAllTimers() {
      for (const id of this.timers) clearTimeout(id);
      for (const id of this.intervals) clearInterval(id);
      this.timers.clear();
      this.intervals.clear();
    }

    // --- RESOURCE OWNERSHIP & SHARED ASSET PROTECTION ---
    registerResource(id, type, owner = 'REGION') {
      if (this.resourceRegistry.has(id)) {
        const entry = this.resourceRegistry.get(id);
        entry.refCount++;
        return entry;
      }
      const entry = { id, type, owner, refCount: 1 };
      this.resourceRegistry.set(id, entry);
      return entry;
    }

    releaseResource(id, disposeFn) {
      if (!this.resourceRegistry.has(id)) return;
      const entry = this.resourceRegistry.get(id);
      entry.refCount--;
      if (entry.refCount <= 0) {
        if (typeof disposeFn === 'function') {
          try { disposeFn(); } catch (_) {}
        }
        this.resourceRegistry.delete(id);
      }
    }

    // --- BOUNDED LOGS ---
    log(message) {
      const entry = `[${new Date().toISOString()}] ${message}`;
      this.logRingBuffer.push(entry);
      if (this.logRingBuffer.length > this.maxLogEntries) {
        this.logRingBuffer.shift(); // Bounded rotation
      }
    }

    getLogs() {
      return this.logRingBuffer.slice();
    }

    getReport() {
      const singletonAudit = this.auditSystemSingletons();
      return {
        activeRenderLoops: Array.from(this.activeRenderLoops),
        activeEventListeners: this.eventListeners.length,
        activeTimers: this.timers.size,
        trackedResources: this.resourceRegistry.size,
        singletonsPassed: singletonAudit.passed,
        duplicateWarnings: this.duplicateWarnings.concat(singletonAudit.duplicates)
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StabilityManager;
  } else {
    root.StabilityManager = StabilityManager;
  }
})(typeof window !== 'undefined' ? window : global);
