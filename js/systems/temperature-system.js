// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - TEMPERATURE SYSTEM
// Computes regional microclimates, diurnal curve, elevation lapse, and exposure
// ============================================================================

(function() {
  'use strict';

  class TemperatureSystem {
    constructor() {
      this.data = window.TemperatureData || {
        regions: {},
        diurnalOffsets: [],
        elevationLapseRate: -0.18,
        weatherModifiers: {},
        outfits: {}
      };

      this.cachedAmbientTemp = 30.0;
      this.cachedExposure = 1.0;
      this.lastEvaluationTime = 0;
    }

    /**
     * Compute current ambient temperature
     * @param {Object} context { region, elevation, timeOfDay, weather, isIndoor, shelter }
     */
    calculateAmbientTemperature(context = {}) {
      const regionKey = context.region || (window.GameState && window.GameState.world && window.GameState.world.currentRegion) || 'george_town';
      const regionData = (this.data.regions && this.data.regions[regionKey]) || {
        baseTemp: 30.0,
        humidity: 0.65,
        windExposure: 0.5
      };

      let temp = regionData.baseTemp;

      // 1. Time-of-day diurnal offset
      const timeOfDay = context.timeOfDay !== undefined ? context.timeOfDay : ((window.GameState && window.GameState.world && window.GameState.world.time) || 12.0);
      const diurnalOffset = this._getDiurnalOffset(timeOfDay);
      temp += diurnalOffset;

      // 2. Elevation Lapse Rate (-0.18 C per 10m)
      const elevation = context.elevation || (window.GameState && window.GameState.player && window.GameState.player.position ? window.GameState.player.position.y : 0);
      const lapseRate = this.data.elevationLapseRate || -0.18;
      temp += (elevation / 10.0) * lapseRate;

      // 3. Weather Modifier
      const weatherType = context.weather || (window.GameState && window.GameState.world && window.GameState.world.weather) || 'clear';
      const weatherMod = (this.data.weatherModifiers && this.data.weatherModifiers[weatherType]) || { tempOffset: 0, warmthLossMult: 1.0 };
      temp += weatherMod.tempOffset;

      // 4. Shelter / Indoor Buff
      if (context.isIndoor || (context.shelter && context.shelter.weatherProtection > 0.5)) {
        // Temperature moderates towards comfortable 26.5C inside buildings
        const targetIndoor = 26.5;
        const shelterProt = context.shelter ? context.shelter.weatherProtection : 0.85;
        temp = temp + (targetIndoor - temp) * shelterProt;
      }

      this.cachedAmbientTemp = Math.round(temp * 10) / 10;
      return this.cachedAmbientTemp;
    }

    /**
     * Get player's thermal exposure factor (accounting for weather, shelter, and clothing)
     */
    calculateExposure(context = {}) {
      const weatherType = context.weather || 'clear';
      const weatherMod = (this.data.weatherModifiers && this.data.weatherModifiers[weatherType]) || { warmthLossMult: 1.0 };
      let exposure = weatherMod.warmthLossMult;

      // Shelter dampens environmental exposure
      if (context.shelter) {
        exposure *= context.shelter.getProtectionMultiplier ? context.shelter.getProtectionMultiplier() : 0.2;
      } else if (context.isIndoor) {
        exposure *= 0.2;
      }

      // Clothing insulation
      const outfitId = context.outfitId || (window.GameState && window.GameState.player && window.GameState.player.outfitId) || 'everyday_veshti';
      const outfitData = (this.data.outfits && this.data.outfits[outfitId]) || { coldProtection: 0.2, heatDissipation: 0.5 };

      this.cachedExposure = exposure;
      return {
        exposureFactor: exposure,
        outfitData: outfitData
      };
    }

    _getDiurnalOffset(hour) {
      const normalizedHour = ((hour % 24) + 24) % 24;
      const offsets = this.data.diurnalOffsets;
      if (!offsets || offsets.length === 0) return 0.0;

      // Linear interpolation between closest hours
      for (let i = 0; i < offsets.length - 1; i++) {
        if (normalizedHour >= offsets[i].hour && normalizedHour <= offsets[i + 1].hour) {
          const t = (normalizedHour - offsets[i].hour) / (offsets[i + 1].hour - offsets[i].hour);
          return offsets[i].offset + (offsets[i + 1].offset - offsets[i].offset) * t;
        }
      }
      return offsets[0].offset;
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemperatureSystem;
  } else {
    window.TemperatureSystem = TemperatureSystem;
  }
})();
