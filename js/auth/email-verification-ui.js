// ============================================================================
// THE WHISPERING WILDS - EMAIL VERIFICATION FRONTEND UI
// Verification prompt modal, URL token handling, and resend cooldown timer
// ============================================================================

(function() {
  'use strict';

  class EmailVerificationUI {
    constructor() {
      this.modal = null;
      this.resendTimer = null;
      this.resendCooldown = 0;
      this._initDOM();
      this._checkUrlParameters();
    }

    _initDOM() {
      if (document.getElementById('email-verification-modal')) {
        this.modal = document.getElementById('email-verification-modal');
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'email-verification-modal';
      modal.className = 'auth-security-modal hidden';
      modal.innerHTML = `
        <div class="auth-security-backdrop"></div>
        <div class="auth-security-card">
          <div class="auth-security-header">
            <h3>✉️ VERIFY YOUR EMAIL ADDRESS</h3>
            <button id="close-email-verify-btn" class="auth-security-close">&times;</button>
          </div>
          <div class="auth-security-body">
            <p id="email-verify-msg">
              A verification link was sent to your email address. Please click the link or enter your 6-digit code to secure your cloud saves.
            </p>
            <div id="email-verify-feedback" class="auth-feedback-box hidden"></div>
            
            <div class="auth-action-row" style="margin-top: 20px;">
              <button id="resend-verification-btn" class="btn-auth-secondary">RESEND EMAIL</button>
              <button id="enter-otp-switch-btn" class="btn-auth-primary">ENTER 6-DIGIT CODE</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.modal = modal;

      const closeBtn = document.getElementById('close-email-verify-btn');
      if (closeBtn) closeBtn.addEventListener('click', () => this.hide());

      const resendBtn = document.getElementById('resend-verification-btn');
      if (resendBtn) {
        resendBtn.addEventListener('click', () => this.resendVerification());
      }

      const otpSwitchBtn = document.getElementById('enter-otp-switch-btn');
      if (otpSwitchBtn) {
        otpSwitchBtn.addEventListener('click', () => {
          this.hide();
          if (window.OtpUI) window.OtpUI.show('VERIFICATION');
        });
      }
    }

    _checkUrlParameters() {
      if (typeof window === 'undefined' || !window.location) return;

      const params = new URLSearchParams(window.location.search);
      const verifyToken = params.get('verifyToken');
      const verified = params.get('verified');
      const msg = params.get('msg');

      if (verifyToken) {
        this.submitVerificationToken(verifyToken);
      } else if (verified === 'true') {
        this.showSuccessBanner(msg || 'Your email address has been verified successfully!');
      }
    }

    async submitVerificationToken(token) {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.success) {
          this.showSuccessBanner(data.message || 'Email verified successfully! Your account is now secure.');
          // Update local AuthState if loaded
          if (window.AuthState && window.AuthState.user) {
            window.AuthState.user.email_verified = true;
          }
        } else {
          this.showErrorBanner(data.reason || 'Verification failed or link expired.');
        }
      } catch (err) {
        this.showErrorBanner('Network error verifying token.');
      }
    }

    async resendVerification() {
      if (this.resendCooldown > 0) return;

      const btn = document.getElementById('resend-verification-btn');
      const feedback = document.getElementById('email-verify-feedback');

      try {
        const res = await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();

        if (feedback) {
          feedback.classList.remove('hidden');
          feedback.className = `auth-feedback-box ${data.success ? 'success' : 'error'}`;
          feedback.innerText = data.message || data.reason;
        }

        if (data.success) {
          this._startCooldown(60);
        } else if (data.retryAfterSec) {
          this._startCooldown(data.retryAfterSec);
        }
      } catch (err) {
        if (feedback) {
          feedback.classList.remove('hidden');
          feedback.className = 'auth-feedback-box error';
          feedback.innerText = 'Unable to send verification request.';
        }
      }
    }

    _startCooldown(seconds) {
      this.resendCooldown = seconds;
      const btn = document.getElementById('resend-verification-btn');
      if (btn) btn.disabled = true;

      if (this.resendTimer) clearInterval(this.resendTimer);
      this.resendTimer = setInterval(() => {
        this.resendCooldown--;
        if (btn) btn.innerText = `RESEND IN ${this.resendCooldown}s`;
        if (this.resendCooldown <= 0) {
          clearInterval(this.resendTimer);
          if (btn) {
            btn.disabled = false;
            btn.innerText = 'RESEND EMAIL';
          }
        }
      }, 1000);
    }

    show(message) {
      if (!this.modal) return;
      if (message) {
        const msgEl = document.getElementById('email-verify-msg');
        if (msgEl) msgEl.innerText = message;
      }
      this.modal.classList.remove('hidden');
    }

    hide() {
      if (this.modal) this.modal.classList.add('hidden');
    }

    showSuccessBanner(text) {
      if (window.NotificationUI && typeof window.NotificationUI.showNotification === 'function') {
        window.NotificationUI.showNotification(text, 'success');
      } else {
        alert(text);
      }
    }

    showErrorBanner(text) {
      if (window.NotificationUI && typeof window.NotificationUI.showNotification === 'function') {
        window.NotificationUI.showNotification(text, 'error');
      } else {
        alert(text);
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmailVerificationUI;
  } else {
    window.EmailVerificationUI = new EmailVerificationUI();
  }
})();
