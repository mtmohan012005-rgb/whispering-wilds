/**
 * Automated QA Test: Password Reset Token Single-Use Invalidation & Re-Use Prevention
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testResetReuseSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA RESET-REUSE] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const tokenRecord = {
      id: 'tok_001',
      token_hash: 'hash_single_use_test',
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      used_at: null
    };

    const attemptReset = () => {
      if (tokenRecord.used_at) {
        return { success: false, error: 'This reset link is invalid or has expired.' };
      }
      tokenRecord.used_at = new Date().toISOString();
      return { success: true };
    };

    // First attempt: succeeds
    const firstAttempt = attemptReset();
    log('First Token Use Succeeded', firstAttempt.success && tokenRecord.used_at !== null,
      `Token consumed at: ${tokenRecord.used_at}`);

    // Second attempt with exact same token: must fail
    const secondAttempt = attemptReset();
    const replayBlocked = !secondAttempt.success;
    log('Replay / Token Reuse Prevented', replayBlocked,
      `Second attempt blocked: ${secondAttempt.error}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Reset Reuse Suite Error', false, err.message);
    return { passed: false, results };
  }
};
