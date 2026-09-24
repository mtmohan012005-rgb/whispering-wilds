// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - WORLD EVENT DATA
// Dynamic ambient world events with atmospheric shifts, NPC behaviors, and durations.
// ============================================================================

(function() {
    const WORLD_EVENTS = [
        {
            id: 'evt_monsoon_surge',
            title: 'Cauvery River Swell',
            tamilTitle: 'காவிரி வெள்ளப்பெருக்கு',
            region: 'cauvery_delta',
            type: 'environmental',
            conditions: {
                weather: ['rain', 'monsoon', 'storm'],
                timeOfDay: ['day', 'dusk', 'night']
            },
            durationSeconds: 300,
            cooldownSeconds: 900,
            description: 'Heavy precipitation in the catchment hills causes river levels at Thiruvaiyaru to surge, opening secondary sluice channels.',
            effects: {
                waterLevelDelta: 1.2,
                ambientSound: 'river_surge_deep',
                skyboxTint: '#475569'
            },
            reward: { xp: 100, currency: 40 }
        },
        {
            id: 'evt_nilgiri_dense_fog',
            title: 'Shola Mountain Inversion Mist',
            tamilTitle: 'சோலை பனிமூட்டம்',
            region: 'nilgiris',
            type: 'atmospheric',
            conditions: {
                weather: ['clear', 'cloudy', 'fog'],
                timeOfDay: ['dawn', 'dusk', 'night']
            },
            durationSeconds: 240,
            cooldownSeconds: 720,
            description: 'Thick white cloud banks roll over Doddabetta tea slopes, reducing visibility and muffling all sound beyond 25 meters.',
            effects: {
                fogDensity: 0.08,
                ambientSound: 'wind_whisper_cold',
                visibilityMax: 30
            },
            reward: { xp: 80, currency: 30 }
        },
        {
            id: 'evt_temple_pradosham',
            title: 'Evening Chime of the Monolith',
            tamilTitle: 'பிரதோஷ மணி ஒலி',
            region: 'thanjavur',
            type: 'cultural',
            conditions: {
                timeOfDay: ['dusk']
            },
            durationSeconds: 360,
            cooldownSeconds: 1200,
            description: 'Conch shells and brass bells echo across the granite corridors as temple lamps are lit along the perimeter mantapa.',
            effects: {
                pointLightsActive: true,
                ambientSound: 'temple_bell_reverberation',
                npcGathering: 'mantapa_center'
            },
            reward: { xp: 120, currency: 50, codexUnlock: 'chola_architecture' }
        },
        {
            id: 'evt_mangrove_low_tide',
            title: 'Pichavaram Spring Low Tide',
            tamilTitle: 'வடிகால் வற்றுப்பெருக்கு',
            region: 'pichavaram',
            type: 'environmental',
            conditions: {
                timeOfDay: ['day', 'afternoon']
            },
            durationSeconds: 280,
            cooldownSeconds: 800,
            description: 'Water drains out through the creek channels, exposing massive Rhizophora prop roots and drawing flocks of foraging egrets.',
            effects: {
                waterLevelDelta: -0.8,
                mudflatExposed: true,
                egretFlockSpawning: true
            },
            reward: { xp: 90, currency: 35 }
        },
        {
            id: 'evt_chettinad_tile_firing',
            title: 'Kiln Firing at Athangudi',
            tamilTitle: 'சுண்ணாம்புக் காளவாசல்',
            region: 'chettinad',
            type: 'artisan',
            conditions: {
                timeOfDay: ['day', 'afternoon']
            },
            durationSeconds: 300,
            cooldownSeconds: 900,
            description: 'Local tile masters ignite the wood-fired lime kiln, filling the air with fragrant woodsmoke and stone dust.',
            effects: {
                particleSmoke: true,
                ambientSound: 'crackling_wood_kiln'
            },
            reward: { xp: 110, currency: 45, codexUnlock: 'athangudi_tiles' }
        }
    ];

    if (typeof window !== 'undefined') {
        window.WorldEventData = {
            WORLD_EVENTS: WORLD_EVENTS,
            getEventById: function(id) {
                return WORLD_EVENTS.find(e => e.id === id) || null;
            },
            getEventsByRegion: function(region) {
                return WORLD_EVENTS.filter(e => e.region === region);
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { WORLD_EVENTS };
    }
})();
