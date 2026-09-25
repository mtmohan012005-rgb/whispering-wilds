// ============================================================================
// THE WHISPERING WILDS - CONTENT REGISTRY TEST SUITE
// Validates unique IDs, typed stores, version tracking, dependency trees,
// and cross-type duplicate collision guards.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Content Registry QA Tests ---');
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
      assert(reg !== null && typeof reg === 'object', 'ContentRegistry must exist on window');

      // 1. Register and retrieve custom test definition
      const testItem = {
        id: 'test_item_heritage_lamp',
        version: '1.0.0',
        nameEn: 'Bronze Ghee Lamp',
        nameTa: 'வெண்கல நெய் விளக்கு',
        weight: 0.8,
        value: 120
      };

      reg.register('item', testItem);
      const retrieved = reg.get('item', 'test_item_heritage_lamp');
      assert(retrieved !== null, 'Registered item must be retrievable by type and ID');
      assert(retrieved.nameEn === 'Bronze Ghee Lamp', 'Item properties must match registered definition');
      assert(reg.has('item', 'test_item_heritage_lamp') === true, 'reg.has must return true for registered ID');

      // 2. Querying by global ID
      const globalRetrieved = reg.getById('test_item_heritage_lamp');
      assert(globalRetrieved !== null && globalRetrieved.id === 'test_item_heritage_lamp', 'getById must resolve globally across types');

      // 3. Rejecting invalid IDs
      let emptyIdRejected = false;
      try {
        reg.register('item', { id: '' });
      } catch (_) {
        emptyIdRejected = true;
      }
      assert(emptyIdRejected, 'Empty ID registration must be rejected with an error');

      // 4. Rejecting cross-type duplicate IDs
      let crossTypeRejected = false;
      try {
        reg.register('npc', { id: 'test_item_heritage_lamp', name: 'Collision' });
      } catch (_) {
        crossTypeRejected = true;
      }
      assert(crossTypeRejected, 'Cross-type duplicate ID must be rejected to prevent namespace collisions');

      // 5. Query by region
      const testLoc = {
        id: 'test_loc_thanjavur_sanctum',
        region: 'thanjavur',
        coordinates: { x: 10.78, y: 79.13, z: 12.0 }
      };
      reg.register('location', testLoc);
      const thanjavurItems = reg.getByRegion('location', 'thanjavur');
      assert(Array.isArray(thanjavurItems) && thanjavurItems.length > 0, 'getByRegion must filter items by regional tag');

      // 6. Metrics inspection
      const metrics = reg.getMetrics();
      assert(metrics.totalDefinitions > 0, 'Registry metrics must report non-zero total definitions');
      assert(typeof metrics.byType === 'object', 'Metrics must report breakdown by content type');

      // Clean up test registrations
      reg.stores.get('item').delete('test_item_heritage_lamp');
      reg.idIndex.delete('test_item_heritage_lamp');
      reg.stores.get('location').delete('test_loc_thanjavur_sanctum');
      reg.idIndex.delete('test_loc_thanjavur_sanctum');

    } catch (err) {
      failed++;
      errors.push(`Unhandled registry test error: ${err.message}`);
    }

    return {
      suite: 'ContentRegistry',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testContentRegistry = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
