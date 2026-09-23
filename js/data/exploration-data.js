/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Exploration & Traversal Data Definitions
 * Production-ready schemas for exploration states, interaction types,
 * regional landmarks, water navigation bounds, and climbable surfaces.
 */

window.EXPLORATION_STATE = {
  NORMAL: 'NORMAL',
  INTERACTING: 'INTERACTING',
  INSPECTING: 'INSPECTING',
  CLIMBING: 'CLIMBING',
  SWIMMING: 'SWIMMING',
  BOATING: 'BOATING',
  CROUCHING: 'CROUCHING',
  PUZZLE: 'PUZZLE',
  PHOTO_MODE: 'PHOTO_MODE',
  DIALOGUE: 'DIALOGUE'
};

window.INTERACTION_TYPES = [
  'inspect',
  'open',
  'close',
  'push',
  'pull',
  'turn',
  'rotate',
  'lift',
  'pickup',
  'read',
  'photograph',
  'enter',
  'exit',
  'climb',
  'swim',
  'boat',
  'activate',
  'light',
  'use',
  'operate'
];

window.REGIONAL_LANDMARKS = [
  // George Town / Chennai
  {
    id: 'landmark_madras_high_court',
    name: 'Madras High Court Red Brick Gates',
    tamilName: 'மதராஸ் உயர் நீதிமன்ற வாயில்',
    region: 'GEORGE_TOWN',
    type: 'major',
    position: { x: -250, y: 2.4, z: 0 },
    radius: 18.0,
    discoveryXP: 100,
    loreKey: 'high_court_gates',
    description: 'Indo-Saracenic terracotta red brick arches built in 1892. Stained with monsoonal rain and vintage Royal Enfield tyre treads.'
  },
  {
    id: 'landmark_velu_auto_stand',
    name: 'Parrys Corner Auto Stand',
    tamilName: 'பாரிஸ் கார்னர் ஆட்டோ நிறுத்தம்',
    region: 'GEORGE_TOWN',
    type: 'minor',
    position: { x: -242, y: 2.2, z: 12 },
    radius: 12.0,
    discoveryXP: 50,
    loreKey: 'parrys_auto_stand',
    description: 'Black and yellow auto-rickshaws lined alongside the busy flower and electrical market corridor.'
  },

  // Cauvery Delta
  {
    id: 'landmark_delta_ancient_sluice',
    name: 'Grand Anicut Ancient Regulator Canal',
    tamilName: 'கல்லணை பாசனக் கால்வாய் மதகு',
    region: 'CAUVERY_DELTA',
    type: 'major',
    position: { x: -160, y: 4.8, z: -10 },
    radius: 20.0,
    discoveryXP: 120,
    loreKey: 'delta_sluice_regulator',
    description: 'Chola hydraulic engineering stone sluices governing the flow of the Cauvery distributaries into fertile paddy fields.'
  },
  {
    id: 'landmark_village_well',
    name: 'Sembiayanmahadevi Village Deep Well',
    tamilName: 'செம்பியன்மாதேவி கிராமத்து கிணறு',
    region: 'CAUVERY_DELTA',
    type: 'minor',
    position: { x: -145, y: 5.0, z: 25 },
    radius: 14.0,
    discoveryXP: 60,
    loreKey: 'village_well',
    description: 'Ancient circular stone well with stone pulley grooves worn smooth by coconut coir ropes over centuries.'
  },

  // Pichavaram
  {
    id: 'landmark_mangrove_dock',
    name: 'Pichavaram Mangrove Watchtower Dock',
    tamilName: 'பிச்சாவரம் சதுப்புநில படகுத்துறை',
    region: 'PICHAVARAM',
    type: 'major',
    position: { x: -80, y: 1.2, z: -40 },
    radius: 22.0,
    discoveryXP: 150,
    loreKey: 'mangrove_dock',
    description: 'Weathered wooden jetty built over stilts where traditional wooden thoni boats embark into tidal mangrove canals.'
  },
  {
    id: 'landmark_sunken_shrine',
    name: 'Sunken Tidal Shrine of the Wetland',
    tamilName: 'சதுப்புநில மூழ்கிய சிறு கோவில்',
    region: 'PICHAVARAM',
    type: 'hidden',
    position: { x: -65, y: 0.8, z: -55 },
    radius: 16.0,
    discoveryXP: 200,
    loreKey: 'sunken_tidal_shrine',
    description: 'Partially submerged laterite stone shrine only reachable by boat during mid-tide when water routes align.'
  },

  // Chettinad
  {
    id: 'landmark_chettinad_mansion',
    name: 'Kanadukathan Heritage Courtyard Mansion',
    tamilName: 'கானாடுகாத்தான் செட்டிநாடு அரண்மனை',
    region: 'CHETTINAD',
    type: 'major',
    position: { x: 10, y: 6.5, z: 15 },
    radius: 24.0,
    discoveryXP: 150,
    loreKey: 'chettinad_mansion',
    description: 'Burmese teak pillars, Italian marble, Athangudi floor tiles, and grand brass-bolted teak doorways.'
  },
  {
    id: 'landmark_athangudi_kiln',
    name: 'Athangudi Handmade Tile Kiln',
    tamilName: 'ஆத்தங்குடி பாரம்பரிய தரை ஓடு பட்டறை',
    region: 'CHETTINAD',
    type: 'minor',
    position: { x: 25, y: 6.2, z: 30 },
    radius: 14.0,
    discoveryXP: 75,
    loreKey: 'athangudi_kiln',
    description: 'Open-air artisan shed where vegetable dyes, local sand, and cement are cast into vibrant floral floor tiles.'
  },

  // Thanjavur
  {
    id: 'landmark_artisan_bronze_forge',
    name: 'Swamimalai Lost-Wax Bronze Forge',
    tamilName: 'சுவாமிமலை வெண்கலச் சிற்பப் பட்டறை',
    region: 'THANJAVUR',
    type: 'major',
    position: { x: 80, y: 8.5, z: -20 },
    radius: 20.0,
    discoveryXP: 140,
    loreKey: 'swamimalai_forge',
    description: 'Chola tradition wax casting foundry with beeswax models, crucibles, and fine iron chisels.'
  },
  {
    id: 'landmark_veena_workshop',
    name: 'Heritage Saraswati Veena Atelier',
    tamilName: 'பாரம்பரிய சரஸ்வதி வீணை பட்டறை',
    region: 'THANJAVUR',
    type: 'minor',
    position: { x: 95, y: 8.2, z: -5 },
    radius: 12.0,
    discoveryXP: 70,
    loreKey: 'veena_workshop',
    description: 'Jackwood trunks seasoned for decades, carved into resonant musical resonators with brass frets.'
  },

  // Mamallapuram
  {
    id: 'landmark_shore_temple_rock',
    name: 'Mamallapuram Coastal Granite Ridge',
    tamilName: 'மாமல்லபுரம் கடற்கரை கருங்கல் பாறை',
    region: 'MAMALLAPURAM',
    type: 'major',
    position: { x: 160, y: 7.0, z: -35 },
    radius: 22.0,
    discoveryXP: 160,
    loreKey: 'shore_temple_rock',
    description: 'Salt-eroded monolithic boulder terraces looking over the Bay of Bengal, carved with mythical animal reliefs.'
  },
  {
    id: 'landmark_stone_sculptor_yard',
    name: 'Five Rathas Master Sculptor Yard',
    tamilName: 'ஐந்து ரதம் சிற்பக் கூடம்',
    region: 'MAMALLAPURAM',
    type: 'minor',
    position: { x: 175, y: 6.8, z: -15 },
    radius: 15.0,
    discoveryXP: 80,
    loreKey: 'stone_sculptor_yard',
    description: 'Granite blocks being shaped by hand with heavy mallets and tempered chisels surrounded by fine stone dust.'
  },

  // Nilgiris
  {
    id: 'landmark_tea_kadai_ghats',
    name: 'Murugan Annans Mountain Tea Kadai',
    tamilName: 'முருகன் அண்ணன் மலைப்பாதை டீ கடை',
    region: 'NILGIRIS',
    type: 'major',
    position: { x: 230, y: 24.5, z: -10 },
    radius: 18.0,
    discoveryXP: 120,
    loreKey: 'tea_kadai_ghats',
    description: 'Wood and tin-sheet mountain shelter steaming with hot cardamom cutting chai and fresh banana fritters.'
  },
  {
    id: 'landmark_toda_sacred_mound',
    name: 'Toda Clan Sacred Conical Mound',
    tamilName: 'தோடர் புனித மேடு',
    region: 'NILGIRIS',
    type: 'hidden',
    position: { x: 265, y: 31.8, z: 20 },
    radius: 16.0,
    discoveryXP: 220,
    loreKey: 'toda_sacred_mound',
    description: 'Barrel-vaulted dry-stone sanctuary with buffalo horn emblems hidden high in the Shola mist.'
  }
];

