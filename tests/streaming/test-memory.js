/**
 * tests/streaming/test-memory.js
 * Verifies HOT/WARM/COLD cache tiers, shared asset reference counting,
 * memory pressure response, and leak-free resource eviction.
 */

(function () {
  'use strict';

  async function runTestMemory() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const CacheClass = window.StreamingCache;
    assert('StreamingCache class is available', !!CacheClass);

    const cache = new CacheClass({ coldCapacity: 4 });

    // 1. Multi-tier Cache Promotion & Demotion (Section 51)
    cache.markHot('CELL_CHE_001', { name: 'High Court', assets: ['shared_brick_mat'] });
    assert('CELL_CHE_001 in HOT cache', cache.hot.has('CELL_CHE_001'));
    assert('HOT cache count is 1', cache.hot.size === 1);

    cache.markWarm('CELL_CHE_002', { name: 'Bazaar', assets: ['shared_brick_mat'] });
    assert('CELL_CHE_002 in WARM cache', cache.warm.has('CELL_CHE_002'));

    // Demote HOT to COLD
    cache.demoteToCold('CELL_CHE_001');
    assert('CELL_CHE_001 removed from HOT', !cache.hot.has('CELL_CHE_001'));
    assert('CELL_CHE_001 demoted to COLD', cache.cold.has('CELL_CHE_001'));

    // 2. Shared Asset Reference Counting (Section 50)
    cache.retainAsset('palmyra_leaf_tex', null, 'texture');
    cache.retainAsset('palmyra_leaf_tex', null, 'texture');
    cache.retainAsset('palmyra_leaf_tex', null, 'texture');
    assert('Shared asset refCount is 3 across cells', cache.getAssetRefCount('palmyra_leaf_tex') === 3);

    cache.releaseAsset('palmyra_leaf_tex', false);
    assert('Shared asset refCount decremented to 2', cache.getAssetRefCount('palmyra_leaf_tex') === 2);

    cache.releaseAsset('palmyra_leaf_tex', false);
    cache.releaseAsset('palmyra_leaf_tex', false);
    assert('Shared asset refCount reached 0', cache.getAssetRefCount('palmyra_leaf_tex') === 0);

    // 3. Cold Cache Capacity & Overflow Eviction (Section 51, 98)
    cache.demoteToCold('CELL_CHE_002');
    cache.demoteToCold('CELL_CHE_003');
    cache.demoteToCold('CELL_CHE_004');
    cache.demoteToCold('CELL_CAU_001'); // 5th item exceeds capacity of 4
    assert('Cold cache bounded by capacity <= 4', cache.cold.size <= 4);

    // 4. Memory Pressure Response (Section 52)
    // Populate cache with HOT, WARM, and COLD entries
    cache.markHot('CELL_THA_001', { name: 'Thanjavur Temple' });
    cache.markWarm('CELL_THA_002', { name: 'Mandapam' });
    cache.demoteToCold('CELL_CHT_001', { name: 'Chettinad' });

    // Simulate CRITICAL memory pressure
    cache.handleMemoryPressure('CRITICAL');
    assert('CRITICAL pressure completely purged COLD cache', cache.cold.size === 0);
    assert('CRITICAL pressure strictly preserved HOT active cells', cache.hot.has('CELL_THA_001'));

    return results;
  }

  window.runTestStreamingMemory = runTestMemory;
})();
