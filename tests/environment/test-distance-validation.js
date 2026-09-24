// ============================================================================
// QA TEST: Anti-Cheat Distance Validation for Environmental Interactions
// ============================================================================

window.runTestDistanceValidation = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const prop = new window.InteractiveProp({
    id: 'test_distance_prop',
    position: { x: 10, y: 0, z: 10 },
    interactionRadius: 2.5
  });

  // 1. In-range interaction (distance = 1.0m)
  const canNear = prop.canInteract({ x: 10, y: 0, z: 11 });
  assert('Interaction within 1m permitted', canNear === true);

  // 2. Boundary distance (distance = 2.4m)
  const canBoundary = prop.canInteract({ x: 10, y: 0, z: 12.4 });
  assert('Interaction at 2.4m boundary permitted', canBoundary === true);

  // 3. Out-of-range interaction (distance = 3.5m)
  const canOut = prop.canInteract({ x: 10, y: 0, z: 13.5 });
  assert('Interaction at 3.5m rejected', canOut === false);

  // 4. Impossible distance (distance = 45m anti-cheat check)
  const canImpossible = prop.canInteract({ x: 55, y: 0, z: 10 });
  assert('Impossible distance (45m away) rejected', canImpossible === false);

  const passed = results.every(r => r.passed);
  return { name: 'Interaction Distance & Anti-Cheat Validation', passed, results };
};
