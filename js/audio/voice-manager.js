// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - VOICE MANAGER
// Manages Tamil and English human voice acting tracks, queue priorities,
// dialogue ducking, speaker identification, and subtitle synchronization.
// ============================================================================

(function () {
  'use strict';

  class VoiceManager {
    constructor() {
      this.currentLanguage = 'ta'; // 'ta' (Tamil) or 'en' (English)
      this.activeVoiceLine = null;
      this.activeAudioSource = null;
      this.voiceQueue = [];
      this.isSpeaking = false;
      this.initialized = false;
    }

    init() {
      // Re-hydrate preferred language from settings or GameState
      const savedLang = window.SettingsManager?.settings?.audio?.language ||
                        window.GameState?.settings?.language || 'ta';
      this.currentLanguage = (savedLang === 'tamil' || savedLang === 'ta') ? 'ta' : 'en';

      this.initialized = true;
      console.log(`[VoiceManager] Initialized with voice language: ${this.currentLanguage.toUpperCase()}`);
      return this;
    }

    setLanguage(lang) {
      const code = (lang === 'tamil' || lang === 'ta') ? 'ta' : 'en';
      if (this.currentLanguage === code) return;

      this.currentLanguage = code;
      console.log(`[VoiceManager] Voice acting language switched to: ${code.toUpperCase()}`);

      // Stop any active line if language switched mid-speech
      if (this.isSpeaking) {
        this.stopCurrentVoice(0.2);
      }

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('voice_language_changed', { detail: { language: code } }));
      }
    }

    getLanguage() {
      return this.currentLanguage;
    }

    playVoice(voiceId, options = {}) {
      const voiceData = window.VoiceData?.getVoiceLine(voiceId, this.currentLanguage) ||
                        window.VoiceData?.getVoiceLine(voiceId, 'ta'); // Fallback to Tamil if English unrecorded

      // Missing voice fallback rule: Never block story, show subtitle and trigger callback
      if (!voiceData) {
        console.warn(`[VoiceManager] Missing voice asset: '${voiceId}' in language '${this.currentLanguage}'. Using subtitle fallback.`);
        if (options.onStart) options.onStart();
        if (window.SubtitleUI && options.subtitleText) {
          window.SubtitleUI.showSubtitle({
            speaker: options.speakerName || 'Speaker',
            text: options.subtitleText,
            durationSec: options.duration || 3.0
          });
        }
        setTimeout(() => {
          if (options.onEnd) options.onEnd();
        }, (options.duration || 3.0) * 1000);
        return { isFallback: true };
      }

      // Voice interruption rule: Stop prior voice cleanly with smooth fade
      if (this.isSpeaking) {
        this.stopCurrentVoice(0.15);
      }

      this.activeVoiceLine = voiceData;
      this.isSpeaking = true;

      // Coordinate ducking
      if (window.AudioMixer) {
        window.AudioMixer.onDialogueStart(options.priority || 'normal');
      }

      // Display synchronized subtitle
      if (window.SubtitleUI) {
        const subText = this.currentLanguage === 'ta' ? voiceData.tamilText : voiceData.englishText;
        window.SubtitleUI.showSubtitle({
          speaker: voiceData.speakerName,
          speakerTamil: voiceData.speakerTamil,
          text: subText,
          durationSec: voiceData.duration
        });
      }

      // Notify DialogueVoiceSystem for lip-sync / animation blendshapes
      if (window.DialogueVoiceSystem) {
        window.DialogueVoiceSystem.onVoiceStarted(voiceData);
      }

      // Play audio on VOICE bus through AudioManager
      const handle = window.audioManager ? window.audioManager.play(voiceData.audioId || voiceId, {
        category: 'voice',
        busName: 'VOICE',
        volume: options.volume || 1.0
      }) : null;

      this.activeAudioSource = handle;

      if (options.onStart) options.onStart(voiceData);

      // Schedule line completion
      const durationMs = (voiceData.duration || 2.5) * 1000;
      setTimeout(() => {
        if (this.activeVoiceLine === voiceData) {
          this.stopCurrentVoice(0.1);
          if (options.onEnd) options.onEnd(voiceData);
        }
      }, durationMs);

      return {
        id: voiceId,
        voiceData,
        stop: (fade = 0.1) => this.stopCurrentVoice(fade)
      };
    }

    stopCurrentVoice(fade = 0.1) {
      if (!this.isSpeaking) return;

      if (this.activeAudioSource && typeof this.activeAudioSource.stop === 'function') {
        this.activeAudioSource.stop(fade);
      }
      this.activeAudioSource = null;
      this.activeVoiceLine = null;
      this.isSpeaking = false;

      // Restore audio levels
      if (window.AudioMixer) {
        window.AudioMixer.onDialogueEnd();
      }

      // End lip-sync
      if (window.DialogueVoiceSystem) {
        window.DialogueVoiceSystem.onVoiceEnded();
      }
    }
  }

  const instance = new VoiceManager();

  if (typeof window !== 'undefined') {
    window.VoiceManager = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoiceManager, instance };
  }
})();
