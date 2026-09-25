// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - STORY RECAP UI
// Visual decision timeline, NPC affinity charts, and faction standing chronicle.
// ============================================================================

(function () {
  'use strict';

  class StoryRecapUI {
    constructor() {
      this.container = null;
      this.isVisible = false;
    }

    init() {
      this._buildDOM();
      return this;
    }

    _buildDOM() {
      if (document.getElementById('story-recap-modal')) return;

      const modal = document.createElement('div');
      modal.id = 'story-recap-modal';
      modal.className = 'story-recap-overlay hidden';
      modal.innerHTML = `
        <div class="story-recap-panel">
          <div class="recap-header">
            <h2>📜 Chronicles of the Whispering Wilds (பயண வரலாறு)</h2>
            <button id="close-recap-btn" class="recap-close-x" title="Close [Esc]">&times;</button>
          </div>

          <div class="recap-body-tabs">
            <div id="recap-ending-banner" class="recap-ending-card">
              <!-- Ending outcome banner -->
            </div>

            <div class="recap-grid-two-column">
              <!-- Left Column: Decision Timeline -->
              <div class="recap-column">
                <h3>🧭 Key Decisions & Consequences</h3>
                <div id="recap-timeline-list" class="recap-timeline-container">
                  <!-- Timeline items injected here -->
                </div>
              </div>

              <!-- Right Column: NPC Bonds & Faction Standing -->
              <div class="recap-column">
                <h3>👥 NPC Bonds & Community Trust</h3>
                <div id="recap-npc-list" class="recap-npc-bonds-container">
                  <!-- NPC meters injected here -->
                </div>

                <h3 style="margin-top: 20px;">🏛️ Faction Standings</h3>
                <div id="recap-faction-list" class="recap-factions-container">
                  <!-- Faction bars injected here -->
                </div>
              </div>
            </div>
          </div>

          <div class="recap-footer">
            <button id="recap-ngplus-btn" class="btn-highlight">✨ Enter New Game+</button>
            <button id="recap-close-btn" class="btn-secondary">Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.container = modal;

      document.getElementById('close-recap-btn')?.addEventListener('click', () => this.hide());
      document.getElementById('recap-close-btn')?.addEventListener('click', () => this.hide());
      document.getElementById('recap-ngplus-btn')?.addEventListener('click', () => {
        this.hide();
        if (window.NewGamePlusUI) window.NewGamePlusUI.show();
      });
    }

    show() {
      if (!this.container) this.init();

      const recapSystem = window.StoryRecapSystem;
      const data = recapSystem ? recapSystem.generateRecap() : null;
      if (!data) return;

      // Populate Ending Banner
      const endingBanner = document.getElementById('recap-ending-banner');
      if (endingBanner && data.ending) {
        endingBanner.innerHTML = `
          <div class="recap-ending-icon">${data.ending.badgeIcon || '🌿'}</div>
          <div>
            <div class="recap-ending-tamil">${data.ending.tamilTitle || ''}</div>
            <div class="recap-ending-title">${data.ending.title}</div>
            <p class="recap-ending-desc">${data.ending.summary}</p>
          </div>
        `;
      }

      // Populate Decision Timeline
      const timelineList = document.getElementById('recap-timeline-list');
      if (timelineList) {
        timelineList.innerHTML = '';
        if (data.timeline && data.timeline.length > 0) {
          data.timeline.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'recap-decision-item';
            card.innerHTML = `
              <div class="decision-badge">Step ${index + 1}</div>
              <div class="decision-title"><strong>${item.title}</strong> (${item.tamilTitle})</div>
              <div class="decision-choice">➤ ${item.chosenOption}</div>
              <div class="decision-consequence"><em>"${item.consequence}"</em></div>
            `;
            timelineList.appendChild(card);
          });
        } else {
          timelineList.innerHTML = '<div class="empty-recap-note">No major branch points recorded yet.</div>';
        }
      }

      // Populate NPC Bonds
      const npcList = document.getElementById('recap-npc-list');
      if (npcList) {
        npcList.innerHTML = '';
        if (data.npcBonds) {
          data.npcBonds.forEach(npc => {
            const row = document.createElement('div');
            row.className = 'recap-npc-row';
            row.innerHTML = `
              <div class="npc-meta">
                <strong>${npc.name}</strong> <span>(${npc.tierLabel})</span>
              </div>
              <div class="npc-bar-track">
                <div class="npc-bar-fill" style="width: ${npc.affinity}%;"></div>
              </div>
            `;
            npcList.appendChild(row);
          });
        }
      }

      // Populate Factions
      const factionList = document.getElementById('recap-faction-list');
      if (factionList) {
        factionList.innerHTML = '';
        if (data.factionStandings) {
          data.factionStandings.forEach(f => {
            const row = document.createElement('div');
            row.className = 'recap-faction-row';
            row.innerHTML = `
              <div class="faction-meta">
                <strong>${f.name}</strong> <span>${f.status}</span>
              </div>
              <div class="faction-bar-track">
                <div class="faction-bar-fill" style="width: ${f.score}%;"></div>
              </div>
            `;
            factionList.appendChild(row);
          });
        }
      }

      this.container.classList.remove('hidden');
      this.isVisible = true;
    }

    hide() {
      if (this.container) {
        this.container.classList.add('hidden');
        this.isVisible = false;
      }
    }
  }

  const instance = new StoryRecapUI();

  if (typeof window !== 'undefined') {
    window.StoryRecapUI = instance;
    window.addEventListener('DOMContentLoaded', () => instance.init());
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StoryRecapUI, instance };
  }
})();
