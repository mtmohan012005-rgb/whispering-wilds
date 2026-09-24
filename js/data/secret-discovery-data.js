// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - SECRET DISCOVERIES DATA
// Authored hidden rooms, secluded viewpoints, and forgotten pathways.
// ============================================================================

(function() {
    const SECRET_DISCOVERIES = [
        {
            id: 'secret_high_court_attic',
            name: 'Archives Skylight Loft',
            region: 'george_town',
            coordinates: { x: 12.0, y: 15.5, z: -35.0 },
            radius: 8.0,
            hint: 'A forgotten iron maintenance ladder tucked behind the red brick arcade leading to the ceiling beams.',
            loreDescription: 'Dust-moted archive loft above the Victorian courtroom where handwritten 19th-century trade ledgers were stored during monsoons.',
            codexUnlockId: 'clue_torn_blueprint',
            xpReward: 120,
            discovered: false
        },
        {
            id: 'secret_mangrove_grotto',
            name: 'Sunken Mangrove Hollow',
            region: 'pichavaram',
            coordinates: { x: -84.0, y: 1.2, z: 142.0 },
            radius: 9.0,
            hint: 'An archway of interwoven prop roots navigable only at low tide where brackish water turns emerald green.',
            loreDescription: 'A sheltered natural lagoon where fishing families hid small outriggers during cyclonic squalls.',
            codexUnlockId: 'mangrove_ecology',
            xpReward: 140,
            discovered: false
        },
        {
            id: 'secret_chettinad_safe_room',
            name: 'The Teak Strongroom',
            region: 'chettinad',
            coordinates: { x: 95.0, y: 6.8, z: -62.0 },
            radius: 7.5,
            hint: 'A false rosewood panel behind the central valavu dining hall operated by a recessed brass latch.',
            loreDescription: 'Heavily reinforced room featuring dual-combination iron safe manufactured in Birmingham in 1898 for storing maritime rubies.',
            codexUnlockId: 'chettinad_architecture',
            xpReward: 160,
            discovered: false
        },
        {
            id: 'secret_shore_temple_chamber',
            name: 'Submerged Basalt Vault',
            region: 'mamallapuram',
            coordinates: { x: 130.0, y: 0.8, z: 45.0 },
            radius: 8.5,
            hint: 'A wave-smoothed crevice beneath the seaward granite foundation exposed during full-moon lowest tides.',
            loreDescription: 'Rock-cut chamber carved during the reign of Narasimhavarman II containing eroded foundation inscriptions in Pallava Grantha script.',
            codexUnlockId: 'granite_sculpture',
            xpReward: 180,
            discovered: false
        },
        {
            id: 'secret_nilgiri_mist_ledge',
            name: 'Eagle\'s Roost Overlook',
            region: 'nilgiris',
            coordinates: { x: -140.0, y: 48.0, z: -110.0 },
            radius: 10.0,
            hint: 'A narrow goat track branching off the upper tea contour path climbing through wild rhododendron thickets.',
            loreDescription: 'A wind-scoured granite shelf 2,400 meters above sea level offering an unbroken panorama of the Bhavani river gorge.',
            codexUnlockId: 'nilgiri_tahr',
            xpReward: 200,
            discovered: false
        },
        {
            id: 'secret_thanjavur_acoustic_passage',
            name: 'Shadow Corbel Corridor',
            region: 'thanjavur',
            coordinates: { x: 45.0, y: 8.2, z: 88.0 },
            radius: 8.0,
            hint: 'A narrow vertical seam in the outer circumambulatory cloister that dampens ambient sound to near absolute silence.',
            loreDescription: 'Granite corridor built with interlocking stone joints that channeled air cooling currents through the temple sanctum.',
            codexUnlockId: 'chola_architecture',
            xpReward: 180,
            discovered: false
        },
        {
            id: 'secret_sanctuary_spring',
            name: 'Sacred Grove Hidden Spring',
            region: 'final_sanctuary',
            coordinates: { x: 0.0, y: 22.0, z: -180.0 },
            radius: 12.0,
            hint: 'Follow the natural line of ancient banyan aerial roots down into the mossy amphitheatre.',
            loreDescription: 'Perennial freshwater pool ringed by medicinal herbs untouched for centuries, guarded by carved terracotta guardian steeds.',
            codexUnlockId: 'sacred_groves',
            xpReward: 250,
            discovered: false
        }
    ];

    if (typeof window !== 'undefined') {
        window.SecretDiscoveryData = {
            SECRET_DISCOVERIES: SECRET_DISCOVERIES,
            getSecretById: function(id) {
                return SECRET_DISCOVERIES.find(s => s.id === id) || null;
            },
            getSecretsByRegion: function(region) {
                return SECRET_DISCOVERIES.filter(s => s.region === region);
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { SECRET_DISCOVERIES };
    }
})();
