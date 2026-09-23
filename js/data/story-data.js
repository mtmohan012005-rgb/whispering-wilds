/**
 * The Whispering Wilds (Kaattu Vazhi) - Narrative Story & World Lore
 * Structured lore definitions, 8 main chapters, regional contexts, and cultural discoveries.
 */

window.STORY_DATA = {
  synopsis: {
    title: "The Whispering Wilds (காட்டு வழி)",
    subtitle: "The Heist of the Ancient Water Blueprints",
    premise: "An inherited architectural blueprint detailing 'Pasumai Thadam'—an ancient underground hydraulic sanctuary engineered during the reign of Rajendra Chola I—is snatched outside the Madras High Court. You must journey across the landscapes of Tamil Nadu, deciphering regional water mechanisms, gathering archaeological evidence, and preventing the corporate syndicate from draining the subterranean biosphere."
  },

  chapters: [
    {
      id: "chapter_1_george_town",
      number: 1,
      name: "The Shadow of George Town",
      tamilName: "மதராஸ் மர்மம் (ஜார்ஜ் டவுன்)",
      region: "george_town",
      biomeName: "Chennai Coastal Plains",
      theme: "Urban rainstorm, stolen inheritance, vintage motorcycle trail",
      summary: "Outside the Madras High Court, a masked rider on a vintage Royal Enfield 350 ambushes you, tearing away key folios of your mentor's blueprint. The trail leads into the street-side tea stalls of George Town.",
      primaryQuestId: "main_missing_trail",
      unlockedByDefault: true,
      keyLocations: ["madras_high_court", "tea_kadai", "auto_stand", "red_clay_turnoff"],
      culturalElements: [
        "Indo-Saracenic red-brick architecture of Madras High Court",
        "Roadside Cutting Chai culture and George Town trade networks",
        "Classic 1960s Madras Motors Royal Enfield bullet acoustics"
      ]
    },
    {
      id: "chapter_2_villupuram",
      number: 2,
      name: "Red Soil and Missing Horns",
      tamilName: "செம்மண் நிலமும் காணாமல் போன காளையும்",
      region: "cauvery_delta",
      biomeName: "Villupuram Agricultural Plains",
      theme: "Pastoral stewardship, agricultural livestock, red soil tracks",
      summary: "Farmer Selvam's prized Kangayam bull has broken loose during the morning thunderstorm. Recovering evidence of the bull uncovers an ancient copper sluice seal dropped by the fleeing courier.",
      primaryQuestId: "side_selvam_bull",
      unlockedByDefault: false,
      keyLocations: ["selvam_homestead", "palmyra_grove", "cattle_manger", "panchayat_well"],
      culturalElements: [
        "Kangayam cattle breeding and indigenous rural agriculture",
        "Red-soil (semman) tracking and palmyra palm agrarian borders",
        "Tucked lungi field attire and brass water vessels"
      ]
    },
    {
      id: "chapter_3_pichavaram",
      number: 3,
      name: "Water Beneath the Roots",
      tamilName: "வேர்களுக்கு கீழே பாயும் நீர் (பிச்சாவரம்)",
      region: "pichavaram",
      biomeName: "Pichavaram Mangrove Wetlands",
      theme: "Tidal channels, stilt roots, Chola hydraulic stone waterwheels",
      summary: "The mangrove channels are choked with floodwaters. A multi-tier Chola waterwheel mechanism controls the tidal flow, concealing an ancient canal route through the stilt roots.",
      primaryQuestId: "main_pichavaram_water",
      unlockedByDefault: false,
      keyLocations: ["canoe_jetty", "stilt_mangrove_arch", "chola_waterwheel", "sunken_canal"],
      culturalElements: [
        "Rhizophora mangrove forest ecology and boatman navigation lore",
        "Chola tidal engineering and lotus-tiger granite sluice dials",
        "Traditional country wooden canoes (Vallam)"
      ]
    },
    {
      id: "chapter_4_chettinad",
      number: 4,
      name: "House of Empty Rooms",
      tamilName: "வெறிச்சோடிய அரண்மனை வீடுகள் (செட்டிநாடு)",
      region: "chettinad",
      biomeName: "Chettinad Heritage Belt",
      theme: "Aathangudi mansions, maritime trade relics, concealed archives",
      summary: "The courier sought refuge in an abandoned 19th-century Chettinad merchant mansion. Navigating courtyards and carved teak pillars reveals a locked heirloom compartment holding diplomatic letters detailing the Chola water sanctuaries.",
      primaryQuestId: "main_chettinad_mansion",
      unlockedByDefault: false,
      keyLocations: ["heritage_mansion_facade", "central_thinnai_courtyard", "teak_pillar_hall", "hidden_iron_safe"],
      culturalElements: [
        "Burmese teak columns, Italian marble, and handmade Aathangudi tiles",
        "Nattukottai Chettiar seafaring trade routes across Southeast Asia",
        "Heirloom brass padlocks and secret floor vaults (Pattalayam)"
      ]
    },
    {
      id: "chapter_5_thanjavur",
      number: 5,
      name: "The Artisan's Mark",
      tamilName: "சிற்பியின் முத்திரை (தஞ்சாவூர்)",
      region: "thanjavur",
      biomeName: "Thanjavur Delta Farmlands",
      theme: "Lost-wax bronze metallurgy, granary engineering, temple craft",
      summary: "In a heritage workshop near the Great Temple, master bronze caster Sembian examines the recovered copper seal. He reveals it was crafted by the royal guild of Chola hydraulic engineers and matches a missing temple gear piece.",
      primaryQuestId: "main_thanjavur_artisan",
      unlockedByDefault: false,
      keyLocations: ["bronze_casting_forge", "paddy_granary", "sculptors_lane", "temple_moat"],
      culturalElements: [
        "Swamimalai lost-wax bronze casting technique (Madhuchehishtavidhana)",
        "Cauvery delta granary architecture and paddy agrarian culture",
        "Royal Chola tiger insignia and metallurgy hallmarks"
      ]
    },
    {
      id: "chapter_6_mamallapuram",
      number: 6,
      name: "Stone and Sea",
      tamilName: "கல்லும் கடலும் (மாமல்லபுரம்)",
      region: "mamallapuram",
      biomeName: "Coromandel Coastal Monoliths",
      theme: "Granite shore carving, sea spray erosion, fictional maritime relics",
      summary: "Along the wind-battered granite shore, stone carver Govindan helps decode a monolithic bas-relief showing water flowing from mountain peak to ocean deep. A coastal cave holds a stone key fragment.",
      primaryQuestId: "main_mamallapuram_stone",
      unlockedByDefault: false,
      keyLocations: ["shore_carving_shed", "granite_cave_shrine", "coastal_boulder_trail", "fisherman_cove"],
      culturalElements: [
        "Pallava stone sculpture techniques passed down through generations",
        "Coromandel maritime navigation lore and sea-spray weathering",
        "Respect for genuine archaeological monuments while framing fictional game narrative"
      ]
    },
    {
      id: "chapter_7_nilgiris",
      number: 7,
      name: "Above the Mist",
      tamilName: "மூடுபனிக்கு மேலே (நீலகிரி)",
      region: "nilgiris",
      biomeName: "Nilgiri Mountain Cloud Forest",
      theme: "Sub-zero mountain mists, thermal endurance, Toda mund heritage",
      summary: "Freezing mountain fogs require insulated Nilgiri woolen attire. Guided by trekking guide Karthik through the Shola forests, you track the endangered Nilgiri Tahr to discover the sealed subterranean mountain entrance.",
      primaryQuestId: "main_nilgiris_mist",
      unlockedByDefault: false,
      keyLocations: ["tea_factory_outpost", "toda_buffalo_mund", "shola_forest_cairn", "tahr_cliff_viewpoint"],
      culturalElements: [
        "Indigenous Toda barrel-vaulted thatch architecture (Mund)",
        "Endangered Nilgiri Tahr (Nilgiritragus hylocrius) ecology",
        "High-altitude Shola-grassland mosaic and mountain weather resilience"
      ]
    },
    {
      id: "chapter_8_sanctuary",
      number: 8,
      name: "Pasumai Thadam: The Ancient Eco-Sanctuary",
      tamilName: "பசுமைத் தடம்: பழங்கால நிலத்தடி உயிர்க்கோளம்",
      region: "final_sanctuary",
      biomeName: "Subterranean Biosphere",
      theme: "Living botanical sanctuary, bio-hydraulic mechanisms, legacy preserved",
      summary: "With all pieces of the Chola master blueprint assembled and the stone seals set in place, the massive granite vault slides open, revealing a flourishing underground biosphere of living flora thought extinct.",
      primaryQuestId: "main_final_sanctuary",
      unlockedByDefault: false,
      keyLocations: ["granite_portal_gates", "hydraulic_aqueduct_chamber", "bioluminescent_canopy", "master_sanctuary_hearth"],
      culturalElements: [
        "Ancient Tamil botanical preservation and botanical ethics (Sangam ecological tins)",
        "Living seed banks engineered through natural geothermal and gravity hydraulics",
        "Complete victory over the corporate syndicate through peaceful preservation"
      ]
    }
  ],

  // Collectible Cultural Discoveries (Non-quest points of interest)
  discoveries: [
    {
      id: "disc_high_court_cupola",
      title: "Madras High Court Minaret & Light Tower",
      tamilName: "உயர் நீதிமன்ற கோபுரம்",
      region: "george_town",
      category: "architecture",
      description: "Finished in 1892, this red-brick Indo-Saracenic masterpiece housed Chennai's second lighthouse until 1977."
    },
    {
      id: "disc_chettinad_tile",
      title: "Handmade Aathangudi Sun-Baked Tile",
      tamilName: "ஆத்தங்குடி தரை ஓடு",
      region: "chettinad",
      category: "craft",
      description: "Crafted using local river sand, colored glass powders, and geometric brass stencils cured under the sun."
    },
    {
      id: "disc_neelakurinji_bloom",
      title: "Neelakurinji 12-Year Shola Blossom",
      tamilName: "நீலக்குறிஞ்சி மலர்",
      region: "nilgiris",
      category: "wildlife",
      description: "Strobilanthes kunthiana covers the Nilgiri hillsides in a vibrant purplish-blue carpet once every 12 years."
    },
    {
      id: "disc_chola_granary",
      title: "Ancient Sluice Stone Inscription",
      tamilName: "சோழர் கால மதகு கல்வெட்டு",
      region: "cauvery_delta",
      category: "archaeology",
      description: "Granite marker detailing water release quotas for village paddy fields during monsoon crests."
    }
  ]
};

window.STORY_CHAPTERS_DATA = {
  chapter_1_madras: window.STORY_DATA.chapters[0],
  chapter_2_cauvery: window.STORY_DATA.chapters[1],
  chapter_3_pichavaram: window.STORY_DATA.chapters[2],
  chapter_4_chettinad: window.STORY_DATA.chapters[3],
  chapter_5_thanjavur: window.STORY_DATA.chapters[4],
  chapter_6_mamallapuram: window.STORY_DATA.chapters[5],
  chapter_7_nilgiris: window.STORY_DATA.chapters[6],
  chapter_8_sanctuary: window.STORY_DATA.chapters[7]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STORY_DATA: window.STORY_DATA, STORY_CHAPTERS_DATA: window.STORY_CHAPTERS_DATA };
}

