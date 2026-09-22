// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WORLD DATA & BIOME DEFINITIONS
// Locations, Landmarks, Flora, Fauna, and Interactive Entities across Tamil Nadu
// ============================================================================

// Real Tamil Nadu Map Data Structure (JSON / JavaScript)
window.tamilNaduMap = {
    startingZone: {
        name: "George Town & Madras High Court",
        tamilName: "ஜார்ஜ் டவுன் & மதராஸ் உயர் நீதிமன்றம்",
        region: "Chennai",
        biome: "urban_concrete",
        unlocked: true,
        coordinates: { lat: 13.0827, lng: 80.2707 },
        audioTheme: "urban_chaos_traffic.mp3",
        npcs: ["Tea Stall Annan", "Auto Driver Kumar", "Archivist"]
    },
    phase1: {
        name: "Villupuram Farmlands",
        tamilName: "விழுப்புரம் செம்மண் நிலங்கள்",
        region: "Villupuram",
        biome: "red_soil_plains",
        unlocked: true,
        unlockRequirement: "Get sturdy boots & bicycle",
        coordinates: { lat: 11.9401, lng: 79.4861 },
        audioTheme: "palmyra_wind.mp3",
        wildlife: ["Stray Dogs", "Cows", "Egrets"]
    },
    phase2: {
        name: "Pichavaram Mangroves & Delta",
        tamilName: "பிச்சாவரம் அலையாத்திக்காடு & காவிரி கழிமுகம்",
        region: "Chidambaram / Thanjavur",
        biome: "wetland_mangrove",
        unlocked: false,
        unlockRequirement: "Secure Boat Access",
        coordinates: { lat: 11.4287, lng: 79.7831 },
        audioTheme: "delta_river_flow.mp3",
        wildlife: ["Herons", "Water Snakes", "Crabs"]
    },
    phase3: {
        name: "Nilgiri Mist Slopes",
        tamilName: "நீலகிரி மூடுபனி சரிவுகள் & தேயிலை தோட்டங்கள்",
        region: "Ooty / Valparai",
        biome: "mountain_fog",
        unlocked: false,
        unlockRequirement: "Warm Weather Protection & Mountaineering Gear",
        coordinates: { lat: 11.4102, lng: 76.6950 },
        audioTheme: "cold_mountain_wind.mp3",
        wildlife: ["Nilgiri Tahr", "Wild Boar", "Mountain Eagles"]
    }
};

window.getRealTamilNaduTelemetry = function(playerX) {
  let lat, lng, zone;
  if (playerX < 1000) {
    const t = playerX / 1000;
    lat = 13.0827 + t * (11.9401 - 13.0827);
    lng = 80.2707 + t * (79.4861 - 80.2707);
    zone = window.tamilNaduMap.startingZone;
  } else if (playerX < 2000) {
    const t = (playerX - 1000) / 1000;
    lat = 11.9401 + t * (11.4287 - 11.9401);
    lng = 79.4861 + t * (79.7831 - 79.4861);
    zone = window.tamilNaduMap.phase1;
  } else if (playerX < 4000) {
    const t = (playerX - 2000) / 2000;
    lat = 11.4287 + t * (11.4102 - 11.4287);
    lng = 79.7831 + t * (76.6950 - 79.7831);
    zone = window.tamilNaduMap.phase2;
  } else {
    lat = 11.4102;
    lng = 76.6950;
    zone = window.tamilNaduMap.phase3;
  }
  return {
    lat: lat.toFixed(4),
    lng: lng.toFixed(4),
    zoneName: zone.name,
    tamilZoneName: zone.tamilName,
    region: zone.region,
    biome: zone.biome
  };
};

