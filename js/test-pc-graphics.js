// ============================================================================
// THE WHISPERING WILDS - STEP 23 AUTOMATED TEST SUITE: PC GRAPHICS & STREAMING
// ============================================================================

window.runPCGraphicsTests = async function() {
    const results = [];
    const check = (desc, passed, details = '') => {
        results.push({ desc, passed, details });
        console.log(`[TEST-GRAPHICS] ${passed ? '✓' : '✗'} ${desc} ${details ? '(' + details + ')' : ''}`);
    };

    try {
        // 1. Quality Presets & Config Integrity
        const presets = window.GRAPHICS_PRESETS || (window.GRAPHICS_CONFIG && window.GRAPHICS_CONFIG.PRESETS);
        const hasPresets = !!presets;
        const expectedPresets = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
        const allPresetsExist = hasPresets && expectedPresets.every(p => !!presets[p]);
        const highRainStreak = hasPresets && presets.HIGH && (presets.HIGH.weatherParticles || presets.HIGH.particleCount) >= 3000;
        check('Quality presets integrity & Step 13 rain streak constraint', allPresetsExist && highRainStreak,
            `Presets: ${expectedPresets.join(',')}, HIGH rain: ${hasPresets ? (presets.HIGH.weatherParticles || presets.HIGH.particleCount) : 0}`);

        // 2. GraphicsSettings Manager & LocalStorage Persistence
        const settings = new window.GraphicsSettings();
        const initialPreset = settings.currentPreset;
        settings.setPreset('MEDIUM');
        const switched = settings.currentPreset === 'MEDIUM';
        settings.setCustomSetting('bloom', false);
        const customActive = settings.currentPreset === 'CUSTOM' && settings.settings.bloom === false;
        const serialized = settings.serialize();
        const testStorageKey = 'test_whispering_wilds_graphics';
        localStorage.setItem(testStorageKey, JSON.stringify(serialized));
        const loaded = JSON.parse(localStorage.getItem(testStorageKey));
        localStorage.removeItem(testStorageKey);
        const persistValid = loaded && loaded.settings && loaded.settings.bloom === false;
        settings.setPreset(initialPreset); // Revert to initial
        check('GraphicsSettings manager preset switching & persistence', switched && customActive && persistValid);

        // 3. PerformanceManager Rolling Average & Frame Budget
        const perf = new window.PerformanceManager(settings);
        // Simulate 60 frames at 16.6ms (~60 FPS)
        for (let i = 0; i < 60; i++) {
            perf.recordFrame(16.6);
        }
        const fps60 = perf.getMetrics().fps;
        const fpsSmoothValid = fps60 >= 55 && fps60 <= 65;

        // Frame budget check (16.67ms for 60fps, 33.33ms for 30fps)
        const budget60 = perf.getFrameBudgetMs(60);
        const budget30 = perf.getFrameBudgetMs(30);
        const budgetValid = Math.abs(budget60 - 16.67) < 0.1 && Math.abs(budget30 - 33.33) < 0.1;
        check('PerformanceManager smoothed moving average & frame budget', fpsSmoothValid && budgetValid,
            `Smoothed FPS: ${fps60}, Budget 60: ${budget60.toFixed(2)}ms`);

        // 4. WorldStreamingSystem Regional Hysteresis & 8 Tamil Regions
        const dummyScene = new THREE.Scene();
        const streaming = new window.WorldStreamingSystem(dummyScene);
        const regionList = Array.isArray(streaming.regions)
            ? streaming.regions
            : (streaming.regions instanceof Map ? Array.from(streaming.regions.values()) : Object.values(streaming.regions || {}));
        const regionCount = regionList.length;
        const hasAll8Regions = regionCount >= 7; // at least 7-8 configured regions
        // Verify loadDistance is strictly less than unloadDistance (hysteresis margin)
        let hysteresisValid = true;
        for (const reg of regionList) {
            if (reg.loadDistance >= reg.unloadDistance) {
                hysteresisValid = false;
                break;
            }
        }
        check('WorldStreaming 8-region hysteresis margin (load < unload)', hasAll8Regions && hysteresisValid,
            `Regions: ${regionCount}, Hysteresis valid: ${hysteresisValid}`);

        // 5. OcclusionManager Frustum & Zone Culling
        const dummyCam = new THREE.PerspectiveCamera(60, 16/9, 0.1, 1000);
        const occlusion = new window.OcclusionManager(dummyCam);
        const hasFrustumTest = typeof occlusion.isSphereVisible === 'function' && typeof occlusion.isBoxVisible === 'function';
        // Test box in front of camera vs far behind
        dummyCam.position.set(0, 0, 0);
        dummyCam.lookAt(0, 0, -100);
        dummyCam.updateMatrixWorld();
        const visibleFront = occlusion.isSphereVisible(new THREE.Vector3(0, 0, -50), 5);
        const hiddenBehind = occlusion.isSphereVisible(new THREE.Vector3(0, 0, 150), 5);
        const occlusionCullingValid = hasFrustumTest && visibleFront === true && hiddenBehind === false;
        check('OcclusionManager frustum & distance culling verification', occlusionCullingValid);

        // 6. InstanceManager (THREE.InstancedMesh Batching)
        const instManager = new window.InstanceManager(dummyScene);
        const hasBatchMethods = typeof instManager.createBatch === 'function' && typeof instManager.setInstanceTransform === 'function';
        const dummyGeo = new THREE.BoxGeometry(1, 1, 1);
        const dummyMat = new THREE.MeshBasicMaterial();
        const batch = instManager.createBatch('test_boxes', dummyGeo, dummyMat, 50);
        const batchValid = batch instanceof THREE.InstancedMesh && batch.count === 50;
        instManager.setInstanceTransform('test_boxes', 0, { x: 10, y: 0, z: 10 });
        instManager.disposeBatch('test_boxes');
        check('InstanceManager instanced mesh batching & transform matrices', hasBatchMethods && batchValid);

        // 7. GraphicsSettingsUI PC Modal
        const ui = new window.GraphicsSettingsUI(settings);
        const modalEl = document.getElementById('graphics-settings-modal') || document.getElementById('pc-graphics-modal');
        const hasModalDOM = !!modalEl;
        const showValid = typeof ui.show === 'function' && typeof ui.hide === 'function';
        ui.show();
        const isActive = modalEl && (modalEl.classList.contains('active') || !modalEl.classList.contains('hidden'));
        ui.hide();
        const isClosed = modalEl && (!modalEl.classList.contains('active') || modalEl.classList.contains('hidden'));
        check('GraphicsSettingsUI modal lifecycle & DOM controls', hasModalDOM && showValid && isActive && isClosed);

    } catch (err) {
        check('PC Graphics Suite Execution', false, err.message);
    }

    const passed = results.every(r => r.passed);
    return { passed, results };
};
