// ============================================================================
// THE WHISPERING WILDS - LOCATION CONTENT TEST SUITE
// Validates data-driven locations, numeric coordinates, and ambience bindings.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Location Content QA Tests ---');
    let passed = 0;
    let failed = 0;
    const errors = [];

    function assert(cond, msg) {
      if (cond) {
        passed++;
      } else {
        failed++;
        errors.push(msg);
        console.error(`[FAIL] ${msg}`);
      }
    }

    try {
      const reg = window.ContentRegistry;
      assert(reg !== null, 'ContentRegistry must exist on window');

      // 1. Author a test location entirely from data
      const testLoc = {
        id: 'loc_test_mamallapuram_shore_temple',
        version: '1.0.0',
        name: 'Mamallapuram Shore Temple',
        nameTa: 'மாமல்லபுரம் கடற்கரைக் கோவில்',
        region: 'mamallapuram',
        coordinates: { x: 12.6164, y: 80.1983, z: 4.5 },
        environmentType: 'coastal_granite_heritage',
        weatherProfile: 'sea_breeze',
        ambienceProfile: 'amb_mamallapuram_surf',
        fastTravelAvailable: true
      };

      reg.register('location', testLoc);
      const retrieved = reg.get('location', 'loc_test_mamallapuram_shore_temple');

      assert(retrieved !== null, 'Location created from data must be retrievable');
      assert(typeof retrieved.coordinates?.x === 'number', 'Coordinates x must be numeric');
      assert(typeof retrieved.coordinates?.y === 'number', 'Coordinates y must be numeric');
      assert(retrieved.region === 'mamallapuram', 'Region must match authored data');
      assert(retrieved.fastTravelAvailable === true, 'Fast travel property must be true');

      // Clean up test location
      reg.stores.get('location').delete('loc_test_mamallapuram_shore_temple');
      reg.idIndex.delete('loc_test_mamallapuram_shore_temple');

    } catch (err) {
      failed++;
      errors.push(`Unhandled location content test error: ${err.message}`);
    }

    return {
      suite: 'LocationContent',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testLocationContent = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
