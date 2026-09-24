// ============================================================================
// THE WHISPERING WILDS - DISPLAY MANAGER
// Fullscreen / Windowed modes, Resolution Scaling (1080p, 1440p, 4K),
// Performance target telemetry (FPS, frame time, memory, draw calls).
// ============================================================================

(function () {
  'use strict';

  class DisplayManager {
    constructor() {
      this._isFullscreen = !!document.fullscreenElement;
      this._resolutionPreset = '1080p'; // '1080p', '1440p', '4k'
      this._fps = 60;
      this._frameTime = 16.6;
      this._drawCalls = 0;
      this._activeObjects = 0;
      this._memoryMB = 0;
      this._listeners = new Set();

      this._initEventListeners();
      this._initTelemetryMonitor();
    }

    get isFullscreen() {
      return this._isFullscreen;
    }

    get resolutionPreset() {
      return this._resolutionPreset;
    }

    get telemetry() {
      return {
        fps: Math.round(this._fps),
        frameTimeMs: parseFloat(this._frameTime.toFixed(2)),
        drawCalls: this._drawCalls,
        activeObjects: this._activeObjects,
        memoryMB: this._memoryMB,
        fullscreen: this._isFullscreen,
        resolution: this._resolutionPreset
      };
    }

    setMode(mode) {
      if (mode === 'fullscreen' && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          console.warn('[DisplayManager] Fullscreen request rejected or unavailable.');
        });
      } else if (mode === 'windowed' && document.fullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        this.setMode('fullscreen');
      } else {
        this.setMode('windowed');
      }
    }

    setResolution(preset) {
      const valid = ['1080p', '1440p', '4k'];
      if (!valid.includes(preset)) return;
      this._resolutionPreset = preset;

      // Adjust renderer pixel ratio / canvas sizing if threeWorld is active
      const scales = { '1080p': 1.0, '1440p': 1.25, '4k': 1.5 };
      const scale = scales[preset] || 1.0;

      if (window.threeWorld?.renderer) {
        const pr = Math.min(window.devicePixelRatio || 1, 2) * scale;
        window.threeWorld.renderer.setPixelRatio(Math.min(pr, 2.0));
      }

      this._notifyListeners('resolution', preset);
    }

    onChange(fn) {
      this._listeners.add(fn);
      return () => this._listeners.delete(fn);
    }

    _notifyListeners(type, value) {
      for (const fn of this._listeners) {
        try { fn(type, value); } catch (e) { console.error(e); }
      }
    }

    _initEventListeners() {
      document.addEventListener('fullscreenchange', () => {
        this._isFullscreen = !!document.fullscreenElement;
        this._notifyListeners('fullscreen', this._isFullscreen);
        if (window.SettingsManager) {
          window.SettingsManager.settings.display.mode = this._isFullscreen ? 'fullscreen' : 'windowed';
        }
      });
    }

    _initTelemetryMonitor() {
      let frameCount = 0;
      let lastTime = performance.now();

      const sample = () => {
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          this._fps = (frameCount * 1000) / (now - lastTime);
          this._frameTime = 1000 / Math.max(this._fps, 1);
          frameCount = 0;
          lastTime = now;

          // Query renderer draw calls if available
          if (window.threeWorld?.renderer?.info) {
            this._drawCalls = window.threeWorld.renderer.info.render.calls || 0;
            this._activeObjects = window.threeWorld.renderer.info.render.triangles || 0;
          }

          // Query memory if Chrome performance.memory is available
          if (performance && performance.memory) {
            this._memoryMB = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
          }
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }
  }

  window.DisplayManager = new DisplayManager();
})();
