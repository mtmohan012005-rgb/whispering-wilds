// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - 7 CHAPTER MAIN STORY DATA
// Authoritative 7-chapter narrative arc across Tamil Nadu geography.
// Causal investigation progression, evidence links and conclusion milestones.
// ============================================================================

(function() {
    const MAIN_STORY_CHAPTERS = [
        {
            id: 'chapter_1',
            number: 'I',
            title: 'The Missing Trail',
            tamilTitle: 'காணாமல் போன தடம்',
            region: 'george_town',
            summary: 'Investigate the break-in at the historical archives outside Madras High Court and uncover the syndicate\'s departure trail.',
            objectives: [
                { id: 'ch1_inspect_courthouse', description: 'Inspect the broken gate at Madras High Court', done: false },
                { id: 'ch1_talk_murugan', description: 'Speak with Murugan Annan at the roadside tea kadai', done: false },
                { id: 'ch1_find_skid_mark', description: 'Photograph the vintage Royal Enfield tyre skid mark', done: false },
                { id: 'ch1_consult_velu', description: 'Consult auto driver Velu regarding the getaway direction', done: false }
            ],
            optionalObjectives: [
                { id: 'ch1_opt_street_ledger', description: 'Inspect discarded bill ledger in side alley', done: false }
            ],
            primaryEvidence: 'clue_torn_blueprint',
            unlockedRegion: 'cauvery_delta',
            completed: false
        },
        {
            id: 'chapter_2',
            number: 'II',
            title: 'Water Beneath the Roots',
            tamilTitle: 'வேர்களுக்குக் கீழே பாயும் நீர்',
            region: 'cauvery_delta',
            summary: 'Journey south into the fertile Cauvery basin and Pichavaram mangroves to locate the submerged Chola sluice route.',
            objectives: [
                { id: 'ch2_meet_selvam', description: 'Meet farmer Selvam at Thiruvaiyaru paddy fields', done: false },
                { id: 'ch2_restore_sluice', description: 'Clear irrigation channel blockage to restore river flow', done: false },
                { id: 'ch2_solve_waterwheel', description: 'Align the dual lotus dials of the Chola waterwheel', done: false },
                { id: 'ch2_boat_creek', description: 'Navigate Pichavaram stilt root creeks on wooden boat', done: false }
            ],
            optionalObjectives: [
                { id: 'ch2_opt_observe_egret', description: 'Silently observe a Little Egret foraging on mudflats', done: false }
            ],
            primaryEvidence: 'clue_waterwheel_glyph',
            unlockedRegion: 'pichavaram',
            completed: false
        },
        {
            id: 'chapter_3',
            number: 'III',
            title: 'House of Empty Rooms',
            tamilTitle: 'வெற்று அறைகளின் மாளிகை',
            region: 'chettinad',
            summary: 'Investigate the palatial ancestral mansion of Kanadukathan to uncover the duplicate trade ledgers.',
            objectives: [
                { id: 'ch3_enter_courtyard', description: 'Gain entry to the central valavu courtyard', done: false },
                { id: 'ch3_inspect_tiles', description: 'Examine Athangudi patterned floor tiles for hidden latch', done: false },
                { id: 'ch3_recover_letters', description: 'Recover trade correspondence from the attic chamber', done: false }
            ],
            optionalObjectives: [
                { id: 'ch3_opt_kuthu_vilakku', description: 'Inspect antique brass kuthu vilakku base imprint', done: false }
            ],
            primaryEvidence: 'clue_trade_ledger',
            unlockedRegion: 'chettinad',
            completed: false
        },
        {
            id: 'chapter_4',
            number: 'IV',
            title: 'The Artisan\'s Mark',
            tamilTitle: 'சிற்பியின் அடையாளம்',
            region: 'thanjavur',
            summary: 'Consult master bronze casters in Swamimalai to decipher the metallic alloy seal recovered from the crime scene.',
            objectives: [
                { id: 'ch4_visit_foundry', description: 'Visit the Swamimalai master bronze workshop', done: false },
                { id: 'ch4_compare_alloys', description: 'Analyze crucible purity against antique Chola bronze', done: false },
                { id: 'ch4_identify_maker', description: 'Trace the unique seal mark to a coastal consignment', done: false }
            ],
            optionalObjectives: [
                { id: 'ch4_opt_wax_demonstration', description: 'Observe traditional lost-wax sculpting demonstration', done: false }
            ],
            primaryEvidence: 'clue_chola_seal',
            unlockedRegion: 'thanjavur',
            completed: false
        },
        {
            id: 'chapter_5',
            number: 'V',
            title: 'Stone and Sea',
            tamilTitle: 'கல்லும் கடலும்',
            region: 'mamallapuram',
            summary: 'Track the coastal smuggling rendezvous point among 7th-century monolithic granite cliffs facing the Bay of Bengal.',
            objectives: [
                { id: 'ch5_survey_shore', description: 'Survey the coastal granite boulders near Shore Temple', done: false },
                { id: 'ch5_inspect_boat', description: 'Inspect abandoned catamaran on the sandy beach', done: false },
                { id: 'ch5_recover_manifest', description: 'Retrieve sea cargo manifest indicating mountain shipment', done: false }
            ],
            optionalObjectives: [
                { id: 'ch5_opt_coastal_photo', description: 'Photograph the shore temple silhouette at golden hour', done: false }
            ],
            primaryEvidence: 'clue_sea_manifest',
            unlockedRegion: 'mamallapuram',
            completed: false
        },
        {
            id: 'chapter_6',
            number: 'VI',
            title: 'Above the Mist',
            tamilTitle: 'பனி மூட்டத்திற்கு மேலே',
            region: 'nilgiris',
            summary: 'Ascend into the misty Western Ghats montane forests and tea estates to intercept the final sanctuary gateway.',
            objectives: [
                { id: 'ch6_ascend_ghats', description: 'Ascend the winding mountain highway into the Nilgiris', done: false },
                { id: 'ch6_meet_forest_guide', description: 'Confer with forest guide at the Doddabetta station', done: false },
                { id: 'ch6_observe_tahr', description: 'Confirm passage by locating the Nilgiri Tahr crag trail', done: false },
                { id: 'ch6_locate_gateway', description: 'Locate the ancient moss-covered stone archway', done: false }
            ],
            optionalObjectives: [
                { id: 'ch6_opt_tea_plantation', description: 'Help tea worker retrieve dropped collection basket', done: false }
            ],
            primaryEvidence: 'clue_sanctuary_key',
            unlockedRegion: 'nilgiris',
            completed: false
        },
        {
            id: 'chapter_7',
            number: 'VII',
            title: 'The Sanctuary',
            tamilTitle: 'பசுமைத் தடம் புகலிடம்',
            region: 'final_sanctuary',
            summary: 'Enter the hidden botanical sanctuary Pasumai Thadam, assemble all historical evidence, and preserve Tamil Nadu\'s sacred flora.',
            objectives: [
                { id: 'ch7_unlock_portal', description: 'Insert ancient bronze key into the sanctuary portal', done: false },
                { id: 'ch7_assemble_evidence', description: 'Connect all 7 regional evidence items on the clue board', done: false },
                { id: 'ch7_confront_collector', description: 'Prevent the illicit extraction of heritage botanical folios', done: false },
                { id: 'ch7_preserve_legacy', description: 'Secure the sanctuary records with the Department of Antiquities', done: false }
            ],
            optionalObjectives: [
                { id: 'ch7_opt_photolog_complete', description: 'Photograph the ancient sacred banyan tree at sanctuary center', done: false }
            ],
            primaryEvidence: 'clue_sanctuary_complete',
            unlockedRegion: 'final_sanctuary',
            completed: false
        }
    ];

    window.MAIN_STORY_DATA = MAIN_STORY_CHAPTERS;
    window.MainStoryData = {
        MAIN_STORY_CHAPTERS: MAIN_STORY_CHAPTERS
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { MAIN_STORY_CHAPTERS };
    }
})();
