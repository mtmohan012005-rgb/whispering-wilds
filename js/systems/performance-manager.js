/**
 * The Whispering Wilds (Kaattu Vazhi) - Performance Manager
 * Real-time frame budget monitoring, rolling-average FPS calculation,
 * draw call / triangle telemetry, adaptive quality with hysteresis,
 * and F9 developer performance overlay.
 */

class PerformanceManager {
  constructor(graphicsSettings, threeWorld) {
    this.graphicsSettings = graphicsSettings || window.graphicsSettings;
    this.threeWorld = threeWorld || window.threeWorld;

    // Target metrics
    this.targetFPS = 60;
    this.frameBudgetMs = 16.67;

    // Live metrics
    this.fps = 60;
    this.smoothedFPS = 60;
    this.frameTime = 16.67;
    this.renderTime = 8.0;
    this.drawCalls = 0;
    this.triangles = 0;
    this.activeLights = 0;
    this.activeParticles = 0;
    this.loadedRegionsCount = 1;

    // Rolling window buffer (60 frames)
    this.historySize = 60;
    this.frameTimeHistory = new Float32Array(this.historySize);
    this.historyIndex = 0;
    this.historyCount = 0;

    // Adaptive quality state machine (with hysteresis)
    this.adaptiveQualityEnabled = true;
    this.lowFpsDuration = 0; // seconds below threshold
    this.highFpsDuration = 0; // seconds above threshold
    this.currentQualityTier = 3; // 0: VERY_LOW, 1: LOW, 2: MEDIUM, 3: HIGH, 4: ULTRA
    this.qualityCooldown = 0; // cooldown after a tier shift

    // Timing timestamps
    this.lastFrameTime = performance.now();
    this.renderStartTime = 0;

    // F9 Developer Telemetry UI
    this.telemetryVisible = false;
    this.overlayElement = null;

    this.initTelemetryOverlay();
    this.bindKey();
  }

  setTargetFPS(fps) {
    if (typeof fps === 'number' && fps > 0) {
      this.targetFPS = fps;
      this.frameBudgetMs = 1000.0 / fps;
    }
  }

  getFrameBudgetMs(fps = this.targetFPS) {
    return 1000.0 / fps;
  }

  recordFrame(delta) {
    if (delta > 0 && delta < 500) {
      this.frameTime = delta;
      this.fps = 1000.0 / delta;
      this.frameTimeHistory[this.historyIndex] = delta;
      this.historyIndex = (this.historyIndex + 1) % this.historySize;
      if (this.historyCount < this.historySize) this.historyCount++;
      let sum = 0;
      for (let i = 0; i < this.historyCount; i++) {
        sum += this.frameTimeHistory[i];
      }
      const avgDelta = sum / this.historyCount;
      this.smoothedFPS = avgDelta > 0 ? (1000.0 / avgDelta) : 60;
    }
  }

  getMetrics() {
    return {
      fps: Math.round(this.smoothedFPS),
      instantFPS: Math.round(this.fps),
      frameTimeMs: parseFloat(this.frameTime.toFixed(2)),
      drawCalls: this.drawCalls,
      triangles: this.triangles
    };
  }

  beginFrame() {
    this.renderStartTime = performance.now();
  }

  endFrame(renderer, scene) {
    const now = performance.now();
    this.renderTime = now - this.renderStartTime;
    const delta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    if (delta > 0 && delta < 500) {
      this.frameTime = delta;
      this.fps = 1000.0 / delta;

      // Update rolling buffer
      this.frameTimeHistory[this.historyIndex] = delta;
      this.historyIndex = (this.historyIndex + 1) % this.historySize;
      if (this.historyCount < this.historySize) this.historyCount++;

      // Compute smoothed average
      let sum = 0;
      for (let i = 0; i < this.historyCount; i++) {
        sum += this.frameTimeHistory[i];
      }
      const avgDelta = sum / this.historyCount;
      this.smoothedFPS = avgDelta > 0 ? (1000.0 / avgDelta) : 60;
    }

    // Capture Three.js render metrics if available
    if (renderer && renderer.info && renderer.info.render) {
      this.drawCalls = renderer.info.render.calls;
      this.triangles = renderer.info.render.triangles;
    }

    // Evaluate adaptive quality
    const dt = delta / 1000.0;
    this.updateAdaptiveQuality(dt);

    // Update telemetry overlay if active
    if (this.telemetryVisible) {
      this.updateTelemetryDOM();
    }
  }

