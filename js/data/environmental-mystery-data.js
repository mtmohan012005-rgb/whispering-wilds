// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - ENVIRONMENTAL MYSTERY DATA
// Non-combat investigative environmental cases solved through observation,
// physical evidence gathering, and logical deduction.
// ============================================================================

(function() {
    const ENVIRONMENTAL_MYSTERIES = [
        {
            id: 'mystery_drying_creek',
            title: 'The Silent Silt',
            tamilTitle: 'அமைதியான வண்டல்',
            region: 'pichavaram',
            summary: 'A crucial mangrove backwater creek has abruptly dried out over two weeks, stranding nursery fish and disturbing migratory egret feeding.',
            clues: [
                { id: 'clue_silt_build_up', description: 'Inspect unnatural sand silt bank blocking the primary tidal culvert', found: false },
                { id: 'clue_broken_weir', description: 'Examine ancient timber weir with displaced support stakes upstream', found: false },
                { id: 'clue_salinity_reading', description: 'Measure water brackishness at the stagnant estuary mouth', found: false }
            ],
            solutionDeduction: 'The tidal flow was choked by displaced upstream timber logs coupled with shifting sand bars after a sudden seasonal swell.',
            rewards: {
                xp: 200,
                codexUnlock: 'mangrove_ecology',
                titleReward: 'Wetland Restorer'
            },
            resolved: false
        },
        {
            id: 'mystery_shola_footprints',
            title: 'The Ghost of the High Ridge',
            tamilTitle: 'உயர் முகட்டின் நிழல்',
            region: 'nilgiris',
            summary: 'Unusual cliff-edge markings and trampled wild rhododendron shrubs indicate an animal moving far outside its normal feeding territory.',
            clues: [
                { id: 'clue_tahr_fur', description: 'Identify coarse grey fur tufts snagged on thorny gorse bushes', found: false },
                { id: 'clue_granite_scrapes', description: 'Examine fresh hoof scrape marks on steep 60-degree granite rock face', found: false },
                { id: 'clue_wild_dog_spoor', description: 'Discover fresh dhole (Asiatic wild dog) pack tracks near the lower tree line', found: false }
            ],
            solutionDeduction: 'A small herd of Nilgiri Tahr was forced onto precarious upper crags to escape an active wild dog hunting pack in the shola valley.',
            rewards: {
                xp: 220,
                codexUnlock: 'nilgiri_tahr',
                titleReward: 'Highland Naturalist'
            },
            resolved: false
        },
        {
            id: 'mystery_temple_acoustic',
            title: 'The Muffled Pillar',
            tamilTitle: 'ஒலி அடங்கிய தூண்',
            region: 'thanjavur',
            summary: 'One of the legendary resonant musical stone pillars in the temple mantapa fails to produce its crisp chime when struck lightly.',
            clues: [
                { id: 'clue_sand_deposit', description: 'Examine tiny drainage vents at the pillar base filled with fine river sand', found: false },
                { id: 'clue_moisture_level', description: 'Detect high capillary groundwater dampness inside the lower foundation plinth', found: false },
                { id: 'clue_acoustic_ring', description: 'Test pitch dampening using a wooden sounding mallet across 7 octaves', found: false }
            ],
            solutionDeduction: 'A clogged underground rainwater conduit saturated the stone foundation, causing micro-moisture dampening in the resonance cavity.',
            rewards: {
                xp: 250,
                codexUnlock: 'chola_architecture',
                titleReward: 'Sound Architect'
            },
            resolved: false
        }
    ];

    if (typeof window !== 'undefined') {
        window.EnvironmentalMysteryData = {
            ENVIRONMENTAL_MYSTERIES: ENVIRONMENTAL_MYSTERIES,
            getMysteryById: function(id) {
                return ENVIRONMENTAL_MYSTERIES.find(m => m.id === id) || null;
            },
            getByRegion: function(region) {
                return ENVIRONMENTAL_MYSTERIES.filter(m => m.region === region);
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ENVIRONMENTAL_MYSTERIES };
    }
})();
