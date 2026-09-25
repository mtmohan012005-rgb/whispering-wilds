/**
 * Crash Handler, Breadcrumbs & Safe Mode Recovery Unit Tests
 */

const crashHandler = require('../electron/crash-handler');

function runCrashTests() {
  const results = { name: 'CrashTests', passed: 0, failed: 0, errors: [] };

  function assert(condition, message) {
    if (condition) {
      results.passed++;
    } else {
      results.failed++;
      results.errors.push(message);
    }
  }

  // 1. Breadcrumbs recorded and sanitized
  crashHandler.addBreadcrumb('auth', 'User logged in with password="SecretPassword123" and token=Bearer abcdef123456');
  const diagnostics = crashHandler.exportDiagnostics();

  const foundBreadcrumb = diagnostics.recentBreadcrumbs.find(b => b.category === 'auth');
  assert(foundBreadcrumb !== undefined, 'Breadcrumb recorded');
  assert(!foundBreadcrumb.message.includes('SecretPassword123'), 'Sensitive password redacted from breadcrumb');
  assert(!foundBreadcrumb.message.includes('abcdef123456'), 'Bearer token redacted from breadcrumb');

  // 2. Crash record format
  const crash = crashHandler.recordCrash('TestWebGLError', new Error('Simulated context loss'));
  assert(crash.errorType === 'TestWebGLError', 'Crash error type recorded');
  assert(crash.platform !== undefined, 'Platform recorded in crash');
  assert(crash.architecture !== undefined, 'Architecture recorded in crash');

  // 3. Customization ceiling invariant present in diagnostics
  assert(diagnostics.customizationChangesCeiling === 5, 'Diagnostics reports strict 5 customization limit');

  // 4. Safe mode trigger logic
  crashHandler.sessionState.consecutiveCrashes = 3;
  crashHandler.sessionState.safeModeRecommended = true;
  assert(crashHandler.shouldOfferSafeMode() === true, 'Safe mode recommended after 3 consecutive crashes');

  crashHandler.resetCrashCounter();
  assert(crashHandler.shouldOfferSafeMode() === false, 'Crash counter reset clears safe mode flag');

  return results;
}

if (require.main === module) {
  const r = runCrashTests();
  console.log(`[CrashTest] Passed: ${r.passed}, Failed: ${r.failed}`);
  if (r.failed > 0) {
    r.errors.forEach(e => console.error(' *', e));
    process.exit(1);
  }
}

module.exports = { runCrashTests };
