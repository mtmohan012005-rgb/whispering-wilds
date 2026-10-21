#!/usr/bin/env node

/**
 * run-all-tests.js — Self-contained test runner for The Whispering Wilds
 * 
 * Starts the backend server, waits for readiness, runs all test suites,
 * and stops the server even if tests fail. Includes timeout protection
 * and server output logging for debugging.
 * 
 * Usage: node scripts/run-all-tests.js
 * Environment:
 *   TEST_SERVER_PORT  — Port for test server (default: 3000)
 *   TEST_TIMEOUT_MS   — Per-test-suite timeout in ms (default: 120000)
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const SERVER_PORT = parseInt(process.env.TEST_SERVER_PORT, 10) || 3000;
const SERVER_READY_URL = `http://localhost:${SERVER_PORT}/api/v1/health`;
const MAX_READY_WAIT_MS = 30000; // 30 seconds
const TEST_TIMEOUT_MS = parseInt(process.env.TEST_TIMEOUT_MS, 10) || 300000; // 5 minutes per suite
const PROJECT_ROOT = path.resolve(__dirname, '..');

let serverStopped = false;
let serverProcess = null;

function waitForServerReady(timeoutMs) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      http.get(SERVER_READY_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Backend server is ready');
            resolve(true);
          } else if (Date.now() - startTime < timeoutMs) {
            setTimeout(check, 500);
          } else {
            console.error('❌ Server returned non-200 status:', res.statusCode);
            resolve(false);
          }
        });
      }).on('error', (err) => {
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(check, 500);
        } else {
          console.error('❌ Could not connect to server:', err.message);
          resolve(false);
        }
      });
    };
    
    check();
  });
}

function verifyPortReleased(port, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tryBind = () => {
      const tester = net.createServer();
      tester.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          if (Date.now() - start < timeoutMs) {
            setTimeout(tryBind, 200);
          } else {
            reject(new Error(`Port ${port} still in use after ${timeoutMs}ms`));
          }
        } else {
          resolve();
        }
      });
      tester.once('listening', () => {
        tester.close(() => resolve());
      });
      tester.listen(port);
    };
    tryBind();
  });
}

function runTestSuite(name, scriptPath) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${name}`);
    console.log(`${'='.repeat(60)}`);
    
    const scriptFullPath = path.join(PROJECT_ROOT, scriptPath);
    const child = spawn('node', [scriptFullPath], {
      stdio: 'inherit',
      env: { ...process.env, PORT: SERVER_PORT.toString() },
      cwd: PROJECT_ROOT
    });
    
    // Timeout protection — kill hung test suites
    const timeoutHandle = setTimeout(() => {
      console.error(`\n⏱️  [${name}] TIMEOUT after ${TEST_TIMEOUT_MS}ms — killing process`);
      child.kill('SIGKILL');
      resolve({ name, code: 124, timedOut: true }); // 124 = timeout exit code
    }, TEST_TIMEOUT_MS);
    
    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      const status = code === 0 ? 'PASS' : 'FAIL';
      console.log(`\n[${name}] ${status} (exit code: ${code})`);
      resolve({ name, code, timedOut: false });
    });
    
    child.on('error', (err) => {
      clearTimeout(timeoutHandle);
      console.error(`\n[${name}] SPAWN ERROR: ${err.message}`);
      resolve({ name, code: 1, error: err.message });
    });
  });
}

function stopServer() {
  if (serverStopped) return;
  serverStopped = true;
  console.log('\n🛑 Stopping backend server...');
  if (!serverProcess) {
    console.log('Server process was not spawned or already null.');
    return;
  }
  const pid = serverProcess.pid;
  try {
    if (process.platform === 'win32') {
      try {
        execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
      } catch (e) {
        // Process might have already exited
      }
    } else {
      serverProcess.kill('SIGTERM');
      setTimeout(() => {
        try {
          if (!serverProcess.killed) {
            serverProcess.kill('SIGKILL');
          }
        } catch (_) {}
      }, 2000).unref();
    }
  } catch (e) {
    console.warn(`[run-all-tests] Notice stopping server: ${e.message}`);
  }
}

async function main() {
  console.log('🎮 The Whispering Wilds — Test Runner');
  console.log(`Server port: ${SERVER_PORT}`);
  console.log(`Test timeout: ${TEST_TIMEOUT_MS}ms`);
  console.log('Starting backend server...');
  
  // Start the backend server
  try {
    serverProcess = spawn('node', ['server.js'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PORT: SERVER_PORT.toString(), NODE_ENV: 'test' },
      cwd: PROJECT_ROOT
    });
  } catch (err) {
    console.error('❌ Failed to start server process:', err.message);
    process.exit(1);
  }
  
  let serverOutput = '';
  serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });
  serverProcess.stderr.on('data', (data) => {
    serverOutput += data.toString();
  });
  
  // Wait for server to be ready
  const isReady = await waitForServerReady(MAX_READY_WAIT_MS);
  if (!isReady) {
    console.error('❌ Server failed to start. Aborting tests.');
    if (serverOutput) {
      console.error('Server output:', serverOutput.slice(-500));
    }
    stopServer();
    process.exit(1);
  }
  
  // Ensure server is stopped even if tests fail
  process.on('exit', stopServer);
  process.on('SIGINT', () => { stopServer(); process.exit(143); });
  process.on('SIGTERM', () => { stopServer(); process.exit(143); });
  
  // Run test suites
  const results = [];
  let hasFailure = false;
  
  try {
    // Backend security tests
    const securityResult = await runTestSuite(
      'Backend Security Tests',
      'scripts/test-backend-security.js'
    );
    results.push(securityResult);
    if (securityResult.code !== 0) hasFailure = true;
    
    // Cloud save regression tests
    const cloudsaveResult = await runTestSuite(
      'Cloud Save Regression Tests',
      'scripts/test-cloud-save-regression.js'
    );
    results.push(cloudsaveResult);
    if (cloudsaveResult.code !== 0) hasFailure = true;
    
    // Game verification
    const gameResult = await runTestSuite(
      'Game Verification',
      'scripts/verify-game.js'
    );
    results.push(gameResult);
    if (gameResult.code !== 0) hasFailure = true;
    
    // Production verification
    const productionResult = await runTestSuite(
      'Production Verification',
      'scripts/verify-production.js'
    );
    results.push(productionResult);
    if (productionResult.code !== 0) hasFailure = true;
    
    // Asset verification
    const assetsResult = await runTestSuite(
      'Asset Verification',
      'scripts/verify-assets.js'
    );
    results.push(assetsResult);
    if (assetsResult.code !== 0) hasFailure = true;

    // Tamil Nadu Map Data verification
    const mapDataResult = await runTestSuite(
      'Tamil Nadu Map Data Verification',
      'scripts/verify-map-data.js'
    );
    results.push(mapDataResult);
    if (mapDataResult.code !== 0) hasFailure = true;

    // Server cleanup regression
    const cleanupResult = await runTestSuite(
      'Server Cleanup Regression',
      'scripts/verify-server-cleanup.js'
    );
    results.push(cleanupResult);
    if (cleanupResult.code !== 0) hasFailure = true;

    // Candidate launcher provenance & safety regression
    const launcherResult = await runTestSuite(
      'Candidate Launcher Provenance & Safety Tests',
      'scripts/verify-candidate-launcher.js'
    );
    results.push(launcherResult);
    if (launcherResult.code !== 0) hasFailure = true;
    
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
    hasFailure = true;
  } finally {
    // Stop the server and verify port is released
    stopServer();
    try {
      await verifyPortReleased(SERVER_PORT, 5000);
      console.log(`✅ Test server stopped; port ${SERVER_PORT} is free and reusable.`);
    } catch (e) {
      console.error(`⚠️ Port release check failed: ${e.message}`);
      hasFailure = true;
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  results.forEach((result) => {
    const status = result.code === 0 ? '✅ PASS' : (result.timedOut ? '⏱️ TIMEOUT' : '❌ FAIL');
    console.log(`  ${status} — ${result.name} (exit: ${result.code})`);
  });
  
  const passCount = results.filter(r => r.code === 0).length;
  const failCount = results.filter(r => r.code !== 0).length;
  
  console.log(`\nTotal: ${passCount} passed, ${failCount} failed out of ${results.length} suites`);
  console.log('='.repeat(60));
  
  if (hasFailure) {
    console.log('\n❌ Some tests failed. See above for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
