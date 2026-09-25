/**
 * The Whispering Wilds - GPU Adapter
 * Detects GPU capabilities safely using WebGL limits rather than relying solely on strings.
 * Classifies GPU capability tiers without crashing or fabricating specs.
 */
(function(root) {
  'use strict';

  class GPUAdapter {
    constructor() {
      this.capabilities = {
        webgl2: false,
        webgl1: false,
        vendor: 'UNKNOWN',
        renderer: 'UNKNOWN',
        gpuClass: 'UNKNOWN',
        maxTextureSize: 2048,
        maxCubeMapSize: 2048,
        maxRenderBufferSize: 2048,
        maxVertexTextures: 4,
        maxTextureUnits: 8,
        floatTextureSupported: false,
        depthTextureSupported: false,
        instancingSupported: false,
        anisotropyMax: 1,
        precision: 'mediump'
      };
      this.detect();
    }

    detect() {
      if (typeof document === 'undefined') return;

      let canvas = null;
      let gl = null;

      try {
        canvas = document.createElement('canvas');
        // Try WebGL 2 first
        gl = canvas.getContext('webgl2');
        if (gl) {
          this.capabilities.webgl2 = true;
          this.capabilities.webgl1 = true;
        } else {
          // Fallback to WebGL 1
          gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            this.capabilities.webgl1 = true;
          }
        }

        if (!gl) return;

        // Query limits
        this.capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
        this.capabilities.maxCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 2048;
        this.capabilities.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 2048;
        this.capabilities.maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || 4;
        this.capabilities.maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 8;

        // Shader precision
        const vertHigh = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
        const fragHigh = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        if (vertHigh && fragHigh && vertHigh.precision > 0 && fragHigh.precision > 0) {
          this.capabilities.precision = 'highp';
        } else {
          this.capabilities.precision = 'mediump';
        }

        // Anisotropy
        const extAniso = gl.getExtension('EXT_texture_filter_anisotropic') ||
                         gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                         gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
        if (extAniso) {
          this.capabilities.anisotropyMax = gl.getParameter(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
        }

        // Float & Depth textures
        if (this.capabilities.webgl2) {
          this.capabilities.floatTextureSupported = true;
          this.capabilities.depthTextureSupported = true;
          this.capabilities.instancingSupported = true;
        } else {
          this.capabilities.floatTextureSupported = !!gl.getExtension('OES_texture_float');
          this.capabilities.depthTextureSupported = !!gl.getExtension('WEBGL_depth_texture');
          this.capabilities.instancingSupported = !!gl.getExtension('ANGLE_instanced_arrays');
        }

        // Hardware strings (sanitized, safe)
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          this.capabilities.vendor = (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'UNKNOWN').trim();
          this.capabilities.renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'UNKNOWN').trim();
        } else {
          this.capabilities.vendor = (gl.getParameter(gl.VENDOR) || 'UNKNOWN').trim();
          this.capabilities.renderer = (gl.getParameter(gl.RENDERER) || 'UNKNOWN').trim();
        }

        // Infer GPU Class from capability & renderer safely
        this.capabilities.gpuClass = this.inferGPUClass(this.capabilities);

      } catch (err) {
        console.warn('[GPUAdapter] Safe detection exception handled:', err);
      } finally {
        if (gl && typeof gl.getExtension === 'function') {
          const loseContext = gl.getExtension('WEBGL_lose_context');
          if (loseContext) loseContext.loseContext();
        }
        canvas = null;
        gl = null;
      }
    }

    inferGPUClass(caps) {
      const rend = (caps.renderer || '').toLowerCase();
      const maxTex = caps.maxTextureSize || 2048;

      // Apple Silicon
      if (rend.includes('apple') || rend.includes('m1') || rend.includes('m2') || rend.includes('m3') || rend.includes('m4')) {
        return 'APPLE_SILICON';
      }

      // Explicit dedicated GPU checks
      const isNvidia = rend.includes('nvidia') || rend.includes('geforce') || rend.includes('rtx') || rend.includes('gtx');
      const isAmdDedicated = (rend.includes('radeon') || rend.includes('amd')) && !rend.includes('integrated') && !rend.includes('vega') && !rend.includes('graphics');

      if (isNvidia || isAmdDedicated) {
        if (maxTex >= 16384 && caps.anisotropyMax >= 16) {
          return 'HIGH_DEDICATED';
        } else if (maxTex >= 8192) {
          return 'MID_DEDICATED';
        } else {
          return 'ENTRY_DEDICATED';
        }
      }

      // Explicit Intel/AMD integrated graphics
      if (rend.includes('intel') || rend.includes('uhd') || rend.includes('iris') || rend.includes('hd graphics') || rend.includes('vega')) {
        return 'INTEGRATED';
      }

      // Capability-based classification when vendor string is generic (e.g. SwiftShader, ANGLE, UNKNOWN)
      if (maxTex >= 16384 && caps.anisotropyMax >= 16 && caps.precision === 'highp') {
        return 'MID_DEDICATED';
      } else if (maxTex >= 8192) {
        return 'ENTRY_DEDICATED';
      } else if (maxTex >= 4096) {
        return 'INTEGRATED';
      }

      return 'UNKNOWN';
    }

    getCapabilities() {
      return Object.assign({}, this.capabilities);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GPUAdapter;
  } else {
    root.GPUAdapter = GPUAdapter;
  }
})(typeof window !== 'undefined' ? window : global);
