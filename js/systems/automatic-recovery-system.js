/**
 * The Whispering Wilds - Automatic Recovery System
 * Self-healing watchdog that protects gameplay correctness during GPU stalls,
 * streaming delays, memory spikes, and OS suspend/resume cycles.
 * Enforces large delta protection to prevent physics explosions and teleportation.
 */
(function(root) {
  'use strict';

  class AutomaticRecoverySystem {
    constructor() {
      this.lastFrameTime = performance.now();
      this.maxAllowedDeltaSec = 0.1; // Max 100ms clamped delta to prevent teleport/explosion
      this.recoveryCount = 0;
      this.isRecovering = false;

      this.bindWindowEvents();
    }

    bindWindowEvents() {
      if (typeof window === 'undefined') return;

      // ALT-TAB / Focus changes: Pause single-player, reset transient input and timer baseline
      window.addEventListener('blur', () => {
        this.onWindowBlur();
      });

      window.addEventListener('focus', () => {
        this.onWindowFocus();
      });

      // OS Sleep / Wake: reset timer baseline to prevent massive delta jumps
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.onWindowBlur();
        } else {
          this.onWindowFocus();
        }
      });
    }

    onWindowBlur() {
      // Pause single player if in gameplay
      if (root.PauseSystem && typeof root.PauseSystem.pauseGame === 'function') {
        root.PauseSystem.pauseGame('FOCUS_LOST');
      }
    }

    onWindowFocus() {
      // Reset timing baseline immediately
      this.lastFrameTime = performance.now();
      // Reset input state to avoid stuck keys
      if (root.InputManager && typeof root.InputManager.resetAllInputs === 'function') {
        root.InputManager.resetAllInputs();
      }
    }

    /**
     * Clamps delta time to safe maximum to prevent physics explosions or survival jumps.
     */
    sanitizeDelta(rawDeltaSec) {
      if (typeof rawDeltaSec !== 'number' || isNaN(rawDeltaSec) || rawDeltaSec < 0) {
        return 0.016; // Default to 60fps delta
      }
      if (rawDeltaSec > this.maxAllowedDeltaSec) {
        // Delta spike detected (e.g. from alt-tab or heavy stall)
        return this.maxAllowedDeltaSec;
      }
      return rawDeltaSec;
    }

    /**
     * Recover from streaming stall
     */
    handleStreamingStall(failedCellId) {
      console.warn(`[AutomaticRecoverySystem] Streaming stall detected on cell ${failedCellId}. Deferring low-priority assets.`);
      this.recoveryCount++;
      if (root.WorldStreamingSystem && typeof root.WorldStreamingSystem.deferLowPriorityCells === 'function') {
        root.WorldStreamingSystem.deferLowPriorityCells();
      }
    }

    /**
     * Recover from high memory pressure
     */
    handleMemoryPressure() {
      console.warn('[AutomaticRecoverySystem] High memory pressure detected. Evicting cold assets.');
      this.recoveryCount++;
      if (root.WorldStreamingSystem && typeof root.WorldStreamingSystem.evictColdCache === 'function') {
        root.WorldStreamingSystem.evictColdCache();
      }
      if (root.MemoryManager && typeof root.MemoryManager.trimNonEssentialCaches === 'function') {
        root.MemoryManager.trimNonEssentialCaches();
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomaticRecoverySystem;
  } else {
    root.AutomaticRecoverySystem = AutomaticRecoverySystem;
  }
})(typeof window !== 'undefined' ? window : global);
