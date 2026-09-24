// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - COMPATIBILITY WARNING UI
// Non-alarming, informative compatibility and WebGL guidance notice
// ============================================================================

(function() {
  'use strict';

  class CompatibilityWarningUI {
    constructor() {
      this.element = null;
    }

    show(reason = 'WebGL acceleration unavailable') {
      if (typeof document === 'undefined') return;

      let el = document.getElementById('compatibility-warning-modal');
      if (!el) {
        el = document.createElement('div');
        el.id = 'compatibility-warning-modal';
        el.style.cssText = `
          position: fixed; inset: 0; background: rgba(10, 15, 26, 0.96);
          display: flex; align-items: center; justify-content: center;
          z-index: 999999; font-family: 'Inter', sans-serif; color: #f1f5f9;
        `;
        document.body.appendChild(el);
      }

      el.innerHTML = `
        <div style="background: #0f172a; border: 1px solid #f97316; padding: 32px; border-radius: 12px; max-width: 460px; width: 90%; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 8px;">⚠️</div>
          <h2 style="color: #f97316; margin: 0 0 12px 0; font-size: 18px;">GRAPHICS COMPATIBILITY NOTICE</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin-bottom: 16px;">
            Hardware acceleration is currently limited: <i>${reason}</i>.
          </p>
          <div style="text-align: left; background: rgba(30, 41, 59, 0.6); padding: 14px; border-radius: 8px; font-size: 12px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px;">
            • Verify hardware acceleration is enabled in your browser settings.<br>
            • Update graphics drivers for optimal performance.<br>
            • The game will run using safe software fallback rendering.
          </div>
          <button id="btn-compat-continue" style="background: #e2b170; color: #0f172a; border: none; padding: 10px 24px; border-radius: 6px; font-weight: bold; cursor: pointer;">
            Continue Anyway
          </button>
        </div>
      `;

      el.querySelector('#btn-compat-continue')?.addEventListener('click', () => {
        el.style.display = 'none';
      });

      el.style.display = 'flex';
      this.element = el;
    }

    hide() {
      if (this.element) {
        this.element.style.display = 'none';
      }
    }
  }

  const instance = new CompatibilityWarningUI();

  if (typeof window !== 'undefined') {
    window.CompatibilityWarningUI = CompatibilityWarningUI;
    window.compatibilityWarningUI = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CompatibilityWarningUI, compatibilityWarningUI: instance };
  }
})();
