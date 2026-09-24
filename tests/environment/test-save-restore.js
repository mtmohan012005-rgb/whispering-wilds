// ============================================================================
// QA TEST: Environmental Interactions Save & Restore Round-Trip
// ============================================================================

window.runTestSaveRestore = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const sm = window.SaveManager ? new window.SaveManager() : null;
  assert('SaveManager exists', !!sm);

  // Set up interaction state
  if (window.PropStateSystem) {
    window.PropStateSystem.recordDoorState('door_heritage_chettinad_01', true);
    window.PropStateSystem.recordContainerOpened('container_antique_chest_01', [{ itemId: 'rupees', count: 65 }]);
    window.PropStateSystem.recordMechanismState('puzzle_canal_sluice_01', 'OPEN', true);
  }

  // Capture state
  const captured = sm.captureState ? sm.captureState() : (sm._captureState ? sm._captureState() : sm._gatherState());
  assert('Captured snapshot retrieved', !!captured);
  assert('Captured save includes world.interactions', !!captured.world?.interactions);
  assert('Door recorded open in snapshot', captured.world.interactions.openedDoors['door_heritage_chettinad_01'] === true);
  assert('Container recorded opened in snapshot', captured.world.interactions.openedContainers['container_antique_chest_01'] === true);

  // Clear live state
  if (window.GameState?.world?.interactions) {
    window.GameState.world.interactions.openedDoors = {};
    window.GameState.world.interactions.openedContainers = {};
  }

  // Restore state
  sm.restoreState(captured);
  const liveInteractions = window.GameState?.world?.interactions;
  assert('Restored door state is true', liveInteractions?.openedDoors['door_heritage_chettinad_01'] === true);
  assert('Restored container state is true', liveInteractions?.openedContainers['container_antique_chest_01'] === true);

  const passed = results.every(r => r.passed);
  return { name: 'Environmental Interactions Save/Restore', passed, results };
};
