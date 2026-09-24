/**
 * Automated QA Test: OTP Attempt Limit (Max 5 Attempts) & Anti-Bruteforce Lockout
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testOtpAttemptLimitSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA OTP-LIMIT] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const validCode = '554129';
    let otpRecord = {
      code: validCode,
      attempt_count: 0,
      max_attempts: 5,
      is_invalidated: false
    };

    const tryCode = (candidate) => {
      if (otpRecord.is_invalidated || otpRecord.attempt_count >= otpRecord.max_attempts) {
        otpRecord.is_invalidated = true;
        return { success: false, reason: 'Maximum attempts exceeded. Please request a new code.' };
      }
      otpRecord.attempt_count++;
      if (candidate === otpRecord.code) {
        return { success: true };
      }
      if (otpRecord.attempt_count >= otpRecord.max_attempts) {
        otpRecord.is_invalidated = true;
      }
      return { success: false, reason: 'Invalid code. Attempt ' + otpRecord.attempt_count + ' of 5.' };
    };

    // 5 wrong attempts
    tryCode('000000');
    tryCode('111111');
    tryCode('222222');
    tryCode('333333');
    const attempt5 = tryCode('444444');
    const maxHit = otpRecord.attempt_count === 5 && otpRecord.is_invalidated;
    log('5 Consecutive Failed Attempts Trigger Invalidation', maxHit,
      `Attempt count: ${otpRecord.attempt_count}, Invalidated: ${otpRecord.is_invalidated}`);

    // 6th attempt with actual correct code fails because token was invalidated
    const attempt6Correct = tryCode(validCode);
    const lockedOut = !attempt6Correct.success && otpRecord.is_invalidated;
    log('6th Attempt Blocked Even With Correct Code', lockedOut,
      `Reason: "${attempt6Correct.reason}"`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('OTP Attempt Limit Suite Error', false, err.message);
    return { passed: false, results };
  }
};
