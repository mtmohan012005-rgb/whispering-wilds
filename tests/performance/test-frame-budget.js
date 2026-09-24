// ============================================================================
// QA TEST: Frame Budget, 1% Low Calculation & Delta Clamping
// ============================================================================

window.runTestFrameBudget = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const fbs = new window.FrameBudgetSystem(60);
  assert('FrameBudgetSystem created with 60 FPS', fbs.targetFPS === 60);
  assert('Frame budget for 60 FPS is ~16.67ms', Math.abs(fbs.frameBudgetMs - 16.67) < 0.1);

  // 1. Changing target FPS
  fbs.setTargetFPS(30);
  assert('Target FPS updated to 30', fbs.targetFPS === 30);
  assert('Frame budget for 30 FPS is ~33.33ms', Math.abs(fbs.frameBudgetMs - 33.33) < 0.1);

  // 2. Delta time clamping (Sections 74, 75)
  const hugeDelta = 3.5; // e.g. 3.5s tab switch freeze
  const clamped = fbs.clampDelta(hugeDelta);
  assert('Abnormal frame delta is clamped to maxDeltaTime (0.1s)', clamped === 0.1);
  assert('Normal delta passes through untouched', fbs.clampDelta(0.016) === 0.016);

  // 3. Rolling metrics & 1% low calculation
  fbs.setTargetFPS(60);
  // Feed 50 normal frames (16.6ms) and 10 slow frames (33.3ms)
  for (let i = 0; i < 50; i++) fbs.recordFrame(16.6);
  for (let i = 0; i < 10; i++) fbs.recordFrame(33.3);

  const snap = fbs.getSnapshot();
  assert('Average FPS computed accurately (~51-53 FPS)', snap.averageFPS >= 50 && snap.averageFPS <= 55);
  assert('Worst frame time captured (33.3ms)', Math.abs(snap.worstFrameTimeMs - 33.3) < 0.2);
  assert('1% low frame time reflects lower percentile', snap.onePercentLowFPS < snap.averageFPS);

  // 4. Bottleneck diagnostics
  fbs.averageGpuTime = 22.0; // High GPU render time (>75% budget)
  fbs._updateDiagnostics();
  assert('Diagnoses GPU bottleneck when render time is high', fbs.diagnostics === 'Likely GPU-bound');

  fbs.averageGpuTime = 4.0;
  fbs.averageCpuTime = 20.0; // High CPU update time (>75% budget)
  fbs._updateDiagnostics();
  assert('Diagnoses CPU bottleneck when update time is high', fbs.diagnostics === 'Likely CPU-bound');

  const passed = results.every(r => r.passed);
  return { name: 'Frame Budget & Pacing', passed, results };
};
