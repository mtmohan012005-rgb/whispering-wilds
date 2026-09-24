// ============================================================================
// THE WHISPERING WILDS - MASTER AUTH UI COORDINATOR
// ============================================================================

(function() {
    class AuthUI {
        constructor() {
            this.container = null;
            this.currentScreen = 'LOGIN';
            this.networkState = 'ONLINE';
            this.screens = {};
            this.isVisible = false;
        }

        init() {
            this.createDOM();
            this.screens = {
                LOGIN: new window.LoginScreen(this),
                REGISTER: new window.RegisterScreen(this),
                FORGOT_PASSWORD: new window.ForgotPasswordScreen(this),
                ACCOUNT: new window.AccountProfileScreen(this)
            };
            this.bindNetworkListeners();
            this.checkSessionRecovery();
        }

        createDOM() {
            if (document.getElementById('authOverlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'authOverlay';
            overlay.className = 'auth-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            overlay.innerHTML = `
                <div class="auth-card" id="authCardContainer"></div>
                <div class="auth-network-pill" id="authNetworkPill">
                    <span class="auth-network-dot"></span>
                    <span id="authNetworkText">Online</span>
                </div>
            `;

            document.body.appendChild(overlay);
            this.container = overlay;
        }

        bindNetworkListeners() {
            window.addEventListener('online', () => this.setNetworkState('ONLINE'));
            window.addEventListener('offline', () => this.setNetworkState('OFFLINE'));
        }

        setNetworkState(state) {
            this.networkState = state;
            const pill = document.getElementById('authNetworkPill');
            const text = document.getElementById('authNetworkText');
            if (!pill || !text) return;

            pill.className = `auth-network-pill ${state.toLowerCase()}`;
            text.textContent = state;
        }

        showScreen(screenName) {
            if (!this.screens[screenName]) return;
            this.currentScreen = screenName;
            const card = document.getElementById('authCardContainer');
            if (!card) return;

            card.innerHTML = this.screens[screenName].render();
            this.screens[screenName].bindEvents(card);
            this.show();
        }

        show() {
            if (!this.container) this.init();
            this.isVisible = true;
            this.container.classList.add('active');
            this.lockGameplayInput();
        }

        hide() {
            if (!this.container) return;
            this.isVisible = false;
            this.container.classList.remove('active');
            this.unlockGameplayInput();
        }

        lockGameplayInput() {
            if (window.InputManager) {
                window.InputManager.setContext('AuthContext');
            }
            if (window.threeWorld && window.threeWorld.player) {
                window.threeWorld.player.clearInputState?.();
            }
        }

        unlockGameplayInput() {
            if (window.InputManager) {
                window.InputManager.setContext('GameplayContext');
            }
        }

        async checkSessionRecovery() {
            this.setNetworkState('CONNECTING');
            const result = await window.AuthClient.getMe();

            if (result.success && result.data && result.data.user) {
                this.setNetworkState('ONLINE');
                window.AuthState.setState(window.AUTH_STATUS.LOGGED_IN, result.data.user, false);
                console.log('[AuthUI] Restored existing authenticated session:', result.data.user.email);
            } else if (result.isOffline) {
                this.setNetworkState('OFFLINE');
                console.log('[AuthUI] Account service offline, offline mode available.');
            } else {
                this.setNetworkState('ONLINE');
                window.AuthState.setState(window.AUTH_STATUS.LOGGED_OUT, null, false);
            }
        }

        continueAsGuest() {
            window.AuthState.setGuest();
            this.hide();
            console.log('[AuthUI] Continuing in local Guest mode.');
            // Proceed to game / title
            if (window.gameStarted || (window.threeWorld && window.threeWorld.player)) {
                this.unlockGameplayInput();
            }
        }

        async onAuthSuccess(user) {
            console.log('[AuthUI] Authentication successful:', user.email);
            // Reconcile cloud save with local save
            await this.reconcileSaves();
            this.hide();
        }

        async reconcileSaves() {
            if (window.AuthState.isGuest) return;

            const cloudRes = await window.AuthClient.getCloudSave();
            const localSave = window.SaveManager?.load();

            if (!cloudRes.success || !cloudRes.data || !cloudRes.data.cloudSave) {
                // No cloud save exists, upload local save if local save exists
                if (localSave) {
                    await window.AuthClient.saveCloudSave(localSave);
                }
                return;
            }

            const cloudSave = cloudRes.data.cloudSave;
            if (!localSave) {
                // No local save, restore cloud save into local storage safely
                window.SaveManager?.save(cloudSave);
                return;
            }

            // Conflict check: if both exist and differ in saved timestamp
            const localTime = new Date(localSave.lastSaved || 0).getTime();
            const cloudTime = new Date(cloudSave.lastSaved || 0).getTime();

            if (Math.abs(localTime - cloudTime) > 5000) {
                // Show conflict prompt
                this.showSaveConflictModal(localSave, cloudSave);
            }
        }

        showSaveConflictModal(localSave, cloudSave) {
            const card = document.getElementById('authCardContainer');
            if (!card) return;

            const formatTime = (ts) => ts ? new Date(ts).toLocaleString() : 'Unknown';
            const localRegion = localSave.world?.currentRegion || localSave.region || 'George Town';
            const cloudRegion = cloudSave.world?.currentRegion || cloudSave.region || 'George Town';

            card.innerHTML = `
                <div class="auth-header">
                    <h1 class="auth-title">Save Conflict Detected</h1>
                    <div class="auth-subtitle">Select which save progression to keep</div>
                </div>

                <div class="auth-conflict-modal">
                    <div class="auth-conflict-cards">
                        <div class="auth-save-box highlight">
                            <div class="auth-save-title">Local Save</div>
                            <div class="auth-save-detail"><strong>Region:</strong> ${localRegion}</div>
                            <div class="auth-save-detail"><strong>Last Saved:</strong> ${formatTime(localSave.lastSaved)}</div>
                            <div class="auth-save-detail"><strong>Customizations:</strong> ${localSave.customizationChangesUsed || 0}/5</div>
                            <button type="button" id="useLocalBtn" class="auth-btn-primary" style="margin-top:12px;">
                                Use Local
                            </button>
                        </div>

                        <div class="auth-save-box">
                            <div class="auth-save-title">Cloud Save</div>
                            <div class="auth-save-detail"><strong>Region:</strong> ${cloudRegion}</div>
                            <div class="auth-save-detail"><strong>Last Saved:</strong> ${formatTime(cloudSave.lastSaved)}</div>
                            <div class="auth-save-detail"><strong>Customizations:</strong> ${cloudSave.customizationChangesUsed || 0}/5</div>
                            <button type="button" id="useCloudBtn" class="auth-btn-primary" style="margin-top:12px;">
                                Use Cloud
                            </button>
                        </div>
                    </div>

                    <button type="button" id="cancelConflictBtn" class="auth-btn-secondary">
                        Cancel & Review Later
                    </button>
                </div>
            `;

            card.querySelector('#useLocalBtn').addEventListener('click', async () => {
                await window.AuthClient.saveCloudSave(localSave);
                this.hide();
            });

            card.querySelector('#useCloudBtn').addEventListener('click', () => {
                window.SaveManager?.save(cloudSave);
                this.hide();
            });

            card.querySelector('#cancelConflictBtn').addEventListener('click', () => {
                this.hide();
            });

            this.show();
        }

        async syncLocalToCloud() {
            const local = window.SaveManager?.load();
            if (local) {
                await window.AuthClient.saveCloudSave(local);
            }
        }

        async signOut() {
            await window.AuthClient.logout();
            window.AuthState.setState(window.AUTH_STATUS.LOGGED_OUT, null, false);
            this.showScreen('LOGIN');
        }
    }

    window.AuthUI = new AuthUI();
    document.addEventListener('DOMContentLoaded', () => {
        window.AuthUI.init();
    });
})();
