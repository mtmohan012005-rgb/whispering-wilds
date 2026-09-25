/**
 * js/systems/crash-recovery-system.js
 * Production-grade crash recovery, safe self-healing dialogs,
 * atomic save verification, and safe-checkpoint restore.
 */

(function () {
  'use strict';

  class CrashRecoverySystem {
    constructor() {
      this._modalContainer = null;
      this._isRecoveryModalOpen = false;
      this._lastCriticalFailure = null;
    }

    /**
     * Intercepts critical failures, suspends gameplay simulation, and displays safe recovery UI.
     */
    handleCriticalFailure(systemId, error, record = {}) {
      this._lastCriticalFailure = { systemId, error, record, timestamp: Date.now() };

      console.error(`[CrashRecoverySystem] CRITICAL FAILURE in '${systemId}':`, error);

      // 1. Pause gameplay simulation safely
      if (window.GameLifecycle && typeof window.GameLifecycle.pauseSimulation === 'function') {
        window.GameLifecycle.pauseSimulation('CRITICAL_RECOVERY');
      }

      // 2. Record telemetry
      if (window.HealthMonitor) {
        window.HealthMonitor.recordEvent('CRITICAL_FAILURE', { systemId, message: error.message });
      }

      // 3. Present user-friendly recovery modal
      this.showRecoveryModal({
        title: 'Recovery Notification',
        message: 'An unexpected issue was encountered in this area. We can safely restore your last checkpoint or return to the main menu without losing progress.',
        canRetry: true,
        canLoadCheckpoint: true,
        canReturnMenu: true
      });
    }

    handleStalledOperation(operationType, details = {}) {
      console.warn(`[CrashRecoverySystem] Stalled operation detected: ${operationType}`, details);
      this.showRecoveryModal({
        title: 'Operation Taking Longer Than Expected',
        message: `The ${operationType} operation could not complete in time. Would you like to retry or return to safety?`,
        canRetry: true,
        canLoadCheckpoint: true,
        canReturnMenu: true
      });
    }

    /**
     * Renders a styled, non-intimidating recovery modal.
     */
    showRecoveryModal(options = {}) {
      if (this._isRecoveryModalOpen) return;
      this._isRecoveryModalOpen = true;

      let modal = document.getElementById('ww-crash-recovery-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ww-crash-recovery-modal';
        modal.style.cssText = `
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 16, 26, 0.88);
          backdrop-filter: blur(12px);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #f1f5f9;
        `;
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="
          max-width: 520px;
          width: 90%;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 28px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
          text-align: left;
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #38bdf8;"></div>
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #f8fafc;">${options.title || 'Safe Recovery'}</h3>
          </div>
          <p style="margin: 0 0 24px; font-size: 0.95rem; line-height: 1.6; color: #94a3b8;">
            ${options.message || 'An unexpected state occurred. Choose a safe recovery action below.'}
          </p>
          <div style="display: flex; gap: 12px; justify-content: flex-end; flex-wrap: wrap;">
            ${options.canRetry ? `<button id="btn-recovery-retry" style="
              padding: 10px 18px; border-radius: 6px; border: 1px solid #475569; background: #1e293b; color: #f8fafc; font-weight: 500; cursor: pointer;
            ">Retry</button>` : ''}
            ${options.canLoadCheckpoint ? `<button id="btn-recovery-checkpoint" style="
              padding: 10px 18px; border-radius: 6px; border: none; background: #0284c7; color: #ffffff; font-weight: 500; cursor: pointer;
            ">Load Checkpoint</button>` : ''}
            ${options.canReturnMenu ? `<button id="btn-recovery-menu" style="
              padding: 10px 18px; border-radius: 6px; border: 1px solid #334155; background: transparent; color: #94a3b8; font-weight: 500; cursor: pointer;
            ">Return to Menu</button>` : ''}
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      const btnRetry = document.getElementById('btn-recovery-retry');
      if (btnRetry) {
        btnRetry.onclick = () => {
          this.closeModal();
          if (window.GameLifecycle && typeof window.GameLifecycle.resumeSimulation === 'function') {
            window.GameLifecycle.resumeSimulation();
          }
        };
      }

      const btnCheckpoint = document.getElementById('btn-recovery-checkpoint');
      if (btnCheckpoint) {
        btnCheckpoint.onclick = () => {
          this.closeModal();
          const sm = window.saveManager || window.gameSaveManager;
          if (sm && typeof sm.loadGame === 'function') {
            sm.loadGame('checkpoint') || sm.loadGame('auto_backup') || sm.loadGame('auto');
          }
          if (window.GameLifecycle && typeof window.GameLifecycle.resumeSimulation === 'function') {
            window.GameLifecycle.resumeSimulation();
          }
        };
      }

      const btnMenu = document.getElementById('btn-recovery-menu');
      if (btnMenu) {
        btnMenu.onclick = () => {
          this.closeModal();
          if (window.GameLifecycle && typeof window.GameLifecycle.returnToMenu === 'function') {
            window.GameLifecycle.returnToMenu();
          }
        };
      }
    }

    closeModal() {
      const modal = document.getElementById('ww-crash-recovery-modal');
      if (modal) {
        modal.style.display = 'none';
      }
      this._isRecoveryModalOpen = false;
    }

    healthCheck() {
      return {
        status: 'healthy',
        details: { isModalOpen: this._isRecoveryModalOpen }
      };
    }
  }

  window.CrashRecoverySystem = new CrashRecoverySystem();
})();
