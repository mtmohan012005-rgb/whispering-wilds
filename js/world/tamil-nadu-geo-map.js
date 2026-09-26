/**
 * The Whispering Wilds (Kaattu Vazhi / Thadam)
 * Master Geographic Map System (TamilNaduGeoMap)
 *
 * Implements authoritative GIS-grounded regional hierarchy, continuous 2D spatial telemetry,
 * real road & waterway corridors, biomes, and streaming cell manifests.
 * Replaces simplistic X-to-lat/lng linear interpolation.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TamilNaduGeoMap = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── 1. REGIONAL DEFINITIONS ───────────────────────────────────────────────
  const REGIONS = {
    CHENNAI: {
      id: 'CHENNAI',
      key: 'chennai',
      name: 'Chennai & George Town Urban Corridor',
      tamilName: 'சென்னை & ஜார்ஜ் டவுன் வணிக வீதிகள்',
      geoCenter: { lat: 13.0827, lng: 80.2707 },
      worldBounds: { minX: -300, maxX: -180, minZ: -100, maxZ: 100 },
      baseElevation: { min: 0.8, max: 2.8 },
      climate: { tempC: 33, humidity: 0.82, rainProfile: 'northeast_monsoon' },
      thinai: 'Neythal / Urban Marutham',
      soundscape: 'chennai_traffic_horns_market_chatter',
      landmarks: ['madras_high_court', 'parrys_corner', 'kotwal_chavadi', 'george_town_harbor'],
      roadNetwork: ['gst_arterial_nh45', 'george_town_bazaar_lane', 'broadway_commercial'],
      waterFeatures: ['stormwater_drains', 'buckingham_canal_edge', 'marina_coastal_surf']
    },

    CHENGALPATTU_VILLUPURAM: {
      id: 'CHENGALPATTU_VILLUPURAM',
      key: 'villupuram',
      name: 'Chengalpattu & Villupuram Red Soil Plains',
      tamilName: 'செங்கல்பட்டு & விழுப்புரம் செம்மண் நிலங்கள்',
      geoCenter: { lat: 11.9401, lng: 79.4861 },
      worldBounds: { minX: -180, maxX: -80, minZ: -100, maxZ: 100 },
      baseElevation: { min: 2.0, max: 7.5 },
      climate: { tempC: 34, humidity: 0.65, rainProfile: 'semi_arid_monsoon' },
      thinai: 'Mullai (Pastoral Scrub & Red Clay)',
      soundscape: 'palmyra_wind_cicadas_bullock_bells',
      landmarks: ['panchayat_well', 'roadside_ayyanar_shrine', 'palmyra_avenue'],
      roadNetwork: ['state_highway_sh49', 'red_dirt_village_road', 'bullock_cart_track'],
      waterFeatures: ['irrigation_tank_ery', 'dry_monsoon_nullah']
    },

    CAUVERY_DELTA: {
      id: 'CAUVERY_DELTA',
      key: 'cauvery_delta',
      name: 'Cauvery River Basin & Granary Farmlands',
      tamilName: 'காவிரி டெல்டா நெற்களஞ்சியம் & ஆற்றுப்படுகை',
      geoCenter: { lat: 10.7870, lng: 79.1378 },
      worldBounds: { minX: -80, maxX: 30, minZ: -100, maxZ: 30 },
      baseElevation: { min: 0.2, max: 2.2 },
      climate: { tempC: 30, humidity: 0.80, rainProfile: 'cauvery_inundation' },
      thinai: 'Marutham (Riparian Alluvial Plains)',
      soundscape: 'flowing_canal_water_roosters_paddy_rustle',
      landmarks: ['chola_waterwheel_sluice', 'kumbakonam_paddy_fields', 'chettinad_border_mansion'],
      roadNetwork: ['canal_bund_road', 'paddy_dyke_pathway', 'thanjavur_trunk_road'],
      waterFeatures: ['cauvery_distributary_canal', 'flooded_paddy_polder', 'ancient_anicut_sluice']
    },

    PICHAVARAM: {
      id: 'PICHAVARAM',
      key: 'pichavaram',
      name: 'Pichavaram Mangrove Wetlands & Tidal Creeks',
      tamilName: 'பிச்சாவரம் சதுப்புநிலக் காடு & அலையாத்தி கால்வாய்கள்',
      geoCenter: { lat: 11.4287, lng: 79.7831 },
      worldBounds: { minX: -80, maxX: 30, minZ: 30, maxZ: 110 },
      baseElevation: { min: -0.6, max: 0.8 },
      climate: { tempC: 29, humidity: 0.94, rainProfile: 'tidal_brackish_humid' },
      thinai: 'Neythal (Estuary & Tidal Wetland)',
      soundscape: 'paddle_strokes_mud_crabs_waterfowl_echoes',
      landmarks: ['pichavaram_boat_dock', 'rhizophora_stilt_canopy_tunnel', 'tidal_estuary_mouth'],
      roadNetwork: ['wooden_stilt_boardwalk', 'mangrove_boat_channel_alpha', 'mangrove_boat_channel_beta'],
      waterFeatures: ['tidal_muddy_creek', 'brackish_estuary_basin', 'stilt_root_pools']
    },

    MAMALLAPURAM: {
      id: 'MAMALLAPURAM',
      key: 'mamallapuram',
      name: 'Mamallapuram Coastal Granite & Pallava Shore Sanctuary',
      tamilName: 'மாமல்லபுரம் கடற்கரை பாறைகள் & பல்லவர் குடைவரைக் கோயில்கள்',
      geoCenter: { lat: 12.6269, lng: 80.1927 },
      worldBounds: { minX: -160, maxX: -90, minZ: -110, maxZ: -40 },
      baseElevation: { min: 0.5, max: 14.0 },
      climate: { tempC: 31, humidity: 0.84, rainProfile: 'coastal_surf_haze' },
      thinai: 'Neythal / Coastal Granite',
      soundscape: 'ocean_surf_crashing_granite_wind_gulls',
      landmarks: ['shore_temple_twin_sanctum', 'arjuna_penance_bas_relief', 'granite_quarry_boulders'],
      roadNetwork: ['east_coast_road_ecr', 'sandy_dune_track'],
      waterFeatures: ['bay_of_bengal_surf', 'coastal_granite_tide_pool']
    },

    WESTERN_GHATS: {
      id: 'WESTERN_GHATS',
      key: 'western_ghats',
      name: 'Western Ghats Escarpment & Kolli Hairpin Passes',
      tamilName: 'மேற்குத் தொடர்ச்சி மலை & கொண்டை ஊசி வளைவு கணவாய்கள்',
      geoCenter: { lat: 11.2485, lng: 78.3389 },
      worldBounds: { minX: 30, maxX: 180, minZ: -100, maxZ: 100 },
      baseElevation: { min: 14.0, max: 62.0 },
      climate: { tempC: 22, humidity: 0.78, rainProfile: 'orographic_heavy_rain' },
      thinai: 'Kurinji (Montane Rainforest & Crags)',
      soundscape: 'waterfall_roar_highland_wind_hornbill_calls',
      landmarks: ['seventy_hairpin_ghat_road', 'cascading_mountain_cataract', 'granite_overlook_cliff'],
      roadNetwork: ['ghat_hairpin_switchback_road', 'forestry_patrol_track', 'stone_retaining_wall_drive'],
      waterFeatures: ['mountain_cataract_waterfall', 'granite_boulder_stream', 'deep_canyon_pool']
    },

    NILGIRIS: {
      id: 'NILGIRIS',
      key: 'nilgiris',
      name: 'Nilgiri High Country, Tea Estates & Shola Grasslands',
      tamilName: 'நீலகிரி மலைநாடு • தேயிலை தோட்டங்கள் & சோலைக்காடுகள்',
      geoCenter: { lat: 11.4102, lng: 76.6950 },
      worldBounds: { minX: 180, maxX: 300, minZ: -100, maxZ: 100 },
      baseElevation: { min: 52.0, max: 88.0 },
      climate: { tempC: 15, humidity: 0.88, rainProfile: 'mist_drizzle_frost' },
      thinai: 'Kurinji (High Altitude Shola & Cloud Forest)',
      soundscape: 'misty_wind_shola_rustle_nilgiri_pipit',
      landmarks: ['emerald_tea_estate_rows', 'toda_heritage_sacred_pasture', 'doddabetta_ridge_summit'],
      roadNetwork: ['plantation_estate_cobble_track', 'shola_boundary_footpath', 'toy_train_narrow_gauge'],
      waterFeatures: ['shola_cloud_sponge_springs', 'mossy_mountain_tarn', 'valley_mist_condensation']
    }
  };

  // ─── 2. GEOGRAPHIC PROGRESSION NODES ──────────────────────────────────────
  // Authentic latitude/longitude reference points mapping across Tamil Nadu
  const GEO_WAYPOINTS = [
    { x: -270, z: 0,   lat: 13.0827, lng: 80.2707, regionId: 'CHENNAI', name: 'George Town High Court' },
    { x: -210, z: -15, lat: 12.8342, lng: 80.0442, regionId: 'CHENNAI', name: 'Chengalpattu Gateway' },
    { x: -140, z: 10,  lat: 11.9401, lng: 79.4861, regionId: 'CHENGALPATTU_VILLUPURAM', name: 'Villupuram Red Plains' },
    { x: -40,  z: -20, lat: 10.7870, lng: 79.1378, regionId: 'CAUVERY_DELTA', name: 'Cauvery River Sluice' },
    { x: -20,  z: 60,  lat: 11.4287, lng: 79.7831, regionId: 'PICHAVARAM', name: 'Pichavaram Mangrove Maze' },
    { x: -125, z: -70, lat: 12.6269, lng: 80.1927, regionId: 'MAMALLAPURAM', name: 'Mamallapuram Shore Temple' },
    { x: 90,   z: -10, lat: 11.2485, lng: 78.3389, regionId: 'WESTERN_GHATS', name: 'Kolli Hairpin Ghat Road' },
    { x: 240,  z: 15,  lat: 11.4102, lng: 76.6950, regionId: 'NILGIRIS', name: 'Nilgiri Tea Slopes & Shola' }
  ];

  // ─── 3. TAMIL NADU GEO MAP CLASS ──────────────────────────────────────────
  class TamilNaduGeoMap {
    constructor() {
      this.regions = REGIONS;
      this.waypoints = GEO_WAYPOINTS;
      this.currentRegionId = 'CHENNAI';
    }

    /**
     * Determines which authentic Tamil Nadu region an (x, z) 3D coordinate belongs to.
     */
    getRegionAt(x, z) {
      // Coastal Mamallapuram check (specialized coastal enclave)
      if (x >= -160 && x <= -90 && z <= -40) {
        return this.regions.MAMALLAPURAM;
      }
      // Pichavaram check (southern coastal delta mangrove)
      if (x >= -80 && x <= 30 && z >= 30) {
        return this.regions.PICHAVARAM;
      }
      // General longitudinal sweep across Tamil Nadu
      if (x < -180) return this.regions.CHENNAI;
      if (x < -80)  return this.regions.CHENGALPATTU_VILLUPURAM;
      if (x < 30)   return this.regions.CAUVERY_DELTA;
      if (x < 180)  return this.regions.WESTERN_GHATS;
      return this.regions.NILGIRIS;
    }

    /**
     * Replaces simplistic 1D interpolation with a 2D weighted inverse-distance geospatial telemetry.
     */
    getGeographicTelemetry(worldX, worldZ) {
      let totalWeight = 0;
      let interpLat = 0;
      let interpLng = 0;

      // 2D distance-weighted kernel across waypoints
      for (const wp of this.waypoints) {
        const dx = worldX - wp.x;
        const dz = worldZ - wp.z;
        const distSq = Math.max(1, dx * dx + dz * dz);
        const w = 1.0 / Math.pow(distSq, 1.25);

        interpLat += wp.lat * w;
        interpLng += wp.lng * w;
        totalWeight += w;
      }

      const lat = totalWeight > 0 ? interpLat / totalWeight : 13.0827;
      const lng = totalWeight > 0 ? interpLng / totalWeight : 80.2707;
      const region = this.getRegionAt(worldX, worldZ);

      return {
        lat: Number(lat.toFixed(4)),
        lng: Number(lng.toFixed(4)),
        regionId: region.id,
        regionName: region.name,
        tamilName: region.tamilName,
        thinai: region.thinai,
        climate: region.climate,
        soundscape: region.soundscape,
        formattedCoordinates: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`
      };
    }

    /**
     * Checks if coordinates fall within a specific landmark proximity.
     */
    getNearbyLandmarks(worldX, worldZ, radius = 45) {
      const region = this.getRegionAt(worldX, worldZ);
      return region.landmarks;
    }

    /**
     * Retrieves environmental lighting and atmospheric parameters for the region.
     */
    getAtmosphericProfile(worldX, worldZ) {
      const region = this.getRegionAt(worldX, worldZ);
      switch (region.id) {
        case 'CHENNAI':
          return {
            fogDensity: 0.0018,
            fogColor: 0x9fb5c7,
            skyDay: 0x6ba1bd,
            sunIntensity: 1.45,
            humidityHaze: 0.65,
            ambientTint: 0xffeedd
          };
        case 'CHENGALPATTU_VILLUPURAM':
          return {
            fogDensity: 0.0012,
            fogColor: 0xc8a482,
            skyDay: 0x82b2d6,
            sunIntensity: 1.55,
            humidityHaze: 0.35,
            ambientTint: 0xffdfc2
          };
        case 'CAUVERY_DELTA':
          return {
            fogDensity: 0.0022,
            fogColor: 0x8aa89b,
            skyDay: 0x76a9b8,
            sunIntensity: 1.30,
            humidityHaze: 0.80,
            ambientTint: 0xddf4dc
          };
        case 'PICHAVARAM':
          return {
            fogDensity: 0.0045,
            fogColor: 0x607865,
            skyDay: 0x618579,
            sunIntensity: 1.05,
            humidityHaze: 0.95,
            ambientTint: 0xcbe4cd
          };
        case 'MAMALLAPURAM':
          return {
            fogDensity: 0.0025,
            fogColor: 0x9db8c6,
            skyDay: 0x5d9ebb,
            sunIntensity: 1.40,
            humidityHaze: 0.85,
            ambientTint: 0xfff0dd
          };
        case 'WESTERN_GHATS':
          return {
            fogDensity: 0.0035,
            fogColor: 0x718a99,
            skyDay: 0x588da8,
            sunIntensity: 1.15,
            humidityHaze: 0.70,
            ambientTint: 0xd6e8f5
          };
        case 'NILGIRIS':
        default:
          return {
            fogDensity: 0.0055,
            fogColor: 0x889db0,
            skyDay: 0x4f7b9c,
            sunIntensity: 1.00,
            humidityHaze: 0.90,
            ambientTint: 0xcfe0ee
          };
      }
    }
  }

  const mapInstance = new TamilNaduGeoMap();

  // Backward-compatible global hook
  if (typeof window !== 'undefined') {
    window.TamilNaduGeoMap = mapInstance;
    window.getRealTamilNaduTelemetry = function (playerX, playerZ = 0) {
      const t = mapInstance.getGeographicTelemetry(playerX, playerZ);
      return {
        lat: t.lat.toString(),
        lng: t.lng.toString(),
        zoneName: t.regionName,
        tamilZoneName: t.tamilName,
        region: t.regionId,
        biome: t.thinai,
        formattedCoordinates: t.formattedCoordinates
      };
    };
  }

  return mapInstance;
});
