// ============================================================================
// THE WHISPERING WILDS - AUTH SECURITY & CLOUD SAVE TESTS
// ============================================================================

const assert = require('assert');
const AuthService = require('../../server/auth/auth-service');
const rateLimiter = require('../../server/auth/rate-limit');
const Validation = require('../../server/auth/validation');

async function runTests() {
    console.log('--- Running Auth Security & Cloud Save Tests ---');

    // 1. Account enumeration protection on forgot-password
    const forgotUnknown = await AuthService.forgotPassword({ email: 'nonexistent_account_xyz@wilds.test' }, '127.0.0.1');
    assert.strictEqual(forgotUnknown.success, true);
    assert.strictEqual(forgotUnknown.message, 'If an account exists, password reset instructions will be provided.');

    // 2. Cloud Save Customization Limit: Strict Enforcement of 5 changes maximum
    const validCustomizationSave = {
        saveVersion: 3,
        customizationChangesUsed: 4,
        inventory: [{ id: 'tea_cup', weight: 0.2, quantity: 1 }]
    };
    const validCheck = Validation.validateCloudSave(validCustomizationSave);
    assert.strictEqual(validCheck.valid, true, 'Save with <= 5 customization changes must be accepted');

    // Attempting 6 changes: MUST BE REJECTED
    const excessiveCustomizationSave = {
        saveVersion: 3,
        customizationChangesUsed: 6,
        inventory: []
    };
    const excessiveCheck = Validation.validateCloudSave(excessiveCustomizationSave);
    assert.strictEqual(excessiveCheck.valid, false, 'Save with > 5 customization changes must be rejected');

    // 3. Rate limiter check
    const testIp = '192.168.1.100';
    for (let i = 0; i < 5; i++) {
        rateLimiter.check('security_test', testIp, 5, 1000);
    }
    const blockedCheck = rateLimiter.check('security_test', testIp, 5, 1000);
    assert.strictEqual(blockedCheck.allowed, false, 'Rate limiter must block after limit reached');

    console.log('✓ Auth security and 5-change customization limit tests passed successfully.');
}

module.exports = { runTests };
if (require.main === module) {
    runTests().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
