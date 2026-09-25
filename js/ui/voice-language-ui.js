// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - VOICE LANGUAGE UI
// Allows toggling voice acting between authentic Tamil and English recorded audio.
// ============================================================================

(function () {
  'use strict';

  class VoiceLanguageUI {
    constructor() {
      this.container = null;
      this.isVisible = false;
    }

    init() {
      this._buildDOM();
      return this;
    }

    _buildDOM() {
      if (document.getElementById('voice-lang-modal')) return;

      const modal = document.createElement('div');
      modal.id = 'voice-lang-modal';
      modal.className = 'audio-settings-overlay hidden';
      modal.innerHTML = `
        <div class="audio-settings-panel" style="max-width: 600px;">
          <div class="audio-panel-header">
            <h2>🗣️ Voice Acting Language (குரல் மொழி)</h2>
            <button id="close-voice-lang-btn" class="recap-close-x" title="Close">&times;</button>
          </div>

          <div class="audio-panel-body">
            <p style="color: #a4b0be; font-size: 0.9rem; margin-bottom: 16px;">
              Select the spoken dialogue audio language. Text and subtitles can remain in your preferred language independently.
            </p>

            <div class="voice-lang-options-grid">
              <div class="voice-card active" id="card-voice-ta">
                <h3>தமிழ் (Tamil Audio)</h3>
                <p>Authentic regional Tamil voice acting (Madras, Thanjavur, and Nilgiris dialects).</p>
                <button class="btn-primary btn-sm btn-select-lang" data-lang="ta">✓ Selected</button>
              </div>

              <div class="voice-card" id="card-voice-en">
                <h3>English (English Audio)</h3>
                <p>Natural English narration preserving cultural context and Indian English cadence.</p>
                <button class="btn-secondary btn-sm btn-select-lang" data-lang="en">Select</button>
              </div>
            </div>

            <div style="margin-top: 18px; text-align: center;">
              <button id="btn-preview-sample" class="btn-secondary btn-sm">▶ Play Sample Voice Line</button>
            </div>
          </div>

          <div class="audio-panel-footer">
            <button id="voice-lang-done-btn" class="btn-primary">Apply & Close</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.container = modal;

      this._bindEvents();
    }

    _bindEvents() {
      document.getElementById('close-voice-lang-btn')?.addEventListener('click', () => this.hide());
      document.getElementById('voice-lang-done-btn')?.addEventListener('click', () => this.hide());

      document.querySelectorAll('.btn-select-lang').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const lang = e.target.getAttribute('data-lang');
          this.selectLanguage(lang);
        });
      });

      document.getElementById('btn-preview-sample')?.addEventListener('click', () => {
        if (window.VoiceManager) {
          window.VoiceManager.playVoice('voice_murugan_intro', { volume: 0.9 });
        }
      });
    }

    selectLanguage(lang) {
      if (window.VoiceManager) {
        window.VoiceManager.setLanguage(lang);
      }

      document.getElementById('card-voice-ta')?.classList.toggle('active', lang === 'ta');
      document.getElementById('card-voice-en')?.classList.toggle('active', lang === 'en');

      const taBtn = document.querySelector('.btn-select-lang[data-lang="ta"]');
      const enBtn = document.querySelector('.btn-select-lang[data-lang="en"]');

      if (taBtn) taBtn.textContent = lang === 'ta' ? '✓ Selected' : 'Select';
      if (enBtn) enBtn.textContent = lang === 'en' ? '✓ Selected' : 'Select';

      if (window.NotificationSystem) {
        window.NotificationSystem.show(`Spoken voice language set to: ${lang === 'ta' ? 'Tamil' : 'English'}`, 'info');
      }
    }

    show() {
      if (!this.container) this.init();
      const current = window.VoiceManager?.getLanguage() || 'ta';
      this.selectLanguage(current);
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

  const instance = new VoiceLanguageUI();

  if (typeof window !== 'undefined') {
    window.VoiceLanguageUI = instance;
    window.addEventListener('DOMContentLoaded', () => instance.init());
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoiceLanguageUI, instance };
  }
})();
