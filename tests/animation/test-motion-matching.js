/**
 * tests/animation/test-motion-matching.js
 * Verifies locomotion motion matching database lookup, trajectory scoring,
 * speed/direction cost calculation, continuity bonus, and aerial overrides.
 */

(function () {
  'use strict';

  function runTestMotionMatching() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const MM = window.MotionMatching;
    const AR = window.AnimationRegistry;
    assert('MotionMatching and AnimationRegistry classes are available', !!MM && !!AR);

    const registry = new AR();
    const mm = new MM(registry);

    // 1. Idle match at speed 0.0
    const idleQuery = { speed: 0.0, direction: 0.0, isGrounded: true };
    const idleMatch = mm.queryBestMatch(idleQuery);
    assert('Zero speed matches Player_Idle', idleMatch.clipId === 'Player_Idle');

    // 2. Walk match at speed 1.5 m/s forward
    const walkQuery = { speed: 1.5, direction: 0.0, isGrounded: true };
    const walkMatch = mm.queryBestMatch(walkQuery);
    assert('1.5 m/s forward matches Player_Walk', walkMatch.clipId === 'Player_Walk');

    // 3. Sprint match at speed 5.5 m/s forward
    const sprintQuery = { speed: 5.5, direction: 0.0, isGrounded: true };
    const sprintMatch = mm.queryBestMatch(sprintQuery);
    assert('5.5 m/s matches Player_Sprint', sprintMatch.clipId === 'Player_Sprint');

    // 4. Backward match
    const backQuery = { speed: 1.2, direction: Math.PI, isGrounded: true };
    const backMatch = mm.queryBestMatch(backQuery);
    assert('Backward heading matches Player_Backward', backMatch.clipId === 'Player_Backward');

    // 5. Aerial override (falling bypasses locomotion database)
    const aerialQuery = { speed: 3.5, direction: 0.0, isGrounded: false };
    const aerialMatch = mm.queryBestMatch(aerialQuery);
    assert('Non-grounded state yields Player_Fall', aerialMatch.clipId === 'Player_Fall');

    return results;
  }

  window.runTestMotionMatching = runTestMotionMatching;
})();
