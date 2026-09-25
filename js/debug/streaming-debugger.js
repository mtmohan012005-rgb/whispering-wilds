/**
 * The Whispering Wilds (Kaattu Vazhi) - Streaming Debugger
 * F7 toggle developer overlay with real-time streaming metrics, cell counts,
 * asset queue lengths, frame budgets, and color-coded streaming mini-map.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.StreamingDebugger = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class StreamingDebugger {
    constructor(streamingSystem = null) {
      this.streamingSystem = streamingSystem;
      this.isVisible = false;
      this.container = null;
      this.canvas = null;
      this.ctx = null;

      // Color coding (Section 100)
      this.COLORS = {
        ACTIVE: '#22c55e',      // Green
        PRELOAD: '#eab308',     // Yellow
        QUEUED: '#3b82f6',      // Blue
        LOADING: '#a855f7',     // Purple
        FAILED: '#ef4444',      // Red
        UNLOADED: '#64748b'     // Gray
      };

      this._initDOM();
      this._bindKeys();
    }

    _initDOM() {
      if (typeof document === 'undefined') return;

      let el = document.getElementById('streaming-debug-overlay');
      if (!el) {
        el = document.createElement('div');
        el.id = 'streaming-debug-overlay';
        el.style.cssText = `
          position: fixed;
          top: 16px;
          right: 16px;
          width: 320px;
          background: rgba(11, 15, 25, 0.92);
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 12px;
          color: #f8fafc;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.4;
          z-index: 99999;
          display: none;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
          pointer-events: none;
        `;

        el.innerHTML = `
          <div style="font-weight: bold; border-bottom: 1px solid #334155; padding-bottom: 4px; margin-bottom: 8px; color: #38bdf8; display: flex; justify-content: space-between;">
            <span>STREAMING DIAGNOSTICS [F7]</span>
            <span id="st-hud-tier" style="color: #a855f7;">MEDIUM</span>
          </div>
          <div id="st-hud-info"></div>
          <div style="margin-top: 8px; font-weight: bold; font-size: 10px; color: #94a3b8;">WORLD CELL TOPOLOGY MAP:</div>
          <canvas id="st-hud-canvas" width="296" height="120" style="background: #0f172a; border: 1px solid #1e293b; border-radius: 4px; margin-top: 4px; display: block;"></canvas>
          <div style="margin-top: 6px; display: flex; justify-content: space-between; font-size: 9px;">
            <span style="color: #22c55e;">● Active</span>
            <span style="color: #eab308;">● Preload</span>
            <span style="color: #3b82f6;">● Queued</span>
            <span style="color: #ef4444;">● Failed</span>
            <span style="color: #64748b;">● Unloaded</span>
          </div>
        `;
        document.body.appendChild(el);
      }

      this.container = el;
      this.canvas = document.getElementById('st-hud-canvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
      }
    }

    _bindKeys() {
      if (typeof window === 'undefined') return;
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F7') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    toggle() {
      this.isVisible = !this.isVisible;
      if (this.container) {
        this.container.style.display = this.isVisible ? 'block' : 'none';
      }
      console.log(`[StreamingDebugger] Overlay ${this.isVisible ? 'ENABLED' : 'DISABLED'}`);
    }

    update(telemetry = {}) {
      if (!this.isVisible || !this.container) return;

      const tierEl = document.getElementById('st-hud-tier');
      if (tierEl) tierEl.textContent = telemetry.tier || 'MEDIUM';

      const infoEl = document.getElementById('st-hud-info');
      if (infoEl) {
        infoEl.innerHTML = `
          <div>Region: <b style="color: #38bdf8;">${telemetry.currentRegion || 'CHENNAI'}</b></div>
          <div>Player Cell: <b style="color: #22c55e;">${telemetry.currentCell || 'CELL_CHE_001'}</b></div>
          <div>Active Cells: <b>${telemetry.activeCellsCount || 0}</b> | Preload: <b>${telemetry.preloadCellsCount || 0}</b></div>
          <div>Queued Tasks: <b>${telemetry.queuedTasksCount || 0}</b> | Failed: <b style="color: ${telemetry.failedCellsCount ? '#ef4444' : '#94a3b8'};">${telemetry.failedCellsCount || 0}</b></div>
          <div>CPU Budget: <b>${telemetry.cpuUsedMs || 0} / ${telemetry.cpuBudgetMs || 4} ms</b></div>
          <div>GPU Uploads: <b>${telemetry.gpuUploads || 0} / ${telemetry.gpuBudget || 3}</b></div>
          <div>Cache Tiers: HOT: <b>${telemetry.hotCount || 0}</b> | WARM: <b>${telemetry.warmCount || 0}</b> | COLD: <b>${telemetry.coldCount || 0}</b></div>
          <div>Memory Pressure: <b style="color: ${telemetry.memoryPressure === 'CRITICAL' ? '#ef4444' : '#22c55e'};">${telemetry.memoryPressure || 'NORMAL'}</b></div>
        `;
      }

      this._renderMap(telemetry);
    }

    _renderMap(telemetry) {
      if (!this.ctx || !telemetry.cellStates) return;

      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      ctx.clearRect(0, 0, w, h);

      // World coordinate bounding box: X in [-290, 290], Z in [-70, 45]
      const minX = -290;
      const maxX = 290;
      const minZ = -70;
      const maxZ = 45;
      const worldW = maxX - minX;
      const worldH = maxZ - minZ;

      const cellStates = telemetry.cellStates; // cellId -> state
      const cellDefs = (typeof window !== 'undefined' && window.WORLD_CELL_DATA) ? window.WORLD_CELL_DATA.CELLS : {};

      for (const [cellId, state] of Object.entries(cellStates)) {
        const def = cellDefs[cellId];
        if (!def) continue;

        const b = def.bounds;
        const rx = ((b.minX - minX) / worldW) * w;
        const rw = ((b.maxX - b.minX) / worldW) * w;
        const ry = ((b.minZ - minZ) / worldH) * h;
        const rh = ((b.maxZ - b.minZ) / worldH) * h;

        ctx.fillStyle = this.COLORS[state] || this.COLORS.UNLOADED;
        ctx.fillRect(rx, ry, Math.max(2, rw - 1), Math.max(2, rh - 1));

        // Highlight player's cell with outline
        if (cellId === telemetry.currentCell) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rx, ry, rw, rh);
        }
      }

      // Draw player dot
      if (telemetry.playerPos) {
        const px = ((telemetry.playerPos.x - minX) / worldW) * w;
        const pz = ((telemetry.playerPos.z - minZ) / worldH) * h;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, pz, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  return StreamingDebugger;
});
