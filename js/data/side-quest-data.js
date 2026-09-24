// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - REGIONAL SIDE QUEST DATA
// 5 Authored Regional Side Quests Grounded in Tamil Nadu Daily Life
// ============================================================================

(function() {
    const SIDE_QUESTS = [
        {
            id: 'sq_tea_before_sunset',
            title: 'Tea Before Sunset',
            tamilTitle: 'சூரிய அஸ்தமனத்திற்கு முன் தேநீர்',
            region: 'nilgiris',
            locationName: 'Doddabetta Tea Slopes',
            giver: 'Ramanathan (Estate Overseer)',
            summary: 'Deliver freshly handpicked first-flush green tea leaves to the vintage roasting shed before evening mist dampens the harvest.',
            steps: [
                { id: 'sq1_talk_ramanathan', description: 'Speak with overseer Ramanathan near the plantation weighing scale', done: false },
                { id: 'sq1_collect_harvest', description: 'Inspect the 3 bamboo harvest baskets on the terraced hillside', done: false },
                { id: 'sq1_deliver_shed', description: 'Deliver the leaves to the wood-fired drying shed within 3 minutes', done: false }
            ],
            rewards: {
                xp: 150,
                currency: 75,
                codexId: 'tea_culture',
                achievementProgress: { category: 'story_seeker', amount: 1 }
            },
            completed: false
        },
        {
            id: 'sq_the_quiet_dock',
            title: 'The Quiet Dock',
            tamilTitle: 'அமைதியான படகுத்துறை',
            region: 'pichavaram',
            locationName: 'Backwater Mangrove Pier',
            giver: 'Kaliappan (Boatman)',
            summary: 'Help Kaliappan untangle old coir fishing lines caught in the mangrove prop roots and recover his lost wooden oar.',
            steps: [
                { id: 'sq2_inspect_pier', description: 'Speak with boatman Kaliappan at the Pichavaram wooden pier', done: false },
                { id: 'sq2_clear_coir', description: 'Cut and free tangled coir line from the submerged Rhizophora roots', done: false },
                { id: 'sq2_recover_oar', description: 'Retrieve the carved teak wood oar drifting near the egret sanctuary', done: false },
                { id: 'sq2_return_kaliappan', description: 'Return the oar to Kaliappan and test boat balance', done: false }
            ],
            rewards: {
                xp: 180,
                currency: 90,
                codexId: 'mangrove_ecology',
                achievementProgress: { category: 'story_seeker', amount: 1 }
            },
            completed: false
        },
        {
            id: 'sq_the_empty_courtyard',
            title: 'The Empty Courtyard',
            tamilTitle: 'வெற்று முற்றம்',
            region: 'chettinad',
            locationName: 'Kanadukathan Valavu',
            giver: 'Meenakshi Aachi (Family Elder)',
            summary: 'Investigate the acoustic echo in the deserted central courtyard of an ancestral mansion and restore the rainwater drain filter.',
            steps: [
                { id: 'sq3_talk_aachi', description: 'Listen to Meenakshi Aachi recount the history of the Burma teak columns', done: false },
                { id: 'sq3_inspect_drain', description: 'Clear fallen leaves and lime mortar debris from the stone courtyard drainage grate', done: false },
                { id: 'sq3_check_acoustic', description: 'Stand at the center point and ring the brass prayer bell to verify acoustics', done: false }
            ],
            rewards: {
                xp: 200,
                currency: 120,
                codexId: 'chettinad_architecture',
                achievementProgress: { category: 'story_seeker', amount: 1 }
            },
            completed: false
        },
        {
            id: 'sq_stone_dust',
            title: 'Stone Dust',
            tamilTitle: 'கல் தூசு',
            region: 'mamallapuram',
            locationName: 'Shore Temple Sculptor Workshop',
            giver: 'Devanathan (Master Sculptor)',
            summary: 'Assist master artisan Devanathan in locating genuine granite polishing sand from the southern shoreline to finish a monolithic Nandi carving.',
            steps: [
                { id: 'sq4_meet_devanathan', description: 'Meet sculptor Devanathan at the Five Rathas outdoor carving yard', done: false },
                { id: 'sq4_gather_sand', description: 'Collect fine black mineral sand from the high-tide line south of Shore Temple', done: false },
                { id: 'sq4_demonstrate_polish', description: 'Hand the sand over and observe the traditional wet polishing technique', done: false }
            ],
            rewards: {
                xp: 220,
                currency: 110,
                codexId: 'granite_sculpture',
                achievementProgress: { category: 'story_seeker', amount: 1 }
            },
            completed: false
        },
        {
            id: 'sq_field_water',
            title: 'Field Water',
            tamilTitle: 'வயல் நீர்',
            region: 'cauvery_delta',
            locationName: 'Thiruvaiyaru Sluice Gates',
            giver: 'Muthusamy (Village Channel Guardian)',
            summary: 'Resolve an equitable water distribution dispute between upper and lower paddy bunds by checking stone level markers along the channel.',
            steps: [
                { id: 'sq5_talk_muthusamy', description: 'Confer with Muthusamy near the Grand Anicut secondary feeder channel', done: false },
                { id: 'sq5_inspect_gauges', description: 'Inspect 3 ancient stone water level gauges embedded along the masonry wall', done: false },
                { id: 'sq5_adjust_weir', description: 'Turn the wooden lever to balance water level across both irrigation branches', done: false }
            ],
            rewards: {
                xp: 250,
                currency: 150,
                codexId: 'kallanai_dam',
                achievementProgress: { category: 'story_seeker', amount: 1 }
            },
            completed: false
        }
    ];

    if (typeof window !== 'undefined') {
        window.SideQuestData = {
            SIDE_QUESTS: SIDE_QUESTS,
            getQuestById: function(id) {
                return SIDE_QUESTS.find(q => q.id === id) || null;
            },
            getQuestsByRegion: function(region) {
                return SIDE_QUESTS.filter(q => q.region === region);
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SIDE_QUESTS };
    }
})();
