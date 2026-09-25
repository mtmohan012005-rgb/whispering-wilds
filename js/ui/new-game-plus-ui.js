// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - NEW GAME+ UI
// Modal configuration for initiating New Game+ cycles, selecting gameplay
// modifiers, inspecting carryovers, and guaranteeing completed save security.
// ============================================================================

(function () {
  'use strict';

  class NewGamePlusUI {
    constructor() {
      this.container = null;
      this.isVisible = false;
      this.selectedModifiers = new Set();
    }

    init() {
      this._buildDOM();
      return this;
    }

    _buildDOM() {
      if (document.getElementById('ngplus-screen-modal')) return;

      const modal = document.createElement('div');
      modal.id = 'ngplus-screen-modal';
      modal.className = 'ngplus-screen-overlay hidden';
      modal.innerHTML = `
        <div class="ngplus-panel">
          <div class="ngplus-header">
            <h2>✨ New Game+ (மறுபயணம் • தேர்ச்சி)</h2>
            <button id="close-ngplus-btn" class="recap-close-x" title="Close">&times;</button>
          </div>

          <div class="ngplus-body">
            <div class="ngplus-security-notice">
              <span class="lock-icon">🔒</span>
              <div>
                <strong>Save Integrity Guaranteed:</strong> Your completed campaign save is safely archived to a permanent completed slot. New Game+ will start in a separate dedicated save slot.
              </div>
            </div>

            <div class="ngplus-summary-box">
              <div class="carryover-col">
                <h4>✅ What Carries Over:</h4>
                <ul>
                  <li>Player Level & Maximum Survival Vitals</li>
                  <li>Master Codex & Wildlife Observation Journal</li>
                  <li>All Earned Achievements & Cosmetic Titles</li>
                  <li>Traditional Garments & Outfits</li>
                  <li>Customization History (Strict ≤ 5 Ceiling Preserved)</li>
                </ul>
              </div>

              <div class="reset-col">
                <h4>🔄 What Resets for New Discovery:</h4>
                <ul>
                  <li>Main Story Chapters & Investigation Objectives</li>
                  <li>Physical Clues & Trade Ledgers</li>
                  <li>Regional Locks (Experience new branch paths)</li>
                  <li>Environmental Puzzles & Mechanisms</li>
                </ul>
              </div>
            </div>

            <h3 style="margin-top: 18px;">⚙️ Select Optional NG+ Modifiers:</h3>
            <div id="ngplus-modifiers-list" class="ngplus-modifiers-container">
              <!-- Checkboxes for modifiers injected here -->
            </div>
          </div>

          <div class="ngplus-footer">
            <button id="ngplus-confirm-launch-btn" class="btn-highlight">🚀 Begin New Game+ Cycle</button>
            <button id="ngplus-cancel-btn" class="btn-secondary">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.container = modal;

      document.getElementById('close-ngplus-btn')?.addEventListener('click', () => this.hide());
      document.getElementById('ngplus-cancel-btn')?.addEventListener('click', () => this.hide());

      document.getElementById('ngplus-confirm-launch-btn')?.addEventListener('click', () => {
        this._launchNGPlus();
      });
    }

    show() {
      if (!this.container) this.init();

      const ngSystem = window.NewGamePlusSystem;
      if (!ngSystem || !ngSystem.canStartNewGamePlus()) {
        alert('You must complete the main story campaign and achieve an ending before starting New Game+.');
        return;
      }

      this._renderModifiers();
      this.container.classList.remove('hidden');
      this.isVisible = true;
    }

    _renderModifiers() {
      const list = document.getElementById('ngplus-modifiers-list');
      if (!list) return;

      list.innerHTML = '';
      const dataModule = window.NewGamePlusData;
      const modifiers = dataModule ? dataModule.getAllModifiers() : [];

      modifiers.forEach(mod => {
        const item = document.createElement('label');
        item.className = 'modifier-checkbox-label';
        item.innerHTML = `
          <input type="checkbox" value="${mod.id}" ${this.selectedModifiers.has(mod.id) ? 'checked' : ''}>
          <div class="mod-info">
            <strong>${mod.name}</strong> <em>(+${Math.round((mod.xpMultiplier - 1) * 100)}% XP)</em>
            <p>${mod.description}</p>
          </div>
        `;

        const checkbox = item.querySelector('input');
        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.selectedModifiers.add(mod.id);
          } else {
            this.selectedModifiers.delete(mod.id);
          }
        });

        list.appendChild(item);
      });
    }

    _launchNGPlus() {
      const ngSystem = window.NewGamePlusSystem;
      if (!ngSystem) return;

      const res = ngSystem.startNewGamePlus({
        modifiers: Array.from(this.selectedModifiers)
      });

      if (res.success) {
        this.hide();
        // Reload or jump to George Town prologue
        if (window.NotificationSystem) {
          window.NotificationSystem.show(`Welcome to New Game+ Cycle ${res.generation}!`, 'success');
        }
      } else {
        alert(res.reason || 'Could not initiate New Game+.');
      }
    }

    hide() {
      if (this.container) {
        this.container.classList.add('hidden');
        this.isVisible = false;
      }
    }
  }

  const instance = new NewGamePlusUI();

  if (typeof window !== 'undefined') {
    window.NewGamePlusUI = instance;
    window.addEventListener('DOMContentLoaded', () => instance.init());
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NewGamePlusUI, instance };
  }
})();
