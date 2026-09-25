/**
 * Platform Session & State Machine Unit Tests
 */

(function(root) {
  const PlatformSession = typeof require !== 'undefined' ? require('../../platform/platform-session') : root.PlatformSession;
  const DevelopmentPlatformProvider = typeof require !== 'undefined' ? require('../../platform/providers/development-provider') : root.DevelopmentPlatformProvider;

  async function runSessionTests() {
    const results = { name: 'PlatformSessionTests', passed: 0, failed: 0, errors: [] };

    function assert(cond, msg) {
      if (cond) results.passed++;
      else { results.failed++; results.errors.push(msg); }
    }

    const provider = new DevelopmentPlatformProvider();
    await provider.initialize();

    const session = new PlatformSession(provider);

    // 1. Initial connection
    const status = await session.init();
    assert(status === PlatformSession.SessionStatus.AVAILABLE, 'Session initialized to AVAILABLE');
    assert(session.isOnline === true, 'Session isOnline is true');
    assert(session.currentUser !== null, 'Current user populated');
    assert(session.currentUser.displayName !== '', 'User display name valid');

    // 2. Offline transition
    session.setOffline();
    assert(session.isOnline === false, 'Session transitioned to offline');
    assert(session.status === PlatformSession.SessionStatus.UNAVAILABLE, 'Status is UNAVAILABLE');

    // 3. Reconnect retry
    provider.simulateOffline(false);
    const reconnected = await session.retryConnection();
    assert(reconnected === true, 'Session reconnected successfully on retry');
    assert(session.isOnline === true, 'Session back online');

    // 4. Bounded retry limit
    provider.simulateOffline(true);
    session.retryAttempts = 3; // Max attempts reached
    const failedRetry = await session.retryConnection();
    assert(failedRetry === false, 'Blocked infinite retry after exceeding threshold');
    assert(session.status === PlatformSession.SessionStatus.PERMANENT_FAILURE, 'Marked PERMANENT_FAILURE after threshold');

    return results;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runSessionTests };
    if (require.main === module) {
      runSessionTests().then(r => {
        console.log(`[SessionTest] Passed: ${r.passed}, Failed: ${r.failed}`);
        if (r.failed > 0) process.exit(1);
      });
    }
  } else {
    root.testPlatformSession = runSessionTests;
  }
})(typeof window !== 'undefined' ? window : global);
