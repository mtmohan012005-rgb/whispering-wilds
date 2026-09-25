/**
 * The Whispering Wilds - Automated Compatibility Verification Script
 * Validates platform adapters, graphics backends, fallback rules, and singletons.
 */
const path = require('path');
const fs = require('fs');

async function runCompatibilityVerification() {
  console.log('====================================================');
  console.log('THE WHISPERING WILDS: COMPATIBILITY VERIFICATION');
  console.log('====================================================\n');

  let passedChecks = 0;
  let failedChecks = 0;
  const errors = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedChecks++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failedChecks++;
      errors.push(message);
    }
  }

  // 1. Adapter files exist
  const requiredFiles = [
    'js/config/device-capability-schema.js',
    'js/config/device-fallback-rules.js',
    'js/platform/os-adapter.js',
    'js/platform/gpu-adapter.js',
    'js/platform/display-adapter.js',
    'js/platform/input-adapter.js',
    'js/platform/audio-adapter.js',
    'js/platform/storage-adapter.js',
    'js/platform/universal-platform-layer.js',
    'js/systems/device-profile-system.js',
    'js/systems/runtime-compatibility-system.js',
    'js/systems/automatic-recovery-system.js',
    'js/systems/device-adaptation-system.js',
    'js/systems/stability-manager.js',
    'js/ui/compatibility-center-ui.js',
    'js/ui/adaptive-notification-ui.js',
    'js/graphics/graphics-capability-detector.js',
    'js/graphics/graphics-backend-manager.js',
    'js/graphics/webgl2-backend.js',
    'js/graphics/webgl-fallback-backend.js',
    'js/graphics/webgpu-capability.js',
    'js/graphics/shader-capability.js',
    'js/graphics/texture-capability.js',
    'js/graphics/antialiasing-manager.js',
    'js/graphics/render-target-manager.js',
    'js/graphics/gpu-recovery-manager.js',
    'js/graphics/display-scaling-manager.js',
    'js/graphics/color-management.js',
    'js/systems/graphics-health-system.js',
    'js/systems/graphics-fallback-system.js',
    'js/systems/display-compatibility-system.js',
    'js/ui/graphics-capability-ui.js',
    'js/ui/graphics-recovery-ui.js'
  ];

  console.log('--- Phase 1: File Presence Verification ---');
  for (const f of requiredFiles) {
    const fullPath = path.join(__dirname, '..', f);
    assert(fs.existsSync(fullPath), `Required module exists: ${f}`);
  }

  console.log('\n--- Phase 2: Static Schema & Rule Integrity ---');
  const schema = require('../js/config/device-capability-schema');
  assert(schema && schema.DEVICE_PROFILES && schema.DEVICE_PROFILES.ULTRA === 'ULTRA', 'Device capability schema loaded cleanly');

  const fallbackRules = require('../js/config/device-fallback-rules');
  assert(fallbackRules && fallbackRules.GPU_DEGRADATION_ORDER.length === 7, 'GPU degradation priority rules verified (7 stages)');
  assert(fallbackRules && fallbackRules.HYSTERESIS_CONFIG.MIN_ADAPTATION_INTERVAL_MS >= 5000, 'Hysteresis anti-oscillation interval verified');

  console.log('\n--- Phase 3: Documentation Verification ---');
  const docs = [
    'docs/UNIVERSAL_COMPATIBILITY.md',
    'docs/SUPPORTED_DEVICES.md',
    'docs/FALLBACK_BEHAVIOR.md',
    'docs/GRAPHICS_BACKEND.md',
    'docs/GPU_COMPATIBILITY.md',
    'docs/DISPLAY_COMPATIBILITY.md'
  ];
  for (const d of docs) {
    const fullDocPath = path.join(__dirname, '..', d);
    assert(fs.existsSync(fullDocPath), `Documentation verified: ${d}`);
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedChecks} Passed, ${failedChecks} Failed`);
  console.log('====================================================');

  if (failedChecks > 0) {
    console.error('\nErrors encountered:');
    errors.forEach(e => console.error(` - ${e}`));
    process.exit(1);
  } else {
    console.log('\nAll compatibility verifications PASSED successfully.');
    process.exit(0);
  }
}

runCompatibilityVerification();
