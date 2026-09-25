/**
 * tests/runtime/test-resource-leaks.js
 * Verifies resource reference-counting, safe disposal triggers,
 * and snapshot diffing for leak detection.
 */

(function () {
  'use strict';

  function runTestResourceLeaks() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const rld = window.ResourceLeakDetector;
    assert('ResourceLeakDetector is available', !!rld);

    // Test 1: Reference counting retention
    rld.retain('mat_chola_granite', 'material', 'region_thanjavur');
    rld.retain('mat_chola_granite', 'material', 'prop_temple');
    assert('Resource retained twice has refCount = 2', rld.getRefCount('mat_chola_granite') === 2);

    // Test 2: Release once keeps resource alive
    const canDispose1 = rld.release('mat_chola_granite');
    assert('First release does not trigger disposal (refCount = 1)', canDispose1 === false && rld.getRefCount('mat_chola_granite') === 1);

    // Test 3: Release final reference allows disposal
    const canDispose2 = rld.release('mat_chola_granite');
    assert('Final release triggers safe disposal approval', canDispose2 === true && rld.getRefCount('mat_chola_granite') === 0);

    // Test 4: Snapshots and diff comparison
    rld.takeSnapshot('before_cycle');
    rld.takeSnapshot('after_cycle');
    const diff = rld.compareSnapshots('before_cycle', 'after_cycle');
    assert('Snapshot comparison executed successfully', diff.valid === true);
    assert('No leak flagged for stable cycle', diff.potentialLeak === false);

    return results;
  }

  window.runTestResourceLeaks = runTestResourceLeaks;
})();
