// ============================================================================
// THE WHISPERING WILDS — DEVELOPMENT PERFORMANCE HUD
// Only visible when ?devtools=1 is in the URL or when explicitly toggled.
// Hidden in production. Export diagnostic snapshots.
// ============================================================================

(function () {
  'use strict';

  const IS_DEV = window.location.search.includes('devtools=1') ||
                 window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1';

  class PerfHUD {
    constructor() {
      this.visible  = IS_DEV;
      this.el       = null;
      this._rafId   = null;
      this._lastUpdate = 0;
      this._updateIntervalMs = 250; // update HUD 4x/sec
      this._fpsHistory = [];
      this._ftHistory  = [];
    }

    init() {
      if (!IS_DEV) {
        // Still listen for Ctrl+Shift+P to toggle in production (for support)
        window.addEventListener('keydown', e => {
          if (e.ctrlKey && e.shiftKey && e.code === 'KeyP') {
            this.visible = !this.visible;
            if (this.visible) this._createUI();
            else this._destroyUI();
          }
        });
        return;
      }
      this._createUI();
      this._loop();
    }

    _createUI() {
      if (this.el) return;
      const el = document.createElement('div');
      el.id = 'ww-perf-hud';
      el.innerHTML = `
        <div class="phud-header">
          <span>⚡ PERF</span>
          <span class="phud-qual" id="phud-qual">AUTO</span>
          <button class="phud-close" id="phud-close">×</button>
        </div>
        <div class="phud-grid">
          <div class="phud-row"><span class="phud-label">FPS</span><span class="phud-val" id="phud-fps">—</span></div>
          <div class="phud-row"><span class="phud-label">Frame</span><span class="phud-val" id="phud-ft">—</span></div>
          <div class="phud-row"><span class="phud-label">Draws</span><span class="phud-val" id="phud-draws">—</span></div>
          <div class="phud-row"><span class="phud-label">Tris</span><span class="phud-val" id="phud-tris">—</span></div>
          <div class="phud-row"><span class="phud-label">Geoms</span><span class="phud-val" id="phud-geoms">—</span></div>
          <div class="phud-row"><span class="phud-label">Textures</span><span class="phud-val" id="phud-tex">—</span></div>
          <div class="phud-row"><span class="phud-label">DPR</span><span class="phud-val" id="phud-dpr">—</span></div>
          <div class="phud-row"><span class="phud-label">GPU</span><span class="phud-val phud-gpu" id="phud-gpu">—</span></div>
          <div class="phud-row"><span class="phud-label">Chunks</span><span class="phud-val" id="phud-chunks">—</span></div>
          <div class="phud-row"><span class="phud-label">NPCs</span><span class="phud-val" id="phud-npcs">—</span></div>
          <div class="phud-row"><span class="phud-label">Wildlife</span><span class="phud-val" id="phud-wildlife">—</span></div>
          <div class="phud-row"><span class="phud-label">NetRTT</span><span class="phud-val" id="phud-rtt">—</span></div>
          <div class="phud-row"><span class="phud-label">NetQ</span><span class="phud-val" id="phud-netq">—</span></div>
          <div class="phud-row"><span class="phud-label">AssetQ</span><span class="phud-val" id="phud-assetq">—</span></div>
          <div class="phud-row"><span class="phud-label">Assets MB</span><span class="phud-val" id="phud-assetmb">—</span></div>
          <div class="phud-row"><span class="phud-label">Renderer</span><span class="phud-val" id="phud-backend">WebGL2</span></div>
          <div class="phud-row"><span class="phud-label">Connection</span><span class="phud-val" id="phud-conn">—</span></div>
        </div>
        <button class="phud-export" id="phud-export">📋 Export Snapshot</button>`;

      // Styles
      if (!document.getElementById('ww-perf-hud-style')) {
        const s = document.createElement('style');
        s.id = 'ww-perf-hud-style';
        s.textContent = `
          #ww-perf-hud {
            position:fixed; top:8px; right:8px; z-index:98000;
            width:195px; background:rgba(5,10,20,0.9);
            border:1px solid rgba(100,200,255,0.18);
            border-radius:8px; padding:6px 8px;
            font-family: 'JetBrains Mono','Courier New',monospace;
            font-size:11px; color:#c8dff0;
            pointer-events:auto; user-select:none;
            box-shadow:0 4px 20px rgba(0,0,0,0.5);
          }
          .phud-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; font-weight:700; }
          .phud-qual { font-size:10px; padding:1px 5px; border-radius:3px; background:#1a3a5c; color:#7ec8f5; }
          .phud-close { background:none; border:none; color:#8aa; cursor:pointer; font-size:14px; line-height:1; padding:0; }
          .phud-grid { display:flex; flex-direction:column; gap:2px; }
          .phud-row { display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:2px; }
          .phud-label { color:#6a90b0; }
          .phud-val { font-weight:600; color:#e8f8ff; }
          .phud-val.red { color:#ff6b6b; }
          .phud-val.yellow { color:#ffd06b; }
          .phud-val.green { color:#6bff9f; }
          .phud-gpu { font-size:9px; max-width:100px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .phud-export { width:100%; margin-top:5px; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12); border-radius:4px; color:#aac; padding:3px 0; cursor:pointer; font-size:10px; }
          .phud-export:hover { background:rgba(255,255,255,0.12); }
        `;
        document.head.appendChild(s);
      }

      document.body.appendChild(el);
      this.el = el;

      el.querySelector('#phud-close').addEventListener('click', () => {
        this.visible = false;
        this._destroyUI();
      });
      el.querySelector('#phud-export').addEventListener('click', () => this._exportSnapshot());

      // Show GPU info once
      const gpu = window.GPUCapability;
      if (gpu && gpu.detected) {
        this._setText('phud-gpu', gpu.gpuRenderer.substring(0, 28));
        this._setText('phud-backend', gpu.supportsWebGPU ? 'WebGPU' : (gpu.supportsWebGL2 ? 'WebGL2' : 'WebGL1'));
      }

      if (!this._rafId) this._loop();
    }

    _destroyUI() {
      if (this.el) { this.el.remove(); this.el = null; }
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    }

    _loop() {
      this._rafId = requestAnimationFrame((now) => {
        if (this.visible) {
          if (now - this._lastUpdate >= this._updateIntervalMs) {
            this._update(now);
            this._lastUpdate = now;
          }
          this._loop();
        }
      });
    }

    _update(now) {
      if (!this.el) return;

      const pm = window.threeWorld?.performanceManager;
      const tw = window.threeWorld;

      // FPS + frame time
      const fps = pm ? (pm.fps ?? 0) : (tw ? this._calcFPS(pm) : 0);
      const ft  = pm ? (pm.frameTimeMs ?? 0) : 0;

      this._setText('phud-fps',  fps.toFixed(0), fps < 30 ? 'red' : fps < 50 ? 'yellow' : 'green');
      this._setText('phud-ft',   ft.toFixed(1) + 'ms', ft > 20 ? 'red' : ft > 14 ? 'yellow' : 'green');

      // Three.js renderer stats
      if (tw?.renderer?.info) {
        const info = tw.renderer.info;
        this._setText('phud-draws', (info.render?.calls ?? '—').toString());
        this._setText('phud-tris',  this._formatK(info.render?.triangles ?? 0));
        this._setText('phud-geoms', (info.memory?.geometries ?? '—').toString());
        this._setText('phud-tex',   (info.memory?.textures ?? '—').toString());
      }

      // Effective DPR
      const gpm = window.GraphicsProfileManager;
      if (gpm) {
        this._setText('phud-dpr', gpm.getEffectiveDPR().toFixed(2));
        this._setText('phud-qual', gpm.currentQuality);
        const qualEl = this.el.querySelector('#phud-qual');
        if (qualEl) qualEl.textContent = gpm.currentQuality;
      }

      // World chunks
      const ws = window.worldStreamingSystem || window.WorldStreaming;
      if (ws?.getStats) {
        const s = ws.getStats();
        this._setText('phud-chunks', `${s.loaded ?? '?'}/${s.total ?? '?'}`);
      }

      // NPCs & wildlife
      const lw = tw?.livingWorld;
      if (lw) {
        this._setText('phud-npcs',    (lw.activeNPCs?.size ?? lw.npcs?.length ?? '?').toString());
        this._setText('phud-wildlife',(lw.activeWildlife?.size ?? lw.wildlife?.length ?? '?').toString());
      }

      // Network
      const mp = window.multiplayerManager || window.multiplayer;
      if (mp) {
        this._setText('phud-rtt', mp.pingMs != null ? `${mp.pingMs}ms` : '—');
      }

      // Asset Manager
      const am = window.AssetManager;
      if (am) {
        const s = am.getStats();
        this._setText('phud-assetq',  `${s.active}+${s.queued}`);
        this._setText('phud-assetmb', `${s.estimatedMB}MB`);
      }

      // Connection
      const cm = window.OnlineConnectionManager;
      if (cm) {
        const state = cm.getState();
        this._setText('phud-conn', state, state === 'ONLINE' ? 'green' : state === 'OFFLINE' ? 'red' : 'yellow');
      }

      // Reset Three.js render call counter each frame
      if (tw?.renderer?.info) {
        tw.renderer.info.reset?.();
      }
    }

    _setText(id, text, colorClass = '') {
      const el = this.el?.querySelector(`#${id}`);
      if (!el) return;
      el.textContent = text;
      el.className = 'phud-val' + (colorClass ? ` ${colorClass}` : '');
      if (id === 'phud-gpu') el.className += ' phud-gpu';
    }

    _formatK(n) {
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
      if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
      return n.toString();
    }

    _exportSnapshot() {
      const snapshot = {
        timestamp:     new Date().toISOString(),
        gpu:           window.GPUCapability?.getSummary?.() || 'N/A',
        graphicsProfile: window.GraphicsProfileManager?.getSummary?.() || 'N/A',
        assetManager:  window.AssetManager?.getStats?.() || 'N/A',
        connection:    window.OnlineConnectionManager?.getState?.() || 'N/A',
        renderer:      window.threeWorld?.renderer?.info || 'N/A',
        resourceDisposal: window.ResourceDisposalManager?.getStats?.() || 'N/A',
        userAgent:     navigator.userAgent,
        screenRes:     `${window.screen.width}×${window.screen.height}`,
        innerSize:     `${window.innerWidth}×${window.innerHeight}`,
        devicePixelRatio: window.devicePixelRatio,
      };
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ww-perf-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  window.PerfHUD = new PerfHUD();

})();
