// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REPLAY SUMMARY UI
// Post-game scenario selector, chapter replay launcher, and exploration dossier.
// ============================================================================

(function () {
  'use strict';

  class ReplaySummaryUI {
    constructor() {
      this.container = null;
      this.isVisible = false;
    }

    init() {
      this._buildDOM();
      return this;
    }

    _buildDOM() {
      if (document.getElementById('replay-summary-modal')) return;

      const modal = document.createElement('div');
      modal.id = 'replay-summary-modal';
      modal.className = 'replay-summary-overlay hidden';
      modal.innerHTML = `
        <div class="replay-summary-panel">
          <div class="replay-summary-header">
            <h2>🔁 Chapter Replay & Scenario Dossier (அத்தியாய மறுபயணம்)</h2>
            <button id="close-replay-summary-btn" class="recap-close-x" title="Close">&times;</button>
          </div>

          <div class="replay-summary-body">
            <div class="replay-stats-bar" id="replay-stats-metrics">
              <!-- Stats summary bar -->
            </div>

            <h3>📍 Select Chapter Scenario to Replay:</h3>
            <div id="replay-scenarios-grid" class="replay-scenarios-container">
              <!-- Scenarios cards injected here -->
            </div>
          </div>

          <div class="replay-summary-footer">
            <button id="replay-summary-close-btn" class="btn-secondary">Back to Exploration</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.container = modal;

      document.getElementById('close-replay-summary-btn')?.addEventListener('click', () => this.hide());
      document.getElementById('replay-summary-close-btn')?.addEventListener('click', () => this.hide());
    }

    show() {
      if (!this.container) this.init();

      this._renderStats();
      this._renderScenarios();
      this.container.classList.remove('hidden');
      this.isVisible = true;
    }

    _renderStats() {
      const metricsBar = document.getElementById('replay-stats-metrics');
      if (!metricsBar) return;

      const replaySystem = window.ReplaySystem;
      const summary = replaySystem ? replaySystem.generatePlaythroughSummary() : {};
      const customUsed = window.GameState?.player?.customizationChangesUsed ?? 0;

      metricsBar.innerHTML = `
        <div class="stat-box">
          <span class="stat-val">${summary.totalPlaytimeMinutes || 0}m</span>
          <span class="stat-lbl">Playtime</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${summary.evidenceCollected?.length || 0} / 7</span>
          <span class="stat-lbl">Evidence Found</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${customUsed} / 5</span>
          <span class="stat-lbl">Customization Changes</span>
        </div>
        <div class="stat-box">
          <span class="stat-val">${summary.ending?.code || 'In Progress'}</span>
          <span class="stat-lbl">Ending Status</span>
        </div>
      `;
    }

    _renderScenarios() {
      const grid = document.getElementById('replay-scenarios-grid');
      if (!grid) return;

      grid.innerHTML = '';
      const scenarios = window.ReplayData?.getAllScenarios() || [];

      scenarios.forEach(sc => {
        const card = document.createElement('div');
        card.className = 'scenario-card';
        card.innerHTML = `
          <h4>${sc.title}</h4>
          <div class="scenario-tamil">${sc.tamilTitle}</div>
          <p>${sc.description}</p>
          <button class="btn-primary btn-sm launch-scenario-btn" data-scenario="${sc.chapterId}">
            ▶ Replay This Chapter
          </button>
        `;

        card.querySelector('.launch-scenario-btn')?.addEventListener('click', () => {
          this._launchScenario(sc.chapterId);
        });

        grid.appendChild(card);
      });
    }

    _launchScenario(chapterId) {
      const replaySystem = window.ReplaySystem;
      if (!replaySystem) return;

      const success = replaySystem.replayChapter(chapterId);
      if (success) {
        this.hide();
      }
    }

    hide() {
      if (this.container) {
        this.container.classList.add('hidden');
        this.isVisible = false;
      }
    }
  }

  const instance = new ReplaySummaryUI();

  if (typeof window !== 'undefined') {
    window.ReplaySummaryUI = instance;
    window.addEventListener('DOMContentLoaded', () => instance.init());
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReplaySummaryUI, instance };
  }
})();
