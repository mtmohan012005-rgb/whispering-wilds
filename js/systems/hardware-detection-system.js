// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - HARDWARE DETECTION SYSTEM
// Safe hardware discovery, WebGL capability inspection, and profile recommendation
// ============================================================================

(function() {
  'use strict';

  class HardwareDetectionSystem {
    constructor() {
      this.detectedInfo = null;
      this.recommendation = null;
      this.benchmarkResults = null;
    }

    /**
     * Safely probes hardware & WebGL capabilities without crashing or fingerprinting.
     * @returns {Object} Comprehensive hardware capability data
     */
    detect() {
      if (this.detectedInfo) return this.detectedInfo;

      const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) ? navigator.hardwareConcurrency : 4;
      const mem = (typeof navigator !== 'undefined' && navigator.deviceMemory) ? navigator.deviceMemory : 4;

      const screenW = (typeof window !== 'undefined' && window.screen) ? window.screen.width : 1920;
      const screenH = (typeof window !== 'undefined' && window.screen) ? window.screen.height : 1080;
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1.0;

      const hasGamepad = typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function';
      const hasFullscreen = typeof document !== 'undefined' && !!(
        document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled
      );
      const hasPointerLock = typeof document !== 'undefined' && !!(
        'pointerLockElement' in document || 'mozPointerLockElement' in document
      );

      // Safe WebGL Probing
      let webglVersion = 0;
      let gpuVendor = 'Generic';
      let gpuRenderer = 'Generic WebGL';
      let maxTextureSize = 4096;
      let maxViewportDims = [4096, 4096];
      let maxAnisotropy = 1;
      let supportedExtensions = [];
      let maxRenderBufferSize = 4096;
      let maxVertexAttributes = 16;
      let maxTextureUnits = 8;

      if (typeof document !== 'undefined') {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;

          let gl = canvas.getContext('webgl2');
          if (gl) {
            webglVersion = 2;
          } else {
            gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) webglVersion = 1;
          }

          if (gl) {
            maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
            maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096;
            maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [maxTextureSize, maxTextureSize];
            maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 16;
            maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || 8;

            // Safe unmasked vendor & renderer
            const dbg = gl.getExtension('WEBGL_debug_renderer_info');
            if (dbg) {
              gpuVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || gpuVendor;
              gpuRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || gpuRenderer;
            } else {
              gpuVendor = gl.getParameter(gl.VENDOR) || gpuVendor;
              gpuRenderer = gl.getParameter(gl.RENDERER) || gpuRenderer;
            }

            // Anisotropy extension
            const aniso = gl.getExtension('EXT_texture_filter_anisotropic') ||
                          gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                          gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
            if (aniso) {
              maxAnisotropy = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
            }

            supportedExtensions = gl.getSupportedExtensions() || [];

            // Clean up test context
            const loseCtx = gl.getExtension('WEBGL_lose_context');
            if (loseCtx) loseCtx.loseContext();
          }
        } catch (e) {
          console.warn('[HardwareDetectionSystem] WebGL query failed, falling back to safe defaults:', e);
        }
      }

      this.detectedInfo = {
        cpuCores: cores,
        deviceMemoryGB: mem,
        screenResolution: { width: screenW, height: screenH },
        devicePixelRatio: dpr,
        webglVersion,
        gpuVendor,
        gpuRenderer,
        maxTextureSize,
        maxViewportDims,
        maxAnisotropy,
        maxRenderBufferSize,
        maxVertexAttributes,
        maxTextureUnits,
        supportedExtensions,
        gamepadSupported: hasGamepad,
        fullscreenSupported: hasFullscreen,
        pointerLockSupported: hasPointerLock,
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Win32'
      };

      // Classify profile using HardwareProfiles classifier
      if (window.HardwareProfiles && typeof window.HardwareProfiles.classifyHardware === 'function') {
        this.recommendation = window.HardwareProfiles.classifyHardware(this.detectedInfo);
      } else {
        this.recommendation = { tier: 'MEDIUM', score: 60, confidence: 'fallback' };
      }

      console.log(`[HardwareDetectionSystem] Detected: ${gpuRenderer} | Cores: ${cores} | RAM: ${mem}GB | Profile: ${this.recommendation.tier}`);
      return this.detectedInfo;
    }

    getRecommendation() {
      if (!this.recommendation) {
        this.detect();
      }
      return this.recommendation;
    }

    /**
     * Executes a lightweight 5-frame synthetic benchmark without crashing or allocating huge textures.
     * Measures CPU execution overhead and frame interval stability.
     */
    async runLightweightBenchmark() {
      return new Promise((resolve) => {
        if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
          resolve({ averageFrameMs: 16.6, score: 75, recommendedTier: this.recommendation?.tier || 'MEDIUM' });
          return;
        }

        const samples = [];
        let framesCounted = 0;
        let lastTime = performance.now();

        const step = () => {
          const now = performance.now();
          const delta = now - lastTime;
          lastTime = now;

          if (framesCounted > 0) {
            samples.push(delta);
          }
          framesCounted++;

          if (framesCounted < 6) {
            requestAnimationFrame(step);
          } else {
            const sum = samples.reduce((a, b) => a + b, 0);
            const avg = sum / samples.length;
            this.benchmarkResults = {
              averageFrameMs: parseFloat(avg.toFixed(2)),
              sampleCount: samples.length,
              measuredAt: Date.now()
            };
            resolve(this.benchmarkResults);
          }
        };

        requestAnimationFrame(step);
      });
    }
  }

  const instance = new HardwareDetectionSystem();

  if (typeof window !== 'undefined') {
    window.HardwareDetectionSystem = HardwareDetectionSystem;
    window.hardwareDetectionSystem = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HardwareDetectionSystem, hardwareDetectionSystem: instance };
  }
})();
