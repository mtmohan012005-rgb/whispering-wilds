/**
 * The Whispering Wilds - Graphics Health System
 * Watchdog monitoring frame progression, canvas validity, and WebGL context health.
 * Prevents false positives by strictly recognizing paused and blurred window states.
 */
(function(root) {
  'use strict';

  class GraphicsHealthSystem {
    constructor() {
      this.lastRenderTimestamp = performance.now();
      this.hungThresholdMs = 3000; // 3 seconds without a frame while playing = potential hang
      this.isWatchdogActive = false;
      this.hangCount = 0;
    }

    recordFrameProgression() {
      this.lastRenderTimestamp = performance.now();
    }

    checkHealth(canvas, renderer) {
      const now = performance.now();

      // Check 1: Canvas attached and valid
      if (!canvas || !canvas.isConnected) {
        return { healthy: false, reason: 'CANVAS_DETACHED' };
      }

      // Check 2: Context lost check
      if (renderer && typeof renderer.getContext === 'function') {
        const gl = renderer.getContext();
        if (gl && typeof gl.isContextLost === 'function' && gl.isContextLost()) {
          return { healthy: false, reason: 'CONTEXT_LOST' };
        }
      }

      // Check 3: Frame progression watchdog (only when actively playing and unpaused)
      const isPaused = root.PauseSystem && typeof root.PauseSystem.isPaused === 'function' && root.PauseSystem.isPaused();
      const isDocHidden = typeof document !== 'undefined' && document.hidden;

      if (!isPaused && !isDocHidden) {
        const elapsed = now - this.lastRenderTimestamp;
        if (elapsed > this.hungThresholdMs) {
          this.hangCount++;
          console.warn(`[GraphicsHealthSystem] Renderer frame progression stall detected (${elapsed.toFixed(0)}ms)!`);
          return { healthy: false, reason: 'RENDERER_HUNG', elapsedMs: elapsed };
        }
      } else {
        // When paused or hidden, refresh timestamp to avoid false alarms upon unpausing
        this.lastRenderTimestamp = now;
      }

      return { healthy: true, reason: 'OK' };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsHealthSystem;
  } else {
    root.GraphicsHealthSystem = GraphicsHealthSystem;
  }
})(typeof window !== 'undefined' ? window : global);
