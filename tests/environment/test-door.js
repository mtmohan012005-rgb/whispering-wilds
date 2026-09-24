// ============================================================================
// QA TEST: Interactive Door States, Hinge Motion & Passability
// ============================================================================

window.runTestDoor = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const door = new window.InteractiveDoor({
    id: 'test_door_01',
    isLocked: true,
    requiredKey: 'brass_key',
    lockHint: { en: 'Requires brass key', ta: 'பித்தளை சாவி தேவை' }
  });

  assert('Door initialized in LOCKED state', door.state === 'LOCKED');
  assert('Locked door is not passable', door.isPassable() === false);

  // Try opening without key
  const lockedRes = door.onInteract('OPEN', {}, { hasKey: () => false });
  assert('Opening locked door fails without key', lockedRes.success === false && lockedRes.reason === 'locked');

  // Unlock with key
  const unlocked = door.unlock('brass_key');
  assert('Unlock succeeds with brass_key', unlocked === true && door.state === 'CLOSED');

  // Open door
  door.open();
  assert('Door transitions to OPENING', door.state === 'OPENING');

  // Simulate hinge animation
  door.update(0.5);
  assert('Door angle advancing during opening', door.currentAngle > 0);
  door.update(1.0);
  assert('Door fully opened reaches OPEN state', door.state === 'OPEN');
  assert('Open door is passable (no invisible walls)', door.isPassable() === true);

  // Close door
  door.close();
  assert('Door transitions to CLOSING', door.state === 'CLOSING');
  door.update(1.5);
  assert('Door closed reaches CLOSED state', door.state === 'CLOSED');
  assert('Closed door is not passable', door.isPassable() === false);

  const passed = results.every(r => r.passed);
  return { name: 'Interactive Door State Machine', passed, results };
};
