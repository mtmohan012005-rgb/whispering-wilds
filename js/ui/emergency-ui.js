// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - EMERGENCY UI & VIGNETTES
// Visual feedback for cold exposure, overheating, exhaustion, and safe recovery
// ============================================================================

(function() {
  'use strict';

  class EmergencyUI {
    constructor() {
      this.overlayContainer = null;
      this.downedModal = null;
      this._initDOM();
    }

    _initDOM() {
      if (document.getElementById('emergency-vignette-layer')) {
        this.overlayContainer = document.getElementById('emergency-vignette-layer');
        return;
      }

      // Vignette Layer
      const vig = document.createElement('div');
      vig.id = 'emergency-vignette-layer';
      vig.className = 'emergency-vignette-container pointer-events-none';
      vig.innerHTML = `
        <div id="vignette-cold" class="vig-overlay cold-frost hidden"></div>
        <div id="vignette-heat" class="vig-overlay heat-shimmer hidden"></div>
        <div id="vignette-exhausted" class="vig-overlay exhaustion-pulse hidden"></div>
        <div id="vignette-critical" class="vig-overlay critical-red hidden"></div>
      `;
      document.body.appendChild(vig);
      this.overlayContainer = vig;

      // Downed Recovery Modal
      const downed = document.createElement('div');
      downed.id = 'downed-recovery-modal';
      downed.className = 'downed-modal-container hidden';
      downed.innerHTML = `
        <div class="downed-modal-backdrop"></div>
        <div class="downed-card">
          <div class="downed-icon">🌿</div>
          <h2 class="downed-title">YOU HAVE COLLAPSED</h2>
          <p class="downed-message">You succumbed to exhaustion in the wilderness. Local travellers found you and brought you to safety.</p>
          <div class="downed-note">
            <span>🛡️ All inventory items, currency, quests, and customization choices are intact.</span>
          </div>
          <button id="downed-recover-btn" class="downed-btn">WAKE UP AT SAFE HAVEN</button>
        </div>
      `;
      document.body.appendChild(downed);
      this.downedModal = downed;
    }

    updateVignettes(survival, ambientTemp) {
      if (!survival) return;

      const coldEl = document.getElementById('vignette-cold');
      const heatEl = document.getElementById('vignette-heat');
      const exhEl = document.getElementById('vignette-exhausted');
      const critEl = document.getElementById('vignette-critical');

      // Cold frost vignette
      if (coldEl) {
        if (survival.warmth <= 25) coldEl.classList.remove('hidden');
        else coldEl.classList.add('hidden');
      }

      // Heat shimmer vignette
      if (heatEl) {
        if (ambientTemp >= 38.0 && survival.warmth >= 90) heatEl.classList.remove('hidden');
        else heatEl.classList.add('hidden');
      }

      // Exhaustion pulse vignette
      if (exhEl) {
        if (survival.isExhausted) exhEl.classList.remove('hidden');
        else exhEl.classList.add('hidden');
      }

      // Critical red heartbeat vignette
      if (critEl) {
        if (survival.health <= 25) critEl.classList.remove('hidden');
        else critEl.classList.add('hidden');
      }
    }

    showDownedScreen(onRecoverCallback) {
      if (!this.downedModal) return;

      this.downedModal.classList.remove('hidden');
      const btn = document.getElementById('downed-recover-btn');
      if (btn) {
        const handleClick = () => {
          btn.removeEventListener('click', handleClick);
          this.downedModal.classList.add('hidden');
          if (onRecoverCallback) onRecoverCallback();
        };
        btn.addEventListener('click', handleClick);
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyUI;
  } else {
    window.EmergencyUI = new EmergencyUI();
  }
})();
