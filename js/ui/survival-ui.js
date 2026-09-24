// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SURVIVAL DETAILS UI
// Slide-out / modal telemetry panel displaying authoritative vitals & status
// ============================================================================

(function() {
  'use strict';

  class SurvivalUI {
    constructor() {
      this.isVisible = false;
      this.container = null;
      this._initDOM();
    }

    _initDOM() {
      if (document.getElementById('survival-details-modal')) {
        this.container = document.getElementById('survival-details-modal');
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'survival-details-modal';
      modal.className = 'survival-modal-container hidden';
      modal.innerHTML = `
        <div class="survival-modal-backdrop"></div>
        <div class="survival-modal-content">
          <div class="survival-modal-header">
            <h3>🌿 Survival Vitals & Exposure (வாழ்வாதாரம்)</h3>
            <button id="close-survival-btn" class="survival-close-btn">&times;</button>
          </div>
          <div class="survival-modal-body">
            <!-- Environment Telemetry Row -->
            <div class="survival-env-strip">
              <div class="env-item">
                <span class="env-label">Region</span>
                <span id="surv-region-val" class="env-val">George Town</span>
              </div>
              <div class="env-item">
                <span class="env-label">Ambient Temp</span>
                <span id="surv-temp-val" class="env-val">31.5°C</span>
              </div>
              <div class="env-item">
                <span class="env-label">Clothing Wetness</span>
                <span id="surv-wetness-val" class="env-val">0%</span>
              </div>
              <div class="env-item">
                <span class="env-label">Exposure</span>
                <span id="surv-exposure-val" class="env-val">Sheltered</span>
              </div>
            </div>

            <!-- Vitals Grid -->
            <div class="survival-vitals-grid">
              <div class="survival-vital-card">
                <div class="vital-header">
                  <span class="vital-title">❤️ Health (உடல்நலம்)</span>
                  <span id="surv-health-text" class="vital-numeric">100 / 100</span>
                </div>
                <div class="vital-meter-track">
                  <div id="surv-health-bar" class="vital-meter-fill health-bar" style="width: 100%;"></div>
                </div>
              </div>

              <div class="survival-vital-card">
                <div class="vital-header">
                  <span class="vital-title">⚡ Energy (ஆற்றல்)</span>
                  <span id="surv-energy-text" class="vital-numeric">100 / 100</span>
                </div>
                <div class="vital-meter-track">
                  <div id="surv-energy-bar" class="vital-meter-fill stamina-bar" style="width: 100%;"></div>
                </div>
              </div>

              <div class="survival-vital-card">
                <div class="vital-header">
                  <span class="vital-title">💧 Hydration (தாகம்)</span>
                  <span id="surv-hydration-text" class="vital-numeric">100 / 100</span>
                </div>
                <div class="vital-meter-track">
                  <div id="surv-hydration-bar" class="vital-meter-fill thirst-bar" style="width: 100%;"></div>
                </div>
              </div>

              <div class="survival-vital-card">
                <div class="vital-header">
                  <span class="vital-title">🍚 Hunger (பசி)</span>
                  <span id="surv-hunger-text" class="vital-numeric">100 / 100</span>
                </div>
                <div class="vital-meter-track">
                  <div id="surv-hunger-bar" class="vital-meter-fill hunger-bar" style="width: 100%;"></div>
                </div>
              </div>

              <div class="survival-vital-card">
                <div class="vital-header">
                  <span class="vital-title">🔥 Core Warmth (வெப்பம்)</span>
                  <span id="surv-warmth-text" class="vital-numeric">80 / 100</span>
                </div>
                <div class="vital-meter-track">
                  <div id="surv-warmth-bar" class="vital-meter-fill temp-bar" style="width: 80%;"></div>
                </div>
              </div>
            </div>

            <!-- Active Status Effects -->
            <div class="survival-effects-section">
              <h4>Active Status Effects</h4>
              <div id="surv-effects-container" class="status-chips-list">
                <span class="status-chip neutral">NORMAL</span>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.container = modal;

      // Event listeners
      const closeBtn = document.getElementById('close-survival-btn');
      if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
      const backdrop = modal.querySelector('.survival-modal-backdrop');
      if (backdrop) backdrop.addEventListener('click', () => this.hide());

      // Keyboard toggle listener [V]
      window.addEventListener('keydown', (e) => {
        if (e.key === 'v' || e.key === 'V') {
          // If no input fields or dialogues are focused
          if (!['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            this.toggle();
          }
        }
      });
    }

    toggle() {
      if (this.isVisible) this.hide();
      else this.show();
    }

    show() {
      this.updateValues();
      if (this.container) {
        this.container.classList.remove('hidden');
        this.isVisible = true;
      }
    }

    hide() {
      if (this.container) {
        this.container.classList.add('hidden');
        this.isVisible = false;
      }
    }

    updateValues() {
      const s = window.GameState && window.GameState.player && window.GameState.player.survival;
      if (!s) return;

      const healthEl = document.getElementById('surv-health-bar');
      const healthTxt = document.getElementById('surv-health-text');
      if (healthEl && healthTxt) {
        healthEl.style.width = `${Math.round(s.health)}%`;
        healthTxt.innerText = `${Math.round(s.health)} / ${s.maxHealth}`;
      }

      const energyEl = document.getElementById('surv-energy-bar');
      const energyTxt = document.getElementById('surv-energy-text');
      if (energyEl && energyTxt) {
        energyEl.style.width = `${Math.round(s.energy)}%`;
        energyTxt.innerText = `${Math.round(s.energy)} / ${s.maxEnergy}`;
      }

      const hydEl = document.getElementById('surv-hydration-bar');
      const hydTxt = document.getElementById('surv-hydration-text');
      if (hydEl && hydTxt) {
        hydEl.style.width = `${Math.round(s.hydration)}%`;
        hydTxt.innerText = `${Math.round(s.hydration)} / ${s.maxHydration}`;
      }

      const hungerEl = document.getElementById('surv-hunger-bar');
      const hungerTxt = document.getElementById('surv-hunger-text');
      if (hungerEl && hungerTxt) {
        hungerEl.style.width = `${Math.round(s.hunger)}%`;
        hungerTxt.innerText = `${Math.round(s.hunger)} / ${s.maxHunger}`;
      }

      const warmthEl = document.getElementById('surv-warmth-bar');
      const warmthTxt = document.getElementById('surv-warmth-text');
      if (warmthEl && warmthTxt) {
        warmthEl.style.width = `${Math.round(s.warmth)}%`;
        warmthTxt.innerText = `${Math.round(s.warmth)} / ${s.maxWarmth}`;
      }

      const wetnessTxt = document.getElementById('surv-wetness-val');
      if (wetnessTxt) wetnessTxt.innerText = `${Math.round(s.wetness)}%`;

      const tempTxt = document.getElementById('surv-temp-val');
      if (tempTxt && window.temperatureSystem) {
        tempTxt.innerText = `${window.temperatureSystem.cachedAmbientTemp}°C`;
      }

      const regionTxt = document.getElementById('surv-region-val');
      if (regionTxt && window.GameState && window.GameState.world) {
        regionTxt.innerText = (window.GameState.world.currentRegion || 'George Town').replace('_', ' ').toUpperCase();
      }

      // Status Effects chips
      const effectsContainer = document.getElementById('surv-effects-container');
      if (effectsContainer) {
        if (!s.statusEffects || s.statusEffects.length === 0) {
          effectsContainer.innerHTML = '<span class="status-chip neutral">NORMAL (இயல்பான நிலை)</span>';
        } else {
          effectsContainer.innerHTML = s.statusEffects.map(fx => {
            let cls = 'neutral';
            if (['WELL_FED', 'HYDRATED', 'RESTED'].includes(fx)) cls = 'positive';
            if (['EXHAUSTED', 'DEHYDRATED', 'HUNGRY', 'COLD', 'VERY_COLD'].includes(fx)) cls = 'negative';
            return `<span class="status-chip ${cls}">${fx}</span>`;
          }).join(' ');
        }
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SurvivalUI;
  } else {
    window.SurvivalUI = new SurvivalUI();
  }
})();
