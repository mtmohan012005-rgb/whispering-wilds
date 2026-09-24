// ============================================================================
// THE WHISPERING WILDS - PASSWORD RESET & ACCOUNT SECURITY UI
// Forgot password flow, reset password page/modal, and session security actions
// ============================================================================

(function() {
  'use strict';

  class PasswordResetUI {
    constructor() {
      this.resetModal = null;
      this.forgotModal = null;
      this.securitySettingsModal = null;
      this._initDOM();
      this._checkUrlParameters();
    }

    _initDOM() {
      // 1. Forgot Password Modal
      if (!document.getElementById('forgot-password-modal')) {
        const forgot = document.createElement('div');
        forgot.id = 'forgot-password-modal';
        forgot.className = 'auth-security-modal hidden';
        forgot.innerHTML = `
          <div class="auth-security-backdrop"></div>
          <div class="auth-security-card">
            <div class="auth-security-header">
              <h3>🔑 FORGOT PASSWORD</h3>
              <button id="close-forgot-modal" class="auth-security-close">&times;</button>
            </div>
            <div class="auth-security-body">
              <p>Enter the email address associated with your account to receive reset instructions:</p>
              <div class="auth-input-group">
                <label>Email Address</label>
                <input type="email" id="forgot-email-input" class="auth-text-input" placeholder="explorer@example.com" />
              </div>
              <div id="forgot-feedback" class="auth-feedback-box hidden"></div>
              <div class="auth-action-row" style="margin-top: 20px;">
                <button id="cancel-forgot-btn" class="btn-auth-secondary">CANCEL</button>
                <button id="submit-forgot-btn" class="btn-auth-primary">SEND RESET LINK</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(forgot);
        this.forgotModal = forgot;

        const closeBtn = document.getElementById('close-forgot-modal');
        const cancelBtn = document.getElementById('cancel-forgot-btn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideForgotModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideForgotModal());

        const submitBtn = document.getElementById('submit-forgot-btn');
        if (submitBtn) submitBtn.addEventListener('click', () => this.requestPasswordReset());
      }

      // 2. Reset Password Modal (New Password & Confirmation)
      if (!document.getElementById('reset-password-modal')) {
        const reset = document.createElement('div');
        reset.id = 'reset-password-modal';
        reset.className = 'auth-security-modal hidden';
        reset.innerHTML = `
          <div class="auth-security-backdrop"></div>
          <div class="auth-security-card">
            <div class="auth-security-header">
              <h3>🔒 CHOOSE NEW PASSWORD</h3>
              <button id="close-reset-modal" class="auth-security-close">&times;</button>
            </div>
            <div class="auth-security-body">
              <input type="hidden" id="reset-token-field" />
              <div class="auth-input-group">
                <label>New Password (min 8 chars)</label>
                <input type="password" id="reset-new-password" class="auth-text-input" placeholder="Enter secure password" />
              </div>
              <div class="auth-input-group">
                <label>Confirm New Password</label>
                <input type="password" id="reset-confirm-password" class="auth-text-input" placeholder="Repeat new password" />
              </div>
              <div id="reset-feedback" class="auth-feedback-box hidden"></div>
              <div class="auth-action-row" style="margin-top: 24px;">
                <button id="submit-reset-btn" class="btn-auth-primary" style="width:100%;">UPDATE PASSWORD</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(reset);
        this.resetModal = reset;

        const closeBtn = document.getElementById('close-reset-modal');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hideResetModal());

        const submitBtn = document.getElementById('submit-reset-btn');
        if (submitBtn) submitBtn.addEventListener('click', () => this.submitResetPassword());
      }
    }

    _checkUrlParameters() {
      if (typeof window === 'undefined' || !window.location) return;
      const params = new URLSearchParams(window.location.search);
      const resetToken = params.get('resetToken');
      if (resetToken) {
        this.showResetModal(resetToken);
      }
    }

    showForgotModal() {
      if (this.forgotModal) {
        this.forgotModal.classList.remove('hidden');
        const input = document.getElementById('forgot-email-input');
        if (input) {
          input.value = '';
          input.focus();
        }
        const fb = document.getElementById('forgot-feedback');
        if (fb) fb.classList.add('hidden');
      }
    }

    hideForgotModal() {
      if (this.forgotModal) this.forgotModal.classList.add('hidden');
    }

    async requestPasswordReset() {
      const input = document.getElementById('forgot-email-input');
      const email = input ? input.value.trim() : '';
      const fb = document.getElementById('forgot-feedback');

      if (!email) {
        if (fb) {
          fb.className = 'auth-feedback-box error';
          fb.innerText = 'Please enter your account email.';
          fb.classList.remove('hidden');
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/request-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (fb) {
          fb.className = 'auth-feedback-box success';
          fb.innerText = data.message || 'If an account exists for that email, password reset instructions will be sent.';
          fb.classList.remove('hidden');
        }
      } catch (err) {
        if (fb) {
          fb.className = 'auth-feedback-box error';
          fb.innerText = 'Unable to send reset request.';
          fb.classList.remove('hidden');
        }
      }
    }

    showResetModal(token) {
      if (this.resetModal) {
        const tokenField = document.getElementById('reset-token-field');
        if (tokenField) tokenField.value = token || '';
        this.resetModal.classList.remove('hidden');
      }
    }

    hideResetModal() {
      if (this.resetModal) this.resetModal.classList.add('hidden');
    }

    async submitResetPassword() {
      const token = document.getElementById('reset-token-field').value;
      const newPassword = document.getElementById('reset-new-password').value;
      const confirmPassword = document.getElementById('reset-confirm-password').value;
      const fb = document.getElementById('reset-feedback');

      if (!newPassword || newPassword.length < 8) {
        if (fb) {
          fb.className = 'auth-feedback-box error';
          fb.innerText = 'Password must be at least 8 characters long.';
          fb.classList.remove('hidden');
        }
        return;
      }

      if (newPassword !== confirmPassword) {
        if (fb) {
          fb.className = 'auth-feedback-box error';
          fb.innerText = 'Passwords do not match.';
          fb.classList.remove('hidden');
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword, confirmPassword })
        });
        const data = await res.json();

        if (data.success) {
          if (fb) {
            fb.className = 'auth-feedback-box success';
            fb.innerText = data.message || 'Password updated successfully! Please sign in.';
            fb.classList.remove('hidden');
          }
          setTimeout(() => {
            this.hideResetModal();
            if (window.LoginScreen && typeof window.LoginScreen.show === 'function') {
              window.LoginScreen.show();
            }
          }, 2000);
        } else {
          if (fb) {
            fb.className = 'auth-feedback-box error';
            fb.innerText = data.reason || 'This reset link is invalid or has expired.';
            fb.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (fb) {
          fb.className = 'auth-feedback-box error';
          fb.innerText = 'Network error updating password.';
          fb.classList.remove('hidden');
        }
      }
    }

    async logoutOtherDevices() {
      try {
        const res = await fetch('/api/auth/revoke-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (window.NotificationUI && typeof window.NotificationUI.showNotification === 'function') {
          window.NotificationUI.showNotification(data.message || 'Other device sessions logged out.', 'info');
        } else {
          alert(data.message || 'Other device sessions logged out.');
        }
      } catch (e) {
        alert('Failed to log out other devices.');
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordResetUI;
  } else {
    window.PasswordResetUI = new PasswordResetUI();
  }
})();
