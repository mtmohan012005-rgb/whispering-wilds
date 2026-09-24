// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DISCOVERY DATA
// Authoritative catalog across 10 discovery categories.
// Physical world coordinates, regions, and inspection requirements.
// ============================================================================

(function() {
    const DISCOVERY_CATEGORIES = {
        LOCATION: 'LOCATION',
        LANDMARK: 'LANDMARK',
        CULTURE: 'CULTURE',
        WILDLIFE: 'WILDLIFE',
        FOOD: 'FOOD',
        CRAFT: 'CRAFT',
        ARCHITECTURE: 'ARCHITECTURE',
        FESTIVAL: 'FESTIVAL',
        HIDDEN_AREA: 'HIDDEN_AREA',
        STORY: 'STORY'
    };

    const DISCOVERIES = {
        // --- GEORGE TOWN ---
        disc_gt_court: {
            id: 'disc_gt_court',
            name: 'Madras High Court Gate',
            tamilName: 'உயர்நீதிமன்ற வாசல்',
            category: DISCOVERY_CATEGORIES.LANDMARK,
            region: 'george_town',
            position: { x: 220, y: 0, z: 630 },
            description: 'Grand red minaret entrance where the inciting parchment theft occurred.',
            discovered: true,
            discoveredAt: Date.now(),
            evidence: 'clue_torn_blueprint',
            photoRequired: false
        },
        disc_gt_murugan_stall: {
            id: 'disc_gt_murugan_stall',
            name: 'Murugan Tea Kadai',
            tamilName: 'முருகன் டீ கடை',
            category: DISCOVERY_CATEGORIES.LOCATION,
            region: 'george_town',
            position: { x: 5, y: 0, z: -10 },
            description: 'Roadside tea stall where cutting chai and regional rumors are exchanged.',
            discovered: true,
            discoveredAt: Date.now(),
            evidence: null,
            photoRequired: false
        },
        disc_gt_hidden_rooftop: {
            id: 'disc_gt_hidden_rooftop',
            name: 'Old Broadway Rooftop Viewpoint',
            tamilName: 'பிராட்வே மேல்மாடி வியூபாயிண்ட்',
            category: DISCOVERY_CATEGORIES.HIDDEN_AREA,
            region: 'george_town',
            position: { x: -35, y: 12, z: -40 },
            description: 'A secluded vantage point offering a sweeping view of George Town market lanes.',
            discovered: false,
            discoveredAt: null,
            evidence: null,
            photoRequired: true
        },

        // --- CAUVERY DELTA ---
        disc_delta_field: {
            id: 'disc_delta_field',
            name: 'Thiruvaiyaru Emerald Paddy Fields',
            tamilName: 'திருவையாறு நெல் வயல்',
            category: DISCOVERY_CATEGORIES.LOCATION,
            region: 'cauvery_delta',
            position: { x: 30, y: 0, z: 50 },
            description: 'Lush green agricultural basin sustained by ancestral irrigation channels.',
            discovered: false,
            discoveredAt: null,
            evidence: null,
            photoRequired: false
        },
        disc_delta_waterwheel: {
            id: 'disc_delta_waterwheel',
            name: 'Ancient Chola Lotus Sluice',
            tamilName: 'பண்டைய சோழர் தாமரை மதகு',
            category: DISCOVERY_CATEGORIES.LANDMARK,
            region: 'cauvery_delta',
            position: { x: 3200, y: 0, z: 500 },
            description: 'Hydraulic stone dial mechanism regulating water flow into hidden canals.',
            discovered: false,
            discoveredAt: null,
            evidence: 'clue_waterwheel_glyph',
            photoRequired: false
        },

        // --- PICHAVARAM ---
        disc_pichavaram_dock: {
            id: 'disc_pichavaram_dock',
            name: 'Pichavaram Mangrove Jetty',
            tamilName: 'பிச்சாவரம் படகுத்துறை',
            category: DISCOVERY_CATEGORIES.LOCATION,
            region: 'pichavaram',
            position: { x: -15, y: 0, z: 130 },
            description: 'Wooden landing where rowboats embark into the tidal mangrove canals.',
            discovered: false,
            discoveredAt: null,
            evidence: null,
            photoRequired: false
        },
        disc_pichavaram_hidden_channel: {
            id: 'disc_pichavaram_hidden_channel',
            name: 'Sunken Stilt Root Channel',
            tamilName: 'மறைக்கப்பட்ட வேர் சுரங்கக் கால்வாய்',
            category: DISCOVERY_CATEGORIES.HIDDEN_AREA,
            region: 'pichavaram',
            position: { x: 45, y: 0, z: 180 },
            description: 'Narrow mangrove corridor sheltered under arched stilt roots.',
            discovered: false,
            discoveredAt: null,
            evidence: 'clue_boat_tread',
            photoRequired: true
        },

        // --- CHETTINAD ---
        disc_chettinad_mansion: {
            id: 'disc_chettinad_mansion',
            name: 'Kanadukathan Courtyard Palace',
            tamilName: 'கானாடுகாத்தான் அரண்மனை இல்லம்',
            category: DISCOVERY_CATEGORIES.ARCHITECTURE,
            region: 'chettinad',
            position: { x: 120, y: 0, z: -80 },
            description: 'Grand heritage mansion with carved Burma teak pillars and Athangudi floors.',
            discovered: false,
            discoveredAt: null,
            evidence: null,
            photoRequired: false
        },
        disc_chettinad_secret_room: {
            id: 'disc_chettinad_secret_room',
            name: 'Sealed Attic Record Chamber',
            tamilName: 'பூட்டப்பட்ட பரண் ஆவண அறை',
            category: DISCOVERY_CATEGORIES.HIDDEN_AREA,
            region: 'chettinad',
            position: { x: 135, y: 6, z: -75 },
            description: 'A discreet storage alcove behind the prayer room preserving old trade folios.',
            discovered: false,
            discoveredAt: null,
            evidence: 'clue_trade_ledger',
            photoRequired: false
        },

        // --- THANJAVUR ---
        disc_thanjavur_workshop: {
            id: 'disc_thanjavur_workshop',
            name: 'Swamimalai Master Bronze Workshop',
            tamilName: 'சுவாமிமலை சிற்பக்கூட பட்டறை',
            category: DISCOVERY_CATEGORIES.CRAFT,
            region: 'thanjavur',
            position: { x: 60, y: 0, z: 110 },
            description: 'Open courtyard forge where lost-wax bronzes are hand-cast by master sthapathis.',
            discovered: false,
            discoveredAt: null,
            evidence: 'clue_chola_seal',
            photoRequired: false
        },

        // --- MAMALLAPURAM ---
        disc_mamallapuram_cliffs: {
            id: 'disc_mamallapuram_cliffs',
            name: 'Shore Temple Sea Cliffs',
            tamilName: 'கடற்கரை பாறை வியூபாயிண்ட்',
            category: DISCOVERY_CATEGORIES.LANDMARK,
            region: 'mamallapuram',
            position: { x: -80, y: 0, z: 200 },
            description: 'Monolithic granite rocks carved by 7th-century Pallava sculptors facing the surf.',
            discovered: false,
            discoveredAt: null,
            evidence: null,
            photoRequired: true
        },

        // --- NILGIRIS ---
        disc_nilgiris_mist_trail: {
            id: 'disc_nilgiris_mist_trail',
            name: 'Doddabetta High Mist Trail',
            tamilName: 'தொட்டபெட்டா மலை முகடு பாதை',
            category: DISCOVERY_CATEGORIES.LOCATION,
            region: 'nilgiris',
            position: { x: 4950, y: 30, z: 350 },
            description: 'Winding mountain path shrouded in Nilgiri mist, flanked by shola rainforest trees.',
            discovered: false,
            discoveredAt: null,
            evidence: null,
            photoRequired: false
        },
        disc_nilgiris_sanctuary_portal: {
            id: 'disc_nilgiris_sanctuary_portal',
            name: 'Pasumai Thadam Eco-Sanctuary Archway',
            tamilName: 'பசுமைத் தடம் புகலிட நுழைவாயில்',
            category: DISCOVERY_CATEGORIES.HIDDEN_AREA,
            region: 'final_sanctuary',
            position: { x: 5600, y: 34, z: 520 },
            description: 'Ancient stone and moss archway leading into the undisturbed botanical haven.',
            discovered: false,
            discoveredAt: null,
            evidence: 'clue_sanctuary_key',
            photoRequired: true
        }
    };

    window.DISCOVERY_DATA = {
        CATEGORIES: DISCOVERY_CATEGORIES,
        LIST: DISCOVERIES
    };
})();
