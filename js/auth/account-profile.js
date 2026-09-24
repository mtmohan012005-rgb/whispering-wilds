// ============================================================================
// THE WHISPERING WILDS - ACCOUNT PROFILE COMPONENT
// ============================================================================

(function() {
    class AccountProfileScreen {
        constructor(authUI) {
            this.authUI = authUI;
        }

        render() {
            const user = window.AuthState.getUser() || {
                displayName: 'Guest Explorer',
                email: 'guest@whisperingwilds.local',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
            };

            const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A';
            const lastLoginDate = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Just now';
            const isGuest = window.AuthState.isGuest;

            return `
                <div class="auth-header">
                    <h1 class="auth-title">Account Profile</h1>
                    <div class="auth-subtitle">${user.displayName}</div>
                </div>

                <div class="auth-form" style="gap: 14px;">
                    <div class="auth-save-box">
                        <div class="auth-save-title">Explorer Identity</div>
                        <div class="auth-save-detail"><strong>Name:</strong> ${user.displayName}</div>
                        <div class="auth-save-detail"><strong>Email:</strong> ${user.email}</div>
                        <div class="auth-save-detail"><strong>Member Since:</strong> ${createdDate}</div>
                        <div class="auth-save-detail"><strong>Last Active:</strong> ${lastLoginDate}</div>
                        <div class="auth-save-detail"><strong>Account Type:</strong> ${isGuest ? 'Local Guest' : 'Registered Member'}</div>
                    </div>

                    <div class="auth-save-box highlight">
                        <div class="auth-save-title">Cloud Progression</div>
                        <div class="auth-save-detail">
                            <strong>Status:</strong> ${isGuest ? 'Disabled (Guest session stored locally)' : 'Enabled & Active'}
                        </div>
                        <div class="auth-save-detail">
                            <strong>Customizations Used:</strong> ${window.GameState?.customizationChangesUsed || 0} / 5
                        </div>
                    </div>

                    ${!isGuest ? `
                        <button type="button" id="syncCloudBtn" class="auth-btn-primary">
                            Sync Save to Cloud
                        </button>
                    ` : ''}

                    <button type="button" id="closeProfileBtn" class="auth-btn-secondary">
                        Back to Game
                    </button>

                    <button type="button" id="signOutBtn" class="auth-btn-secondary" style="border-color: rgba(220, 80, 80, 0.4); color: #ff9999;">
                        Sign Out
                    </button>
                </div>
            `;
        }

        bindEvents(container) {
            const syncBtn = container.querySelector('#syncCloudBtn');
            const closeBtn = container.querySelector('#closeProfileBtn');
            const signOutBtn = container.querySelector('#signOutBtn');

            closeBtn?.addEventListener('click', () => {
                this.authUI.hide();
            });

            syncBtn?.addEventListener('click', async () => {
                syncBtn.disabled = true;
                syncBtn.textContent = 'SYNCING...';
                await this.authUI.syncLocalToCloud();
                syncBtn.textContent = 'SAVE SYNCED!';
                setTimeout(() => {
                    syncBtn.disabled = false;
                    syncBtn.textContent = 'Sync Save to Cloud';
                }, 1500);
            });

            signOutBtn?.addEventListener('click', async () => {
                if (confirm('Are you sure you want to sign out? Your current progress remains safely saved.')) {
                    await this.authUI.signOut();
                }
            });
        }
    }

    window.AccountProfileScreen = AccountProfileScreen;
})();
