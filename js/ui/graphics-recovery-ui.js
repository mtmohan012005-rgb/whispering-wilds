/**
 * The Whispering Wilds - Graphics Recovery UI
 * Safe recovery dialogue shown when renderer fails repeatedly.
 * Offers Retry, Use Safe Settings, or Return to Menu without exposing raw stack traces.
 */
(function(root) {
  'use strict';

  class GraphicsRecoveryUI {
    constructor() {
      this.modalEl = null;
      this.initDOM();
    }

    initDOM() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('graphics-recovery-modal')) {
        this.modalEl = document.getElementById('graphics-recovery-modal');
        return;
      }

      this.modalEl = document.createElement('div');
      this.modalEl.id = 'graphics-recovery-modal';
      this.modalEl.className = 'graphics-recovery-modal hidden';
      this.modalEl.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 10, 10, 0.92);
        display: flex; align-items: center; justify-content: center;
        z-index: 10001;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #f5f5f5;
      `;

      this.modalEl.innerHTML = `
        <div style="background: #212121; border: 1px solid #ff9800; border-radius: 8px; width: 480px; max-width: 90vw; padding: 24px; box-shadow: 0 16px 40px rgba(0,0,0,0.8); text-align: center;">
          <h2 style="margin: 0 0 12px 0; color: #ffb74d; font-size: 1.3rem;">GRAPHICS RECOVERY</h2>
          <p id="graphics-recovery-msg" style="color: #e0e0e0; font-size: 0.95rem; line-height: 1.5; margin-bottom: 24px;">
            The current graphics configuration could not be used safely.
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="recovery-retry-btn" style="background: #2e7d32; color: white; border: none; padding: 10px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">RETRY</button>
            <button id="recovery-safemode-btn" style="background: #e65100; color: white; border: none; padding: 10px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">USE SAFE SETTINGS</button>
            <button id="recovery-menu-btn" style="background: #424242; color: white; border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer;">RETURN TO MENU</button>
          </div>
        </div>
      `;

      document.body.appendChild(this.modalEl);

      const retryBtn = this.modalEl.querySelector('#recovery-retry-btn');
      const safeBtn = this.modalEl.querySelector('#recovery-safemode-btn');
      const menuBtn = this.modalEl.querySelector('#recovery-menu-btn');

      if (retryBtn) {
        retryBtn.onclick = () => {
          this.hide();
          if (root.GraphicsBackendManagerInstance) {
            root.GraphicsBackendManagerInstance.rebuildResourcesAfterContextRestore();
          }
        };
      }

      if (safeBtn) {
        safeBtn.onclick = () => {
          this.hide();
          if (root.RuntimeCompatibilitySystemInstance) {
            root.RuntimeCompatibilitySystemInstance.enableSafeMode();
          }
        };
      }

      if (menuBtn) {
        menuBtn.onclick = () => {
          this.hide();
          if (root.GameLifecycle && typeof root.GameLifecycle.returnToMenu === 'function') {
            root.GameLifecycle.returnToMenu();
          } else {
            window.location.reload();
          }
        };
      }
    }

    show(message = 'The current graphics configuration could not be used safely.') {
      if (!this.modalEl) this.initDOM();
      if (!this.modalEl) return;

      const msgEl = this.modalEl.querySelector('#graphics-recovery-msg');
      if (msgEl) msgEl.textContent = message;

      this.modalEl.classList.remove('hidden');
      this.modalEl.style.display = 'flex';
    }

    hide() {
      if (this.modalEl) {
        this.modalEl.classList.add('hidden');
        this.modalEl.style.display = 'none';
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphicsRecoveryUI;
  } else {
    root.GraphicsRecoveryUI = new GraphicsRecoveryUI();
  }
})(typeof window !== 'undefined' ? window : global);
