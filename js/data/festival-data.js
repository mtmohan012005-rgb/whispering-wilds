/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Festival System Data & Dynamic Lifecycle Configurations
 * Authentic regional celebration calendars, multi-phase world transitions,
 * decoration assets, dynamic lighting, audio atmospheres, and market adjustments.
 */

window.FESTIVAL_DEFINITIONS = [
  // 1. Thai Pongal Harvest Festival (தைப்பொங்கல் திருநாள்)
  {
    id: 'festival_pongal',
    name: 'Thai Pongal Harvest Festival',
    tamilName: 'தைப்பொங்கல் அறுவடைத் திருநாள்',
    regions: ['CAUVERY_DELTA', 'CHETTINAD', 'THANJAVUR'],
    season: 'HARVEST_WINTER', // Mid-January harvest period
    durationHours: 72,        // 3-day cycle: Bhogi, Surya Pongal, Maattu Pongal
    phases: {
      PREPARATION: {
        hourStart: 0,
        hourEnd: 18,
        description: 'Homes being lime-washed and swept; sugarcane stacks unloaded from bullock carts at village squares.',
        decorations: ['sugarcane_bundles', 'mango_leaf_thoranam', 'unadorned_clay_pots'],
        kolamState: 'PREPARING',
        marketState: 'BUSY',
        npcAttireKey: 'village_workwear',
        lightingModifier: { ambientTint: '#ffe8cc', intensity: 1.0 },
        audioLayer: 'village_prep_chatter'
      },
      ACTIVE: {
        hourStart: 18,
        hourEnd: 54,
        description: 'The golden hour of harvest celebration. Earthen pots overflowing with sweet jaggery rice, joyful "Pongalo Pongal" chants, decorated cattle with polished horns, and grand festive veshtis.',
        decorations: ['sugarcane_bundles', 'mango_leaf_thoranam', 'boiling_pongal_pot', 'garlanded_bullocks', 'turmeric_ginger_bunches'],
        kolamState: 'DECORATED',
        marketState: 'BUSY',
        npcAttireKey: 'festival_veshti',
        femaleAttireKey: 'kanchipuram_silk_saree',
        lightingModifier: { ambientTint: '#fff2df', intensity: 1.15, warmSunGlow: true },
        audioLayer: 'pongal_festival_ambience',
        specialFoods: ['sakkarai_pongal', 'ven_pongal', 'sugarcane_pieces', 'medu_vadai'],
        festivalQuests: ['side_pongal_harvest_pot']
      },
      CLEANUP: {
        hourStart: 54,
        hourEnd: 72,
        description: 'Festive offerings distributed to neighbors; sugarcane peelings gathered for livestock; villagers returning to peaceful daily routines.',
        decorations: ['faded_thoranam', 'spent_sugarcane_stalks'],
        kolamState: 'COMPLETE',
        marketState: 'OPEN',
        npcAttireKey: 'everyday_veshti',
        lightingModifier: { ambientTint: '#ffffff', intensity: 1.0 },
        audioLayer: 'quiet_village_dusk'
      }
    },
    discoveries: [
      {
        id: 'discovery_pongal_pot',
        name: 'Turmeric-Garlanded Harvest Clay Pot',
        tamilName: 'மஞ்சள் கொத்து கட்டிய பொங்கல் பானை',
        lore: 'Freshly harvested new rice cooked with jaggery, cardamom, and roasted cashews until the sweet froth spills over the pot rim as a sign of abundance.'
      }
    ]
  },

  // 2. Karthigai Deepam Festival of Lights (கார்த்திகை தீபத் திருவிழா)
  {
    id: 'festival_karthigai_deepam',
    name: 'Karthigai Deepam Festival of Lights',
    tamilName: 'கார்த்திகை தீபத் திருவிழா',
    regions: ['GEORGE_TOWN', 'CHETTINAD', 'THANJAVUR', 'MAMALLAPURAM'],
    season: 'AUTUMN_MONSOON', // Karthigai full moon evening
    durationHours: 36,
    phases: {
      PREPARATION: {
        hourStart: 0,
        hourEnd: 12,
        description: 'Potters delivering thousands of agal clay lamps; oil pressing merchants filling sesame oil canisters.',
        decorations: ['stacks_of_agal_lamps', 'cotton_wick_coils'],
        kolamState: 'PREPARING',
        marketState: 'OPEN',
        npcAttireKey: 'everyday_veshti',
        lightingModifier: { ambientTint: '#f5e6d3', intensity: 1.0 },
        audioLayer: 'temple_bell_prep'
      },
      ACTIVE: {
        hourStart: 12,
        hourEnd: 30,
        description: 'Dusk falls and hundreds of warm agal vilakku clay lamps illuminate every home entrance, courtyard veranda, and stone temple stairway.',
        decorations: ['glowing_agal_rows', 'entrance_kuthu_vilakku', 'temple_tower_deepam'],
        kolamState: 'DECORATED',
        marketState: 'OPEN',
        npcAttireKey: 'festival_veshti',
        femaleAttireKey: 'heritage_textile_saree',
        lightingModifier: { ambientTint: '#ffaa44', intensity: 1.25, warmCampfireHue: true, nightGlow: 0.6 },
        audioLayer: 'karthigai_deepam_ambience',
        specialFoods: ['pori_urundai', 'appam', 'panchamirtham'],
        festivalQuests: ['side_karthigai_lamp_bearer']
      },
      CLEANUP: {
        hourStart: 30,
        hourEnd: 36,
        description: 'Lamps extinguished at dawn; gentle sesame oil fragrance lingering in the humid coastal breeze.',
        decorations: ['terracotta_lamp_trays'],
        kolamState: 'COMPLETE',
        marketState: 'OPEN',
        npcAttireKey: 'everyday_veshti',
        lightingModifier: { ambientTint: '#ffffff', intensity: 1.0 },
        audioLayer: 'coastal_morning_birds'
      }
    },
    discoveries: [
      {
        id: 'discovery_karthigai_vilakku',
        name: 'Agal Vilakku Doorstep Illuminations',
        tamilName: 'வாசல் அகல் விளக்கு வரிசை',
        lore: 'Rows of earthen oil lamps placed along thresholds signify the dispelling of darkness, ignorance, and adversity.'
      }
    ]
  },

  // 3. Grama Kovil Thiruvizha / Village Temple Festival (கிராம கோவில் திருவிழா)
  {
    id: 'festival_village_thiruvizha',
    name: 'Cauvery Riverbed Guardian Deity Thiruvizha',
    tamilName: 'ஆற்றங்கரை காவல் தெய்வத் திருவிழா',
    regions: ['CAUVERY_DELTA', 'PICHAVARAM'],
    season: 'SUMMER_BREEZE',
    durationHours: 48,
    phases: {
      PREPARATION: {
        hourStart: 0,
        hourEnd: 10,
        description: 'Bamboo poles erected with yellow and red triangular cloth flags (thoranam); temporary sweet candy and flower stalls assembling along the lane.',
        decorations: ['triangular_flags', 'flower_arches'],
        kolamState: 'PREPARING',
        marketState: 'PREPARING',
        npcAttireKey: 'village_workwear',
        lightingModifier: { ambientTint: '#fff5e6', intensity: 1.0 },
        audioLayer: 'thiruvizha_drum_tuning'
      },
      ACTIVE: {
        hourStart: 10,
        hourEnd: 40,
        description: 'Procession led by resonant Urumee Melam and Nadaswaram musicians; festive crowds offering cooling tender coconuts and panakam to passing pilgrims.',
        decorations: ['triangular_flags', 'garlanded_ayyanar_statues', 'temporary_sweet_stalls'],
        kolamState: 'DECORATED',
        marketState: 'BUSY',
        npcAttireKey: 'festival_veshti',
        lightingModifier: { ambientTint: '#ffe8a3', intensity: 1.2 },
        audioLayer: 'urumee_melam_nadaswaram',
        specialFoods: ['panakam', 'koozh_with_shallots', 'kadalai_urundai'],
        festivalQuests: ['side_thiruvizha_lost_cymbals']
      },
      CLEANUP: {
        hourStart: 40,
        hourEnd: 48,
        description: 'Festive awnings packed into carts; musicians departing; serene silence settling across the riverside grove.',
        decorations: [],
        kolamState: 'COMPLETE',
        marketState: 'OPEN',
        npcAttireKey: 'everyday_veshti',
        lightingModifier: { ambientTint: '#ffffff', intensity: 1.0 },
        audioLayer: 'riverside_wind'
      }
    },
    discoveries: [
      {
        id: 'discovery_ayyanar_horse',
        name: 'Terracotta Sacred Guardian Horse',
        tamilName: 'மண் குதிரை காவல் தெய்வம்',
        lore: 'Fired terracotta guardian steeds standing sentinel at village borders to shield travelers from nocturnal spirits.'
      }
    ]
  }
];
