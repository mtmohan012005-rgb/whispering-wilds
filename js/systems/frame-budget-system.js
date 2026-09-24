// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - FRAME BUDGET SYSTEM
// Precision frame pacing, 1% low tracking, delta-time safety & bottleneck diagnostics
// ============================================================================

(function() {
  'use strict';

  class FrameBudgetSystem {
    /**
     * @param {number} targetFPS - Default 60
     * @param {number} historySize - Default 60
     */
    constructor(targetFPS = 60, historySize = 60) {
      this.targetFPS = targetFPS;
      this.frameBudgetMs = 1000.0 / targetFPS;
      this.maxDeltaTime = 0.1; // 100ms maximum delta to prevent teleportation / physics explosions

      // Rolling window buffer
      this.historySize = historySize;
      this.frameTimes = new Float32Array(historySize);
      this.cpuTimes = new Float32Array(historySize);
      this.gpuTimes = new Float32Array(historySize);
      this.head = 0;
      this.count = 0;

      // Current snapshot metrics
      this.lastFrameTimestamp = performance.now();
      this.cpuStartTimestamp = 0;
      this.gpuStartTimestamp = 0;

      this.currentFrameTime = 16.67;
      this.averageFrameTime = 16.67;
      this.onePercentLow = 16.67;
      this.worstFrameTime = 16.67;
      this.averageCpuTime = 4.0;
      this.averageGpuTime = 8.0;

      this.diagnostics = 'Balanced';
    }

    setTargetFPS(fps) {
      const valid = [30, 40, 60, 75, 90, 120, 144, 165, 240];
      if (valid.includes(fps)) {
        this.targetFPS = fps;
        this.frameBudgetMs = 1000.0 / fps;
      }
    }

    clampDelta(rawDeltaSeconds) {
      if (isNaN(rawDeltaSeconds) || rawDeltaSeconds <= 0) return 0.016;
      return Math.min(rawDeltaSeconds, this.maxDeltaTime);
    }

    beginCpuUpdate() {
      this.cpuStartTimestamp = performance.now();
    }

    endCpuUpdate() {
      const now = performance.now();
      const cpuDelta = now - this.cpuStartTimestamp;
      this.cpuTimes[this.head] = cpuDelta;
    }

    beginGpuRender() {
      this.gpuStartTimestamp = performance.now();
    }

    endGpuRender() {
      const now = performance.now();
      const gpuDelta = now - this.gpuStartTimestamp;
      this.gpuTimes[this.head] = gpuDelta;
    }

    recordFrame(deltaMs) {
      const delta = (deltaMs !== undefined) ? deltaMs : (performance.now() - this.lastFrameTimestamp);
      this.lastFrameTimestamp = performance.now();

      // Filter extreme anomalies (e.g. system sleep/wake)
      const clampedDelta = Math.min(delta, 500.0);
      this.currentFrameTime = clampedDelta;

      this.frameTimes[this.head] = clampedDelta;
      this.head = (this.head + 1) % this.historySize;
      if (this.count < this.historySize) this.count++;

      // Compute rolling metrics
      let sumFrame = 0;
      let sumCpu = 0;
      let sumGpu = 0;
      let worst = 0;
      const sorted = [];

      for (let i = 0; i < this.count; i++) {
        const ft = this.frameTimes[i];
        sumFrame += ft;
        sumCpu += this.cpuTimes[i];
        sumGpu += this.gpuTimes[i];
        sorted.push(ft);
        if (ft > worst) worst = ft;
      }

      this.averageFrameTime = sumFrame / this.count;
      this.averageCpuTime = sumCpu / this.count;
      this.averageGpuTime = sumGpu / this.count;
      this.worstFrameTime = worst;

      // 1% Low approximation (99th percentile of frame times)
      sorted.sort((a, b) => a - b);
      const lowIndex = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99));
      this.onePercentLow = sorted[lowIndex];

      // Auto diagnostics evaluation
      this._updateDiagnostics();
    }

    _updateDiagnostics() {
      if (this.averageFrameTime <= this.frameBudgetMs * 1.05) {
        this.diagnostics = 'Balanced';
      } else if (this.averageGpuTime > this.frameBudgetMs * 0.75) {
        this.diagnostics = 'Likely GPU-bound';
      } else if (this.averageCpuTime > this.frameBudgetMs * 0.75) {
        this.diagnostics = 'Likely CPU-bound';
      } else if (this.worstFrameTime > this.averageFrameTime * 2.5) {
        this.diagnostics = 'Likely streaming-bound';
      } else {
        this.diagnostics = 'Performance degraded';
      }
    }

    getSnapshot() {
      const fps = this.averageFrameTime > 0 ? (1000.0 / this.averageFrameTime) : this.targetFPS;
      const onePercentLowFPS = this.onePercentLow > 0 ? (1000.0 / this.onePercentLow) : this.targetFPS;

      return {
        targetFPS: this.targetFPS,
        frameBudgetMs: parseFloat(this.frameBudgetMs.toFixed(2)),
        currentFrameTimeMs: parseFloat(this.currentFrameTime.toFixed(2)),
        averageFrameTimeMs: parseFloat(this.averageFrameTime.toFixed(2)),
        averageFPS: parseFloat(fps.toFixed(1)),
        onePercentLowFPS: parseFloat(onePercentLowFPS.toFixed(1)),
        worstFrameTimeMs: parseFloat(this.worstFrameTime.toFixed(2)),
        averageCpuTimeMs: parseFloat(this.averageCpuTime.toFixed(2)),
        averageGpuTimeMs: parseFloat(this.averageGpuTime.toFixed(2)),
        diagnostics: this.diagnostics,
        isOverBudget: this.averageFrameTime > this.frameBudgetMs
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.FrameBudgetSystem = FrameBudgetSystem;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FrameBudgetSystem };
  }
})();
