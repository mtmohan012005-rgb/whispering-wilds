/**
 * The Whispering Wilds (Kaattu Vazhi) - Dynamic Music System
 * 9 adaptive gameplay score states, regional modal palettes, non-abrupt crossfades,
 * and stinger integration for investigations, discoveries, and chapter events.
 */

window.MUSIC_STATE = {
  EXPLORATION: 'EXPLORATION',
  DISCOVERY: 'DISCOVERY',
  INVESTIGATION: 'INVESTIGATION',
  TENSION: 'TENSION',
  PUZZLE: 'PUZZLE',
  WILDLIFE_OBSERVATION: 'WILDLIFE_OBSERVATION',
  CHAPTER_EVENT: 'CHAPTER_EVENT',
  DANGER: 'DANGER',
  REST: 'REST'
};

class DynamicMusicSystem {
  constructor(audioManager) {
    this.manager = audioManager || window.audioManager;
    this.currentState = window.MUSIC_STATE.EXPLORATION;
    this.currentTrack = null;
    this.isTransitioning = false;
    this.currentRegion = 'george_town';
  }

  setRegion(region) {
    this.currentRegion = region;
  }

  transitionTo(newState, options = {}) {
    if (this.currentState === newState && this.currentTrack) return;
    const prevState = this.currentState;
    this.currentState = newState;

    const musicDefs = this.manager && this.manager.data && this.manager.data.dynamicMusic;
    const def = musicDefs && musicDefs[newState];

    if (def) {
      // Fade out previous track
      if (this.currentTrack) {
        this.manager.fadeOut(this.currentTrack.id, options.fadeDuration || def.fadeDuration || 1.5);
      }

      // Fade in new track
      this.currentTrack = this.manager.fadeIn(def.id, def.volume, options.fadeDuration || def.fadeDuration || 1.5);
    }
  }

  playDiscoveryStinger() {
    if (this.manager) {
      this.manager.play('music_discovery', { category: 'music', volume: 0.75 });
    }
  }

  playCaseSolvedStinger() {
    if (this.manager) {
      this.manager.play('music_chapter', { category: 'music', volume: 0.8 });
    }
  }
}

window.DynamicMusicSystem = DynamicMusicSystem;
