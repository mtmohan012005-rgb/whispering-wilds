// ============================================================================
// THE WHISPERING WILDS - TRAFFIC DATA & WAYPOINT NETWORKS
// ============================================================================

(function() {
    const VEHICLE_TYPES = {
        AUTO_RICKSHAW: { id: 'AUTO_RICKSHAW', name: 'Madras Auto-Rickshaw', speed: 8.5, maxCapacity: 3, sound: 'auto_engine' },
        BUS: { id: 'BUS', name: 'Metropolitan / Town Bus', speed: 6.0, maxCapacity: 30, sound: 'bus_engine' },
        MOTORCYCLE: { id: 'MOTORCYCLE', name: 'Hero / Enfield Motorcycle', speed: 10.0, maxCapacity: 2, sound: 'motorcycle' },
        BICYCLE: { id: 'BICYCLE', name: 'Roadster Bicycle', speed: 4.5, maxCapacity: 1, sound: 'bicycle_bell' },
        BULLOCK_CART: { id: 'BULLOCK_CART', name: 'Traditional Bullock Cart', speed: 2.2, maxCapacity: 4, sound: 'bullock_cart' },
        WOODEN_BOAT: { id: 'WOODEN_BOAT', name: 'Pichavaram Mangrove Rowboat', speed: 3.5, maxCapacity: 4, sound: 'boat_paddle' },
        FISHING_BOAT: { id: 'FISHING_BOAT', name: 'Coromandel Fishing Catamaran', speed: 5.0, maxCapacity: 6, sound: 'boat_motor' }
    };

    // Regional traffic networks (waypoint loops)
    const TRAFFIC_ROUTES = {
        GEORGE_TOWN: [
            {
                id: 'gt_main_street',
                vehicleType: 'AUTO_RICKSHAW',
                speed: 7.5,
                waypoints: [
                    { x: -50, y: 0, z: -80 },
                    { x: 0, y: 0, z: -60 },
                    { x: 50, y: 0, z: -40 },
                    { x: 20, y: 0, z: 0 },
                    { x: -30, y: 0, z: -30 }
                ]
            },
            {
                id: 'gt_bus_route',
                vehicleType: 'BUS',
                speed: 5.5,
                waypoints: [
                    { x: -120, y: 0, z: -100 },
                    { x: -20, y: 0, z: -90 },
                    { x: 80, y: 0, z: -70 },
                    { x: 120, y: 0, z: -50 }
                ]
            }
        ],
        CAUVERY_DELTA: [
            {
                id: 'delta_farm_road',
                vehicleType: 'BULLOCK_CART',
                speed: 2.2,
                waypoints: [
                    { x: -80, y: 0, z: 40 },
                    { x: -10, y: 0, z: 30 },
                    { x: 60, y: 0, z: 50 }
                ]
            },
            {
                id: 'delta_cycle_lane',
                vehicleType: 'BICYCLE',
                speed: 4.5,
                waypoints: [
                    { x: -70, y: 0, z: 20 },
                    { x: 10, y: 0, z: 15 },
                    { x: 90, y: 0, z: 35 }
                ]
            }
        ],
        PICHAVARAM: [
            {
                id: 'pichavaram_waterway_1',
                vehicleType: 'WOODEN_BOAT',
                speed: 3.2,
                waypoints: [
                    { x: -40, y: -0.2, z: 120 },
                    { x: 0, y: -0.2, z: 150 },
                    { x: 45, y: -0.2, z: 180 },
                    { x: 10, y: -0.2, z: 210 }
                ]
            }
        ]
    };

    window.TRAFFIC_DATA = {
        VEHICLES: VEHICLE_TYPES,
        ROUTES: TRAFFIC_ROUTES
    };
})();
