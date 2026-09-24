// ============================================================================
// QA TEST: Prop State System Persistence & Authoritative Storage
// ============================================================================

window.runTestPersistentProps = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const sys = window.PropStateSystem;
  assert('PropStateSystem exists', !!sys);

  // 1. Record mechanism solve
  sys.recordMechanismState('chola_sluice_01', 'ALIGNED', true);
  assert('Mechanism state recorded', sys.isMechanismSolved('chola_sluice_01') === true);

  // 2. Record lamp state
  sys.recordLampState('lamp_thanjavur_01', true);
  assert('Lamp lit state recorded', sys.isLampLit('lamp_thanjavur_01') === true);

  // 3. Record discovery
  sys.recordDiscovery('prop_olai_chuvadi_01');
  assert('Discovery recorded in list', sys.interactions.discoveredInteractiveObjects.includes('prop_olai_chuvadi_01'));

  // 4. Verify authoritative GameState.world.interactions sync
  const interactions = window.GameState?.world?.interactions;
  assert('GameState.world.interactions holds authoritative data', !!interactions && interactions.solvedEnvironmentalObjects['chola_sluice_01'] === true);

  const passed = results.every(r => r.passed);
  return { name: 'Authoritative Prop Persistence', passed, results };
};
