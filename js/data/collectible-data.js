// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - COLLECTIBLES DATA
// Purposeful non-grind collectibles: field notes, botanical illustrations,
// craft blueprints, and archival documents.
// ============================================================================

(function() {
    const COLLECTIBLES = [
        {
            id: 'coll_botanical_shola',
            category: 'botanical_note',
            name: 'Kurinji Bloom Sketch',
            region: 'nilgiris',
            coordinates: { x: -128.0, y: 35.0, z: -95.0 },
            description: 'Pencil drawing on vellum depicting the purple Strobilanthes kunthiana flower which blossoms once every 12 years across the shola grasslands.',
            loreSnippet: 'Botanical field journal entry dated 1934 noting the synchronized mass flowering along the Ooty ridge.',
            found: false
        },
        {
            id: 'coll_craft_athangudi_mould',
            category: 'craft_pattern',
            name: 'Athangudi Brass Stencil Pattern',
            region: 'chettinad',
            coordinates: { x: 88.0, y: 2.0, z: -55.0 },
            description: 'Intricate brass frame used to pour coloured liquid cement into traditional floral geometric floor tiles.',
            loreSnippet: 'Handcrafted by Chettiar artisans using local river sand, coloured mineral oxides, and glass plates.',
            found: false
        },
        {
            id: 'coll_map_chola_irrigation',
            category: 'historical_map',
            name: 'Parchment Map of Cauvery Delta Sluices',
            region: 'cauvery_delta',
            coordinates: { x: -40.0, y: 4.5, z: 70.0 },
            description: 'Ink drawing charting the network of distributary channels flowing from the Kollidam and Cauvery bifurcation at Grand Anicut.',
            loreSnippet: 'Surviving copy of a hydraulic survey showing how water distribution was calculated using stone-weir gradients.',
            found: false
        },
        {
            id: 'coll_doc_harbour_ledger',
            category: 'archival_document',
            name: '1922 Madras Port Shipping Bill',
            region: 'george_town',
            coordinates: { x: 18.0, y: 3.0, z: -20.0 },
            description: 'Stamped customs clearance documenting export consignments of handloom textiles and spices bound for Penang and Rangoon.',
            loreSnippet: 'Evidence of historical seafaring trade connections between coastal Tamil Nadu and Southeast Asia.',
            found: false
        },
        {
            id: 'coll_craft_toda_embroidery',
            category: 'craft_pattern',
            name: 'Pukhoor Geometric Pattern Scrap',
            region: 'nilgiris',
            coordinates: { x: -160.0, y: 42.0, z: -130.0 },
            description: 'Square fragment of coarse white cotton fabric featuring precise red and black geometric weave patterns made with single-thread needlework.',
            loreSnippet: 'Toda indigenous embroidery depicting traditional buffalo horn and cosmic motifs.',
            found: false
        },
        {
            id: 'coll_doc_pallava_rubbing',
            category: 'archival_document',
            name: 'Grantha Rock Inscription Rubbing',
            region: 'mamallapuram',
            coordinates: { x: 115.0, y: 4.0, z: 30.0 },
            description: 'Charcoal paper rubbing capturing a verse dedicated to Rajasimha carved into the living rock above the sea cave.',
            loreSnippet: 'Demonstrates the sophisticated rock-cut relief technique of 8th-century Pallava sculptors.',
            found: false
        },
        {
            id: 'coll_botanical_mangrove',
            category: 'botanical_note',
            name: 'Rhizophora Stilt Root Specimen Study',
            region: 'pichavaram',
            coordinates: { x: -95.0, y: 0.5, z: 120.0 },
            description: 'Field notes detailing how aerial stilt roots extract oxygen from waterlogged sediment and trap coastal silt.',
            loreSnippet: 'Key ecological record showing the mangrove forest\'s role as a natural wave barrier against oceanic storms.',
            found: false
        },
        {
            id: 'coll_doc_thanjavur_vellum',
            category: 'archival_document',
            name: 'Palm-Leaf Architectural Ratio Codex',
            region: 'thanjavur',
            coordinates: { x: 50.0, y: 5.0, z: 92.0 },
            description: 'Etched palm leaf bundle recording the dimensional ratios and granite quarrying notations for the vimana tower.',
            loreSnippet: 'Highlights the engineering mastery required to hoist an 80-tonne monolithic granite cupola capstone.',
            found: false
        }
    ];

    if (typeof window !== 'undefined') {
        window.CollectibleData = {
            COLLECTIBLES: COLLECTIBLES,
            getCollectibleById: function(id) {
                return COLLECTIBLES.find(c => c.id === id) || null;
            },
            getByCategory: function(category) {
                return COLLECTIBLES.filter(c => c.category === category);
            },
            getByRegion: function(region) {
                return COLLECTIBLES.filter(c => c.region === region);
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { COLLECTIBLES };
    }
})();
