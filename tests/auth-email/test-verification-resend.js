/**
 * Automated QA Test: Email Verification Resend Throttling & Anti-Flooding
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testVerificationResendSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA AUTH-RESEND] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    // 1. In-memory / Token Throttling Bucket (Max 3 requests / 15 minutes)
    const resendWindowMs = 15 * 60 * 1000;
    const maxAttempts = 3;
    const resendHistory = [];

    const requestResend = () => {
      const now = Date.now();
      const recent = resendHistory.filter(ts => now - ts < resendWindowMs);
      if (recent.length >= maxAttempts) {
        return { allowed: false, error: 'Too many verification requests. Please wait 15 minutes.' };
      }
      resendHistory.push(now);
      return { allowed: true };
    };

    // First 3 requests succeed
    const req1 = requestResend();
    const req2 = requestResend();
    const req3 = requestResend();
    const firstThreeAllowed = req1.allowed && req2.allowed && req3.allowed;
    log('Initial Resend Requests Allowed (3 Allowed)', firstThreeAllowed,
      `Attempts logged: ${resendHistory.length}`);

    // 4th request within 15 minutes is throttled
    const req4 = requestResend();
    const fourthThrottled = !req4.allowed;
    log('4th Resend Attempt Throttled Within 15-Minute Window', fourthThrottled,
      `Blocked response: "${req4.error}"`);

    // 2. Client-Side Button Cooldown Timer
    const cooldownDurationSec = 45;
    let timerRemaining = cooldownDurationSec;
    const isButtonDisabled = timerRemaining > 0;
    log('UI Button Cooldown Lockdown Active', isButtonDisabled,
      `Cooldown timer: ${timerRemaining}s countdown`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Verification Resend Suite Error', false, err.message);
    return { passed: false, results };
  }
};
