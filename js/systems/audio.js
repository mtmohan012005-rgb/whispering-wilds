// ============================================================================
// THE WHISPERING WILDS - AUDIO LIFECYCLE ADAPTER
// Smoothly lowers/pauses gameplay audio on PAUSED, restores smoothly on PLAYING,
// and ensures main menu theme plays during MAIN_MENU without starting gameplay tracks.
// ============================================================================

(function () {
  'use strict';

  class AudioLifecycleManager {
    constructor() {
      this._savedVolumes = {};
      this._isFadedForPause = false;
      this._initLifecycleHooks();
    }

    onPause() {
      if (this._isFadedForPause) return;
      this._isFadedForPause = true;

      // Smoothly lower gameplay audio (e.g. ambient & dynamic music)
      const audio = window.gameAudio || window.audioManager;
      if (audio) {
        if (typeof audio.setMasterVolume === 'function') {
          this._savedVolumes.master = audio.masterVolume || 1.0;
          audio.setMasterVolume(this._savedVolumes.master * 0.3);
        } else if (audio.musicGainNode && audio.audioCtx) {
          const now = audio.audioCtx.currentTime;
          audio.musicGainNode.gain.setTargetAtTime(0.15, now, 0.3);
        }
      }

      console.log('[AudioSystem] Gameplay audio ducked for pause.');
    }

    onResume() {
      if (!this._isFadedForPause) return;
      this._isFadedForPause = false;

      // Restore gameplay audio levels smoothly
      const audio = window.gameAudio || window.audioManager;
      if (audio) {
        if (typeof audio.setMasterVolume === 'function' && this._savedVolumes.master !== undefined) {
          audio.setMasterVolume(this._savedVolumes.master);
        } else if (audio.musicGainNode && audio.audioCtx) {
          const now = audio.audioCtx.currentTime;
          const target = window.SettingsManager?.settings?.audio?.musicVolume || 0.7;
          audio.musicGainNode.gain.setTargetAtTime(target, now, 0.4);
        }
      }

      console.log('[AudioSystem] Gameplay audio restored from pause.');
    }

    onMenuEnter() {
      // Stop high-intensity gameplay music if returning to menu
      const am = window.audioManager;
      if (am?.dynamicMusic?.stop) {
        am.dynamicMusic.stop();
      }
      const ga = window.gameAudio;
      if (ga?.stopExplorationMusic) {
        ga.stopExplorationMusic();
      }
    }

    onGameplayStart() {
      // Start exploration music only when gameplay begins
      const ga = window.gameAudio;
      if (ga?.startExplorationMusic) {
        ga.startExplorationMusic();
      }
    }

    _initLifecycleHooks() {
      if (!window.GameLifecycle) return;

      window.GameLifecycle.on('stateChanged', (data) => {
        if (data.to === 'PAUSED') {
          this.onPause();
        } else if (data.from === 'PAUSED' && data.to === 'PLAYING') {
          this.onResume();
        } else if (data.to === 'MAIN_MENU') {
          this.onMenuEnter();
        } else if (data.from === 'LOADING_GAME' && data.to === 'PLAYING') {
          this.onGameplayStart();
        } else if (data.to === 'EXITING') {
          const ga = window.gameAudio;
          if (ga?.stop) ga.stop();
        }
      });
    }
  }

  window.AudioLifecycleManager = new AudioLifecycleManager();
  window.AudioSystem = window.AudioLifecycleManager;
})();
