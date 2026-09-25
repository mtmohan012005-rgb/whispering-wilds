// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENDING CINEMATIC UI
// Displays the final conclusion screen with epilogue narrative scroll,
// rewards granted, and post-game transition actions.
// ============================================================================

(function () {
  'use strict';

  class EndingUI {
    constructor() {
      this.container = null;
      this.isVisible = false;
      this.currentEnding = null;
    }

    init() {
      this._buildDOM();
      return this;
    }

    _buildDOM() {
      if (document.getElementById('ending-screen-modal')) return;

      const modal = document.createElement('div');
      modal.id = 'ending-screen-modal';
      modal.className = 'ending-screen-overlay hidden';
      modal.innerHTML = `
        <div class="ending-content-card">
          <div class="ending-header">
            <span class="ending-badge" id="ending-badge-icon">🌿</span>
            <div class="ending-tamil-title" id="ending-tamil-title">முடிவு</div>
            <h1 class="ending-main-title" id="ending-english-title">The Conclusion</h1>
            <div class="ending-tone-tag" id="ending-tone-tag">Triumphant & Grounded</div>
          </div>

          <div class="ending-epilogue-scroll" id="ending-epilogue-text">
            <!-- Authored narrative paragraphs injected here -->
          </div>

          <div class="ending-rewards-box" id="ending-rewards-box">
            <h4>🏆 Legacy Rewards Unlocked:</h4>
            <div id="ending-rewards-content"></div>
          </div>

          <div class="ending-actions-row">
            <button id="ending-view-recap-btn" class="btn-primary">📜 View Journey Recap</button>
            <button id="ending-free-roam-btn" class="btn-secondary">🗺️ Continue in Free-Roam</button>
            <button id="ending-start-ngplus-btn" class="btn-highlight">✨ New Game+ (Mastery)</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.container = modal;

      // Event listeners
      document.getElementById('ending-view-recap-btn')?.addEventListener('click', () => {
        this.hide();
        if (window.StoryRecapUI) window.StoryRecapUI.show();
      });

      document.getElementById('ending-free-roam-btn')?.addEventListener('click', () => {
        this.hide();
        if (window.ReplaySystem) window.ReplaySystem.enableFreeRoam();
      });

      document.getElementById('ending-start-ngplus-btn')?.addEventListener('click', () => {
        this.hide();
        if (window.NewGamePlusUI) window.NewGamePlusUI.show();
      });
    }

    showEndingScreen(ending) {
      if (!this.container) this.init();
      this.currentEnding = ending;

      document.getElementById('ending-badge-icon').textContent = ending.badgeIcon || '🌿';
      document.getElementById('ending-tamil-title').textContent = ending.tamilTitle || 'முடிவு';
      document.getElementById('ending-english-title').textContent = ending.title || 'The Living Heritage';
      document.getElementById('ending-tone-tag').textContent = ending.tone || 'Grounded';

      const epilogueContainer = document.getElementById('ending-epilogue-text');
      epilogueContainer.innerHTML = '';
      if (Array.isArray(ending.epilogueParagraphs)) {
        ending.epilogueParagraphs.forEach(p => {
          const para = document.createElement('p');
          para.textContent = p;
          epilogueContainer.appendChild(para);
        });
      }

      const rewardsBox = document.getElementById('ending-rewards-content');
      if (rewardsBox && ending.rewards) {
        rewardsBox.innerHTML = `
          <div><strong>Title:</strong> ${ending.rewards.title || 'Explorer of the Wilds'}</div>
          <div><strong>Legacy Perk:</strong> ${ending.rewards.ngPlusPerk || 'Ancestral Harmony'}</div>
        `;
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

  const instance = new EndingUI();

  if (typeof window !== 'undefined') {
    window.EndingUI = instance;
    window.addEventListener('DOMContentLoaded', () => instance.init());
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EndingUI, instance };
  }
})();
