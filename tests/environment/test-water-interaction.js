// ============================================================================
// QA TEST: Water Interaction, Depth Checks & Ripple Particle Pooling
// ============================================================================

window.runTestWaterInteraction = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const sys = window.WaterInteractionSystem;
  assert('WaterInteractionSystem exists', !!sys);

  // 1. Dry ground check (outside water zones)
  const dryState = sys.evaluateWaterAt(50, 0, 50);
  assert('Dry ground returns inWater = false', dryState.inWater === false && dryState.depthClass.id === 'DRY');

  // 2. Pichavaram Mangrove Canal check (bounds: 2500..4200, -120..120, waterLevelY = 0.0)
  // Shallow entry: y = -0.15 (depth 0.15m)
  const shallowState = sys.evaluateWaterAt(3000, -0.15, 0);
  assert('Shallow canal water detected (SHALLOW)', shallowState.inWater === true && shallowState.depthClass.id === 'SHALLOW');

  // Deep center: y = -1.2 (depth 1.2m)
  const deepState = sys.evaluateWaterAt(3000, -1.2, 0);
  assert('Deep channel detected (DEEP)', deepState.inWater === true && deepState.depthClass.id === 'DEEP');
  assert('Deep water blocks normal walking', deepState.depthClass.blocksMovement === true);

  // 3. Ripple creation & recycling
  for (let i = 0; i < 70; i++) {
    sys.createRipple(3000, 0, 0, 0.2, 1.5, 1200);
  }
  assert('Ripples pool capped at budget limit', sys.ripples.length <= sys.budgets.MAX_RIPPLE_RINGS);

  const passed = results.every(r => r.passed);
  return { name: 'Water Interaction & Ripple Pooling', passed, results };
};
