/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Developer Validation Suite: Kolam System & Morning Threshold Art
 * Validates kolam lifecycle states (NOT_DRAWN, PREPARING, DRAWING, COMPLETE, DECORATED),
 * doorway floor decals, player observation interaction, and cultural lore recording.
 */

window.runKolamSystemTests = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[KOLAM TEST] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  console.log('>>> RUNNING KOLAM THRESHOLD ART TEST SUITE <<<');

  try {
    const scene = new THREE.Scene();
    const kolamSys = new window.KolamSystem(scene);

    // -----------------------------------------------------------------
    // TEST 1: Default Kolam Placements & Decals Integrity
    // -----------------------------------------------------------------
    const hasPlacements = kolamSys.kolamPlacements.length >= 3;
    const hasMeshes = kolamSys.kolamPlacements.every(k => !!k.mesh);

    log('Default Kolam Placements & Decal Geometry',
      hasPlacements && hasMeshes,
      `Placements: ${kolamSys.kolamPlacements.length}, DecalMeshesAttached: ${hasMeshes}`);

    // -----------------------------------------------------------------
    // TEST 2: Daily Kolam Lifecycle States (Not Drawn -> Complete -> Decorated)
    // -----------------------------------------------------------------
    // Set NOT_DRAWN (before dawn)
    kolamSys.setGlobalKolamState('NOT_DRAWN');
    const notDrawnHidden = kolamSys.kolamPlacements[0].mesh.visible === false;

    // Set COMPLETE (morning drawn)
    kolamSys.setGlobalKolamState('COMPLETE');
    const completeVisible = kolamSys.kolamPlacements[0].mesh.visible === true;

    // Set DECORATED (festive kaavi border)
    kolamSys.setGlobalKolamState('DECORATED');
    const decoratedTinted = kolamSys.kolamPlacements[0].mesh.material.color.getHex() === 0xffe082;

    log('Daily Kolam Lifecycle State Progression',
      notDrawnHidden && completeVisible && decoratedTinted,
      `NotDrawnHidden: ${notDrawnHidden}, CompleteVisible: ${completeVisible}, DecoratedFestive: ${decoratedTinted}`);

    // -----------------------------------------------------------------
    // TEST 3: Kolam Observation Interaction & Cultural Lore
    // -----------------------------------------------------------------
    const obsRes = kolamSys.observeKolam('kolam_chettinad_mansion');
    const observedOk = obsRes && obsRes.name && obsRes.description;

    log('Kolam Observation Interaction & Cultural Lore Recording',
      observedOk,
      `Observed: "${obsRes ? obsRes.name : 'none'}", State: "${obsRes ? obsRes.state : 'none'}"`);

    return {
      passed: results.every(r => r.passed),
      results
    };
  } catch (err) {
    log('Kolam System Test Failure', false, err.message);
    return { passed: false, results };
  }
};
