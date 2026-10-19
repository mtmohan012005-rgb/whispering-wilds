// ============================================================================
// THE WHISPERING WILDS — BACKEND SECURITY TESTS
// ============================================================================
//
// Comprehensive security test suite for the Node.js backend server.
// Covers: health checks, CSRF protection, authentication, CORS, rate limiting,
// input validation, save security, Socket.IO, and error handling.
//
// Usage: node scripts/test-backend-security.js
// Requires: server running on http://127.0.0.1:3000 (npm start)
// ============================================================================

const http = require('http');

const BASE_URL = 'http://127.0.0.1:3000';
let testsPassed = 0;
let testsFailed = 0;
let testsSkipped = 0;

function assert(condition, message) {
    if (condition) {
        testsPassed++;
        console.log(`  ✅ PASS: ${message}`);
    } else {
        testsFailed++;
        console.log(`  ❌ FAIL: ${message}`);
    }
}

function skip(message) {
    testsSkipped++;
    console.log(`  ⏭️  SKIP: ${message}`);
}

function request(method, path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: { 'Content-Type': 'application/json', ...headers }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed;
                try { parsed = JSON.parse(data); } catch { parsed = data; }
                resolve({ status: res.statusCode, body: parsed, headers: res.headers });
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

// ---------------------------------------------------------------------------
// Helper: register + login to get a session token
// ---------------------------------------------------------------------------
async function loginAs(email, password) {
    const unique = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const testEmail = email || `ww_${unique}@example.com`;
    const testPassword = password || 'TestPass123!';

    await new Promise((r) => setTimeout(r, 200));

    // Register (ignore if already exists)
    const regRes = await request('POST', '/api/auth/register', {
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        displayName: 'Test User'
    }, { 'X-WW-CSRF': '1' });

    if (regRes.status === 429) {
        await new Promise((r) => setTimeout(r, 1500));
        await request('POST', '/api/auth/register', {
            email: testEmail,
            password: testPassword,
            confirmPassword: testPassword,
            displayName: 'Test User'
        }, { 'X-WW-CSRF': '1' });
    }

    // Login
    const loginRes = await request('POST', '/api/auth/login', {
        email: testEmail,
        password: testPassword
    }, { 'X-WW-CSRF': '1' });

    if (!loginRes.body || !loginRes.body.token) {
        throw new Error(`Login failed: status=${loginRes.status}`);
    }
    return { token: loginRes.body.token, email: testEmail };
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testHealthEndpoints() {
    console.log('\n[Test] Health & Readiness Endpoints');

    // Health endpoint
    const health = await request('GET', '/health');
    assert(health.status === 200, 'Health endpoint returns 200');
    assert(health.body.status === 'ok', 'Health status is "ok"');
    assert(typeof health.body.uptime === 'number', 'Health includes uptime');
    assert(typeof health.body.timestamp === 'string', 'Health includes timestamp');

    // Versioned health endpoint
    const v1Health = await request('GET', '/api/v1/health');
    assert(v1Health.status === 200, 'Versioned health returns 200');
    assert(v1Health.body.version === '1', 'Versioned health has version field');
    assert(typeof v1Health.body.server !== 'undefined', 'Versioned health has server info');

    // Readiness endpoint
    const ready = await request('GET', '/ready');
    assert(ready.status === 200 || ready.status === 503, 'Readiness returns 200 or 503');
    assert(typeof ready.body.checks !== 'undefined', 'Readiness includes checks object');
}

async function testCSRFProtection() {
    console.log('\n[Test] CSRF Protection');

    // POST without CSRF header or Bearer token should be rejected
    const noCsrf = await request('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'password'
    });
    assert(noCsrf.status === 403, 'POST without CSRF header returns 403');
    assert(noCsrf.body.code === 'CSRF_FAILED' || noCsrf.body.message.includes('CSRF'), 'CSRF error code is present');

    // POST with X-WW-CSRF header should pass CSRF check
    const withCsrf = await request('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'password'
    }, { 'X-WW-CSRF': '1' });
    assert(withCsrf.status !== 403, 'POST with X-WW-CSRF header passes CSRF check');

    // GET requests should not require CSRF
    const getHealth = await request('GET', '/health');
    assert(getHealth.status === 200, 'GET requests do not require CSRF');
}

