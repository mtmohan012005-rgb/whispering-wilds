/**
 * The Whispering Wilds - WebGL Fallback Backend
 * Safe low-cost renderer configuration for older devices or fallback environments.
 */
(function(root) {
  'use strict';

  class WebGLFallbackBackend {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.options = options;
      this.renderer = null;
      this.backendName = 'WEBGL_FALLBACK';
    }

    createRenderer(THREE) {
      if (!THREE || !this.canvas) {
        throw new Error('WebGLFallbackBackend requires THREE and canvas');
      }

      const params = Object.assign({
        canvas: this.canvas,
        antialias: false, // Low cost
        powerPreference: 'default',
        precision: 'mediump',
        alpha: false,
        stencil: false,
        depth: true,
        logarithmicDepthBuffer: false
      }, this.options);

      this.renderer = new THREE.WebGLRenderer(params);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.LinearToneMapping;
      this.renderer.shadowMap.enabled = false; // Disable shadows for safe mode

      return this.renderer;
    }

    dispose() {
      if (this.renderer) {
        try {
          this.renderer.dispose();
        } catch (_) {}
        this.renderer = null;
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebGLFallbackBackend;
  } else {
    root.WebGLFallbackBackend = WebGLFallbackBackend;
  }
})(typeof window !== 'undefined' ? window : global);
