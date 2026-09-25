/**
 * The Whispering Wilds - WebGL2 Backend
 * Configures modern Three.js WebGL2 renderer settings with full feature support.
 */
(function(root) {
  'use strict';

  class WebGL2Backend {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.options = options;
      this.renderer = null;
      this.backendName = 'WEBGL2';
    }

    createRenderer(THREE) {
      if (!THREE || !this.canvas) {
        throw new Error('WebGL2Backend requires THREE and canvas');
      }

      const params = Object.assign({
        canvas: this.canvas,
        antialias: this.options.antialias ?? true,
        powerPreference: 'high-performance',
        precision: this.options.precision || 'highp',
        alpha: false,
        stencil: true,
        depth: true,
        logarithmicDepthBuffer: false
      }, this.options);

      this.renderer = new THREE.WebGLRenderer(params);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
      this.renderer.shadowMap.enabled = this.options.shadows ?? true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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
    module.exports = WebGL2Backend;
  } else {
    root.WebGL2Backend = WebGL2Backend;
  }
})(typeof window !== 'undefined' ? window : global);
