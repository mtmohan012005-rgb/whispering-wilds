// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION WILDLIFE DATA
// Species-Specific Behaviors, Temperament, Perception & Habitat Definitions
// ============================================================================

/**
 * Wildlife AI States:
 * IDLE, FORAGE, GRAZE, DRINK, OBSERVE, ALERT, FLEE, RETURN,
 * REST, FLY, LAND, CLIMB, GROUP_MOVE, DEFEND
 */

const WILDLIFE_STATES = [
  'IDLE',
  'FORAGE',
  'GRAZE',
  'DRINK',
  'OBSERVE',
  'ALERT',
  'FLEE',
  'RETURN',
  'REST',
  'FLY',
  'LAND',
  'CLIMB',
  'GROUP_MOVE',
  'DEFEND'
];

/**
 * Master Species Production Catalog
 */
const WILDLIFE_SPECIES_DATA = {
  // 1. Nilgiri Tahr (வரையாடு) - Mountain Cliff Dweller
  nilgiri_tahr: {
    species: 'nilgiri_tahr',
    commonName: 'Nilgiri Tahr',
    tamilName: 'நீலகிரி வரையாடு',
    scientificName: 'Nilgiritragus hylocrius',
    region: 'Nilgiris / Western Ghats',
    temperament: 'agile_skittish',
    groupSize: { min: 3, max: 7 },
    alertRadius: 18.0, // Alerted if player is within 18m
    fleeRadius: 10.0,  // Flees if player approaches within 10m
    movementSpeed: { walk: 2.8, run: 7.2 },
    returnDelay: 12.0, // Seconds before calming down and returning
    homeLocation: { x: 260, z: 32, label: 'High Granite Precipice (Nilgiris)' },
    wanderRadius: 35.0,
    minElevation: 22.0, // Requires steep high-altitude terrain
    modelPath: 'assets/characters/wildlife/nilgiri-tahr.glb',
    validStates: ['IDLE', 'GRAZE', 'GROUP_MOVE', 'ALERT', 'FLEE', 'RETURN', 'REST'],
    defaultState: 'GRAZE',
    silhouetteColor: 0x5a4a42,
    dimensions: { width: 0.6, height: 1.1, length: 1.4 }
  },

  // 2. Nilgiri Langur (கரும் குரங்கு) - Canopy & Rock Observer
  nilgiri_langur: {
    species: 'nilgiri_langur',
    commonName: 'Nilgiri Langur',
    tamilName: 'நீலகிரி கரும் குரங்கு',
    scientificName: 'Semnopithecus johnii',
    region: 'Western Ghats',
    temperament: 'curious_arboreal',
    groupSize: { min: 2, max: 5 },
    alertRadius: 20.0,
    fleeRadius: 9.0,
    movementSpeed: { walk: 3.2, run: 8.5 },
    returnDelay: 10.0,
    homeLocation: { x: 235, z: 12, label: 'Shola Forest Canopy Ridge' },
    wanderRadius: 25.0,
    minElevation: 16.0,
    modelPath: 'assets/characters/wildlife/nilgiri-langur.glb',
    validStates: ['IDLE', 'FORAGE', 'OBSERVE', 'CLIMB', 'ALERT', 'FLEE', 'RETURN'],
    defaultState: 'OBSERVE',
    silhouetteColor: 0x1f1f24,
    dimensions: { width: 0.45, height: 0.9, length: 0.8 }
  },

  // 3. Asian Elephant (காட்டு யானை) - Keystone Forest Giant
  elephant: {
    species: 'elephant',
    commonName: 'Asian Elephant',
    tamilName: 'ஆசியக் காட்டு யானை',
    scientificName: 'Elephas maximus',
    region: 'Western Ghats',
    temperament: 'defensive_herd',
    groupSize: { min: 2, max: 4 },
    alertRadius: 24.0, // Broad alert awareness
    fleeRadius: 0.0,   // Does not flee readily; retreats or defends
    defendRadius: 4.5, // Strongly defends if player encroaches closer than 4.5m
    movementSpeed: { walk: 2.2, run: 5.5 },
    returnDelay: 18.0,
    homeLocation: { x: 180, z: 25, label: 'Western Ghats Bamboo Valley' },
    wanderRadius: 40.0,
    minElevation: 8.0,
    modelPath: 'assets/characters/wildlife/elephant.glb',
    validStates: ['IDLE', 'FORAGE', 'DRINK', 'GROUP_MOVE', 'ALERT', 'DEFEND', 'REST'],
    defaultState: 'FORAGE',
    silhouetteColor: 0x4a4f54,
    dimensions: { width: 1.8, height: 2.8, length: 3.8 }
  },

  // 4. Gaur / Indian Bison (காட்டு மாடு) - Muscular Forest Grazer
  gaur: {
    species: 'gaur',
    commonName: 'Gaur (Indian Bison)',
    tamilName: 'காட்டு மாடு (கௌர்)',
    scientificName: 'Bos gaurus',
    region: 'Western Ghats',
    temperament: 'wary_herd',
    groupSize: { min: 2, max: 6 },
    alertRadius: 20.0,
    fleeRadius: 7.0, // Retires backwards slowly rather than panic flee
    movementSpeed: { walk: 2.4, run: 6.0 },
    returnDelay: 15.0,
    homeLocation: { x: 165, z: -15, label: 'Forest Meadow Glade' },
    wanderRadius: 30.0,
    minElevation: 10.0,
    modelPath: 'assets/characters/wildlife/gaur.glb',
    validStates: ['IDLE', 'GRAZE', 'GROUP_MOVE', 'ALERT', 'FLEE', 'RETURN', 'REST'],
    defaultState: 'GRAZE',
    silhouetteColor: 0x2b231d,
    dimensions: { width: 1.2, height: 1.9, length: 2.6 }
  },

  // 5. Great Egret (வெள்ளைக் கொக்கு) - Wetland Canal Wader & Flyer
  egret: {
    species: 'egret',
    commonName: 'Great Egret',
    tamilName: 'பெரிய வெள்ளைக் கொக்கு',
    scientificName: 'Ardea alba',
    region: 'Pichavaram / Cauvery Delta',
    temperament: 'skittish_aerial',
    groupSize: { min: 1, max: 4 },
    alertRadius: 14.0,
    fleeRadius: 8.0,
    movementSpeed: { walk: 1.4, run: 8.0 }, // Flight speed when fleeing
    returnDelay: 8.0,
    homeLocation: { x: -65, z: 28, label: 'Pichavaram Mangrove Tidal Flats' },
    wanderRadius: 28.0,
    modelPath: 'assets/characters/wildlife/egret.glb',
    validStates: ['IDLE', 'FORAGE', 'FLY', 'LAND', 'ALERT', 'FLEE', 'RETURN'],
    defaultState: 'FORAGE',
    silhouetteColor: 0xf5f6fa,
    dimensions: { width: 0.4, height: 1.0, length: 0.7 }
  },

  // 6. Kingfisher (மீன்கொத்திப் பறவை) - Aerial Diver
  kingfisher: {
    species: 'kingfisher',
    commonName: 'White-throated Kingfisher',
    tamilName: 'வெள்ளைத் தொண்டை மீன்கொத்தி',
    scientificName: 'Halcyon smyrnensis',
    region: 'Pichavaram',
    temperament: 'perch_hunter',
    groupSize: { min: 1, max: 2 },
    alertRadius: 10.0,
    fleeRadius: 5.5,
    movementSpeed: { walk: 1.2, run: 11.0 }, // Fast aerial darting
    returnDelay: 6.0,
    homeLocation: { x: -55, z: 38, label: 'Canal Overhanging Reed Perch' },
    wanderRadius: 18.0,
    modelPath: 'assets/characters/wildlife/kingfisher.glb',
    validStates: ['IDLE', 'OBSERVE', 'FLY', 'LAND', 'ALERT', 'FLEE', 'RETURN'],
    defaultState: 'OBSERVE',
    silhouetteColor: 0x1b9cfc,
    dimensions: { width: 0.25, height: 0.35, length: 0.4 }
  },

  // 7. Indian Peafowl (மயில்) - Delta Scrub Strutter
  peafowl: {
    species: 'peafowl',
    commonName: 'Indian Peafowl',
    tamilName: 'இந்திய மயில்',
    scientificName: 'Pavo cristatus',
    region: 'Cauvery Delta / Nilgiris',
    temperament: 'proud_alert',
    groupSize: { min: 1, max: 3 },
    alertRadius: 16.0,
    fleeRadius: 8.5,
    movementSpeed: { walk: 2.0, run: 6.5 },
    returnDelay: 10.0,
    homeLocation: { x: -10, z: -8, label: 'Cauvery Riverbank Scrub' },
    wanderRadius: 25.0,
    modelPath: 'assets/characters/wildlife/peafowl.glb',
    validStates: ['IDLE', 'FORAGE', 'OBSERVE', 'ALERT', 'FLEE', 'RETURN', 'REST'],
    defaultState: 'FORAGE',
    silhouetteColor: 0x0652dd,
    dimensions: { width: 0.5, height: 0.95, length: 1.3 }
  },

  // 8. Kangayam Cattle (காங்கேயம் காளை / நாட்டு மாடு) - Pastoral Grazer
  cattle: {
    species: 'cattle',
    commonName: 'Kangayam Cattle',
    tamilName: 'காங்கேயம் நாட்டு மாடு',
    scientificName: 'Bos indicus',
    region: 'Villages / Cauvery Delta',
    temperament: 'docile_pastoral',
    groupSize: { min: 2, max: 5 },
    alertRadius: 9.0,
    fleeRadius: 4.5,
    movementSpeed: { walk: 1.6, run: 4.5 },
    returnDelay: 12.0,
    homeLocation: { x: -35, z: 5, label: 'Village Pasture & Sluice Meadow' },
    wanderRadius: 30.0,
    modelPath: 'assets/characters/wildlife/cattle.glb',
    validStates: ['IDLE', 'GRAZE', 'DRINK', 'GROUP_MOVE', 'REST'],
    defaultState: 'GRAZE',
    silhouetteColor: 0xbdc3c7,
    dimensions: { width: 0.9, height: 1.5, length: 2.1 }
  },

  // 9. Tamil Village Goat (நாட்டு ஆடு) - Agile Mound Grazer
  goat: {
    species: 'goat',
    commonName: 'Tamil Village Goat',
    tamilName: 'கன்னி நாட்டு ஆடு',
    scientificName: 'Capra hircus',
    region: 'Villages',
    temperament: 'nimble_flock',
    groupSize: { min: 3, max: 8 },
    alertRadius: 12.0,
    fleeRadius: 6.5,
    movementSpeed: { walk: 2.2, run: 5.8 },
    returnDelay: 8.0,
    homeLocation: { x: -45, z: -25, label: 'Red Clay Village Mounds' },
    wanderRadius: 22.0,
    modelPath: 'assets/characters/wildlife/goat.glb',
    validStates: ['IDLE', 'GRAZE', 'CLIMB', 'GROUP_MOVE', 'ALERT', 'FLEE', 'RETURN'],
    defaultState: 'GRAZE',
    silhouetteColor: 0x4a3c31,
    dimensions: { width: 0.45, height: 0.8, length: 1.1 }
  }
};

