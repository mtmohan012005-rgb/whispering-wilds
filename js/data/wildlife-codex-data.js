// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WILDLIFE CODEX DATA
// 9 Authentic Tamil Nadu Species with Real Ecological Profiles, Behaviors,
// and Observation Distance / Duration Requirements.
// ============================================================================

(function() {
    const WILDLIFE_ENTRIES = {
        nilgiri_tahr: {
            id: 'nilgiri_tahr',
            displayName: 'Nilgiri Tahr',
            tamilName: 'வரையாடு (Nilgiritragus hylocrius)',
            region: 'nilgiris',
            biome: 'Western Ghats Montane Grasslands',
            status: 'Endangered (IUCN)',
            behavior: ['graze', 'alert', 'climb_crags', 'flee'],
            observationRequirements: {
                minDistance: 5.0,
                maxDistance: 35.0,
                requiredDurationSec: 2.0,
                requiresPhoto: true
            },
            photoRequired: true,
            codexDescription: 'The state animal of Tamil Nadu. A stocky, short-coated wild ungulate uniquely adapted to the sheer rocky precipices and misty montane shola-grasslands above 1,200 meters. Extremely vigilant with acute eyesight.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        },
        nilgiri_langur: {
            id: 'nilgiri_langur',
            displayName: 'Nilgiri Langur',
            tamilName: 'கருங்குரங்கு (Semnopithecus johnii)',
            region: 'nilgiris',
            biome: 'Rainforest Canopy & Shola Forest',
            status: 'Vulnerable (IUCN)',
            behavior: ['canopy_climb', 'forage', 'alert_call', 'flee'],
            observationRequirements: {
                minDistance: 6.0,
                maxDistance: 30.0,
                requiredDurationSec: 2.0,
                requiresPhoto: false
            },
            photoRequired: false,
            codexDescription: 'A distinctive black-bodied leaf monkey with a golden-brown crown and long tail. Inhabits dense tropical wet evergreen and shola forests, foraging primarily on young leaves, flowers, and wild canopy fruits.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        },
        elephant: {
            id: 'elephant',
            displayName: 'Asian Elephant',
            tamilName: 'ஆசிய யானை (Elephas maximus)',
            region: 'nilgiris',
            biome: 'Deciduous Forests & Mountain Corridors',
            status: 'Endangered (IUCN)',
            behavior: ['graze', 'dust_bath', 'social_browse', 'alert'],
            observationRequirements: {
                minDistance: 12.0,
                maxDistance: 50.0,
                requiredDurationSec: 2.5,
                requiresPhoto: true
            },
            photoRequired: true,
            codexDescription: 'The iconic keystone megaherbivore of the Western Ghats elephant corridors. Traverses traditional migration trails between valleys, feeding on bamboo, grasses, and tree bark. Must be observed from safe distances.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        },
        gaur: {
            id: 'gaur',
            displayName: 'Indian Gaur (Bison)',
            tamilName: 'காட்டு மாடு (Bos gaurus)',
            region: 'nilgiris',
            biome: 'High-Altitude Forest Edges & Grasslands',
            status: 'Vulnerable (IUCN)',
            behavior: ['graze', 'rumination', 'herd_walk', 'alert'],
            observationRequirements: {
                minDistance: 8.0,
                maxDistance: 40.0,
                requiredDurationSec: 2.0,
                requiresPhoto: false
            },
            photoRequired: false,
            codexDescription: 'The largest extant bovine species in the world, characterized by a massive muscular dorsal ridge and pale white-stockinged legs. Feeds in mixed herds on coarse grasses and forest shrubs during early dawn and dusk.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        },
        egret: {
            id: 'egret',
            displayName: 'Little Egret',
            tamilName: 'சின்ன கொக்கு (Egretta garzetta)',
            region: 'pichavaram',
            biome: 'Wetlands, Mangrove Estuaries & Tidal Mudflats',
            status: 'Least Concern (IUCN)',
            behavior: ['slow_stalk', 'spear_catch', 'flock_flight', 'roost'],
            observationRequirements: {
                minDistance: 4.0,
                maxDistance: 25.0,
                requiredDurationSec: 1.5,
                requiresPhoto: false
            },
            photoRequired: false,
            codexDescription: 'An elegant white wading bird featuring black legs, yellow feet, and a slender black dagger bill. Commonly observed silently stalking mudskippers, crabs, and fingerling fish along Pichavaram mangrove root fringes.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        },
        kingfisher: {
            id: 'kingfisher',
            displayName: 'White-Throated Kingfisher',
            tamilName: 'வெள்ளைத் தொண்டை மீன்கொத்தி (Halcyon smyrnensis)',
            region: 'pichavaram',
            biome: 'Rivers, Agricultural Drains & Mangroves',
            status: 'Least Concern (IUCN)',
            behavior: ['exposed_perch', 'plunge_dive', 'bob_head', 'flight_dart'],
            observationRequirements: {
                minDistance: 3.0,
                maxDistance: 22.0,
                requiredDurationSec: 1.5,
                requiresPhoto: true
            },
            photoRequired: true,
            codexDescription: 'A vivid tree kingfisher with iridescent turquoise-blue wings, bright chestnut brown plumage, a stark white breast shield, and heavy coral-red bill. Perches motionless on fence poles and mangrove branches before rapid swoops.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        },
        peafowl: {
            id: 'peafowl',
            displayName: 'Indian Peafowl',
            tamilName: 'மயில் (Pavo cristatus)',
            region: 'cauvery_delta',
            biome: 'Agricultural Margins, Scrub & Rural Groves',
            status: 'Least Concern (IUCN)',
            behavior: ['ground_forage', 'train_display', 'roost_flight', 'call'],
            observationRequirements: {
                minDistance: 4.0,
                maxDistance: 28.0,
                requiredDurationSec: 1.5,
                requiresPhoto: false
            },
            photoRequired: false,
            codexDescription: 'The national bird of India. Males possess radiant metallic blue-green neck plumage and a long ornamental covert train with iridescent eye-spots. Roosts in high banyan and tamarind trees at night.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        },
        cattle: {
            id: 'cattle',
            displayName: 'Kangayam Indigenous Cattle',
            tamilName: 'காங்கேயம் நாட்டு மாடு (Bos indicus)',
            region: 'cauvery_delta',
            biome: 'Rural Homesteads & Pasture Commons',
            status: 'Domestic Indigenous Breed',
            behavior: ['graze', 'draw_cart', 'chew_cud', 'stand_quiet'],
            observationRequirements: {
                minDistance: 2.0,
                maxDistance: 20.0,
                requiredDurationSec: 1.0,
                requiresPhoto: false
            },
            photoRequired: false,
            codexDescription: 'A hardy, drought-tolerant draught cattle breed native to the Kongu and Delta regions of Tamil Nadu. Renowned for strength, compact muscular build, swept-back horns, and vital cultural significance during Mattu Pongal.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        },
        goat: {
            id: 'goat',
            displayName: 'Kanni Adu Country Goat',
            tamilName: 'கன்னி ஆடு',
            region: 'chettinad',
            biome: 'Dry Scrub, Village Commons & Verandas',
            status: 'Domestic Indigenous Breed',
            behavior: ['browse_shrub', 'climb_ledge', 'forage', 'trot'],
            observationRequirements: {
                minDistance: 2.0,
                maxDistance: 18.0,
                requiredDurationSec: 1.0,
                requiresPhoto: false
            },
            photoRequired: false,
            codexDescription: 'An agile, black-coated indigenous goat breed of southern Tamil Nadu with white facial stripes. Adept at foraging thorny scrub vegetation and navigating stony village terrain.',
            discovered: false,
            timesObserved: 0,
            firstObservedAt: null
        }
    };

    const speciesList = Object.values(WILDLIFE_ENTRIES);
    window.WILDLIFE_CODEX_DATA = WILDLIFE_ENTRIES;
    window.WildlifeCodexData = {
        WILDLIFE_ENTRIES: WILDLIFE_ENTRIES,
        WILDLIFE_SPECIES: speciesList,
        getSpecies: function(id) {
            return WILDLIFE_ENTRIES[id] || null;
        },
        getAllSpecies: function() {
            return speciesList;
        }
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { WILDLIFE_ENTRIES, WILDLIFE_SPECIES: speciesList };
    }
})();
