// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - GRAPHICS RECOMMENDATION UI
// First-launch hardware recommendation modal with Apply / Customize options
// ============================================================================

(function() {
  'use strict';

  class GraphicsRecommendationUI {
    constructor() {
      this.element = null;
      this.onApplyCallback = null;
      this.onCustomizeCallback = null;
    }

    show(recommendation, onApply, onCustomize) {
      this.onApplyCallback = onApply;
      this.onCustomizeCallback = onCustomize;

      if (typeof document === 'undefined') return;

      let el = document.getElementById('graphics-recommendation-modal');
      if (!el) {
        el = document.createElement('div');
        el.id = 'graphics-recommendation-modal';
        el.style.cssText = `
          position: fixed; inset: 0; background: rgba(8, 12, 22, 0.88);
          display: flex; align-items: center; justify-content: center;
          z-index: 999998; font-family: 'Inter', sans-serif; color: #f1f5f9;
        `;
        document.body.appendChild(el);
      }

      const tier = recommendation?.tier || 'MEDIUM';
      const renderer = window.hardwareDetectionSystem?.detectedInfo?.gpuRenderer || 'Detected Hardware';

      el.innerHTML = `
        <div style="background: #0f172a; border: 1px solid rgba(226, 177, 112, 0.6); padding: 32px; border-radius: 12px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          <div style="font-size: 28px; margin-bottom: 8px;">⚙️</div>
          <h2 style="color: #e2b170; margin: 0 0 12px 0; font-size: 20px;">GRAPHICS CONFIGURATION</h2>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">
            Hardware detected: <b style="color: #e2e8f0;">${renderer}</b>.<br>
            We calibrated the optimal balance of visual fidelity and smooth gameplay for your system.
          </p>
          <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); padding: 14px; border-radius: 8px; margin-bottom: 24px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8;">Recommended Profile</div>
            <div style="font-size: 22px; font-weight: bold; color: #facc15; margin-top: 4px;">${tier}</div>
          </div>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="btn-apply-rec" style="background: #e2b170; color: #0f172a; border: none; padding: 10px 22px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">Apply Recommended</button>
            <button id="btn-custom-rec" style="background: #334155; color: #f1f5f9; border: 1px solid rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">Customize</button>
          </div>
        </div>
      `;

      el.querySelector('#btn-apply-rec')?.addEventListener('click', () => {
        this.hide();
        if (typeof this.onApplyCallback === 'function') this.onApplyCallback(tier);
      });

      el.querySelector('#btn-custom-rec')?.addEventListener('click', () => {
        this.hide();
        if (typeof this.onCustomizeCallback === 'function') this.onCustomizeCallback();
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

  const instance = new GraphicsRecommendationUI();

  if (typeof window !== 'undefined') {
    window.GraphicsRecommendationUI = GraphicsRecommendationUI;
    window.graphicsRecommendationUI = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GraphicsRecommendationUI, graphicsRecommendationUI: instance };
  }
})();
