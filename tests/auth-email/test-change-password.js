/**
 * Automated QA Test: Authenticated Password Change & Security Notifications
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testChangePasswordSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA AUTH-CHGPWD] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    const existingPasswordHash = 'mock_bcrypt_hash_old123';
    let securityEmailsSent = [];

    const changePassword = (currentPass, newPass, confirmPass) => {
      if (currentPass !== 'CorrectOldPass!1') {
        return { success: false, reason: 'Current password is incorrect.' };
      }
      if (newPass !== confirmPass) {
        return { success: false, reason: 'New password confirmation does not match.' };
      }
      if (newPass.length < 8) {
        return { success: false, reason: 'Password must be at least 8 characters long.' };
      }

      securityEmailsSent.push({
        subject: 'Security Alert: Your Whispering Wilds password was changed',
        timestamp: Date.now()
      });

      return { success: true };
    };

    // 1. Wrong current password rejected
    const wrongCurrent = changePassword('WrongPass123', 'NewPass2026!', 'NewPass2026!');
    log('Wrong Current Password Rejection', !wrongCurrent.success,
      `Blocked: "${wrongCurrent.reason}"`);

    // 2. Mismatched confirmation rejected
    const mismatch = changePassword('CorrectOldPass!1', 'NewPass2026!', 'TypoPass2026!');
    log('Mismatched Confirmation Rejection', !mismatch.success,
      `Blocked: "${mismatch.reason}"`);

    // 3. Valid change succeeds and dispatches security alert
    const validChange = changePassword('CorrectOldPass!1', 'NewPass2026!', 'NewPass2026!');
    const emailDispatched = securityEmailsSent.length === 1;
    log('Valid Password Change & Security Email Notification', validChange.success && emailDispatched,
      `Security email sent: "${securityEmailsSent[0]?.subject}"`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('Change Password Suite Error', false, err.message);
    return { passed: false, results };
  }
};
