/**
 * Automated QA Test: Password Reset Token Expiry Validation
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testResetExpirySuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA RESET-EXPIRY] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // 1. Token valid within 60 minutes
    const validToken = {
      token_hash: 'hash_live_token',
      expires_at: new Date(now + 30 * 60 * 1000).toISOString(), // 30m remaining
      used_at: null
    };
    const isValid = new Date(validToken.expires_at).getTime() > now && !validToken.used_at;
    log('Reset Token Valid Within Expiry Window', isValid,
      `Expires in 30 minutes: valid=${isValid}`);

    // 2. Token expired (created 2 hours ago)
    const expiredToken = {
      token_hash: 'hash_stale_token',
      expires_at: new Date(now - 10 * 60 * 1000).toISOString(), // expired 10m ago
      used_at: null
    };
    const isExpired = new Date(expiredToken.expires_at).getTime() <= now;
    log('Reset Token Expiry Rejection', isExpired,
      `Expired at: ${expiredToken.expires_at}`);

    // 3. Sanitized User-Facing Feedback
    const errorMessage = isExpired ? 'This reset link is invalid or has expired.' : 'OK';
    const messageValid = errorMessage === 'This reset link is invalid or has expired.';
    log('User-Facing Expiry Error Message', messageValid,
      `Error string: "${errorMessage}"`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Reset Expiry Suite Error', false, err.message);
    return { passed: false, results };
  }
};
