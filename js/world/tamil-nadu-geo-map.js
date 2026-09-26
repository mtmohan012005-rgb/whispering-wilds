/**
 * The Whispering Wilds (Kaattu Vazhi / Thadam)
 * Master Geographic Map System & World Coordinate Abstraction (TamilNaduGeoMap)
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

  // ─── 1. REGIONAL DEFINITIONS (7 PRODUCTION REGIONS) ─────────────────────────
  const REGIONS = {
    CHENNAI: {
      id: 'CHENNAI',
      key: 'chennai',
      name: 'Chennai & George Town Urban Corridor',
      tamilName: 'சென்னை & ஜார்ஜ் டவுன் வணிக வீதிகள்',
      geoCenter: { lat: 13.0827, lng: 80.2707 },
      geoBounds: { minLat: 12.90, maxLat: 13.20, minLng: 80.15, maxLng: 80.35 },
      worldBounds: { minX: -300, maxX: -180, minZ: -100, maxZ: 100 },
      baseElevation: { min: 0.8, max: 2.8 },
      elevationRange: { min: 0.8, max: 2.8 },
      biome: 'Neythal / Urban Marutham',
      thinai: 'Neythal / Urban Marutham',
      climate: { tempC: 33, humidity: 0.82, rainProfile: 'northeast_monsoon' },
      soundscape: 'chennai_traffic_horns_market_chatter',
      roads: ['gst_arterial_nh45', 'george_town_bazaar_lane', 'broadway_commercial'],
      roadNetwork: ['gst_arterial_nh45', 'george_town_bazaar_lane', 'broadway_commercial'],
      waterways: ['stormwater_drains', 'buckingham_canal_edge', 'marina_coastal_surf'],
      waterFeatures: ['stormwater_drains', 'buckingham_canal_edge', 'marina_coastal_surf'],
      landmarks: ['madras_high_court', 'parrys_corner', 'kotwal_chavadi', 'george_town_harbor'],
      settlements: ['George Town', 'Parrys Corner', 'Triplicane', 'Mylapore']
    },

    CHENGALPATTU_VILLUPURAM: {
      id: 'CHENGALPATTU_VILLUPURAM',
      key: 'villupuram',
      name: 'Chengalpattu & Villupuram Red Soil Plains',
      tamilName: 'செங்கல்பட்டு & விழுப்புரம் செம்மண் நிலங்கள்',
      geoCenter: { lat: 11.9401, lng: 79.4861 },
      geoBounds: { minLat: 11.75, maxLat: 12.80, minLng: 79.20, maxLng: 80.00 },
      worldBounds: { minX: -180, maxX: -80, minZ: -100, maxZ: 100 },
      baseElevation: { min: 2.0, max: 7.5 },
      elevationRange: { min: 2.0, max: 7.5 },
      biome: 'Mullai (Pastoral Scrub & Red Clay)',
      thinai: 'Mullai (Pastoral Scrub & Red Clay)',
      climate: { tempC: 34, humidity: 0.65, rainProfile: 'semi_arid_monsoon' },
      soundscape: 'palmyra_wind_cicadas_bullock_bells',
      roads: ['state_highway_sh49', 'red_dirt_village_road', 'bullock_cart_track'],
      roadNetwork: ['state_highway_sh49', 'red_dirt_village_road', 'bullock_cart_track'],
      waterways: ['irrigation_tank_ery', 'dry_monsoon_nullah'],
      waterFeatures: ['irrigation_tank_ery', 'dry_monsoon_nullah'],
      landmarks: ['panchayat_well', 'roadside_ayyanar_shrine', 'palmyra_avenue'],
      settlements: ['Chengalpattu', 'Tindivanam', 'Villupuram', 'Vikravandi']
    },

    CAUVERY_DELTA: {
      id: 'CAUVERY_DELTA',
      key: 'cauvery_delta',
      name: 'Cauvery River Basin & Granary Farmlands',
      tamilName: 'காவிரி டெல்டா நெற்களஞ்சியம் & ஆற்றுப்படுகை',
      geoCenter: { lat: 10.7870, lng: 79.1378 },
      geoBounds: { minLat: 10.50, maxLat: 11.10, minLng: 78.90, maxLng: 79.80 },
      worldBounds: { minX: -80, maxX: 30, minZ: -100, maxZ: 30 },
      baseElevation: { min: 0.2, max: 2.2 },
      elevationRange: { min: 0.2, max: 2.2 },
      biome: 'Marutham (Riparian Alluvial Plains)',
      thinai: 'Marutham (Riparian Alluvial Plains)',
      climate: { tempC: 30, humidity: 0.80, rainProfile: 'cauvery_inundation' },
      soundscape: 'flowing_canal_water_roosters_paddy_rustle',
      roads: ['canal_bund_road', 'paddy_dyke_pathway', 'thanjavur_trunk_road'],
      roadNetwork: ['canal_bund_road', 'paddy_dyke_pathway', 'thanjavur_trunk_road'],
      waterways: ['cauvery_distributary_canal', 'flooded_paddy_polder', 'ancient_anicut_sluice'],
      waterFeatures: ['cauvery_distributary_canal', 'flooded_paddy_polder', 'ancient_anicut_sluice'],
      landmarks: ['chola_waterwheel_sluice', 'kumbakonam_paddy_fields', 'kallanai_anicut'],
      settlements: ['Thanjavur', 'Kumbakonam', 'Thiruvaiyaru', 'Mayiladuthurai']
    },

    PICHAVARAM: {
      id: 'PICHAVARAM',
      key: 'pichavaram',
      name: 'Pichavaram Mangrove Wetlands & Tidal Creeks',
      tamilName: 'பிச்சாவரம் சதுப்புநிலக் காடு & அலையாத்தி கால்வாய்கள்',
      geoCenter: { lat: 11.4287, lng: 79.7831 },
      geoBounds: { minLat: 11.35, maxLat: 11.50, minLng: 79.70, maxLng: 79.85 },
      worldBounds: { minX: -80, maxX: 30, minZ: 30, maxZ: 110 },
      baseElevation: { min: -0.6, max: 0.8 },
      elevationRange: { min: -0.6, max: 0.8 },
      biome: 'Neythal (Estuary & Tidal Wetland)',
      thinai: 'Neythal (Estuary & Tidal Wetland)',
      climate: { tempC: 29, humidity: 0.94, rainProfile: 'tidal_brackish_humid' },
      soundscape: 'paddle_strokes_mud_crabs_waterfowl_echoes',
      roads: ['wooden_stilt_boardwalk', 'mangrove_boat_channel_alpha', 'mangrove_boat_channel_beta'],
      roadNetwork: ['wooden_stilt_boardwalk', 'mangrove_boat_channel_alpha', 'mangrove_boat_channel_beta'],
      waterways: ['tidal_muddy_creek', 'brackish_estuary_basin', 'stilt_root_pools'],
      waterFeatures: ['tidal_muddy_creek', 'brackish_estuary_basin', 'stilt_root_pools'],
      landmarks: ['pichavaram_boat_dock', 'rhizophora_stilt_canopy_tunnel', 'tidal_estuary_mouth'],
      settlements: ['Killai', 'Pichavaram Jetty', 'Chidambaram Estuary']
    },

    CHETTINAD: {
      id: 'CHETTINAD',
      key: 'chettinad',
      name: 'Chettinad Heritage Courtyards & Mansions',
      tamilName: 'செட்டிநாடு பாரம்பரிய மாளிகைகள் & ஊரணிகள்',
      geoCenter: { lat: 10.0682, lng: 78.7842 },
      geoBounds: { minLat: 9.95, maxLat: 10.25, minLng: 78.60, maxLng: 78.95 },
      worldBounds: { minX: -20, maxX: 40, minZ: -100, maxZ: -30 },
      baseElevation: { min: 3.5, max: 9.0 },
      elevationRange: { min: 3.5, max: 9.0 },
      biome: 'Palai / Dry Mullai (Heritage Scrub)',
      thinai: 'Palai / Dry Mullai (Heritage Scrub)',
      climate: { tempC: 35, humidity: 0.55, rainProfile: 'dry_monsoon_shadow' },
      soundscape: 'dry_wind_temple_bells_wood_carving_chisel',
      roads: ['chettinad_heritage_street', 'dry_red_gravel_lane', 'mansion_front_corridor'],
      roadNetwork: ['chettinad_heritage_street', 'dry_red_gravel_lane', 'mansion_front_corridor'],
      waterways: ['oorani_heritage_tank', 'dry_rainwater_channel'],
      waterFeatures: ['oorani_heritage_tank', 'dry_rainwater_channel'],
      landmarks: ['thousand_window_mansion', 'athangudi_tile_workshop', 'carved_door_veranda'],
      settlements: ['Karaikudi', 'Athangudi', 'Kanadukathan', 'Kothamangalam']
    },

    MAMALLAPURAM: {
      id: 'MAMALLAPURAM',
      key: 'mamallapuram',
      name: 'Mamallapuram Coastal Granite & Pallava Shore Sanctuary',
      tamilName: 'மாமல்லபுரம் கடற்கரை பாறைகள் & பல்லவர் குடைவரைக் கோயில்கள்',
      geoCenter: { lat: 12.6269, lng: 80.1927 },
      geoBounds: { minLat: 12.55, maxLat: 12.70, minLng: 80.15, maxLng: 80.25 },
      worldBounds: { minX: -160, maxX: -90, minZ: -110, maxZ: -40 },
      baseElevation: { min: 0.5, max: 14.0 },
      elevationRange: { min: 0.5, max: 14.0 },
      biome: 'Neythal / Coastal Granite',
      thinai: 'Neythal / Coastal Granite',
      climate: { tempC: 31, humidity: 0.84, rainProfile: 'coastal_surf_haze' },
      soundscape: 'ocean_surf_crashing_granite_wind_gulls',
      roads: ['east_coast_road_ecr', 'sandy_dune_track'],
      roadNetwork: ['east_coast_road_ecr', 'sandy_dune_track'],
      waterways: ['bay_of_bengal_surf', 'coastal_granite_tide_pool'],
      waterFeatures: ['bay_of_bengal_surf', 'coastal_granite_tide_pool'],
      landmarks: ['shore_temple_twin_sanctum', 'arjuna_penance_bas_relief', 'granite_quarry_boulders'],
      settlements: ['Mamallapuram', 'Fisherman Cove', 'ECR Heritage Village']
    },

    NILGIRIS: {
      id: 'NILGIRIS',
      key: 'nilgiris',
      name: 'Nilgiri High Country, Tea Estates & Western Ghats',
      tamilName: 'நீலகிரி மலைநாடு • தேயிலை தோட்டங்கள் & சோலைக்காடுகள்',
      geoCenter: { lat: 11.4102, lng: 76.6950 },
      geoBounds: { minLat: 11.20, maxLat: 11.60, minLng: 76.50, maxLng: 78.40 },
      worldBounds: { minX: 40, maxX: 300, minZ: -100, maxZ: 100 },
      baseElevation: { min: 14.0, max: 88.0 },
      elevationRange: { min: 14.0, max: 88.0 },
      biome: 'Kurinji (High Altitude Shola & Montane Crags)',
      thinai: 'Kurinji (High Altitude Shola & Montane Crags)',
      climate: { tempC: 15, humidity: 0.88, rainProfile: 'mist_drizzle_frost' },
      soundscape: 'misty_wind_shola_rustle_nilgiri_pipit_waterfall',
      roads: ['ghat_hairpin_switchback_road', 'plantation_estate_cobble_track', 'shola_boundary_footpath'],
      roadNetwork: ['ghat_hairpin_switchback_road', 'plantation_estate_cobble_track', 'shola_boundary_footpath'],
      waterways: ['mountain_cataract_waterfall', 'granite_boulder_stream', 'shola_cloud_sponge_springs'],
      waterFeatures: ['mountain_cataract_waterfall', 'granite_boulder_stream', 'shola_cloud_sponge_springs'],
      landmarks: ['emerald_tea_estate_rows', 'toda_heritage_sacred_pasture', 'kolli_hairpins', 'nilgiri_tea_factory'],
      settlements: ['Udhagamandalam (Ooty)', 'Coonoor', 'Kotagiri', 'Kolli Hills']
    }
  };

  // ─── 2. GEOGRAPHIC PROGRESSION WAYPOINTS ────────────────────────────────────
  const GEO_WAYPOINTS = [
    { x: -270, z: 0,   lat: 13.0827, lng: 80.2707, regionId: 'CHENNAI', name: 'George Town High Court' },
    { x: -210, z: -15, lat: 12.8342, lng: 80.0442, regionId: 'CHENNAI', name: 'Chengalpattu Gateway' },
    { x: -140, z: 10,  lat: 11.9401, lng: 79.4861, regionId: 'CHENGALPATTU_VILLUPURAM', name: 'Villupuram Red Plains' },
    { x: -40,  z: -20, lat: 10.7870, lng: 79.1378, regionId: 'CAUVERY_DELTA', name: 'Cauvery River Sluice' },
    { x: -20,  z: 60,  lat: 11.4287, lng: 79.7831, regionId: 'PICHAVARAM', name: 'Pichavaram Mangrove Maze' },
    { x: -125, z: -70, lat: 12.6269, lng: 80.1927, regionId: 'MAMALLAPURAM', name: 'Mamallapuram Shore Temple' },
    { x: 10,   z: -65, lat: 10.0682, lng: 78.7842, regionId: 'CHETTINAD', name: 'Chettinad Heritage Courtyard' },
    { x: 90,   z: -10, lat: 11.2485, lng: 78.3389, regionId: 'NILGIRIS', name: 'Kolli Hairpin Ghat Road' },
    { x: 240,  z: 15,  lat: 11.4102, lng: 76.6950, regionId: 'NILGIRIS', name: 'Nilgiri Tea Slopes & Shola' }
  ];

  // ─── 3. TAMIL NADU WORLD COORDINATE ABSTRACTION ─────────────────────────────
  class TamilNaduWorldCoordinate {
    constructor(latitude, longitude, worldX, worldZ, regionId, cellId = null) {
      this.latitude = Number(latitude);
      this.longitude = Number(longitude);
      this.worldX = Number(worldX);
      this.worldZ = Number(worldZ);
      this.regionId = regionId;
      this.cellId = cellId || `cell_${Math.floor((worldX + 300) / 50)}_${Math.floor((worldZ + 110) / 50)}`;
    }

    static fromWorld(worldX, worldZ) {
      const t = mapInstance.getGeographicTelemetry(worldX, worldZ);
      const cellId = `cell_${Math.floor((worldX + 300) / 50)}_${Math.floor((worldZ + 110) / 50)}`;
      return new TamilNaduWorldCoordinate(t.lat, t.lng, worldX, worldZ, t.regionId, cellId);
    }

    static fromGeo(latitude, longitude) {
      let bestDist = Infinity;
      let bestX = 0, bestZ = 0, bestRegion = 'CHENNAI';
      for (const wp of GEO_WAYPOINTS) {
        const dLat = latitude - wp.lat;
        const dLng = longitude - wp.lng;
        const d = dLat * dLat + dLng * dLng;
        if (d < bestDist) {
          bestDist = d;
          bestX = wp.x;
          bestZ = wp.z;
          bestRegion = wp.regionId;
        }
      }
      const cellId = `cell_${Math.floor((bestX + 300) / 50)}_${Math.floor((bestZ + 110) / 50)}`;
      return new TamilNaduWorldCoordinate(latitude, longitude, bestX, bestZ, bestRegion, cellId);
    }
  }

  // ─── 4. TAMIL NADU GEO MAP CLASS ───────────────────────────────────────────
  class TamilNaduGeoMap {
    constructor() {
      this.regions = REGIONS;
      this.waypoints = GEO_WAYPOINTS;
      this.currentRegionId = 'CHENNAI';
      this.TamilNaduWorldCoordinate = TamilNaduWorldCoordinate;
    }

    /**
     * Determines which authentic Tamil Nadu region an (x, z) 3D coordinate belongs to.
     */
    getRegionAt(x, z) {
      // Coastal Mamallapuram check (specialized coastal enclave)
      if (x >= -160 && x <= -90 && z <= -40) {
        return this.regions.MAMALLAPURAM;
      }
      // Chettinad heritage pocket
      if (x >= -20 && x <= 40 && z <= -30) {
        return this.regions.CHETTINAD;
      }
      // Pichavaram check (southern coastal delta mangrove)
      if (x >= -80 && x <= 30 && z >= 30) {
        return this.regions.PICHAVARAM;
      }
      // Longitudinal sweep across Tamil Nadu
      if (x < -180) return this.regions.CHENNAI;
      if (x < -80)  return this.regions.CHENGALPATTU_VILLUPURAM;
      if (x < 40)   return this.regions.CAUVERY_DELTA;
      return this.regions.NILGIRIS;
    }

    /**
     * Replaces simplistic 1D interpolation with a 2D weighted inverse-distance geospatial telemetry.
     */
    getGeographicTelemetry(worldX, worldZ) {
      let totalWeight = 0;
      let interpLat = 0;
      let interpLng = 0;

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

    getCoordinate(worldX, worldZ) {
      return TamilNaduWorldCoordinate.fromWorld(worldX, worldZ);
    }

    getNearbyLandmarks(worldX, worldZ, radius = 45) {
      const region = this.getRegionAt(worldX, worldZ);
      return region.landmarks;
    }

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
        case 'CHETTINAD':
          return {
            fogDensity: 0.0010,
            fogColor: 0xcaa285,
            skyDay: 0x8ab8d8,
            sunIntensity: 1.60,
            humidityHaze: 0.25,
            ambientTint: 0xffe8d5
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

  if (typeof window !== 'undefined') {
    window.TamilNaduGeoMap = mapInstance;
    window.TamilNaduWorldCoordinate = TamilNaduWorldCoordinate;
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