window.WATER_ZONES_CONFIG = [
  {
    id: 'pichavaram_mangrove_basin',
    region: 'PICHAVARAM',
    bounds: { minX: -110, maxX: -40, minZ: -70, maxZ: -10 },
    surfaceY: 1.0,
    deepWaterDepth: 3.5,
    swimmable: true,
    speedMultiplier: 0.48,
    energyDrainPerSec: 2.2,
    warmthDrainPerSec: 0.05
  },
  {
    id: 'cauvery_irrigation_canal',
    region: 'CAUVERY_DELTA',
    bounds: { minX: -180, maxX: -130, minZ: -30, maxZ: 5 },
    surfaceY: 3.6,
    deepWaterDepth: 1.8,
    swimmable: true,
    speedMultiplier: 0.55,
    energyDrainPerSec: 1.8,
    warmthDrainPerSec: 0.02
  },
  {
    id: 'mamallapuram_surf_shallows',
    region: 'MAMALLAPURAM',
    bounds: { minX: 140, maxX: 210, minZ: -60, maxZ: -20 },
    surfaceY: 2.0,
    deepWaterDepth: 2.2,
    swimmable: true,
    speedMultiplier: 0.50,
    energyDrainPerSec: 2.0,
    warmthDrainPerSec: 0.03
  }
];

