// ============================================================================
// THE WHISPERING WILDS - AUTH UNIT TESTS: REGISTRATION & LOGIN
// ============================================================================

const assert = require('assert');
const AuthService = require('../../server/auth/auth-service');
const db = require('../../server/auth/db');
const Validation = require('../../server/auth/validation');

async function runTests() {
    console.log('--- Running Auth Registration & Login Tests ---');

    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'StrongPassword123!';
    const testName = 'TestExplorer';

    // 1. Invalid email registration
    const invalidEmailRes = await AuthService.register({
        email: 'invalid-email',
        displayName: testName,
        password: testPassword,
        confirmPassword: testPassword
    }, '127.0.0.1');
    assert.strictEqual(invalidEmailRes.success, false, 'Invalid email should fail');

    // 2. Password mismatch
    const mismatchRes = await AuthService.register({
        email: testEmail,
        displayName: testName,
        password: testPassword,
        confirmPassword: 'DifferentPassword123!'
    }, '127.0.0.1');
    assert.strictEqual(mismatchRes.success, false, 'Password mismatch should fail');

    // 3. Short password
    const shortPassRes = await AuthService.register({
        email: testEmail,
        displayName: testName,
        password: 'short',
        confirmPassword: 'short'
    }, '127.0.0.1');
    assert.strictEqual(shortPassRes.success, false, 'Short password should fail');

    // 4. Valid Registration
    const regRes = await AuthService.register({
        email: testEmail,
        displayName: testName,
        password: testPassword,
        confirmPassword: testPassword
    }, '127.0.0.1');
    assert.strictEqual(regRes.success, true, 'Valid registration should succeed');
    assert.strictEqual(regRes.data.user.email, testEmail.toLowerCase(), 'Email should be normalized');

    // 5. Duplicate Registration
    const dupRes = await AuthService.register({
        email: testEmail.toUpperCase(), // uppercase variation
        displayName: testName,
        password: testPassword,
        confirmPassword: testPassword
    }, '127.0.0.1');
    assert.strictEqual(dupRes.success, false, 'Duplicate email registration should fail');

    // 6. Invalid Login (wrong password)
    const badPassLogin = await AuthService.login({
        email: testEmail,
        password: 'WrongPassword999!'
    }, '127.0.0.1');
    assert.strictEqual(badPassLogin.success, false, 'Invalid password should fail');
    assert.strictEqual(badPassLogin.message, 'Email or password is incorrect.', 'Generic error expected');

    // 7. Valid Login
    const validLogin = await AuthService.login({
        email: testEmail,
        password: testPassword,
        remember: true
    }, '127.0.0.1');
    assert.strictEqual(validLogin.success, true, 'Valid credentials should log in');
    assert.ok(validLogin.sessionId, 'Session ID must be issued');

    // 8. Session profile retrieval
    const profileRes = AuthService.getProfile(validLogin.sessionId);
    assert.strictEqual(profileRes.success, true, 'Profile lookup by session should succeed');
    assert.strictEqual(profileRes.data.user.displayName, testName);

    // 9. Logout invalidation
    const logoutRes = AuthService.logout(validLogin.sessionId);
    assert.strictEqual(logoutRes.success, true, 'Logout should succeed');
    const expiredProfile = AuthService.getProfile(validLogin.sessionId);
    assert.strictEqual(expiredProfile.success, false, 'Session should be invalidated after logout');

    console.log('✓ Registration and Login tests passed successfully.');
}

module.exports = { runTests };
if (require.main === module) {
    runTests().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
