// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CONTENT PERFORMANCE TELEMETRY
// Tracks content metrics, active entity counts, load times, and memory estimates.
// Active only in developer mode.
// ============================================================================

(function () {
  'use strict';

  class ContentTelemetry {
    constructor() {
      this.metrics = {
        contentLoadTimeMs: 0,
        activeNpcCount: 0,
        activeWildlifeCount: 0,
        activeEventCount: 0,
        questStateCount: 0,
        estimatedContentMemoryBytes: 0,
        failedAssetLoads: 0,
        validationErrorCount: 0,
        lastUpdated: Date.now()
      };
    }

    recordLoadTime(ms) {
      this.metrics.contentLoadTimeMs = Math.round(ms);
    }

    recordFailedAsset(assetPath, error) {
      this.metrics.failedAssetLoads++;
      console.warn(`[ContentTelemetry] Failed asset load (${this.metrics.failedAssetLoads}): ${assetPath}`, error);
    }

    updateSnapshot() {
      const reg = window.ContentRegistry;
      const qm = window.QuestStateMachine;
      const state = window.GameState;

      if (reg) {
        const metrics = reg.getMetrics();
        // Rough estimate of content footprint
        this.metrics.estimatedContentMemoryBytes = JSON.stringify(metrics).length * 80;
      }

      if (qm) {
        this.metrics.questStateCount = qm.questStates.size;
      }

      if (state) {
        this.metrics.activeNpcCount = state.world?.activeNpcCount || 8;
        this.metrics.activeWildlifeCount = state.world?.activeWildlifeCount || 12;
      }

      const val = window.ContentValidator;
      if (val && val.validationResults) {
        this.metrics.validationErrorCount = val.validationResults.errorCount;
      }

      this.metrics.lastUpdated = Date.now();
      return { ...this.metrics };
    }

    getReport() {
      this.updateSnapshot();
      return {
        ...this.metrics,
        summary: `Load: ${this.metrics.contentLoadTimeMs}ms | Quests: ${this.metrics.questStateCount} | NPCs: ${this.metrics.activeNpcCount} | ValErrors: ${this.metrics.validationErrorCount}`
      };
    }
  }

  const instance = new ContentTelemetry();

  if (typeof window !== 'undefined') {
    window.ContentTelemetry = instance;
    window.contentTelemetry = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
})();
