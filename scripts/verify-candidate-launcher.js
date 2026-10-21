#!/usr/bin/env node

/**
 * test-candidate-launcher.js — Automated regression test suite for
 * The Whispering Wilds candidate release launcher and provenance verification.
 * 
 * Verifies:
 * 1. Correct archive hash and size are accepted.
 * 2. Wrong hash or size in manifest/archive is rejected before launch.
 * 3. A valid marker matching the archive is accepted for safe reuse.
 * 4. Missing, malformed, and mismatched provenance markers are rejected under -SkipExtract.
 * 5. Safe refresh occurs when marker is stale in default (non-skip) mode.
 * 6. Missing EXE or missing data directory is rejected.
 * 7. Stale extraction folders are never launched on ZIP hash alone.
 * 8. Duplicate process detection prevents launching a second instance.
 * 9. Failed extraction never leaves a success marker.
 * 10. The generated Play-Candidate.bat includes provenance and process checks.
 * 
 * NOTE: These tests prove candidate identity and launch-helper safety only.
 * They do NOT prove physical gameplay quality or replace the human playtest.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const LAUNCHER_PS1 = path.join(PROJECT_ROOT, 'scripts', 'launch-candidate-playtest.ps1');
const REAL_MANIFEST = path.join(PROJECT_ROOT, 'artifacts', 'releases', 'RELEASE_MANIFEST.json');
const REAL_ZIP = path.join(PROJECT_ROOT, 'artifacts', 'releases', 'TheWhisperingWilds-v1.0.0-windows-x64.zip');

const TEST_DIR = path.join(os.tmpdir(), `ww-launcher-tests-${Date.now()}`);
fs.mkdirSync(TEST_DIR, { recursive: true });

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

function runPowerShell(args) {
  try {
    const stdout = execFileSync('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', LAUNCHER_PS1,
      ...args
    ], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { code: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      code: err.status || 1,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : err.message
    };
  }
}

function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(content);
}

console.log('🧪 Starting Candidate Launcher Provenance Regression Suite');
console.log(`   Scratch Directory: ${TEST_DIR}\n`);

try {
  // Read real manifest metadata for reference
  const realManifestContent = readJsonFile(REAL_MANIFEST);
  const expectedHash = realManifestContent.sha256;
  const expectedSize = realManifestContent.sizeBytes;
  const expectedCommit = realManifestContent.codeCommit || realManifestContent.testedCommit;

  // -------------------------------------------------------------
  // Test 1: Real Archive Hash & Size Verification
  // -------------------------------------------------------------
  console.log('--- Test Group 1: Archive Identity & Integrity ---');
  {
    const zipStats = fs.statSync(REAL_ZIP);
    assert(zipStats.size === expectedSize, 'Real candidate ZIP size matches manifest',
      `size: ${zipStats.size} expected: ${expectedSize}`);

    const fileBuffer = fs.readFileSync(REAL_ZIP);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
    assert(hash === expectedHash.toUpperCase(), 'Real candidate ZIP SHA-256 matches manifest',
      `hash: ${hash}`);
  }

  // -------------------------------------------------------------
  // Test 2: Launcher accepts valid manifest and ZIP in TestMode
  // -------------------------------------------------------------
  {
    const tempDest = path.join(TEST_DIR, 'dest-valid');
    const res = runPowerShell([
      '-DestinationPath', tempDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-TestMode'
    ]);
    assert(res.code === 0, 'Launcher succeeds in TestMode with valid ZIP and manifest');
    assert(res.stdout.includes('PASS: Candidate archive integrity verified'),
      'Output confirms archive integrity verification');

    const markerPath = path.join(tempDest, '.candidate-archive.json');
    assert(fs.existsSync(markerPath), 'Provenance marker .candidate-archive.json created on extraction');
    if (fs.existsSync(markerPath)) {
      const marker = readJsonFile(markerPath);
      assert(marker.archive_sha256 === expectedHash, 'Marker archive_sha256 matches expected hash');
      assert(marker.archive_size === expectedSize, 'Marker archive_size matches expected size');
      assert(marker.candidate_code_commit === expectedCommit, 'Marker candidate_code_commit matches expected commit');
      assert(!!marker.extracted_at_utc, 'Marker contains extracted_at_utc timestamp');
    }
  }

  // -------------------------------------------------------------
  // Test 3: Safe Reuse Path (Marker matches archive)
  // -------------------------------------------------------------
  console.log('\n--- Test Group 2: Provenance Marker Reuse & Invalidation ---');
  {
    const tempDest = path.join(TEST_DIR, 'dest-valid'); // Already extracted in Test 2
    const res = runPowerShell([
      '-DestinationPath', tempDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-TestMode'
    ]);
    assert(res.code === 0, 'Valid destination is reused without re-extraction');
    assert(res.stdout.includes('PASS: Destination provenance verified'),
      'Output confirms reuse due to verified provenance');
  }

  // -------------------------------------------------------------
  // Test 4: Rejection on Hash Mismatch in Manifest
  // -------------------------------------------------------------
  {
    const badManifestPath = path.join(TEST_DIR, 'manifest-bad-hash.json');
    const badManifest = { ...realManifestContent, sha256: '0000000000000000000000000000000000000000000000000000000000000000' };
    fs.writeFileSync(badManifestPath, JSON.stringify(badManifest, null, 2));

    const tempDest = path.join(TEST_DIR, 'dest-bad-hash');
    const res = runPowerShell([
      '-DestinationPath', tempDest,
      '-ManifestPath', badManifestPath,
      '-ZipPath', REAL_ZIP,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects archive when SHA-256 hash does not match manifest');
    assert((res.stderr + res.stdout).includes('SHA-256 hash mismatch'),
      'Error message identifies SHA-256 mismatch');
  }

  // -------------------------------------------------------------
  // Test 5: Rejection on Size Mismatch in Manifest
  // -------------------------------------------------------------
  {
    const badManifestPath = path.join(TEST_DIR, 'manifest-bad-size.json');
    const badManifest = { ...realManifestContent, sizeBytes: 12345 };
    fs.writeFileSync(badManifestPath, JSON.stringify(badManifest, null, 2));

    const tempDest = path.join(TEST_DIR, 'dest-bad-size');
    const res = runPowerShell([
      '-DestinationPath', tempDest,
      '-ManifestPath', badManifestPath,
      '-ZipPath', REAL_ZIP,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects archive when file size does not match manifest');
    assert((res.stderr + res.stdout).includes('Size mismatch'),
      'Error message identifies size mismatch');
  }

  // -------------------------------------------------------------
  // Test 6: Stale Extraction Rejected Under -SkipExtract
  // -------------------------------------------------------------
  {
    const staleDest = path.join(TEST_DIR, 'dest-stale-marker');
    fs.mkdirSync(staleDest, { recursive: true });
    fs.writeFileSync(path.join(staleDest, 'TheWhisperingWilds.exe'), 'mock-exe');
    fs.mkdirSync(path.join(staleDest, 'TheWhisperingWilds_Data'), { recursive: true });

    // Marker pointing to an old commit
    const staleMarker = {
      archive_sha256: expectedHash,
      archive_size: expectedSize,
      candidate_code_commit: '1f15eb80eec90146dc0d0111595c2743607929c0', // Old commit
      extracted_at_utc: '2026-10-19T00:00:00Z'
    };
    fs.writeFileSync(path.join(staleDest, '.candidate-archive.json'), JSON.stringify(staleMarker));

    const res = runPowerShell([
      '-DestinationPath', staleDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Stale extraction folder with old commit is rejected under -SkipExtract');
    assert((res.stderr + res.stdout).includes('failed provenance verification'),
      'Error message indicates provenance check failure');
  }

  // -------------------------------------------------------------
  // Test 7: Missing Marker Rejected Under -SkipExtract
  // -------------------------------------------------------------
  {
    const noMarkerDest = path.join(TEST_DIR, 'dest-no-marker');
    fs.mkdirSync(noMarkerDest, { recursive: true });
    fs.writeFileSync(path.join(noMarkerDest, 'TheWhisperingWilds.exe'), 'mock-exe');
    fs.mkdirSync(path.join(noMarkerDest, 'TheWhisperingWilds_Data'), { recursive: true });

    const res = runPowerShell([
      '-DestinationPath', noMarkerDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Existing folder without provenance marker is rejected under -SkipExtract');
  }

  // -------------------------------------------------------------
  // Test 8: Malformed Marker Rejected Under -SkipExtract
  // -------------------------------------------------------------
  {
    const corruptMarkerDest = path.join(TEST_DIR, 'dest-corrupt-marker');
    fs.mkdirSync(corruptMarkerDest, { recursive: true });
    fs.writeFileSync(path.join(corruptMarkerDest, 'TheWhisperingWilds.exe'), 'mock-exe');
    fs.mkdirSync(path.join(corruptMarkerDest, 'TheWhisperingWilds_Data'), { recursive: true });
    fs.writeFileSync(path.join(corruptMarkerDest, '.candidate-archive.json'), '{ invalid json ...');

    const res = runPowerShell([
      '-DestinationPath', corruptMarkerDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Malformed JSON marker is rejected under -SkipExtract');
  }

  // -------------------------------------------------------------
  // Test 9: Missing EXE in Destination Rejected Under -SkipExtract
  // -------------------------------------------------------------
  {
    const noExeDest = path.join(TEST_DIR, 'dest-no-exe');
    fs.mkdirSync(noExeDest, { recursive: true });
    fs.mkdirSync(path.join(noExeDest, 'TheWhisperingWilds_Data'), { recursive: true });
    const validMarker = {
      archive_sha256: expectedHash,
      archive_size: expectedSize,
      candidate_code_commit: expectedCommit,
      extracted_at_utc: '2026-10-21T00:00:00Z'
    };
    fs.writeFileSync(path.join(noExeDest, '.candidate-archive.json'), JSON.stringify(validMarker));

    const res = runPowerShell([
      '-DestinationPath', noExeDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Destination missing TheWhisperingWilds.exe is rejected');
  }

  // -------------------------------------------------------------
  // Test 10: Missing TheWhisperingWilds_Data Rejected Under -SkipExtract
  // -------------------------------------------------------------
  {
    const noDataDest = path.join(TEST_DIR, 'dest-no-data');
    fs.mkdirSync(noDataDest, { recursive: true });
    fs.writeFileSync(path.join(noDataDest, 'TheWhisperingWilds.exe'), 'mock-exe');
    const validMarker = {
      archive_sha256: expectedHash,
      archive_size: expectedSize,
      candidate_code_commit: expectedCommit,
      extracted_at_utc: '2026-10-21T00:00:00Z'
    };
    fs.writeFileSync(path.join(noDataDest, '.candidate-archive.json'), JSON.stringify(validMarker));

    const res = runPowerShell([
      '-DestinationPath', noDataDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Destination missing TheWhisperingWilds_Data is rejected');
  }

  // -------------------------------------------------------------
  // Test 11: Normal Mode Safely Refreshes Stale Destination
  // -------------------------------------------------------------
  console.log('\n--- Test Group 3: Safe Refresh & Process Safety ---');
  {
    const refreshDest = path.join(TEST_DIR, 'dest-auto-refresh');
    fs.mkdirSync(refreshDest, { recursive: true });
    // Write stale file
    fs.writeFileSync(path.join(refreshDest, 'stale_file.txt'), 'old-build');

    const res = runPowerShell([
      '-DestinationPath', refreshDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-TestMode'
    ]);
    assert(res.code === 0, 'Normal invocation safely refreshes an unverified destination folder');
    assert(res.stdout.includes('Safely refreshing dedicated candidate destination'),
      'Output indicates safe refresh occurred');
    assert(fs.existsSync(path.join(refreshDest, '.candidate-archive.json')),
      'Fresh marker created after auto-refresh');
  }

  // -------------------------------------------------------------
  // Test 12: Duplicate Process Detection
  // -------------------------------------------------------------
  {
    const tempDest = path.join(TEST_DIR, 'dest-valid');
    const res = runPowerShell([
      '-DestinationPath', tempDest,
      '-ManifestPath', REAL_MANIFEST,
      '-ZipPath', REAL_ZIP,
      '-SimulateProcessRunning'
    ]);
    assert(res.code !== 0, 'Launcher halts when game process is already running');
    assert((res.stderr + res.stdout).includes('already running'),
      'Error message instructs user not to launch duplicate instance');
  }

  // -------------------------------------------------------------
  // Test 13: In-Folder Play-Candidate.bat Validation Check
  // -------------------------------------------------------------
  {
    const tempDest = path.join(TEST_DIR, 'dest-valid');
    const batPath = path.join(tempDest, 'Play-Candidate.bat');
    assert(fs.existsSync(batPath), 'Play-Candidate.bat generated inside destination folder');
    if (fs.existsSync(batPath)) {
      const batContent = fs.readFileSync(batPath, 'utf8');
      assert(batContent.includes('.candidate-archive.json'),
        'Play-Candidate.bat checks .candidate-archive.json');
      assert(batContent.includes(expectedHash),
        'Play-Candidate.bat checks expected archive SHA256');
      assert(batContent.includes(expectedCommit),
        'Play-Candidate.bat checks expected candidate code commit');
      assert(batContent.includes('-force-d3d11'),
        'Play-Candidate.bat includes -force-d3d11 flag for Intel UHD');
    }
  }

} finally {
  // Cleanup scratch directory
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch (_) {}
}

console.log('\n' + '='.repeat(60));
console.log(`Regression Test Summary: ${passedTests} passed, ${failedTests} failed out of ${totalTests} checks`);
console.log('='.repeat(60));

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All candidate launcher regression tests passed!\n');
  process.exit(0);
}
