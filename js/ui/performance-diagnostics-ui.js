// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PERFORMANCE DIAGNOSTICS UI
// Developer-only F1 diagnostic telemetry overlay (FPS, 1% low, memory, draw calls)
// ============================================================================

(function() {
  'use strict';

  class PerformanceDiagnosticsUI {
    constructor() {
      this.isVisible = false;
      this.element = null;
      this.lastUpdate = 0;
      this.updateIntervalMs = 250; // 4Hz refresh for readability

      this._initDOM();
      this._bindKey();
    }

    _initDOM() {
      if (typeof document === 'undefined') return;

      let el = document.getElementById('perf-diagnostics-overlay');
      if (!el) {
        el = document.createElement('div');
        el.id = 'perf-diagnostics-overlay';
        el.style.cssText = `
          position: fixed;
          top: 14px;
          right: 14px;
          background: rgba(11, 15, 25, 0.90);
          border: 1px solid rgba(226, 177, 112, 0.45);
          border-radius: 8px;
          padding: 12px 16px;
          color: #f1f5f9;
          font-family: 'Consolas', 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.55;
          z-index: 999999;
          pointer-events: none;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7);
          display: none;
          min-width: 230px;
        `;
        document.body.appendChild(el);
      }
      this.element = el;
    }

    _bindKey() {
      if (typeof window === 'undefined') return;

      window.addEventListener('keydown', (e) => {
        // Toggle overlay on F1 (or F9 legacy support)
        if (e.key === 'F1' || e.code === 'F1' || e.key === 'F9' || e.code === 'F9') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    toggle(force) {
      this.isVisible = (force !== undefined) ? force : !this.isVisible;
      if (this.element) {
        this.element.style.display = this.isVisible ? 'block' : 'none';
        if (this.isVisible) this.render();
      }
    }

    render() {
      if (!this.element || !this.isVisible) return;

      const now = performance.now();
      if (now - this.lastUpdate < this.updateIntervalMs) return;
      this.lastUpdate = now;

      const pm = window.performanceManager;
      const metrics = pm ? pm.getMetrics() : { fps: 60, frameTimeMs: 16.6, drawCalls: 0, triangles: 0 };
      const snap = window.frameBudgetSystem ? window.frameBudgetSystem.getSnapshot() : {};
      const mem = window.memoryManager ? window.memoryManager.getMemorySnapshot() : {};

      const fps = metrics.fps || 60;
      const fpsColor = fps >= 55 ? '#4ade80' : (fps >= 35 ? '#fbbf24' : '#f87171');
      const diagColor = snap.diagnostics === 'Balanced' ? '#38bdf8' : '#f97316';

      this.element.innerHTML = `
        <div style="font-weight: bold; color: #e2b170; border-bottom: 1px solid rgba(226,177,112,0.3); padding-bottom: 4px; margin-bottom: 6px;">
          PERFORMANCE HUD [F1]
        </div>
        <div>FPS: <span style="color: ${fpsColor}; font-weight: bold;">${fps}</span> (1% Low: ${snap.onePercentLowFPS || fps})</div>
        <div>Frame Time: <b>${metrics.frameTimeMs} ms</b> (Budget: ${snap.frameBudgetMs || 16.7}ms)</div>
        <div>Render Time: ${snap.averageGpuTimeMs || 8.0} ms</div>
        <div>Draw Calls: <b>${metrics.drawCalls || 0}</b> | Tris: <b>${(metrics.triangles || 0).toLocaleString()}</b></div>
        <div>Profile: <span style="color: #e2b170;">${pm ? pm.currentTier : 'MEDIUM'}</span> | Scale: <b>${pm?.renderQuality?.currentRenderScale ? Math.round(pm.renderQuality.currentRenderScale * 100) : 100}%</b></div>
        <div>Bottleneck: <span style="color: ${diagColor}; font-weight: bold;">${snap.diagnostics || 'Balanced'}</span></div>
        ${mem.jsHeapUsedMB ? `<div>JS Heap: <b>${mem.jsHeapUsedMB} MB</b> / ${mem.jsHeapLimitMB || 0} MB</div>` : ''}
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Spawns: NPC(${pm?.spawnCounts?.npc || 0}) WL(${pm?.spawnCounts?.wildlife || 0}) Veh(${pm?.spawnCounts?.traffic || 0})</div>
      `;
    }
  }

  const instance = new PerformanceDiagnosticsUI();

  if (typeof window !== 'undefined') {
    window.PerformanceDiagnosticsUI = PerformanceDiagnosticsUI;
    window.performanceDiagnosticsUI = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceDiagnosticsUI, performanceDiagnosticsUI: instance };
  }
})();
