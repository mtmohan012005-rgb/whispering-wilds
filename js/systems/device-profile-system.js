/**
 * The Whispering Wilds - Device Profile System
 * Normalizes device capabilities into VERY_LOW, LOW, MEDIUM, HIGH, ULTRA.
 * Unknown hardware safely defaults to SAFE_MEDIUM.
 * Runs a short, non-stress micro-benchmark during initial detection.
 */
(function(root) {
  'use strict';

  class DeviceProfileSystem {
    constructor(platformProfile) {
      this.platformProfile = platformProfile || (root.UniversalPlatformLayer ? new root.UniversalPlatformLayer().getProfile() : {});
      this.profileTier = 'MEDIUM'; // Safe default
      this.benchmarkResults = null;
      this.evaluateProfileTier();
    }

    evaluateProfileTier() {
      const p = this.platformProfile;
      const gpuClass = p.gpuClass || 'UNKNOWN';
      const logicalCores = p.logicalCores || 2;
      const memoryClass = p.memoryClass || 'UNKNOWN';

      if (gpuClass === 'HIGH_DEDICATED' && logicalCores >= 8 && (memoryClass === 'HIGH' || memoryClass === 'UNKNOWN')) {
        this.profileTier = 'ULTRA';
      } else if ((gpuClass === 'HIGH_DEDICATED' || gpuClass === 'MID_DEDICATED' || gpuClass === 'APPLE_SILICON') && logicalCores >= 6) {
        this.profileTier = 'HIGH';
      } else if (gpuClass === 'ENTRY_DEDICATED' || (gpuClass === 'INTEGRATED' && logicalCores >= 4 && memoryClass !== 'VERY_LOW')) {
        this.profileTier = 'MEDIUM';
      } else if (gpuClass === 'INTEGRATED' || memoryClass === 'LOW') {
        this.profileTier = 'LOW';
      } else if (memoryClass === 'VERY_LOW' || p.graphicsApi === 'WEBGL_FALLBACK') {
        this.profileTier = 'VERY_LOW';
      } else {
        // Unknown hardware defaults safely to MEDIUM
        this.profileTier = 'MEDIUM';
      }
    }

    /**
     * Executes a fast, non-stress micro-benchmark (max 10 frames / ~160ms).
     * Never allocates huge textures or causes thermal stress.
     */
    async runMicroBenchmark() {
      const start = performance.now();
      const frameTimes = [];
      let cpuTotal = 0;

      // Simulate 10 frames of typical CPU simulation workloads (transform calculations, math)
      for (let i = 0; i < 10; i++) {
        const frameStart = performance.now();
        // CPU math workload (vector matrix multiplications)
        let acc = 0;
        for (let j = 0; j < 5000; j++) {
          acc += Math.sin(j) * Math.cos(j);
        }
        const cpuCost = performance.now() - frameStart;
        cpuTotal += cpuCost;
        frameTimes.push(cpuCost);
      }

      const totalTime = performance.now() - start;
      const avgCpuCost = cpuTotal / 10;

      this.benchmarkResults = {
        totalBenchmarkTimeMs: totalTime,
        avgCpuCostMs: avgCpuCost,
        recommendedTier: this.profileTier
      };

      // If CPU is heavily constrained (> 8ms per micro-frame), downscale recommendation by one tier
      if (avgCpuCost > 8.0) {
        if (this.profileTier === 'ULTRA') this.profileTier = 'HIGH';
        else if (this.profileTier === 'HIGH') this.profileTier = 'MEDIUM';
        else if (this.profileTier === 'MEDIUM') this.profileTier = 'LOW';
        else this.profileTier = 'VERY_LOW';
        this.benchmarkResults.recommendedTier = this.profileTier;
      }

      return this.benchmarkResults;
    }

    getProfileTier() {
      return this.profileTier;
    }

    getBenchmarkResults() {
      return this.benchmarkResults;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceProfileSystem;
  } else {
    root.DeviceProfileSystem = DeviceProfileSystem;
  }
})(typeof window !== 'undefined' ? window : global);