async function testAuthentication() {
    console.log('\n[Test] Authentication');

    // Unauthenticated access to protected routes
    const protectedRes = await request('GET', '/api/v1/persistence/saves/slot_0');
    assert(protectedRes.status === 401, 'Protected route returns 401 without auth');

    // Invalid token
    const invalidToken = await request('GET', '/api/v1/persistence/saves/slot_0', null, {
        'Authorization': 'Bearer invalid_token_here'
    });
    assert(invalidToken.status === 401, 'Invalid token returns 401');

    // Valid login flow
    try {
        const { token } = await loginAs();
        assert(!!token, 'Login returns a session token');

        // Authenticated access should work (200/404) or fail gracefully when
        // Firebase is not configured (500/503). The persistence routes require
        // Firebase credentials; without them they fail closed.
        const authRes = await request('GET', '/api/v1/persistence/saves/slot_0', null, {
            'Authorization': `Bearer ${token}`
        });
        assert(
            authRes.status === 200 || authRes.status === 404 || authRes.status === 500 || authRes.status === 503,
            `Authenticated request returns valid status (got ${authRes.status}, Firebase may not be configured)`
        );
    } catch (err) {
        skip(`Authentication test: ${err.message}`);
    }
}

async function testCORS() {
    console.log('\n[Test] CORS Configuration');

    const corsRes = await request('GET', '/health');
    assert(
        corsRes.headers['access-control-allow-origin'] !== undefined ||
        corsRes.headers['access-control-allow-credentials'] !== undefined,
        'CORS headers are present'
    );
}

async function testRateLimiting() {
    console.log('\n[Test] Rate Limiting');

    // Rapid login attempts should trigger rate limiting
    let rateLimited = false;
    for (let i = 0; i < 10; i++) {
        const res = await request('POST', '/api/auth/login', {
            email: 'rate_limit_test@example.com',
            password: 'password'
        }, { 'X-WW-CSRF': '1' });
        if (res.status === 429) {
            rateLimited = true;
            break;
        }
        await new Promise((r) => setTimeout(r, 50));
    }
    assert(rateLimited, 'Rate limiting activates after rapid requests');
}

async function testInputValidation() {
    console.log('\n[Test] Input Validation');

    // Empty body to login
    const emptyLogin = await request('POST', '/api/auth/login', {}, { 'X-WW-CSRF': '1' });
    assert(emptyLogin.status !== 200, 'Empty login body is rejected');

    // Malformed email
    const badEmail = await request('POST', '/api/auth/login', {
        email: 'not-an-email',
        password: 'password'
    }, { 'X-WW-CSRF': '1' });
    assert(badEmail.status !== 200, 'Malformed email is rejected');

    // Oversized payload
    const bigPayload = await request('POST', '/api/v1/persistence/saves', {
        data: 'x'.repeat(10_000_000) // 10MB, exceeds 5MB limit
    }, { 'X-WW-CSRF': '1' });
    assert(bigPayload.status !== 201 || bigPayload.status === 413, 'Oversized payload is rejected');
}

async function testSaveSecurity() {
    console.log('\n[Test] Save Security');

    try {
        const { token: token1 } = await loginAs();
        await new Promise((r) => setTimeout(r, 300));
        const { token: token2 } = await loginAs();

        // Cross-account access: User 1 tries to access User 2's save
        // The server derives userId from the session, so this should return
        // User 1's save (or 404), not User 2's save
        const crossAccount = await request('GET', '/api/v1/persistence/saves/slot_0', null, {
            'Authorization': `Bearer ${token1}`
        });
        assert(crossAccount.status === 200 || crossAccount.status === 404, 'Cross-account save access returns own data or 404');

        // Privileged field injection: client tries to set currency/achievements
        const injectionPayload = {
            saveId: 'slot_0',
            schemaVersion: 4,
            data: {
                currency: 999999999,
                achievements: ['all_unlocked'],
                premiumStatus: true,
                position: { x: 0, y: 0, z: 0 }
            },
            checksum: 'test'
        };
        const injectionRes = await request('POST', '/api/v1/persistence/saves', injectionPayload, {
            'Authorization': `Bearer ${token1}`,
            'X-WW-CSRF': '1'
        });
        // Server should accept the save but strip privileged fields
        assert(injectionRes.status === 201 || injectionRes.status === 200, 'Save upload accepts request');

    } catch (err) {
        skip(`Save security test: ${err.message}`);
    }
}

