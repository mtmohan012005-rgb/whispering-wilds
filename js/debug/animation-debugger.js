/**
 * js/debug/animation-debugger.js
 * The Whispering Wilds (Kaattu Vazhi) - Developer Animation Debugger
 *
 * Implements F6 debug overlay displaying active animation state, blend weights,
 * IK status, LOD tier, motion parameters, and animation CPU metrics.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AnimationDebugger = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class AnimationDebugger {
    constructor() {
      this.visible = false;
      this.container = null;
      this.controller = null;
      this.perfSystem = null;

      this._initDOM();
      this._bindKey();
    }

    _initDOM() {
      if (typeof document === 'undefined') return;

      let el = document.getElementById('animation-debug-overlay');
      if (!el) {
        el = document.createElement('div');
        el.id = 'animation-debug-overlay';
        el.style.cssText = `
          position: fixed;
          top: 15px;
          right: 15px;
          width: 320px;
          background: rgba(18, 22, 28, 0.88);
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 8px;
          color: #e0e6ed;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.5;
          padding: 12px;
          z-index: 99999;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          display: none;
        `;
        document.body.appendChild(el);
      }
      this.container = el;
    }

    _bindKey() {
      if (typeof window === 'undefined') return;
      window.addEventListener('keydown', (e) => {
        if (e.code === 'F6') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    setController(controller) {
      this.controller = controller;
    }

    setPerfSystem(perfSystem) {
      this.perfSystem = perfSystem;
    }

    toggle() {
      this.visible = !this.visible;
      if (this.container) {
        this.container.style.display = this.visible ? 'block' : 'none';
      }
      return this.visible;
    }

    /**
     * Updates debug overlay telemetry contents
     */
    update() {
      if (!this.visible || !this.container) return;

      const ctrl = this.controller || (window.player && window.player.animationController);
      const perf = this.perfSystem || window.ProductionAnimationPerformanceSystem;

      let html = `
        <div style="font-weight: bold; color: #d4af37; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 8px;">
          🏃 ANIMATION DIAGNOSTICS (F6)
        </div>
      `;

      if (ctrl) {
        const state = ctrl.currentState || 'UNKNOWN';
        const clip = ctrl.currentClipId || 'None';
        const lod = ctrl.lodTier ?? 0;
        const quality = ctrl.qualityLevel || 'HIGH';
        const footIKActive = ctrl.footIK ? ctrl.footIK.enabled : false;
        const handIKActive = ctrl.handIK ? ctrl.handIK.enabled : false;

        html += `
          <div><strong>State:</strong> <span style="color:#4fc3f7">${state}</span></div>
          <div><strong>Clip:</strong> <span style="color:#81c784">${clip}</span></div>
          <div><strong>LOD Tier:</strong> LOD${lod} (${quality})</div>
          <div><strong>Foot IK:</strong> ${footIKActive ? '🟢 ACTIVE' : '⚪ OFF'}</div>
          <div><strong>Hand IK:</strong> ${handIKActive ? '🟢 ACTIVE' : '⚪ OFF'}</div>
        `;
      } else {
        html += `<div style="color: #bbb;">No active controller bound.</div>`;
      }

      if (perf && perf.metrics) {
        html += `
          <div style="margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px;">
            <div><strong>Active Mixers:</strong> ${perf.metrics.totalControllers || 0}</div>
            <div><strong>Update CPU:</strong> ${(perf.metrics.lastUpdateMs || 0).toFixed(2)} ms</div>
            <div><strong>LOD Distribution:</strong> L0:${perf.metrics.lod0Count} | L1:${perf.metrics.lod1Count} | L2:${perf.metrics.lod2Count} | L3:${perf.metrics.lod3Count}</div>
          </div>
        `;
      }

      this.container.innerHTML = html;
    }
  }

  // Global singleton
  if (typeof window !== 'undefined') {
    window.ProductionAnimationDebugger = new AnimationDebugger();
  }

  return AnimationDebugger;
});
