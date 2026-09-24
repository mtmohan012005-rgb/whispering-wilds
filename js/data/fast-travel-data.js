// ============================================================================
// THE WHISPERING WILDS - FAST TRAVEL POINTS & ARRIVAL SAFETY MARKERS
// ============================================================================

(function() {
    const FAST_TRAVEL_POINTS = [
        {
            id: 'ft_george_town',
            name: 'Broadway Bus Stand',
            region: 'GEORGE_TOWN',
            arrivalMarker: { x: -20, y: 0, z: -75, rotationY: 0, safeRadius: 4.0 },
            travelHours: 0,
            energyCost: 0,
            hydrationCost: 0,
            initiallyDiscovered: true
        },
        {
            id: 'ft_cauvery_delta',
            name: 'Kallanai Junction',
            region: 'CAUVERY_DELTA',
            arrivalMarker: { x: 10, y: 0, z: 25, rotationY: Math.PI / 4, safeRadius: 4.0 },
            travelHours: 2.5,
            energyCost: 15,
            hydrationCost: 12,
            initiallyDiscovered: false
        },
        {
            id: 'ft_pichavaram',
            name: 'Mangrove Boat Jetty',
            region: 'PICHAVARAM',
            arrivalMarker: { x: -8, y: 0, z: 115, rotationY: Math.PI, safeRadius: 4.0 },
            travelHours: 3.0,
            energyCost: 18,
            hydrationCost: 15,
            initiallyDiscovered: false
        },
        {
            id: 'ft_chettinad',
            name: 'Kanadukathan Palace Square',
            region: 'CHETTINAD',
            arrivalMarker: { x: 45, y: 0, z: 35, rotationY: 0, safeRadius: 4.0 },
            travelHours: 3.5,
            energyCost: 20,
            hydrationCost: 18,
            initiallyDiscovered: false
        },
        {
            id: 'ft_thanjavur',
            name: 'Brihadisvara Temple Gateway',
            region: 'THANJAVUR',
            arrivalMarker: { x: 35, y: 0, z: 75, rotationY: -Math.PI / 2, safeRadius: 4.0 },
            travelHours: 2.0,
            energyCost: 12,
            hydrationCost: 10,
            initiallyDiscovered: false
        },
        {
            id: 'ft_mamallapuram',
            name: 'Shore Temple Plaza',
            region: 'MAMALLAPURAM',
            arrivalMarker: { x: 25, y: 0, z: -45, rotationY: Math.PI / 2, safeRadius: 4.0 },
            travelHours: 1.5,
            energyCost: 10,
            hydrationCost: 8,
            initiallyDiscovered: false
        },
        {
            id: 'ft_nilgiris',
            name: 'Ooty Mountain Ridge Station',
            region: 'NILGIRIS',
            arrivalMarker: { x: -130, y: 0, z: 15, rotationY: 0, safeRadius: 4.0 },
            travelHours: 5.0,
            energyCost: 28,
            hydrationCost: 22,
            initiallyDiscovered: false
        }
    ];

    window.FAST_TRAVEL_DATA = {
        POINTS: FAST_TRAVEL_POINTS
    };
})();
