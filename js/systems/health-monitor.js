/**
 * js/systems/health-monitor.js
 * Correlates system health, frame pacing, memory pressure, and telemetry ring buffers
 * across all major subsystems in The Whispering Wilds.
 */

(function () {
  'use strict';

  class HealthMonitor {
    constructor() {
      this._eventRingBuffer = [];
      this._maxEvents = 100;
      this._subsystemStatus = new Map(); // id -> { status: 'OK'|'DEGRADED'|'FAILED', lastUpdated, details }
    }

    /**
     * Records a significant runtime event in the 100-event ring buffer.
     */
    recordEvent(type, data = {}) {
      const entry = {
        type,
        timestamp: Date.now(),
        region: window.GameState?.world?.currentRegion || 'unknown',
        data
      };

      this._eventRingBuffer.push(entry);
      if (this._eventRingBuffer.length > this._maxEvents) {
        this._eventRingBuffer.shift();
      }

      return entry;
    }

    getRecentEvents(count = 20) {
      return this._eventRingBuffer.slice(-count);
    }

    /**
     * Updates health status for a subsystem.
     */
    updateStatus(systemId, status = 'OK', details = null) {
      this._subsystemStatus.set(systemId, {
        status, // 'OK' | 'DEGRADED' | 'FAILED'
        lastUpdated: Date.now(),
        details
      });
    }

    /**
     * Aggregates statuses across all registered systems.
     */
    getHealthReport() {
      const systemRegReport = window.SystemRegistry ? window.SystemRegistry.healthCheckAll() : { report: {} };
      const aggregated = {};

      for (const [id, regData] of Object.entries(systemRegReport.report)) {
        let status = 'OK';
        if (regData.status === 'failed') status = 'FAILED';
        else if (regData.status === 'degraded') status = 'DEGRADED';

        aggregated[id] = {
          status,
          isCritical: regData.isCritical,
          details: regData.details
        };
      }

      // Add local monitor statuses
      for (const [id, monData] of this._subsystemStatus.entries()) {
        if (!aggregated[id]) {
          aggregated[id] = monData;
        }
      }

      return {
        overall: Object.values(aggregated).some(s => s.status === 'FAILED' && s.isCritical) ? 'FAILED' :
                 Object.values(aggregated).some(s => s.status === 'DEGRADED') ? 'DEGRADED' : 'OK',
        subsystems: aggregated,
        timestamp: Date.now()
      };
    }

    /**
     * Produces a structured diagnostic snapshot for bug reports or crash analysis.
     */
    getDiagnosticSnapshot() {
      const perfManager = window.performanceManager;
      return {
        build: {
          gameVersion: '1.2.0',
          buildId: 'BUILD_PROD_QA_2026',
          saveSchemaVersion: 3
        },
        timestamp: Date.now(),
        region: window.GameState?.world?.currentRegion || 'unknown',
        player: {
          x: window.GameState?.player?.x,
          y: window.GameState?.player?.y,
          z: window.GameState?.player?.z,
          health: window.GameState?.player?.health,
          energy: window.GameState?.player?.energy,
          customizationUsed: window.GameState?.player?.customizationChangesUsed
        },
        health: this.getHealthReport(),
        performance: perfManager ? {
          profile: perfManager.currentProfile,
          metrics: perfManager.metrics
        } : null,
        recentEvents: this.getRecentEvents(25)
      };
    }

    healthCheck() {
      return {
        status: 'healthy',
        details: { ringBufferCount: this._eventRingBuffer.length }
      };
    }
  }

  window.HealthMonitor = new HealthMonitor();
})();
