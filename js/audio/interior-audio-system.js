// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - INTERIOR ACOUSTIC SYSTEM
// Lightweight indoor acoustic zones: tea shop, Chettinad heritage courtyard,
// stone corridor, temple sanctum, and mountain forest shelter.
// ============================================================================

(function () {
  'use strict';

  class InteriorAudioSystem {
    constructor() {
      this.currentZone = 'exterior';
      this.isInterior = false;
      this.reverbNode = null;
      this.initialized = false;
    }

    init() {
      this.initialized = true;
      console.log('[InteriorAudioSystem] Initialized lightweight interior acoustic zone manager.');
      return this;
    }

    enterInteriorZone(zoneType = 'tea_shop') {
      this.isInterior = true;
      this.currentZone = zoneType;

      console.log(`[InteriorAudioSystem] Entered interior acoustic zone: ${zoneType}`);

      // Notify AmbientAudioSystem to dampen exterior ambient bed
      if (window.AmbientAudioSystem) {
        window.AmbientAudioSystem.setInterior(true);
      }

      // Filter weather audio for roof impact
      if (window.WeatherAudioSystem) {
        window.WeatherAudioSystem.setEnvironment('interior');
      }

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('interior_acoustic_zone_changed', {
          detail: { zoneType, isInterior: true }
        }));
      }
    }

    exitToExterior() {
      if (!this.isInterior) return;
      this.isInterior = false;
      this.currentZone = 'exterior';

      console.log('[InteriorAudioSystem] Exited to exterior acoustics.');

      if (window.AmbientAudioSystem) {
        window.AmbientAudioSystem.setInterior(false);
      }

      if (window.WeatherAudioSystem) {
        window.WeatherAudioSystem.setEnvironment('open_field');
      }

      if (window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('interior_acoustic_zone_changed', {
          detail: { zoneType: 'exterior', isInterior: false }
        }));
      }
    }

    getZoneProfile() {
      return {
        zone: this.currentZone,
        isInterior: this.isInterior
      };
    }
  }

  const instance = new InteriorAudioSystem();

  if (typeof window !== 'undefined') {
    window.InteriorAudioSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InteriorAudioSystem, instance };
  }
})();
