// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - AUDIO SETTINGS UI
// Interactive mixer console allowing real-time tuning of Master, Music, Voice,
// Ambience, SFX, and UI bus gains, mutes, and device testing.
// ============================================================================

(function () {
  'use strict';

  class AudioSettingsUI {
    constructor() {
      this.container = null;
      this.isVisible = false;
    }

    init() {
      this._buildDOM();
      return this;
    }

    _buildDOM() {
      if (document.getElementById('audio-settings-modal')) return;

      const modal = document.createElement('div');
      modal.id = 'audio-settings-modal';
      modal.className = 'audio-settings-overlay hidden';
      modal.innerHTML = `
        <div class="audio-settings-panel">
          <div class="audio-panel-header">
            <h2>🎧 Audio Mixer & Sound Controls (ஒலி அமைப்புகள்)</h2>
            <button id="close-audio-settings-btn" class="recap-close-x" title="Close">&times;</button>
          </div>

          <div class="audio-panel-body">
            <div class="audio-buses-grid">
              <!-- Master Volume -->
              <div class="bus-slider-card">
                <div class="bus-header">
                  <strong>Master Volume (முதன்மை ஒலி)</strong>
                  <span id="vol-lbl-master">80%</span>
                </div>
                <input type="range" id="vol-slider-master" min="0" max="100" value="80">
                <label class="mute-checkbox-label">
                  <input type="checkbox" id="mute-chk-master"> Mute Master
                </label>
              </div>

              <!-- Voice / Dialogue Volume -->
              <div class="bus-slider-card">
                <div class="bus-header">
                  <strong>Voice Acting (குரல் ஒலி)</strong>
                  <span id="vol-lbl-voice">90%</span>
                </div>
                <input type="range" id="vol-slider-voice" min="0" max="100" value="90">
                <label class="mute-checkbox-label">
                  <input type="checkbox" id="mute-chk-voice"> Mute Voice
                </label>
              </div>

              <!-- Music Volume -->
              <div class="bus-slider-card">
                <div class="bus-header">
                  <strong>Music & Score (இசை)</strong>
                  <span id="vol-lbl-music">65%</span>
                </div>
                <input type="range" id="vol-slider-music" min="0" max="100" value="65">
                <label class="mute-checkbox-label">
                  <input type="checkbox" id="mute-chk-music"> Mute Music
                </label>
              </div>

              <!-- Ambience Volume -->
              <div class="bus-slider-card">
                <div class="bus-header">
                  <strong>Environment Ambience (சுற்றுப்புற ஒலி)</strong>
                  <span id="vol-lbl-ambience">75%</span>
                </div>
                <input type="range" id="vol-slider-ambience" min="0" max="100" value="75">
                <label class="mute-checkbox-label">
                  <input type="checkbox" id="mute-chk-ambience"> Mute Ambience
                </label>
              </div>

              <!-- SFX Volume -->
              <div class="bus-slider-card">
                <div class="bus-header">
                  <strong>Sound Effects & Footsteps (விளைவு ஒலி)</strong>
                  <span id="vol-lbl-sfx">80%</span>
                </div>
                <input type="range" id="vol-slider-sfx" min="0" max="100" value="80">
                <label class="mute-checkbox-label">
                  <input type="checkbox" id="mute-chk-sfx"> Mute SFX
                </label>
              </div>

              <!-- UI Volume -->
              <div class="bus-slider-card">
                <div class="bus-header">
                  <strong>Interface & Cues (இடைமுக ஒலி)</strong>
                  <span id="vol-lbl-ui">70%</span>
                </div>
                <input type="range" id="vol-slider-ui" min="0" max="100" value="70">
                <label class="mute-checkbox-label">
                  <input type="checkbox" id="mute-chk-ui"> Mute UI
                </label>
              </div>
            </div>

            <div class="audio-quick-actions">
              <button id="btn-test-audio-chime" class="btn-secondary btn-sm">🔊 Test Audio Chime</button>
              <button id="btn-open-voice-lang" class="btn-highlight btn-sm">🗣️ Switch Voice Language</button>
            </div>
          </div>

          <div class="audio-panel-footer">
            <button id="audio-settings-done-btn" class="btn-primary">Done</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      this.container = modal;

      this._bindEvents();
    }

    _bindEvents() {
      document.getElementById('close-audio-settings-btn')?.addEventListener('click', () => this.hide());
      document.getElementById('audio-settings-done-btn')?.addEventListener('click', () => this.hide());

      document.getElementById('btn-open-voice-lang')?.addEventListener('click', () => {
        if (window.VoiceLanguageUI) window.VoiceLanguageUI.show();
      });

      document.getElementById('btn-test-audio-chime')?.addEventListener('click', () => {
        if (window.audioManager) {
          window.audioManager.play('sfx_ui_achievement', { category: 'ui', volume: 0.8 });
        }
      });

      // Volume sliders binding
      const busMappings = [
        { id: 'master', bus: 'MASTER' },
        { id: 'voice', bus: 'VOICE' },
        { id: 'music', bus: 'MUSIC' },
        { id: 'ambience', bus: 'AMBIENCE' },
        { id: 'sfx', bus: 'SFX' },
        { id: 'ui', bus: 'UI' }
      ];

      busMappings.forEach(({ id, bus }) => {
        const slider = document.getElementById(`vol-slider-${id}`);
        const lbl = document.getElementById(`vol-lbl-${id}`);
        const muteChk = document.getElementById(`mute-chk-${id}`);

        slider?.addEventListener('input', (e) => {
          const val = Number(e.target.value) / 100;
          if (lbl) lbl.textContent = `${e.target.value}%`;
          if (window.AudioBusMatrix) window.AudioBusMatrix.setVolume(bus, val);
          if (window.audioManager) {
            if (id === 'master') window.audioManager.setMasterVolume(val);
            if (id === 'music') window.audioManager.setMusicVolume(val);
            if (id === 'ambience') window.audioManager.setAmbienceVolume(val);
          }
        });

        muteChk?.addEventListener('change', (e) => {
          if (window.AudioBusMatrix) window.AudioBusMatrix.setMute(bus, e.target.checked);
        });
      });
    }

    show() {
      if (!this.container) this.init();
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

  const instance = new AudioSettingsUI();

  if (typeof window !== 'undefined') {
    window.AudioSettingsUI = instance;
    window.addEventListener('DOMContentLoaded', () => instance.init());
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioSettingsUI, instance };
  }
})();
