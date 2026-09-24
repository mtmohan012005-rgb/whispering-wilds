// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - MASTER CODEX DATA
// 9 Authoritative Sections: WORLD, WILDLIFE, CULTURE, PLACES, FOOD, CRAFT,
// CHARACTERS, STORY, PHOTOGRAPHY.
// Distinguishes Authentic Real-World Tamil Context from Fictional Game Lore.
// ============================================================================

(function() {
    const CODEX_SECTIONS = {
        WORLD: 'WORLD',
        WILDLIFE: 'WILDLIFE',
        CULTURE: 'CULTURE',
        PLACES: 'PLACES',
        FOOD: 'FOOD',
        CRAFT: 'CRAFT',
        CHARACTERS: 'CHARACTERS',
        STORY: 'STORY',
        PHOTOGRAPHY: 'PHOTOGRAPHY'
    };

    const CODEX_ENTRIES = {
        // --- PLACES ---
        places_madras_high_court: {
            id: 'places_madras_high_court',
            section: CODEX_SECTIONS.PLACES,
            title: 'Madras High Court & Broadway',
            tamilTitle: 'மெட்ராஸ் உயர்நீதிமன்றம் & பிராட்வே',
            region: 'george_town',
            hint: 'A towering red Indo-Saracenic institution in the commercial heart of old Chennai.',
            historicalContext: 'Real Cultural Context: Built in 1892, one of the foremost examples of Indo-Saracenic architecture in India, designed by J.W. Brassington and Henry Irwin.',
            gameLore: 'Game Story: Where Dr. Ramanathan’s historical estate manuscripts were archived before the inciting parchment theft.',
            discovered: true,
            discoveredAt: Date.now()
        },
        places_murugan_tea_stall: {
            id: 'places_murugan_tea_stall',
            section: CODEX_SECTIONS.PLACES,
            title: 'Murugan Annan\'s Roadside Tea Kadai',
            tamilTitle: 'முருகன் அண்ணன் டீ கடை',
            region: 'george_town',
            hint: 'A bustling neighborhood hub with brass boiler and hot vadai aroma.',
            historicalContext: 'Real Cultural Context: Tamil Nadu roadside tea kadais are essential community hubs where people gather over boiling ginger-cardamom tea and hot snacks.',
            gameLore: 'Game Story: Murugan Annan serves as a primary local confidant with ears on the streets of North Madras.',
            discovered: true,
            discoveredAt: Date.now()
        },
        places_chola_waterwheel: {
            id: 'places_chola_waterwheel',
            section: CODEX_SECTIONS.PLACES,
            title: 'Chola Hydro-Sluice Waterwheel',
            tamilTitle: 'சோழர் கால நீர் மதகு சக்கரம்',
            region: 'cauvery_delta',
            hint: 'An ancient dual-lotus mechanism along the river distributaries.',
            historicalContext: 'Real Cultural Context: The Chola empire pioneered advanced water conservation, canal embankments, and hydraulic sluice gates across the fertile Cauvery basin.',
            gameLore: 'Game Story: A hidden sluice mechanism designed to submerge and protect the secret waterway route towards Pichavaram.',
            discovered: false,
            discoveredAt: null
        },
        places_pichavaram_mangrove_maze: {
            id: 'places_pichavaram_mangrove_maze',
            section: CODEX_SECTIONS.PLACES,
            title: 'Pichavaram Mangrove Waterway',
            tamilTitle: 'பிச்சாவரம் சதுப்புநிலக் கால்வாய்',
            region: 'pichavaram',
            hint: 'One of the world\'s largest mangrove forests with interconnected tidal creeks.',
            historicalContext: 'Real Cultural Context: Pichavaram hosts an exquisite mangrove ecosystem dominated by Rhizophora and Avicennia trees whose stilt roots protect the coast.',
            gameLore: 'Game Story: The smuggling syndicate used narrow root tunnels to conceal cargo transit away from coastal patrol boats.',
            discovered: false,
            discoveredAt: null
        },
        places_chettinad_heritage_mansion: {
            id: 'places_chettinad_heritage_mansion',
            section: CODEX_SECTIONS.PLACES,
            title: 'Chettinad Courtyard Mansion',
            tamilTitle: 'செட்டிநாட்டு பாரம்பரிய இல்லம்',
            region: 'chettinad',
            hint: 'Grand palatial estate featuring Burmese teak columns and Belgian mirrors.',
            historicalContext: 'Real Cultural Context: The merchant heritage mansions of Chettinad feature elaborate central courtyards, raised verandas (thinnai), and indigenous cooling architecture.',
            gameLore: 'Game Story: The ancestral residence of the antique merchant where missing blueprints were copied.',
            discovered: false,
            discoveredAt: null
        },
        places_thanjavur_royal_forge: {
            id: 'places_thanjavur_royal_forge',
            section: CODEX_SECTIONS.PLACES,
            title: 'Swamimalai Bronze Casting Workshop',
            tamilTitle: 'சுவாமிமலை வெண்கல வார்ப்பு பட்டறை',
            region: 'thanjavur',
            hint: 'Traditional lost-wax bronze casting furnaces on the riverbank.',
            historicalContext: 'Real Cultural Context: Swamimalai master sculptors (Sthapathis) have practiced lost-wax (cire perdue) bronze icon crafting since the Chola era with GI tag recognition.',
            gameLore: 'Game Story: Where the metallurgical alloy seal found at the crime scene was identified.',
            discovered: false,
            discoveredAt: null
        },
        places_shore_temple_cliffs: {
            id: 'places_shore_temple_cliffs',
            section: CODEX_SECTIONS.PLACES,
            title: 'Mamallapuram Shore Granite Cliffs',
            tamilTitle: 'மாமல்லபுரம் கடற்கரை பாறைகள்',
            region: 'mamallapuram',
            hint: '7th-century coastal rock-cut monuments facing the Bay of Bengal.',
            historicalContext: 'Real Cultural Context: Pallava dynasty monolithic rock sanctuaries and bas-reliefs carved from local coastal granite outcrops, a UNESCO World Heritage site.',
            gameLore: 'Game Story: The coastline where nautical markers pointed toward a sea route rendezvous.',
            discovered: false,
            discoveredAt: null
        },
        places_nilgiri_shola_ridge: {
            id: 'places_nilgiri_shola_ridge',
            section: CODEX_SECTIONS.PLACES,
            title: 'Nilgiri Shola-Grassland Sanctuary',
            tamilTitle: 'நீலகிரி சோலை புல்வெளி புகலிடம்',
            region: 'nilgiris',
            hint: 'Misty montane rainforest patches nestled within undulating mountain grasslands.',
            historicalContext: 'Real Cultural Context: Shola montane dwarf forests in the Western Ghats are ancient biodiversity reservoirs that act as natural cloud sponge water towers.',
            gameLore: 'Game Story: The mountain threshold leading into the ancient Pasumai Thadam botanical sanctuary.',
            discovered: false,
            discoveredAt: null
        },

        // --- FOOD ---
        food_filter_coffee: {
            id: 'food_filter_coffee',
            section: CODEX_SECTIONS.FOOD,
            title: 'Madras Degree Filter Coffee',
            tamilTitle: 'மதராஸ் டிகிரி ஃபில்டர் காபி',
            region: 'george_town',
            hint: 'Frothy hot chicory-roasted coffee served in a traditional dabarah and tumbler.',
            historicalContext: 'Real Cultural Context: Prepared by brewing dark-roasted peaberry coffee grounds through a stainless-steel or brass gravity filter and blending with boiling fresh milk.',
            gameLore: 'Game Story: Restores 35 Energy and boosts sprint stamina recovery.',
            discovered: true,
            discoveredAt: Date.now()
        },
        food_medu_vadai: {
            id: 'food_medu_vadai',
            section: CODEX_SECTIONS.FOOD,
            title: 'Crispy Medu Vadai',
            tamilTitle: 'மெதுவடை',
            region: 'george_town',
            hint: 'Savory urad dal fritter with crisp crust and fluffy core, flavored with peppercorns.',
            historicalContext: 'Real Cultural Context: A centuries-old Tamil breakfast staple often accompanied by coconut chutney and piping hot sambar.',
            gameLore: 'Game Story: Restores 25 Hunger and 15 Energy.',
            discovered: true,
            discoveredAt: Date.now()
        },
        food_kavuni_arisi: {
            id: 'food_kavuni_arisi',
            section: CODEX_SECTIONS.FOOD,
            title: 'Chettinad Kavuni Arisi',
            tamilTitle: 'செட்டிநாடு கவுனி அரிசி',
            region: 'chettinad',
            hint: 'Sweetened black sticky rice delicacy infused with cardamom and fresh grated coconut.',
            historicalContext: 'Real Cultural Context: Brought back by Chettiar traders from Southeast Asia, this black rice sweet is reserved for festive celebrations and family banquets.',
            gameLore: 'Game Story: High-nutrition expedition ration providing extended well-fed buff.',
            discovered: false,
            discoveredAt: null
        },

        // --- CRAFT ---
        craft_lost_wax_bronze: {
            id: 'craft_lost_wax_bronze',
            section: CODEX_SECTIONS.CRAFT,
            title: 'Swamimalai Lost-Wax Bronze Metallurgy',
            tamilTitle: 'சுவாமிமலை மெழுகு வார்ப்பு வெண்கலம்',
            region: 'thanjavur',
            hint: 'Beeswax sculpting, clay molding, furnace burnout, and molten bronze pouring.',
            historicalContext: 'Real Cultural Context: Master craftsmen shape a wax model, encase it in Cauvery silt clay, melt the wax out (lost wax), and pour panchaloha (5-metal alloy).',
            gameLore: 'Game Story: Analysis of the alloy seal revealed the exact crucible mark of the master artisan.',
            discovered: false,
            discoveredAt: null
        },
        craft_athangudi_tiles: {
            id: 'craft_athangudi_tiles',
            section: CODEX_SECTIONS.CRAFT,
            title: 'Athangudi Handmade Floor Tiles',
            tamilTitle: 'ஆத்தங்குடி தரை ஓடுகள்',
            region: 'chettinad',
            hint: 'Individually patterned tiles hand-cast from local sand, cement, and vegetable dyes.',
            historicalContext: 'Real Cultural Context: Athangudi artisan families handcraft patterned tiles polished with coconut husk, retaining lustrous color for decades without baking.',
            gameLore: 'Game Story: A distinct tile pattern beneath the ancestral cabinet concealed a secret floor latch.',
            discovered: false,
            discoveredAt: null
        },

        // --- CHARACTERS ---
        char_murugan: {
            id: 'char_murugan',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Murugan Annan (டீ கடை முருகன்)',
            tamilTitle: 'டீ கடை முருகன் அண்ணன்',
            region: 'george_town',
            hint: 'Roadside tea stall proprietor who greets every dawn with ginger tea and stories.',
            historicalContext: 'Real Cultural Context: Representative of neighborhood tea shop stalwarts across Madras who know every neighbor and delivery run.',
            gameLore: 'Game Story: First ally after the courthouse incident; guides the player towards driver Velu and the southern route.',
            discovered: true,
            discoveredAt: Date.now()
        },
        char_velu_auto: {
            id: 'char_velu_auto',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Velu (மதராஸ் ஆட்டோ வேலு)',
            tamilTitle: 'மதராஸ் ஆட்டோ ஓட்டுநர் வேலு',
            region: 'george_town',
            hint: 'Veteran auto-rickshaw driver navigating the narrow alleys of North Madras.',
            historicalContext: 'Real Cultural Context: Chennai auto drivers are famous for their unmatched mental maps of the city and rapid transit navigation.',
            gameLore: 'Game Story: Observed the Enfield getaway motorcycle speeding southeast towards the delta highway.',
            discovered: true,
            discoveredAt: Date.now()
        },
        char_selvam_delta: {
            id: 'char_selvam_delta',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Farmer Selvam (விவசாயி செல்வம்)',
            tamilTitle: 'காவிரி டெல்டா விவசாயி செல்வம்',
            region: 'cauvery_delta',
            hint: 'Paddy farmer and custodian of the heritage river irrigation distributary channel.',
            historicalContext: 'Real Cultural Context: Delta farmers possess ancestral knowledge of channel sluices, canal silt management, and water-sharing customs.',
            gameLore: 'Game Story: Helps repair the irrigation channel and reveals the ancient waterwheel location.',
            discovered: false,
            discoveredAt: null
        }
    };

    window.CODEX_DATA = {
        SECTIONS: CODEX_SECTIONS,
        ENTRIES: CODEX_ENTRIES
    };
})();
