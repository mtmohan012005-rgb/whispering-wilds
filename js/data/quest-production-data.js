/**
 * The Whispering Wilds (Kaattu Vazhi) - Authoritative Production Quest Definitions
 * Conforming strictly to Section 4: Data Model, with structured objectives, prerequisites,
 * fail conditions, and structured rewards (currency, items, story flags, region unlocks).
 */

window.QUEST_PRODUCTION_DATA = [
  // =========================================================================
  // CHAPTER 1: GEORGE TOWN
  // =========================================================================
  {
    id: "main_missing_trail",
    title: "The Missing Trail",
    tamilTitle: "காணாமல் போன தடம் (மதராஸ் மர்மம்)",
    region: "george_town",
    chapter: "chapter_1_george_town",
    description: "Outside the Madras High Court, an operative on a vintage Royal Enfield tore away critical pages of your mentor's blueprint. Explore the perimeter, photograph physical evidence, and question Murugan Annan.",
    status: "active",
    prerequisites: [],
    dialogueIds: ["tea_kadai", "chennai_auto"],
    evidenceIds: ["clue_torn_blueprint", "clue_enfield_tread"],
    failConditions: [],
    unlocks: ["side_selvam_bull", "main_pichavaram_water"],
    rewards: [
      { type: "currency", amount: 75 },
      { type: "item", itemId: "mentor_field_notes", name: "Dr. Ramanathan's Journal Folio" },
      { type: "story_flag", flag: "george_town_trail_solved" },
      { type: "journal_entry", entryId: "high_court_gates" }
    ],
    objectives: [
      {
        id: "explore_starting_area",
        type: "explore",
        target: "madras_high_court",
        text: "Explore the starting area outside Madras High Court gates",
        requiredAmount: 1,
        currentAmount: 1,
        completed: true,
        hidden: false
      },
      {
        id: "find_first_clue",
        type: "inspect",
        target: "high_court_gates",
        text: "Find and inspect the torn parchment left behind at the gates",
        requiredAmount: 1,
        currentAmount: 1,
        completed: true,
        hidden: false
      },
      {
        id: "investigate_location",
        type: "inspect",
        target: "crime_scene_mud",
        text: "Investigate muddy tire skids near the curb",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "photo_clue",
        type: "photo",
        target: "high_court_gates",
        text: "Photograph the crime scene gates with your Explorer Camera [F]",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "talk_murugan",
        type: "talk",
        target: "tea_kadai",
        text: "Talk to Murugan Annan at his roadside Tea Kadai",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "follow_tracks",
        type: "explore",
        target: "enfield_tracks_site",
        text: "Follow the muddy Royal Enfield tyre skids along the red-soil road",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "find_additional_evidence",
        type: "inspect",
        target: "enfield_tracks_site",
        text: "Examine the tyre tread pattern to identify the heading",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "identify_location",
        type: "inspect",
        target: "delta_signpost",
        text: "Identify the directional milestone indicating the route to Pichavaram",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "return_to_murugan",
        type: "talk",
        target: "tea_kadai",
        text: "Report your discoveries back to Murugan Annan to complete the investigation",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      }
    ]
  },

  // =========================================================================
  // CHAPTER 2: VILLUPURAM / FARMER STORY
  // =========================================================================
  {
    id: "side_selvam_bull",
    title: "Selvam's Missing Bull",
    tamilTitle: "விவசாயி செல்வத்தின் காணாமல் போன காளை",
    region: "cauvery_delta",
    chapter: "chapter_2_villupuram",
    description: "Farmer Selvam's prized Kangayam bull panicked during the morning squall and bolted towards the palmyra groves. Locate the bull, photograph it, and present the evidence to Selvam.",
    status: "active",
    prerequisites: [],
    dialogueIds: ["farmer_selvam"],
    evidenceIds: ["clue_chola_seal"],
    failConditions: [],
    unlocks: ["main_pichavaram_water"],
    rewards: [
      { type: "currency", amount: 100 },
      { type: "item", itemId: "copper_sluice_seal", name: "Ancient Chola Sluice Seal" },
      { type: "story_flag", flag: "bull_investigation_complete" },
      { type: "region_unlock", regionId: "pichavaram" }
    ],
    objectives: [
      {
        id: "talk_selvam",
        type: "talk",
        target: "farmer_selvam",
        text: "Talk to Farmer Selvam about his missing champion bull",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "visit_cattle_area",
        type: "explore",
        target: "cattle_manger",
        text: "Visit the cattle pen where the bull broke through the fence",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "inspect_tracks",
        type: "inspect",
        target: "cattle_gate",
        text: "Inspect the broken fence posts and hoof imprints in the red soil",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "search_nearby_field",
        type: "explore",
        target: "palmyra_grove",
        text: "Search the nearby palmyra grove along the agricultural trail",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "photo_bull",
        type: "photo",
        target: "jallikattu_bull",
        text: "Photograph the Kangayam bull with your Explorer Camera [F]",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "follow_bull_trail",
        type: "explore",
        target: "river_crossing",
        text: "Follow the trampled trail down toward the irrigation canal",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "find_missing_bull",
        type: "inspect",
        target: "jallikattu_bull",
        text: "Approach and calmly secure the champion bull",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "return_to_selvam",
        type: "talk",
        target: "farmer_selvam",
        text: "Return to Farmer Selvam at his homestead",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "report_selvam",
        type: "talk",
        target: "farmer_selvam",
        text: "Show the photograph to Selvam to complete the report and receive the Chola seal",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      }
    ]
  },

  // =========================================================================
  // CHAPTER 3: PICHAVARAM MANGROVES
  // =========================================================================
  {
    id: "main_pichavaram_water",
    title: "Water Beneath the Roots",
    tamilTitle: "வேர்களுக்கு கீழே பாயும் நீர் (பிச்சாவரம்)",
    region: "pichavaram",
    chapter: "chapter_3_pichavaram",
    description: "Floodwaters block passage through the mangrove canopy. Repair and align the ancient Chola stone waterwheel to drain the sunken canal and reveal the route forward.",
    status: "locked",
    prerequisites: ["main_missing_trail", "side_selvam_bull"],
    dialogueIds: ["boatman_kathir"],
    evidenceIds: ["clue_waterwheel_glyph"],
    failConditions: [],
    unlocks: ["main_chettinad_mansion", "main_thanjavur_artisan"],
    rewards: [
      { type: "currency", amount: 150 },
      { type: "item", itemId: "mangrove_compass_lens", name: "Polished Quartz Compass Lens" },
      { type: "story_flag", flag: "pichavaram_waterway_open" },
      { type: "region_unlock", regionId: "chettinad" },
      { type: "region_unlock", regionId: "thanjavur" }
    ],
    objectives: [
      {
        id: "travel_to_pichavaram",
        type: "explore",
        target: "canoe_jetty",
        text: "Travel southeast to the Pichavaram mangrove canoe jetty",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "talk_boat_operator",
        type: "talk",
        target: "boatman_kathir",
        text: "Speak with veteran boatman Kathir about traversing the tidal channels",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "obtain_boat_access",
        type: "collect",
        target: "wooden_boat_oar",
        text: "Obtain a sturdy mangrove paddle from the boat shed",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "enter_mangrove_waterways",
        type: "explore",
        target: "stilt_mangrove_arch",
        text: "Paddle beneath the dense stilt-root mangrove archway",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "find_damaged_sluice",
        type: "inspect",
        target: "broken_chola_gate",
        text: "Find the jammed granite sluice gates choking the mountain channel",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "investigate_waterwheel",
        type: "inspect",
        target: "chola_waterwheel",
        text: "Inspect the ancient Chola dual-rotary stone waterwheel",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "operate_waterwheel_mechanism",
        type: "puzzle",
        target: "delta_waterwheel_gears",
        text: "Rotate the granite dials to align the Chola Lotus (90°) and Tiger rune (270°)",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "redirect_water",
        type: "puzzle",
        target: "sluice_valve_system",
        text: "Open Sluice Gate A and Sluice Gate B to redirect excess storm water",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "reveal_hidden_route",
        type: "explore",
        target: "sunken_canal",
        text: "Observe the falling water level as the sunken canal is revealed",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "discover_hidden_chamber",
        type: "explore",
        target: "tidal_stone_crypt",
        text: "Enter the exposed stone water chamber beneath the roots",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "record_pichavaram_evidence",
        type: "photo",
        target: "chola_waterwheel",
        text: "Photograph the aligned waterwheel mechanism for your field records",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      }
    ]
  },

  // =========================================================================
  // CHAPTER 4: CHETTINAD
  // =========================================================================
  {
    id: "main_chettinad_mansion",
    title: "House of Empty Rooms",
    tamilTitle: "வெறிச்சோடிய அரண்மனை வீடுகள் (செட்டிநாடு)",
    region: "chettinad",
    chapter: "chapter_4_chettinad",
    description: "Follow the courier's trail to an abandoned Chettinad merchant palace. Search the courtyard, locate a secret compartment, and photograph diplomatic letters confirming the Chola sanctuary.",
    status: "locked",
    prerequisites: ["main_pichavaram_water"],
    dialogueIds: ["caretaker_meenakshi"],
    evidenceIds: ["clue_chettinad_letter"],
    failConditions: [],
    unlocks: ["main_mamallapuram_stone"],
    rewards: [
      { type: "currency", amount: 175 },
      { type: "item", itemId: "pattalayam_brass_key", name: "Carved Brass Heritage Key" },
      { type: "story_flag", flag: "chettinad_documents_secured" },
      { type: "region_unlock", regionId: "mamallapuram" }
    ],
    objectives: [
      {
        id: "discover_heritage_house",
        type: "explore",
        target: "heritage_mansion_facade",
        text: "Discover the heritage Chettinad merchant mansion facade",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "investigate_entrance",
        type: "inspect",
        target: "teak_door_padlock",
        text: "Investigate the carved entrance threshold and heavy brass padlock",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "find_courtyard",
        type: "explore",
        target: "central_thinnai_courtyard",
        text: "Step inside and explore the open central thinnai courtyard",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "inspect_old_objects",
        type: "inspect",
        target: "brass_samovar_chest",
        text: "Inspect antique spice trunks and brass samovars stacked in the hall",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "discover_hidden_compartment",
        type: "inspect",
        target: "teak_floor_vault",
        text: "Locate a concealed floor vault (Pattalayam) beneath the Belgian tiles",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "find_document",
        type: "collect",
        target: "chettiar_trade_parchment",
        text: "Retrieve the 1894 diplomatic trade record detailing Chola aqueducts",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "photo_mansion_evidence",
        type: "photo",
        target: "hidden_iron_safe",
        text: "Photograph the opened archive safe and seal imprint with your camera",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "leave_house",
        type: "explore",
        target: "courtyard_exit",
        text: "Exit the mansion through the carved teak doorway",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "update_journal",
        type: "inspect",
        target: "mentor_journal_prologue",
        text: "Pin the Chettinad letter to your field journal clue board",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      }
    ]
  },

  // =========================================================================
  // CHAPTER 5: THANJAVUR
  // =========================================================================
  {
    id: "main_thanjavur_artisan",
    title: "The Artisan's Mark",
    tamilTitle: "சிற்பியின் முத்திரை (தஞ்சாவூர்)",
    region: "thanjavur",
    chapter: "chapter_5_thanjavur",
    description: "Consult with master bronze caster Sembian in Thanjavur. Analyze the metallurgical stamps on the copper sluice seal to identify the missing keystone gear.",
    status: "locked",
    prerequisites: ["main_pichavaram_water"],
    dialogueIds: ["artisan_sembian"],
    evidenceIds: ["clue_artisan_stamp"],
    failConditions: [],
    unlocks: ["main_nilgiris_mist"],
    rewards: [
      { type: "currency", amount: 200 },
      { type: "item", itemId: "restored_chola_gear", name: "Recast Bronze Lotus Gear" },
      { type: "story_flag", flag: "thanjavur_bronze_analyzed" },
      { type: "journal_entry", entryId: "bronze_casting_forge" }
    ],
    objectives: [
      {
        id: "talk_to_artisan",
        type: "talk",
        target: "bronze_artisan_sembian",
        text: "Talk to master craftsman Sembian at his Swamimalai heritage foundry",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "inspect_workshop",
        type: "inspect",
        target: "bronze_casting_forge",
        text: "Inspect the traditional charcoal forge and lost-wax clay moulds",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "identify_object",
        type: "inspect",
        target: "copper_sluice_seal",
        text: "Show the copper sluice seal recovered from Farmer Selvam",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "gather_craft_materials",
        type: "collect",
        target: "beeswax_clay_mould",
        text: "Gather beeswax and fine Cauvery river clay for recasting tests",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "observe_craft_process",
        type: "talk",
        target: "bronze_artisan_sembian",
        text: "Observe the lost-wax casting demonstration to reveal the hidden notch",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "identify_marking",
        type: "inspect",
        target: "chola_royal_tiger_stamp",
        text: "Identify the royal Chola tiger hallmark engraved onto the bronze gear",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "connect_to_evidence",
        type: "inspect",
        target: "clue_torn_blueprint",
        text: "Connect the artisan hallmark to the torn blueprint in your journal",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "update_story_trail",
        type: "talk",
        target: "bronze_artisan_sembian",
        text: "Receive Sembian's blessings and the recast Lotus gear for the mountain vault",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      }
    ]
  },

  // =========================================================================
  // CHAPTER 6: MAMALLAPURAM
  // =========================================================================
  {
    id: "main_mamallapuram_stone",
    title: "Stone and Sea",
    tamilTitle: "கல்லும் கடலும் (மாமல்லபுரம்)",
    region: "mamallapuram",
    chapter: "chapter_6_mamallapuram",
    description: "Decipher the coastal monolithic carvings of Mamallapuram. Consult with sculptor Govindan to locate the sea-carved keystone needed to unseal the highland portal.",
    status: "locked",
    prerequisites: ["main_chettinad_mansion"],
    dialogueIds: ["sculptor_govindan"],
    evidenceIds: ["clue_stone_relief"],
    failConditions: [],
    unlocks: ["main_nilgiris_mist"],
    rewards: [
      { type: "currency", amount: 200 },
      { type: "item", itemId: "carved_stone_keystone", name: "Pallava Monolith Keystone" },
      { type: "story_flag", flag: "mamallapuram_keystone_obtained" },
      { type: "region_unlock", regionId: "nilgiris" }
    ],
    objectives: [
      {
        id: "explore_coast",
        type: "explore",
        target: "coastal_boulder_trail",
        text: "Explore the windswept coastal boulder trail of Mamallapuram",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "discover_carving_workshop",
        type: "explore",
        target: "shore_carving_shed",
        text: "Discover the open-air granite sculptors' shed near the surf",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "inspect_stone_clues",
        type: "inspect",
        target: "granite_wave_bas_relief",
        text: "Inspect a weathered bas-relief depicting water descending from clouds",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "talk_to_sculptor",
        type: "talk",
        target: "sculptor_govindan",
        text: "Talk to artisan Govindan about ancient hydraulic stone markers",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "photograph_structure",
        type: "photo",
        target: "granite_cave_shrine",
        text: "Photograph the stone cave pillar alignment with your Explorer Camera [F]",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "follow_coastal_trail",
        type: "explore",
        target: "fisherman_cove",
        text: "Follow the coastal trail south to the secluded fisherman's cove",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "discover_next_clue",
        type: "inspect",
        target: "weathered_pallava_anchor",
        text: "Retrieve the carved stone keystone resting among ancient salt rocks",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      }
    ]
  },

  // =========================================================================
  // CHAPTER 7: NILGIRIS
  // =========================================================================
  {
    id: "main_nilgiris_mist",
    title: "Above the Mist",
    tamilTitle: "மூடுபனிக்கு மேலே (நீலகிரி)",
    region: "nilgiris",
    chapter: "chapter_7_nilgiris",
    description: "Equip suitable mountain attire to survive freezing heights. Ascend past tea estates and Toda buffalo munds with mountain guide Karthik to track the rare Nilgiri Tahr.",
    status: "locked",
    prerequisites: ["main_thanjavur_artisan", "main_mamallapuram_stone"],
    dialogueIds: ["hill_guide_karthik"],
    evidenceIds: ["clue_eco_portal"],
    failConditions: [],
    unlocks: ["main_final_sanctuary"],
    rewards: [
      { type: "currency", amount: 250 },
      { type: "item", itemId: "sacred_toda_amulet", name: "Hand-Carved Toda Horn Charm" },
      { type: "story_flag", flag: "nilgiris_sanctuary_located" },
      { type: "region_unlock", regionId: "final_sanctuary" }
    ],
    objectives: [
      {
        id: "prepare_cold_climate",
        type: "inspect",
        target: "temp_value",
        text: "Verify core temperature management before venturing into freezing fog",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "obtain_suitable_clothing",
        type: "equip",
        target: "nilgiri_warmwear",
        text: "Equip the Nilgiri Woolen Thermal Suit (outfitId: nilgiri_warmwear)",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "travel_into_nilgiris",
        type: "explore",
        target: "tea_factory_outpost",
        text: "Travel to the Nilgiri mountain tea outpost in the high shola pass",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "meet_forest_guide",
        type: "talk",
        target: "hill_guide_karthik",
        text: "Meet native mountain guide Karthik at the stone hearth",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "follow_forest_route",
        type: "explore",
        target: "shola_forest_cairn",
        text: "Follow the stone cairn trail climbing through the shola cloud forest",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "observe_wildlife",
        type: "explore",
        target: "toda_buffalo_mund",
        text: "Observe the sacred Toda buffalo grazing near the barrel-roof mund",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "photo_nilgiri_tahr",
        type: "photo",
        target: "nilgiri_tahr",
        text: "Capture a clear photograph of the endangered Nilgiri Tahr on the cliff ridge",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "discover_hidden_route",
        type: "explore",
        target: "tahr_cliff_viewpoint",
        text: "Climb past the cliff viewpoint to uncover the concealed gorge path",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "investigate_abandoned_post",
        type: "inspect",
        target: "stone_colonial_outpost",
        text: "Investigate the abandoned stone shelter guarding the mountain cleft",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "unlock_final_chapter",
        type: "inspect",
        target: "ancient_sanctuary_cairn",
        text: "Inspect the final granite seal leading to the subterranean biosphere",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      }
    ]
  },

  // =========================================================================
  // CHAPTER 8: FINAL SANCTUARY
  // =========================================================================
  {
    id: "main_final_sanctuary",
    title: "Pasumai Thadam: The Ancient Eco-Sanctuary",
    tamilTitle: "பசுமைத் தடம்: பழங்கால நிலத்தடி உயிர்க்கோளம்",
    region: "final_sanctuary",
    chapter: "chapter_8_sanctuary",
    description: "Assemble all gathered Chola relics, stone keystones, and the recast bronze gear to open the fabled underground biosphere and preserve Tamil Nadu's botanical heritage.",
    status: "locked",
    prerequisites: ["main_nilgiris_mist"],
    dialogueIds: [],
    evidenceIds: ["clue_eco_portal"],
    failConditions: [],
    unlocks: [],
    rewards: [
      { type: "currency", amount: 500 },
      { type: "story_flag", flag: "pasumai_thadam_preserved" },
      { type: "journal_entry", entryId: "eco_sanctuary_portal" }
    ],
    objectives: [
      {
        id: "approach_sanctuary_gates",
        type: "explore",
        target: "granite_portal_gates",
        text: "Approach the monolithic granite gates of Pasumai Thadam",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "inspect_portal_keystones",
        type: "inspect",
        target: "eco_sanctuary_portal",
        text: "Inspect the recessed lock sockets matching the Chola seals and gear",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "insert_restored_gear",
        type: "puzzle",
        target: "sanctuary_lock_mechanism",
        text: "Fit the restored bronze Lotus gear and Pallava keystone into the dial",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "unseal_subterranean_biosphere",
        type: "puzzle",
        target: "ancient_hydraulic_release",
        text: "Engage the geothermal hydraulic release to slide the stone vault open",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "enter_living_sanctuary",
        type: "explore",
        target: "hydraulic_aqueduct_chamber",
        text: "Step into the thriving underground botanical biosphere",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "document_extinct_botanicals",
        type: "photo",
        target: "bioluminescent_canopy",
        text: "Photograph the untouched living canopy with your Explorer Camera [F]",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      },
      {
        id: "preserve_heritage_legacy",
        type: "inspect",
        target: "master_sanctuary_hearth",
        text: "Activate the permanent conservation lock to safeguard Pasumai Thadam forever",
        requiredAmount: 1,
        currentAmount: 0,
        completed: false,
        hidden: false
      }
    ]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUEST_PRODUCTION_DATA: window.QUEST_PRODUCTION_DATA };
}
