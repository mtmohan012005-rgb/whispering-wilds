// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION NPC DATA
// Culturally Authentic Tamil Nadu NPCs, Daily Schedules, Waypoints & Dialogue
// ============================================================================

/**
 * NPC Occupations supported across regions:
 * - tea_shop_owner
 * - farmer
 * - fisher
 * - artisan
 * - tea_worker
 * - forest_guide
 * - shopkeeper
 * - temple_worker
 * 
 * NPC AI States:
 * SLEEPING, HOME, MORNING_ROUTINE, TRAVELING, WORKING, EATING,
 * RESTING, MARKET, COMMUNITY, TALKING, QUEST_INTERACTION, RETURNING_HOME
 */

const NPC_OCCUPATIONS = [
  'tea_shop_owner',
  'farmer',
  'fisher',
  'artisan',
  'tea_worker',
  'forest_guide',
  'shopkeeper',
  'temple_worker'
];

const NPC_REGIONS = [
  'Chennai / George Town',
  'Cauvery Delta',
  'Pichavaram',
  'Chettinad',
  'Thanjavur',
  'Mamallapuram',
  'Nilgiris / Western Ghats'
];

const CLOTHING_SETS = {
  everyday_veshti: {
    id: 'everyday_veshti',
    name: 'Everyday Cotton Veshti & Shirt',
    tamilName: 'பருத்தி வேட்டி & சட்டை',
    top: 'Crisp half-sleeve white cotton shirt',
    bottom: 'Traditional white cotton veshti with thin gold border',
    accessory: 'Folded thundu draped on shoulder',
    footwear: 'Open-toe leather sandals',
    colors: { shirt: 0xf5f6fa, veshti: 0xecf0f1, accent: 0xd4af37, skin: 0x8d5b4c }
  },
  village_workwear: {
    id: 'village_workwear',
    name: 'Practical Village Farmland Workwear',
    tamilName: 'கிராமப்புற வேலை ஆடை',
    top: 'Durable khadi work shirt / bare chest with thundu',
    bottom: 'Folded checkered lungi / short cotton dhoti',
    accessory: 'Twisted cotton turban towel against the sun',
    footwear: 'Tough rubber field sandals',
    colors: { shirt: 0x3d566e, veshti: 0x7f8c8d, accent: 0xe67e22, skin: 0x784435 }
  },
  heritage_textile: {
    id: 'heritage_textile',
    name: 'Heritage Handloom Textile Attire',
    tamilName: 'பாரம்பரிய கைத்தறி ஆடை',
    top: 'Fine handspun silk-cotton kurta / tailored blouse',
    bottom: 'Mayil-kan border pure veshti / Sungudi drape',
    accessory: 'Zari-bordered angavastram',
    footwear: 'Classic hand-stitched leather chappals',
    colors: { shirt: 0x78281f, veshti: 0xf9e79f, accent: 0xb7950b, skin: 0x935116 }
  },
  nilgiri_warmwear: {
    id: 'nilgiri_warmwear',
    name: 'Nilgiri Mountain Shola Warmwear',
    tamilName: 'நீலகிரி மலை கம்பளி ஆடை',
    top: 'Heavy hand-knit woolen cardigan over flannel shirt',
    bottom: 'Rugged dark wool cargo trousers',
    accessory: 'Woolen monkey-cap / knit muffler',
    footwear: 'Sturdy waterproof mountain trekking boots',
    colors: { shirt: 0x2c3e50, veshti: 0x34495e, accent: 0x95a5a6, skin: 0x874b3d }
  }
};

/**
 * Master NPC Production Registry
 */
