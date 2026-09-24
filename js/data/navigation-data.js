// ============================================================================
// THE WHISPERING WILDS - NAVIGATION DATA & REGION DEFINITIONS
// ============================================================================

(function() {
    const REGION_STATES = {
        UNKNOWN: 'UNKNOWN',
        KNOWN: 'KNOWN',
        DISCOVERED: 'DISCOVERED',
        UNLOCKED: 'UNLOCKED',
        VISITED: 'VISITED',
        COMPLETED: 'COMPLETED'
    };

    const ROUTE_TYPES = {
        ROAD: 'ROAD',
        TRAIL: 'TRAIL',
        FIELD_PATH: 'FIELD_PATH',
        FOREST_PATH: 'FOREST_PATH',
        COAST_PATH: 'COAST_PATH',
        WATER_ROUTE: 'WATER_ROUTE',
        MOUNTAIN_PATH: 'MOUNTAIN_PATH'
    };

    const WORLD_REGIONS = {
        GEORGE_TOWN: {
            id: 'GEORGE_TOWN',
            name: 'George Town, Madras',
            displayName: 'ஜார்ஜ் டவுன் (George Town)',
            bounds: { minX: -100, maxX: 100, minZ: -120, maxZ: 20 },
            initialState: 'VISITED',
            signposts: [
                { id: 'sign_gt_broadway', ta: 'பாரிமுனை பேருந்து நிலையம்', en: 'Broadway Bus Stand', pos: { x: -20, y: 0, z: -80 } },
                { id: 'sign_gt_tea', ta: 'முருகன் அண்ணன் டீக்கடை', en: "Murugan's Tea Kadai", pos: { x: 5, y: 0, z: -10 } }
            ]
        },
        CAUVERY_DELTA: {
            id: 'CAUVERY_DELTA',
            name: 'Cauvery River Delta',
            displayName: 'காவிரி டெல்டா (Cauvery Delta)',
            bounds: { minX: -150, maxX: 150, minZ: 10, maxZ: 100 },
            initialState: 'KNOWN',
            signposts: [
                { id: 'sign_delta_sluice', ta: 'சோழர் பாசன மதகு', en: 'Chola Irrigation Sluice', pos: { x: 20, y: 0, z: 45 } },
                { id: 'sign_delta_kallanai', ta: 'கல்லணை நோக்கிய வழி', en: 'Way to Grand Anicut (Kallanai)', pos: { x: -60, y: 0, z: 30 } }
            ]
        },
        PICHAVARAM: {
            id: 'PICHAVARAM',
            name: 'Pichavaram Mangrove Forest',
            displayName: 'பிச்சாவரம் அலையாத்தி காடு (Pichavaram)',
            bounds: { minX: -120, maxX: 120, minZ: 90, maxZ: 250 },
            initialState: 'UNKNOWN',
            requiresBoat: true,
            signposts: [
                { id: 'sign_pich_dock', ta: 'படகுத் துறைமுகம்', en: 'Mangrove Boat Jetty', pos: { x: -10, y: 0, z: 120 } }
            ]
        },
        CHETTINAD: {
            id: 'CHETTINAD',
            name: 'Chettinad Heritage Region',
            displayName: 'செட்டிநாடு (Chettinad)',
            bounds: { minX: -80, maxX: 180, minZ: -20, maxZ: 90 },
            initialState: 'UNKNOWN',
            signposts: [
                { id: 'sign_chettinad_mansion', ta: 'ஆயிர ஜன்னல் வீடு', en: 'Thousand Windows Mansion', pos: { x: 50, y: 0, z: 40 } }
            ]
        },
        THANJAVUR: {
            id: 'THANJAVUR',
            name: 'Thanjavur Temple & Craft Heartland',
            displayName: 'தஞ்சாவூர் (Thanjavur)',
            bounds: { minX: -60, maxX: 140, minZ: 30, maxZ: 140 },
            initialState: 'UNKNOWN',
            signposts: [
                { id: 'sign_thanjavur_periya_kovil', ta: 'பெரிய கோவில் ராஜகோபுரம்', en: 'Brihadisvara Temple Gopuram', pos: { x: 40, y: 0, z: 80 } }
            ]
        },
        MAMALLAPURAM: {
            id: 'MAMALLAPURAM',
            name: 'Mamallapuram Coastal Rock Art',
            displayName: 'மாமல்லபுரம் (Mamallapuram)',
            bounds: { minX: -50, maxX: 80, minZ: -90, maxZ: -10 },
            initialState: 'UNKNOWN',
            signposts: [
                { id: 'sign_mama_shore_temple', ta: 'கடற்கரை கோவில்', en: 'Shore Temple', pos: { x: 30, y: 0, z: -50 } }
            ]
        },
        NILGIRIS: {
            id: 'NILGIRIS',
            name: 'Western Ghats & Nilgiri Hills',
            displayName: 'நீலகிரி மலைச்சாரல் (Nilgiris)',
            bounds: { minX: -220, maxX: -50, minZ: -40, maxZ: 80 },
            initialState: 'UNKNOWN',
            signposts: [
                { id: 'sign_nilgiri_tea', ta: 'தோட்டப் பாதை • கவனமாக செல்க', en: 'Tea Estate Trail • Tread Cautiously', pos: { x: -140, y: 0, z: 20 } }
            ]
        },
        FINAL_SANCTUARY: {
            id: 'FINAL_SANCTUARY',
            name: 'Sacred Grove of the Whispering Wilds',
            displayName: 'காட்டு வழி புனித வனம் (The Sacred Sanctuary)',
            bounds: { minX: -40, maxX: 40, minZ: 240, maxZ: 320 },
            initialState: 'UNKNOWN',
            signposts: []
        }
    };

    const WORLD_ROUTES = [
        {
            id: 'route_gt_to_delta',
            name: 'East Coast Highway to Cauvery Valley',
            type: 'ROAD',
            from: 'GEORGE_TOWN',
            to: 'CAUVERY_DELTA',
            distanceKm: 85,
            isDiscovered: true,
            isBlocked: false
        },
        {
            id: 'route_delta_to_pichavaram',
            name: 'Delta Canal to Mangrove Creek',
            type: 'WATER_ROUTE',
            from: 'CAUVERY_DELTA',
            to: 'PICHAVARAM',
            distanceKm: 42,
            isDiscovered: false,
            isBlocked: true, // Requires boat access
            blockReason: 'Requires boat rental or fisherman guidance'
        },
        {
            id: 'route_delta_to_thanjavur',
            name: 'Paddy Way to Grand Temple',
            type: 'FIELD_PATH',
            from: 'CAUVERY_DELTA',
            to: 'THANJAVUR',
            distanceKm: 35,
            isDiscovered: false,
            isBlocked: false
        },
        {
            id: 'route_thanjavur_to_chettinad',
            name: 'Heritage Clay Road',
            type: 'ROAD',
            from: 'THANJAVUR',
            to: 'CHETTINAD',
            distanceKm: 60,
            isDiscovered: false,
            isBlocked: false
        },
        {
            id: 'route_gt_to_mamallapuram',
            name: 'Coromandel Coastal Shore Path',
            type: 'COAST_PATH',
            from: 'GEORGE_TOWN',
            to: 'MAMALLAPURAM',
            distanceKm: 55,
            isDiscovered: false,
            isBlocked: false
        },
        {
            id: 'route_delta_to_nilgiris',
            name: 'Ghat Ascent Mountain Route',
            type: 'MOUNTAIN_PATH',
            from: 'CAUVERY_DELTA',
            to: 'NILGIRIS',
            distanceKm: 160,
            isDiscovered: false,
            isBlocked: true,
            blockReason: 'Requires warm clothing and mountain permit'
        }
    ];

    window.NAVIGATION_DATA = {
        STATES: REGION_STATES,
        ROUTE_TYPES,
        REGIONS: WORLD_REGIONS,
        ROUTES: WORLD_ROUTES
    };
})();