window.WORLD_DATA = {
  biomes: {
    chennai_plains: {
      id: 'chennai_plains',
      name: 'Chennai & Red Soil Plains (மதராஸ் & செம்மண் நிலம்)',
      phase: 1,
      baseTemp: 32, // Celsius
      soilColor: '#96432b',
      grassColor: '#6d8137',
      skyDay: '#6ba1bd',
      skyNight: '#0c1424',
      unlocked: true,
      bounds: { minX: 0, maxX: 2000, minY: 0, maxY: 1200 },
      description: 'The historic red-brick gates of George Town yielding to dusty palmyra plains and roadside tea stalls.'
    },
    pichavaram_delta: {
      id: 'pichavaram_delta',
      name: 'Pichavaram Mangroves & Delta (பிச்சாவரம் அலையாத்திக்காடு)',
      phase: 2,
      baseTemp: 28,
      soilColor: '#434a36',
      grassColor: '#2b582b',
      skyDay: '#5e9496',
      skyNight: '#0a1618',
      unlocked: false,
      bounds: { minX: 2000, maxX: 4000, minY: 0, maxY: 1200 },
      description: 'Labyrinthine mangrove channels, dense stilt roots, and ancient Chola-era water sluice mechanisms.'
    },
    western_ghats: {
      id: 'western_ghats',
      name: 'Nilgiris & Western Ghats (நீலகிரி மேற்குத் தொடர்ச்சி மலை)',
      phase: 3,
      baseTemp: 13,
      soilColor: '#4d3d2c',
      grassColor: '#1d5a2d',
      skyDay: '#4a6b82',
      skyNight: '#060b14',
      unlocked: false,
      bounds: { minX: 4000, maxX: 6000, minY: 0, maxY: 1200 },
      description: 'Freezing mountain mist, cascading emerald tea estates, steep hairpin bends, and the lost eco-sanctuary.'
    }
  },

  landmarks: [
    // Phase 1 Landmarks
    {
      id: 'high_court_gates',
      name: 'Madras High Court Gate',
      tamilName: 'மதராஸ் உயர் நீதிமன்ற வாயில்',
      biome: 'chennai_plains',
      x: 250,
      y: 600,
      width: 140,
      height: 180,
      type: 'structure',
      lore: 'The grand Indo-Saracenic red-brick gates of George Town, Chennai. Built in 1892, its minarets and stained glass witnessed the missing mentor passing down the ancient blueprint before the Royal Enfield thief struck.',
      photoValue: 100,
      interactable: true,
      interactionPrompt: 'Inspect the Heist Site',
      icon: '🏛️'
    },
    {
      id: 'tea_kadai',
      name: "Murugan Annan's Tea Kadai",
      tamilName: 'முருகன் அண்ணன் டீக்கடை',
      biome: 'chennai_plains',
      x: 750,
      y: 520,
      width: 120,
      height: 90,
      type: 'hub',
      lore: 'The beating heart of roadside Tamil Nadu. Boiling brass samovar, freshly fried medu vadai, hung bananas, and newspaper debates. Murugan Annan knows every bike that zoomed past this morning.',
      photoValue: 80,
      interactable: true,
      interactionPrompt: 'Order Tea & Talk with Murugan',
      icon: '☕'
    },
    {
      id: 'panchayat_well',
      name: 'Old Panchayat Village Well',
      tamilName: 'பழைய பஞ்சாயத்து கிணறு',
      biome: 'chennai_plains',
      x: 1250,
      y: 680,
      width: 80,
      height: 80,
      type: 'water_source',
      lore: 'A centuries-old stone-lined ring well drawing cool, fresh subterranean groundwater. Replenishes your water canteen.',
      photoValue: 60,
      interactable: true,
      interactionPrompt: 'Refill Canteen',
      icon: '🪣'
    },
    {
      id: 'enfield_tracks_site',
      name: 'Muddy Enfield Tyre Skids',
      tamilName: 'ராயல் என்பீல்ட் டயர் தடம்',
      biome: 'chennai_plains',
      x: 480,
      y: 640,
      width: 100,
      height: 60,
      type: 'clue',
      lore: 'Deep grooved tire patterns stamped into the red clay during the sudden storm. The treads curve south-east directly toward the Pichavaram delta.',
      photoValue: 120,
      interactable: true,
      interactionPrompt: 'Take Tread Impression & Clue Note',
      icon: '🔍'
    },

    // Phase 1 Additional Real Tamil Nadu Heritage
    {
      id: 'chennai_auto',
      name: 'Madras Yellow-Black Auto-Rickshaw',
      tamilName: 'மதராஸ் ஆட்டோ ரிக்‌ஷா',
      biome: 'chennai_plains',
      x: 390,
      y: 570,
      width: 70,
      height: 60,
      type: 'culture',
      lore: 'The unmistakable spirit of Chennai streets! Painted in bright yellow and black with retro mud flaps reading "அம்மா ஆசிர்வாதம்" (Mother\'s Blessings). Driver Velu saw the Royal Enfield rider zoom past towards Parry\'s Corner.',
      photoValue: 75,
      interactable: true,
      interactionPrompt: 'Talk to Auto Driver Velu',
      icon: '🛺'
    },
    {
      id: 'elaneer_cart',
      name: 'Pazhavanthangal Tender Coconut Stall',
      tamilName: 'இளநீர் வண்டி',
      biome: 'chennai_plains',
      x: 1020,
      y: 590,
      width: 80,
      height: 70,
      type: 'water_source',
      lore: 'A roadside cart piled high with sweet, refreshing green Pollachi coconuts. Sliced open with a swift stroke of a curved iron aruval (sickle) to quench thirst and restore electrolytes under the sweltering sun.',
      photoValue: 65,
      interactable: true,
      interactionPrompt: 'Drink Sweet Elaneer (+45 Thirst)',
      icon: '🥥'
    },

    // Phase 3 Additional Western Ghats Real Heritage
    {
      id: 'toda_hut',
      name: 'Sacred Toda Tribal Mund (Barrel-Vault Hut)',
      tamilName: 'தோடா பழங்குடி மந்து',
      biome: 'western_ghats',
      x: 4720,
      y: 470,
      width: 110,
      height: 90,
      type: 'indigenous_culture',
      lore: 'A traditional Toda buffalo pastoralist shelter crafted from bent bamboo arches and woven rattan thatch. Featuring intricate geometric red-and-black Poothkuly embroidery patterns over a tiny stone entrance.',
      photoValue: 160,
      interactable: true,
      interactionPrompt: 'Inspect Toda Buffalo Carvings',
      icon: '🛖'
    },
    {
      id: 'kurinji_shola',
      name: 'Neelakurinji Shola Blossom Sanctuary',
      tamilName: 'நீலக்குறிஞ்சி சோலை',
      biome: 'western_ghats',
      x: 5250,
      y: 420,
      width: 95,
      height: 80,
      type: 'botanical_wonder',
      lore: 'The mystical purplish-blue Strobilanthes kunthiana that carpets the shola hillsides once every 12 years. Revered in ancient Sangam literature (Kurinjippattu) as the sacred flower of Lord Murugan.',
      photoValue: 180,
      interactable: true,
      interactionPrompt: 'Photograph Neelakurinji Blossoms',
      icon: '🪻'
    },

    // Phase 2 Landmarks
    {
      id: 'pichavaram_boat_dock',
      name: 'Mangrove Canoe Jetty',
      tamilName: 'பிச்சாவரம் படகுத்துறை',
      biome: 'pichavaram_delta',
      x: 2300,
      y: 650,
      width: 110,
      height: 70,
      type: 'dock',
      lore: 'Sturdy wooden catamarans moored among tangled Rhizophora stilt roots. Guides navigate through green canopy tunnels where tides alter waterways hourly.',
      photoValue: 90,
      interactable: true,
      interactionPrompt: 'Board Canoe',
      icon: '🛶'
    },
    {
      id: 'chola_waterwheel',
      name: 'Chola Hydro-Mechanism',
      tamilName: 'சோழர் கால நீர் சுழல் சக்கரம்',
      biome: 'pichavaram_delta',
      x: 3200,
      y: 500,
      width: 130,
      height: 130,
      type: 'puzzle',
      lore: 'A massive carved granite waterwheel dating to Rajendra Chola I. Aligning the carved lotus and tiger gears regulates the canal floodgates, draining the flooded passage to the Western Ghats.',
      photoValue: 150,
      interactable: true,
      interactionPrompt: 'Solve Gear Alignment Puzzle',
      icon: '⚙️'
    },

    // Phase 3 Landmarks
    {
      id: 'nilgiri_tea_factory',
      name: 'Heritage Valley Tea Outpost',
      tamilName: 'நீலகிரி தேயிலை பாசறை',
      biome: 'western_ghats',
      x: 4400,
      y: 450,
      width: 150,
      height: 100,
      type: 'shelter',
      lore: 'A cozy colonial-era stone cottage overlooking endless emerald stepped tea terraces. A crackling stone fireplace here can stave off mountain hypothermia.',
      photoValue: 110,
      interactable: true,
      interactionPrompt: 'Warm by Fireplace & Craft Gear',
      icon: '🏡'
    },
    {
      id: 'eco_sanctuary_portal',
      name: 'The Lost Underground Eco-Sanctuary',
      tamilName: 'மறைக்கப்பட்ட சூழல் புகலிடம்',
      biome: 'western_ghats',
      x: 5600,
      y: 520,
      width: 180,
      height: 190,
      type: 'mystery_goal',
      lore: 'The fabled subterranean biosphere engineered by ancient Tamil botanists and hydro-architects. Preserved untouched for centuries, guarded from the syndicate by your mentor.',
      photoValue: 250,
      interactable: true,
      interactionPrompt: 'Unlock Ancient Sanctuary Gate',
      icon: '🌿'
    }
  ],

  wildlife: [
    {
      id: 'jallikattu_bull',
      name: 'Escaped Kangayam Bull (வீரக் காளை)',
      biome: 'chennai_plains',
      x: 1550,
      y: 480,
      speed: 1.2,
      rarity: 'rare',
      lore: 'A magnificent black-and-grey Kangayam bull with sweeping curved horns. Escaped from Farmer Selvam during the morning storm.',
      photoValue: 130,
      icon: '🐂'
    },
    {
      id: 'palmyra_weaver',
      name: 'Baya Weaver Bird (தூக்கணாங்குருவி)',
      biome: 'chennai_plains',
      x: 880,
      y: 320,
      speed: 2.0,
      rarity: 'common',
      lore: 'Master architects of the avian world, weaving pendulous coconut-fiber nests high up in palmyra palms.',
      photoValue: 70,
      icon: '🦜'
    },
    {
      id: 'great_egret',
      name: 'Pichavaram White Egret (வெள்ளைக் கொக்கு)',
      biome: 'pichavaram_delta',
      x: 2750,
      y: 680,
      speed: 1.5,
      rarity: 'common',
      lore: 'Stalking the muddy delta shallows for brackish fish and mudskippers among mangrove aerial roots.',
      photoValue: 75,
      icon: '🦩'
    },
    {
      id: 'nilgiri_tahr',
      name: 'Nilgiri Tahr (வரையாடு)',
      biome: 'western_ghats',
      x: 4950,
      y: 350,
      speed: 1.0,
      rarity: 'legendary',
      lore: 'The endangered mountain ungulate endemic to the rocky crags of the Western Ghats. Its sure-footed leaps over misty precipices are legendary.',
      photoValue: 200,
      icon: '🐐'
    }
  ],

  trees: [
    // Generation parameters for palmyra, mangrove, and pine trees
    { type: 'palmyra', count: 45, xRange: [50, 1950], yRange: [100, 1100] },
    { type: 'banyan', count: 6, xRange: [200, 1800], yRange: [200, 1000] },
    { type: 'mangrove', count: 65, xRange: [2050, 3950], yRange: [150, 1100] },
    { type: 'pine', count: 50, xRange: [4050, 5950], yRange: [80, 1100] },
    { type: 'tea_bush', count: 90, xRange: [4100, 5800], yRange: [300, 1100] }
  ]
};
