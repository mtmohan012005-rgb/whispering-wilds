// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - INTERACTION AUDIO SYSTEM
// Sound effects for doors, gates, water pumps, brass utensils, lamps, and chests.
// Integrates cleanly with EnvironmentInteractionSystem.
// ============================================================================

(function () {
  'use strict';

  class InteractionAudioSystem {
    constructor() {
      this.initialized = false;
    }

    init() {
      this._bindInteractionEvents();
      this.initialized = true;
      console.log('[InteractionAudioSystem] Initialized interactive prop acoustic responder.');
      return this;
    }

    _bindInteractionEvents() {
      if (typeof window === 'undefined') return;

      window.addEventListener('prop_interacted', (e) => {
        const detail = e.detail || {};
        this.playInteractionSound(detail.type, detail.material, detail.state);
      });
    }

    playInteractionSound(propType, material = 'wood', state = 'open') {
      let soundId = null;

      switch (propType) {
        case 'door':
          soundId = material === 'metal' ? `sfx_door_metal_${state}` : `sfx_door_wood_aged_${state}`;
          break;
        case 'gate':
          soundId = `sfx_gate_creak_${state}`;
          break;
        case 'water_pump':
          soundId = 'sfx_water_handpump_crank';
          break;
        case 'tea_kadai':
        case 'tea_pot':
          soundId = 'sfx_prop_brass_chembu_pour';
          break;
        case 'lamp':
        case 'kuthu_vilakku':
          soundId = 'sfx_prop_oil_lamp_ignite';
          break;
        case 'container':
        case 'chest':
          soundId = `sfx_container_latch_${state}`;
          break;
        default:
          soundId = 'sfx_interact_generic_tap';
          break;
      }

      if (window.audioManager && soundId) {
        window.audioManager.play(soundId, {
          category: 'sfx',
          busName: 'SFX',
          volume: 0.7
        });
      }
    }
  }

  const instance = new InteractionAudioSystem();

  if (typeof window !== 'undefined') {
    window.InteractionAudioSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InteractionAudioSystem, instance };
  }
})();
