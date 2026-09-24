// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENVIRONMENT INTERACTION UI
// Contextual interaction prompt HUD, bilingual action verbs & accessibility styling
// ============================================================================

(function() {
  'use strict';

  class EnvironmentInteractionUI {
    constructor() {
      this.container = null;
      this.promptEl = null;
      this.keyGlyphEl = null;
      this.actionVerbEl = null;
      this.propTitleEl = null;
      this.lockHintEl = null;
      this.isVisible = false;

      this._initDOM();
    }

    _initDOM() {
      if (typeof document === 'undefined') return;

      this.container = document.getElementById('environment-interaction-prompt');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'environment-interaction-prompt';
        this.container.className = 'env-prompt-container hidden';
        this.container.innerHTML = `
          <div class="env-prompt-card">
            <div class="env-prompt-key">
              <span class="key-badge">E</span>
            </div>
            <div class="env-prompt-details">
              <div class="env-prompt-action">
                <span class="action-icon">✨</span>
                <span class="action-verb">Inspect</span>
              </div>
              <div class="env-prop-title">Object</div>
              <div class="env-lock-hint hidden">🔒 Locked</div>
            </div>
          </div>
        `;
        document.body.appendChild(this.container);
      }

      this.keyGlyphEl = this.container.querySelector('.key-badge');
      this.actionVerbEl = this.container.querySelector('.action-verb');
      this.propTitleEl = this.container.querySelector('.env-prop-title');
      this.lockHintEl = this.container.querySelector('.env-lock-hint');
      const iconEl = this.container.querySelector('.action-icon');
      this.actionIconEl = iconEl;
    }

    showPrompt(promptData, worldPos) {
      if (!this.container) this._initDOM();
      if (!promptData) {
        this.hidePrompt();
        return;
      }

      const lang = window.GameState?.settings?.audio?.language || 'ta';
      const isGamepad = window.InputManager?.activeDevice === 'gamepad';

      // Update key glyph
      if (this.keyGlyphEl) {
        this.keyGlyphEl.textContent = isGamepad ? '✕' : 'E';
      }

      if (this.actionVerbEl) {
        this.actionVerbEl.textContent = promptData.verbText || promptData.action;
      }
      if (this.actionIconEl) {
        this.actionIconEl.textContent = promptData.icon || '✨';
      }
      if (this.propTitleEl) {
        this.propTitleEl.textContent = promptData.propTitle || '';
      }

      if (this.lockHintEl) {
        if (promptData.isLocked && promptData.lockHint) {
          this.lockHintEl.textContent = `🔒 ${promptData.lockHint}`;
          this.lockHintEl.classList.remove('hidden');
        } else {
          this.lockHintEl.classList.add('hidden');
        }
      }

      // Accessibility styling
      const highContrast = window.GameState?.settings?.accessibility?.highContrast;
      this.container.classList.toggle('high-contrast', !!highContrast);

      this.container.classList.remove('hidden');
      this.isVisible = true;
    }

    hidePrompt() {
      if (this.container && this.isVisible) {
        this.container.classList.add('hidden');
        this.isVisible = false;
      }
    }
  }

  window.EnvironmentInteractionUI = EnvironmentInteractionUI;
  window.environmentInteractionUI = new EnvironmentInteractionUI();

  console.log('[EnvironmentInteractionUI] Initialized contextual interaction HUD.');
})();
