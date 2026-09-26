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

        // --- CHARACTERS (12 Production Archetypes of Tamil Nadu) ---
        char_karthik_chennai: {
            id: 'char_karthik_chennai',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Karthik (சென்னை இளைஞர் கார்த்திக்)',
            tamilTitle: 'சென்னை இளைஞர் கார்த்திக்',
            region: 'george_town',
            hint: 'Young urban professional in casual collared shirt and trousers, sharp observant stance.',
            historicalContext: 'Real Cultural Context: Modern Chennai youth embody the bridge between Tamil heritage and rapid tech/urban growth, frequenting historic George Town markets as easily as modern IT corridors.',
            gameLore: 'Game Story: A researcher who noticed discrepancies in the digitized land surveys of North Madras before the courthouse theft.',
            discovered: true,
            discoveredAt: Date.now()
        },
        char_murugan: {
            id: 'char_murugan',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Murugan Annan (டீ கடை & மளிகை முருகன்)',
            tamilTitle: 'டீ கடை முருகன் அண்ணன்',
            region: 'george_town',
            hint: 'Middle-aged shopkeeper in checked shirt, spectacles, mustache, and money waist pouch.',
            historicalContext: 'Real Cultural Context: Neighborhood provision shop (Maligai Kadai) and tea stall owners form the beating heart of Tamil commercial communities, knowing daily rhythms and neighborhood gossip.',
            gameLore: 'Game Story: First key ally in George Town; his roadside tea kadai serves as the information clearinghouse for street movements.',
            discovered: true,
            discoveredAt: Date.now()
        },
        char_velu_auto: {
            id: 'char_velu_auto',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Guna / Velu (மதராஸ் ஆட்டோ வேலு)',
            tamilTitle: 'மதராஸ் ஆட்டோ ஓட்டுநர் வேலு',
            region: 'george_town',
            hint: 'Wiry veteran auto-rickshaw driver in plain tee, rolled trousers, pink neck towel, and sandals.',
            historicalContext: 'Real Cultural Context: Auto-rickshaw drivers of Chennai are renowned for their encyclopedic mental geography of winding alleys, backstreets, and coastal thoroughfares.',
            gameLore: 'Game Story: Witnessed the getaway vehicle speed through evening traffic towards the southern grand trunk road.',
            discovered: true,
            discoveredAt: Date.now()
        },
        char_selvam_delta: {
            id: 'char_selvam_delta',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Farmer Velan (காவிரி டெல்டா விவசாயி வேலன்)',
            tamilTitle: 'காவிரி டெல்டா விவசாயி வேலன்',
            region: 'cauvery_delta',
            hint: 'Weathered paddy farmer wearing a white folded veshti, cotton shirt, shoulder thundu, and sandals.',
            historicalContext: 'Real Cultural Context: Farmers of the Cauvery Delta are guardians of an ancient agricultural civilization, maintaining canal bunds, sluice gates, and seasonal paddy cycles.',
            gameLore: 'Game Story: Guides the explorer across the flooded paddy fields towards the submerged Chola sluice gate.',
            discovered: false,
            discoveredAt: null
        },
        char_selvam_fisherman: {
            id: 'char_selvam_fisherman',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Fisherman Selvam (கடற்கரை மீனவர் செல்வம்)',
            tamilTitle: 'கடற்கரை மீனவர் செல்வம்',
            region: 'mamallapuram',
            hint: 'Muscular coastal fisherman in checked lungi, head wrap, open shirt, holding coiled net and woven basket.',
            historicalContext: 'Real Cultural Context: Traditional Coromandel Coast fishermen navigate the open surf of the Bay of Bengal on catamarans, reading wind and swell patterns with ancestral intuition.',
            gameLore: 'Game Story: Knows every hidden sandbar and submerged rock reef around the Mamallapuram Shore Temple waters.',
            discovered: false,
            discoveredAt: null
        },
        char_meenakshi_tea: {
            id: 'char_meenakshi_tea',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Meenakshi (நீலகிரி தேயிலைத் தொழிலாளி மீனாட்சி)',
            tamilTitle: 'தேயிலைத் தோட்ட தொழிலாளி மீனாட்சி',
            region: 'nilgiris',
            hint: 'Plantation worker wearing a practical work skirt, protective wrap, head scarf, and cane tea basket.',
            historicalContext: 'Real Cultural Context: Hill-estate tea pluckers work steep misty slopes with rhythmic precision, plucking "two leaves and a bud" while navigating shifting highland weather.',
            gameLore: 'Game Story: Plucking high on the Doddabetta ridge, she spotted smoke rising from the forbidden Shola sanctuary trail.',
            discovered: false,
            discoveredAt: null
        },
        char_kavitha_villager: {
            id: 'char_kavitha_villager',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Kavitha (கிராமத்து பெண் கவிதா)',
            tamilTitle: 'டெல்டா கிராமத்து பெண் கவிதா',
            region: 'cauvery_delta',
            hint: 'Young adult woman draped in an earthy handloom cotton saree with subtle border, natural hair bun.',
            historicalContext: 'Real Cultural Context: Village women uphold community art and family heritage, crafting intricate geometric rice-flour kolams at dawn and managing herbal remedies.',
            gameLore: 'Game Story: Holds an heirloom brass measuring cup inscribed with Chola-era grain allotment numerals matching the sluice inscriptions.',
            discovered: false,
            discoveredAt: null
        },
        char_saraswathi_paati: {
            id: 'char_saraswathi_paati',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Saraswathi Paati (சரஸ்வதி பாட்டி)',
            tamilTitle: 'கிராமத்து மூதாட்டி சரஸ்வதி பாட்டி',
            region: 'cauvery_delta',
            hint: 'Elderly matriarch in soft cotton saree, silver bun, gentle wrinkled face, and polished wooden walking stick.',
            historicalContext: 'Real Cultural Context: Grandmothers (Paati) in Tamil culture are venerated lorekeepers, culinary mentors, and custodians of oral history and Siddha healing.',
            gameLore: 'Game Story: Recalls the folk ballad describing how the Chola king hid the flood emeralds behind the temple water gate during the great monsoon.',
            discovered: false,
            discoveredAt: null
        },
        char_anand_student: {
            id: 'char_anand_student',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Anand (கல்லூரி மாணவர் ஆனந்த்)',
            tamilTitle: 'கல்லூரி மாணவர் ஆனந்த்',
            region: 'george_town',
            hint: 'Energetic young student in casual denim, t-shirt, overshirt, sneakers, and canvas backpack.',
            historicalContext: 'Real Cultural Context: Tamil Nadu has one of India\'s highest higher-education gross enrollment ratios, with enthusiastic students filling libraries and tea stalls with spirited debate.',
            gameLore: 'Game Story: An archaeology undergrad whose handheld UV scanner helps identify hidden chisel marks on temple granite blocks.',
            discovered: false,
            discoveredAt: null
        },
        char_kandhasamy_artisan: {
            id: 'char_kandhasamy_artisan',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Kandhasamy Sthapathi (சிற்பக் கலைஞர் கந்தசாமி)',
            tamilTitle: 'பாரம்பரிய சிற்பக் கலைஞர் கந்தசாமி',
            region: 'thanjavur',
            hint: 'Master craftsman in traditional dhoti and simple shirt, holding a handmade pottery vessel with calloused hands.',
            historicalContext: 'Real Cultural Context: Hereditary artisans (Sthapathis and Kumbakars) preserve millenia-old sculpting, lost-wax metallurgy, and terracotta techniques codified in the Shilpa Shastras.',
            gameLore: 'Game Story: Reconstructs the broken terracotta seal found in the mangrove creek to reveal the crest of the maritime guild.',
            discovered: false,
            discoveredAt: null
        },
        char_sundaram_festive: {
            id: 'char_sundaram_festive',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Sundaram (திருவிழா பக்தர் சுந்தரம்)',
            tamilTitle: 'திருவிழா பக்தர் சுந்தரம்',
            region: 'chettinad',
            hint: 'Devotee in festive silk veshti with gold zari border, jasmine-marigold garland, and sacred forehead tilak.',
            historicalContext: 'Real Cultural Context: Tamil temple festivals (Thiruvizha) unite towns in song, nadaswaram music, and community feasts (annadhanam), celebrated with immaculate traditional dress.',
            gameLore: 'Game Story: Organizes the annual chariot procession through Chettinad, providing a crowd cover to enter the locked courtyard mansion.',
            discovered: false,
            discoveredAt: null
        },
        char_babu_mountain: {
            id: 'char_babu_mountain',
            section: CODEX_SECTIONS.CHARACTERS,
            title: 'Babu (நீலகிரி மலைத் தொழிலாளி பாபு)',
            tamilTitle: 'நீலகிரி மலைத் தொழிலாளி பாபு',
            region: 'nilgiris',
            hint: 'Highland worker in heavy wool shawl, sturdy cargo trousers, trekking boots, and climbing pick.',
            historicalContext: 'Real Cultural Context: Highland workers of the Nilgiris and Western Ghats brave cold montane rains, steep shola terrain, and wildlife encounters while guarding reserve forests and tea estates.',
            gameLore: 'Game Story: The only guide capable of leading the player through zero-visibility fog across the Shola-Grassland ridge to the summit sanctuary.',
            discovered: false,
            discoveredAt: null
        }
    };

    window.CODEX_DATA = {
        SECTIONS: CODEX_SECTIONS,
        ENTRIES: CODEX_ENTRIES
    };
})();
