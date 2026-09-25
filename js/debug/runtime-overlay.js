/**
 * js/debug/runtime-overlay.js
 * Developer runtime HUD overlay displaying subsystem health,
 * active listeners, timers, memory, and recent event breadcrumbs.
 * Toggled via F2 or wwDiag.toggleOverlay().
 */

(function () {
  'use strict';

  class RuntimeOverlay {
    constructor() {
      this._container = null;
      this._isVisible = false;
      this._updateTimer = null;
      this._initKeybinding();
    }

    _initKeybinding() {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F2') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    toggle() {
      if (this._isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }

    show() {
      if (!this._container) {
        this._createDOM();
      }
      this._container.style.display = 'block';
      this._isVisible = true;
      this._startUpdating();
    }

    hide() {
      if (this._container) {
        this._container.style.display = 'none';
      }
      this._isVisible = false;
      this._stopUpdating();
    }

    _createDOM() {
      this._container = document.createElement('div');
      this._container.id = 'ww-runtime-debug-overlay';
      this._container.style.cssText = `
        position: fixed;
        bottom: 16px;
        right: 16px;
        width: 360px;
        max-height: 480px;
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 14px;
        font-family: monospace;
        font-size: 11px;
        color: #e2e8f0;
        z-index: 999998;
        pointer-events: auto;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
      `;
      document.body.appendChild(this._container);
    }

    _startUpdating() {
      this._stopUpdating();
      this._update();
      this._updateTimer = setInterval(() => this._update(), 1000);
    }

    _stopUpdating() {
      if (this._updateTimer) {
        clearInterval(this._updateTimer);
        this._updateTimer = null;
      }
    }

    _update() {
      if (!this._container || !this._isVisible) return;

      const health = window.HealthMonitor ? window.HealthMonitor.getHealthReport() : { overall: 'UNKNOWN', subsystems: {} };
      const listeners = window.EventListenerRegistry ? window.EventListenerRegistry.getTotalCount() : 0;
      const timers = window.TimerRegistry ? window.TimerRegistry.getActiveTimerCount() : 0;
      const loopActive = window.RenderLoopRegistry ? window.RenderLoopRegistry.hasActiveLoop() : false;
      const events = window.HealthMonitor ? window.HealthMonitor.getRecentEvents(4) : [];

      let healthColor = '#22c55e';
      if (health.overall === 'FAILED') healthColor = '#ef4444';
      else if (health.overall === 'DEGRADED') healthColor = '#f59e0b';

      let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px; margin-bottom: 8px;">
          <strong style="color: #38bdf8;">RUNTIME QA MONITOR (F2)</strong>
          <span style="color: ${healthColor}; font-weight: bold;">● ${health.overall}</span>
        </div>
        <div style="margin-bottom: 8px; line-height: 1.5;">
          <div>Listeners: <strong>${listeners}</strong> | Timers: <strong>${timers}</strong></div>
          <div>RAF Loop Active: <strong>${loopActive}</strong></div>
        </div>
        <div style="border-top: 1px solid #1e293b; padding-top: 6px; margin-bottom: 8px;">
          <strong style="color: #94a3b8;">SUBSYSTEMS</strong>
          <div style="max-height: 120px; overflow-y: auto; margin-top: 4px;">
      `;

      for (const [id, data] of Object.entries(health.subsystems || {})) {
        const dotColor = data.status === 'OK' ? '#22c55e' : (data.status === 'DEGRADED' ? '#f59e0b' : '#ef4444');
        html += `<div style="display: flex; justify-content: space-between;">
          <span>${id}</span>
          <span style="color: ${dotColor};">${data.status}</span>
        </div>`;
      }

      html += `</div></div>
        <div style="border-top: 1px solid #1e293b; padding-top: 6px;">
          <strong style="color: #94a3b8;">RECENT BREADCRUMBS</strong>
          <div style="margin-top: 4px; font-size: 10px; color: #cbd5e1;">
      `;

      for (const ev of events) {
        const time = new Date(ev.timestamp).toLocaleTimeString();
        html += `<div>[${time}] ${ev.type}</div>`;
      }

      html += `</div></div>`;
      this._container.innerHTML = html;
    }
  }

  window.RuntimeOverlay = new RuntimeOverlay();
})();