window.BOAT_NAVIGATION_ZONES = [
  {
    id: 'pichavaram_boat_route_alpha',
    region: 'PICHAVARAM',
    bounds: { minX: -105, maxX: -45, minZ: -65, maxZ: -15 },
    waterLevelY: 1.0,
    dockLocations: [
      { id: 'dock_main_pichavaram', name: 'Main Mangrove Jetty', x: -80, y: 1.2, z: -40, heading: 0 },
      { id: 'dock_sunken_shrine', name: 'Sunken Shrine Mooring', x: -65, y: 1.0, z: -55, heading: 1.57 }
    ],
    maxSpeed: 24.0,
    reverseSpeed: 8.0,
    turnRate: 1.4,
    waveBobbingAmplitude: 0.08
  }
];

window.CLIMB_SURFACES_DATA = [
  {
    id: 'climb_ghats_rock_face',
    region: 'NILGIRIS',
    position: { x: 245, y: 22.0, z: 5 },
    climbHeight: 9.8,
    climbSpeed: 2.4,
    type: 'rock',
    waypoints: [
      { x: 245, y: 22.0, z: 5 },
      { x: 245, y: 26.5, z: 5.2 },
      { x: 245.2, y: 31.8, z: 5.6 }
    ]
  },
  {
    id: 'climb_chettinad_terrace_ladder',
    region: 'CHETTINAD',
    position: { x: 12, y: 6.5, z: 18 },
    climbHeight: 4.8,
    climbSpeed: 3.0,
    type: 'ladder',
    waypoints: [
      { x: 12, y: 6.5, z: 18 },
      { x: 12, y: 11.3, z: 18.2 }
    ]
  },
  {
    id: 'climb_sluice_retaining_wall',
    region: 'CAUVERY_DELTA',
    position: { x: -162, y: 4.8, z: -8 },
    climbHeight: 3.2,
    climbSpeed: 2.6,
    type: 'low_wall',
    waypoints: [
      { x: -162, y: 4.8, z: -8 },
      { x: -162, y: 8.0, z: -8.1 }
    ]
  }
];

window.EXPLORATION_ACCESSIBILITY_CONFIG = {
  toggleCrouch: false,      // true: toggle, false: hold
  cameraSensitivity: 1.0,
  reducedScreenMovement: false,
  interactionHintSize: 'normal', // 'normal' | 'large'
  subtitleSize: 'normal',        // 'normal' | 'large'
  puzzleAssistance: false       // Provides gentle diegetic hints after multiple incorrect tries
};
