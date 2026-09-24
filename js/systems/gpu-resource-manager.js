// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - GPU RESOURCE MANAGER
// WebGL Context Loss & Restoration, Resource Lifecycle & Safe Recovery
// ============================================================================

(function() {
  'use strict';

  class GPUResourceManager {
    constructor() {
      this.isContextLost = false;
      this.contextLossCount = 0;
      this.lastLossTimestamp = 0;
      this.canvas = null;
      this.registeredRenderTargets = new Set();
      this.boundListeners = false;
    }

    attachToCanvas(canvas) {
      if (!canvas || this.boundListeners) return;
      this.canvas = canvas;
      this.boundListeners = true;

      canvas.addEventListener('webglcontextlost', (e) => this._onContextLost(e), false);
      canvas.addEventListener('webglcontextrestored', (e) => this._onContextRestored(e), false);
      console.log('[GPUResourceManager] Attached WebGL context lifecycle listeners to canvas.');
    }

    _onContextLost(event) {
      if (event) {
        event.preventDefault(); // Must preventDefault to allow restoration
      }

      this.isContextLost = true;
      this.contextLossCount++;
      this.lastLossTimestamp = performance.now();

      console.warn(`[GPUResourceManager] ⚠️ WebGL Context Lost! (Loss count: ${this.contextLossCount})`);

      // 1. Pause gameplay simulation safely
      if (window.GameLifecycle && typeof window.GameLifecycle.pause === 'function') {
        window.GameLifecycle.pause('GPU_CONTEXT_LOST');
      }

      // 2. Halt Three.js render loop temporarily
      if (window.threeWorld) {
        window.threeWorld.isContextPaused = true;
      }

      // 3. Notify recovery system & display recovery modal
      if (window.performanceRecoverySystem) {
        window.performanceRecoverySystem.handleContextLost(this.contextLossCount);
      }
    }

    _onContextRestored(event) {
      console.log('[GPUResourceManager] 🔄 WebGL Context Restored! Reinitializing GPU resources...');
      this.isContextLost = false;

      try {
        // 1. Re-initialize ThreeWorld renderer state if present
        if (window.threeWorld && typeof window.threeWorld.handleContextRestored === 'function') {
          window.threeWorld.handleContextRestored();
        }

        // 2. Re-bind render quality system
        if (window.renderQualitySystem && window.threeWorld?.renderer) {
          window.renderQualitySystem.reapplySettings(window.threeWorld.renderer);
        }

        // 3. Resume Three.js render loop
        if (window.threeWorld) {
          window.threeWorld.isContextPaused = false;
        }

        // 4. Resume gameplay simulation if previously active
        if (window.GameLifecycle && typeof window.GameLifecycle.resume === 'function') {
          window.GameLifecycle.resume('GPU_CONTEXT_RESTORED');
        }

        // 5. Notify recovery system of successful restoration
        if (window.performanceRecoverySystem) {
          window.performanceRecoverySystem.handleContextRestored();
        }

        console.log('[GPUResourceManager] ✅ WebGL Context restoration complete.');
      } catch (err) {
        console.error('[GPUResourceManager] Error during WebGL context restoration:', err);
        if (window.performanceRecoverySystem) {
          window.performanceRecoverySystem.showRendererFailureModal();
        }
      }
    }

    /**
     * Diagnostic helper for QA tests and simulation
     */
    simulateContextLoss() {
      if (!this.canvas) return false;
      try {
        const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        const ext = gl ? gl.getExtension('WEBGL_lose_context') : null;
        if (ext) {
          ext.loseContext();
          return true;
        }
      } catch (_) {}

      // Fallback synthetic trigger
      this._onContextLost(null);
      return true;
    }

    simulateContextRestore() {
      if (!this.canvas) return false;
      try {
        const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
        const ext = gl ? gl.getExtension('WEBGL_lose_context') : null;
        if (ext) {
          ext.restoreContext();
          return true;
        }
      } catch (_) {}

      // Fallback synthetic trigger
      this._onContextRestored(null);
      return true;
    }
  }

  const instance = new GPUResourceManager();

  if (typeof window !== 'undefined') {
    window.GPUResourceManager = GPUResourceManager;
    window.gpuResourceManager = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GPUResourceManager, gpuResourceManager: instance };
  }
})();
