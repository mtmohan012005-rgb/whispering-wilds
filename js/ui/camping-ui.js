// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CAMPING & REST UI
// Interactive modal for choosing rest duration, conditions, and campfire fuel
// ============================================================================

(function() {
  'use strict';

  class CampingUI {
    constructor() {
      this.modal = null;
      this.promptEl = null;
      this._initDOM();
    }

    _initDOM() {
      if (document.getElementById('rest-interaction-modal')) {
        this.modal = document.getElementById('rest-interaction-modal');
        return;
      }

      // 1. In-World Interaction Prompt Tooltip
      const prompt = document.createElement('div');
      prompt.id = 'camp-interaction-prompt';
      prompt.className = 'camp-prompt-toast hidden';
      prompt.innerHTML = `<span class="camp-prompt-key">[E]</span> <span id="camp-prompt-action">Rest at Campfire</span>`;
      document.body.appendChild(prompt);
      this.promptEl = prompt;

      // 2. Rest Selection Modal
      const modal = document.createElement('div');
      modal.id = 'rest-interaction-modal';
      modal.className = 'rest-modal-container hidden';
      modal.innerHTML = `
        <div class="rest-modal-backdrop"></div>
        <div class="rest-modal-card">
          <div class="rest-modal-header">
            <h3>⛺ REST & RECUPERATE (ஓய்வு)</h3>
            <button id="close-rest-modal" class="rest-close-btn">&times;</button>
          </div>
          <div class="rest-modal-body">
            <div class="rest-time-row">
              <div class="time-block">
                <span class="time-label">Current Time</span>
                <span id="rest-current-time" class="time-val">09:00 AM</span>
              </div>
              <div class="time-arrow">➔</div>
              <div class="time-block">
                <span class="time-label">Rest Until</span>
                <span id="rest-target-time" class="time-val">09:45 AM</span>
              </div>
            </div>

            <div class="rest-conditions-row">
              <div class="cond-pill" id="cond-sheltered">🏛️ Sheltered</div>
              <div class="cond-pill" id="cond-warm">🔥 Warm Fire</div>
              <div class="cond-pill" id="cond-safe">🛡️ Safe Zone</div>
            </div>

            <div class="rest-options-grid">
              <button id="opt-short-rest-btn" class="rest-opt-btn active">
                <div class="opt-name">Short Rest (சிறு ஓய்வு)</div>
                <div class="opt-desc">45 mins. Restores +35% Energy and +15% Health.</div>
              </button>
              <button id="opt-long-rest-btn" class="rest-opt-btn">
                <div class="opt-name">Overnight Rest (முழு உறக்கம்)</div>
                <div class="opt-desc">Rest until sunrise (06:30 AM). Restores 100% Energy, +40% Health, and grants Rested Buff.</div>
              </button>
            </div>

            <div class="rest-fuel-section" id="rest-fuel-panel">
              <span>Campfire Fuel: <strong id="camp-fuel-sec">240s</strong></span>
              <button id="add-fuel-btn" class="btn-fuel-action">+ Feed Fire (1 Firewood)</button>
            </div>
          </div>
          <div class="rest-modal-footer">
            <button id="cancel-rest-btn" class="btn-rest-cancel">Cancel</button>
            <button id="execute-rest-btn" class="btn-rest-confirm">REST NOW</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.modal = modal;

      this._bindEvents();
    }

    _bindEvents() {
      this.selectedOption = 'SHORT_REST';

      const shortBtn = document.getElementById('opt-short-rest-btn');
      const longBtn = document.getElementById('opt-long-rest-btn');

      if (shortBtn && longBtn) {
        shortBtn.addEventListener('click', () => {
          this.selectedOption = 'SHORT_REST';
          shortBtn.classList.add('active');
          longBtn.classList.remove('active');
          this._updateTimes();
        });
        longBtn.addEventListener('click', () => {
          this.selectedOption = 'LONG_REST';
          longBtn.classList.add('active');
          shortBtn.classList.remove('active');
          this._updateTimes();
        });
      }

      const closeBtn = document.getElementById('close-rest-modal');
      const cancelBtn = document.getElementById('cancel-rest-btn');
      if (closeBtn) closeBtn.addEventListener('click', () => this.hideRestModal());
      if (cancelBtn) cancelBtn.addEventListener('click', () => this.hideRestModal());

      const confirmBtn = document.getElementById('execute-rest-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
          if (window.restSystem) {
            window.restSystem.performRest(this.selectedOption, {
              shelter: window.campingSystem ? window.campingSystem.getNearbyShelter(window.GameState.player.position) : null,
              isNearCampfire: !!(window.campingSystem && window.campingSystem.getNearbyCampfire(window.GameState.player.position))
            });
          }
          this.hideRestModal();
        });
      }

      const fuelBtn = document.getElementById('add-fuel-btn');
      if (fuelBtn) {
        fuelBtn.addEventListener('click', () => {
          if (window.campingSystem && window.GameState && window.GameState.player) {
            const res = window.campingSystem.addFuelToNearbyCampfire(window.GameState.player.position);
            if (res.success) {
              const fuelTxt = document.getElementById('camp-fuel-sec');
              if (fuelTxt) fuelTxt.innerText = `${Math.round(res.newFuel)}s`;
            } else if (res.reason) {
              alert(res.reason);
            }
          }
        });
      }
    }

    showPrompt(actionText) {
      if (!this.promptEl) return;
      const actSpan = document.getElementById('camp-prompt-action');
      if (actSpan) actSpan.innerText = actionText || 'Rest at Campfire';
      this.promptEl.classList.remove('hidden');
    }

    hidePrompt() {
      if (this.promptEl) this.promptEl.classList.add('hidden');
    }

    showRestModal(context = {}) {
      if (!this.modal) return;
      this._updateTimes();

      const fuelPanel = document.getElementById('rest-fuel-panel');
      if (fuelPanel && context.campfire) {
        fuelPanel.style.display = 'flex';
        const fuelTxt = document.getElementById('camp-fuel-sec');
        if (fuelTxt) fuelTxt.innerText = `${Math.round(context.campfire.fuel)}s`;
      } else if (fuelPanel) {
        fuelPanel.style.display = 'none';
      }

      this.modal.classList.remove('hidden');
    }

    hideRestModal() {
      if (this.modal) this.modal.classList.add('hidden');
    }

    _updateTimes() {
      const currentTimeVal = (window.GameState && window.GameState.world && window.GameState.world.time) || 9.0;
      const currentTxt = document.getElementById('rest-current-time');
      const targetTxt = document.getElementById('rest-target-time');

      const formatTime = (hourDec) => {
        const h = Math.floor(hourDec % 24);
        const m = Math.floor((hourDec % 1) * 60);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : (h % 12);
        return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
      };

      if (currentTxt) currentTxt.innerText = formatTime(currentTimeVal);

      if (targetTxt) {
        if (this.selectedOption === 'SHORT_REST') {
          targetTxt.innerText = formatTime(currentTimeVal + 0.75);
        } else {
          targetTxt.innerText = '06:30 AM (Sunrise)';
        }
      }
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CampingUI;
  } else {
    window.CampingUI = new CampingUI();
  }
})();
