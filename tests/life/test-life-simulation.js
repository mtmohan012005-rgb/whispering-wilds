// ============================================================================
// THE WHISPERING WILDS - LIFE SIMULATION UNIT TESTS
// ============================================================================

(function() {
    function runTests() {
        console.log('--- Running Life Simulation & Living World Tests ---');
        let passed = 0;
        let failed = 0;

        function assert(cond, msg) {
            if (cond) {
                passed++;
            } else {
                failed++;
                console.error(`[FAIL] ${msg}`);
            }
        }

        // 1. ActivityPoint Initialization & Schedule Check
        const actPoint = new window.ActivityPoint({
            id: 'test_stall',
            activityType: 'tea_counter',
            schedule: { startHour: 6, endHour: 20 },
            maxQueue: 3
        });
        assert(actPoint.isAvailable(10), 'Activity point must be available at 10:00 within 6-20 schedule');
        assert(!actPoint.isAvailable(23), 'Activity point must NOT be available at 23:00 outside schedule');

        // 2. Queueing & Assignment
        assert(actPoint.assign('agent_1'), 'Assigning unassigned activity point must succeed');
        assert(!actPoint.assign('agent_2'), 'Assigning already occupied point must fail');
        const qPos = actPoint.enqueue('agent_2');
        assert(qPos === 1, 'Enqueueing must return queue position 1');
        assert(actPoint.release('agent_1'), 'Releasing agent_1 must succeed');
        assert(actPoint.occupiedBy === 'agent_2', 'Next queued agent must be auto-promoted on release');

        // 3. Traffic Vehicle Waypoint Pathing
        const vehicle = new window.TrafficVehicle({
            type: 'AUTO_RICKSHAW',
            speed: 5.0,
            waypoints: [
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 0, z: 0 }
            ]
        });
        assert(vehicle.position.x === 0, 'Vehicle must start at initial waypoint');
        vehicle.update(1.0); // 5 units forward
        assert(vehicle.position.x > 0, 'Vehicle must advance towards waypoint');

        // 4. Animation LOD Interval
        const nearInterval = window.AnimationLOD.getUpdateInterval(15.0);
        const farInterval = window.AnimationLOD.getUpdateInterval(75.0);
        assert(nearInterval === 0, 'Near distance (<25m) must update every frame');
        assert(farInterval >= 0.5, 'Far distance (>65m) must throttle to <= 2Hz');

        // 5. Master Life Simulation Coordination
        const lifeSim = new window.LifeSimulationSystem();
        assert(lifeSim.activityPoints.has('gt_murugan_tea'), 'Default activity points must be registered');
        lifeSim.setRegion('GEORGE_TOWN');
        assert(lifeSim.traffic.vehicles.length > 0, 'Traffic vehicles must spawn for George Town');

        console.log(`✓ Life Simulation Tests Complete: ${passed} passed, ${failed} failed`);
        return failed === 0;
    }

    window.testLifeSimulation = runTests;
})();
