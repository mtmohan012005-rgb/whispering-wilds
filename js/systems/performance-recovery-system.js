// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PERFORMANCE RECOVERY SYSTEM
// WebGL context restoration, Performance Safe Mode & Graceful Error Boundary
// ============================================================================

(function() {
  'use strict';

  class PerformanceRecoverySystem {
    constructor() {
      this.isSafeModeActive = false;
      this.isProtectionModeActive = false;
      this.consecutiveCrashCount = 0;
      this.lastCrashTime = 0;
      this.protectionCooldownTimer = 0;
      this.activeModal = null;

      this._initGlobalErrorCatchers();
    }

    _initGlobalErrorCatchers() {
      if (typeof window === 'undefined') return;

      window.addEventListener('error', (event) => {
        this._handleScriptError(event.error || event.message);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this._handleScriptError(event.reason);
      });
    }

    _handleScriptError(err) {
      const errMsg = err ? (err.message || String(err)) : 'Unknown error';
      // Suppress harmless resize or audio errors from crashing renderer
      if (errMsg.includes('ResizeObserver') || errMsg.includes('AudioContext')) {
        return;
      }

      console.warn('[PerformanceRecoverySystem] Non-fatal script warning captured:', errMsg);
    }

    handleContextLost(lossCount) {
      if (lossCount >= 2) {
        console.warn('[PerformanceRecoverySystem] Multiple GPU context losses detected. Triggering Performance Safe Mode.');
        this.activateSafeMode('Repeated WebGL context loss');
      } else {
        this.showRecoveryModal({
          title: { en: 'Graphics Context Interrupted', ta: 'வரைகலை சூழல் தடைபட்டது' },
          message: { en: 'Reinitializing graphics hardware...', ta: 'வரைகலை சாதனங்கள் மீட்டமைக்கப்படுகின்றன...' },
          showSpinner: true
        });
      }
    }

    handleContextRestored() {
      this.hideRecoveryModal();
    }

    activateSafeMode(reason = 'Manual or repeated failure') {
      this.isSafeModeActive = true;
      console.warn(`[PerformanceRecoverySystem] 🛡️ Activating PERFORMANCE SAFE MODE (${reason})`);

      if (window.performanceManager) {
        window.performanceManager.applyProfile('SAFE_MODE');
      }

      if (window.performanceSafeModeUI) {
        window.performanceSafeModeUI.showBanner(reason);
      }
    }

    deactivateSafeMode() {
      this.isSafeModeActive = false;
      if (window.performanceManager) {
        const rec = window.hardwareDetectionSystem?.getRecommendation()?.tier || 'MEDIUM';
        window.performanceManager.applyProfile(rec);
      }
      if (window.performanceSafeModeUI) {
        window.performanceSafeModeUI.hideBanner();
      }
    }

    /**
     * Triggered when frame time drops below critical floor (>60ms for several seconds)
     */
    enterPerformanceProtection() {
      if (this.isProtectionModeActive) return;
      this.isProtectionModeActive = true;
      console.warn('[PerformanceRecoverySystem] ⚠️ Entering Performance Protection Mode to maintain playability.');

      if (window.performanceManager) {
        window.performanceManager.stepDownQuality();
      }
      this.protectionCooldownTimer = 10.0; // 10 seconds hysteresis before any restoration
    }

    update(deltaTimeSeconds) {
      if (this.protectionCooldownTimer > 0) {
        this.protectionCooldownTimer -= deltaTimeSeconds;
        if (this.protectionCooldownTimer <= 0) {
          this.isProtectionModeActive = false;
        }
      }
    }

    showRecoveryModal(options = {}) {
      if (typeof document === 'undefined') return;
      let el = document.getElementById('perf-recovery-modal');
      if (!el) {
        el = document.createElement('div');
        el.id = 'perf-recovery-modal';
        el.style.cssText = `
          position: fixed; inset: 0; background: rgba(8, 12, 22, 0.94);
          display: flex; align-items: center; justify-content: center;
          z-index: 999999; font-family: 'Inter', sans-serif; color: #f1f5f9;
        `;
        document.body.appendChild(el);
      }

      el.innerHTML = `
        <div style="background: #111827; border: 1px solid #e2b170; padding: 28px; border-radius: 12px; max-width: 440px; text-align: center;">
          <h3 style="color: #e2b170; margin-top: 0;">${options.title?.en || 'Graphics Recovery'}</h3>
          <p style="color: #94a3b8; font-size: 14px;">${options.message?.en || 'Recovering renderer...'}</p>
          ${options.showSpinner ? '<div style="margin: 16px 0; color: #38bdf8;">⏳ Reconnecting...</div>' : ''}
          <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
            <button id="btn-safe-mode" style="background: #e2b170; color: #0f172a; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;">Launch Safe Mode</button>
            <button id="btn-menu" style="background: #334155; color: #f1f5f9; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Main Menu</button>
          </div>
        </div>
      `;

      el.querySelector('#btn-safe-mode')?.addEventListener('click', () => {
        this.hideRecoveryModal();
        this.activateSafeMode('Player selected Safe Mode');
      });

      el.querySelector('#btn-menu')?.addEventListener('click', () => {
        this.hideRecoveryModal();
        if (window.GameLifecycle) window.GameLifecycle.transitionTo('MAIN_MENU');
        if (window.MainMenuUI) window.MainMenuUI.show();
      });

      el.style.display = 'flex';
      this.activeModal = el;
    }

    hideRecoveryModal() {
      if (this.activeModal) {
        this.activeModal.style.display = 'none';
      }
    }

    showRendererFailureModal() {
      this.showRecoveryModal({
        title: { en: 'Graphics Hardware Unresponsive', ta: 'வரைகலை வன்பொருள் பதிலளிக்கவில்லை' },
        message: { en: 'The graphics device could not be automatically restored. Would you like to launch in Safe Mode?', ta: 'வரைகலை சாதனத்தை மீட்டமைக்க முடியவில்லை. பாதுகாப்பான முறையில் தொடங்க விரும்புகிறீர்களா?' },
        showSpinner: false
      });
    }
  }

  const instance = new PerformanceRecoverySystem();

  if (typeof window !== 'undefined') {
    window.PerformanceRecoverySystem = PerformanceRecoverySystem;
    window.performanceRecoverySystem = instance;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceRecoverySystem, performanceRecoverySystem: instance };
  }
})();
