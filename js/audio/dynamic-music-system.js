// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DYNAMIC MUSIC SYSTEM
// Coordinates 8 authoritative music states, regional thematic score,
// priority overrides (Cinematic > Investigation > Exploration), and discoveries.
// ============================================================================

(function () {
  'use strict';

  const MUSIC_STATES = {
    EXPLORATION: 'EXPLORATION',
    MYSTERY: 'MYSTERY',
    INVESTIGATION: 'INVESTIGATION',
    DISCOVERY: 'DISCOVERY',
    FESTIVAL: 'FESTIVAL',
    CINEMATIC: 'CINEMATIC',
    ENDING: 'ENDING',
    PAUSED: 'PAUSED',
    TENSION: 'TENSION',
    PUZZLE: 'PUZZLE',
    WILDLIFE_OBSERVATION: 'WILDLIFE_OBSERVATION',
    CHAPTER_EVENT: 'CHAPTER_EVENT',
    DANGER: 'DANGER',
    REST: 'REST'
  };

  class DynamicMusicSystem {
    constructor() {
      this.currentState = MUSIC_STATES.EXPLORATION;
      this.previousState = null;
      this.currentRegion = 'george_town';
      this.activeTrackId = null;
      this.musicManager = null;
      this.initialized = false;
    }

    init(musicManager) {
      this.musicManager = musicManager || window.MusicManager;
      this.initialized = true;
      console.log('[DynamicMusicSystem] Initialized dynamic score state machine.');
      return this;
    }

    transitionTo(state, force = false) {
      return this.setState(state, force);
    }

    setState(newState, force = false) {
      if (!MUSIC_STATES[newState]) {
        console.warn(`[DynamicMusicSystem] Unknown state: ${newState}`);
        return false;
      }

      if (this.currentState === newState && !force) return false;

      // Priority Rule: CINEMATIC cannot be interrupted by normal EXPLORATION
      if (this.currentState === MUSIC_STATES.CINEMATIC && newState === MUSIC_STATES.EXPLORATION && !force) {
        console.log('[DynamicMusicSystem] Blocked state change during CINEMATIC priority.');
        return false;
      }

      this.previousState = this.currentState;
      this.currentState = newState;

      console.log(`[DynamicMusicSystem] State transition: ${this.previousState} ➔ ${this.currentState}`);
      this._resolveMusicForCurrentState();

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('music_state_changed', {
          detail: { state: this.currentState, region: this.currentRegion }
        }));
      }

      return true;
    }

    setRegion(region) {
      const reg = (region || '').toLowerCase();
      if (this.currentRegion === reg) return;
      this.currentRegion = reg;

      // Re-evaluate exploration track if currently in EXPLORATION state
      if (this.currentState === MUSIC_STATES.EXPLORATION) {
        this._resolveMusicForCurrentState();
      }
    }

    _resolveMusicForCurrentState() {
      if (!this.musicManager) return;

      const musicData = window.MusicData;
      if (!musicData) return;

      let targetTrackId = null;

      switch (this.currentState) {
        case MUSIC_STATES.CINEMATIC:
          targetTrackId = 'music_cinematic_prologue';
          break;
        case MUSIC_STATES.INVESTIGATION:
          targetTrackId = 'music_investigation_subtle';
          break;
        case MUSIC_STATES.MYSTERY:
          targetTrackId = 'music_mystery_shola';
          break;
        case MUSIC_STATES.FESTIVAL:
          targetTrackId = 'music_festival_pongal';
          break;
        case MUSIC_STATES.ENDING:
          targetTrackId = 'music_ending_heritage';
          break;
        case MUSIC_STATES.PAUSED:
          this.musicManager.pause();
          return;
        case MUSIC_STATES.EXPLORATION:
        default:
          targetTrackId = musicData.getThemeForRegion(this.currentRegion) || 'music_explore_chennai';
          break;
      }

      if (targetTrackId) {
        this.activeTrackId = targetTrackId;
        this.musicManager.playTrack(targetTrackId, 2.5);
      }
    }

    triggerDiscoveryStinger(stingerId = 'music_discovery_relic') {
      console.log(`[DynamicMusicSystem] Triggering discovery stinger: ${stingerId}`);
      if (window.audioManager) {
        window.audioManager.play(stingerId, {
          category: 'music',
          busName: 'MUSIC',
          loop: false,
          volume: 0.8
        });
      }
    }

    returnFromCinematic() {
      this.setState(this.previousState || MUSIC_STATES.EXPLORATION, true);
    }

    getState() {
      return this.currentState;
    }
  }

  const instance = new DynamicMusicSystem();
  DynamicMusicSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(DynamicMusicSystem.prototype)) {
    if (prop !== 'constructor' && typeof DynamicMusicSystem.prototype[prop] === 'function') {
      DynamicMusicSystem[prop] = function (...args) {
        return DynamicMusicSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(DynamicMusicSystem, {
    currentState: {
      get() { return DynamicMusicSystem._instance.currentState; },
      set(v) { DynamicMusicSystem._instance.currentState = v; }
    },
    currentRegion: {
      get() { return DynamicMusicSystem._instance.currentRegion; },
      set(v) { DynamicMusicSystem._instance.currentRegion = v; }
    },
    MUSIC_STATES: {
      get() { return MUSIC_STATES; }
    }
  });

  if (typeof window !== 'undefined') {
    window.DynamicMusicSystem = DynamicMusicSystem;
    window.dynamicMusicSystem = instance;
    window.MUSIC_STATES = MUSIC_STATES;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DynamicMusicSystem, MUSIC_STATES, instance };
  }
})();
