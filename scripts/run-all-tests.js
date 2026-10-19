#!/usr/bin/env node

/**
 * run-all-tests.js — Self-contained test runner for The Whispering Wilds
 * 
 * Starts the backend server, waits for readiness, runs all test suites,
 * and stops the server even if tests fail.
 * 
 * Usage: node scripts/run-all-tests.js
 */

const { spawn } = require('child_process');
const http = require('http');

const SERVER_PORT = process.env.TEST_SERVER_PORT || 3000;
const SERVER_READY_URL = `http://localhost:${SERVER_PORT}/api/v1/health`;
const MAX_READY_WAIT_MS = 30000; // 30 seconds

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

function runTestSuite(name, command, args) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${name}`);
    console.log(`${'='.repeat(60)}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, PORT: SERVER_PORT.toString() }
    });
    
    child.on('close', (code) => {
      const status = code === 0 ? 'PASS' : 'FAIL';
      console.log(`\n[${name}] ${status} (exit code: ${code})`);
      resolve({ name, code });
    });
  });
}

async function main() {
  console.log('🎮 The Whispering Wilds — Test Runner');
  console.log('Starting backend server...');
  
  // Start the backend server
  const serverProcess = spawn('node', ['server.js'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: SERVER_PORT.toString() }
  });
  
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
    serverProcess.kill('SIGTERM');
    process.exit(1);
  }
  
  // Ensure server is stopped even if tests fail
  const stopServer = () => {
    console.log('\n🛑 Stopping backend server...');
    serverProcess.kill('SIGTERM');
  };
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
      'node',
      ['scripts/test-backend-security.js']
    );
    results.push(securityResult);
    if (securityResult.code !== 0) hasFailure = true;
    
    // Cloud save regression tests
    const cloudsaveResult = await runTestSuite(
      'Cloud Save Regression Tests',
      'node',
      ['scripts/test-cloud-save-regression.js']
    );
    results.push(cloudsaveResult);
    if (cloudsaveResult.code !== 0) hasFailure = true;
    
    // Game verification
    const gameResult = await runTestSuite(
      'Game Verification',
      'node',
      ['scripts/verify-game.js']
    );
    results.push(gameResult);
    if (gameResult.code !== 0) hasFailure = true;
    
    // Production verification
    const productionResult = await runTestSuite(
      'Production Verification',
      'node',
      ['scripts/verify-production.js']
    );
    results.push(productionResult);
    if (productionResult.code !== 0) hasFailure = true;
    
    // Asset verification
    const assetsResult = await runTestSuite(
      'Asset Verification',
      'node',
      ['scripts/verify-assets.js']
    );
    results.push(assetsResult);
    if (assetsResult.code !== 0) hasFailure = true;
    
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
    hasFailure = true;
  } finally {
    // Stop the server
    stopServer();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  results.forEach((result) => {
    const status = result.code === 0 ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status} — ${result.name}`);
  });
  
  const passCount = results.filter(r => r.code === 0).length;
  const failCount = results.filter(r => r.code !== 0).length;
  
  console.log(`\nTotal: ${passCount} passed, ${failCount} failed`);
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
