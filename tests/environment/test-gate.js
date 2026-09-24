// ============================================================================
// QA TEST: Interactive Gate Entity & Navigation Updates
// ============================================================================

window.runTestGate = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const gate = new window.InteractiveGate({
    id: 'test_farm_gate_01',
    isDualWing: true,
    defaultState: 'CLOSED'
  });

  assert('Gate initializes in closed state', gate.isOpen === false);
  assert('Gate is not passable when closed', gate.isPassable() === false);

  // Open gate
  gate.open();
  assert('Gate opens', gate.isOpen === true);
  assert('Open gate is passable', gate.isPassable() === true);

  // Check state recording in PropStateSystem
  const isRecorded = window.PropStateSystem ? window.PropStateSystem.isDoorOpen('test_farm_gate_01') : false;
  assert('Gate open state persisted in PropStateSystem', isRecorded === true);

  // Close gate
  gate.close();
  assert('Gate closes', gate.isOpen === false);
  const isClosedRecorded = window.PropStateSystem ? window.PropStateSystem.isDoorOpen('test_farm_gate_01') : true;
  assert('Gate closed state persisted in PropStateSystem', isClosedRecorded === false);

  const passed = results.every(r => r.passed);
  return { name: 'Interactive Gate & Navigation', passed, results };
};
