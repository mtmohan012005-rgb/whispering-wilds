// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REGIONAL AMBIENCE CATALOG
// 7 authentic regional soundscapes across 4 times of day with stochastic accents.
// ============================================================================

(function () {
  'use strict';

  function createBed(id, region, time, volume, layers = ['environment_bed', 'ambient_air']) {
    return {
      id,
      region,
      time,
      volume,
      loop: true,
      layers,
      license: 'CC-BY-4.0'
    };
  }

  const REGIONS = ['chennai', 'cauvery_delta', 'pichavaram', 'chettinad', 'thanjavur', 'mamallapuram', 'nilgiris'];
  const TIMES = ['dawn', 'morning', 'day', 'sunset', 'night'];

  const AMBIENT_BEDS = {};

  for (const reg of REGIONS) {
    for (const t of TIMES) {
      const key = `amb_${reg}_${t}`;
      const vol = (t === 'night') ? 0.6 : (t === 'day' ? 0.8 : 0.7);
      const layers = [
        `${reg}_acoustic_bed_${t}`,
        `${reg}_wind_breeze_${t}`,
        `${reg}_fauna_activity_${t}`
      ];
      AMBIENT_BEDS[key] = createBed(key, reg, t, vol, layers);
    }
  }

  // Alias george_town to chennai
  for (const t of TIMES) {
    const srcKey = `amb_chennai_${t}`;
    const aliasKey = `amb_george_town_${t}`;
    AMBIENT_BEDS[aliasKey] = { ...AMBIENT_BEDS[srcKey], region: 'george_town' };
  }

  const STOCHASTIC_ACCENTS = [
    { id: 'sfx_accent_crow_caw', region: 'chennai', volume: 0.4 },
    { id: 'sfx_accent_distant_auto_horn', region: 'chennai', volume: 0.35 },
    { id: 'sfx_accent_temple_bell_far', region: 'thanjavur', volume: 0.5 },
    { id: 'sfx_accent_ocean_wave_surge', region: 'mamallapuram', volume: 0.55 },
    { id: 'sfx_accent_cicada_swell', region: 'nilgiris', volume: 0.45 },
    { id: 'sfx_accent_water_bubble', region: 'pichavaram', volume: 0.4 }
  ];

  const AmbientData = {
    BEDS: AMBIENT_BEDS,
    ACCENTS: STOCHASTIC_ACCENTS,

    getBedForRegionAndTime(region, timeOfDay) {
      let regKey = (region || 'chennai').toLowerCase();
      if (regKey === 'george_town') regKey = 'chennai';
      let timeKey = (timeOfDay || 'day').toLowerCase();
      if (timeKey === 'morning') timeKey = 'dawn';

      const lookupKey = `amb_${regKey}_${timeKey}`;
      return AMBIENT_BEDS[lookupKey] || AMBIENT_BEDS[`amb_chennai_day`];
    },

    getRandomAccent(region, timeOfDay) {
      let regKey = (region || 'chennai').toLowerCase();
      if (regKey === 'george_town') regKey = 'chennai';
      const candidates = STOCHASTIC_ACCENTS.filter(a => a.region === regKey || a.region === 'global');
      if (candidates.length === 0) return STOCHASTIC_ACCENTS[0];
      const idx = Math.floor(Math.random() * candidates.length);
      return candidates[idx];
    }
  };

  if (typeof window !== 'undefined') {
    window.AmbientData = AmbientData;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AmbientData;
  }
})();
