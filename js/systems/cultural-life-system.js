/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Master Cultural Life Simulation System (CulturalLifeSystem)
 * Coordinates regional cultural identities, context-aware attire, cultural prop discoveries,
 * field journal lore logging, and cultural authenticity quality gates.
 */

class CulturalLifeSystem {
  constructor() {
    this.regionalData = window.REGIONAL_LIFE_DATA || {};
    this.culturalDiscoveries = new Map(); // id -> discovery record

    // Attire database for male & female context-aware generation (Section 10 & 11)
    this.attirePresets = {
      MALE: {
        everyday: ['everyday_veshti', 'cotton_shirt_veshti'],
        work: ['village_workwear', 'short_veshti_thundu'],
        festival: ['festival_veshti', 'silk_border_pattu_veshti'],
        mountain: ['nilgiri_warmwear', 'shola_wool_jacket'],
        urban: ['urban_explorer', 'cotton_trousers_shirt']
      },
      FEMALE: {
        everyday: ['everyday_cotton_saree', 'madurai_sungudi_saree'],
        work: ['work_oriented_cotton_saree', 'agricultural_tied_saree'],
        festival: ['kanchipuram_silk_saree', 'heritage_textile_saree'],
        mountain: ['warm_woolen_shawl_saree', 'nilgiri_tea_worker_attire'],
        urban: ['contemporary_cotton_saree', 'salwar_kameez_cotton']
      }
    };
  }

  /**
   * Returns authoritative cultural profile for a given region
   */
  getRegionProfile(regionKey) {
    return this.regionalData[regionKey] || null;
  }

  /**
   * Context-aware clothing selector (Section 10 & 11)
   */
  resolveAppropriateAttire(gender = 'MALE', region = 'CAUVERY_DELTA', occupation = 'farmer', weather = 'clear', isFestival = false) {
    const genderKey = gender.toUpperCase() === 'FEMALE' ? 'FEMALE' : 'MALE';
    const presets = this.attirePresets[genderKey];

    if (region === 'NILGIRIS' && (weather === 'cold' || weather === 'mist' || weather === 'storm')) {
      return presets.mountain[0];
    }

    if (isFestival) {
      return presets.festival[0];
    }

    if (occupation.includes('farmer') || occupation.includes('fisher') || occupation.includes('herder') || occupation.includes('labor')) {
      return presets.work[0];
    }

    if (region === 'GEORGE_TOWN') {
      return presets.urban[0];
    }

    return presets.everyday[0];
  }

  /**
   * Registers a cultural discovery when the player examines an authentic prop (Section 26)
   */
  recordCulturalDiscovery(data) {
    if (!data || !data.id || this.culturalDiscoveries.has(data.id)) return;

    const record = {
      id: data.id,
      name: data.name,
      tamilName: data.tamilName || '',
      region: data.region || 'TAMIL_NADU',
      lore: data.lore || '',
      timestamp: Date.now()
    };

    this.culturalDiscoveries.set(data.id, record);

    // 1. Add to field journal
    if (window.gameJournal && typeof window.gameJournal.unlockEntry === 'function') {
      window.gameJournal.unlockEntry(data.id);
    }

    // 2. Play diegetic page flip / discovery audio
    if (window.audioManager && window.audioManager.spatial) {
      window.audioManager.spatial.playSpatialClip('landmark_discover', null, 0.8);
    }

    // 3. Display cultural discovery card UI
    if (window.culturalDiscoveryUI && typeof window.culturalDiscoveryUI.showDiscovery === 'function') {
      window.culturalDiscoveryUI.showDiscovery(record);
    }

    // 4. Save state
    if (window.gameSaveManager) {
      window.gameSaveManager.saveGame('auto', `cultural_discovery_${data.id}`);
    }

    return record;
  }

  getState() {
    return {
      discoveries: Array.from(this.culturalDiscoveries.entries())
    };
  }

  applyState(saved) {
    if (!saved) return;
    if (Array.isArray(saved.discoveries)) {
      this.culturalDiscoveries = new Map(saved.discoveries);
    }
  }
}

window.CulturalLifeSystem = CulturalLifeSystem;
