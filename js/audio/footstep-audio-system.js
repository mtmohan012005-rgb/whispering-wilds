// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - FOOTSTEP & CLOTHING AUDIO SYSTEM
// Surface material-aware footstep audio (stone, mud, sand, water, wood, grass),
// footwear variations (sandals, shoes, boots), and subtle veshti cloth rustle.
// ============================================================================

(function () {
  'use strict';

  class FootstepAudioSystem {
    constructor(audioManager) {
      if (FootstepAudioSystem._instance) {
        if (audioManager) FootstepAudioSystem._instance.init(audioManager);
        return FootstepAudioSystem._instance;
      }

      this.audioManager = audioManager || window.audioManager;
      this.currentFootwear = 'sandals'; // 'sandals', 'shoes', 'boots'
      this.lastStepTime = 0;
      this.minStepIntervalMs = 120; // Anti-spam debounce
      this.isSprinting = false;
      this.fatigueLevel = 0.0;
      this.exertionLevel = 0.0;
      this.isBreathingHeavy = false;
      this.stepTimer = 0;
      this.lastMaterial = 'stone';
      this.initialized = false;

      FootstepAudioSystem._instance = this;
    }

    init(audioManager) {
      if (audioManager) this.audioManager = audioManager;
      this._bindAnimationEvents();
      this.initialized = true;
      console.log('[FootstepAudioSystem] Initialized surface footstep and cloth dynamics engine.');
      return this;
    }

    _bindAnimationEvents() {
      if (typeof window === 'undefined') return;

      window.addEventListener('player_foot_contact', (e) => {
        const detail = e.detail || {};
        this.onContactEvent({
          surface: detail.surface || this.resolveGroundSurface(),
          foot: detail.foot || 'left',
          speed: detail.speed || 1.0,
          isSprinting: detail.isSprinting || false
        });
      });
    }

    setFootwear(fw) {
      this.currentFootwear = fw || 'sandals';
    }

    onContactEvent(options = {}) {
      const surface = options.surface || this.resolveGroundSurface();
      const footwear = options.footwear || this.currentFootwear;
      const speed = options.speed || 1.0;

      const dataModule = window.FootstepData;
      const stepSoundId = dataModule?.getFootstepSoundId ? dataModule.getFootstepSoundId(surface, footwear) : `sfx_footstep_${surface}_${footwear}`;

      const am = this.audioManager || window.audioManager;
      if (am && stepSoundId) {
        am.play(stepSoundId, {
          category: 'sfx',
          busName: 'SFX',
          volume: Math.min(1.0, 0.65 * (speed > 1.2 ? 1.25 : 1.0))
        });
      }

      // Play subtle veshti / cloth rustle
      let clothRustlePlayed = false;
      if (dataModule && dataModule.getClothRustleSoundId) {
        const clothSoundId = dataModule.getClothRustleSoundId(speed > 1.2 ? 'run' : 'walk');
        if (am && clothSoundId) {
          am.play(clothSoundId, {
            category: 'sfx',
            busName: 'SFX',
            volume: 0.22
          });
          clothRustlePlayed = true;
        }
      }

      return {
        triggered: true,
        surface,
        footwear,
        clothRustlePlayed
      };
    }

    playFootstep(options = {}) {
      return this.onContactEvent(options).triggered;
    }

    resolveGroundSurface() {
      const player = window.gamePlayer || window.testRef?.player || window.GameState?.player;
      if (window.LocomotionEngine?.resolveSurfaceAt) {
        return window.LocomotionEngine.resolveSurfaceAt(player?.x || 0, player?.y || 0);
      }
      return 'mud';
    }

    detectMaterial(x, z, player) {
      if (player && (player.isSwimming || (player.y && player.y > 680 && x > 2000 && x < 3500))) {
        return 'water';
      }
      if (x < -150 || (x > 140 && x < 240 && z > 50)) {
        return 'sand';
      }
      if (x >= -100 && x < 100) {
        return 'mud';
      }
      if (player && player.isOnWoodStructure) {
        return 'wood';
      }
      if (x > 200) {
        return 'grass';
      }
      return 'stone';
    }

    update(deltaTime, player) {
      if (!player) return;
      const isAirborne = player.isJumping || (player.state && (player.state === 'JUMP' || player.state === 'FALL'));
      const isSwimming = player.state === 'SWIM' || player.isSwimming;
      const isMoving = player.isMoving || (Math.hypot(player.vx || 0, player.vy || 0) > 5);

      if (isAirborne || isSwimming || !isMoving) {
        this.stepTimer = 0;
        return;
      }
      this.stepTimer = (this.stepTimer || 0) + (deltaTime || 0);
      const interval = (player.isSprinting || player.state === 'SPRINT') ? 0.3 : 0.5;
      if (this.stepTimer >= interval) {
        this.stepTimer = 0;
        const mat = this.detectMaterial(player.x || 0, player.z || 0, player);
        this.lastMaterial = mat;
        this.onContactEvent({ surface: mat, speed: player.isSprinting ? 1.5 : 1.0 });
      }
    }

    updateBreathing(level) {
      this.exertionLevel = Math.max(0.0, Math.min(1.0, Number(level) || 0.0));
      this.isBreathingHeavy = (this.exertionLevel >= 0.7);

      if (this.isBreathingHeavy) {
        const now = Date.now();
        if (!this._lastBreathTime || now - this._lastBreathTime > 4000) {
          this._lastBreathTime = now;
          const am = this.audioManager || window.audioManager;
          if (am) {
            am.play('sfx_player_breath_exertion', {
              category: 'sfx',
              busName: 'SFX',
              volume: 0.25 * this.exertionLevel
            });
          }
        }
      }
    }

    updatePlayerBreathing(energy, isSprinting) {
      const exertion = isSprinting ? Math.max(0.8, (100 - energy) / 100) : Math.max(0, (100 - energy) / 100);
      this.updateBreathing(exertion);
    }
  }

  const instance = new FootstepAudioSystem();
  FootstepAudioSystem._instance = instance;

  // Static proxy methods
  for (const prop of Object.getOwnPropertyNames(FootstepAudioSystem.prototype)) {
    if (prop !== 'constructor' && typeof FootstepAudioSystem.prototype[prop] === 'function') {
      FootstepAudioSystem[prop] = function (...args) {
        return FootstepAudioSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(FootstepAudioSystem, {
    currentFootwear: {
      get() { return FootstepAudioSystem._instance.currentFootwear; },
      set(v) { FootstepAudioSystem._instance.currentFootwear = v; }
    },
    lastMaterial: {
      get() { return FootstepAudioSystem._instance.lastMaterial; },
      set(v) { FootstepAudioSystem._instance.lastMaterial = v; }
    },
    exertionLevel: {
      get() { return FootstepAudioSystem._instance.exertionLevel; },
      set(v) { FootstepAudioSystem._instance.exertionLevel = v; }
    },
    isBreathingHeavy: {
      get() { return FootstepAudioSystem._instance.isBreathingHeavy; },
      set(v) { FootstepAudioSystem._instance.isBreathingHeavy = v; }
    }
  });

  if (typeof window !== 'undefined') {
    window.FootstepAudioSystem = FootstepAudioSystem;
    window.footstepAudioSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FootstepAudioSystem, instance };
  }
})();
