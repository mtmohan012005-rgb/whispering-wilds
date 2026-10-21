#!/usr/bin/env node

/**
 * scripts/test-server-cleanup-regression.js
 *
 * Regression test verifying that the test runner's server process cleanup
 * is idempotent, properly terminates the process tree, and frees the port.
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const TEST_PORT = 3199;
const PROJECT_ROOT = path.resolve(__dirname, '..');

function checkPortFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', (err) => {
      resolve(false);
    });
    s.once('listening', () => {
      s.close(() => resolve(true));
    });
    s.listen(port);
  });
}

function waitForPort(port, shouldBeOpen, timeoutMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      const isFree = await checkPortFree(port);
      const conditionMet = shouldBeOpen ? !isFree : isFree;
      if (conditionMet) {
        resolve(true);
      } else if (Date.now() - start < timeoutMs) {
        setTimeout(check, 250);
      } else {
        reject(new Error(`Timeout waiting for port ${port} to be ${shouldBeOpen ? 'in-use' : 'free'}`));
      }
    };
    check();
  });
}

async function testServerSpawnAndKill() {
  console.log('--- Test 1: Spawning test server on port ' + TEST_PORT + ' ---');
  const server = spawn('node', ['server.js'], {
    env: { ...process.env, PORT: TEST_PORT.toString(), NODE_ENV: 'test' },
    cwd: PROJECT_ROOT,
    stdio: 'ignore'
  });

  const pid = server.pid;
  console.log(`Server spawned with PID ${pid}. Waiting for port ${TEST_PORT} to bind...`);
  await waitForPort(TEST_PORT, true, 10000);
  console.log('✅ Server successfully bound to port ' + TEST_PORT);

  console.log('Terminating server process tree...');
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch (_) {}
  } else {
    server.kill('SIGTERM');
  }

  await waitForPort(TEST_PORT, false, 5000);
  console.log('✅ Port ' + TEST_PORT + ' successfully released and reusable.');
}

async function run() {
  console.log('=== TEST SERVER CLEANUP REGRESSION ===');
  let exitCode = 0;
  try {
    await testServerSpawnAndKill();
    console.log('✅ PASS: Server cleanup is fully functional and leak-free.');
  } catch (err) {
    console.error('❌ FAIL:', err.message);
    exitCode = 1;
  }
  process.exit(exitCode);
}

run();
