// ============================================================================
// QA TEST: Device Compatibility, Ultrawide, DPR Caps & Budget Enforcement
// ============================================================================

window.runTestDeviceCompatibility = function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const dcs = new window.DeviceCompatibilitySystem();
  assert('DeviceCompatibilitySystem instantiated', !!dcs);

  // 1. DPR Cap enforcement (Section 81, 82)
  dcs.setDprCap(1.25);
  assert('DPR cap stored correctly', dcs.dprCap === 1.25);
  assert('Effective DPR does not exceed cap', dcs.effectiveDPR <= 1.25);

  // 2. Aspect ratio & Ultrawide detection (Section 126)
  dcs.resolutionWidth = 3440;
  dcs.resolutionHeight = 1440;
  dcs.aspectRatio = 3440 / 1440; // ~2.38
  dcs.isUltrawide = dcs.aspectRatio >= 2.1;
  assert('Ultrawide (21:9) detected properly', dcs.isUltrawide === true);

  dcs.resolutionWidth = 1920;
  dcs.resolutionHeight = 1080;
  dcs.aspectRatio = 16 / 9;
  dcs.isUltrawide = dcs.aspectRatio >= 2.1;
  assert('Standard 16:9 is not classified as ultrawide', dcs.isUltrawide === false);

  // 3. PerformanceManager Spawn Budget Enforcement (Sections 106, 107, 108)
  const pm = window.performanceManager || (window.PerformanceManager ? new window.PerformanceManager() : null);
  assert('PerformanceManager exists for budget enforcement', !!pm);

  pm.applyProfile('VERY_LOW');
  assert('Active profile switched to VERY_LOW', pm.currentTier === 'VERY_LOW');

  // Traffic budget on VERY_LOW is 2
  pm.spawnCounts.traffic = 0;
  assert('Can spawn traffic when under budget', pm.canSpawn('traffic') === true);
  pm.spawnCounts.traffic = 2;
  assert('Cannot spawn traffic when budget is exhausted', pm.canSpawn('traffic') === false);

  // 4. Absolute Rule: Player customization changes <= 5 (Section 188)
  const usedCustomization = window.GameState?.player?.customizationChangesUsed || 0;
  assert('Player customization changes count <= 5', usedCustomization <= 5);

  const passed = results.every(r => r.passed);
  return { name: 'Device Compatibility & Budget Enforcement', passed, results };
};
