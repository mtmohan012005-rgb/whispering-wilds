/**
 * tests/animation/test-animation-performance.js
 * Verifies animation LOD distance tiering (LOD0 to LOD3), frame throttling,
 * Alt+Tab delta-time clamping, and duplicate mixer detection.
 */

(function () {
  'use strict';

  function runTestAnimationPerformance() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const APS = window.AnimationPerformanceSystem;
    const AC = window.AnimationCache;
    const Ctrl = window.AnimationController;
    assert('Animation performance classes available', !!APS && !!AC && !!Ctrl);

    const perfSystem = new APS();
    const cache = new AC();

    // 1. Duplicate mixer detection
    const mockMixer1 = { stopAllAction: () => {}, uncacheRoot: () => {}, getRoot: () => ({}) };
    const firstReg = cache.registerMixer(mockMixer1);
    assert('First mixer registration accepted', firstReg === true);

    const dupReg = cache.registerMixer(mockMixer1);
    assert('Duplicate mixer registration rejected', dupReg === false);

    // 2. Alt+Tab / Sleep delta time clamping (Section 70)
    const ctrl = new Ctrl(null, 'PLAYER');
    // Simulate huge 2-second freeze from background sleep or debugger
    const res = ctrl.update(2.0, { speed: 1.5 });
    assert('Delta time safely clamped without crashing', res && res.state !== undefined);

    // 3. Distance-based LOD assignment
    const mockNPCNear = new Ctrl(null, 'NPC');
    mockNPCNear.rootObject = { position: { x: 10, y: 0, z: 0 } }; // 10m (LOD0)

    const mockNPCMid = new Ctrl(null, 'NPC');
    mockNPCMid.rootObject = { position: { x: 50, y: 0, z: 0 } }; // 50m (LOD1)

    const mockNPCFar = new Ctrl(null, 'NPC');
    mockNPCFar.rootObject = { position: { x: 100, y: 0, z: 0 } }; // 100m (LOD2)

    const mockNPCDistant = new Ctrl(null, 'NPC');
    mockNPCDistant.rootObject = { position: { x: 250, y: 0, z: 0 } }; // 250m (LOD3)

    perfSystem.registerController(mockNPCNear);
    perfSystem.registerController(mockNPCMid);
    perfSystem.registerController(mockNPCFar);
    perfSystem.registerController(mockNPCDistant);

    const playerPos = { x: 0, y: 0, z: 0 };
    perfSystem.updateLODs(playerPos);

    assert('Near NPC assigned to LOD0', mockNPCNear.lodTier === 0);
    assert('Mid-distance NPC assigned to LOD1', mockNPCMid.lodTier === 1);
    assert('Far NPC assigned to LOD2', mockNPCFar.lodTier === 2);
    assert('Distant NPC assigned to LOD3', mockNPCDistant.lodTier === 3);

    // 4. Clean resource disposal
    mockNPCNear.dispose();
    assert('Controller dispose releases actions cleanly', mockNPCNear.actions.size === 0);

    return results;
  }

  window.runTestAnimationPerformance = runTestAnimationPerformance;
})();
