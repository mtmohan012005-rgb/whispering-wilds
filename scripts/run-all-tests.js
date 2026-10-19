// ============================================================================
// THE WHISPERING WILDS — SELF-CONTAINED TEST RUNNER
// ============================================================================
//
// Starts the backend server, waits for readiness, runs all test suites,
// captures output, and stops the server — even if a test fails.
//
// Usage: node scripts/run-all-tests.js
// ============================================================================

const { spawn } = require('child_process');
const path = require('path');

const SERVER_PORT = 3000;
const SERVER_STARTUP_MS = 3000;
const HEALTH_CHECK_RETRIES = 10;
const HEALTH_CHECK_INTERVAL_MS = 500;

function log(msg) {
    console.log(`[test-runner] ${msg}`);
}

function httpGet(urlStr) {
    return new Promise((resolve) => {
        const http = require('http');
        http.get(urlStr, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', () => resolve(null));
    });
}

async function waitForServer() {
    log('Waiting for server to be ready...');
    for (let i = 0; i < HEALTH_CHECK_RETRIES; i++) {
        const res = await httpGet(`http://127.0.0.1:${SERVER_PORT}/health`);
        if (res && res.status === 200) {
            log('Server is ready.');
            return true;
        }
        await new Promise((r) => setTimeout(r, HEALTH_CHECK_INTERVAL_MS));
    }
    return false;
}

function runScript(name, command, args) {
    return new Promise((resolve) => {
        log(`Running: ${name} (${command} ${args.join(' ')})`);
        const child = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            const line = data.toString().trim();
            if (line) console.log(`  ${line}`);
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            const line = data.toString().trim();
            if (line) console.log(`  ${line}`);
            stderr += data.toString();
        });

        child.on('close', (code) => {
            resolve({ name, code, stdout, stderr });
        });

        // Kill after 60 seconds to avoid hanging
        setTimeout(() => {
            log(`  ⏱️  ${name} timed out after 60s, killing...`);
            child.kill('SIGTERM');
            setTimeout(() => child.kill('SIGKILL'), 2000);
        }, 60000);
    });
}

async function main() {
    console.log('=== Whispering Wilds — Self-Contained Test Runner ===\n');

    // Start the server
    log('Starting backend server...');
    const server = spawn('node', ['server.js'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, PORT: String(SERVER_PORT) }
    });

    let serverStderr = '';
    server.stderr.on('data', (data) => {
        serverStderr += data.toString();
    });
    server.stdout.on('data', (data) => {
        // Server startup messages are usually on stderr
    });

    // Wait for server
    await new Promise((r) => setTimeout(r, SERVER_STARTUP_MS));
    const ready = await waitForServer();

    if (!ready) {
        log('❌ Server failed to start. Stderr:');
        console.log(serverStderr);
        server.kill('SIGTERM');
        process.exit(1);
    }

    // Run test suites
    const testScripts = [
        { name: 'Backend Security Tests', cmd: 'node', args: ['scripts/test-backend-security.js'] },
        { name: 'Cloud Save Regression Tests', cmd: 'node', args: ['scripts/test-cloud-save-regression.js'] },
        { name: 'Game Verification', cmd: 'node', args: ['scripts/verify-game.js'] },
        { name: 'Production Verification', cmd: 'node', args: ['scripts/verify-production.js'] },
        { name: 'Asset Verification', cmd: 'node', args: ['scripts/verify-assets.js'] },
        { name: 'Runtime Verification', cmd: 'node', args: ['scripts/verify-runtime.js'] },
        { name: 'Compatibility Verification', cmd: 'node', args: ['scripts/verify-compatibility.js'] },
        { name: 'Socket.IO Integration Tests', cmd: 'node', args: ['scripts/test-socketio-integration.js'] }
    ];

    let totalPassed = 0;
    let totalFailed = 0;

    console.log('\n=== Test Results ===\n');
    for (const script of testScripts) {
        const result = await runScript(script.name, script.cmd, script.args);
        if (result.code === 0) {
            console.log(`  ✅ ${script.name}: PASS\n`);
            totalPassed++;
        } else {
            console.log(`  ❌ ${script.name}: FAIL (exit code ${result.code})\n`);
            totalFailed++;
        }
    }

    // Stop the server
    log('Stopping backend server...');
    server.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 1000));

    // Summary
    console.log('\n=== Final Summary ===');
    console.log(`  Passed: ${totalPassed}/${testScripts.length}`);
    console.log(`  Failed: ${totalFailed}/${testScripts.length}`);

    if (totalFailed > 0) {
        log('Some tests failed. See output above for details.');
        process.exit(1);
    } else {
        log('All tests passed!');
        process.exit(0);
    }
}

main().catch((err) => {
    log(`Fatal error: ${err.message}`);
    process.exit(1);
});
