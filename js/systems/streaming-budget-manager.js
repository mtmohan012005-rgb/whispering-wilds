/**
 * The Whispering Wilds (Kaattu Vazhi) - Streaming Budget Manager
 * Controls per-frame CPU time and GPU upload budgets, throttles low-priority tasks
 * during frame drops, and tracks telemetry to eliminate stutter.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreamingBudgetManager = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class StreamingBudgetManager {
    constructor(profileKey = 'MEDIUM') {
      this.currentTier = profileKey;
      this.profile = null;

      // Frame time budget state
      this.frameStartTime = 0;
      this.cpuWorkMs = 0;
      this.cpuBudgetMs = 4.0; // default for medium

      // GPU upload budget state
      this.gpuUploadBudget = 3;
      this.currentGpuUploadsThisFrame = 0;

      // Task count budgets
      this.maxLoadTasksPerFrame = 2;
      this.maxActivationTasksPerFrame = 5;
      this.currentLoadTasksThisFrame = 0;
      this.currentActivationTasksThisFrame = 0;

      // Dynamic stress / throttle factor
      this.throttleFactor = 1.0;
      this.isFrameStressed = false;

      // Telemetry metrics (Section 92)
      this.metrics = {
        lastFrameCpuMs: 0,
        lastFrameGpuUploads: 0,
        lastActivationTimeMs: 0,
        frameSpikesDetected: 0,
        history: []
      };

      this.applyProfile(profileKey);
    }

    applyProfile(tierKey) {
      const dataModule = (typeof window !== 'undefined' && window.STREAMING_DATA)
        ? window.STREAMING_DATA
        : null;

      const profiles = dataModule ? dataModule.HARDWARE_STREAMING_PROFILES : null;
      if (profiles && profiles[tierKey]) {
        this.profile = profiles[tierKey];
        this.currentTier = tierKey;
      } else {
        this.currentTier = 'MEDIUM';
        this.profile = {
          cpuFrameBudgetMs: 4.0,
          gpuUploadBudget: 3,
          maxLoadTasksPerFrame: 2,
          maxActivationTasksPerFrame: 5
        };
      }

      this.cpuBudgetMs = this.profile.cpuFrameBudgetMs;
      this.gpuUploadBudget = this.profile.gpuUploadBudget;
      this.maxLoadTasksPerFrame = this.profile.maxLoadTasksPerFrame;
      this.maxActivationTasksPerFrame = this.profile.maxActivationTasksPerFrame;
    }

    /**
     * Called at the start of every render/simulation frame
     */
    beginFrame() {
      this.frameStartTime = performance.now();
      this.cpuWorkMs = 0;
      this.currentGpuUploadsThisFrame = 0;
      this.currentLoadTasksThisFrame = 0;
      this.currentActivationTasksThisFrame = 0;
    }

    /**
     * Checks if CPU budget allows executing estimated work (in ms)
     */
    canDoCpuWork(estimatedMs = 0.5) {
      if (this.isFrameStressed) {
        return (this.cpuWorkMs + estimatedMs) <= (this.cpuBudgetMs * 0.5);
      }
      return (this.cpuWorkMs + estimatedMs) <= this.cpuBudgetMs;
    }

    /**
     * Records CPU time spent on streaming work
     */
    recordCpuWork(ms) {
      this.cpuWorkMs += ms;
      return this.cpuWorkMs;
    }

    /**
     * Checks if another GPU resource upload is permitted in current frame
     */
    canDoGpuUpload() {
      const limit = Math.max(1, Math.floor(this.gpuUploadBudget * this.throttleFactor));
      return this.currentGpuUploadsThisFrame < limit;
    }

    recordGpuUpload() {
      this.currentGpuUploadsThisFrame++;
    }

    /**
     * Checks if another cell activation is allowed in this frame
     */
    canActivateTask() {
      const limit = Math.max(1, Math.floor(this.maxActivationTasksPerFrame * this.throttleFactor));
      return this.currentActivationTasksThisFrame < limit;
    }

    recordActivationTask(durationMs = 0) {
      this.currentActivationTasksThisFrame++;
      this.recordCpuWork(durationMs);
      this.metrics.lastActivationTimeMs = durationMs;
      if (durationMs > 16.0) {
        this.metrics.frameSpikesDetected++;
      }
    }

    /**
     * Checks if another cell load task is allowed in this frame
     */
    canLoadTask() {
      const limit = Math.max(1, Math.floor(this.maxLoadTasksPerFrame * this.throttleFactor));
      return this.currentLoadTasksThisFrame < limit;
    }

    recordLoadTask(durationMs = 0) {
      this.currentLoadTasksThisFrame++;
      this.recordCpuWork(durationMs);
    }

    /**
     * Adjusts dynamic throttling based on global frame time
     */
    setFrameTimeFeedback(frameTimeMs, targetFps = 60) {
      const targetFrameMs = 1000.0 / targetFps;
      if (frameTimeMs > targetFrameMs + 4.0) {
        // High frame time spike: throttle streaming tasks aggressively
        this.throttleFactor = Math.max(0.25, this.throttleFactor - 0.15);
        this.isFrameStressed = true;
      } else if (frameTimeMs < targetFrameMs - 1.0) {
        // Healthy frame time: restore normal budgets
        this.throttleFactor = Math.min(1.0, this.throttleFactor + 0.05);
        this.isFrameStressed = false;
      }
    }

    /**
     * Finalizes frame metrics
     */
    endFrame() {
      this.metrics.lastFrameCpuMs = this.cpuWorkMs;
      this.metrics.lastFrameGpuUploads = this.currentGpuUploadsThisFrame;
    }

    getDiagnostics() {
      return {
        tier: this.currentTier,
        cpuBudgetMs: this.cpuBudgetMs,
        cpuUsedMs: Number(this.cpuWorkMs.toFixed(2)),
        gpuUploadBudget: this.gpuUploadBudget,
        gpuUploadsUsed: this.currentGpuUploadsThisFrame,
        throttleFactor: Number(this.throttleFactor.toFixed(2)),
        isFrameStressed: this.isFrameStressed,
        spikesDetected: this.metrics.frameSpikesDetected
      };
    }
  }

  return StreamingBudgetManager;
});
