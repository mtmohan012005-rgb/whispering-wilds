// ============================================================================
// THE WHISPERING WILDS - CROWD SIMULATION DATA & DENSITY CAPS
// ============================================================================

(function() {
    const CROWD_CONFIG = {
        PERFORMANCE_CAPS: {
            GEORGE_TOWN: { maxFull: 4, maxMedium: 6, maxFar: 8 },
            CAUVERY_DELTA: { maxFull: 2, maxMedium: 3, maxFar: 4 },
            PICHAVARAM: { maxFull: 2, maxMedium: 2, maxFar: 3 },
            CHETTINAD: { maxFull: 3, maxMedium: 3, maxFar: 4 },
            THANJAVUR: { maxFull: 4, maxMedium: 5, maxFar: 6 },
            MAMALLAPURAM: { maxFull: 3, maxMedium: 4, maxFar: 5 },
            NILGIRIS: { maxFull: 2, maxMedium: 3, maxFar: 4 }
        },
        GATHERING_ZONES: [
            { id: 'murugan_tea_stall', region: 'GEORGE_TOWN', center: { x: 5, y: 0, z: -10 }, radius: 12, maxQueue: 4 },
            { id: 'delta_paddy_depot', region: 'CAUVERY_DELTA', center: { x: 20, y: 0, z: 45 }, radius: 15, maxQueue: 3 },
            { id: 'pichavaram_dock_plaza', region: 'PICHAVARAM', center: { x: -10, y: 0, z: 110 }, radius: 10, maxQueue: 3 }
        ]
    };

    window.CROWD_DATA = CROWD_CONFIG;
})();
