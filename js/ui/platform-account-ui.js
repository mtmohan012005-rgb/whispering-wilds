// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLATFORM ACCOUNT UI
// Displays platform linkage status and user profile safely.
// NEVER collects store credentials, passwords, or tokens.
// ============================================================================

(function() {
  class PlatformAccountUI {
    constructor() {
      this.container = null;
    }

    create() {
      if (document.getElementById('platform-account-modal')) return;

      const user = window.PlatformIntegrationSystem ? window.PlatformIntegrationSystem.getPlatformUser() : null;
      const isOnline = window.PlatformIntegrationSystem ? window.PlatformIntegrationSystem.isOnline() : false;

      const modal = document.createElement('div');
      modal.id = 'platform-account-modal';
      modal.className = 'modal-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Platform Account');

      modal.innerHTML = `
        <div class="modal-card platform-card">
          <div class="modal-header">
            <h3>🎮 Platform Identity</h3>
            <button class="modal-close" onclick="window.PlatformAccountUI.close()" aria-label="Close">✕</button>
          </div>
          <div class="modal-body">
            <div class="platform-user-info">
              <div class="platform-badge ${isOnline ? 'online' : 'offline'}">
                ${isOnline ? '● Online Storefront' : '○ Standalone / Offline'}
              </div>
              <p class="user-name"><strong>User:</strong> ${user ? user.displayName : 'Local Explorer'}</p>
              <p class="provider-type"><strong>Provider:</strong> ${user ? user.provider : 'Direct Distribution'}</p>
              <p class="privacy-notice"><small>🔒 Direct platform integration active. No credentials are requested or stored by the game.</small></p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.PlatformAccountUI.close()">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.container = modal;
    }

    close() {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
        this.container = null;
      }
    }
  }

  window.PlatformAccountUI = new PlatformAccountUI();
})();
