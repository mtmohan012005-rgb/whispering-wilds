// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CINEMATIC AUDIO SYSTEM
// Mixes scripted cutscene scores, synchronous voice over, and Foley impacts.
// Integrates with CinematicSystem and coordinates master ducking.
// ============================================================================

(function () {
  'use strict';

  class CinematicAudioSystem {
    constructor() {
      this.isCinematicPlaying = false;
      this.currentCinematicId = null;
      this.initialized = false;
    }

    init() {
      this.initialized = true;
      console.log('[CinematicAudioSystem] Initialized cinematic audio routing on CINEMATIC bus.');
      return this;
    }

    startCinematic(cinematicId) {
      this.isCinematicPlaying = true;
      this.currentCinematicId = cinematicId;

      console.log(`[CinematicAudioSystem] Starting cinematic audio for: ${cinematicId}`);

      // 1. Duck gameplay ambience and weather
      if (window.AudioMixer) {
        window.AudioMixer.onCinematicStart();
      }

      // 2. Play cinematic score
      const scoreId = `music_cinematic_${cinematicId}`;
      if (window.audioManager) {
        window.audioManager.play(scoreId, {
          category: 'cinematic',
          busName: 'CINEMATIC',
          volume: 0.95
        });
      }
    }

    endCinematic() {
      if (!this.isCinematicPlaying) return;

      console.log(`[CinematicAudioSystem] Ending cinematic audio for: ${this.currentCinematicId}`);

      // 1. Stop cinematic track with smooth fade
      if (window.audioManager && this.currentCinematicId) {
        window.audioManager.stop(`music_cinematic_${this.currentCinematicId}`, 1.2);
      }

      // 2. Restore ambient and exploration music levels
      if (window.AudioMixer) {
        window.AudioMixer.onCinematicEnd();
      }

      this.isCinematicPlaying = false;
      this.currentCinematicId = null;
    }
  }

  const instance = new CinematicAudioSystem();

  if (typeof window !== 'undefined') {
    window.CinematicAudioSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CinematicAudioSystem, instance };
  }
})();
