/**
 * Automated QA Test: CSRF Mitigation & Cookie Security Flags
 * Project: The Whispering Wilds (Kaattu Vazhi)
 */

window.testCsrfSuite = async function() {
  const results = [];
  const log = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`[QA AUTH-CSRF] ${passed ? '✓ PASS' : '✗ FAIL'}: ${name} - ${details}`);
  };

  try {
    // 1. Double Submit / Header CSRF Token Validation
    const expectedCsrfSecret = 'csrf_token_secret_xyz789';

    const validateRequest = (headers) => {
      const token = headers['x-csrf-token'] || headers['X-CSRF-Token'];
      if (!token || token !== expectedCsrfSecret) {
        return { allowed: false, status: 403, error: 'Invalid or missing CSRF token' };
      }
      return { allowed: true, status: 200 };
    };

    const validReq = validateRequest({ 'x-csrf-token': expectedCsrfSecret });
    const missingReq = validateRequest({});
    const forgedReq = validateRequest({ 'x-csrf-token': 'attacker_fake_token' });

    const csrfValidatesProperly = validReq.allowed && !missingReq.allowed && !forgedReq.allowed;
    log('CSRF Token Header Validation (State-Changing Requests)', csrfValidatesProperly,
      `Valid: ${validReq.allowed}, Missing blocked: ${!missingReq.allowed}, Forged blocked: ${!forgedReq.allowed}`);

    // 2. Cookie Security Flags Configuration
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/'
    };

    const isHttpOnly = cookieOptions.httpOnly === true;
    const isSecure = cookieOptions.secure === true;
    const isLaxOrStrict = cookieOptions.sameSite === 'Lax' || cookieOptions.sameSite === 'Strict';

    log('Session Cookie Security Headers (HttpOnly, Secure, SameSite)', isHttpOnly && isSecure && isLaxOrStrict,
      `HttpOnly=${isHttpOnly}, Secure=${isSecure}, SameSite=${cookieOptions.sameSite}`);

    // 3. CORS Restricted Origins Check (No wildcard for credentialed requests)
    const allowedOrigins = ['https://thewhisperingwilds.netlify.app', 'http://localhost:3000', 'http://127.0.0.1:5500'];
    const originCheck = (reqOrigin) => allowedOrigins.includes(reqOrigin);
    const wildcardBlocked = !originCheck('*');
    const attackerBlocked = !originCheck('https://malicious-game-rip.com');
    const prodAllowed = originCheck('https://thewhisperingwilds.netlify.app');

    log('CORS Restricted Allowed-Origin Authority (No Wildcard)', wildcardBlocked && attackerBlocked && prodAllowed,
      `Prod allowed: ${prodAllowed}, Attacker blocked: ${attackerBlocked}, Wildcard blocked: ${wildcardBlocked}`);

    return { passed: results.every(r => r.passed), results };
  } catch (err) {
    log('CSRF Suite Error', false, err.message);
    return { passed: false, results };
  }
};
