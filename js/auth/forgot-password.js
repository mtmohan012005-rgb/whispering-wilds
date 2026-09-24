// ============================================================================
// THE WHISPERING WILDS - FORGOT PASSWORD COMPONENT
// ============================================================================

(function() {
    class ForgotPasswordScreen {
        constructor(authUI) {
            this.authUI = authUI;
            this.mode = 'REQUEST'; // 'REQUEST' or 'RESET'
        }

        render() {
            if (this.mode === 'RESET') {
                return `
                    <div class="auth-header">
                        <h1 class="auth-title">Reset Password</h1>
                        <div class="auth-subtitle">Enter Token & New Password</div>
                    </div>

                    <div id="resetNotice" class="auth-notice"></div>

                    <form id="resetForm" class="auth-form" onsubmit="return false;">
                        <div class="auth-group">
                            <label for="resetToken" class="auth-label">Reset Token</label>
                            <input type="text" id="resetToken" class="auth-input" placeholder="Paste token here" required />
                        </div>

                        <div class="auth-group">
                            <label for="newPassword" class="auth-label">New Password (Min 8 chars)</label>
                            <input type="password" id="newPassword" class="auth-input" placeholder="••••••••" required />
                        </div>

                        <div class="auth-group">
                            <label for="confirmNewPassword" class="auth-label">Confirm New Password</label>
                            <input type="password" id="confirmNewPassword" class="auth-input" placeholder="••••••••" required />
                        </div>

                        <button type="submit" id="submitResetBtn" class="auth-btn-primary">
                            Update Password
                        </button>

                        <button type="button" id="backToSignInBtn" class="auth-btn-secondary">
                            Back to Sign In
                        </button>
                    </form>
                `;
            }

            return `
                <div class="auth-header">
                    <h1 class="auth-title">Password Recovery</h1>
                    <div class="auth-subtitle">Account Assistance</div>
                </div>

                <div id="forgotNotice" class="auth-notice"></div>

                <form id="forgotForm" class="auth-form" onsubmit="return false;">
                    <div class="auth-group">
                        <label for="forgotEmail" class="auth-label">Registered Email</label>
                        <input type="email" id="forgotEmail" class="auth-input" placeholder="name@domain.com" required />
                    </div>

                    <button type="submit" id="sendRecoveryBtn" class="auth-btn-primary">
                        Send Recovery Instructions
                    </button>

                    <button type="button" id="haveTokenBtn" class="auth-link" style="text-align:center; padding: 6px 0;">
                        Already have a reset token? Click here
                    </button>

                    <div class="auth-divider">
                        <span>OR</span>
                    </div>

                    <button type="button" id="backToSignInBtn" class="auth-btn-secondary">
                        Back to Sign In
                    </button>
                </form>
            `;
        }

        bindEvents(container) {
            const backBtn = container.querySelector('#backToSignInBtn');
            backBtn?.addEventListener('click', () => {
                this.mode = 'REQUEST';
                this.authUI.showScreen('LOGIN');
            });

            if (this.mode === 'RESET') {
                const form = container.querySelector('#resetForm');
                const tokenInput = container.querySelector('#resetToken');
                const passInput = container.querySelector('#newPassword');
                const confirmInput = container.querySelector('#confirmNewPassword');
                const submitBtn = container.querySelector('#submitResetBtn');

                form?.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleReset(tokenInput.value, passInput.value, confirmInput.value, submitBtn);
                });
            } else {
                const form = container.querySelector('#forgotForm');
                const emailInput = container.querySelector('#forgotEmail');
                const submitBtn = container.querySelector('#sendRecoveryBtn');
                const haveTokenBtn = container.querySelector('#haveTokenBtn');

                form?.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.handleForgot(emailInput.value, submitBtn);
                });

                haveTokenBtn?.addEventListener('click', () => {
                    this.mode = 'RESET';
                    this.authUI.showScreen('FORGOT_PASSWORD');
                });

                setTimeout(() => emailInput?.focus(), 100);
            }
        }

        async handleForgot(email, btn) {
            const notice = document.querySelector('#forgotNotice');
            notice.className = 'auth-notice';
            notice.style.display = 'none';

            if (!email) {
                notice.textContent = 'Please enter your registered email address.';
                notice.className = 'auth-notice error';
                return;
            }

            btn.disabled = true;
            btn.textContent = 'SENDING...';

            const result = await window.AuthClient.forgotPassword(email);

            btn.disabled = false;
            btn.textContent = 'SEND RECOVERY INSTRUCTIONS';

            // Always display generic safe notice
            notice.textContent = result.message || 'If an account exists, password reset instructions will be provided.';
            notice.className = 'auth-notice info';
        }

        async handleReset(token, newPass, confirmPass, btn) {
            const notice = document.querySelector('#resetNotice');
            notice.className = 'auth-notice';
            notice.style.display = 'none';

            if (!token || !newPass || !confirmPass) {
                notice.textContent = 'Please fill out all fields.';
                notice.className = 'auth-notice error';
                return;
            }

            if (newPass !== confirmPass) {
                notice.textContent = 'Passwords do not match.';
                notice.className = 'auth-notice error';
                return;
            }

            btn.disabled = true;
            btn.textContent = 'UPDATING...';

            const result = await window.AuthClient.resetPassword(token, newPass, confirmPass);

            btn.disabled = false;
            btn.textContent = 'UPDATE PASSWORD';

            if (!result.success) {
                notice.textContent = result.message || 'Invalid or expired reset token.';
                notice.className = 'auth-notice error';
                return;
            }

            notice.textContent = result.message || 'Password reset successfully! Returning to sign in...';
            notice.className = 'auth-notice success';

            setTimeout(() => {
                this.mode = 'REQUEST';
                this.authUI.showScreen('LOGIN');
            }, 1500);
        }
    }

    window.ForgotPasswordScreen = ForgotPasswordScreen;
})();