/**
 * Pre-configured Spawning Groups across Real Tamil Nadu Biomes
 */
const WILDLIFE_PRODUCTION_SPAWNS = [
  // Pichavaram Wetland Herds
  { id: 'egret_flock_1', species: 'egret', count: 3, center: { x: -65, z: 28 } },
  { id: 'kingfisher_pair_1', species: 'kingfisher', count: 2, center: { x: -55, z: 38 } },

  // Cauvery Delta Agricultural Herds
  { id: 'cattle_herd_1', species: 'cattle', count: 3, center: { x: -35, z: 5 } },
  { id: 'goat_flock_1', species: 'goat', count: 4, center: { x: -45, z: -25 } },
  { id: 'peafowl_pair_1', species: 'peafowl', count: 2, center: { x: -10, z: -8 } },

  // Western Ghats & Nilgiri Mountain Fauna
  { id: 'tahr_herd_1', species: 'nilgiri_tahr', count: 4, center: { x: 260, z: 32 } },
  { id: 'langur_troop_1', species: 'nilgiri_langur', count: 3, center: { x: 235, z: 12 } },
  { id: 'elephant_family_1', species: 'elephant', count: 2, center: { x: 180, z: 25 } },
  { id: 'gaur_herd_1', species: 'gaur', count: 3, center: { x: 165, z: -15 } }
];

// Helper to look up species configuration
function getWildlifeSpeciesConfig(speciesKey) {
  return WILDLIFE_SPECIES_DATA[speciesKey] || null;
}

// Global browser and module exports
if (typeof window !== 'undefined') {
  window.WILDLIFE_STATES = WILDLIFE_STATES;
  window.WILDLIFE_SPECIES_DATA = WILDLIFE_SPECIES_DATA;
  window.WILDLIFE_PRODUCTION_SPAWNS = WILDLIFE_PRODUCTION_SPAWNS;
  window.getWildlifeSpeciesConfig = getWildlifeSpeciesConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WILDLIFE_STATES,
    WILDLIFE_SPECIES_DATA,
    WILDLIFE_PRODUCTION_SPAWNS,
    getWildlifeSpeciesConfig
  };
}
