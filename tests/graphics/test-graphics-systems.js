// ============================================================================
// THE WHISPERING WILDS - GRAPHICS & VISUAL SYSTEMS UNIT TESTS
// ============================================================================

(function() {
    function runTests() {
        console.log('--- Running Graphics & Visual Systems Tests ---');
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

        // 1. PBR Material Presets
        const matSys = window.MaterialSystem;
        const brassMat = matSys.getMaterial('BRASS');
        assert(brassMat.metalness >= 0.7, 'Brass preset must have high metalness (>= 0.7)');
        assert(brassMat.roughness < 0.5, 'Brass preset must have smooth roughness (< 0.5)');

        const clayMat = matSys.getMaterial('CLAY');
        assert(clayMat.metalness === 0.0, 'Clay preset must be completely non-metallic (0.0)');
        assert(clayMat.roughness > 0.7, 'Clay preset must have high roughness (> 0.7)');

        // 2. Material Caching
        const cachedBrass = matSys.getMaterial('BRASS');
        assert(brassMat === cachedBrass, 'MaterialSystem must return cached instances to prevent leaks');

        // 3. Wetness Surface Modifier
        const testMat = new THREE.MeshStandardMaterial({ roughness: 0.8 });
        matSys.applyWetness(testMat, 1.0); // full rain
        assert(testMat.roughness < 0.8, 'Applying wetness must reduce material roughness');

        // 4. Regional Visual Profiles
        const nilgiriProfile = window.VISUAL_QUALITY_DATA.REGIONS.NILGIRIS;
        const gtProfile = window.VISUAL_QUALITY_DATA.REGIONS.GEORGE_TOWN;
        assert(nilgiriProfile.fogNear < gtProfile.fogNear, 'Nilgiris mountain mist must have closer fog bounds than George Town');

        // 5. Surface System Drying Cycle
        const surfSys = window.SurfaceSystem;
        surfSys.update(10.0, 'rain'); // accumulate wetness
        assert(surfSys.getWetness() > 0, 'Rain must increase surface wetness');
        surfSys.update(30.0, 'clear'); // dry off
        assert(surfSys.getWetness() < 1.0, 'Clear weather must dry surfaces gradually');

        console.log(`✓ Graphics & Visual Systems Tests Complete: ${passed} passed, ${failed} failed`);
        return failed === 0;
    }

    window.testGraphicsSystems = runTests;
})();
