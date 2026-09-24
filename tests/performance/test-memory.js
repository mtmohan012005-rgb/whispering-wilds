// ============================================================================
// QA TEST: Memory Management, Shared Resource Safety & Pressure Trimming
// ============================================================================

window.runTestMemory = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const mm = new window.MemoryManager();
  assert('MemoryManager instantiated', !!mm);

  // 1. Shared resource reference counting (Section 117)
  mm.registerSharedResource('mat_weathered_teak');
  mm.registerSharedResource('mat_weathered_teak');
  assert('Resource has 2 active references', mm.sharedResourceRefs.get('mat_weathered_teak') === 2);
  assert('Resource cannot be safely disposed with 2 refs', mm.canSafelyDispose('mat_weathered_teak') === false);

  let disposed = false;
  mm.releaseSharedResource('mat_weathered_teak', () => { disposed = true; });
  assert('First release reduces ref count without disposing', disposed === false && mm.sharedResourceRefs.get('mat_weathered_teak') === 1);

  mm.releaseSharedResource('mat_weathered_teak', () => { disposed = true; });
  assert('Final release invokes dispose callback', disposed === true);
  assert('Resource can be safely disposed after ref count reaches 0', mm.canSafelyDispose('mat_weathered_teak') === true);

  // 2. Memory snapshot telemetry
  const snap = mm.getMemorySnapshot();
  assert('Memory snapshot returned', !!snap && typeof snap === 'object');
  assert('Valid pressure level reported', ['NORMAL', 'ELEVATED', 'CRITICAL'].includes(snap.pressureLevel));

  // 3. Pressure management execution
  let trimmed = false;
  window.waterReactionEngine = { trimPool: () => { trimmed = true; } };
  mm.handleMemoryPressure(true);
  assert('Memory pressure response executes pool trimming', trimmed === true);

  // 4. Critical gameplay asset protection check
  if (window.AssetQualityManager) {
    const aqm = new window.AssetQualityManager();
    const protectedObj = { isPlayer: true, group: { userData: { isHeroCollider: true } } };
    assert('Player entity is protected from memory culling', aqm.isProtectedGameplayObject(protectedObj) === true);

    const questObj = { group: { userData: { questObject: true } } };
    assert('Active quest object is protected from memory culling', aqm.isProtectedGameplayObject(questObj) === true);
  }

  const passed = results.every(r => r.passed);
  return { name: 'Memory Management & Resource Safety', passed, results };
};
