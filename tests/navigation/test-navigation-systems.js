// ============================================================================
// THE WHISPERING WILDS - NAVIGATION & FAST TRAVEL UNIT TESTS
// ============================================================================

(function() {
    function runTests() {
        console.log('--- Running Navigation & Fast Travel Tests ---');
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

        // 1. Region Progression
        const regSys = window.RegionProgressionSystem;
        assert(regSys.isAccessible('GEORGE_TOWN'), 'George Town must be accessible by default');
        assert(regSys.discoverRegion('CAUVERY_DELTA'), 'Discovering Cauvery Delta must succeed');
        assert(regSys.isAccessible('CAUVERY_DELTA'), 'Discovered region must be accessible');

        // 2. Route Unlocking
        const routeSys = window.RouteSystem;
        assert(routeSys.isBlocked('route_delta_to_pichavaram'), 'Pichavaram route must be blocked initially');
        routeSys.unlockRoute('route_delta_to_pichavaram');
        assert(!routeSys.isBlocked('route_delta_to_pichavaram'), 'Unlocking route must clear blocked state');

        // 3. Fast Travel Validation & Execution
        if (window.dialogueController && typeof window.dialogueController.endDialogue === 'function') {
            window.dialogueController.endDialogue();
        }
        if (window.cinematicSystem) {
            window.cinematicSystem.state = window.CINEMATIC_STATE?.NONE || 'NONE';
        }

        const ftSys = window.FastTravelSystem;
        assert(ftSys.canFastTravel('ft_george_town').allowed, 'Discovered Broadway post must be travel-eligible');
        assert(!ftSys.canFastTravel('ft_nilgiris').allowed, 'Undiscovered Nilgiris post must NOT be travel-eligible');

        ftSys.discoverPoint('ft_cauvery_delta');
        assert(ftSys.canFastTravel('ft_cauvery_delta').allowed, 'Discovered post must become travel-eligible');

        if (window.GameState && window.GameState.world) {
            window.GameState.world.time = 8.0;
        }
        const startTime = window.GameState?.world?.time || 8.0;
        const res = ftSys.executeFastTravel('ft_cauvery_delta');
        assert(res.success, 'Executing valid fast travel must succeed');
        assert((window.GameState?.world?.time || 0) > startTime, 'Fast travel must advance world clock');

        // 4. Navigation Compass Bearing
        const navSys = window.NavigationSystem;
        assert(navSys.calculateCardinal(0) === 'N', '0° must be North');
        assert(navSys.calculateCardinal(90) === 'E', '90° must be East');
        assert(navSys.calculateCardinal(180) === 'S', '180° must be South');
        assert(navSys.calculateCardinal(270) === 'W', '270° must be West');

        // 5. Signposts Retrieval
        const signposts = navSys.getNearbySignposts({ x: 5, z: -10 }, 15.0);
        assert(signposts.length > 0, 'Murugan tea kadai signpost must be detected within 15 units');

        console.log(`✓ Navigation & Fast Travel Tests Complete: ${passed} passed, ${failed} failed`);
        return failed === 0;
    }

    window.testNavigationSystems = runTests;
})();
