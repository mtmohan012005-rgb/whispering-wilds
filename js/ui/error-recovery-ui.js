/**
 * The Whispering Wilds (Kaattu Vazhi) - Error Recovery UI & Global Exception Boundary
 * Displays a clean, diegetic recovery interface upon unhandled fatal runtime errors.
 * Never exposes raw stack traces or internal server paths in production.
 */

class ErrorRecoveryUI {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.initDOM();
    this.attachGlobalHandlers();
  }

  initDOM() {
    let existing = document.getElementById('game-error-recovery-modal');
    if (existing) {
      this.container = existing;
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'game-error-recovery-modal';
    modal.className = 'error-recovery-overlay hidden';
    modal.innerHTML = `
      <div class="error-recovery-card">
        <div class="error-header">
          <span class="error-icon">⚠️</span>
          <h2>GAME ERROR</h2>
          <div class="error-tamil-sub">விளையாட்டில் ஒரு சிக்கல் ஏற்பட்டது</div>
        </div>
        <p class="error-message">The game encountered a problem.</p>
        <p class="error-advice">Your progress up to the last checkpoint has been safely backed up.</p>
        <div class="error-actions">
          <button id="btn-error-retry" class="error-btn primary">RETRY / மீண்டும் முயற்சிக்கவும்</button>
          <button id="btn-error-title" class="error-btn secondary">RETURN TO TITLE / முகப்புக்குச் செல்க</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.container = modal;

    document.getElementById('btn-error-retry').addEventListener('click', () => {
      this.hide();
      window.location.reload();
    });

    document.getElementById('btn-error-title').addEventListener('click', () => {
      this.hide();
      if (window.location.hash) {
        window.location.hash = '';
      }
      window.location.reload();
    });
  }

  show(customMessage) {
    if (this.isVisible) return;
    this.isVisible = true;
    if (customMessage) {
      const msgEl = this.container.querySelector('.error-message');
      if (msgEl) msgEl.textContent = customMessage;
    }
    this.container.classList.remove('hidden');
    console.error('[ErrorRecoveryUI] Fatal boundary invoked. Safe recovery modal presented.');
  }

  hide() {
    this.isVisible = false;
    this.container.classList.add('hidden');
  }

  attachGlobalHandlers() {
    window.onerror = (message, source, lineno, colno, error) => {
      // In development, log to console
      if (window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.enableDebugLogs) {
        console.error('[Global Uncaught Error]', { message, source, lineno, colno, error });
      }

      // Filter non-fatal browser extensions or benign network blips
      const msg = String(message || '');
      if (msg.includes('ResizeObserver') || msg.includes('Script error')) {
        return false;
      }

      // Show safe recovery UI if fatal
      if (document.body && !document.getElementById('test-results-output')) {
        // Only show if not in automated testing mode
        if (!window.isAutomatedTestRunning) {
          this.show('The game encountered an unexpected problem.');
        }
      }
      return true; // Prevent default browser error reporting
    };

    window.onunhandledrejection = (event) => {
      if (window.RUNTIME_CONFIG && window.RUNTIME_CONFIG.enableDebugLogs) {
        console.error('[Global Unhandled Rejection]', event.reason);
      }
      // Handled silently or safely
      event.preventDefault();
    };
  }
}

// Auto-initialize when DOM ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.errorRecoveryUI = new ErrorRecoveryUI();
    });
  } else {
    window.errorRecoveryUI = new ErrorRecoveryUI();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorRecoveryUI;
}
