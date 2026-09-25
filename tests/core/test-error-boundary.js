/**
 * tests/core/test-error-boundary.js
 * Unit tests for ErrorBoundary exception trapping, fallback execution,
 * and duplicate error rate limiting.
 */

(function () {
  'use strict';

  function runTestErrorBoundary() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const eb = window.ErrorBoundary;
    assert('ErrorBoundary is instantiated', !!eb);

    // Test 1: Wrap catches exception and returns fallback
    let fallbackInvoked = false;
    const res = eb.wrap('TestAudio', () => {
      throw new Error('Simulated audio node decode failure');
    }, (err) => {
      fallbackInvoked = true;
      return 'fallback_silent_audio';
    }, false);

    assert('ErrorBoundary caught error without throwing', res === 'fallback_silent_audio');
    assert('Fallback handler was executed', fallbackInvoked === true);

    // Test 2: Rate limiting duplicate errors
    eb.clearErrors();
    for (let i = 0; i < 5; i++) {
      eb.catchError('SpamSubsystem', new Error('Repeated loop error'), 'RECOVERABLE');
    }
    const logged = eb.getErrors().filter(e => e.systemId === 'SpamSubsystem');
    assert('Repeated identical errors are rate-limited to single entry', logged.length === 1);

    return results;
  }

  window.runTestErrorBoundary = runTestErrorBoundary;
})();
