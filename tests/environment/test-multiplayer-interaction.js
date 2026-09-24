// ============================================================================
// QA TEST: Multiplayer Authoritative Environmental Interaction Validation
// ============================================================================

window.runTestMultiplayerInteraction = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const sys = window.PropStateSystem;
  assert('PropStateSystem exists for MP validation', !!sys);

  // 1. Authoritative validation of valid interaction
  const validCheck = sys.validateInteractionRequest(
    'door_heritage_chettinad_01',
    'OPEN',
    { x: 0, y: 0, z: 0 }
  );
  assert('Valid door interaction approved', validCheck.valid === true);

  // 2. Reject unknown prop
  const unknownCheck = sys.validateInteractionRequest(
    'non_existent_prop_999',
    'OPEN',
    { x: 0, y: 0, z: 0 }
  );
  assert('Unknown prop interaction rejected', unknownCheck.valid === false && unknownCheck.reason === 'unknown_prop');

  // 3. Reject invalid action
  const invalidActionCheck = sys.validateInteractionRequest(
    'door_heritage_chettinad_01',
    'HARVEST',
    { x: 0, y: 0, z: 0 }
  );
  assert('Invalid action for prop rejected', invalidActionCheck.valid === false && invalidActionCheck.reason === 'invalid_action_for_prop');

  // 4. Duplicate container claim rejected across network
  sys.recordContainerOpened('container_antique_chest_01', []);
  const duplicateLootCheck = sys.validateInteractionRequest(
    'container_antique_chest_01',
    'OPEN',
    { x: 0, y: 0, z: 0 }
  );
  assert('Duplicate container claim rejected across network', duplicateLootCheck.valid === false && duplicateLootCheck.reason === 'already_looted');

  const passed = results.every(r => r.passed);
  return { name: 'Multiplayer Interaction Validation', passed, results };
};
