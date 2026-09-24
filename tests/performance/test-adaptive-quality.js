// ============================================================================
// QA TEST: Adaptive Quality Scaling, Multi-Step Degradation & Hysteresis
// ============================================================================

window.runTestAdaptiveQuality = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const aqs = new window.AdaptiveQualitySystem();
  assert('AdaptiveQualitySystem instantiated', !!aqs);
  assert('Initial quality step is 100%', aqs.qualityStep === 100);

  // 1. Step down execution
  const steppedDown = aqs.stepDown();
  assert('stepDown reduces quality step', steppedDown === true && aqs.qualityStep === 90);
  assert('Runtime overrides reflect reduced scale/post-processing', aqs.runtimeOverrides.renderScale < 1.0);

  // 2. Minimum step ceiling
  for (let i = 0; i < 10; i++) aqs.stepDown();
  assert('Quality step never drops below minimum (50%)', aqs.qualityStep === 50);

  // 3. Step up restoration
  const steppedUp = aqs.stepUp();
  assert('stepUp restores quality step', steppedUp === true && aqs.qualityStep === 60);

  // 4. Hysteresis cooldown prevents flapping every frame
  aqs.qualityStep = 100;
  aqs.cooldownTimer = 5.0; // Simulated cooldown
  const lowFrameSnapshot = { targetFPS: 60, averageFPS: 45 };
  aqs.update(lowFrameSnapshot, 0.016);
  assert('Quality does not change while cooldown is active', aqs.qualityStep === 100);

  // 5. Manual override respect (Section 20)
  aqs.cooldownTimer = 0;
  aqs.setAutoQualityEnabled(false);
  aqs.lowPerformanceDuration = 10.0; // Exceeded threshold
  aqs.update(lowFrameSnapshot, 1.0);
  assert('Manual override prevents automatic quality reduction', aqs.qualityStep === 100);

  const passed = results.every(r => r.passed);
  return { name: 'Adaptive Quality & Hysteresis', passed, results };
};
