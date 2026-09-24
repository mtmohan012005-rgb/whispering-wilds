// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PERFORMANCE SAFE MODE UI
// Persistent Safe Mode indicator banner with exit option
// ============================================================================

(function() {
  'use strict';

  class PerformanceSafeModeUI {
    constructor() {
      this.bannerElement = null;
    }

    showBanner(reason = '') {
      if (typeof document === 'undefined') return;

      let el = document.getElementById('perf-safe-mode-banner');
      if (!el) {
        el = document.createElement('div');
        el.id = 'perf-safe-mode-banner';
        el.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #7c2d12;
          color: #fef08a;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 999999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        `;
        document.body.appendChild(el);
      }

      el.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>🛡️ <b>PERFORMANCE SAFE MODE ACTIVE</b></span>
          <span style="color: #fde047; font-size: 11px;">(${reason || 'Minimal settings enabled for stability'})</span>
        </div>
        <button id="btn-exit-safemode" style="background: #facc15; color: #713f12; border: none; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer;">
          Restore Normal Quality
        </button>
      `;

      el.querySelector('#btn-exit-safemode')?.addEventListener('click', () => {
        if (window.performanceRecoverySystem) {
          window.performanceRecoverySystem.deactivateSafeMode();
        }
      });

      el.style.display = 'flex';
      this.bannerElement = el;
    }

    hideBanner() {
      if (this.bannerElement) {
        this.bannerElement.style.display = 'none';
      }
    }
  }

  const instance = new PerformanceSafeModeUI();

  if (typeof window !== 'undefined') {
    window.PerformanceSafeModeUI = PerformanceSafeModeUI;
    window.performanceSafeModeUI = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceSafeModeUI, performanceSafeModeUI: instance };
  }
})();
