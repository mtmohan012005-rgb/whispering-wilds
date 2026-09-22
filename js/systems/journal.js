// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DIEGETIC FIELD JOURNAL & CLUE BOARD
// Leather-bound book, Photolog, Regional Lore %, and Interactive Red Yarn Clue Board
// ============================================================================

class FieldJournal {
  constructor() {
    this.isOpen = false;
    this.currentTab = 'photolog';
    this.photos = [];
    this.unlockedEntries = new Set(['high_court_gates']); // Starts with Chennai prologue
    this.pinnedClues = new Set(['clue_torn_blueprint']);
    this.yarnConnections = [
      { from: 'clue_torn_blueprint', to: 'clue_enfield_tread' }
    ];
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
}

window.FieldJournal = FieldJournal;
