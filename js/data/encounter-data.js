// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - DYNAMIC ENCOUNTERS DATA
// Spontaneous, non-combat encounters discovered during world traversal.
// ============================================================================

(function() {
    const ENCOUNTERS = [
        {
            id: 'enc_stranded_calf',
            title: 'The Straying Kangayam Calf',
            region: 'cauvery_delta',
            coordinates: { x: -30.0, y: 0.0, z: 45.0 },
            summary: 'A grey Kangayam bull calf has wandered into the wet paddy irrigation ditch and cannot climb the slick mud embankment.',
            choices: [
                {
                    id: 'help_calf_gently',
                    text: 'Offer fresh grass to coax the calf up the gradual side ramp',
                    outcome: 'The calf follows calmly and runs back toward the village pasture.',
                    reward: { xp: 80, currency: 25, karma: 1 }
                },
                {
                    id: 'alert_farmer',
                    text: 'Call out to the nearby ploughman working the adjacent field',
                    outcome: 'The farmer arrives with a coir halter and thanks you with hot chai.',
                    reward: { xp: 60, currency: 35 }
                }
            ],
            resolved: false
        },
        {
            id: 'enc_wandering_botanist',
            title: 'The Nilgiri Herb Gatherer',
            region: 'nilgiris',
            coordinates: { x: -115.0, y: 38.0, z: -85.0 },
            summary: 'An elderly Toda herbalist searching for wild mountain mint along the shola stream bank.',
            choices: [
                {
                    id: 'share_botanical_knowledge',
                    text: 'Point out the cluster of wild mint flowering beneath the mossy boulder',
                    outcome: 'The elder blesses your journey and gives you a fragrant pouch of dried tea blossoms.',
                    reward: { xp: 90, currency: 30, codexUnlock: 'tea_culture' }
                }
            ],
            resolved: false
        },
        {
            id: 'enc_broken_bullock_cart',
            title: 'Loose Wooden Axle Pin',
            region: 'chettinad',
            coordinates: { x: 75.0, y: 1.0, z: -40.0 },
            summary: 'A country cart carrying Athangudi sand has slipped its wooden linchpin on the gravel lane.',
            choices: [
                {
                    id: 'find_wood_wedge',
                    text: 'Carve a sturdy replacement wedge from fallen neem timber',
                    outcome: 'The axle is secured and the cart rolls smoothly into the village yard.',
                    reward: { xp: 100, currency: 50 }
                }
            ],
            resolved: false
        },
        {
            id: 'enc_injured_kingfisher',
            title: 'Entangled Mangrove Kingfisher',
            region: 'pichavaram',
            coordinates: { x: -80.0, y: 0.8, z: 110.0 },
            summary: 'A White-throated Kingfisher with a nylon monofilament fishing leader caught around its left wing.',
            choices: [
                {
                    id: 'delicate_release',
                    text: 'Gently hold the bird and slice the monofilament with your pocket knife',
                    outcome: 'The bird takes flight with a sharp piping call, flashing electric blue across the channel.',
                    reward: { xp: 120, currency: 20, codexUnlock: 'kingfisher' }
                }
            ],
            resolved: false
        }
    ];

    if (typeof window !== 'undefined') {
        window.EncounterData = {
            ENCOUNTERS: ENCOUNTERS,
            getEncounterById: function(id) {
                return ENCOUNTERS.find(e => e.id === id) || null;
            },
            getEncountersByRegion: function(region) {
                return ENCOUNTERS.filter(e => e.region === region);
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { ENCOUNTERS };
    }
})();
