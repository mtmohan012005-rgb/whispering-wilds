/**
 * The Whispering Wilds - Render Target Manager
 * Centralized allocation, validation, format verification, and safe disposal of FBOs.
 * Limits screenshot buffers to prevent GPU out-of-memory crashes.
 */
(function(root) {
  'use strict';

  class RenderTargetManager {
    constructor(THREE) {
      this.THREE = THREE || root.THREE;
      this.activeTargets = new Map(); // id -> { target, width, height, memoryBytes }
      this.maxMemoryBudgetBytes = 256 * 1024 * 1024; // 256MB FBO budget
      this.currentAllocatedBytes = 0;
    }

    createRenderTarget(id, width, height, options = {}) {
      if (!this.THREE) {
        throw new Error('RenderTargetManager: THREE is required');
      }

      // Safe bounds clamp (clamp between 64 and 3840x2160)
      const clampedW = Math.max(64, Math.min(3840, Math.floor(width)));
      const clampedH = Math.max(64, Math.min(2160, Math.floor(height)));

      // Estimate bytes (RGBA * 4 bytes per pixel)
      const estimatedBytes = clampedW * clampedH * 4;

      if (this.currentAllocatedBytes + estimatedBytes > this.maxMemoryBudgetBytes) {
        console.warn(`[RenderTargetManager] Budget exceeded. Evicting non-critical targets.`);
        this.evictExcessTargets();
      }

      // Dispose existing target if reusing id
      if (this.activeTargets.has(id)) {
        this.disposeTarget(id);
      }

      const params = Object.assign({
        minFilter: this.THREE.LinearFilter,
        magFilter: this.THREE.LinearFilter,
        format: this.THREE.RGBAFormat,
        type: this.THREE.UnsignedByteType,
        depthBuffer: true,
        stencilBuffer: false
      }, options);

      const target = new this.THREE.WebGLRenderTarget(clampedW, clampedH, params);
      target.texture.name = `ww_fbo_${id}`;

      this.activeTargets.set(id, {
        target,
        width: clampedW,
        height: clampedH,
        bytes: estimatedBytes
      });

      this.currentAllocatedBytes += estimatedBytes;
      return target;
    }

    getTarget(id) {
      const entry = this.activeTargets.get(id);
      return entry ? entry.target : null;
    }

    disposeTarget(id) {
      if (!this.activeTargets.has(id)) return;
      const entry = this.activeTargets.get(id);
      try {
        entry.target.dispose();
      } catch (_) {}
      this.currentAllocatedBytes -= entry.bytes;
      this.activeTargets.delete(id);
    }

    evictExcessTargets() {
      for (const [id, entry] of this.activeTargets.entries()) {
        if (id.startsWith('temp_') || id.startsWith('screenshot_')) {
          this.disposeTarget(id);
        }
      }
    }

    disposeAll() {
      for (const id of Array.from(this.activeTargets.keys())) {
        this.disposeTarget(id);
      }
      this.currentAllocatedBytes = 0;
    }

    getStats() {
      return {
        activeCount: this.activeTargets.size,
        allocatedBytes: this.currentAllocatedBytes,
        budgetBytes: this.maxMemoryBudgetBytes
      };
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = RenderTargetManager;
  } else {
    root.RenderTargetManager = RenderTargetManager;
  }
})(typeof window !== 'undefined' ? window : global);
