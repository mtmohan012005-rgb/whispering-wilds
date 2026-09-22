// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DIEGETIC FIELD JOURNAL & CLUE BOARD
// Leather-bound book, Photolog, Regional Lore %, and Interactive Red Yarn Clue Board
// ============================================================================

class FieldJournal {
  constructor() {
    this.isOpen = false;
    this.isOlaiSkin = false;
    this.currentTab = 'photolog';
    this.photos = [];
    this.unlockedEntries = new Set(['high_court_gates']); // Starts with Chennai prologue
    this.pinnedClues = new Set(['clue_torn_blueprint']);
    this.yarnConnections = [
      { from: 'clue_torn_blueprint', to: 'clue_enfield_tread' }
    ];

    // Wire up Olai Chuvadi skin button if present in DOM
    const olaiBtn = document.getElementById('toggle-olai-chuvadi');
    if (olaiBtn) {
      olaiBtn.onclick = () => this.toggleOlaiSkin(window.gameAudio);
    }
  }

  toggleOlaiSkin(audio) {
    this.isOlaiSkin = !this.isOlaiSkin;
    const wrapper = document.querySelector('.journal-book-wrapper');
    const olaiBtn = document.getElementById('toggle-olai-chuvadi');
    if (wrapper) {
      wrapper.classList.toggle('olai-chuvadi-theme', this.isOlaiSkin);
    }
    if (olaiBtn) {
      olaiBtn.innerHTML = this.isOlaiSkin ? '📔 Leather Journal' : '📜 ஓலைச்சுவடி (Palm Leaf)';
    }
    if (audio) {
      audio.playPageFlip();
    }
  }

  toggle(audio) {
    this.isOpen = !this.isOpen;
    if (audio) {
      audio.playPageFlip();
    }
    const modal = document.getElementById('journal-modal');
    if (modal) {
      if (this.isOpen) {
        modal.classList.remove('hidden');
        // Ensure Olai Chuvadi button is bound
        const olaiBtn = document.getElementById('toggle-olai-chuvadi');
        if (olaiBtn && !olaiBtn.onclick) {
          olaiBtn.onclick = () => this.toggleOlaiSkin(audio);
        }
        this.render();
      } else {
        modal.classList.add('hidden');
      }
    }
    return this.isOpen;
  }

  switchTab(tabName, audio) {
    this.currentTab = tabName;
    if (audio) audio.playPageFlip();
    this.render();
  }

  addPhoto(photo) {
    this.photos.unshift(photo);
    if (photo.subjectId) {
      this.unlockedEntries.add(photo.subjectId);
    }
  }

  unlockEntry(entryId) {
    this.unlockedEntries.add(entryId);
  }

  togglePinClue(clueId, audio) {
    if (this.pinnedClues.has(clueId)) {
      this.pinnedClues.delete(clueId);
    } else {
      this.pinnedClues.add(clueId);
      if (audio) audio.playPinTap();
    }
    this.render();
  }

  getCompletionPercent() {
    const totalEntries = 8; // Landmarks + Key wildlife
    const discovered = this.unlockedEntries.size;
    return Math.min(100, Math.round((discovered / totalEntries) * 100));
  }

