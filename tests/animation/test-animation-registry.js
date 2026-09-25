/**
 * tests/animation/test-animation-registry.js
 * Verifies animation clip registration, metadata indexing, aliases,
 * category/state queries, and integrity validation.
 */

(function () {
  'use strict';

  function runTestAnimationRegistry() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const AnimationRegistry = window.AnimationRegistry;
    assert('AnimationRegistry class is available', !!AnimationRegistry);

    const registry = new AnimationRegistry();

    // 1. Initial metadata population from ANIMATION_DATA
    assert('Initial registry populated with clips', registry.clips.size > 10);
    assert('Contains Player_Idle clip', registry.hasClip('Player_Idle'));
    assert('Contains Player_Walk clip', registry.hasClip('Player_Walk'));

    // 2. Custom clip registration
    const testClip = {
      clipId: 'Test_Custom_Action',
      state: 'INTERACT',
      category: 'action',
      duration: 1.5,
      speed: 0.0,
      looping: false,
      events: [{ time: 0.75, name: 'CUSTOM_EVENT' }]
    };
    registry.registerClip(testClip);
    assert('Registered custom clip successfully', registry.hasClip('Test_Custom_Action'));

    // 3. Alias testing
    const aliasOk = registry.addAlias('WalkAlias', 'Player_Walk');
    assert('Alias added successfully', aliasOk === true);
    assert('Can retrieve clip via alias', registry.getClip('WalkAlias').clipId === 'Player_Walk');

    // 4. Query by criteria
    const locomotionClips = registry.queryClips({ category: 'locomotion' });
    assert('Found multiple locomotion clips', locomotionClips.length >= 6);
    const sprintClips = registry.queryClips({ state: 'SPRINT' });
    assert('Found sprint clip by state', sprintClips.length === 1 && sprintClips[0].clipId === 'Player_Sprint');

    // 5. Validation check
    const valResult = registry.validateRegisteredClips();
    assert('All registered clips pass validation', valResult.valid === true && valResult.issues.length === 0);

    return results;
  }

  window.runTestAnimationRegistry = runTestAnimationRegistry;
})();
