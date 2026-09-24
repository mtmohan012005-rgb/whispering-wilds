// ============================================================================
// QA TEST: WebGL Context Loss, Renderer Recovery & Safe Mode
// ============================================================================

window.runTestRenderRecovery = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const gpu = window.gpuResourceManager || (window.GPUResourceManager ? new window.GPUResourceManager() : null);
  const prs = window.performanceRecoverySystem || (window.PerformanceRecoverySystem ? new window.PerformanceRecoverySystem() : null);
  assert('GPUResourceManager and PerformanceRecoverySystem exist', !!gpu && !!prs);

  // 1. Initial state
  assert('Safe mode initially inactive', prs.isSafeModeActive === false);

  // 2. Simulated WebGL context loss
  let pausedReason = null;
  const origPause = window.GameLifecycle?.pause;
  if (window.GameLifecycle) {
    window.GameLifecycle.pause = (reason) => { pausedReason = reason; };
  }

  gpu._onContextLost(null);
  assert('Simulation paused safely on context loss', pausedReason === 'GPU_CONTEXT_LOST');
  assert('Context loss count incremented', gpu.contextLossCount >= 1);

  // 3. Repeated context loss triggers Safe Mode
  gpu._onContextLost(null);
  assert('Repeated context loss activates Performance Safe Mode', prs.isSafeModeActive === true);

  // 4. Safe Mode profile parameters
  const safeProfile = window.PERFORMANCE_PROFILES ? window.PERFORMANCE_PROFILES.SAFE_MODE : null;
  assert('Safe Mode profile exists with conservative parameters', safeProfile && safeProfile.renderScale <= 0.6 && safeProfile.shadowQuality === 'none');

  // 5. Context restored
  let resumedReason = null;
  if (window.GameLifecycle) {
    window.GameLifecycle.resume = (reason) => { resumedReason = reason; };
  }
  gpu._onContextRestored(null);
  assert('Simulation resumed safely on context restoration', resumedReason === 'GPU_CONTEXT_RESTORED');

  // 6. Deactivate safe mode & restore
  prs.deactivateSafeMode();
  assert('Safe mode deactivated cleanly', prs.isSafeModeActive === false);

  if (window.GameLifecycle && origPause) {
    window.GameLifecycle.pause = origPause;
  }

  const passed = results.every(r => r.passed);
  return { name: 'Render Recovery & Safe Mode', passed, results };
};
