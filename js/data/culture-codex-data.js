// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - CULTURE CODEX DATA
// 10 Cultural Categories: CLOTHING, ARCHITECTURE, HOUSEHOLD, AGRICULTURE,
// FISHING, CRAFT, FOOD, FESTIVAL, TRANSPORT, DAILY_LIFE.
// Strictly Distinguishes Real Cultural Heritage from Fictional Game Mystery.
// ============================================================================

(function() {
    const CULTURE_CATEGORIES = {
        CLOTHING: 'CLOTHING',
        ARCHITECTURE: 'ARCHITECTURE',
        HOUSEHOLD: 'HOUSEHOLD',
        AGRICULTURE: 'AGRICULTURE',
        FISHING: 'FISHING',
        CRAFT: 'CRAFT',
        FOOD: 'FOOD',
        FESTIVAL: 'FESTIVAL',
        TRANSPORT: 'TRANSPORT',
        DAILY_LIFE: 'DAILY_LIFE'
    };

    const CULTURE_ENTRIES = {
        veshti: {
            id: 'culture_veshti',
            title: 'Handloom Cotton Veshti (வேட்டி)',
            tamilTitle: 'கைத்தறி பருத்தி வேட்டி',
            category: CULTURE_CATEGORIES.CLOTHING,
            region: 'george_town',
            realContext: 'Real Cultural Context: Traditional unstitched white cotton lower garment worn across Tamil Nadu, secured at the waist and folded up (madichu kattu) for ease of manual work and walking.',
            gameStory: 'Game Story: The protagonist\'s starting garment, reflecting everyday working attire suited for warm coastal climates.',
            discovered: true,
            discoveredAt: Date.now()
        },
        thundu: {
            id: 'culture_thundu',
            title: 'Cotton Shoulder Cloth / Towel (துண்டு)',
            tamilTitle: 'பருத்தித் துண்டு',
            category: CULTURE_CATEGORIES.CLOTHING,
            region: 'george_town',
            realContext: 'Real Cultural Context: A practical, lightweight cotton cloth draped over the shoulder, used to shield against the blazing sun, wipe sweat during physical labor, or folded neatly as a sign of respect.',
            gameStory: 'Game Story: Kept close by the explorer while examining sun-drenched dusty street corners.',
            discovered: true,
            discoveredAt: Date.now()
        },
        kolam: {
            id: 'culture_kolam',
            title: 'Rice-Flour Threshold Kolam (அரிசி மாவு கோலம்)',
            tamilTitle: 'அரிசி மாவு கோலம்',
            category: CULTURE_CATEGORIES.DAILY_LIFE,
            region: 'george_town',
            realContext: 'Real Cultural Context: Geometric floor drawings crafted at dawn outside Tamil home entrances using edible raw rice powder, welcoming prosperity and providing sustenance for ants and small birds.',
            gameStory: 'Game Story: A subtle dot-grid kolam pattern outside the antique shop provided an orientation clue.',
            discovered: false,
            discoveredAt: null
        },
        kuthu_vilakku: {
            id: 'culture_kuthu_vilakku',
            title: 'Brass Standing Lamp (குத்துவிளக்கு)',
            tamilTitle: 'பாரம்பரிய பித்தளைக் குத்துவிளக்கு',
            category: CULTURE_CATEGORIES.HOUSEHOLD,
            region: 'chettinad',
            realContext: 'Real Cultural Context: A heavy cast-brass standing oil lamp with five wick notches, lit during auspicious occasions and dusk prayers to bring warm, steady illumination into the home.',
            gameStory: 'Game Story: Found inside the Chettinad prayer room, its heavy brass base concealed an ancient wax seal imprint.',
            discovered: false,
            discoveredAt: null
        },
        brass_vessels: {
            id: 'culture_brass_vessels',
            title: 'Handcrafted Brass & Bronze Uruli Vessels',
            tamilTitle: 'பித்தளை பாத்திரங்கள் & உருளி',
            category: CULTURE_CATEGORIES.HOUSEHOLD,
            region: 'thanjavur',
            realContext: 'Real Cultural Context: Heavy circular cookware and water vessels forged from copper-zinc brass, traditionally prized across South Indian households for even heat distribution and durability.',
            gameStory: 'Game Story: Stacked on the artisan\'s table, used to compare alloy purity with the recovered artifact fragment.',
            discovered: false,
            discoveredAt: null
        },
        palm_leaf_basket: {
            id: 'culture_palm_leaf_basket',
            title: 'Woven Palmyra Leaf Basket (பனை ஓலைக் கூடை)',
            tamilTitle: 'பனை ஓலைக் கூடை',
            category: CULTURE_CATEGORIES.CRAFT,
            region: 'cauvery_delta',
            realContext: 'Real Cultural Context: Woven from dried fronds of the Asian Palmyra palm (the state tree of Tamil Nadu), serving as lightweight, biodegradable containers for seeds, flowers, and grains.',
            gameStory: 'Game Story: Used by farmer Selvam to store dried heritage paddy seeds near the irrigation channel.',
            discovered: false,
            discoveredAt: null
        },
        irrigation_sluice: {
            id: 'culture_irrigation_sluice',
            title: 'Cauvery River Sluice Gate (மதகு)',
            tamilTitle: 'காவிரி பாசன மதகு',
            category: CULTURE_CATEGORIES.AGRICULTURE,
            region: 'cauvery_delta',
            realContext: 'Real Cultural Context: Precision masonry and timber regulator gates dividing river currents into delta branch canals (vaikkal) to sustain multi-crop paddy cycles.',
            gameStory: 'Game Story: A jammed sluice blocked water flow and hid the sunken Chola waterway entrance.',
            discovered: false,
            discoveredAt: null
        },
        wooden_boat: {
            id: 'culture_wooden_boat',
            title: 'Teak Pichavaram Rowboat (மரப் படகு)',
            tamilTitle: 'மரப் படகு',
            category: CULTURE_CATEGORIES.FISHING,
            region: 'pichavaram',
            realContext: 'Real Cultural Context: Flat-bottomed wooden boats propelled with long punting poles, engineered specifically to glide over shallow estuary mudbanks without snapping mangrove roots.',
            gameStory: 'Game Story: Required to safely navigate the maze-like creeks towards the syndicate\'s concealed mooring.',
            discovered: false,
            discoveredAt: null
        },
        athangudi_tiles: {
            id: 'culture_athangudi_tiles',
            title: 'Athangudi Floral Palace Tiles',
            tamilTitle: 'ஆத்தங்குடி பூவேலை ஓடுகள்',
            category: CULTURE_CATEGORIES.ARCHITECTURE,
            region: 'chettinad',
            realContext: 'Real Cultural Context: Handmade encaustic cement tiles cast on glass plates using metallic oxides and local sand, celebrated for vibrant floral and geometric symmetry.',
            gameStory: 'Game Story: A hollow-sounding floor tile indicated the presence of the hidden cellar compartment.',
            discovered: false,
            discoveredAt: null
        },
        chettinad_courtyard_house: {
            id: 'culture_chettinad_courtyard_house',
            title: 'Chettinad Valavu Courtyard Mansion',
            tamilTitle: 'செட்டிநாடு வளவு இல்லம்',
            category: CULTURE_CATEGORIES.ARCHITECTURE,
            region: 'chettinad',
            realContext: 'Real Cultural Context: Traditional mansion design built around open interior lightwells (valavu), facilitating passive air convection and rainwater harvesting across extensive family quarters.',
            gameStory: 'Game Story: The main setting of Chapter III, where the antique merchant stored historical documents.',
            discovered: false,
            discoveredAt: null
        },
        tea_estate: {
            id: 'culture_tea_estate',
            title: 'High-Altitude Nilgiri Tea Terraces',
            tamilTitle: 'நீலகிரி தேயிலைத் தோட்டங்கள்',
            category: CULTURE_CATEGORIES.AGRICULTURE,
            region: 'nilgiris',
            realContext: 'Real Cultural Context: Terraced mountain hillside plantations introduced in the mid-19th century, renowned for producing fragrant, amber-colored orthodox black tea.',
            gameStory: 'Game Story: The slopes where tea worker Meenakshi recovered a dropped surveyor\'s compass.',
            discovered: false,
            discoveredAt: null
        },
        pongal_pot: {
            id: 'culture_pongal_pot',
            title: 'Decorated Terracotta Pongal Pot (பொங்கல் பானை)',
            tamilTitle: 'மங்கலப் பொங்கல் பானை',
            category: CULTURE_CATEGORIES.FESTIVAL,
            region: 'cauvery_delta',
            realContext: 'Real Cultural Context: Earthen clay pot tied with fresh turmeric ginger leaves, used to boil new harvest rice with jaggery and milk as the boiling froth overflows to shouts of "Pongalo Pongal!".',
            gameStory: 'Game Story: Witnessed during the harvest gathering in Cauvery Delta, recording cultural observations into the codex.',
            discovered: false,
            discoveredAt: null
        }
    };

    window.CULTURE_CODEX_DATA = {
        CATEGORIES: CULTURE_CATEGORIES,
        ENTRIES: CULTURE_ENTRIES
    };
})();