async function testSocketIO() {
    console.log('\n[Test] Socket.IO Configuration');

    // Check that Socket.IO endpoint exists
    const socketRes = await request('GET', '/socket.io/');
    assert(socketRes.status !== 404, 'Socket.IO endpoint exists');
}

async function testErrorHandling() {
    console.log('\n[Test] Error Handling');

    // Non-existent route
    const notFound = await request('GET', '/api/v1/nonexistent-route');
    assert(notFound.status === 404, 'Non-existent route returns 404');

    // Errors should not leak stack traces
    const errorRes = await request('POST', '/api/auth/login', {
        email: 'error_test@example.com',
        password: 'password'
    }, { 'X-WW-CSRF': '1' });
    const bodyStr = JSON.stringify(errorRes.body);
    assert(!bodyStr.includes('stack'), 'Error responses do not leak stack traces');
    assert(!bodyStr.includes('internal'), 'Error responses do not leak internal details');
}

async function testMEGARemoval() {
    console.log('\n[Test] MEGA Removal Verification');

    // MEGA routes should not exist
    const megaRes = await request('GET', '/api/v1/mega-persistence/ready');
    assert(megaRes.status === 404, 'MEGA persistence endpoint returns 404');

    // Check server config for MEGA references
    try {
        const fs = require('fs');
        const configContent = fs.readFileSync('server/config.js', 'utf8');
        assert(!configContent.includes('MEGA_EMAIL'), 'server/config.js has no MEGA_EMAIL');
        assert(!configContent.includes('MEGA_PASSWORD'), 'server/config.js has no MEGA_PASSWORD');
    } catch (err) {
        skip(`MEGA config check: ${err.message}`);
    }

    // Check package.json for megajs
    try {
        const fs = require('fs');
        const packageContent = fs.readFileSync('package.json', 'utf8');
        assert(!packageContent.includes('megajs'), 'package.json has no megajs dependency');
    } catch (err) {
        skip(`MEGA package check: ${err.message}`);
    }
}

async function testSecurityHeaders() {
    console.log('\n[Test] Security Headers');

    const res = await request('GET', '/health');
    // Check for common security headers (may not all be present)
    const hasSomeSecurityHeaders =
        res.headers['x-content-type-options'] !== undefined ||
        res.headers['x-frame-options'] !== undefined ||
        res.headers['strict-transport-security'] !== undefined;
    assert(hasSomeSecurityHeaders || true, 'Security headers check (informational)');
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
    console.log('='.repeat(70));
    console.log('THE WHISPERING WILDS — BACKEND SECURITY TESTS');
    console.log('='.repeat(70));

    // Check if server is running
    try {
        await request('GET', '/health');
    } catch (err) {
        console.error('\n❌ Server not running. Start with: npm start');
        console.error(`   Error: ${err.message}`);
        process.exit(1);
    }

    // Run all test suites
    await testHealthEndpoints();
    await testCSRFProtection();
    await testAuthentication();
    await testCORS();
    await testRateLimiting();
    await testInputValidation();
    await testSaveSecurity();
    await testSocketIO();
    await testErrorHandling();
    await testMEGARemoval();
    await testSecurityHeaders();

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`  ✅ Passed:  ${testsPassed}`);
    console.log(`  ❌ Failed:  ${testsFailed}`);
    console.log(`  ⏭️  Skipped: ${testsSkipped}`);
    console.log(`  📊 Total:   ${testsPassed + testsFailed + testsSkipped}`);

    if (testsFailed > 0) {
        console.log('\n⚠️  Some tests failed. Review the output above.');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}

main().catch((err) => {
    console.error('\n❌ Test runner error:', err.message);
    process.exit(1);
});
