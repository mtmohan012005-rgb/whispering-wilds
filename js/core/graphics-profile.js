// ============================================================================
// THE WHISPERING WILDS — GRAPHICS PROFILE MANAGER
// AUTO / VERY_LOW / LOW / MEDIUM / HIGH / ULTRA quality presets
// Dynamic resolution scaling with hysteresis
// ============================================================================

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // QUALITY PRESET DEFINITIONS
  // --------------------------------------------------------------------------
  const QUALITY_PRESETS = {
    VERY_LOW: {
      renderPixelRatio:      0.65,
      shadowMapSize:         256,
      shadowsEnabled:        false,
      maxShadowDistance:     30,
      antialiasEnabled:      false,
      maxLights:             1,
      particleDensity:       0.2,
      vegetationDensity:     0.2,
      lodBias:               2.5,
      npcSimRadius:          30,
      wildlifeSimRadius:     20,
      postProcessing:        false,
      maxTextureMB:          64,
      fogEnabled:            true,
      waterReflections:      false,
      ssaoEnabled:           false,
      bloomEnabled:          false,
    },
    LOW: {
      renderPixelRatio:      0.75,
      shadowMapSize:         512,
      shadowsEnabled:        true,
      maxShadowDistance:     50,
      antialiasEnabled:      false,
      maxLights:             2,
      particleDensity:       0.35,
      vegetationDensity:     0.35,
      lodBias:               2.0,
      npcSimRadius:          50,
      wildlifeSimRadius:     35,
      postProcessing:        false,
      maxTextureMB:          128,
      fogEnabled:            true,
      waterReflections:      false,
      ssaoEnabled:           false,
      bloomEnabled:          false,
    },
    MEDIUM: {
      renderPixelRatio:      1.0,
      shadowMapSize:         1024,
      shadowsEnabled:        true,
      maxShadowDistance:     80,
      antialiasEnabled:      true,
      maxLights:             4,
      particleDensity:       0.6,
      vegetationDensity:     0.6,
      lodBias:               1.5,
      npcSimRadius:          80,
      wildlifeSimRadius:     60,
      postProcessing:        true,
      maxTextureMB:          256,
      fogEnabled:            true,
      waterReflections:      false,
      ssaoEnabled:           false,
      bloomEnabled:          true,
    },
    HIGH: {
      renderPixelRatio:      1.25,
      shadowMapSize:         2048,
      shadowsEnabled:        true,
      maxShadowDistance:     120,
      antialiasEnabled:      true,
      maxLights:             6,
      particleDensity:       0.85,
      vegetationDensity:     0.85,
      lodBias:               1.0,
      npcSimRadius:          120,
      wildlifeSimRadius:     90,
      postProcessing:        true,
      maxTextureMB:          512,
      fogEnabled:            true,
      waterReflections:      true,
      ssaoEnabled:           false,
      bloomEnabled:          true,
    },
    ULTRA: {
      renderPixelRatio:      1.5,
      shadowMapSize:         4096,
      shadowsEnabled:        true,
      maxShadowDistance:     200,
      antialiasEnabled:      true,
      maxLights:             8,
      particleDensity:       1.0,
      vegetationDensity:     1.0,
      lodBias:               0.75,
      npcSimRadius:          200,
      wildlifeSimRadius:     150,
      postProcessing:        true,
      maxTextureMB:          1024,
      fogEnabled:            true,
      waterReflections:      true,
      ssaoEnabled:           true,
      bloomEnabled:          true,
    },
  };

  // --------------------------------------------------------------------------
  // GRAPHICS PROFILE MANAGER
  // --------------------------------------------------------------------------
  class GraphicsProfileManager {
    constructor() {
      this.currentQuality   = 'MEDIUM';
      this.profile          = { ...QUALITY_PRESETS.MEDIUM };
      this.isAuto           = true;

      // Dynamic resolution state
      this._dynResScale     = 1.0;    // multiplier on profile.renderPixelRatio
      this._degradeStep     = 0;      // 0 = full preset features, >0 = cheaper (shadows off)
      this._frameTimeHistory = [];
      this._dynResUpTimer   = 0;
      this._dynResDownTimer = 0;
      this._targetFPS       = 60;
      this._targetFrameMs   = 1000 / 60;

      // Hysteresis: how many consecutive bad/good frames before scaling
      this._badFrameCount   = 0;
      this._goodFrameCount  = 0;
      this.BAD_THRESHOLD    = 5;
      this.GOOD_THRESHOLD   = 90;
    }

    // ------------------------------------------------------------------
    // Auto-select quality from GPUCapability tier
    // ------------------------------------------------------------------
    autoSelect() {
      if (!window.GPUCapability || !window.GPUCapability.detected) {
        window.GPUCapability?.detect();
      }
      const tier = window.GPUCapability?.tier || 'MEDIUM';
      // VERY_LOW was defined as a preset but had no mapping here, so it could
      // never be selected automatically - the 0.65-DPR / shadows-off profile
      // was dead code.
      const map = { ULTRA: 'ULTRA', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW', VERY_LOW: 'VERY_LOW' };
      this.setQuality(map[tier] || 'MEDIUM', true);
      console.log(`[GraphicsProfile] AUTO selected: ${this.currentQuality} (GPU tier: ${tier})`);
    }

    // ------------------------------------------------------------------
    // Manually set quality
    // ------------------------------------------------------------------
    setQuality(name, isAuto = false) {
      if (!QUALITY_PRESETS[name]) {
        console.warn(`[GraphicsProfile] Unknown quality "${name}", defaulting to MEDIUM`);
        name = 'MEDIUM';
      }
      this.currentQuality = name;
      this.isAuto = isAuto;

      // Clamp pixel ratio to GPU-recommended maximum
      const preset = { ...QUALITY_PRESETS[name] };
      const gpuDPR = window.GPUCapability?.getRecommendedPixelRatio() || 1.0;
      preset.renderPixelRatio = Math.min(preset.renderPixelRatio, gpuDPR);

      this.profile = preset;
      this._dynResScale = 1.0;
      this._applyToRenderer();
    }

    getPresets() {
      return Object.keys(QUALITY_PRESETS);
    }

    // ------------------------------------------------------------------
    // DYNAMIC RESOLUTION — call every frame with measured frame time (ms)
    // ------------------------------------------------------------------
    updateDynamicResolution(frameTimeMs, renderer) {
      if (!this.isAuto || !renderer) return;

      const targetMs = this._targetFrameMs;
      const slack    = targetMs * 0.15; // 15% tolerance

      if (frameTimeMs > targetMs + slack) {
        this._badFrameCount++;
        this._goodFrameCount = 0;
        if (this._badFrameCount >= this.BAD_THRESHOLD) {
          this._scaleDown(renderer);
          this._badFrameCount = 0;
        }
      } else if (frameTimeMs < targetMs - slack) {
        this._goodFrameCount++;
        this._badFrameCount = 0;
        if (this._goodFrameCount >= this.GOOD_THRESHOLD) {
          this._scaleUp(renderer);
          this._goodFrameCount = 0;
        }
      } else {
        this._badFrameCount  = Math.max(0, this._badFrameCount - 1);
        this._goodFrameCount = Math.max(0, this._goodFrameCount - 1);
      }
    }

    _scaleDown(renderer) {
      const MIN_SCALE = 0.5;
      if (this._dynResScale > MIN_SCALE) {
        this._dynResScale = Math.max(MIN_SCALE, this._dynResScale - 0.1);
        this._applyPixelRatio(renderer);
        console.log(`[GraphicsProfile] DynRes ↓ scale=${this._dynResScale.toFixed(2)}`);
        return;
      }
      // Resolution is already at the floor and frames are still slow.
      // Shadow rendering is a fixed per-frame cost that does NOT scale with
      // the main resolution, so on a weak integrated GPU the only remaining
      // meaningful lever is to switch shadows off.
      if (this._degradeStep < 2) {
        this._degradeStep++;
        this._applyToRenderer();
        console.log(`[GraphicsProfile] feature degrade step=${this._degradeStep} (shadows forced off)`);
      }
    }

    _scaleUp(renderer) {
      // Only restore features once resolution is back at full scale and
      // frames have been comfortably good for a while.
      if (this._degradeStep > 0) {
        this._degradeStep--;
        this._applyToRenderer();
        console.log(`[GraphicsProfile] feature restore step=${this._degradeStep}`);
        return;
      }
      if (this._dynResScale >= 1.0) return;
      this._dynResScale = Math.min(1.0, this._dynResScale + 0.05);
      this._applyPixelRatio(renderer);
      console.log(`[GraphicsProfile] DynRes ↑ scale=${this._dynResScale.toFixed(2)}`);
    }

    _applyPixelRatio(renderer) {
      if (!renderer) return;
      const effectiveDPR = this.profile.renderPixelRatio * this._dynResScale;
      renderer.setPixelRatio(Math.max(0.5, effectiveDPR));
    }

    _applyToRenderer() {
      const tw = window.threeWorld;
      if (!tw || !tw.renderer) return;
      const r = tw.renderer;
      // Shadow map. Degrade step forces shadows off regardless of preset,
      // because that is the only lever left once resolution has bottomed out.
      const wantShadows = this.profile.shadowsEnabled && this._degradeStep === 0;
      r.shadowMap.enabled  = wantShadows;
      if (wantShadows && this.profile.shadowMapSize) {
        if (tw.lighting && tw.lighting.sun) {
          tw.lighting.sun.shadow.mapSize.set(this.profile.shadowMapSize, this.profile.shadowMapSize);
        }
      }
      this._applyPixelRatio(r);
    }

    setTargetFPS(fps) {
      this._targetFPS    = fps;
      this._targetFrameMs = 1000 / fps;
    }

    getEffectiveDPR() {
      return this.profile.renderPixelRatio * this._dynResScale;
    }

    getSummary() {
      return {
        quality:     this.currentQuality,
        isAuto:      this.isAuto,
        profile:     this.profile,
        dynResScale: this._dynResScale,
        effectiveDPR: this.getEffectiveDPR(),
      };
    }
  }

  const instance = new GraphicsProfileManager();
  window.GraphicsProfileManager = instance;

  // Expose preset table for other systems
  window.QUALITY_PRESETS = QUALITY_PRESETS;

})();