const NPC_PRODUCTION_DATA = [
  // 1. Murugan Annan - Tea Stall Owner (Chennai / George Town)
  {
    id: 'murugan',
    name: 'Murugan Annan',
    tamilName: 'முருகன் அண்ணன்',
    occupation: 'tea_shop_owner',
    region: 'Chennai / George Town',
    homeLocation: { x: -225, z: -10, label: 'George Town Quarters' },
    workplace: { x: -220, z: -8, label: "Murugan's Roadside Tea Kadai" },
    clothingSet: 'everyday_veshti',
    modelPath: 'assets/characters/npcs/murugan.glb',
    schedule: [
      { startMinute: 270, endMinute: 330, state: 'MORNING_ROUTINE', label: 'Boiling first water & grinding fresh ginger' },    // 04:30 - 05:30
      { startMinute: 330, endMinute: 420, state: 'WORKING', label: 'Frothing morning ginger-cardamom tea for early court lawyers' }, // 05:30 - 07:00
      { startMinute: 420, endMinute: 720, state: 'WORKING', label: 'Peak morning crowd & vadai counter rush' },                     // 07:00 - 12:00
      { startMinute: 720, endMinute: 780, state: 'EATING', label: 'Lunch: Hot parotta & spicy salna' },                             // 12:00 - 13:00
      { startMinute: 780, endMinute: 870, state: 'RESTING', label: 'Siesta on wooden bench under neem tree' },                      // 13:00 - 14:30
      { startMinute: 870, endMinute: 1140, state: 'WORKING', label: 'Evening cutting chai & samosa rush' },                         // 14:30 - 19:00
      { startMinute: 1140, endMinute: 1230, state: 'COMMUNITY', label: 'Evening tea gossip with auto drivers & newspaper reading' }, // 19:00 - 20:30
      { startMinute: 1230, endMinute: 1290, state: 'RETURNING_HOME', label: 'Counting coin collections & locking brass kettle' },   // 20:30 - 21:30
      { startMinute: 1290, endMinute: 1440, state: 'SLEEPING', label: 'Asleep in quarters' },                                       // 21:30 - 24:00
      { startMinute: 0, endMinute: 270, state: 'SLEEPING', label: 'Asleep in quarters' }                                            // 00:00 - 04:30
    ],
    route: [
      { x: -225, z: -10, name: 'Quarters Verandah', dwellMinutes: 20 },
      { x: -220, z: -8, name: 'Tea Kadai Stove', dwellMinutes: 300 },
      { x: -214, z: -6, name: 'Neem Tree Bench', dwellMinutes: 60 },
      { x: -220, z: -8, name: 'Tea Kadai Evening Counter', dwellMinutes: 270 },
      { x: -225, z: -10, name: 'Home Bed', dwellMinutes: 360 }
    ],
    dialogue: {
      greeting: {
        ta: 'வாங்க தம்பி! என்ன இந்த அடைமழையில George Town பக்கம்? சூடா ஒரு இஞ்சி டீ போடவா?',
        en: 'Welcome thambi! What brings you to George Town in this downpour? Shall I pour you a piping hot ginger tea?'
      },
      work: {
        ta: 'டீ தூள் கொதிக்குது தம்பி! ஒரு 2 நிமிஷம் இருங்க, நுரை பொங்க ஸ்ட்ராங்கா ஆத்தி தர்றேன்.',
        en: 'The tea decoction is brewing! Give me two minutes, I will froth it up strong and foaming.'
      },
      night: {
        ta: 'கடை மூடப் போறேன். அந்த Royal Enfield வண்டிக்காரன் மேற்கு நோக்கிதான் கிளம்பி போனான், பாத்து போங்க!',
        en: 'Closing the stall soon. That Royal Enfield rider sped off towards the west, watch your step!'
      },
      quest: {
        ta: 'நீங்க கேக்குற பழைய வரைபடம்... ஒரு பெரிய கம்பெனிக்காரன் ஆளுங்க அதைத்தான் தேடி இங்க சுத்திட்டு இருந்தாங்க!',
        en: 'The old blueprint you speak of... corporate syndicate goons were scouting around here looking for that exact document!'
      }
    },
    questHooks: ['main_prologue', 'tea_decoction_recipe']
  },

  // 2. Farmer Selvam - Paddy Farmer (Cauvery Delta)
  {
    id: 'selvam',
    name: 'Farmer Selvam',
    tamilName: 'விவசாயி செல்வம்',
    occupation: 'farmer',
    region: 'Cauvery Delta',
    homeLocation: { x: -40, z: -15, label: 'Kallanai Hamlet Homestead' },
    workplace: { x: -25, z: 12, label: 'Kuruvai Paddy Fields & Canal Sluice' },
    clothingSet: 'village_workwear',
    modelPath: 'assets/characters/npcs/selvam.glb',
    schedule: [
      { startMinute: 300, endMinute: 360, state: 'MORNING_ROUTINE', label: 'Feeding Kangayam bulls & sharpening ploughshare' }, // 05:00 - 06:00
      { startMinute: 360, endMinute: 420, state: 'TRAVELING', label: 'Walking along irrigation canal dyke' },                     // 06:00 - 07:00
      { startMinute: 420, endMinute: 720, state: 'WORKING', label: 'Inspecting Kuruvai paddy crops & sluice water level' },        // 07:00 - 12:00
      { startMinute: 720, endMinute: 780, state: 'EATING', label: 'Cold fermented rice (பழைய சோறு) & shallots under banyan' },   // 12:00 - 13:00
      { startMinute: 780, endMinute: 840, state: 'RESTING', label: 'Resting by canal watchtower' },                              // 13:00 - 14:00
      { startMinute: 840, endMinute: 1080, state: 'WORKING', label: 'Checking Chola sluice gates & field drainage' },             // 14:00 - 18:00
      { startMinute: 1080, endMinute: 1170, state: 'COMMUNITY', label: 'Chatting with village elders by Panchayat well' },        // 18:00 - 19:30
      { startMinute: 1170, endMinute: 1230, state: 'RETURNING_HOME', label: 'Leading cattle back to the shed' },                  // 19:30 - 20:30
      { startMinute: 1230, endMinute: 1440, state: 'SLEEPING', label: 'Sleeping at homestead' },                                 // 20:30 - 24:00
      { startMinute: 0, endMinute: 300, state: 'SLEEPING', label: 'Sleeping at homestead' }                                      // 00:00 - 05:00
    ],
    route: [
      { x: -40, z: -15, name: 'Farmhouse Cattle Shed', dwellMinutes: 45 },
      { x: -32, z: -2, name: 'Canal Walking Path', dwellMinutes: 20 },
      { x: -25, z: 12, name: 'Paddy Field Inflow Sluice', dwellMinutes: 240 },
      { x: -18, z: 22, name: 'Ancient Stone Water Gate', dwellMinutes: 180 },
      { x: -35, z: -5, name: 'Panchayat Well Platform', dwellMinutes: 60 },
      { x: -40, z: -15, name: 'Farmhouse', dwellMinutes: 300 }
    ],
    dialogue: {
      greeting: {
        ta: 'வணக்கம் தம்பி! காவேரி தண்ணி வர்ற நேரம்... இந்த செம்மண் நிலத்துல பயிர் செழிப்பா வளருது.',
        en: 'Vanakkam thambi! Cauvery water is flowing... the crops thrive in this rich delta soil.'
      },
      work: {
        ta: 'சோழர் காலத்து மடை இது! சரியா திருப்பி விடலைன்னா வயல்ல தண்ணி தேங்கிடும். கொஞ்சம் பாத்து நில்லுங்க.',
        en: 'This is a millennium-old Chola sluice gate! If not turned right, fields will flood. Mind your footing.'
      },
      night: {
        ta: 'இருட்டிடுச்சு தம்பி. மாடுகள கொட்டத்துல கட்டணும். வழியில நரி, காட்டுப்பன்றி நடமாட்டம் இருக்கும், ஜாக்கிரதை!',
        en: 'Darkness has fallen. I must tether the cattle. Watch out for boars and jackals along the canal tracks!'
      },
      quest: {
        ta: 'அந்த மோட்டார் வண்டி சத்தம் இங்கேயும் கேட்டுச்சு! பிச்சாவரம் சதுப்புநிலக் கால்வாய் வழியா வேகமா போனாங்க.',
        en: 'We heard that heavy motorcycle rumble! They sped through the Pichavaram mangrove canal trail.'
      }
    },
    questHooks: ['side_bull', 'delta_irrigation', 'solve_waterwheel']
  },

  // 3. Meenakshi Ammal - Master Artisan (Thanjavur)
  {
    id: 'meenakshi',
    name: 'Meenakshi Ammal',
    tamilName: 'மீனாட்சி அம்மாள்',
    occupation: 'artisan',
    region: 'Thanjavur',
    homeLocation: { x: 20, z: -18, label: 'Artisan Lane Residence' },
    workplace: { x: 35, z: -5, label: 'Bronze Casting & Tanjore Art Workshop' },
    clothingSet: 'heritage_textile',
    modelPath: 'assets/characters/npcs/meenakshi.glb',
    schedule: [
      { startMinute: 360, endMinute: 420, state: 'MORNING_ROUTINE', label: 'Morning kolam & courtyard pooja' },                  // 06:00 - 07:00
      { startMinute: 420, endMinute: 480, state: 'TRAVELING', label: 'Walking to heritage workshop' },                             // 07:00 - 08:00
      { startMinute: 480, endMinute: 750, state: 'WORKING', label: 'Applying 22k gold foil & semi-precious stones to relief art' }, // 08:00 - 12:30
      { startMinute: 750, endMinute: 810, state: 'EATING', label: 'Traditional plantain leaf meal' },                             // 12:30 - 13:30
      { startMinute: 810, endMinute: 1020, state: 'WORKING', label: 'Chiseling traditional bronze icons (பஞ்சலோக விக்கிரகம்)' },    // 13:30 - 17:00
      { startMinute: 1020, endMinute: 1140, state: 'MARKET', label: 'Delivering finished icons to Temple Bazaar' },               // 17:00 - 19:00
      { startMinute: 1140, endMinute: 1200, state: 'COMMUNITY', label: 'Classical veena recital at temple mandapam' },             // 19:00 - 20:00
      { startMinute: 1200, endMinute: 1260, state: 'RETURNING_HOME', label: 'Walking home through temple chariot street' },         // 20:00 - 21:00
      { startMinute: 1260, endMinute: 1440, state: 'SLEEPING', label: 'Sleeping at residence' },                                  // 21:00 - 24:00
      { startMinute: 0, endMinute: 360, state: 'SLEEPING', label: 'Sleeping at residence' }                                       // 00:00 - 06:00
    ],
    route: [
      { x: 20, z: -18, name: 'Home Courtyard', dwellMinutes: 40 },
      { x: 35, z: -5, name: 'Artisan Workshop Floor', dwellMinutes: 260 },
      { x: 45, z: -12, name: 'Temple Bazaar Stall', dwellMinutes: 90 },
      { x: 38, z: -22, name: 'Big Temple Mandapam Corridor', dwellMinutes: 60 },
      { x: 20, z: -18, name: 'Residence', dwellMinutes: 360 }
    ],
    dialogue: {
      greeting: {
        ta: 'வணக்கம் தம்பி. இது தஞ்சாவூர் கலைக்கூடம். ஆயிரம் ஆண்டு பாரம்பரியம் கொண்ட பஞ்சலோக சிலைகளை இங்க வார்க்கிறோம்.',
        en: 'Vanakkam thambi. Welcome to the Thanjavur atelier. Here we cast sacred five-metal bronze icons handed down for a thousand years.'
      },
      work: {
        ta: 'இந்த செப்புத் தகட்டுல நுணுக்கமான சோழர் முத்திரைகளை செதுக்கிட்டு இருக்கேன். பொறுமையும் கவனமும் அவசியம்.',
        en: 'I am carving intricate Chola dynastic emblems on this brass plate. Patience and devotion are essential.'
      },
      night: {
        ta: 'பட்டறையை பூட்டிட்டேன் தம்பி. கோவில் மணியோசை கேட்குது. நாளைக்கு காலையில வாங்க, விரிவாக பேசலாம்.',
        en: 'The workshop is locked for the night. Hear the temple bells chiming. Come back at dawn and we shall converse.'
      },
      quest: {
        ta: 'நீங்க வச்சிருக்கிற வரைபடத்துல உள்ள குறியீடு சோழர் காலத்து நீர்சுழல் சூத்திரம்! அதை பிச்சாவரத்து நீர்சக்கரத்தில பொருத்தினா மலைப்பாதை திறக்கும்.',
        en: 'The cipher in your blueprint is an ancient Chola hydraulic formula! Align it with the Pichavaram waterwheel to unlock the mountain pass.'
      }
    },
    questHooks: ['main_delta', 'chola_waterwheel', 'cultural_artisan_lore']
  },

  // 4. Kandasamy - Wetland Catamaran Fisher (Pichavaram)
  {
    id: 'kandasamy',
    name: 'Kandasamy',
    tamilName: 'கந்தசாமி',
    occupation: 'fisher',
    region: 'Pichavaram',
    homeLocation: { x: -75, z: 25, label: 'Pichavaram Fisher Hamlet' },
    workplace: { x: -60, z: 32, label: 'Mangrove Jetty & Catamaran Landing' },
    clothingSet: 'village_workwear',
    modelPath: 'assets/characters/npcs/fisher.glb',
    schedule: [
      { startMinute: 240, endMinute: 300, state: 'MORNING_ROUTINE', label: 'Inspecting nylon cast nets & oiling boat oar' },       // 04:00 - 05:00
      { startMinute: 300, endMinute: 660, state: 'WORKING', label: 'Rowing catamaran through dense Rhizophora mangrove root canals' }, // 05:00 - 11:00
      { startMinute: 660, endMinute: 750, state: 'EATING', label: 'Eating freshly cooked crab curry with boiled rice at jetty' },  // 11:00 - 12:30
      { startMinute: 750, endMinute: 870, state: 'RESTING', label: 'Repairing torn fishing nets under palm thatch shed' },         // 12:30 - 14:30
      { startMinute: 870, endMinute: 1050, state: 'WORKING', label: 'Casting crab traps in low-tide mangrove lagoons' },           // 14:30 - 17:30
      { startMinute: 1050, endMinute: 1140, state: 'MARKET', label: 'Selling tiger prawns and delta mullet at coastal dock' },      // 17:30 - 19:00
      { startMinute: 1140, endMinute: 1200, state: 'RETURNING_HOME', label: 'Tethering catamaran to mangrove stilt roots' },        // 19:00 - 20:00
      { startMinute: 1200, endMinute: 1440, state: 'SLEEPING', label: 'Sleeping at seaside hut' },                                 // 20:00 - 24:00
      { startMinute: 0, endMinute: 240, state: 'SLEEPING', label: 'Sleeping at seaside hut' }                                      // 00:00 - 04:00
    ],
    route: [
      { x: -75, z: 25, name: 'Fisher Hamlet Cottage', dwellMinutes: 40 },
      { x: -60, z: 32, name: 'Canal Wooden Dock', dwellMinutes: 120 },
      { x: -50, z: 42, name: 'Mangrove Lagoon Channel', dwellMinutes: 200 },
      { x: -62, z: 30, name: 'Fish Landing Depot', dwellMinutes: 90 },
      { x: -75, z: 25, name: 'Cottage Bed', dwellMinutes: 300 }
    ],
    dialogue: {
      greeting: {
        ta: 'ஏலே தம்பி! பிச்சாவரம் சதுப்புநிலத்துக்குள்ள தனியா போகாதீங்க. அலை ஏறுனா வழி தெரியாம சிக்கிக்குவீங்க!',
        en: 'Heads up thambi! Do not venture into the Pichavaram mangroves alone. When the tide rises, the waterways turn into a maze!'
      },
      work: {
        ta: 'இந்த வேர்கள் தண்ணீருக்குள்ள பிணைஞ்சு கிடக்குது. சுண்ட நண்டு, மடவை மீன் எல்லாம் இங்கதான் தங்கும்.',
        en: 'These aerial mangrove roots are woven deep beneath the brine. Mud crabs and mullet breed in these protected creeks.'
      },
      night: {
        ta: 'இரவுல அலையாத்திக் காடு பயங்கர அமைதியா இருக்கும். ஆனா அந்த புல்லட் வண்டி ஆளுங்க சதுப்புநிலப் பாதையில ஏதோ ஒளிச்சு வச்சாங்க!',
        en: 'The mangroves are dead silent at night. But those men on the Royal Enfield stashed something deep inside the tidal canal!'
      },
      quest: {
        ta: 'பழைய கல் சக்கரம் இருக்கிற இடத்துக்கு போகணுமா? படகை கால்வாய் வழியா நேரா தெற்கு முகமா ஓட்டிட்டு போங்க.',
        en: 'Looking for the ancient granite waterwheel? Steer your boat southwards straight along the primary canal.'
      }
    },
    questHooks: ['mangrove_navigation', 'stolen_records_trail', 'solve_waterwheel']
  },

  // 5. Chinnasamy - Nilgiri Tea Estate Worker (Nilgiris / Western Ghats)
  {
    id: 'chinnasamy',
    name: 'Chinnasamy',
    tamilName: 'சின்னசாமி',
    occupation: 'tea_worker',
    region: 'Nilgiris / Western Ghats',
    homeLocation: { x: 190, z: -20, label: 'Tea Estate Line Quarters' },
    workplace: { x: 215, z: -8, label: 'Steep High-Grown Tea Terraces' },
    clothingSet: 'nilgiri_warmwear',
    modelPath: 'assets/characters/npcs/farmer.glb',
    schedule: [
      { startMinute: 330, endMinute: 390, state: 'MORNING_ROUTINE', label: 'Drinking boiling black tea against zero-degree morning frost' }, // 05:30 - 06:30
      { startMinute: 390, endMinute: 450, state: 'TRAVELING', label: 'Climbing mist-veiled mountain terrace path' },                      // 06:30 - 07:30
      { startMinute: 450, endMinute: 720, state: 'WORKING', label: 'Plucking golden-tip tea buds into bamboo back-basket' },              // 07:30 - 12:00
      { startMinute: 720, endMinute: 780, state: 'EATING', label: 'Hot ragi mudde & dried fish sambar at field shelter' },                 // 12:00 - 13:00
      { startMinute: 780, endMinute: 990, state: 'WORKING', label: 'Afternoon tea pluck on rocky upper slope' },                          // 13:00 - 16:30
      { startMinute: 990, endMinute: 1080, state: 'MARKET', label: 'Weighing harvested green leaf sacks at stone factory shed' },         // 16:30 - 18:00
      { startMinute: 1080, endMinute: 1170, state: 'COMMUNITY', label: 'Sitting around wood-fire hearth at plantation canteen' },          // 18:00 - 19:30
      { startMinute: 1170, endMinute: 1230, state: 'RETURNING_HOME', label: 'Walking back to line house wrapped in kambali' },             // 19:30 - 20:30
      { startMinute: 1230, endMinute: 1440, state: 'SLEEPING', label: 'Sleeping beside warm stone hearth' },                               // 20:30 - 24:00
      { startMinute: 0, endMinute: 330, state: 'SLEEPING', label: 'Sleeping beside warm stone hearth' }                                    // 00:00 - 05:30
    ],
    route: [
      { x: 190, z: -20, name: 'Line Quarters Doorstep', dwellMinutes: 30 },
      { x: 202, z: -14, name: 'Tea Plantation Incline Trail', dwellMinutes: 25 },
      { x: 215, z: -8, name: 'Upper Tea Terrace Ridge', dwellMinutes: 240 },
      { x: 228, z: -2, name: 'Stone Leaf-Weighing Shed', dwellMinutes: 80 },
      { x: 190, z: -20, name: 'Line Quarters Hearth', dwellMinutes: 360 }
    ],
    dialogue: {
      greeting: {
        ta: 'அப்பாடி... என்ன பனி அடிக்கிது! கம்பளி ஆடை போடாம இந்த மலையில ஒரு மணி நேரம் கூட நிக்க முடியாதுங்க.',
        en: 'Brrr... what biting frost! Without thick woolen warmwear, you cannot survive an hour on these heights.'
      },
      work: {
        ta: 'ரெண்டு இலை, ஒரு மொட்டு... இதான் நீலகிரி தேயிலையோட ரகசியம். விரல் மரத்து போகுது, ஆனாலும் பறிக்கணும்.',
        en: 'Two leaves and a bud... that is the sacred secret of Nilgiri orthodox tea. Fingers numb, but the harvest waits for none.'
      },
      night: {
        ta: 'சாயங்காலம் ஆனா யானை கூட்டம் கீழ் பள்ளத்தாக்குல இருந்து மேல ஏறி வரும். அடுப்பு வெளிச்சத்தை விட்டு தூரம் போயிடாதீங்க.',
        en: 'At twilight, elephant herds migrate up from the lower valleys. Do not wander far from the campfire hearth.'
      },
      quest: {
        ta: 'மேலே சோலை காட்டுல ஒரு பழைய குகை வாசல் இருக்கு. அங்கதான் அந்த வெளிநாட்டு கம்பெனி ஆளுங்க ரகசியமா நோட்டம் விட்டுட்டு போனாங்க.',
        en: 'Up in the pristine shola forest lies an ancient portal entrance. Syndicate agents were scouting around that sacred site!'
      }
    },
    questHooks: ['nilgiri_tea_cold_survival', 'western_ghats_path', 'tea_worker_intel']
  },

  // 6. Karthik - Nilgiri Wilderness Trekking Guide (Nilgiris / Western Ghats)
  {
    id: 'karthik',
    name: 'Karthik',
    tamilName: 'கார்த்திக் (மலை வழிகாட்டி)',
    occupation: 'forest_guide',
    region: 'Nilgiris / Western Ghats',
    homeLocation: { x: 240, z: 15, label: 'Forest Ranger Outpost' },
    workplace: { x: 255, z: 28, label: 'Upper Shola Reserve & Toda Mund Trail' },
    clothingSet: 'nilgiri_warmwear',
    modelPath: 'assets/characters/npcs/forest-guide.glb',
    schedule: [
      { startMinute: 300, endMinute: 360, state: 'MORNING_ROUTINE', label: 'Checking binoculars, topographical compass & VHF radio' }, // 05:00 - 06:00
      { startMinute: 360, endMinute: 510, state: 'TRAVELING', label: 'Patrolling ridgeline border for wildlife movements' },           // 06:00 - 08:30
      { startMinute: 510, endMinute: 780, state: 'WORKING', label: 'Guiding expeditioners along indigenous Toda Mund path' },          // 08:30 - 13:00
      { startMinute: 780, endMinute: 840, state: 'EATING', label: 'Packed dry fruits & boiled tea by Shola stream' },                 // 13:00 - 14:00
      { startMinute: 840, endMinute: 1050, state: 'WORKING', label: 'Tracking endangered Nilgiri Tahr herds on granite precipice' },     // 14:00 - 17:30
      { startMinute: 1050, endMinute: 1170, state: 'COMMUNITY', label: 'Reporting sanctuary trail conditions to Toda tribal elders' }, // 17:30 - 19:30
      { startMinute: 1170, endMinute: 1260, state: 'RETURNING_HOME', label: 'Descending back to outpost with storm warning' },       // 19:30 - 21:00
      { startMinute: 1260, endMinute: 1440, state: 'SLEEPING', label: 'Sleeping at ranger station' },                                 // 21:00 - 24:00
      { startMinute: 0, endMinute: 300, state: 'SLEEPING', label: 'Sleeping at ranger station' }                                      // 00:00 - 05:00
    ],
    route: [
      { x: 240, z: 15, name: 'Ranger Station Gate', dwellMinutes: 30 },
      { x: 248, z: 20, name: 'Sacred Toda Buffalo Mund', dwellMinutes: 90 },
      { x: 255, z: 28, name: 'Neelakurinji High Shola Ridge', dwellMinutes: 180 },
      { x: 262, z: 35, name: 'Granite Precipice (Tahr Viewpoint)', dwellMinutes: 120 },
      { x: 240, z: 15, name: 'Ranger Station Bunk', dwellMinutes: 360 }
    ],
    dialogue: {
      greeting: {
        ta: 'வணக்கம்! நான் கார்த்திக். இந்த மேற்குத் தொடர்ச்சி மலைப்பாதைகளை என் உள்ளங்கை போல அறிவேன். கவனமா வாங்க.',
        en: 'Vanakkam! I am Karthik. I know these Western Ghats mountain trails like the back of my hand. Stay close.'
      },
      work: {
        ta: 'அதோ பாருங்க, அந்த செங்குத்தான பாறை மேல நீலகிரி வரையாடு (Nilgiri Tahr) நிக்குது! சத்தம் போடாம கேமராவுல பதிவு பண்ணுங்க.',
        en: 'Look over there, perched on that vertical crag is the endangered Nilgiri Tahr! Steady your camera quietly.'
      },
      night: {
        ta: 'இரவு நேரத்துல மலையில பனிமூட்டம் கண்ணை மறைக்கும். வெளிச்சமும் கூடாரமும் இல்லாம ஒரு அடி கூட எடுத்து வைக்காதீங்க.',
        en: 'At night, freezing fog blinds all navigation. Never take a single step forward without a lantern and tent.'
      },
      quest: {
        ta: 'பசும் தடம் (Pasumai Thadam) சுற்றுச்சூழல் குகை... அது தொன்மையான சோழர் காலப் பொக்கிஷம். அதை அழிக்க நினைக்கும் கும்பலை நாம் தடுத்தே ஆகணும்!',
        en: 'Pasumai Thadam eco-sanctuary... it is an ancient Chola ecological marvel. We must stop the syndicate before they breach it!'
      }
    },
    questHooks: ['main_ghats', 'photo_tahr', 'unlock_portal']
  },

  // 7. Alagappan Chettiar - Heritage Merchant & Antique Dealer (Chettinad)
  {
    id: 'alagappan',
    name: 'Alagappan Chettiar',
    tamilName: 'அழகப்பன் செட்டியார்',
    occupation: 'shopkeeper',
    region: 'Chettinad',
    homeLocation: { x: 80, z: -35, label: 'Aayiram Jannal Mansion (ஆயிரம் ஜன்னல் வீடு)' },
    workplace: { x: 95, z: -25, label: 'Heritage Spice & Antique Emporium' },
    clothingSet: 'everyday_veshti',
    modelPath: 'assets/characters/npcs/artisan.glb',
    schedule: [
      { startMinute: 360, endMinute: 420, state: 'MORNING_ROUTINE', label: 'Drinking filter coffee in Belgian glass courtyard' },     // 06:00 - 07:00
      { startMinute: 420, endMinute: 480, state: 'TRAVELING', label: 'Strolling through red-gravel mansion streets' },               // 07:00 - 08:00
      { startMinute: 480, endMinute: 780, state: 'WORKING', label: 'Examining Ceylon cinnamon, cloves & antique brass lamps' },     // 08:00 - 13:00
      { startMinute: 780, endMinute: 840, state: 'EATING', label: 'Royal Chettinad feast: Uppu kari & seeraga samba rice' },        // 13:00 - 14:00
      { startMinute: 840, endMinute: 960, state: 'RESTING', label: 'Afternoon rest on carved teakwood swing' },                     // 14:00 - 16:00
      { startMinute: 960, endMinute: 1110, state: 'WORKING', label: 'Trading heritage handlooms & Burma lacquerware' },              // 16:00 - 18:30
      { startMinute: 1110, endMinute: 1200, state: 'COMMUNITY', label: 'Evening discussions on mansion thinnai with visiting merchants' }, // 18:30 - 20:00
      { startMinute: 1200, endMinute: 1260, state: 'RETURNING_HOME', label: 'Locking double-door teak vaults with iron keys' },     // 20:00 - 21:00
      { startMinute: 1260, endMinute: 1440, state: 'SLEEPING', label: 'Sleeping in Athangudi tiled chamber' },                      // 21:00 - 24:00
      { startMinute: 0, endMinute: 360, state: 'SLEEPING', label: 'Sleeping in Athangudi tiled chamber' }                           // 00:00 - 06:00
    ],
    route: [
      { x: 80, z: -35, name: 'Chettinad Mansion Courtyard', dwellMinutes: 45 },
      { x: 95, z: -25, name: 'Antique Emporium Front Desk', dwellMinutes: 260 },
      { x: 105, z: -18, name: 'Village Spice Trading Square', dwellMinutes: 80 },
      { x: 85, z: -30, name: 'Mansion Thinnai Verandah', dwellMinutes: 75 },
      { x: 80, z: -35, name: 'Master Chamber', dwellMinutes: 360 }
    ],
    dialogue: {
      greeting: {
        ta: 'வாங்கோ தம்பி வாங்கோ! செட்டிநாட்டு பூமிக்கு உங்களை வரவேற்கிறோம். எங்கள் பர்மா தேக்கு வாசல்படிகளை பாத்தீங்களா?',
        en: 'Vango thambi vango! Welcome to the storied soil of Chettinad. Have you admired our carved Burma teakwood archways?'
      },
      work: {
        ta: 'பழங்கால ஆத்தங்குடி தரைக்கல்லும், பித்தளை விளக்குகளும் இங்கதான் கிடைக்கும். நாணயம் கொடுத்து என்ன வேணாலும் மாத்திக்கலாம்.',
        en: 'Authentic Athangudi tiles and heritage brass lamps are curated here. Trade your coins for fine craftsmanship.'
      },
      night: {
        ta: 'இரவுல இந்த அரண்மனை தெருக்கள்ல நடக்கும்போது செட்டிநாட்டு சமையல் வாசனை ஊரையே தூக்கும். நல்லா ஓய்வெடுங்க.',
        en: 'Walking these mansion lanes at night, the aroma of roasted Chettinad spices fills the breeze. Rest well.'
      },
      quest: {
        ta: 'நீங்க தேடுற அந்த நூறாண்டு பழைமையான நீர்வழி வரைபடம்... எங்க பரம்பரை வர்த்தகப் புத்தகத்திலயும் அதைப்பத்தின குறிப்பு இருக்கு!',
        en: 'That century-old hydraulic blueprint you seek... our ancestral merchant ledgers hold references to its engineering marvel!'
      }
    },
    questHooks: ['chettinad_antiques', 'architectural_blueprint', 'spice_trade']
  },

  // 8. Sundara Sthapathi - Temple Sculptor & Stone Artisan (Mamallapuram)
  {
    id: 'sundaram',
    name: 'Sundara Sthapathi',
    tamilName: 'சுந்தர ஸ்தபதி',
    occupation: 'temple_worker',
    region: 'Mamallapuram',
    homeLocation: { x: -160, z: -40, label: 'Sculptor Guild Quarter' },
    workplace: { x: -145, z: -30, label: 'Granite Carving Yard & Shore Sanctuary' },
    clothingSet: 'heritage_textile',
    modelPath: 'assets/characters/npcs/artisan.glb',
    schedule: [
      { startMinute: 315, endMinute: 360, state: 'MORNING_ROUTINE', label: 'Sun salutation by Bay of Bengal waves' },               // 05:15 - 06:00
      { startMinute: 360, endMinute: 420, state: 'TRAVELING', label: 'Walking to monolithic granite stone yard' },                  // 06:00 - 07:00
      { startMinute: 420, endMinute: 720, state: 'WORKING', label: 'Chiseling monolithic ratha pillars with hammer and punch' },     // 07:00 - 12:00
      { startMinute: 720, endMinute: 780, state: 'EATING', label: 'Drinking tender coconut water and curd rice by coastal rocks' }, // 12:00 - 13:00
      { startMinute: 780, endMinute: 1020, state: 'WORKING', label: 'Carving relief waves and mythical yali guardians' },            // 13:00 - 17:00
      { startMinute: 1020, endMinute: 1110, state: 'MARKET', label: 'Inspecting newly quarried raw granite slabs from Chengalpattu' }, // 17:00 - 18:30
      { startMinute: 1110, endMinute: 1200, state: 'COMMUNITY', label: 'Sunset discussion with young sculptor apprentices' },        // 18:30 - 20:00
      { startMinute: 1200, endMinute: 1260, state: 'RETURNING_HOME', label: 'Cleaning stone dust and returning to guild house' },    // 20:00 - 21:00
      { startMinute: 1260, endMinute: 1440, state: 'SLEEPING', label: 'Sleeping at guild quarters' },                                // 21:00 - 24:00
      { startMinute: 0, endMinute: 315, state: 'SLEEPING', label: 'Sleeping at guild quarters' }                                    // 00:00 - 05:15
    ],
    route: [
      { x: -160, z: -40, name: 'Guild Quarters Gate', dwellMinutes: 30 },
      { x: -145, z: -30, name: 'Granite Chisel Workstation', dwellMinutes: 280 },
      { x: -135, z: -22, name: 'Shore Temple Bas-Relief Wall', dwellMinutes: 90 },
      { x: -152, z: -35, name: 'Sculptor Assembly Platform', dwellMinutes: 60 },
      { x: -160, z: -40, name: 'Guild House Bed', dwellMinutes: 360 }
    ],
    dialogue: {
      greeting: {
        ta: 'வணக்கம் ஐயா. பல்லவ காலத்து உளி ஓசை இன்னும் இந்த கடற்கரை மணல்ல எதிரொலிக்குது பாத்தீங்களா?',
        en: 'Vanakkam sir. The rhythmic chisel taps of the Pallava era still echo across these coastal sands, do you hear?'
      },
      work: {
        ta: 'கருங்கல்ல செதுக்கும்போது ஒரு பிசிறு கூட போகக்கூடாது. ஒவ்வொரு கல்லுக்குள்ளும் ஒரு சிற்பம் மறைஞ்சிருக்கு.',
        en: 'When carving hard granite, not a millimeter must go astray. Within every raw rock, a divine sculpture lies hidden.'
      },
      night: {
        ta: 'கடல் காற்று வீசுது. இரவில உப்புக்காற்று சிற்பங்களை மெல்ல அரிக்காம இருக்க மூலிகை பூச்சு பூசணும்.',
        en: 'The sea breeze howls. At night, we apply herbal coatings so the ocean salt does not erode ancient friezes.'
      },
      quest: {
        ta: 'சோழர் கால நீர் மேலாண்மை அமைப்பு மாமல்லபுரக் கடற்கரையில தொடங்கி மேற்குத் தொடர்ச்சி மலை வரை ஒரு காலத்தில் நீண்டிருந்தது!',
        en: 'The legendary Chola hydro-engineering network once extended from the sea shore all the way inland to the Western Ghats!'
      }
    },
    questHooks: ['monolithic_carving', 'ancient_stone_aqueduct', 'coastal_chola_ruins']
  }
];

// Helper to look up an NPC profile by ID
function getNPCProductionConfig(npcId) {
  return NPC_PRODUCTION_DATA.find(npc => npc.id === npcId) || null;
}

// Export to window for global browser and module accessibility
if (typeof window !== 'undefined') {
  window.NPC_OCCUPATIONS = NPC_OCCUPATIONS;
  window.NPC_REGIONS = NPC_REGIONS;
  window.CLOTHING_SETS = CLOTHING_SETS;
  window.NPC_PRODUCTION_DATA = NPC_PRODUCTION_DATA;
  window.getNPCProductionConfig = getNPCProductionConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    NPC_OCCUPATIONS,
    NPC_REGIONS,
    CLOTHING_SETS,
    NPC_PRODUCTION_DATA,
    getNPCProductionConfig
  };
}
