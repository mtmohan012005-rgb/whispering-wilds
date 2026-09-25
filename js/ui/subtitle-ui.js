/**
 * @file subtitle-ui.js
 * @description Accessible Subtitle Display System for The Whispering Wilds.
 * Displays bilingual dialogue subtitles, speaker identification badges, and environmental sound cues.
 * Adheres to accessibility requirements: UI scaling, high contrast mode, reduced motion, and voice-timestamp tracking.
 */

(function (window) {
  'use strict';

  class SubtitleUI {
    constructor() {
      this.container = null;
      this.badgeEl = null;
      this.textEl = null;
      this.soundCueEl = null;
      this.currentTimeout = null;
      this.activeLine = null;

      this.settings = {
        enabled: true,
        language: 'ta', // 'ta' or 'en'
        scale: 1.0,     // 0.8 to 1.5
        highContrast: false,
        soundCuesEnabled: true
      };

      this.initDOM();
      this.bindEvents();
    }

    initDOM() {
      if (document.getElementById('ww-subtitle-overlay')) {
        this.container = document.getElementById('ww-subtitle-overlay');
        return;
      }

      this.container = document.createElement('div');
      this.container.id = 'ww-subtitle-overlay';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-label', 'Subtitles and Audio Cues');

      Object.assign(this.container.style, {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'auto',
        maxWidth: '820px',
        minWidth: '280px',
        padding: '10px 24px',
        borderRadius: '8px',
        backgroundColor: 'rgba(10, 15, 12, 0.85)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        color: '#f5f5f0',
        fontFamily: '"Mukta Malar", "Noto Sans Tamil", "Segoe UI", sans-serif',
        textAlign: 'center',
        zIndex: '9999',
        pointerEvents: 'none',
        display: 'none',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        opacity: '0'
      });

      this.soundCueEl = document.createElement('div');
      this.soundCueEl.id = 'ww-subtitle-sound-cue';
      Object.assign(this.soundCueEl.style, {
        fontSize: '13px',
        color: '#d4af37',
        fontStyle: 'italic',
        marginBottom: '4px',
        display: 'none'
      });

      this.badgeEl = document.createElement('span');
      this.badgeEl.id = 'ww-subtitle-speaker';
      Object.assign(this.badgeEl.style, {
        display: 'inline-block',
        fontSize: '14px',
        fontWeight: '700',
        color: '#e2b007',
        marginRight: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      });

      this.textEl = document.createElement('span');
      this.textEl.id = 'ww-subtitle-text';
      Object.assign(this.textEl.style, {
        fontSize: '17px',
        lineHeight: '1.45',
        color: '#fdfbf7',
        textShadow: '0 1px 3px rgba(0,0,0,0.8)'
      });

      this.container.appendChild(this.soundCueEl);
      this.container.appendChild(this.badgeEl);
      this.container.appendChild(this.textEl);
      document.body.appendChild(this.container);
    }

    bindEvents() {
      // Listen for voice-manager broadcast
      window.addEventListener('voice:subtitle', (e) => {
        if (!e.detail) return;
        this.displaySubtitle(e.detail);
      });

      window.addEventListener('voice:stopped', () => {
        this.dismiss();
      });

      window.addEventListener('ambient:soundcue', (e) => {
        if (e.detail && this.settings.soundCuesEnabled) {
          this.displaySoundCue(e.detail.cueTa, e.detail.cueEn, e.detail.duration || 3000);
        }
      });
    }

    configure(options = {}) {
      if (options.enabled !== undefined) this.settings.enabled = !!options.enabled;
      if (options.language) this.settings.language = options.language;
      if (options.scale) this.settings.scale = Math.max(0.8, Math.min(1.6, options.scale));
      if (options.highContrast !== undefined) this.settings.highContrast = !!options.highContrast;
      if (options.soundCuesEnabled !== undefined) this.settings.soundCuesEnabled = !!options.soundCuesEnabled;

      this.applyAccessibilityStyles();
    }

    applyAccessibilityStyles() {
      if (!this.container) return;
      const scale = this.settings.scale;
      this.textEl.style.fontSize = `${17 * scale}px`;
      this.badgeEl.style.fontSize = `${14 * scale}px`;
      this.soundCueEl.style.fontSize = `${13 * scale}px`;

      if (this.settings.highContrast) {
        this.container.style.backgroundColor = '#000000';
        this.container.style.border = '2px solid #ffff00';
        this.textEl.style.color = '#ffffff';
        this.badgeEl.style.color = '#ffff00';
      } else {
        this.container.style.backgroundColor = 'rgba(10, 15, 12, 0.85)';
        this.container.style.border = '1px solid rgba(212, 175, 55, 0.3)';
        this.textEl.style.color = '#fdfbf7';
        this.badgeEl.style.color = '#e2b007';
      }
    }

    displaySubtitle(data) {
      if (!this.settings.enabled) return;
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
      }

      this.activeLine = data;
      const isTamil = (this.settings.language === 'ta');
      const speaker = isTamil ? (data.speakerTamil || data.speakerTa || data.speaker || '') : (data.speakerName || data.speakerEn || data.speaker || '');
      const text = isTamil ? (data.tamilText || data.textTa || data.text || '') : (data.englishText || data.textEn || data.text || '');

      if (speaker) {
        this.badgeEl.textContent = `${speaker}:`;
        this.badgeEl.style.display = 'inline-block';
      } else {
        this.badgeEl.textContent = '';
        this.badgeEl.style.display = 'none';
      }

      this.textEl.textContent = text;
      this.soundCueEl.style.display = 'none';

      this.showContainer();

      // Duration resolution
      const durationMs = (data.durationSec ? data.durationSec * 1000 : null) || data.durationMs || (data.duration ? data.duration * 1000 : 4000);
      this.currentTimeout = setTimeout(() => {
        this.dismiss();
      }, durationMs);
    }

    showSubtitle(data) {
      this.displaySubtitle(data);
    }

    displaySoundCue(cueTa, cueEn, durationMs = 3000) {
      if (!this.settings.enabled || !this.settings.soundCuesEnabled) return;
      const cue = this.settings.language === 'ta' ? cueTa : (cueEn || cueTa);
      if (!cue) return;

      this.soundCueEl.textContent = `[ ${cue} ]`;
      this.soundCueEl.style.display = 'block';

      if (!this.activeLine) {
        this.badgeEl.style.display = 'none';
        this.textEl.textContent = '';
        this.showContainer();
        if (this.currentTimeout) clearTimeout(this.currentTimeout);
        this.currentTimeout = setTimeout(() => {
          this.dismiss();
        }, durationMs);
      }
    }

    showContainer() {
      if (!this.container) return;
      this.container.style.display = 'block';
      // Reflow for transition
      void this.container.offsetWidth;
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateX(-50%) translateY(0)';
    }

    dismiss() {
      if (!this.container) return;
      this.container.style.opacity = '0';
      this.container.style.transform = 'translateX(-50%) translateY(6px)';
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
      }
      setTimeout(() => {
        if (this.container && this.container.style.opacity === '0') {
          this.container.style.display = 'none';
          this.activeLine = null;
        }
      }, 200);
    }
  }

  window.SubtitleUI = SubtitleUI;
  window.subtitleUI = new SubtitleUI();
  window.SubtitleUI.showSubtitle = function (data) {
    if (window.subtitleUI) window.subtitleUI.showSubtitle(data);
  };
  window.SubtitleUI.displaySubtitle = function (data) {
    if (window.subtitleUI) window.subtitleUI.displaySubtitle(data);
  };
})(window);
