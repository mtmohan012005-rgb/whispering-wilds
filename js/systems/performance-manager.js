// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUTHORITATIVE PERFORMANCE MANAGER
// Single Authority coordinating hardware capability, adaptive quality, frame budgets,
// memory, WebGL recovery, spawn budgets, and developer diagnostics.
// ============================================================================

(function() {
  'use strict';

  class PerformanceManager {
    constructor(graphicsSettings = null, threeWorld = null) {
      this.graphicsSettings = graphicsSettings || window.graphicsSettings;
      this.threeWorld = threeWorld || window.threeWorld;

      // Active Profile State
      this.currentTier = 'MEDIUM';
      this.activeProfile = window.PERFORMANCE_PROFILES ? window.PERFORMANCE_PROFILES.MEDIUM : null;

      // Spawn Population Counters
      this.spawnCounts = {
        npc: 0,
        wildlife: 0,
        traffic: 0,
        particle: 0,
        light: 0,
        audio: 0,
        physics: 0
      };

      // Connect Subsystems
      this.hwDetection = window.hardwareDetectionSystem || (window.HardwareDetectionSystem ? new window.HardwareDetectionSystem() : null);
      this.budgetSystem = window.frameBudgetSystem || (window.FrameBudgetSystem ? new window.FrameBudgetSystem(60) : null);
      this.adaptiveSystem = window.adaptiveQualitySystem || (window.AdaptiveQualitySystem ? new window.AdaptiveQualitySystem() : null);
      this.memory = window.memoryManager || (window.MemoryManager ? new window.MemoryManager() : null);
      this.gpu = window.gpuResourceManager || (window.GPUResourceManager ? new window.GPUResourceManager() : null);
      this.thermal = window.thermalSafetySystem || (window.ThermalSafetySystem ? new window.ThermalSafetySystem() : null);
      this.device = window.deviceCompatibilitySystem || (window.DeviceCompatibilitySystem ? new window.DeviceCompatibilitySystem() : null);
      this.recovery = window.performanceRecoverySystem || (window.PerformanceRecoverySystem ? new window.PerformanceRecoverySystem() : null);
      this.renderQuality = window.renderQualitySystem || (window.RenderQualitySystem ? new window.RenderQualitySystem() : null);
      this.assetQuality = window.assetQualityManager || (window.AssetQualityManager ? new window.AssetQualityManager() : null);

      // Legacy compatibility properties
      this.targetFPS = 60;
      this.frameBudgetMs = 16.67;
      this.fps = 60;
      this.smoothedFPS = 60;
      this.frameTime = 16.67;
      this.renderTime = 8.0;
      this.drawCalls = 0;
      this.triangles = 0;
      this.loadedRegionsCount = 1;

      // Initialize
      this._init();
    }

    _init() {
      // 1. Detect hardware safely
      if (this.hwDetection) {
        const rec = this.hwDetection.getRecommendation();
        if (rec && rec.tier) {
          this.currentTier = rec.tier;
        }
      }

      // 2. Select initial profile
      if (window.PERFORMANCE_PROFILES && window.PERFORMANCE_PROFILES[this.currentTier]) {
        this.activeProfile = window.PERFORMANCE_PROFILES[this.currentTier];
      }

      // 3. Register global developer performance API (Section 105)
      this._registerDeveloperApi();

      console.log(`[PerformanceManager] 🚀 Authority initialized with profile: ${this.currentTier}`);
    }

    applyProfile(tierKey) {
      if (!window.PERFORMANCE_PROFILES || !window.PERFORMANCE_PROFILES[tierKey]) {
        console.warn(`[PerformanceManager] Unknown profile: ${tierKey}, falling back to MEDIUM`);
        tierKey = 'MEDIUM';
      }

      this.currentTier = tierKey;
      this.activeProfile = window.PERFORMANCE_PROFILES[tierKey];

      // Update frame budget target
      if (this.budgetSystem && this.activeProfile.targetFPS) {
        this.budgetSystem.setTargetFPS(this.activeProfile.targetFPS);
        this.targetFPS = this.activeProfile.targetFPS;
        this.frameBudgetMs = this.budgetSystem.frameBudgetMs;
      }

      // Update device DPR cap
      if (this.device && this.activeProfile.dprCap) {
        this.device.setDprCap(this.activeProfile.dprCap);
      }

      // Apply to Three.js renderer
      if (this.renderQuality && this.threeWorld?.renderer) {
        this.renderQuality.applyProfileToRenderer(
          this.activeProfile,
          this.threeWorld.renderer,
          this.threeWorld.scene,
          this.threeWorld.camera
        );
      }

      // Synchronize with GraphicsSettings if present
      if (this.graphicsSettings && typeof this.graphicsSettings.applyPreset === 'function') {
        this.graphicsSettings.applyPreset(tierKey.toLowerCase());
      }

      console.log(`[PerformanceManager] Applied profile: ${tierKey}`);
    }

    // -------------------------------------------------------------------------
    // BUDGET ENFORCEMENT & POPULATION GATEKEEPING (Sections 106, 107, 108, 109, 110)
    // -------------------------------------------------------------------------
    canSpawn(category) {
      if (!this.activeProfile) return true;

      const profile = this.activeProfile;
      switch (category) {
        case 'npc':
          return this.spawnCounts.npc < (profile.npcSimulationRadius ? Math.floor(profile.npcSimulationRadius * 0.4) : 25);
        case 'wildlife':
          return this.spawnCounts.wildlife < (profile.wildlifeSimulationRadius ? Math.floor(profile.wildlifeSimulationRadius * 0.35) : 30);
        case 'traffic':
          return this.spawnCounts.traffic < (profile.trafficBudget || 10);
        case 'particle':
          return this.spawnCounts.particle < (profile.maxParticles || 1000);
        case 'light':
          return this.spawnCounts.light < (profile.maxDynamicLights || 4);
        case 'audio':
          return this.spawnCounts.audio < (profile.maxActiveAudioVoices || 24);
        case 'physics':
          return this.spawnCounts.physics < (profile.maxActivePhysicsProps || 50);
        default:
          return true;
      }
    }

    incrementSpawn(category, amount = 1) {
      if (this.spawnCounts[category] !== undefined) {
        this.spawnCounts[category] += amount;
      }
    }

    decrementSpawn(category, amount = 1) {
      if (this.spawnCounts[category] !== undefined) {
        this.spawnCounts[category] = Math.max(0, this.spawnCounts[category] - amount);
      }
    }

    // -------------------------------------------------------------------------
    // FRAME TIMING & TELEMETRY HOOKS
    // -------------------------------------------------------------------------
    beginFrame() {
      if (this.budgetSystem) {
        this.budgetSystem.beginGpuRender();
      }
    }

    endFrame(renderer, scene) {
      if (this.budgetSystem) {
        this.budgetSystem.endGpuRender();
        this.budgetSystem.recordFrame();

        const snap = this.budgetSystem.getSnapshot();
        this.fps = snap.averageFPS;
        this.smoothedFPS = snap.averageFPS;
        this.frameTime = snap.currentFrameTimeMs;
        this.renderTime = snap.averageGpuTimeMs;

        // Run adaptive quality tick
        if (this.adaptiveSystem) {
          this.adaptiveSystem.update(snap, snap.currentFrameTimeMs / 1000.0);
        }

        // Check thermal inference
        if (this.thermal) {
          this.thermal.evaluate(snap.averageFrameTimeMs, snap.currentFrameTimeMs / 1000.0);
        }
      }

      // Capture Three.js render metrics if available
      if (renderer && renderer.info && renderer.info.render) {
        this.drawCalls = renderer.info.render.calls;
        this.triangles = renderer.info.render.triangles;
      }

      // Check memory pressure periodically
      if (this.memory) {
        this.memory.handleMemoryPressure(false);
      }
    }

    recordFrame(deltaMs) {
      if (this.budgetSystem) {
        this.budgetSystem.recordFrame(deltaMs);
        const snap = this.budgetSystem.getSnapshot();
        this.fps = snap.averageFPS;
        this.smoothedFPS = snap.averageFPS;
        this.frameTime = snap.currentFrameTimeMs;
      } else {
        this.frameTime = deltaMs;
        this.fps = deltaMs > 0 ? (1000.0 / deltaMs) : 60;
        this.smoothedFPS = this.fps;
      }
    }

    getMetrics() {
      if (this.budgetSystem) {
        const snap = this.budgetSystem.getSnapshot();
        return {
          fps: Math.round(snap.averageFPS),
          instantFPS: Math.round(this.fps),
          frameTimeMs: snap.currentFrameTimeMs,
          drawCalls: this.drawCalls,
          triangles: this.triangles,
          onePercentLowFPS: Math.round(snap.onePercentLowFPS),
          diagnostics: snap.diagnostics,
          currentTier: this.currentTier
        };
      }

      return {
        fps: Math.round(this.smoothedFPS),
        instantFPS: Math.round(this.fps),
        frameTimeMs: parseFloat(this.frameTime.toFixed(2)),
        drawCalls: this.drawCalls,
        triangles: this.triangles
      };
    }

    setTargetFPS(fps) {
      if (this.budgetSystem) {
        this.budgetSystem.setTargetFPS(fps);
      }
      this.targetFPS = fps;
      this.frameBudgetMs = 1000.0 / fps;
    }

    getFrameBudgetMs(fps = this.targetFPS) {
      return 1000.0 / fps;
    }

    stepDownQuality() {
      if (this.adaptiveSystem) {
        return this.adaptiveSystem.stepDown();
      }
    }

    stepUpQuality() {
      if (this.adaptiveSystem) {
        return this.adaptiveSystem.stepUp();
      }
    }

    toggleTelemetry(force) {
      if (window.performanceDiagnosticsUI) {
        window.performanceDiagnosticsUI.toggle(force);
      }
    }

    // -------------------------------------------------------------------------
    // DEVELOPER API (Section 105 & 158)
    // -------------------------------------------------------------------------
    _registerDeveloperApi() {
      if (typeof window === 'undefined') return;

      window.performanceAPI = {
        report: () => this.generateDeveloperReport(),
        forceLow: () => this.applyProfile('LOW'),
        forceMedium: () => this.applyProfile('MEDIUM'),
        forceHigh: () => this.applyProfile('HIGH'),
        forceUltra: () => this.applyProfile('ULTRA'),
        forceSafeMode: () => this.recovery?.activateSafeMode('Developer override'),
        simulateMemoryPressure: () => this.memory?.handleMemoryPressure(true),
        simulateContextLoss: () => this.gpu?.simulateContextLoss(),
        simulateContextRestore: () => this.gpu?.simulateContextRestore(),
        showBudgets: () => console.table(this.activeProfile),
        showStreamingQueue: () => console.log('Active spawn counts:', this.spawnCounts)
      };

      // Alias window.perf for quick developer console access
      window.perf = window.performanceAPI;
    }

    generateDeveloperReport() {
      const snap = this.budgetSystem ? this.budgetSystem.getSnapshot() : {};
      const mem = this.memory ? this.memory.getMemorySnapshot() : {};
      const hw = this.hwDetection ? this.hwDetection.detectedInfo : {};

      const rep = {
        hardware: {
          renderer: hw?.gpuRenderer || 'N/A',
          vendor: hw?.gpuVendor || 'N/A',
          cores: hw?.cpuCores || 4,
          ramGB: hw?.deviceMemoryGB || 4,
          webgl: hw?.webglVersion || 2
        },
        performance: {
          currentProfile: this.currentTier,
          targetFPS: this.targetFPS,
          averageFPS: snap.averageFPS || this.smoothedFPS,
          onePercentLow: snap.onePercentLowFPS || 0,
          frameTimeMs: snap.currentFrameTimeMs || 0,
          drawCalls: this.drawCalls,
          triangles: this.triangles,
          bottleneck: snap.diagnostics || 'Balanced'
        },
        memory: {
          pressureLevel: mem.pressureLevel || 'NORMAL',
          jsHeapUsedMB: mem.jsHeapUsedMB || 0,
          geometries: mem.counters?.geometries || 0,
          textures: mem.counters?.textures || 0
        },
        spawns: { ...this.spawnCounts }
      };

      console.log('=== THE WHISPERING WILDS PERFORMANCE REPORT ===');
      console.table(rep.performance);
      return rep;
    }
  }

  // Export Singleton Authority and Class
  const defaultInstance = new PerformanceManager();

  if (typeof window !== 'undefined') {
    window.PerformanceManager = PerformanceManager;
    window.performanceManager = defaultInstance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceManager, performanceManager: defaultInstance };
  }
})();