  render() {
    // 1. Update navigation tab active classes
    const tabs = document.querySelectorAll('.journal-tab-btn');
    tabs.forEach(btn => {
      if (btn.dataset.tab === this.currentTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 2. Hide all tab panels
    document.querySelectorAll('.journal-panel').forEach(panel => panel.classList.add('hidden'));

    // 3. Render specific active tab
    const activePanel = document.getElementById(`panel-${this.currentTab}`);
    if (!activePanel) return;
    activePanel.classList.remove('hidden');

    if (this.currentTab === 'photolog') {
      this.renderPhotolog(activePanel);
    } else if (this.currentTab === 'bestiary') {
      this.renderBestiary(activePanel);
    } else if (this.currentTab === 'clueboard') {
      this.renderClueBoard(activePanel);
    } else if (this.currentTab === 'quests') {
      this.renderQuests(activePanel);
    } else if (this.currentTab === 'wardrobe') {
      this.renderWardrobe(activePanel);
    }
  }

  renderPhotolog(container) {
    if (this.photos.length === 0) {
      container.innerHTML = `
        <div class="empty-journal-msg">
          <p>📷 No field snapshots taken yet.</p>
          <p class="sub-msg">Press <strong>[F]</strong> in the field to bring up your mechanical explorer camera and photograph landmarks or rare fauna!</p>
        </div>
      `;
      return;
    }

    let html = '<div class="polaroid-grid">';
    this.photos.forEach(photo => {
      html += `
        <div class="polaroid-card">
          <div class="polaroid-frame">
            <img src="${photo.dataUrl}" alt="${photo.subjectName}" />
          </div>
          <div class="polaroid-caption">
            <h4>${photo.subjectName}</h4>
            <span class="polaroid-meta">${photo.biome} • ${photo.timestamp}</span>
            <p class="polaroid-desc">${photo.lore}</p>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  renderBestiary(container) {
    const landmarks = window.WORLD_DATA.landmarks;
    const wildlife = window.WORLD_DATA.wildlife;
    const percent = this.getCompletionPercent();

    let html = `
      <div class="bestiary-header">
        <h3>Tamil Nadu Regional Field Guide</h3>
        <div class="progress-bar-container">
          <div class="progress-fill" style="width: ${percent}%;"></div>
          <span class="progress-label">${percent}% Discovered</span>
        </div>
      </div>
      <div class="bestiary-list">
    `;

    // Landmarks list
    landmarks.forEach(lm => {
      const isFound = this.unlockedEntries.has(lm.id);
      html += `
        <div class="lore-entry ${isFound ? 'discovered' : 'locked'}">
          <div class="lore-icon">${lm.icon}</div>
          <div class="lore-content">
            <h4>${isFound ? (lm.tamilName + ' (' + lm.name + ')') : '??? Undiscovered Landmark'}</h4>
            <span class="lore-biome">${lm.biome}</span>
            <p>${isFound ? lm.lore : 'Explore the region or use your camera to log this location into your journal.'}</p>
          </div>
        </div>
      `;
    });

    // Wildlife list
    wildlife.forEach(w => {
      const isFound = this.unlockedEntries.has(w.id);
      html += `
        <div class="lore-entry ${isFound ? 'discovered' : 'locked'}">
          <div class="lore-icon">${w.icon}</div>
          <div class="lore-content">
            <h4>${isFound ? w.name : '??? Undocumented Wildlife'}</h4>
            <span class="lore-biome">${w.biome} • ${w.rarity.toUpperCase()}</span>
            <p>${isFound ? w.lore : 'Photograph this creature in the wild to document its habits and habitat.'}</p>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  renderClueBoard(container) {
    const clues = window.DIALOGUE_DATA.clues;
    let html = `
      <div class="clueboard-container">
        <div class="clueboard-cork">
          <div class="clueboard-title">
            <h3>📌 Investigation Board: The Syndicate & Eco-Sanctuary</h3>
            <p>Connect evidence from the Madras High Court heist to unmask the syndicate and locate Pasumai Thadam.</p>
          </div>
          <div class="clue-pins-area">
    `;

    clues.forEach(clue => {
      const isPinned = this.pinnedClues.has(clue.id);
      html += `
        <div class="cork-pin-item ${isPinned ? 'pinned' : ''}" onclick="window.gameJournal.togglePinClue('${clue.id}', window.gameAudio)">
          <div class="pushpin red-pin"></div>
          <h4>${clue.title}</h4>
          <span class="clue-tag">${clue.biome}</span>
          <p>${clue.lore}</p>
          <span class="pin-status">${isPinned ? '📍 Pinned with Red Yarn' : '➕ Click to Pin to Board'}</span>
        </div>
      `;
    });

    html += `
          </div>
          <!-- Red string visual representation -->
          <svg class="clue-yarn-svg" viewBox="0 0 700 350">
            <line x1="140" y1="120" x2="380" y2="120" stroke="#d63031" stroke-width="2.5" stroke-dasharray="4" />
            <line x1="380" y1="120" x2="580" y2="160" stroke="#d63031" stroke-width="2.5" stroke-dasharray="4" />
          </svg>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  renderQuests(container) {
    if (!window.gameQuests) return;
    const quests = window.gameQuests.quests;
    let html = '<div class="quest-log-list">';
    quests.forEach(q => {
      html += `
        <div class="quest-item ${q.status}">
          <div class="quest-badge">${q.status === 'completed' ? '✓ COMPLETED' : 'ACTIVE MISSION'}</div>
          <h4>${q.title}</h4>
          <p class="quest-desc">${q.description}</p>
          <div class="quest-objectives">
            ${q.objectives.map(obj => `
              <div class="obj-item ${obj.done ? 'done' : ''}">
                <span class="obj-check">${obj.done ? '☑' : '☐'}</span>
                <span>${obj.text}</span>
              </div>
            `).join('')}
          </div>
          <div class="quest-reward">Reward: ${q.reward}</div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  renderWardrobe(container) {
    const player = window.gamePlayer || (window.testRef && window.testRef.player);
    const survival = window.gameSurvival || (window.testRef && window.testRef.survival);
    const currentOutfit = player ? player.currentOutfit : 'baseOutfit';
    const currentRupees = (player && player.currency !== undefined) ? player.currency : (survival ? survival.currency : 0);
    const wardrobe = window.culturalWardrobeSystem;

    // Check player inventory
    if (player && !player.inventory) {
      player.inventory = [
        wardrobe.tradeableClothingItems[0] // Starts with base veshti
      ];
    }

    let html = `
      <div style="padding: 10px 14px 6px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="font-family: 'Cinzel', serif; font-size: 1.15rem; color: var(--primary-gold); margin-bottom: 4px;">
            ஆடைகள் & வர்த்தகம் • Cultural Wardrobe & Merchant Trade
          </h3>
          <p style="font-size: 0.85rem; color: #a4b0be; margin-bottom: 0;">
            Acquire and equip authentic regional attire tailored for Tamil Nadu’s heat, mud, and mountain cold.
          </p>
        </div>
        <div class="wardrobe-price-tag" style="font-size: 0.95rem; padding: 6px 14px;">
          💰 Player Funds: <span style="color: #55efc4; font-weight: 700;">₹${currentRupees}</span>
        </div>
      </div>

      <div class="wardrobe-grid">
    `;

    // Render Tradeable Clothing Items
    wardrobe.tradeableClothingItems.forEach(item => {
      const isEquipped = currentOutfit === item.outfitKey;
      const isOwned = player && player.inventory && player.inventory.some(i => i.itemId === item.itemId || i.outfitKey === item.outfitKey);

      html += `
        <div class="wardrobe-card ${isEquipped ? 'equipped' : ''}">
          <div class="wardrobe-header-row">
            <div>
              <h3>${item.icon} ${item.name}</h3>
              <span class="tamil-sub">${item.tamilName} • 📍 ${item.regionUnlocked}</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <span class="wardrobe-status-tag ${isEquipped ? 'active' : ''}">
                ${isEquipped ? '✓ EQUIPPED' : (isOwned ? 'OWNED' : `₹${item.price}`)}
              </span>
            </div>
          </div>

          <div class="wardrobe-items-list">
            <div class="wardrobe-item-row">
              <span class="icon">👕</span>
              <span><strong>Attire:</strong> ${item.clothing}</span>
            </div>
            <div class="wardrobe-item-row">
              <span class="icon">👞</span>
              <span><strong>Footwear:</strong> ${item.footwear}</span>
            </div>
            <div class="wardrobe-item-row">
              <span class="icon">📜</span>
              <span><strong>Lore:</strong> ${item.description}</span>
            </div>
          </div>

          <div class="wardrobe-stats-box">
            <div style="font-weight: 700; color: var(--primary-gold); margin-bottom: 2px;">⚡ SURVIVAL SPECIFICATIONS:</div>
            <div class="stat-pills-row">
              <span class="stat-pill heat">🔥 Heat Res: ${item.stats.heatResistance > 0 ? '+' : ''}${item.stats.heatResistance}</span>
              <span class="stat-pill cold">❄️ Cold Res: +${item.stats.coldResistance}</span>
              <span class="stat-pill mobility">🏃 Mobility: ${item.stats.mobility || item.stats.durability}</span>
            </div>
          </div>

          ${isEquipped ? `
            <button class="btn-equip-outfit" disabled>
              ✓ Currently Equipped
            </button>
          ` : (isOwned ? `
            <button class="btn-equip-outfit" onclick="window.tradeOrBuyClothing(null, '${item.itemId}')">
              Equip This Attire (அணியுங்கள்)
            </button>
          ` : `
            <button class="btn-trade-outfit" onclick="window.tradeOrBuyClothing(null, '${item.itemId}')">
              🛒 Buy / Trade for ₹${item.price} (வாங்க)
            </button>
          `)}
        </div>
      `;
    });

    html += `
      </div>

      <!-- Regional Locals & Cultural Characters -->
      <div class="roster-section-header">
        <h4 style="font-family: 'Cinzel', serif; font-size: 1.05rem; color: var(--primary-gold); margin-bottom: 2px;">
          உள்ளூர் ஆட்கள் & பாரம்பரிய உடை • Regional Characters & Attire
        </h4>
        <p style="font-size: 0.8rem; color: #a4b0be; margin: 0;">
          Authentic attire and wisdom from locals across George Town, Villupuram, and the Nilgiris.
        </p>
      </div>

      <div class="roster-grid">
    `;

    wardrobe.characters.forEach(char => {
      html += `
        <div class="character-card">
          <div class="char-header">
            <div class="char-avatar">${char.avatar}</div>
            <div>
              <div class="char-name">${char.name}</div>
              <div class="char-region">📍 ${char.region}</div>
            </div>
          </div>
          <div class="char-outfit-box">
            <strong>Traditional Outfit:</strong> ${char.defaultOutfit}
          </div>
          <p class="char-quote">"${char.dialogue}"</p>
          <div style="font-size: 0.75rem; color: #b2bec3; line-height: 1.3;">${char.lore}</div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }
}

window.equipPlayerAttire = function(outfitId) {
  const wardrobe = window.culturalWardrobeSystem;
  let itemId = 'cloth_veshti';
  if (outfitId === 'farmlandGear') itemId = 'cloth_cargo';
  else if (outfitId === 'mountainGear') itemId = 'cloth_woolen_set';

  // Use tradeOrBuyClothing logic
  window.tradeOrBuyClothing(null, itemId);
};

window.FieldJournal = FieldJournal;