  updateAdaptiveQuality(dt) {
    if (!this.adaptiveQualityEnabled || !this.graphicsSettings) return;

    if (this.qualityCooldown > 0) {
      this.qualityCooldown -= dt;
      return;
    }

    const underThreshold = this.targetFPS - 6; // e.g. 54 FPS for 60
    const overThreshold = this.targetFPS - 1;  // e.g. 59 FPS for 60

    if (this.smoothedFPS < underThreshold) {
      this.lowFpsDuration += dt;
      this.highFpsDuration = 0;

      // If FPS remains low for > 3.5 seconds, step down
      if (this.lowFpsDuration >= 3.5) {
        this.stepDownQuality();
        this.lowFpsDuration = 0;
        this.qualityCooldown = 4.0; // 4 seconds hysteresis
      }
    } else if (this.smoothedFPS >= overThreshold) {
      this.highFpsDuration += dt;
      this.lowFpsDuration = 0;

      // If performance is rock-solid for > 6.0 seconds, gradually restore
      if (this.highFpsDuration >= 6.0) {
        this.stepUpQuality();
        this.highFpsDuration = 0;
        this.qualityCooldown = 5.0; // 5 seconds hysteresis
      }
    } else {
      // Within acceptable bounds
      this.lowFpsDuration = Math.max(0, this.lowFpsDuration - dt * 0.5);
      this.highFpsDuration = Math.max(0, this.highFpsDuration - dt * 0.5);
    }
  }

  stepDownQuality() {
    const tiers = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
    if (this.currentQualityTier > 0) {
      this.currentQualityTier--;
      const newPreset = tiers[this.currentQualityTier];
      console.log(`[PerformanceManager] ⚡ Adaptive Quality: Reduced to ${newPreset} (Smoothed FPS: ${this.smoothedFPS.toFixed(1)})`);
      this.graphicsSettings.applyPreset(newPreset);
      if (this.threeWorld) {
        this.graphicsSettings.applyToThreeWorld(this.threeWorld);
      }
    }
  }

  stepUpQuality() {
    const tiers = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
    if (this.currentQualityTier < 3) { // Cap at HIGH for auto-scaling
      this.currentQualityTier++;
      const newPreset = tiers[this.currentQualityTier];
      console.log(`[PerformanceManager] 🌟 Adaptive Quality: Restored to ${newPreset} (Smoothed FPS: ${this.smoothedFPS.toFixed(1)})`);
      this.graphicsSettings.applyPreset(newPreset);
      if (this.threeWorld) {
        this.graphicsSettings.applyToThreeWorld(this.threeWorld);
      }
    }
  }

  initTelemetryOverlay() {
    if (typeof document === 'undefined') return;

    let el = document.getElementById('perf-telemetry-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'perf-telemetry-overlay';
      el.style.cssText = `
        position: fixed;
        bottom: 12px;
        right: 12px;
        background: rgba(11, 15, 25, 0.88);
        border: 1px solid rgba(226, 177, 112, 0.4);
        border-radius: 8px;
        padding: 10px 14px;
        color: #e2e8f0;
        font-family: monospace;
        font-size: 11px;
        line-height: 1.5;
        z-index: 99999;
        pointer-events: none;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        display: none;
      `;
      document.body.appendChild(el);
    }
    this.overlayElement = el;
  }

  bindKey() {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'F9' || e.code === 'F9') {
        e.preventDefault();
        this.toggleTelemetry();
      }
    });
  }

  toggleTelemetry(force) {
    this.telemetryVisible = (force !== undefined) ? force : !this.telemetryVisible;
    if (this.overlayElement) {
      this.overlayElement.style.display = this.telemetryVisible ? 'block' : 'none';
    }
  }

  updateTelemetryDOM() {
    if (!this.overlayElement) return;

    const fpsColor = this.smoothedFPS >= 55 ? '#2ecc71' : (this.smoothedFPS >= 35 ? '#f39c12' : '#e74c3c');
    this.overlayElement.innerHTML = `
      <div style="font-weight:bold; color:#e2b170; margin-bottom:4px;">ENGINE TELEMETRY [F9]</div>
      <div>FPS: <span style="color:${fpsColor}; font-weight:bold;">${this.smoothedFPS.toFixed(1)}</span> (Raw: ${this.fps.toFixed(0)})</div>
      <div>Frame Time: ${this.frameTime.toFixed(2)} ms (Budget: ${this.frameBudgetMs.toFixed(1)}ms)</div>
      <div>Render Time: ${this.renderTime.toFixed(2)} ms</div>
      <div>Draw Calls: ${this.drawCalls}</div>
      <div>Triangles: ${this.triangles.toLocaleString()}</div>
      <div>Regions: ${this.loadedRegionsCount} | Quality: ${this.graphicsSettings ? this.graphicsSettings.currentPreset : 'N/A'}</div>
    `;
  }
}

if (typeof window !== 'undefined') {
  window.PerformanceManager = PerformanceManager;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceManager };
}
