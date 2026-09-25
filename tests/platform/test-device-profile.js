/**
 * The Whispering Wilds - Test Suite: Device Profile
 */
(function(root) {
  'use strict';

  async function testDeviceProfile() {
    const results = { passed: 0, failed: 0, errors: [] };

    try {
      const DeviceProfileSystem = root.DeviceProfileSystem || (typeof require !== 'undefined' && require('../../js/systems/device-profile-system'));
      if (!DeviceProfileSystem) throw new Error('DeviceProfileSystem class not available');

      // Test 1: High-end profile mapping
      const highProfile = new DeviceProfileSystem({
        gpuClass: 'HIGH_DEDICATED',
        logicalCores: 8,
        memoryClass: 'HIGH',
        graphicsApi: 'WEBGL2'
      });
      if (highProfile.getProfileTier() === 'ULTRA') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Expected ULTRA, got ${highProfile.getProfileTier()}`);
      }

      // Test 2: Low-end profile mapping
      const lowProfile = new DeviceProfileSystem({
        gpuClass: 'INTEGRATED',
        logicalCores: 2,
        memoryClass: 'LOW',
        graphicsApi: 'WEBGL2'
      });
      if (lowProfile.getProfileTier() === 'LOW' || lowProfile.getProfileTier() === 'VERY_LOW') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Expected LOW/VERY_LOW, got ${lowProfile.getProfileTier()}`);
      }

      // Test 3: Unknown hardware safely defaults to MEDIUM
      const unknownProfile = new DeviceProfileSystem({
        gpuClass: 'UNKNOWN',
        logicalCores: 2,
        memoryClass: 'UNKNOWN',
        graphicsApi: 'WEBGL2'
      });
      if (unknownProfile.getProfileTier() === 'MEDIUM') {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push(`Unknown hardware did not default to MEDIUM: ${unknownProfile.getProfileTier()}`);
      }

      // Test 4: Micro-benchmark runs safely in bounded time
      const benchResults = await unknownProfile.runMicroBenchmark();
      if (benchResults && benchResults.totalBenchmarkTimeMs < 1000) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push('Benchmark took too long or failed to return valid metrics');
      }

    } catch (err) {
      results.failed++;
      results.errors.push(err.message);
    }

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = testDeviceProfile;
  } else {
    root.testDeviceProfile = testDeviceProfile;
  }
})(typeof window !== 'undefined' ? window : global);
