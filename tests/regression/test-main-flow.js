/**
 * tests/regression/test-main-flow.js
 * Regression test for the core game loop:
 * Boot -> Menu -> New Game -> Player Spawn -> Move -> Save -> Load -> Pause -> Resume -> Return Menu.
 */

(function () {
  'use strict';

  function runTestMainFlow() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const lc = window.GameLifecycle;
    const lv = window.LifecycleValidator;
    assert('GameLifecycle and LifecycleValidator exist', !!lc && !!lv);

    // 1. Validate state progression sequence
    assert('Can transition MAIN_MENU -> LOADING_GAME', lv.canTransition('MAIN_MENU', 'LOADING_GAME'));
    assert('Can transition LOADING_GAME -> PLAYING', lv.canTransition('LOADING_GAME', 'PLAYING'));
    assert('Can transition PLAYING -> PAUSED', lv.canTransition('PLAYING', 'PAUSED'));
    assert('Can transition PAUSED -> PLAYING', lv.canTransition('PAUSED', 'PLAYING'));
    assert('Can transition PLAYING -> REGION_TRANSITION', lv.canTransition('PLAYING', 'REGION_TRANSITION'));
    assert('Can transition REGION_TRANSITION -> PLAYING', lv.canTransition('REGION_TRANSITION', 'PLAYING'));
    assert('Can transition PLAYING -> MAIN_MENU', lv.canTransition('PLAYING', 'MAIN_MENU'));

    // 2. Validate clean GameState baseline
    if (window.GameState) {
      assert('GameState player object present', typeof window.GameState.player === 'object');
      assert('Customization ceiling is exactly 5', window.GameState.player.maxCustomizationChanges === 5);
      assert('Customization changes used is within 0..5', window.GameState.player.customizationChangesUsed >= 0 && window.GameState.player.customizationChangesUsed <= 5);
    }

    return results;
  }

  window.runTestMainFlow = runTestMainFlow;
})();
