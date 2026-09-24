/**
 * The Whispering Wilds (Kaattu Vazhi) - Player Customization UI
 * Polished modal interface with live 3D preview, confirmation dialogues,
 * remaining change meter (X / 5), and history log.
 */

class PlayerCustomizationUI {
  constructor(system) {
    this.system = system || window.playerCustomizationSystem;
    this.isOpen = false;
    this.selectedCandidate = null;
    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    let modal = document.getElementById('customization-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customization-modal';
      modal.className = 'customization-modal-overlay hidden';
      document.body.appendChild(modal);
    }
    this.modalEl = modal;
    this.render();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Toggle with P key (when not typing in an input)
      if (e.code === 'KeyP' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          this.toggle();
        }
      }
      if (e.code === 'Escape' && this.isOpen) {
        this.handleCancel();
      }
    });

    if (this.system) {
      this.system.addEventListener('playerCustomizationConfirmed', () => this.render());
      this.system.addEventListener('playerCustomizationLimitReached', () => this.render());
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  show() {
    this.open();
  }

  hide() {
    this.close();
  }

  open() {
    if (!this.system) this.system = window.playerCustomizationSystem;
    this.isOpen = true;
    this.selectedCandidate = { ...this.system.activeConfiguration };
    this.modalEl.classList.remove('hidden');
    this.render();
    if (window.gameAudio) window.gameAudio.playPinTap();
  }

  close() {
    if (this.system && this.system.previewConfiguration) {
      this.system.cancel();
    }
    this.isOpen = false;
    this.modalEl.classList.add('hidden');
    if (window.gameAudio) window.gameAudio.playPinTap();
  }

  handlePreview() {
    if (!this.system) return;
    this.system.preview(this.selectedCandidate);
    this.render();
    if (window.gameAudio) window.gameAudio.playPinTap();
  }

  handleConfirm() {
    if (!this.system) return;
    const res = this.system.confirm(this.selectedCandidate);
    if (res.success) {
      if (res.changeConsumed) {
        if (window.gameAudio) window.gameAudio.playDiscoveryJingle();
      } else {
        if (window.gameAudio) window.gameAudio.playPinTap();
      }
      this.render();
    } else {
      alert(`⚠️ Cannot customize: ${res.errors.join(', ')}`);
    }
  }

  handleCancel() {
    if (this.system) {
      this.system.cancel();
    }
    this.close();
  }

  applyPreset(presetId) {
    if (!this.system || !this.system.config.appearancePresets) return;
    const preset = this.system.config.appearancePresets[presetId];
    if (!preset) return;

    this.selectedCandidate = {
      outfitId: preset.outfitId,
      hairstyleId: preset.hairstyleId,
      accessoryId: preset.accessoryId,
      footwearId: preset.footwearId,
      appearancePresetId: preset.id
    };
    this.handlePreview();
  }

  render() {
    if (!this.system) return;

    const remaining = this.system.getRemainingChanges();
    const used = this.system.customizationChangesUsed;
    const isLocked = !this.system.canCustomize();
    const cfg = this.system.config || window.PLAYER_CUSTOMIZATION_CONFIG;
    const active = this.system.activeConfiguration;
    const current = this.selectedCandidate || active;

    const outfitList = cfg.outfits || {};
    const hairList = cfg.hairstyles || {};
    const accList = cfg.accessories || {};
    const footList = cfg.footwear || {};
    const presets = cfg.appearancePresets || {};

    const historyItems = this.system.history.map(h => {
      const prevName = (cfg.outfits[h.previousConfiguration.outfitId] || {}).name || h.previousConfiguration.outfitId;
      const newName = (cfg.outfits[h.newConfiguration.outfitId] || {}).name || h.newConfiguration.outfitId;
      return `
        <div class="custom-history-item">
          <span class="custom-history-badge">Change ${h.changeIndex}/5</span>
          <span class="custom-history-time">${h.formattedTime}</span>
          <div class="custom-history-flow">${prevName} ➔ <strong>${newName}</strong></div>
        </div>
      `;
    }).join('');

    this.modalEl.innerHTML = `
      <div class="customization-card">
        <div class="custom-header">
          <div class="custom-title-block">
            <h2>👤 PLAYER CUSTOMIZATION</h2>
            <div class="custom-subtitle">Culturally Authentic Tamil Nadu Explorer Wardrobe & Progression</div>
          </div>
          <div class="custom-meter-badge ${isLocked ? 'meter-locked' : ''}">
            <div class="meter-label">CHANGES REMAINING</div>
            <div class="meter-count">${remaining} / 5</div>
          </div>
          <button class="custom-close-btn" id="custom-close-x">&times;</button>
        </div>

        ${isLocked ? `
          <div class="custom-lock-banner">
            🔒 <strong>PLAYER CUSTOMIZATION LIMIT REACHED (5/5 Used)</strong>
            <p>Your character's permanent explorer identity has been forged for this playthrough. Changes can only be reset via a deliberate New Game.</p>
          </div>
        ` : `
          <div class="custom-info-banner">
            💡 <strong>Progression Rule:</strong> You have a maximum of 5 permanent appearance changes. Use <em>Preview</em> freely without consuming changes. Confirming consumes exactly 1 change.
          </div>
        `}

        <div class="custom-content-grid">
          <!-- Left Column: Slot Selections -->
          <div class="custom-column">
            <!-- Presets -->
            <div class="custom-section">
              <label class="custom-section-title">🌟 REGIONAL PRESETS</label>
              <div class="custom-preset-row">
                ${Object.values(presets).map(p => `
                  <button class="preset-pill-btn ${current.appearancePresetId === p.id ? 'active' : ''}"
                          data-preset="${p.id}" ${isLocked ? 'disabled' : ''}>
                    ${p.name.split(':')[0]}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Outfits -->
            <div class="custom-section">
              <label class="custom-section-title">🥻 OUTFIT</label>
              <div class="custom-options-list">
                ${Object.values(outfitList).map(o => `
                  <div class="custom-option-card ${current.outfitId === o.id ? 'selected' : ''}" data-outfit="${o.id}">
                    <div class="opt-icon">${o.icon}</div>
                    <div class="opt-details">
                      <div class="opt-name">${o.name}</div>
                      <div class="opt-desc">${o.clothing}</div>
                      <div class="opt-stat">${o.stats.coldResistance ? `❄️ Cold: +${o.stats.coldResistance}` : ''} ${o.stats.heatResistance ? `☀️ Heat: +${o.stats.heatResistance}` : ''} ${o.stats.gatheringBonus || o.stats.charisma || ''}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Hairstyles -->
            <div class="custom-section">
              <label class="custom-section-title">✂️ HAIRSTYLE</label>
              <div class="custom-options-row">
                ${Object.values(hairList).map(h => `
                  <button class="hair-pill-btn ${current.hairstyleId === h.id ? 'active' : ''}"
                          data-hair="${h.id}" ${isLocked ? 'disabled' : ''}>
                    ${h.name.split('(')[0]}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Accessories -->
            <div class="custom-section">
              <label class="custom-section-title">🎒 ACCESSORY</label>
              <div class="custom-options-row">
                ${Object.values(accList).map(a => `
                  <button class="acc-pill-btn ${current.accessoryId === a.id ? 'active' : ''}"
                          data-acc="${a.id}" ${isLocked ? 'disabled' : ''}>
                    ${a.name.split('(')[0]}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Footwear -->
            <div class="custom-section">
              <label class="custom-section-title">👞 FOOTWEAR</label>
              <div class="custom-options-row">
                ${Object.values(footList).map(f => `
                  <button class="foot-pill-btn ${current.footwearId === f.id ? 'active' : ''}"
                          data-foot="${f.id}" ${isLocked ? 'disabled' : ''}>
                    ${f.name.split('(')[0]}
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column: History & Actions -->
          <div class="custom-column custom-summary-col">
            <div class="custom-section">
              <label class="custom-section-title">📜 CUSTOMIZATION HISTORY</label>
              <div class="custom-history-box">
                ${historyItems || '<div class="no-history-text">No permanent changes committed yet (0/5 used).</div>'}
              </div>
            </div>

            <div class="custom-active-summary">
              <label class="custom-section-title">CURRENT SELECTION</label>
              <div class="summary-line"><strong>Outfit:</strong> ${(outfitList[current.outfitId] || {}).name || current.outfitId}</div>
              <div class="summary-line"><strong>Hair:</strong> ${(hairList[current.hairstyleId] || {}).name || current.hairstyleId}</div>
              <div class="summary-line"><strong>Accessory:</strong> ${(accList[current.accessoryId] || {}).name || current.accessoryId}</div>
              <div class="summary-line"><strong>Footwear:</strong> ${(footList[current.footwearId] || {}).name || current.footwearId}</div>
            </div>

            <div class="custom-actions-bar">
              <button class="custom-btn preview-btn" id="custom-preview-btn">👁️ Preview 3D</button>
              <button class="custom-btn confirm-btn ${isLocked ? 'disabled' : ''}" id="custom-confirm-btn" ${isLocked ? 'disabled' : ''}>
                ✓ Confirm Change (${remaining} Left)
              </button>
              <button class="custom-btn cancel-btn" id="custom-cancel-btn">✕ Cancel</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Attach listeners
    this.modalEl.querySelector('#custom-close-x').onclick = () => this.handleCancel();
    this.modalEl.querySelector('#custom-cancel-btn').onclick = () => this.handleCancel();
    this.modalEl.querySelector('#custom-preview-btn').onclick = () => this.handlePreview();

    const confirmBtn = this.modalEl.querySelector('#custom-confirm-btn');
    if (confirmBtn && !isLocked) {
      confirmBtn.onclick = () => this.handleConfirm();
    }

    // Outfit clicks
    this.modalEl.querySelectorAll('.custom-option-card').forEach(card => {
      card.onclick = () => {
        if (isLocked) return;
        this.selectedCandidate.outfitId = card.getAttribute('data-outfit');
        this.handlePreview();
      };
    });

    // Hairstyle clicks
    this.modalEl.querySelectorAll('.hair-pill-btn').forEach(btn => {
      btn.onclick = () => {
        if (isLocked) return;
        this.selectedCandidate.hairstyleId = btn.getAttribute('data-hair');
        this.handlePreview();
      };
    });

    // Accessory clicks
    this.modalEl.querySelectorAll('.acc-pill-btn').forEach(btn => {
      btn.onclick = () => {
        if (isLocked) return;
        this.selectedCandidate.accessoryId = btn.getAttribute('data-acc');
        this.handlePreview();
      };
    });

    // Footwear clicks
    this.modalEl.querySelectorAll('.foot-pill-btn').forEach(btn => {
      btn.onclick = () => {
        if (isLocked) return;
        this.selectedCandidate.footwearId = btn.getAttribute('data-foot');
        this.handlePreview();
      };
    });

    // Preset clicks
    this.modalEl.querySelectorAll('.preset-pill-btn').forEach(btn => {
      btn.onclick = () => {
        if (isLocked) return;
        this.applyPreset(btn.getAttribute('data-preset'));
      };
    });
  }
}

window.PlayerCustomizationUI = PlayerCustomizationUI;
