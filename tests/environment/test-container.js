// ============================================================================
// QA TEST: Interactive Container & Loot Duplication Protection
// ============================================================================

window.runTestContainer = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const container = new window.InteractiveContainer({
    id: 'test_trunk_01',
    lootTable: [
      { itemId: 'rupees', count: 50 },
      { itemId: 'rope', count: 1, weight: 0.2 }
    ]
  });

  assert('Container initializes closed and unlooted', container.isOpen === false && container.isLooted === false);

  // First opening
  const initialRupees = window.GameState?.player?.currency || 0;
  const res1 = container.open({});
  assert('First open succeeds', res1.success === true && container.isOpen === true);
  assert('Loot granted on first open', res1.items && res1.items.length === 2);

  // Check PropStateSystem anti-duplication flag
  const isClaimed = window.PropStateSystem ? window.PropStateSystem.isContainerClaimed('test_trunk_01') : false;
  assert('Container marked claimed in PropStateSystem', isClaimed === true);

  // Second opening attempt
  const res2 = container.open({});
  assert('Second open prevents duplicate loot', res2.success === false || (res2.items && res2.items.length === 0));

  const passed = results.every(r => r.passed);
  return { name: 'Container Loot Duplication Protection', passed, results };
};
