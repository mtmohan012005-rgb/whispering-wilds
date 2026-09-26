/**
 * The Whispering Wilds (Kaattu Vazhi) - Firebase Auth UI
 * Sleek modal dialog for Email/Password registration and login.
 * Respects game design aesthetics, dark mode, and Tamil translations.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.FirebaseAuthUI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class FirebaseAuthUI {
    constructor() {
      this.modal = null;
      this.userBadge = null;
      this.mode = 'signin'; // 'signin' | 'signup' | 'reset'
      this._boundEvents = false;
    }

    init() {
      this._createModalDOM();
      this._createUserBadgeDOM();
      this._bindEvents();

      // Listen to auth state changes to update the UI
      if (window.FirebaseService) {
        window.FirebaseService.onAuthStateChanged((user) => {
          this.updateUserBadge(user);
        });
      }
    }

    _createModalDOM() {
      if (document.getElementById('firebase-auth-modal')) return;

      const modalEl = document.createElement('div');
      modalEl.id = 'firebase-auth-modal';
      modalEl.className = 'fb-auth-overlay hidden';
      modalEl.innerHTML = `
        <div class="fb-auth-dialog">
          <div class="fb-auth-header">
            <div class="fb-auth-tamil-title">பயணி உள்நுழைவு • பயனர் கணக்கு</div>
            <h2 id="fb-auth-title" class="fb-auth-heading">Sign In to Your Journey</h2>
            <p id="fb-auth-subtitle" class="fb-auth-subtext">Save your exploration progress securely to Firebase Cloud Firestore.</p>
            <button id="fb-auth-close-btn" class="fb-auth-close" title="Close [Esc]">&times;</button>
          </div>

          <form id="fb-auth-form" class="fb-auth-body" onsubmit="return false;">
            <div id="fb-auth-name-group" class="fb-input-group hidden">
              <label for="fb-input-name">Explorer Name / பெயர்</label>
              <input type="text" id="fb-input-name" placeholder="e.g. Velan, Kavitha, Karthik" autocomplete="name" />
            </div>

            <div class="fb-input-group">
              <label for="fb-input-email">Email Address / மின்னஞ்சல்</label>
              <input type="email" id="fb-input-email" required placeholder="explorer@tamilnadu.wilds" autocomplete="email" />
            </div>

            <div id="fb-auth-password-group" class="fb-input-group">
              <label for="fb-input-password">Password / கடவுச்சொல்</label>
              <input type="password" id="fb-input-password" required placeholder="••••••••" autocomplete="current-password" />
            </div>

            <div id="fb-auth-status" class="fb-auth-status-msg hidden"></div>

            <button type="submit" id="fb-auth-submit-btn" class="btn-primary fb-submit-btn">
              ▶ Sign In
            </button>
          </form>

          <div class="fb-auth-footer">
            <button type="button" id="fb-switch-mode-btn" class="fb-link-btn">New explorer? Create an Account</button>
            <span class="fb-divider">•</span>
            <button type="button" id="fb-forgot-btn" class="fb-link-btn">Forgot Password?</button>
            <span class="fb-divider">•</span>
            <button type="button" id="fb-guest-btn" class="fb-link-btn">Play as Guest</button>
          </div>
        </div>
      `;

      document.body.appendChild(modalEl);
      this.modal = modalEl;
    }

    _createUserBadgeDOM() {
      if (document.getElementById('fb-user-badge')) return;

      const badge = document.createElement('div');
      badge.id = 'fb-user-badge';
      badge.className = 'fb-user-status-badge';
      badge.innerHTML = `
        <span class="fb-status-icon">☁️</span>
        <span id="fb-badge-text" class="fb-badge-name">Guest Explorer</span>
        <button id="fb-badge-action-btn" class="fb-badge-btn">Sign In</button>
      `;

      // Mount into HUD and Title screen
      const hudTop = document.querySelector('.hud-top-actions');
      if (hudTop) {
        hudTop.insertBefore(badge, hudTop.firstChild);
      } else {
        document.body.appendChild(badge);
      }
      this.userBadge = badge;
    }

    _bindEvents() {
      if (this._boundEvents) return;
      this._boundEvents = true;

      const closeBtn = document.getElementById('fb-auth-close-btn');
      if (closeBtn) closeBtn.onclick = () => this.hide();

      const form = document.getElementById('fb-auth-form');
      if (form) form.onsubmit = (e) => { e.preventDefault(); this._handleSubmit(); };

      const switchBtn = document.getElementById('fb-switch-mode-btn');
      if (switchBtn) switchBtn.onclick = () => this._toggleMode();

      const forgotBtn = document.getElementById('fb-forgot-btn');
      if (forgotBtn) forgotBtn.onclick = () => this._setMode('reset');

      const guestBtn = document.getElementById('fb-guest-btn');
      if (guestBtn) guestBtn.onclick = () => this.hide();

      const badgeBtn = document.getElementById('fb-badge-action-btn');
      if (badgeBtn) badgeBtn.onclick = () => {
        if (window.FirebaseService?.isAuthenticated()) {
          window.FirebaseService.signOut().then(() => {
            if (window.NotificationSystem) window.NotificationSystem.show('Signed out from Firebase Cloud', 'info');
          });
        } else {
          this.show('signin');
        }
      };

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.modal?.classList.contains('hidden')) {
          this.hide();
        }
      });
    }

    show(initialMode = 'signin') {
      this._setMode(initialMode);
      this.modal?.classList.remove('hidden');
      document.getElementById('fb-input-email')?.focus();
    }

    hide() {
      this.modal?.classList.add('hidden');
      this._setStatus('', '');
    }

    _setMode(mode) {
      this.mode = mode;
      const title = document.getElementById('fb-auth-title');
      const subtitle = document.getElementById('fb-auth-subtitle');
      const submitBtn = document.getElementById('fb-auth-submit-btn');
      const nameGroup = document.getElementById('fb-auth-name-group');
      const pwdGroup = document.getElementById('fb-auth-password-group');
      const switchBtn = document.getElementById('fb-switch-mode-btn');

      if (mode === 'signup') {
        if (title) title.textContent = 'Create Explorer Account';
        if (subtitle) subtitle.textContent = 'Join the journey across Tamil Nadu with persistent cloud saves.';
        if (submitBtn) submitBtn.textContent = '✦ Create Account';
        if (nameGroup) nameGroup.classList.remove('hidden');
        if (pwdGroup) pwdGroup.classList.remove('hidden');
        if (switchBtn) switchBtn.textContent = 'Already have an account? Sign In';
      } else if (mode === 'signin') {
        if (title) title.textContent = 'Sign In to Your Journey';
        if (subtitle) subtitle.textContent = 'Save your exploration progress securely to Firebase Cloud Firestore.';
        if (submitBtn) submitBtn.textContent = '▶ Sign In';
        if (nameGroup) nameGroup.classList.add('hidden');
        if (pwdGroup) pwdGroup.classList.remove('hidden');
        if (switchBtn) switchBtn.textContent = 'New explorer? Create an Account';
      } else if (mode === 'reset') {
        if (title) title.textContent = 'Reset Password';
        if (subtitle) subtitle.textContent = 'Enter your email to receive a password reset link.';
        if (submitBtn) submitBtn.textContent = '✉ Send Reset Link';
        if (nameGroup) nameGroup.classList.add('hidden');
        if (pwdGroup) pwdGroup.classList.add('hidden');
        if (switchBtn) switchBtn.textContent = 'Back to Sign In';
      }
      this._setStatus('', '');
    }

    _toggleMode() {
      if (this.mode === 'signin') this._setMode('signup');
      else this._setMode('signin');
    }

    async _handleSubmit() {
      const email = document.getElementById('fb-input-email')?.value.trim();
      const password = document.getElementById('fb-input-password')?.value;
      const name = document.getElementById('fb-input-name')?.value.trim();

      if (!email) {
        this._setStatus('Please enter a valid email address.', 'error');
        return;
      }

      this._setStatus('Connecting to Firebase...', 'info');

      if (this.mode === 'signup') {
        if (!password || password.length < 6) {
          this._setStatus('Password must be at least 6 characters.', 'error');
          return;
        }
        const res = await window.FirebaseService.signUpWithEmail(email, password, name);
        if (res.success) {
          this._setStatus('Account created! Syncing progress...', 'success');
          setTimeout(() => this.hide(), 1200);
          if (window.NotificationSystem) {
            window.NotificationSystem.show(`Welcome to Tamil Nadu, ${res.user.displayName || email}!`, 'success');
          }
        } else {
          this._setStatus(res.error || 'Failed to create account.', 'error');
        }
      } else if (this.mode === 'signin') {
        if (!password) {
          this._setStatus('Please enter your password.', 'error');
          return;
        }
        const res = await window.FirebaseService.signInWithEmail(email, password);
        if (res.success) {
          this._setStatus('Signed in! Loading cloud save...', 'success');
          if (window.CloudSaveManager) {
            await window.CloudSaveManager.loadFromCloud();
          }
          setTimeout(() => this.hide(), 1200);
          if (window.NotificationSystem) {
            window.NotificationSystem.show(`Welcome back, ${res.user.displayName || email}!`, 'success');
          }
        } else {
          this._setStatus(res.error || 'Failed to sign in.', 'error');
        }
      } else if (this.mode === 'reset') {
        const res = await window.FirebaseService.resetPassword(email);
        if (res.success) {
          this._setStatus('Password reset email sent! Check your inbox.', 'success');
        } else {
          this._setStatus(res.error || 'Failed to send reset email.', 'error');
        }
      }
    }

    _setStatus(msg, type = 'info') {
      const statusEl = document.getElementById('fb-auth-status');
      if (!statusEl) return;
      if (!msg) {
        statusEl.className = 'fb-auth-status-msg hidden';
        statusEl.textContent = '';
        return;
      }
      statusEl.className = `fb-auth-status-msg ${type}`;
      statusEl.textContent = msg;
    }

    updateUserBadge(user) {
      const textEl = document.getElementById('fb-badge-text');
      const actionBtn = document.getElementById('fb-badge-action-btn');
      if (!textEl || !actionBtn) return;

      if (user) {
        const name = user.displayName || user.email.split('@')[0];
        textEl.textContent = `${name} (Firebase Synced)`;
        textEl.title = `Signed in as ${user.email} (Project: debug-c26abc33)`;
        actionBtn.textContent = 'Sign Out';
      } else {
        textEl.textContent = 'Guest Explorer (Offline)';
        textEl.title = 'Sign in to save your progress permanently to Firebase Cloud Firestore';
        actionBtn.textContent = 'Sign In';
      }
    }
  }

  const instance = new FirebaseAuthUI();
  return instance;
});
