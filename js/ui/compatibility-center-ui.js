/**
 * The Whispering Wilds - Compatibility Center UI
 * In-game System Information panel displaying hardware tiers, active profile,
 * display/audio/input status, and privacy-safe diagnostic export.
 */
(function(root) {
  'use strict';

  class CompatibilityCenterUI {
    constructor() {
      this.container = null;
      this.visible = false;
      this.initDOM();
    }

    initDOM() {
      if (typeof document === 'undefined') return;
      if (document.getElementById('compatibility-center-modal')) {
        this.container = document.getElementById('compatibility-center-modal');
        return;
      }

      this.container = document.createElement('div');
      this.container.id = 'compatibility-center-modal';
      this.container.className = 'compatibility-center-modal hidden';
      this.container.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 15, 12, 0.85);
        backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #e8f5e9;
      `;

      this.container.innerHTML = `
        <div style="background: #1b2e22; border: 1px solid #4caf50; border-radius: 8px; width: 560px; max-width: 90vw; padding: 24px; box-shadow: 0 12px 32px rgba(0,0,0,0.6);">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2e7d32; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 1.3rem; color: #81c784;">SYSTEM INFORMATION & COMPATIBILITY</h2>
            <button id="close-compat-center-btn" style="background: transparent; border: none; color: #a5d6a7; font-size: 1.2rem; cursor: pointer;">✕</button>
          </div>
          <div id="compat-info-body" style="font-size: 0.95rem; line-height: 1.6; max-height: 50vh; overflow-y: auto;">
            <!-- Dynamically populated -->
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 20px; border-top: 1px solid #2e7d32; padding-top: 16px;">
            <button id="export-diagnostics-btn" style="background: #2e7d32; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Export Diagnostics</button>
            <button id="dismiss-compat-btn" style="background: #37474f; border: none; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(this.container);

      const closeBtn = this.container.querySelector('#close-compat-center-btn');
      const dismissBtn = this.container.querySelector('#dismiss-compat-btn');
      const exportBtn = this.container.querySelector('#export-diagnostics-btn');

      if (closeBtn) closeBtn.onclick = () => this.hide();
      if (dismissBtn) dismissBtn.onclick = () => this.hide();
      if (exportBtn) exportBtn.onclick = () => this.exportDiagnostics();
    }

    show() {
      if (!this.container) this.initDOM();
      this.refreshData();
      if (this.container) {
        this.container.classList.remove('hidden');
        this.container.style.display = 'flex';
      }
      this.visible = true;
    }

    hide() {
      if (this.container) {
        this.container.classList.add('hidden');
        this.container.style.display = 'none';
      }
      this.visible = false;
    }

    refreshData() {
      const body = this.container ? this.container.querySelector('#compat-info-body') : null;
      if (!body) return;

      const sys = root.RuntimeCompatibilitySystemInstance;
      const profile = sys ? sys.getPlatformProfile() : {};
      const activeTier = sys ? sys.getActiveTier() : 'MEDIUM';

      body.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div><strong>OS:</strong> ${profile.os || 'UNKNOWN'}</div>
          <div><strong>Architecture:</strong> ${profile.architecture || 'UNKNOWN'}</div>
          <div><strong>GPU Class:</strong> ${profile.gpuClass || 'UNKNOWN'}</div>
          <div><strong>Graphics Backend:</strong> ${profile.graphicsApi || 'WEBGL2'}</div>
          <div><strong>Recommended Profile:</strong> ${profile.recommendedProfile || 'MEDIUM'}</div>
          <div><strong>Current Active Profile:</strong> <span style="color:#81c784; font-weight:bold;">${activeTier}</span></div>
          <div><strong>Resolution:</strong> ${profile.screenWidth || 1920}x${profile.screenHeight || 1080} (${profile.displayClass || '16:9'})</div>
          <div><strong>Display Scaling (DPR):</strong> ${profile.dpr ? profile.dpr.toFixed(2) : '1.00'}</div>
          <div><strong>Gamepad:</strong> ${profile.inputCapabilities?.gamepad ? 'Connected' : 'Keyboard / Mouse'}</div>
          <div><strong>Audio:</strong> ${profile.audioCapabilities?.webAudio ? 'Active (Web Audio)' : 'Silent Fallback'}</div>
        </div>
      `;
    }

    exportDiagnostics() {
      const sys = root.RuntimeCompatibilitySystemInstance;
      const profile = sys ? sys.getPlatformProfile() : {};
      const activeTier = sys ? sys.getActiveTier() : 'MEDIUM';
      const stability = root.StabilityManagerInstance ? root.StabilityManagerInstance.getReport() : {};

      const diagnostics = {
        title: 'The Whispering Wilds - System Diagnostics',
        timestamp: new Date().toISOString(),
        gameVersion: '1.0.0',
        environment: {
          os: profile.os,
          architecture: profile.architecture,
          gpuClass: profile.gpuClass,
          gpuVendor: profile.gpuVendor,
          graphicsApi: profile.graphicsApi,
          recommendedTier: profile.recommendedProfile,
          activeTier: activeTier,
          display: {
            resolution: `${profile.screenWidth}x${profile.screenHeight}`,
            aspectRatio: profile.displayClass,
            dpr: profile.dpr
          },
          audio: profile.audioCapabilities,
          input: profile.inputCapabilities
        },
        stability: stability
      };

      const jsonStr = JSON.stringify(diagnostics, null, 2);
      console.log('[CompatibilityCenterUI] Exported diagnostics (sanitized, zero PII):', jsonStr);

      // Download file safely in browser
      if (typeof document !== 'undefined') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `whispering-wilds-diagnostics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompatibilityCenterUI;
  } else {
    root.CompatibilityCenterUI = new CompatibilityCenterUI();
  }
})(typeof window !== 'undefined' ? window : global);
