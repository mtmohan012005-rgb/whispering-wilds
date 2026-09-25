/**
 * The Whispering Wilds - Graphics Capability Detector
 * Comprehensive WebGL parameter and hardware extension interrogation.
 * Reads only capabilities that exist without throwing uncaught exceptions.
 */
(function(root) {
  'use strict';

  class GraphicsCapabilityDetector {
    constructor() {
      this.capabilities = {
        webgl2: false,
        webgl1: false,
        webgpuAvailable: false,
        maxTextureSize: 2048,
        maxCubeMapTextureSize: 2048,
        maxRenderBufferSize: 2048,
        maxVertexTextures: 4,
        maxTextureUnits: 8,
        maxVertexUniforms: 128,
        maxFragmentUniforms: 64,
        maxAnisotropy: 1,
        msaaSupported: false,
        maxMsaaSamples: 1,
        shaderPrecision: 'mediump',
        floatTextureSupport: false,
        depthTextureSupport: false,
        renderTargetSupport: true,
        colorBufferFloatSupport: false,
        instancingSupport: false,
        vaoSupport: false,
        vendor: 'UNKNOWN',
        renderer: 'UNKNOWN'
      };

      this.detect();
    }

    detect() {
      if (typeof document === 'undefined') return;

      let canvas = null;
      let gl = null;

      try {
        canvas = document.createElement('canvas');

        // Check WebGL 2 first
        gl = canvas.getContext('webgl2');
        if (gl) {
          this.capabilities.webgl2 = true;
          this.capabilities.webgl1 = true;
          this.capabilities.instancingSupport = true;
          this.capabilities.vaoSupport = true;
          this.capabilities.depthTextureSupport = true;
          this.capabilities.floatTextureSupport = true;

          // MSAA in WebGL2
          const maxSamples = gl.getParameter(gl.MAX_SAMPLES);
          if (maxSamples && maxSamples > 1) {
            this.capabilities.msaaSupported = true;
            this.capabilities.maxMsaaSamples = maxSamples;
          }

          // EXT_color_buffer_float
          this.capabilities.colorBufferFloatSupport = !!gl.getExtension('EXT_color_buffer_float');
        } else {
          // Fallback to WebGL 1
          gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            this.capabilities.webgl1 = true;
            this.capabilities.instancingSupport = !!gl.getExtension('ANGLE_instanced_arrays');
            this.capabilities.vaoSupport = !!gl.getExtension('OES_vertex_array_object');
            this.capabilities.depthTextureSupport = !!gl.getExtension('WEBGL_depth_texture');
            this.capabilities.floatTextureSupport = !!gl.getExtension('OES_texture_float');
          }
        }

        if (!gl) return;

        // Texture & Buffer Limits
        this.capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
        this.capabilities.maxCubeMapTextureSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 2048;
        this.capabilities.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 2048;
        this.capabilities.maxVertexTextures = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || 4;
        this.capabilities.maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 8;
        this.capabilities.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 128;
        this.capabilities.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 64;

        // Shader precision
        const vertHigh = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
        const fragHigh = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        if (vertHigh && fragHigh && vertHigh.precision > 0 && fragHigh.precision > 0) {
          this.capabilities.shaderPrecision = 'highp';
        } else {
          this.capabilities.shaderPrecision = 'mediump';
        }

        // Anisotropy
        const extAniso = gl.getExtension('EXT_texture_filter_anisotropic') ||
                         gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
                         gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
        if (extAniso) {
          this.capabilities.maxAnisotropy = gl.getParameter(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1;
        }

        // Vendor & Renderer
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          this.capabilities.vendor = (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'UNKNOWN').trim();
          this.capabilities.renderer = (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'UNKNOWN').trim();
        }

      } catch (err) {
        console.warn('[GraphicsCapabilityDetector] Exception during capability query:', err);
      } finally {
        if (gl) {
          const loseContext = gl.getExtension('WEBGL_lose_context');
          if (loseContext) loseContext.loseContext();
        }
        canvas = null;
        gl = null;
      }

      // Check optional WebGPU asynchronously without blocking
      if (typeof navigator !== 'undefined' && navigator.gpu) {
        this.capabilities.webgpuAvailable = true;
      }
    }

    getCapabilities() {
      return Object.assign({}, this.capabilities);
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsCapabilityDetector;
  } else {
    root.GraphicsCapabilityDetector = GraphicsCapabilityDetector;
  }
})(typeof window !== 'undefined' ? window : global);
