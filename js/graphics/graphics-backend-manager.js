/**
 * The Whispering Wilds - Graphics Backend Manager
 * The SOLE AUTHORITY for graphics backend selection, renderer capabilities,
 * feature availability flags, and GPU context recovery.
 * Coordinates with PerformanceManager (Capability vs Quality separation).
 */
(function(root) {
  'use strict';

  class GraphicsBackendManager {
    constructor(canvas, THREE) {
      if (root.GraphicsBackendManagerInstance) {
        return root.GraphicsBackendManagerInstance;
      }

      this.canvas = canvas || (typeof document !== 'undefined' ? (document.getElementById('threeCanvas') || document.getElementById('gameCanvas')) : null);
      this.THREE = THREE || root.THREE;

      // Sub-modules
      const CapabilityDetector = root.GraphicsCapabilityDetector || (typeof require !== 'undefined' && require('./graphics-capability-detector'));
      const WebGPUCap = root.WebGPUCapability || (typeof require !== 'undefined' && require('./webgpu-capability'));
      const ShaderCap = root.ShaderCapability || (typeof require !== 'undefined' && require('./shader-capability'));
      const TextureCap = root.TextureCapability || (typeof require !== 'undefined' && require('./texture-capability'));
      const AntialiasMgr = root.AntialiasingManager || (typeof require !== 'undefined' && require('./antialiasing-manager'));
      const RenderTargetMgr = root.RenderTargetManager || (typeof require !== 'undefined' && require('./render-target-manager'));
      const GPURecoveryMgr = root.GPURecoveryManager || (typeof require !== 'undefined' && require('./gpu-recovery-manager'));
      const DisplayScalingMgr = root.DisplayScalingManager || (typeof require !== 'undefined' && require('./display-scaling-manager'));
      const ColorMgmt = root.ColorManagement || (typeof require !== 'undefined' && require('./color-management'));

      this.detector = CapabilityDetector ? new CapabilityDetector() : null;
      this.webgpu = WebGPUCap ? new WebGPUCap() : null;
      this.rawCaps = this.detector ? this.detector.getCapabilities() : {};

      this.shaderCapability = ShaderCap ? new ShaderCap(this.rawCaps.shaderPrecision) : null;
      this.textureCapability = TextureCap ? new TextureCap(this.rawCaps.maxTextureSize) : null;
      this.antialiasingManager = AntialiasMgr ? new AntialiasMgr(this.rawCaps) : null;
      this.renderTargetManager = RenderTargetMgr ? new RenderTargetMgr(this.THREE) : null;
      this.displayScalingManager = DisplayScalingMgr ? new DisplayScalingMgr() : null;
      this.colorManagement = ColorMgmt ? new ColorMgmt() : null;

      // Status
      this.activeBackend = 'WEBGL2';
      this.capabilityTier = 'STANDARD'; // MINIMAL, BASIC, STANDARD, ADVANCED, EXTREME
      this.renderer = null;
      this.backendInstance = null;

      // Feature flags (What features CAN be used)
      this.featureFlags = {
        advancedWater: false,
        dynamicShadows: false,
        postProcessing: false,
        volumetricFog: false,
        highAnisotropy: false,
        highPrecisionShaders: false,
        msaa: false
      };

      this.evaluateCapabilities();
      this.initRecoveryManager(GPURecoveryMgr);

      root.GraphicsBackendManagerInstance = this;
    }

    initRecoveryManager(GPURecoveryMgrClass) {
      if (GPURecoveryMgrClass && this.canvas) {
        this.recoveryManager = new GPURecoveryMgrClass(this.canvas, () => {
          this.rebuildResourcesAfterContextRestore();
        });
      }
    }

    evaluateCapabilities() {
      // 1. Backend selection
      if (this.rawCaps.webgl2) {
        this.activeBackend = 'WEBGL2';
      } else if (this.rawCaps.webgl1) {
        this.activeBackend = 'WEBGL_FALLBACK';
      } else {
        this.activeBackend = 'UNAVAILABLE';
      }

      // 2. Capability tier
      const maxTex = this.rawCaps.maxTextureSize || 2048;
      const aniso = this.rawCaps.maxAnisotropy || 1;

      if (this.activeBackend === 'WEBGL2' && maxTex >= 16384 && aniso >= 16 && this.rawCaps.shaderPrecision === 'highp') {
        this.capabilityTier = 'EXTREME';
      } else if (this.activeBackend === 'WEBGL2' && maxTex >= 8192 && aniso >= 8) {
        this.capabilityTier = 'ADVANCED';
      } else if (this.activeBackend === 'WEBGL2' && maxTex >= 4096) {
        this.capabilityTier = 'STANDARD';
      } else if (this.activeBackend === 'WEBGL1' || maxTex >= 2048) {
        this.capabilityTier = 'BASIC';
      } else {
        this.capabilityTier = 'MINIMAL';
      }

      // 3. Feature Flags
      this.featureFlags.dynamicShadows = this.activeBackend === 'WEBGL2';
      this.featureFlags.advancedWater = (this.capabilityTier === 'ADVANCED' || this.capabilityTier === 'EXTREME') && this.rawCaps.depthTextureSupport;
      this.featureFlags.postProcessing = this.rawCaps.renderTargetSupport && (this.capabilityTier !== 'MINIMAL');
      this.featureFlags.volumetricFog = this.capabilityTier === 'EXTREME' && this.rawCaps.floatTextureSupport;
      this.featureFlags.highAnisotropy = aniso >= 8;
      this.featureFlags.highPrecisionShaders = this.rawCaps.shaderPrecision === 'highp';
      this.featureFlags.msaa = !!this.rawCaps.msaaSupported;
    }

    createActiveRenderer() {
      if (!this.THREE || !this.canvas) return null;

      const WebGL2Class = root.WebGL2Backend || (typeof require !== 'undefined' && require('./webgl2-backend'));
      const WebGLFallbackClass = root.WebGLFallbackBackend || (typeof require !== 'undefined' && require('./webgl-fallback-backend'));

      if (this.activeBackend === 'WEBGL2' && WebGL2Class) {
        this.backendInstance = new WebGL2Class(this.canvas, {
          antialias: this.featureFlags.msaa,
          shadows: this.featureFlags.dynamicShadows,
          precision: this.rawCaps.shaderPrecision
        });
        this.renderer = this.backendInstance.createRenderer(this.THREE);
      } else if (WebGLFallbackClass) {
        this.backendInstance = new WebGLFallbackClass(this.canvas);
        this.renderer = this.backendInstance.createRenderer(this.THREE);
      }

      if (this.colorManagement && this.renderer) {
        this.colorManagement.applyColorPipeline(this.THREE, this.renderer);
      }

      return this.renderer;
    }

    rebuildResourcesAfterContextRestore() {
      console.log('[GraphicsBackendManager] Rebuilding GPU render targets & textures after context restore...');
      if (this.renderTargetManager) {
        this.renderTargetManager.disposeAll();
      }
      if (this.shaderCapability) {
        this.shaderCapability.clearFailures();
      }
    }

    disableFeature(featureName) {
      if (featureName in this.featureFlags) {
        this.featureFlags[featureName] = false;
        console.warn(`[GraphicsBackendManager] Feature safely degraded: ${featureName} disabled.`);
      }
    }

    getFeatureFlags() {
      return Object.assign({}, this.featureFlags);
    }

    getStatus() {
      return {
        backend: this.activeBackend,
        tier: this.capabilityTier,
        features: this.featureFlags,
        webgpuStatus: this.webgpu ? this.webgpu.getStatus() : 'UNAVAILABLE',
        rendererActive: !!this.renderer
      };
    }

    // --- DEVELOPER DEBUG API (Safe, non-crash) ---
    report() {
      return {
        backend: this.activeBackend,
        tier: this.capabilityTier,
        rawCapabilities: this.rawCaps,
        featureFlags: this.featureFlags,
        renderTargets: this.renderTargetManager ? this.renderTargetManager.getStats() : null
      };
    }

    simulateContextLoss() {
      return this.recoveryManager ? this.recoveryManager.simulateContextLoss() : false;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsBackendManager;
  } else {
    root.GraphicsBackendManager = GraphicsBackendManager;
  }
})(typeof window !== 'undefined' ? window : global);
