// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PLATFORM STATUS UI
// Compact status widget for settings/about screen showing platform, cloud, and controller.
// ============================================================================

(function() {
  class PlatformStatusUI {
    constructor() {
      this.element = null;
    }

    render(targetContainer) {
      if (!targetContainer) return;

      const isOnline = window.PlatformIntegrationSystem ? window.PlatformIntegrationSystem.isOnline() : false;
      const hasCloud = window.PlatformIntegrationSystem ? window.PlatformIntegrationSystem.isFeatureSupported('CLOUD_SAVE') : false;
      const user = window.PlatformIntegrationSystem ? window.PlatformIntegrationSystem.getPlatformUser() : null;

      const statusHtml = `
        <div class="platform-status-widget" style="padding: 10px; background: rgba(0,0,0,0.4); border-radius: 6px; margin: 8px 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><strong>Distribution Shell:</strong></span>
            <span>${user ? user.provider.toUpperCase() : 'DIRECT'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><strong>Connection:</strong></span>
            <span style="color: ${isOnline ? '#4ade80' : '#f87171'}">${isOnline ? 'Online' : 'Offline / Standalone'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Cloud Save:</strong></span>
            <span>${hasCloud ? (isOnline ? 'Synced' : 'Pending Reconnect') : 'Local Only (Authoritative)'}</span>
          </div>
        </div>
      `;

      targetContainer.innerHTML = statusHtml;
    }
  }

  window.PlatformStatusUI = new PlatformStatusUI();
})();
