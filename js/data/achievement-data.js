// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ACHIEVEMENT DATA
// Structured across 9 categories, rewarding observation, story and exploration.
// NO grinding, NO arbitrary percentage counters, strict customization limit preserved.
// ============================================================================

(function() {
    const ACHIEVEMENT_CATEGORIES = {
        STORY: 'STORY',
        EXPLORATION: 'EXPLORATION',
        WILDLIFE: 'WILDLIFE',
        CULTURE: 'CULTURE',
        PHOTOGRAPHY: 'PHOTOGRAPHY',
        PUZZLES: 'PUZZLES',
        CRAFTING: 'CRAFTING',
        SURVIVAL: 'SURVIVAL',
        DISCOVERY: 'DISCOVERY'
    };

    const COSMETIC_TITLES = {
        EXPLORER: { id: 'title_explorer', name: 'Explorer', tamilName: 'வழிப்போக்கர்' },
        FIELD_OBSERVER: { id: 'title_field_observer', name: 'Field Observer', tamilName: 'கள ஆய்வாளர்' },
        STORY_SEEKER: { id: 'title_story_seeker', name: 'Story Seeker', tamilName: 'வரலாறு தேடுபவர்' },
        WILDLIFE_WATCHER: { id: 'title_wildlife_watcher', name: 'Wildlife Watcher', tamilName: 'வன விலங்கு பார்வையாளர்' },
        HERITAGE_DISCOVERER: { id: 'title_heritage_discoverer', name: 'Heritage Discoverer', tamilName: 'பாரம்பரியம் அறிபவர்' },
        MOUNTAIN_WALKER: { id: 'title_mountain_walker', name: 'Mountain Walker', tamilName: 'மலை வழி நடப்பவர்' }
    };

    const ACHIEVEMENTS = [
        // --- STORY ACHIEVEMENTS ---
        {
            id: 'ach_first_clue',
            title: 'First Clue',
            tamilTitle: 'முதல் தடம்',
            description: 'Discover the first major investigation clue in George Town.',
            category: ACHIEVEMENT_CATEGORIES.STORY,
            hidden: false,
            requirement: { type: 'story_clue', target: 'clue_torn_blueprint', count: 1 },
            reward: { type: 'currency', value: 15, title: 'Story Seeker' },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_following_trail',
            title: 'Following the Trail',
            tamilTitle: 'தொடரும் தடம்',
            description: 'Complete the first investigation chapter.',
            category: ACHIEVEMENT_CATEGORIES.STORY,
            hidden: false,
            requirement: { type: 'chapter_completed', target: 'chapter_1', count: 1 },
            reward: { type: 'badge', value: 'badge_chapter_1', title: 'Explorer' },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_above_mist',
            title: 'Above the Mist',
            tamilTitle: 'பனி மூட்டத்திற்கு மேலே',
            description: 'Reach the Nilgiris story chapter.',
            category: ACHIEVEMENT_CATEGORIES.STORY,
            hidden: false,
            requirement: { type: 'chapter_started', target: 'chapter_6', count: 1 },
            reward: { type: 'title', title: 'Mountain Walker' },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_into_sanctuary',
            title: 'Into the Sanctuary',
            tamilTitle: 'புகலிடத்தின் உள்ளே',
            description: 'Enter the final sanctuary through legitimate path resolution.',
            category: ACHIEVEMENT_CATEGORIES.STORY,
            hidden: true,
            requirement: { type: 'region_unlocked', target: 'final_sanctuary', count: 1 },
            reward: { type: 'badge', value: 'badge_sanctuary_keeper', currency: 50 },
            completed: false,
            completedAt: null
        },

        // --- EXPLORATION ACHIEVEMENTS ---
        {
            id: 'ach_george_town_walker',
            title: 'George Town Walker',
            tamilTitle: 'ஜார்ஜ் டவுன் உலாவி',
            description: 'Explore the required starting district landmarks.',
            category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
            hidden: false,
            requirement: { type: 'location_count', region: 'george_town', count: 3 },
            reward: { type: 'title', title: 'Explorer' },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_delta_wanderer',
            title: 'Delta Wanderer',
            tamilTitle: 'காவிரி டெல்டா யாத்ரிகர்',
            description: 'Discover selected Cauvery Delta rural farm locations.',
            category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
            hidden: false,
            requirement: { type: 'location_count', region: 'cauvery_delta', count: 3 },
            reward: { type: 'currency', value: 20 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_through_mangroves',
            title: 'Through the Mangroves',
            tamilTitle: 'சுந்தரவன நீர்வழியே',
            description: 'Travel through Pichavaram waterways on boat.',
            category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
            hidden: false,
            requirement: { type: 'waterway_traversed', target: 'pichavaram_canals', count: 1 },
            reward: { type: 'currency', value: 25 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_stone_and_sea',
            title: 'Stone and Sea',
            tamilTitle: 'கல்லும் கடலும்',
            description: 'Discover the required Mamallapuram coastal heritage locations.',
            category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
            hidden: false,
            requirement: { type: 'location_count', region: 'mamallapuram', count: 2 },
            reward: { type: 'title', title: 'Heritage Discoverer' },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_mountain_paths',
            title: 'Mountain Paths',
            tamilTitle: 'மலைப்பாதைகள்',
            description: 'Discover selected Nilgiri high-altitude trails.',
            category: ACHIEVEMENT_CATEGORIES.EXPLORATION,
            hidden: false,
            requirement: { type: 'location_count', region: 'nilgiris', count: 3 },
            reward: { type: 'currency', value: 30 },
            completed: false,
            completedAt: null
        },

        // --- WILDLIFE ACHIEVEMENTS ---
        {
            id: 'ach_quiet_observer',
            title: 'Quiet Observer',
            tamilTitle: 'அமைதியான பார்வையாளர்',
            description: 'Successfully observe a wildlife species without disturbing it.',
            category: ACHIEVEMENT_CATEGORIES.WILDLIFE,
            hidden: false,
            requirement: { type: 'wildlife_observed', count: 1 },
            reward: { type: 'title', title: 'Field Observer' },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_mountain_watcher',
            title: 'Mountain Watcher',
            tamilTitle: 'வரையாடு கண்காணிப்பாளர்',
            description: 'Observe the endangered Nilgiri Tahr in its native crags.',
            category: ACHIEVEMENT_CATEGORIES.WILDLIFE,
            hidden: false,
            requirement: { type: 'species_observed', target: 'nilgiri_tahr', count: 1 },
            reward: { type: 'title', title: 'Wildlife Watcher', currency: 25 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_forest_presence',
            title: 'Forest Presence',
            tamilTitle: 'காட்டுயிரின் வரவு',
            description: 'Observe a Western Ghats wildlife species in the deep canopy.',
            category: ACHIEVEMENT_CATEGORIES.WILDLIFE,
            hidden: false,
            requirement: { type: 'biome_wildlife_observed', target: 'western_ghats', count: 2 },
            reward: { type: 'currency', value: 20 },
            completed: false,
            completedAt: null
        },

        // --- CULTURE ACHIEVEMENTS ---
        {
            id: 'ach_local_detail',
            title: 'Local Detail',
            tamilTitle: 'உள்ளூர் கலைக்கூறு',
            description: 'Discover your first authentic Tamil Nadu cultural object.',
            category: ACHIEVEMENT_CATEGORIES.CULTURE,
            hidden: false,
            requirement: { type: 'culture_discovered', count: 1 },
            reward: { type: 'currency', value: 10 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_living_traditions',
            title: 'Living Traditions',
            tamilTitle: 'வாழும் மரபுகள்',
            description: 'Discover a configured set of cultural-life entries across Tamil Nadu.',
            category: ACHIEVEMENT_CATEGORIES.CULTURE,
            hidden: false,
            requirement: { type: 'culture_count', count: 5 },
            reward: { type: 'title', title: 'Heritage Discoverer', currency: 30 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_festival_evening',
            title: 'Festival Evening',
            tamilTitle: 'திருவிழா மாலை',
            description: 'Experience a configured festival celebration.',
            category: ACHIEVEMENT_CATEGORIES.CULTURE,
            hidden: false,
            requirement: { type: 'festival_participated', target: 'PONGAL', count: 1 },
            reward: { type: 'badge', value: 'badge_pongal_participant' },
            completed: false,
            completedAt: null
        },

        // --- PHOTOGRAPHY ACHIEVEMENTS ---
        {
            id: 'ach_first_frame',
            title: 'First Frame',
            tamilTitle: 'முதல் புகைப்படம்',
            description: 'Take your first valid field photograph.',
            category: ACHIEVEMENT_CATEGORIES.PHOTOGRAPHY,
            hidden: false,
            requirement: { type: 'photo_taken', count: 1 },
            reward: { type: 'currency', value: 10 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_field_notes',
            title: 'Field Notes',
            tamilTitle: 'களக் குறிப்பேடு படங்கள்',
            description: 'Photograph several regional subjects across different biomes.',
            category: ACHIEVEMENT_CATEGORIES.PHOTOGRAPHY,
            hidden: false,
            requirement: { type: 'photo_count', count: 3 },
            reward: { type: 'title', title: 'Field Observer' },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_wildlife_photographer',
            title: 'Wildlife Photographer',
            tamilTitle: 'வனவிலங்கு புகைப்படக் கலைஞர்',
            description: 'Capture confirmed photographs of wildlife species.',
            category: ACHIEVEMENT_CATEGORIES.PHOTOGRAPHY,
            hidden: false,
            requirement: { type: 'photo_wildlife_count', count: 2 },
            reward: { type: 'title', title: 'Wildlife Watcher', currency: 25 },
            completed: false,
            completedAt: null
        },

        // --- PUZZLE ACHIEVEMENTS ---
        {
            id: 'ach_turn_the_wheel',
            title: 'Turn the Wheel',
            tamilTitle: 'சுழலும் சோழர் சக்கரம்',
            description: 'Solve the Chola waterwheel hydro-mechanism puzzle.',
            category: ACHIEVEMENT_CATEGORIES.PUZZLES,
            hidden: false,
            requirement: { type: 'puzzle_solved', target: 'chola_waterwheel', count: 1 },
            reward: { type: 'currency', value: 35 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_mechanism',
            title: 'Mechanism',
            tamilTitle: 'பண்டைய நுட்பம்',
            description: 'Solve configured environmental puzzles.',
            category: ACHIEVEMENT_CATEGORIES.PUZZLES,
            hidden: false,
            requirement: { type: 'puzzle_count', count: 2 },
            reward: { type: 'badge', value: 'badge_puzzle_master' },
            completed: false,
            completedAt: null
        },

        // --- CRAFTING & SURVIVAL ACHIEVEMENTS ---
        {
            id: 'ach_artisan_hand',
            title: 'Artisan Hand',
            tamilTitle: 'கைவினைத் திறன்',
            description: 'Inspect authentic Thanjavur bronze casting tools and methods.',
            category: ACHIEVEMENT_CATEGORIES.CRAFTING,
            hidden: false,
            requirement: { type: 'craft_inspected', count: 1 },
            reward: { type: 'currency', value: 20 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_warm_fire',
            title: 'Warm Fire',
            tamilTitle: 'அனல் தரும் தீ',
            description: 'Build a campfire and pitch a tent during cold weather.',
            category: ACHIEVEMENT_CATEGORIES.SURVIVAL,
            hidden: false,
            requirement: { type: 'camp_rested', count: 1 },
            reward: { type: 'currency', value: 10 },
            completed: false,
            completedAt: null
        },
        {
            id: 'ach_master_explorer',
            title: 'Master Explorer',
            tamilTitle: 'பேராய்வாளர்',
            description: 'Discover entries across all 8 regions of Tamil Nadu.',
            category: ACHIEVEMENT_CATEGORIES.DISCOVERY,
            hidden: true,
            requirement: { type: 'all_regions_discovered', count: 8 },
            reward: { type: 'title', title: 'Heritage Discoverer', currency: 100 },
            completed: false,
            completedAt: null
        }
    ];

    window.ACHIEVEMENT_DATA = {
        CATEGORIES: ACHIEVEMENT_CATEGORIES,
        TITLES: COSMETIC_TITLES,
        LIST: ACHIEVEMENTS
    };
})();
