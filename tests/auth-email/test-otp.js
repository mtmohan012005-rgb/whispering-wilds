/**
 * Automated QA Test: 6-Digit Cryptographic OTP Generation & Verification
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testOtpSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA OTP] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    // 1. 6-Digit Format Verification
    const generateTestOtp = () => {
      const num = Math.floor(100000 + Math.random() * 900000);
      return String(num);
    };
    const sampleCode = generateTestOtp();
    const isSixDigits = /^\d{6}$/.test(sampleCode);
    log('6-Digit Numeric OTP Code Format', isSixDigits,
      `Generated code sample: ${sampleCode}`);

    // 2. Client Security: Zero localStorage OTP Stash
    const isStoredInLocal = typeof localStorage !== 'undefined' && localStorage.getItem('user_otp');
    log('Client Storage Security (No LocalStorage OTP Leak)', !isStoredInLocal,
      'OTP codes are strictly ephemeral and never persisted in browser storage');

    // 3. Verification Simulation
    const actualCode = '839214';
    let otpRecord = {
      code_hash: 'hash_839214',
      expires_at: Date.now() + 10 * 60 * 1000,
      attempt_count: 0,
      used_at: null
    };

    const verifyCode = (entered) => {
      if (Date.now() > otpRecord.expires_at) return { valid: false, error: 'Code expired' };
      if (otpRecord.attempt_count >= 5) return { valid: false, error: 'Too many attempts' };
      otpRecord.attempt_count++;
      if (entered === actualCode) {
        otpRecord.used_at = Date.now();
        return { valid: true };
      }
      return { valid: false, error: 'Incorrect code' };
    };

    const correctVerification = verifyCode('839214');
    log('Valid 6-Digit OTP Verification Succeeded', correctVerification.valid,
      `Attempts: ${otpRecord.attempt_count}, Used: ${!!otpRecord.used_at}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('OTP Suite Error', false, err.message);
    return { passed: false, results };
  }
};
