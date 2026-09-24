// ============================================================================
// QA TEST: Hardware Detection, WebGL Capabilities & Profile Recommendation
// ============================================================================

window.runTestHardwareDetection = async function() {
  const results = [];
  const assert = (name, condition, details = '') => {
    results.push({ name, passed: !!condition, details });
    if (!condition) console.error(`[FAIL] ${name}: ${details}`);
  };

  const hds = window.hardwareDetectionSystem || (window.HardwareDetectionSystem ? new window.HardwareDetectionSystem() : null);
  assert('HardwareDetectionSystem exists', !!hds);

  // 1. Safe probing
  const detected = hds.detect();
  assert('Detected hardware returns valid object', !!detected && typeof detected === 'object');
  assert('CPU cores detected (>0)', typeof detected.cpuCores === 'number' && detected.cpuCores > 0);
  assert('Device memory detected (>0)', typeof detected.deviceMemoryGB === 'number' && detected.deviceMemoryGB > 0);
  assert('GPU renderer detected or fallback string present', typeof detected.gpuRenderer === 'string' && detected.gpuRenderer.length > 0);
  assert('Max texture size reported', typeof detected.maxTextureSize === 'number' && detected.maxTextureSize >= 2048);

  // 2. Profile recommendation
  const rec = hds.getRecommendation();
  assert('Recommendation object exists', !!rec);
  const validTiers = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'ULTRA'];
  assert('Recommended tier is valid capability tier', validTiers.includes(rec.tier));
  assert('Hardware score is between 10 and 100', rec.score >= 10 && rec.score <= 100);

  // 3. Heuristic classification of low-end hardware
  if (window.HardwareProfiles?.classifyHardware) {
    const lowEndSim = {
      cpuCores: 2,
      deviceMemoryGB: 2,
      gpuRenderer: 'Intel HD Graphics 4000',
      maxTextureSize: 4096
    };
    const lowClass = window.HardwareProfiles.classifyHardware(lowEndSim);
    assert('Low-end dual-core iGPU classified as VERY_LOW or LOW', lowClass.tier === 'VERY_LOW' || lowClass.tier === 'LOW');

    const highEndSim = {
      cpuCores: 16,
      deviceMemoryGB: 32,
      gpuRenderer: 'NVIDIA GeForce RTX 4080',
      maxTextureSize: 16384,
      webglVersion: 2
    };
    const highClass = window.HardwareProfiles.classifyHardware(highEndSim);
    assert('High-end modern GPU classified as HIGH or ULTRA', highClass.tier === 'HIGH' || highClass.tier === 'ULTRA');
  }

  // 4. Lightweight benchmark test
  const bench = await hds.runLightweightBenchmark();
  assert('Lightweight benchmark completes without throwing', !!bench && typeof bench.averageFrameMs === 'number');

  const passed = results.every(r => r.passed);
  return { name: 'Hardware Detection & Profiling', passed, results };
};
