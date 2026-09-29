// ============================================================================
// THE WHISPERING WILDS — ONLINE CONNECTION MANAGER
// Manages ONLINE / CONNECTING / RECONNECTING / OFFLINE / SERVER_ERROR states.
// Decoupled from the render loop — uses async polling only.
// ============================================================================

(function () {
  'use strict';

  const CONNECTION_STATE = {
    ONLINE: 'ONLINE',
    CONNECTING: 'CONNECTING',
    RECONNECTING: 'RECONNECTING',
    OFFLINE: 'OFFLINE',
    SERVER_ERROR: 'SERVER_ERROR',
  };

  class OnlineConnectionManager {
    constructor() {
      this.state = CONNECTION_STATE.CONNECTING;
      this.backendOk = false;
      this.networkOk = navigator.onLine !== false;
      this.retryCount = 0;
      this.maxRetries = 5;
      this.retryDelayMs = 2000;

      this._listeners = {};
      this._abortCtrl = null;
      this._healthTimer = null;
      this._checkInterval = 30_000; // re-check every 30 s while playing

      this._onlineHandler = () => { this.networkOk = true; this._onNetworkChange(); };
      this._offlineHandler = () => { this.networkOk = false; this._setState(CONNECTION_STATE.OFFLINE); };
    }

    // ------------------------------------------------------------------
    // PUBLIC API
    // ------------------------------------------------------------------
    on(event, cb) {
      (this._listeners[event] = this._listeners[event] || []).push(cb);
    }

    off(event, cb) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(f => f !== cb);
    }

    getState() { return this.state; }
    isOnline() { return this.state === CONNECTION_STATE.ONLINE; }

    // ------------------------------------------------------------------
    // START — call once during boot sequence
    // ------------------------------------------------------------------
    async start() {
      window.addEventListener('online', this._onlineHandler);
      window.addEventListener('offline', this._offlineHandler);

      if (!this.networkOk) {
        this._setState(CONNECTION_STATE.OFFLINE);
        return;
      }

      await this._initialCheck();
    }

    // ------------------------------------------------------------------
    // STOP — cleanup
    // ------------------------------------------------------------------
    stop() {
      window.removeEventListener('online', this._onlineHandler);
      window.removeEventListener('offline', this._offlineHandler);
      clearTimeout(this._healthTimer);
      this._abortCtrl?.abort();
    }

    // ------------------------------------------------------------------
    // MANUAL RETRY (called from UI Retry button)
    // ------------------------------------------------------------------
    async retry() {
      this.retryCount = 0;
      this._setState(CONNECTION_STATE.CONNECTING);
      await this._initialCheck();
    }

    // ------------------------------------------------------------------
    // INTERNAL
    // ------------------------------------------------------------------
    async _initialCheck() {
      this._setState(CONNECTION_STATE.CONNECTING);

      while (this.retryCount < this.maxRetries) {
        const ok = await this._checkBackendHealth();
        if (ok) {
          this.backendOk = true;
          this.retryCount = 0;
          this._setState(CONNECTION_STATE.ONLINE);
          this._schedulePeriodicCheck();
          return;
        }

        this.retryCount++;
        const delay = Math.min(this.retryDelayMs * Math.pow(1.5, this.retryCount), 30_000);
        console.warn(`[ConnectionManager] Backend unreachable (attempt ${this.retryCount}/${this.maxRetries}). Retry in ${(delay / 1000).toFixed(1)}s`);

        if (this.retryCount >= this.maxRetries) break;

        this._setState(CONNECTION_STATE.RECONNECTING);
        await this._sleep(delay);

        if (!this.networkOk) {
          this._setState(CONNECTION_STATE.OFFLINE);
          return;
        }
      }

      this._setState(CONNECTION_STATE.SERVER_ERROR);
    }

    async _checkBackendHealth() {
      // Backend URL — use NetworkConfig if available
      const baseUrl = (window.NetworkConfig && typeof window.NetworkConfig.getServerUrl === 'function')
        ? window.NetworkConfig.getServerUrl()
        : (window.BACKEND_URL || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''));

      this._abortCtrl?.abort();
      this._abortCtrl = new AbortController();

      try {
        const resp = await fetch(`${baseUrl}/api/v1/health`, {
          method: 'GET',
          signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : this._abortCtrl.signal,
          headers: { 'Accept': 'application/json' },
          cache: 'no-store',
        });
        if (resp.ok) {
          const json = await resp.json().catch(() => ({}));
          console.log('[ConnectionManager] Backend health OK:', json.status || 'ok');
          return true;
        }
        console.warn('[ConnectionManager] Backend health returned:', resp.status);
        return false;
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('[ConnectionManager] Health check failed:', e.message);
        }
        return false;
      }
    }

    _schedulePeriodicCheck() {
      clearTimeout(this._healthTimer);
      this._healthTimer = setTimeout(async () => {
        if (!this.networkOk) return;
        const ok = await this._checkBackendHealth();
        if (!ok && this.state === CONNECTION_STATE.ONLINE) {
          this.retryCount = 0;
          await this._initialCheck();
        } else if (ok && this.state !== CONNECTION_STATE.ONLINE) {
          this.retryCount = 0;
          this._setState(CONNECTION_STATE.ONLINE);
        }
        if (this.state === CONNECTION_STATE.ONLINE) {
          this._schedulePeriodicCheck();
        }
      }, this._checkInterval);
    }

    _onNetworkChange() {
      if (this.networkOk && this.state !== CONNECTION_STATE.ONLINE) {
        this.retryCount = 0;
        this._initialCheck();
      }
    }

    _setState(newState) {
      if (this.state === newState) return;
      console.log(`[ConnectionManager] State: ${this.state} → ${newState}`);
      this.state = newState;
      this._emit('stateChange', { state: newState });

      // Show/hide the connection overlay UI
      this._updateConnectionUI(newState);
    }

    _emit(event, data) {
      const cbs = this._listeners[event] || [];
      cbs.forEach(cb => { try { cb(data); } catch (e) { } });
    }

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // ------------------------------------------------------------------
    // CONNECTION UI — non-blocking overlay over the game
    // ------------------------------------------------------------------
    _updateConnectionUI(state) {
      let overlay = document.getElementById('ww-connection-overlay');

      if (state === CONNECTION_STATE.ONLINE) {
        if (overlay) {
          overlay.classList.add('ww-conn-hide');
          setTimeout(() => overlay?.remove(), 600);
        }
        return;
      }

      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ww-connection-overlay';
        overlay.innerHTML = `
          <div class="ww-conn-panel">
            <div class="ww-conn-icon" id="ww-conn-icon">🌐</div>
            <div class="ww-conn-title" id="ww-conn-title">Connecting…</div>
            <div class="ww-conn-sub"  id="ww-conn-sub">Reaching Whispering Wilds servers…</div>
            <div class="ww-conn-bar"><div class="ww-conn-bar-inner" id="ww-conn-bar-inner"></div></div>
            <div class="ww-conn-actions" id="ww-conn-actions"></div>
          </div>`;

        // Inject styles once
        if (!document.getElementById('ww-conn-style')) {
          const style = document.createElement('style');
          style.id = 'ww-conn-style';
          style.textContent = `
            #ww-connection-overlay {
              position:fixed; inset:0; z-index:99999;
              background: rgba(5,10,20,0.92);
              display:flex; align-items:center; justify-content:center;
              font-family:'Inter',system-ui,sans-serif;
              transition: opacity 0.5s ease;
            }
            #ww-connection-overlay.ww-conn-hide { opacity:0; pointer-events:none; }
            .ww-conn-panel {
              text-align:center; max-width:420px; padding:2.5rem;
              background: rgba(15,25,45,0.95);
              border:1px solid rgba(100,160,255,0.2);
              border-radius:1.25rem;
              box-shadow: 0 0 60px rgba(50,120,255,0.15);
              animation: ww-conn-fadein 0.4s ease;
            }
            @keyframes ww-conn-fadein { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
            .ww-conn-icon { font-size:3rem; margin-bottom:1rem; animation: ww-pulse 2s infinite; }
            @keyframes ww-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
            .ww-conn-title { font-size:1.4rem; font-weight:700; color:#e8f4ff; margin-bottom:0.5rem; }
            .ww-conn-sub   { font-size:0.95rem; color:#7fa8c8; margin-bottom:1.5rem; }
            .ww-conn-bar   { height:4px; background:rgba(100,160,255,0.15); border-radius:4px; overflow:hidden; margin-bottom:1.5rem; }
            .ww-conn-bar-inner { height:100%; width:40%; background:linear-gradient(90deg,#3a7ff6,#56cfff); animation:ww-loading 1.5s ease-in-out infinite; border-radius:4px; }
            @keyframes ww-loading { 0%{transform:translateX(-100%)} 100%{transform:translateX(250%)} }
            .ww-conn-actions { display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap; }
            .ww-conn-btn {
              padding:0.6rem 1.4rem; border-radius:0.5rem; cursor:pointer;
              font-size:0.9rem; font-weight:600; border:none; transition:all 0.2s;
            }
            .ww-conn-btn-primary { background:#2563eb; color:#fff; }
            .ww-conn-btn-primary:hover { background:#3b82f6; transform:translateY(-1px); }
            .ww-conn-btn-secondary { background:rgba(255,255,255,0.08); color:#aac; border:1px solid rgba(255,255,255,0.15); }
            .ww-conn-btn-secondary:hover { background:rgba(255,255,255,0.13); }
          `;
          document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
      }

      const icon = overlay.querySelector('#ww-conn-icon');
      const title = overlay.querySelector('#ww-conn-title');
      const sub = overlay.querySelector('#ww-conn-sub');
      const bar = overlay.querySelector('#ww-conn-bar-inner');
      const acts = overlay.querySelector('#ww-conn-actions');
      acts.innerHTML = '';

      switch (state) {
        case CONNECTION_STATE.CONNECTING:
          icon.textContent = '🌐';
          title.textContent = 'Connecting to Servers';
          sub.textContent = 'Establishing connection to Whispering Wilds online services…';
          bar.style.animation = 'ww-loading 1.5s ease-in-out infinite';
          break;
        case CONNECTION_STATE.RECONNECTING:
          icon.textContent = '🔄';
          title.textContent = 'Reconnecting…';
          sub.textContent = `Attempt ${this.retryCount}/${this.maxRetries} — Server temporarily unreachable.`;
          bar.style.animation = 'ww-loading 1.0s ease-in-out infinite';
          this._addButton(acts, 'Cancel', 'secondary', () => { this._setState(CONNECTION_STATE.OFFLINE); });
          break;
        case CONNECTION_STATE.OFFLINE:
          icon.textContent = '📡';
          title.textContent = 'No Network Connection';
          sub.textContent = 'The Whispering Wilds requires an internet connection for online services.';
          bar.style.animation = 'none';
          bar.style.width = '0';
          this._addButton(acts, '🔁 Retry', 'primary', () => this.retry());
          this._addButton(acts, '❌ Exit', 'secondary', () => window.close?.());
          break;
        case CONNECTION_STATE.SERVER_ERROR:
          icon.textContent = '⚠️';
          title.textContent = 'Service Unavailable';
          sub.textContent = 'Servers are temporarily unavailable. Please try again later.';
          bar.style.animation = 'none';
          bar.style.width = '0';
          this._addButton(acts, '🔁 Retry', 'primary', () => this.retry());
          this._addButton(acts, '❌ Exit', 'secondary', () => window.close?.());
          break;
      }
    }

    _addButton(container, label, type, onClick) {
      const btn = document.createElement('button');
      btn.className = `ww-conn-btn ww-conn-btn-${type}`;
      btn.textContent = label;
      btn.addEventListener('click', onClick);
      container.appendChild(btn);
    }
  }

  const instance = new OnlineConnectionManager();
  window.OnlineConnectionManager = instance;
  window.CONNECTION_STATE = CONNECTION_STATE;

})();
