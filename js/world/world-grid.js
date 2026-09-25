/**
 * The Whispering Wilds (Kaattu Vazhi) - World Grid
 * Deterministic spatial partitioning of the open world into sectors across Tamil Nadu.
 * Provides stable sector IDs, fast spatial hashing, radius queries, and adjacency graphs.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./world-sector'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./world-sector'));
  } else {
    const SectorClass = root.WorldSector || (typeof window !== 'undefined' ? window.WorldSector : null);
    root.WorldGrid = factory(SectorClass);
    if (typeof window !== 'undefined') {
      window.WorldGrid = root.WorldGrid;
    }
  }
})(typeof self !== 'undefined' ? self : this, function (WorldSector) {
  'use strict';

  class WorldGridEngine {
    constructor() {
      this.SectorConstructor = WorldSector || (typeof window !== 'undefined' ? window.WorldSector : null);
      this._sectors = new Map();
      this._spatialBuckets = new Map(); // Spatial hash: 'bx_bz' -> [sectorId, ...]
      this._bucketSize = 500.0;

      this._initSectors();
    }

    _initSectors() {
      const defs = [
        // 1. Chennai / George Town Sectors
        {
          id: 'sector_chennai_01',
          name: 'Madras High Court & George Town Historic District',
          region: 'george_town',
          biome: 'urban_coastal',
          bounds: { minX: -350, maxX: 0, minZ: 400, maxZ: 850 },
          priority: 2,
          isCulturalLandmark: true,
          npcSet: ['tea_kadai_owner', 'auto_driver_velu', 'police_constable'],
          wildlifeSet: ['common_crow', 'feral_pigeon'],
          questContent: ['main_missing_trail', 'cutting_chai_route'],
          audioProfile: { ambience: 'chennai_street_busy', music: 'chennai_theme' }
        },
        {
          id: 'sector_chennai_02',
          name: 'Marina Coastal Promenade & Parrys Harbour Arterial',
          region: 'george_town',
          biome: 'coastal_harbour',
          bounds: { minX: 0, maxX: 450, minZ: 400, maxZ: 850 },
          priority: 1,
          npcSet: ['harbour_worker', 'fish_merchant'],
          wildlifeSet: ['brown_headed_gull'],
          audioProfile: { ambience: 'coastal_waves_wind', music: 'chennai_theme' }
        },

        // 2. Cauvery Farmlands & Grand Anicut Sectors
        {
          id: 'sector_delta_01',
          name: 'Kallanai Grand Anicut Historical Sluice Gates',
          region: 'cauvery_delta',
          biome: 'river_farmland',
          bounds: { minX: 900, maxX: 1450, minZ: 200, maxZ: 650 },
          priority: 2,
          isCulturalLandmark: true,
          npcSet: ['farmer_selvam', 'irrigation_officer'],
          wildlifeSet: ['indian_pond_heron', 'water_buffalo'],
          questContent: ['side_selvam_bull', 'paddy_irrigation'],
          audioProfile: { ambience: 'river_water_birds', music: 'delta_flute_theme' }
        },
        {
          id: 'sector_delta_02',
          name: 'Thiruvaiyaru Lush Paddy Fields & Banana Plantations',
          region: 'cauvery_delta',
          biome: 'paddy_fields',
          bounds: { minX: 1450, maxX: 2000, minZ: 200, maxZ: 650 },
          priority: 1,
          npcSet: ['paddy_harvester'],
          wildlifeSet: ['spotted_deer', 'white_throated_kingfisher'],
          audioProfile: { ambience: 'rural_breeze_paddy', music: 'delta_flute_theme' }
        },

        // 3. Pichavaram Mangrove Wetlands
        {
          id: 'sector_pichavaram_01',
          name: 'Pichavaram Estuary Jetty & Mangrove Waterways',
          region: 'pichavaram',
          biome: 'mangrove_wetland',
          bounds: { minX: 2200, maxX: 2750, minZ: 600, maxZ: 1050 },
          priority: 2,
          npcSet: ['boatman_kannan'],
          wildlifeSet: ['little_egret', 'mudskipper'],
          audioProfile: { ambience: 'wetland_canals', music: 'mangrove_ambient' }
        },

        // 4. Chettinad Heritage Belt
        {
          id: 'sector_chettinad_01',
          name: 'Kanadukathan 1000-Window Heritage Mansion & Athangudi Tile Workshop',
          region: 'chettinad',
          biome: 'heritage_drylands',
          bounds: { minX: 2900, maxX: 3450, minZ: 300, maxZ: 750 },
          priority: 2,
          isCulturalLandmark: true,
          npcSet: ['chettiar_elder', 'athangudi_artisan'],
          wildlifeSet: ['indian_peafowl'],
          audioProfile: { ambience: 'dry_courtyard_wind', music: 'veena_heritage_theme' }
        },

        // 5. Thanjavur Royal Chola Architecture
        {
          id: 'sector_thanjavur_01',
          name: 'Brihadisvara Granite Temple Vimana & Bronze Casting Guild',
          region: 'thanjavur',
          biome: 'granite_heritage',
          bounds: { minX: 3500, maxX: 4050, minZ: 150, maxZ: 600 },
          priority: 3,
          isCulturalLandmark: true,
          npcSet: ['sthapati_sculptor', 'temple_priest'],
          wildlifeSet: ['rose_ringed_parakeet'],
          questContent: ['lost_chola_seal'],
          audioProfile: { ambience: 'temple_bells_reverberation', music: 'chola_granite_theme' }
        },

        // 6. Mamallapuram Shore Temples & Stone Carvings
        {
          id: 'sector_mamallapuram_01',
          name: 'Shore Temple Granite Coastline & Arjuna Penance Reliefs',
          region: 'mamallapuram',
          biome: 'granite_coast',
          bounds: { minX: 4100, maxX: 4650, minZ: 500, maxZ: 950 },
          priority: 2,
          isCulturalLandmark: true,
          npcSet: ['stone_carver_mani'],
          wildlifeSet: ['sea_tern'],
          audioProfile: { ambience: 'ocean_granite_cliffs', music: 'shore_temple_theme' }
        },

        // 7. Nilgiris Western Ghats & Mountain Shola
        {
          id: 'sector_nilgiri_01',
          name: 'Ooty High-Elevation Tea Plantation & Misty Valley',
          region: 'nilgiris',
          biome: 'tea_mountain',
          bounds: { minX: 4800, maxX: 5350, minZ: 100, maxZ: 550 },
          priority: 2,
          npcSet: ['tea_estate_worker', 'hill_guide_karthik'],
          wildlifeSet: ['nilgiri_tahr', 'malabar_giant_squirrel'],
          audioProfile: { ambience: 'mountain_wind_mist', music: 'ghats_mist_theme' }
        },
        {
          id: 'sector_nilgiri_02',
          name: 'Subterranean Pasumai Thadam Botanical Eco-Sanctuary',
          region: 'final_sanctuary',
          biome: 'botanical_sanctuary',
          bounds: { minX: 5350, maxX: 5900, minZ: 100, maxZ: 550 },
          priority: 3,
          isCulturalLandmark: true,
          wildlifeSet: ['rare_lion_tailed_macaque'],
          audioProfile: { ambience: 'ancient_cavern_flow', music: 'sanctuary_hymn' }
        }
      ];

      for (let i = 0; i < defs.length; i++) {
        const sector = new this.SectorConstructor(defs[i]);
        this.addSector(sector);
      }
    }

    addSector(sector) {
      if (!sector || !sector.id) return;
      this._sectors.set(sector.id, sector);

      // Register into spatial buckets
      const minBx = Math.floor(sector.bounds.minX / this._bucketSize);
      const maxBx = Math.floor(sector.bounds.maxX / this._bucketSize);
      const minBz = Math.floor(sector.bounds.minZ / this._bucketSize);
      const maxBz = Math.floor(sector.bounds.maxZ / this._bucketSize);

      for (let bx = minBx; bx <= maxBx; bx++) {
        for (let bz = minBz; bz <= maxBz; bz++) {
          const key = `${bx}_${bz}`;
          if (!this._spatialBuckets.has(key)) {
            this._spatialBuckets.set(key, []);
          }
          this._spatialBuckets.get(key).push(sector.id);
        }
      }
    }

    getSector(id) {
      return this._sectors.get(id) || null;
    }

    getAllSectors() {
      return Array.from(this._sectors.values());
    }

    getSectorAt(x, z) {
      const bx = Math.floor(x / this._bucketSize);
      const bz = Math.floor(z / this._bucketSize);
      const key = `${bx}_${bz}`;
      const candidates = this._spatialBuckets.get(key);

      if (candidates) {
        for (let i = 0; i < candidates.length; i++) {
          const s = this._sectors.get(candidates[i]);
          if (s && s.isPlayerInside({ x, z })) {
            return s;
          }
        }
      }

      // Brute-force fallback
      for (const s of this._sectors.values()) {
        if (s.isPlayerInside({ x, z })) return s;
      }
      return null;
    }

    getSectorsInRadius(centerX, centerZ, radius) {
      const result = [];
      const radSq = radius * radius;

      for (const sector of this._sectors.values()) {
        const d = sector.distanceTo({ x: centerX, z: centerZ });
        if (d <= radius) {
          result.push(sector);
        }
      }
      return result;
    }
  }

  return new WorldGridEngine();
});
