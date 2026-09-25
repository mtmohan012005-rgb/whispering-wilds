/**
 * The Whispering Wilds - GPU Recovery Manager
 * Manages WebGL context loss and restoration events.
 * Safely pauses simulation, recreates GPU buffers, and preserves GameState without scene duplication.
 */
(function(root) {
  'use strict';

  class GPURecoveryManager {
    constructor(canvas, onRestoredCallback) {
      this.canvas = canvas;
      this.onRestoredCallback = onRestoredCallback;
      this.isContextLost = false;
      this.lossCount = 0;
      this.maxRecoveryAttempts = 3;

      this.bindEvents();
    }

    bindEvents() {
      if (!this.canvas) return;

      this.canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault(); // Required for WebGL restoration
        this.handleContextLost();
      }, false);

      this.canvas.addEventListener('webglcontextrestored', () => {
        this.handleContextRestored();
      }, false);
    }

    handleContextLost() {
      console.warn('[GPURecoveryManager] WebGL Context Lost! Pausing gameplay simulation safely.');
      this.isContextLost = true;
      this.lossCount++;

      // Pause gameplay
      if (root.PauseSystem && typeof root.PauseSystem.pauseGame === 'function') {
        root.PauseSystem.pauseGame('GPU_CONTEXT_LOST');
      }

      // Freeze input
      if (root.InputManager && typeof root.InputManager.resetAllInputs === 'function') {
        root.InputManager.resetAllInputs();
      }

      // Show recovery UI if repeated losses occur
      if (this.lossCount >= this.maxRecoveryAttempts) {
        if (root.GraphicsRecoveryUI && typeof root.GraphicsRecoveryUI.show === 'function') {
          root.GraphicsRecoveryUI.show('Persistent GPU context loss detected.');
        }
      }
    }

    handleContextRestored() {
      console.log('[GPURecoveryManager] WebGL Context Restored. Reinitializing GPU resources...');
      this.isContextLost = false;

      // Invoke restore callback (re-bind shaders, rebuild render targets)
      if (typeof this.onRestoredCallback === 'function') {
        try {
          this.onRestoredCallback();
        } catch (err) {
          console.error('[GPURecoveryManager] Error during restore callback:', err);
        }
      }

      // Resume gameplay if paused by context lost
      if (root.PauseSystem && typeof root.PauseSystem.resumeGame === 'function') {
        root.PauseSystem.resumeGame();
      }
    }

    simulateContextLoss() {
      if (this.canvas) {
        const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        if (gl) {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) {
            ext.loseContext();
            setTimeout(() => {
              ext.restoreContext();
            }, 100);
            return true;
          }
        }
      }
      // Synthetic fallback
      this.handleContextLost();
      setTimeout(() => this.handleContextRestored(), 50);
      return true;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GPURecoveryManager;
  } else {
    root.GPURecoveryManager = GPURecoveryManager;
  }
})(typeof window !== 'undefined' ? window : global);
