/**
 * The Whispering Wilds (Kaattu Vazhi) - Core Performance Monitor
 * Tracks real-time frame telemetry, subsystem CPU overhead, memory consumption,
 * asset loading metrics, and exports actionable diagnostic health reports.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const monitor = factory();
    root.PerformanceMonitor = monitor;
    if (typeof window !== 'undefined') {
      window.PerformanceMonitor = monitor;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class PerformanceMonitorEngine {
    constructor() {
      this.metrics = {
        fps: 60,
        frameTimeMs: 16.67,
        cpuUpdateTimeMs: 4.5,
        renderTimeMs: 6.2,
        npcUpdateTimeMs: 0.8,
        wildlifeUpdateTimeMs: 0.4,
        questUpdateTimeMs: 0.2,
        audioUpdateTimeMs: 0.3,
        streamingWaitMs: 0.0,
        memoryMb: 0,
        assetLoadingTimeMs: 0,
        saveDurationMs: 0,
        networkLatencyMs: 0,
        activeSectorsCount: 1,
        activeNpcCount: 0,
        activeWildlifeCount: 0,
        drawCalls: 0,
        triangles: 0
      };

      this._samples = {
        fps: [],
        frameTime: []
      };

      this._maxSamples = 120;
      this._lastReportTime = Date.now();
    }

    recordFrame(frameTimeMs, cpuTimeMs, renderTimeMs) {
      this.metrics.frameTimeMs = frameTimeMs;
      this.metrics.fps = frameTimeMs > 0 ? Math.min(240, 1000.0 / frameTimeMs) : 60;
      this.metrics.cpuUpdateTimeMs = cpuTimeMs;
      this.metrics.renderTimeMs = renderTimeMs;

      this._samples.frameTime.push(frameTimeMs);
      this._samples.fps.push(this.metrics.fps);

      if (this._samples.frameTime.length > this._maxSamples) {
        this._samples.frameTime.shift();
        this._samples.fps.shift();
      }

      this._queryMemory();
    }

    recordSubsystemTime(subsystem, durationMs) {
      if (subsystem === 'npc') this.metrics.npcUpdateTimeMs = durationMs;
      else if (subsystem === 'wildlife') this.metrics.wildlifeUpdateTimeMs = durationMs;
      else if (subsystem === 'quest') this.metrics.questUpdateTimeMs = durationMs;
      else if (subsystem === 'audio') this.metrics.audioUpdateTimeMs = durationMs;
      else if (subsystem === 'streaming') this.metrics.streamingWaitMs = durationMs;
      else if (subsystem === 'save') this.metrics.saveDurationMs = durationMs;
    }

    recordCounts(counts = {}) {
      if (counts.sectors !== undefined) this.metrics.activeSectorsCount = counts.sectors;
      if (counts.npcs !== undefined) this.metrics.activeNpcCount = counts.npcs;
      if (counts.wildlife !== undefined) this.metrics.activeWildlifeCount = counts.wildlife;
      if (counts.drawCalls !== undefined) this.metrics.drawCalls = counts.drawCalls;
      if (counts.triangles !== undefined) this.metrics.triangles = counts.triangles;
    }

    _queryMemory() {
      if (typeof performance !== 'undefined' && performance.memory) {
        this.metrics.memoryMb = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
      }
    }

    getAverageFPS() {
      if (this._samples.fps.length === 0) return 60;
      const sum = this._samples.fps.reduce((a, b) => a + b, 0);
      return Math.round((sum / this._samples.fps.length) * 10) / 10;
    }

    getOnePercentLowFPS() {
      if (this._samples.frameTime.length === 0) return 60;
      const sorted = [...this._samples.frameTime].sort((a, b) => b - a); // highest frame times first
      const count = Math.max(1, Math.floor(sorted.length * 0.01));
      const topTimes = sorted.slice(0, count);
      const avgWorstTime = topTimes.reduce((a, b) => a + b, 0) / count;
      return avgWorstTime > 0 ? Math.round(1000.0 / avgWorstTime) : 60;
    }

    exportDiagnosticReport() {
      return {
        timestamp: new Date().toISOString(),
        averageFPS: this.getAverageFPS(),
        onePercentLowFPS: this.getOnePercentLowFPS(),
        metrics: { ...this.metrics },
        systemHealth: this.metrics.fps >= 30 ? 'HEALTHY' : 'DEGRADED',
        recommendations: this._getRecommendations()
      };
    }

    _getRecommendations() {
      const recs = [];
      if (this.metrics.fps < 45) {
        recs.push('Reduce shadow distance and distant foliage density.');
      }
      if (this.metrics.memoryMb > 1500) {
        recs.push('Trigger cache trimming for inactive sectors.');
      }
      if (this.metrics.npcUpdateTimeMs > 4.0) {
        recs.push('Throttle distant NPC simulation frequency.');
      }
      return recs;
    }
  }

  return new PerformanceMonitorEngine();
});
