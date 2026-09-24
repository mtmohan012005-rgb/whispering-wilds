// ============================================================================
// THE WHISPERING WILDS - OTP INPUT UI
// 6-digit split input boxes with auto-advance, paste support, backspace, and cooldown
// ============================================================================

(function() {
  'use strict';

  class OtpUI {
    constructor() {
      this.modal = null;
      this.inputs = [];
      this.resendTimer = null;
      this.resendCooldown = 0;
      this.currentPurpose = 'VERIFICATION';
      this._initDOM();
    }

    _initDOM() {
      if (document.getElementById('otp-verification-modal')) {
        this.modal = document.getElementById('otp-verification-modal');
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'otp-verification-modal';
      modal.className = 'auth-security-modal hidden';
      modal.innerHTML = `
        <div class="auth-security-backdrop"></div>
        <div class="auth-security-card">
          <div class="auth-security-header">
            <h3>🔒 ENTER VERIFICATION CODE</h3>
            <button id="close-otp-modal-btn" class="auth-security-close">&times;</button>
          </div>
          <div class="auth-security-body" style="text-align: center;">
            <p>Please enter the 6-digit security code sent to your email:</p>

            <div class="otp-inputs-row" id="otp-inputs-container">
              <input type="text" maxlength="1" class="otp-digit-input" data-index="0" autofocus inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-digit-input" data-index="1" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-digit-input" data-index="2" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-digit-input" data-index="3" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-digit-input" data-index="4" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-digit-input" data-index="5" inputmode="numeric" />
            </div>

            <div id="otp-error-msg" class="auth-feedback-box error hidden"></div>

            <div class="auth-action-row" style="margin-top: 24px;">
              <button id="otp-resend-btn" class="btn-auth-secondary">RESEND CODE</button>
              <button id="otp-submit-btn" class="btn-auth-primary">VERIFY NOW</button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.modal = modal;
      this.inputs = Array.from(modal.querySelectorAll('.otp-digit-input'));

      this._bindEvents();
    }

    _bindEvents() {
      const closeBtn = document.getElementById('close-otp-modal-btn');
      if (closeBtn) closeBtn.addEventListener('click', () => this.hide());

      // Digit input handlers
      this.inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
          const val = e.target.value.replace(/[^0-9]/g, '');
          e.target.value = val ? val[val.length - 1] : '';

          if (val && index < 5) {
            this.inputs[index + 1].focus();
            this.inputs[index + 1].select();
          }

          // Auto-submit if all 6 digits entered
          if (this.getCode().length === 6) {
            this.submitOtp();
          }
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !input.value && index > 0) {
            this.inputs[index - 1].focus();
          } else if (e.key === 'ArrowLeft' && index > 0) {
            this.inputs[index - 1].focus();
          } else if (e.key === 'ArrowRight' && index < 5) {
            this.inputs[index + 1].focus();
          }
        });

        input.addEventListener('paste', (e) => {
          e.preventDefault();
          const pasted = (e.clipboardData || window.clipboardData).getData('text');
          const digits = pasted.replace(/[^0-9]/g, '').slice(0, 6);
          if (digits.length > 0) {
            for (let i = 0; i < digits.length; i++) {
              if (this.inputs[i]) this.inputs[i].value = digits[i];
            }
            const nextIdx = Math.min(5, digits.length);
            this.inputs[nextIdx].focus();

            if (digits.length === 6) {
              this.submitOtp();
            }
          }
        });
      });

      const submitBtn = document.getElementById('otp-submit-btn');
      if (submitBtn) submitBtn.addEventListener('click', () => this.submitOtp());

      const resendBtn = document.getElementById('otp-resend-btn');
      if (resendBtn) resendBtn.addEventListener('click', () => this.resendOtp());
    }

    getCode() {
      return this.inputs.map(inp => inp.value).join('');
    }

    clearInputs() {
      this.inputs.forEach(inp => { inp.value = ''; });
      if (this.inputs[0]) this.inputs[0].focus();
      const err = document.getElementById('otp-error-msg');
      if (err) err.classList.add('hidden');
    }

    async submitOtp() {
      const code = this.getCode();
      const err = document.getElementById('otp-error-msg');

      if (code.length !== 6) {
        if (err) {
          err.innerText = 'Please enter all 6 digits.';
          err.classList.remove('hidden');
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            purpose: this.currentPurpose
          })
        });
        const data = await res.json();

        if (data.success) {
          this.hide();
          if (window.NotificationUI && typeof window.NotificationUI.showNotification === 'function') {
            window.NotificationUI.showNotification(data.message || 'Verification complete!', 'success');
          } else {
            alert('Verification complete!');
          }
          if (window.AuthState && window.AuthState.user && this.currentPurpose === 'VERIFICATION') {
            window.AuthState.user.email_verified = true;
          }
        } else {
          if (err) {
            err.innerText = data.reason || 'Verification failed.';
            err.classList.remove('hidden');
          }
        }
      } catch (e) {
        if (err) {
          err.innerText = 'Network error verifying code.';
          err.classList.remove('hidden');
        }
      }
    }

    async resendOtp() {
      if (this.resendCooldown > 0) return;

      const btn = document.getElementById('otp-resend-btn');
      const err = document.getElementById('otp-error-msg');

      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: this.currentPurpose })
        });
        const data = await res.json();

        if (data.success) {
          this._startCooldown(60);
          if (err) {
            err.className = 'auth-feedback-box success';
            err.innerText = data.message || 'New code sent.';
            err.classList.remove('hidden');
          }
        } else {
          if (err) {
            err.className = 'auth-feedback-box error';
            err.innerText = data.reason || 'Unable to send code.';
            err.classList.remove('hidden');
          }
          if (data.retryAfterSec) {
            this._startCooldown(data.retryAfterSec);
          }
        }
      } catch (e) {
        if (err) {
          err.className = 'auth-feedback-box error';
          err.innerText = 'Network error requesting code.';
          err.classList.remove('hidden');
        }
      }
    }

    _startCooldown(seconds) {
      this.resendCooldown = seconds;
      const btn = document.getElementById('otp-resend-btn');
      if (btn) btn.disabled = true;

      if (this.resendTimer) clearInterval(this.resendTimer);
      this.resendTimer = setInterval(() => {
        this.resendCooldown--;
        if (btn) btn.innerText = `RESEND IN ${this.resendCooldown}s`;
        if (this.resendCooldown <= 0) {
          clearInterval(this.resendTimer);
          if (btn) {
            btn.disabled = false;
            btn.innerText = 'RESEND CODE';
          }
        }
      }, 1000);
    }

    show(purpose = 'VERIFICATION') {
      this.currentPurpose = purpose;
      this.clearInputs();
      if (this.modal) this.modal.classList.remove('hidden');
    }

    hide() {
      if (this.modal) this.modal.classList.add('hidden');
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OtpUI;
  } else {
    window.OtpUI = new OtpUI();
  }
})();
