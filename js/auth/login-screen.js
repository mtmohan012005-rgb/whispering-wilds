// ============================================================================
// THE WHISPERING WILDS - LOGIN SCREEN COMPONENT
// ============================================================================

(function() {
    class LoginScreen {
        constructor(authUI) {
            this.authUI = authUI;
            this.isPasswordVisible = false;
        }

        render() {
            return `
                <div class="auth-header">
                    <h1 class="auth-title">The Whispering Wilds</h1>
                    <div class="auth-subtitle">Kaattu Vazhi • Thadam</div>
                    <div class="auth-tagline">"Return to the wild."</div>
                </div>

                <div id="authNotice" class="auth-notice"></div>

                <form id="loginForm" class="auth-form" onsubmit="return false;">
                    <div class="auth-group">
                        <label for="loginEmail" class="auth-label">Email</label>
                        <div class="auth-input-wrapper">
                            <input type="email" id="loginEmail" class="auth-input" placeholder="name@domain.com" autocomplete="email" required />
                        </div>
                    </div>

                    <div class="auth-group">
                        <label for="loginPassword" class="auth-label">Password</label>
                        <div class="auth-input-wrapper">
                            <input type="password" id="loginPassword" class="auth-input" placeholder="••••••••" autocomplete="current-password" required />
                            <button type="button" id="togglePasswordBtn" class="auth-eye-btn" aria-label="Show password" title="Toggle password visibility">
                                👁
                            </button>
                        </div>
                    </div>

                    <div class="auth-row-options">
                        <label class="auth-checkbox-label">
                            <input type="checkbox" id="rememberDevice" class="auth-checkbox" />
                            <span>Remember this device</span>
                        </label>
                        <a href="javascript:void(0)" id="forgotPasswordLink" class="auth-link">Forgot Password?</a>
                    </div>

                    <button type="submit" id="signInBtn" class="auth-btn-primary">
                        Sign In
                    </button>

                    <div class="auth-divider">
                        <span>OR</span>
                    </div>

                    <button type="button" id="openRegisterBtn" class="auth-btn-secondary">
                        Create Account
                    </button>

                    <button type="button" id="guestBtn" class="auth-btn-secondary">
                        Continue as Guest
                    </button>
                </form>
            `;
        }

        bindEvents(container) {
            const form = container.querySelector('#loginForm');
            const emailInput = container.querySelector('#loginEmail');
            const passwordInput = container.querySelector('#loginPassword');
            const rememberCheckbox = container.querySelector('#rememberDevice');
            const signInBtn = container.querySelector('#signInBtn');
            const toggleEyeBtn = container.querySelector('#togglePasswordBtn');
            const forgotLink = container.querySelector('#forgotPasswordLink');
            const registerBtn = container.querySelector('#openRegisterBtn');
            const guestBtn = container.querySelector('#guestBtn');

            // Password visibility toggle
            toggleEyeBtn.addEventListener('click', () => {
                this.isPasswordVisible = !this.isPasswordVisible;
                passwordInput.type = this.isPasswordVisible ? 'text' : 'password';
                toggleEyeBtn.setAttribute('aria-label', this.isPasswordVisible ? 'Hide password' : 'Show password');
                toggleEyeBtn.textContent = this.isPasswordVisible ? '🔒' : '👁';
            });

            // Enter key flows
            emailInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    passwordInput.focus();
                }
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSignIn(emailInput.value, passwordInput.value, rememberCheckbox.checked, signInBtn);
            });

            forgotLink.addEventListener('click', () => {
                this.authUI.showScreen('FORGOT_PASSWORD');
            });

            registerBtn.addEventListener('click', () => {
                this.authUI.showScreen('REGISTER');
            });

            guestBtn.addEventListener('click', () => {
                this.authUI.continueAsGuest();
            });

            // Focus email on load
            setTimeout(() => emailInput?.focus(), 100);
        }

        async handleSignIn(email, password, remember, btn) {
            const notice = document.querySelector('#authNotice');
            notice.className = 'auth-notice';
            notice.style.display = 'none';

            if (!email || !password) {
                notice.textContent = 'Please enter both email and password.';
                notice.className = 'auth-notice error';
                return;
            }

            btn.disabled = true;
            btn.textContent = 'SIGNING IN...';

            const result = await window.AuthClient.login(email, password, remember);

            btn.disabled = false;
            btn.textContent = 'SIGN IN';

            if (!result.success) {
                notice.textContent = result.message || 'Email or password is incorrect.';
                notice.className = 'auth-notice error';
                return;
            }

            // On success
            window.AuthState.setState(window.AUTH_STATUS.LOGGED_IN, result.data.user, false);
            this.authUI.onAuthSuccess(result.data.user);
        }
    }

    window.LoginScreen = LoginScreen;
})();
