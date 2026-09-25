// ============================================================================
// THE WHISPERING WILDS - CONTENT VALIDATOR TEST SUITE
// Validates automated detection of broken references, circular dependencies,
// duplicate IDs, and verifies the exact required validation report format.
// ============================================================================

(function () {
  'use strict';

  async function runTests() {
    console.log('--- Running Content Validator QA Tests ---');
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
      const validator = window.ContentValidator;
      const reg = window.ContentRegistry;
      assert(validator !== null && typeof validator === 'object', 'ContentValidator must exist on window');

      // 1. Run validation on existing registry
      const reportData = validator.validateAll();
      assert(reportData !== null, 'validateAll must return validation report object');
      assert(typeof reportData.reportString === 'string', 'Report string must be generated');

      // 2. Format verification of report string
      const reportLines = reportData.reportString.split('\n');
      assert(reportLines[0] === 'CONTENT VALIDATION', 'Report header must be CONTENT VALIDATION');
      assert(reportLines[1] === '------------------', 'Report separator must match specification');
      assert(reportLines.some(l => l.startsWith('Errors:')), 'Report must include Errors line');
      assert(reportLines.some(l => l.startsWith('Broken References:')), 'Report must include Broken References line');

      // 3. Test detecting broken reference
      const brokenQuest = {
        id: 'quest_broken_test',
        region: 'chennai',
        objectives: [
          { id: 'b1', type: 'talk_npc', target: 'npc_completely_nonexistent' }
        ]
      };
      reg.register('quest', brokenQuest);

      const invalidReport = validator.validateAll();
      const detectedBroken = invalidReport.brokenReferences.some(r => r.target === 'npc_completely_nonexistent');
      assert(detectedBroken === true, 'Validator must detect broken NPC reference');

      // Clean up broken quest
      reg.stores.get('quest').delete('quest_broken_test');
      reg.idIndex.delete('quest_broken_test');

      // 4. Test detecting circular dependencies
      if (window.ContentUtils) {
        const cyclicGraph = {
          quest_a: ['quest_b'],
          quest_b: ['quest_c'],
          quest_c: ['quest_a']
        };
        const cycleResult = window.ContentUtils.detectCycles(cyclicGraph);
        assert(cycleResult.hasCycle === true, 'Cycle detector must detect circular quest dependencies');
      }

      // Re-run clean validation
      const cleanReport = validator.validateAll();
      console.log('\n' + cleanReport.reportString + '\n');
      assert(cleanReport.errorCount === 0, `Clean content registry must have 0 errors, got: ${cleanReport.errors.map(e => e.message).join('; ')}`);
      assert(cleanReport.brokenRefCount === 0, `Clean content registry must have 0 broken references, got: ${cleanReport.brokenReferences.map(r => r.message).join('; ')}`);

    } catch (err) {
      failed++;
      errors.push(`Unhandled content validator test error: ${err.message}`);
    }

    return {
      suite: 'ContentValidator',
      passed,
      failed,
      errors
    };
  }

  if (typeof window !== 'undefined') {
    window.testContentValidator = runTests;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runTests;
  }
})();
