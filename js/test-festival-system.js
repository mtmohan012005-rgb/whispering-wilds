/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Dynamic Festival Lifecycle System
 * Validates Pongal, Karthigai Deepam, phase progression (Preparation -> Active -> Cleanup),
 * dynamic decoration instantiation, festive lighting, and state cleanup.
 */

window.runFestivalSystemTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[FESTIVAL TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING DYNAMIC FESTIVAL SYSTEM TEST SUITE <<<');

  try {
    const scene = new THREE.Scene();
    const collision = new window.WorldCollision();
    const festSys = new window.FestivalSystem(scene, collision);

    // -----------------------------------------------------------------
    // TEST 1: Festival Definitions & Schema Integrity
    // -----------------------------------------------------------------
    const defs = window.FESTIVAL_DEFINITIONS;
    const hasDefs = Array.isArray(defs) && defs.length >= 2;
    const hasPongal = defs.some(f => f.id === 'festival_pongal');
    const hasKarthigai = defs.some(f => f.id === 'festival_karthigai_deepam');

    log('Festival Definitions & Multi-Phase Schema Integrity',
      hasDefs && hasPongal && hasKarthigai,
      `Festivals: ${defs.length}, Pongal: ${hasPongal}, KarthigaiDeepam: ${hasKarthigai}`);

    // -----------------------------------------------------------------
    // TEST 2: Festival Start & Phase Progression (Prep -> Active -> Cleanup)
    // -----------------------------------------------------------------
    const started = festSys.startFestival('festival_pongal', 'PREPARATION');
    const prepPhase = festSys.currentPhaseKey === 'PREPARATION';

    // Transition to ACTIVE phase
    festSys.setPhase('ACTIVE');
    const activePhase = festSys.currentPhaseKey === 'ACTIVE' && festSys.activeDecorations.length > 0;

    log('Festival Start & Phase Progression (Preparation -> Active)',
      started && prepPhase && activePhase,
      `Started: ${started}, Phase: ${festSys.currentPhaseKey}, DecorationsSpawned: ${festSys.activeDecorations.length}`);

    // -----------------------------------------------------------------
    // TEST 3: Dynamic 3D Decorations (Sugarcane Bundles & Thoranam)
    // -----------------------------------------------------------------
    const hasDecMesh = festSys.activeDecorations.some(d => d.group && d.group.children.length > 0);

    log('Dynamic 3D Festival Decoration Spawning',
      hasDecMesh,
      `ActiveDecorationsCount: ${festSys.activeDecorations.length}, MeshesValid: ${hasDecMesh}`);

    // -----------------------------------------------------------------
    // TEST 4: Cleanup & Decoration Removal Transition
    // -----------------------------------------------------------------
    festSys.setPhase('CLEANUP');
    const inCleanup = festSys.currentPhaseKey === 'CLEANUP';

    festSys.setPhase('INACTIVE');
    const inactiveCleaned = festSys.currentPhaseKey === 'INACTIVE' && festSys.activeDecorations.length === 0;

    log('Festival Cleanup & Dynamic Asset Disposal',
      inCleanup && inactiveCleaned,
      `InCleanup: ${inCleanup}, InactiveAndCleaned: ${inactiveCleaned}`);

    // -----------------------------------------------------------------
    // TEST 5: Festival State Persistence Round-Trip
    // -----------------------------------------------------------------
    festSys.startFestival('festival_karthigai_deepam', 'ACTIVE');
    const saved = festSys.getState();

    const newFestSys = new window.FestivalSystem(scene, collision);
    newFestSys.applyState(saved);

    const roundTripValid = newFestSys.activeFestival &&
                           newFestSys.activeFestival.id === 'festival_karthigai_deepam' &&
                           newFestSys.currentPhaseKey === 'ACTIVE';

    log('Festival State Serialization & Persistence Round-Trip',
      roundTripValid,
      `RestoredFestival: "${newFestSys.activeFestival ? newFestSys.activeFestival.id : 'none'}", Phase: "${newFestSys.currentPhaseKey}"`);

    return {
      passed: results.every(r => r.passed),
      results
    };
  } catch (err) {
    log('Festival System Test Failure', false, err.message);
    return { passed: false, results };
  }
};
