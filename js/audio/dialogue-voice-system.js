// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DIALOGUE VOICE & LIP-SYNC SYSTEM
// Integrates voice lines with authored phoneme timings, facial animation triggers,
// and safe mouth-open/close envelope fallback.
// ============================================================================

(function () {
  'use strict';

  class DialogueVoiceSystem {
    constructor() {
      this.currentVoiceData = null;
      this.isLipSyncActive = false;
      this._lipSyncTimer = null;
      this._blendshapeState = { mouthOpen: 0.0, jawDrop: 0.0 };
      this.initialized = false;
    }

    get activeVoiceLine() {
      return this.currentVoiceData;
    }

    init() {
      this.initialized = true;
      console.log('[DialogueVoiceSystem] Initialized dialogue lip-sync & animation bridge.');
      return this;
    }

    getCurrentMouthOpen() {
      if (!this.isLipSyncActive) return 0.0;
      return this._blendshapeState.mouthOpen > 0 ? this._blendshapeState.mouthOpen : 0.4;
    }

    onVoiceStarted(voiceData) {
      this.currentVoiceData = voiceData;
      this.isLipSyncActive = true;
      this._blendshapeState.mouthOpen = 0.4;

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('npc_dialogue_speech_started', {
          detail: {
            speakerId: voiceData.speakerId,
            emotion: voiceData.emotion || 'neutral',
            hasPhonemes: Array.isArray(voiceData.phonemes) && voiceData.phonemes.length > 0
          }
        }));
      }

      if (Array.isArray(voiceData.phonemes) && voiceData.phonemes.length > 0) {
        this._runAuthoredPhonemeTrack(voiceData.phonemes);
      } else {
        this._runFallbackMouthEnvelope(voiceData.duration || 2.5);
      }
    }

    onVoiceEnded() {
      this.isLipSyncActive = false;
      if (this._lipSyncTimer) {
        clearInterval(this._lipSyncTimer);
        this._lipSyncTimer = null;
      }

      this._blendshapeState = { mouthOpen: 0.0, jawDrop: 0.0 };

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('npc_dialogue_speech_ended', {
          detail: { speakerId: this.currentVoiceData?.speakerId }
        }));
      }

      this.currentVoiceData = null;
    }

    _runAuthoredPhonemeTrack(phonemes) {
      const startTime = Date.now();
      let index = 0;

      this._lipSyncTimer = setInterval(() => {
        if (!this.isLipSyncActive) {
          clearInterval(this._lipSyncTimer);
          return;
        }

        const elapsedSec = (Date.now() - startTime) / 1000;
        const currentPhoneme = phonemes[index];

        if (currentPhoneme && elapsedSec >= currentPhoneme.time) {
          this._blendshapeState.mouthOpen = currentPhoneme.open || 0.4;
          this._blendshapeState.jawDrop = (currentPhoneme.open || 0.4) * 0.7;

          if (window.FacialExpressionSystem?.applySpeechViseme) {
            window.FacialExpressionSystem.applySpeechViseme(this._blendshapeState.mouthOpen);
          }

          index++;
          if (index >= phonemes.length) {
            index = 0;
          }
        }
      }, 50);
    }

    _runFallbackMouthEnvelope(durationSec) {
      const startTime = Date.now();

      this._lipSyncTimer = setInterval(() => {
        if (!this.isLipSyncActive) {
          clearInterval(this._lipSyncTimer);
          return;
        }

        const elapsedSec = (Date.now() - startTime) / 1000;
        if (elapsedSec > durationSec) {
          this.onVoiceEnded();
          return;
        }

        const mouthOpen = 0.25 + 0.25 * Math.sin(elapsedSec * 12.0);
        this._blendshapeState.mouthOpen = Math.max(0.0, mouthOpen);
        this._blendshapeState.jawDrop = this._blendshapeState.mouthOpen * 0.6;

        if (window.FacialExpressionSystem?.applySpeechViseme) {
          window.FacialExpressionSystem.applySpeechViseme(mouthOpen);
        }
      }, 60);
    }

    getVisemeState() {
      return { ...this._blendshapeState };
    }
  }

  const instance = new DialogueVoiceSystem();
  DialogueVoiceSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(DialogueVoiceSystem.prototype)) {
    if (prop !== 'constructor' && typeof DialogueVoiceSystem.prototype[prop] === 'function') {
      DialogueVoiceSystem[prop] = function (...args) {
        return DialogueVoiceSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(DialogueVoiceSystem, {
    activeVoiceLine: {
      get() { return DialogueVoiceSystem._instance.activeVoiceLine; }
    },
    isLipSyncActive: {
      get() { return DialogueVoiceSystem._instance.isLipSyncActive; }
    }
  });

  if (typeof window !== 'undefined') {
    window.DialogueVoiceSystem = DialogueVoiceSystem;
    window.dialogueVoiceSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DialogueVoiceSystem, instance };
  }
})();
