// ============================================================================
// THE WHISPERING WILDS - REGISTER SCREEN COMPONENT
// ============================================================================

(function() {
    class RegisterScreen {
        constructor(authUI) {
            this.authUI = authUI;
            this.isPasswordVisible = false;
        }

        render() {
            return `
                <div class="auth-header">
                    <h1 class="auth-title">Create Account</h1>
                    <div class="auth-subtitle">Begin Your Journey</div>
                </div>

                <div id="registerNotice" class="auth-notice"></div>

                <form id="registerForm" class="auth-form" onsubmit="return false;">
                    <div class="auth-group">
                        <label for="regDisplayName" class="auth-label">Explorer Name</label>
                        <div class="auth-input-wrapper">
                            <input type="text" id="regDisplayName" class="auth-input" placeholder="e.g. Iniyan / Nilani" maxlength="32" required />
                        </div>
                    </div>

                    <div class="auth-group">
                        <label for="regEmail" class="auth-label">Email</label>
                        <div class="auth-input-wrapper">
                            <input type="email" id="regEmail" class="auth-input" placeholder="name@domain.com" required />
                        </div>
                    </div>

                    <div class="auth-group">
                        <label for="regPassword" class="auth-label">Password (Min 8 chars)</label>
                        <div class="auth-input-wrapper">
                            <input type="password" id="regPassword" class="auth-input" placeholder="••••••••" required />
                        </div>
                    </div>

                    <div class="auth-group">
                        <label for="regConfirmPassword" class="auth-label">Confirm Password</label>
                        <div class="auth-input-wrapper">
                            <input type="password" id="regConfirmPassword" class="auth-input" placeholder="••••••••" required />
                        </div>
                    </div>

                    <button type="submit" id="createAccountBtn" class="auth-btn-primary">
                        Create Account
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
            const form = container.querySelector('#registerForm');
            const nameInput = container.querySelector('#regDisplayName');
            const emailInput = container.querySelector('#regEmail');
            const passInput = container.querySelector('#regPassword');
            const confirmInput = container.querySelector('#regConfirmPassword');
            const submitBtn = container.querySelector('#createAccountBtn');
            const backBtn = container.querySelector('#backToSignInBtn');

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleRegister(nameInput.value, emailInput.value, passInput.value, confirmInput.value, submitBtn);
            });

            backBtn.addEventListener('click', () => {
                this.authUI.showScreen('LOGIN');
            });

            setTimeout(() => nameInput?.focus(), 100);
        }

        async handleRegister(displayName, email, password, confirmPassword, btn) {
            const notice = document.querySelector('#registerNotice');
            notice.className = 'auth-notice';
            notice.style.display = 'none';

            if (!displayName || !email || !password || !confirmPassword) {
                notice.textContent = 'Please fill out all registration fields.';
                notice.className = 'auth-notice error';
                return;
            }

            if (password !== confirmPassword) {
                notice.textContent = 'Passwords do not match.';
                notice.className = 'auth-notice error';
                return;
            }

            if (password.length < 8) {
                notice.textContent = 'Password must be at least 8 characters long.';
                notice.className = 'auth-notice error';
                return;
            }

            btn.disabled = true;
            btn.textContent = 'CREATING ACCOUNT...';

            const result = await window.AuthClient.register(email, displayName, password, confirmPassword);

            btn.disabled = false;
            btn.textContent = 'CREATE ACCOUNT';

            if (!result.success) {
                notice.textContent = result.message || 'Unable to create account.';
                notice.className = 'auth-notice error';
                return;
            }

            // Success notice
            notice.textContent = result.message || 'Account created successfully! Returning to sign in...';
            notice.className = 'auth-notice success';

            setTimeout(() => {
                this.authUI.showScreen('LOGIN');
                const loginNotice = document.querySelector('#authNotice');
                if (loginNotice) {
                    loginNotice.textContent = 'Account created. Please sign in with your credentials.';
                    loginNotice.className = 'auth-notice success';
                }
            }, 1500);
        }
    }

    window.RegisterScreen = RegisterScreen;
})();
