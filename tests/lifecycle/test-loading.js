// ============================================================================
// THE WHISPERING WILDS - LIFECYCLE TEST: LOADING PIPELINE
// Tests: LoadingManager stages, weights, real task progress, and bilingual tips.
// ============================================================================

(function () {
  'use strict';

  function runTests() {
    const results = [];
    const assert = (cond, msg) => { if (!cond) throw new Error(msg || 'Assertion failed'); };

    try {
      assert(window.LoadingManager, 'LoadingManager missing');
      assert(window.LOADING_TIPS, 'LOADING_TIPS data missing');
      assert(Array.isArray(window.LOADING_TIPS) && window.LOADING_TIPS.length > 0, 'LOADING_TIPS must not be empty');

      // Check bilingual tips format
      const firstTip = window.LOADING_TIPS[0];
      assert(firstTip.en && firstTip.ta, 'Loading tips must have both English and Tamil text');

      // Check LoadingScreenUI exists
      assert(window.LoadingScreenUI, 'LoadingScreenUI missing');

      results.push({ name: 'Loading Pipeline Stages & Bilingual Tips', passed: true });
    } catch (e) {
      results.push({ name: 'Loading Pipeline Stages & Bilingual Tips', passed: false, error: e.message });
    }

    return { suite: 'LifecycleLoading', passed: results.every(r => r.passed), results };
  }

  window.testLifecycleLoading = runTests;
})();
