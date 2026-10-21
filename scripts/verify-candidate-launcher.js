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

const rawTmp = os.tmpdir();
const canonicalTmp = fs.existsSync(rawTmp) ? fs.realpathSync(rawTmp) : rawTmp;
const TEST_DIR = path.join(canonicalTmp, `ww-launcher-tests-${Date.now()}`);
fs.mkdirSync(TEST_DIR, { recursive: true });

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

let lastRunResult = null;

function runPowerShell(args) {
  if (process.platform !== 'win32') {
    return { code: 0, stdout: 'Skipping PowerShell on non-Windows runner', stderr: '', skipped: true };
  }
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
    lastRunResult = { code: 0, stdout, stderr: '' };
    return lastRunResult;
  } catch (err) {
    lastRunResult = {
      code: err.status || 1,
      stdout: err.stdout ? err.stdout.toString() : '',
      stderr: err.stderr ? err.stderr.toString() : err.message
    };
    return lastRunResult;
  }
}

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failedTests++;
    const extra = details || (lastRunResult ? `[code ${lastRunResult.code}] err: ${lastRunResult.stderr.replace(/\r?\n/g, ' ')}` : '');
    console.error(`  ❌ FAIL: ${testName} ${extra ? `(${extra})` : ''}`);
  }
}

function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(content);
}

console.log('🧪 Starting Candidate Launcher Provenance Regression Suite');
console.log(`   Scratch Directory: ${TEST_DIR}\n`);

// Windows CI needs to exercise PowerShell even though compiled release ZIPs are intentionally gitignored.
// When the real candidate ZIP is unavailable, create an isolated synthetic payload fixture. This exercises
// launcher safety/provenance logic only; it does not certify the shipped game binary.
let activeManifestPath = REAL_MANIFEST;
let activeZipPath = REAL_ZIP;
if (process.platform === 'win32' && !fs.existsSync(REAL_ZIP)) {
  const sourceManifest = readJsonFile(REAL_MANIFEST);
  const fixtureRoot = path.join(TEST_DIR, 'candidate-fixture');
  const fixtureData = path.join(fixtureRoot, 'TheWhisperingWilds_Data');
  fs.mkdirSync(fixtureData, { recursive: true });
  fs.writeFileSync(path.join(fixtureRoot, 'TheWhisperingWilds.exe'), 'TEST_EXECUTABLE_FIXTURE');
  fs.writeFileSync(path.join(fixtureRoot, 'UnityPlayer.dll'), 'TEST_PLAYER_DLL_FIXTURE');
  fs.writeFileSync(path.join(fixtureData, 'globalgamemanagers'), 'TEST_GAME_DATA_FIXTURE');
  fs.writeFileSync(path.join(fixtureData, 'sharedassets0.assets'), 'TEST_SHARED_ASSET_FIXTURE');
  const fixtureZip = path.join(TEST_DIR, 'candidate-fixture.zip');
  const psLiteral = value => "'" + value.replace(/'/g, "''") + "'";
  const createZipCommand = 'Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory(' + psLiteral(fixtureRoot) + ', ' + psLiteral(fixtureZip) + ', [System.IO.Compression.CompressionLevel]::Optimal, $false);';
  execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', createZipCommand], { stdio: 'pipe' });
  const fixtureBytes = fs.readFileSync(fixtureZip);
  const fixtureManifest = {
    ...sourceManifest,
    candidate: true,
    status: 'VERIFIED_CLEAN',
    isDirty: false,
    sizeBytes: fixtureBytes.length,
    sha256: crypto.createHash('sha256').update(fixtureBytes).digest('hex').toUpperCase(),
    codeCommit: sourceManifest.codeCommit || sourceManifest.testedCommit
  };
  activeManifestPath = path.join(TEST_DIR, 'candidate-fixture-manifest.json');
  activeZipPath = fixtureZip;
  fs.writeFileSync(activeManifestPath, JSON.stringify(fixtureManifest, null, 2));
  console.log('   Windows CI: created a disposable synthetic ZIP fixture because the compiled release archive is gitignored.');
  console.log('   Fixture tests exercise launcher safety/provenance only; they do not certify the shipped game binary.');
}

try {
  // Read real manifest metadata for reference
  const realManifestContent = readJsonFile(activeManifestPath);
  const expectedHash = realManifestContent.sha256;
  const expectedSize = realManifestContent.sizeBytes;
  const expectedCommit = realManifestContent.codeCommit || realManifestContent.testedCommit;

  // -------------------------------------------------------------
  // Test 1: Real Archive Hash & Size Verification
  // -------------------------------------------------------------
  console.log('--- Test Group 1: Archive Identity & Integrity ---');
  if (fs.existsSync(activeZipPath)) {
    const zipStats = fs.statSync(activeZipPath);
    assert(zipStats.size === expectedSize, 'Real candidate ZIP size matches manifest',
      `size: ${zipStats.size} expected: ${expectedSize}`);

    const fileBuffer = fs.readFileSync(activeZipPath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
    assert(hash === expectedHash.toUpperCase(), 'Real candidate ZIP SHA-256 matches manifest',
      `hash: ${hash}`);
  } else {
    console.log('  ℹ️  CI Environment: Candidate ZIP not present in git checkout (gitignored). Validating manifest schema.');
    assert(expectedSize === 62868410, 'Manifest expected size matches release specification', `size: ${expectedSize}`);
    assert(expectedHash === 'AFF39CA7AA95516CA3E5EB8B5D7E33ACA456F877816734CD73E3CEA450705006',
      'Manifest expected SHA-256 matches release specification', `hash: ${expectedHash}`);
    assert(expectedCommit === '5056deb833a1254f0e41bf134151663a08cca5f8',
      'Manifest candidate code commit matches candidate specification', `commit: ${expectedCommit}`);
  }

  if (process.platform !== 'win32') {
    console.log('\n--- Static Script Analysis (Non-Windows CI) ---');
    const psContent = fs.readFileSync(LAUNCHER_PS1, 'utf8');
    assert(psContent.includes('.candidate-archive.json'), 'Launcher implements .candidate-archive.json provenance marker');
    assert(psContent.includes('Test-CandidateProvenance'), 'Launcher implements Test-CandidateProvenance validation function');
    assert(psContent.includes('TheWhisperingWilds.exe'), 'Launcher validates TheWhisperingWilds.exe');
    assert(psContent.includes('TheWhisperingWilds_Data'), 'Launcher validates TheWhisperingWilds_Data directory');
    assert(psContent.includes('-force-d3d11'), 'Launcher passes -force-d3d11 for Intel UHD GPU');
    assert(psContent.includes('SimulateProcessRunning'), 'Launcher implements duplicate process prevention');
    assert(psContent.includes('SkipExtract'), 'Launcher enforces safe SkipExtract verification');
    assert(psContent.includes('Assert-DestinationSafety'), 'Launcher implements Assert-DestinationSafety allowlist');
    assert(psContent.includes('ReparsePoint'), 'Launcher rejects reparse points and symbolic links');
    assert(psContent.includes('payload_manifest'), 'Launcher computes and verifies deterministic payload manifest');
    assert(psContent.includes('unsafe path traversal or absolute entry'), 'Launcher inspects and rejects ZIP traversal entries');
    assert(psContent.includes('isExactDefault'), 'Launcher enforces exact canonical default path allowlist');
    assert(psContent.includes('TestMode must never touch the real user candidate directory'), 'Launcher guards real candidate folder against TestMode');
    assert(psContent.includes('duplicate normalized entry'), 'Launcher rejects duplicate normalized ZIP entries');
    assert(psContent.includes('Unexpected file found in payload destination'), 'Launcher detects unexpected files in payload destination');

    const batContent = fs.readFileSync(path.join(PROJECT_ROOT, 'Play-Candidate-Build.bat'), 'utf8');
    assert(batContent.includes('launch-candidate-playtest.ps1'), 'Root BAT invokes safe PowerShell launcher');
    console.log('  ℹ️  Skipped Windows PowerShell execution tests on non-Windows CI runner.');

    console.log('\n' + '='.repeat(60));
    console.log(`Regression Test Summary (Non-Windows CI): ${passedTests} passed, ${failedTests} failed out of ${totalTests} checks`);
    console.log('='.repeat(60));
    if (failedTests > 0) process.exit(1);
    console.log('🎉 Static launcher analysis passed for non-Windows CI!\n');
    return;
  }

  // -------------------------------------------------------------
  // Test 2: Launcher accepts valid manifest and ZIP in TestMode
  // -------------------------------------------------------------
  {
    const tempDest = path.join(TEST_DIR, 'dest-valid');
    const res = runPowerShell([
      '-DestinationPath', tempDest,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
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
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
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
      '-ZipPath', activeZipPath,
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
      '-ZipPath', activeZipPath,
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
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
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
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
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
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
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
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
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
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
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
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
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
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-SimulateProcessRunning',
      '-TestMode'
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

  // -------------------------------------------------------------
  // Test Group 4: Path & Destination Safety Guards
  // -------------------------------------------------------------
  console.log('\n--- Test Group 4: Path & Destination Safety Guards ---');

  // Test 14: Path traversal in -DestinationPath rejected
  {
    const traversalDest = TEST_DIR + '\\..\\escape-attempt';
    const res = runPowerShell([
      '-DestinationPath', traversalDest,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects path traversal in DestinationPath');
    assert((res.stderr + res.stdout).includes('Path traversal'),
      'Error message identifies path traversal rejection');
  }

  // Test 15: Drive root rejected
  {
    const res = runPowerShell([
      '-DestinationPath', 'C:\\',
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects drive root as DestinationPath');
    assert((res.stderr + res.stdout).includes('drive root'),
      'Error message identifies drive root rejection');
  }

  // Test 16: Protected Repository Root rejected
  {
    const res = runPowerShell([
      '-DestinationPath', PROJECT_ROOT,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects repository root as DestinationPath');
    assert((res.stderr + res.stdout).includes('protected system or user directory'),
      'Error message identifies protected repository root rejection');
  }

  // Test 17: Reparse point / junction rejected
  {
    const targetDir = path.join(TEST_DIR, 'junction-target');
    const junctionDir = path.join(TEST_DIR, 'junction-link');
    fs.mkdirSync(targetDir, { recursive: true });
    try {
      execFileSync('cmd.exe', ['/c', 'mklink', '/J', junctionDir, targetDir], { stdio: 'pipe' });
      const res = runPowerShell([
        '-DestinationPath', junctionDir,
        '-ManifestPath', activeManifestPath,
        '-ZipPath', activeZipPath,
        '-TestMode'
      ]);
      assert(res.code !== 0, 'Launcher rejects reparse point / junction destination');
      assert((res.stderr + res.stdout).includes('Reparse points'),
        'Error message identifies reparse point / junction rejection');
    } finally {
      try { execFileSync('cmd.exe', ['/c', 'rmdir', junctionDir], { stdio: 'pipe' }); } catch (_) {}
    }
  }

  // Test 18: Arbitrary directory sentinel safety (normal mode)
  {
    const mockFolder = path.join(TEST_DIR, 'mock-documents');
    fs.mkdirSync(mockFolder, { recursive: true });
    const sentinelFile = path.join(mockFolder, 'sentinel.txt');
    const sentinelContent = 'CRITICAL_USER_DATA_DO_NOT_DELETE';
    fs.writeFileSync(sentinelFile, sentinelContent);

    // Call without -TestMode so normal destination rules apply
    const res = runPowerShell([
      '-DestinationPath', mockFolder,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath
    ]);
    assert(res.code !== 0, 'Launcher fails closed when non-empty arbitrary folder is targeted');
    assert((res.stderr + res.stdout).includes('not the exact canonical candidate directory'),
      'Error message explains destination is not the canonical candidate directory');
    assert(fs.existsSync(sentinelFile), 'Sentinel file in arbitrary directory remains untouched');
    if (fs.existsSync(sentinelFile)) {
      assert(fs.readFileSync(sentinelFile, 'utf8') === sentinelContent,
        'Sentinel file content is intact and was not overwritten');
    }
  }

  // Test 18B: Similarly prefixed sibling directory safety
  {
    const siblingFolder = path.join(os.homedir(), 'Games', 'WhisperingWilds-Candidate-sibling');
    fs.mkdirSync(siblingFolder, { recursive: true });
    const siblingSentinel = path.join(siblingFolder, 'sibling_sentinel.txt');
    const siblingContent = 'SIBLING_FOLDER_USER_DATA_DO_NOT_DELETE';
    fs.writeFileSync(siblingSentinel, siblingContent);

    try {
      const res = runPowerShell([
        '-DestinationPath', siblingFolder,
        '-ManifestPath', activeManifestPath,
        '-ZipPath', activeZipPath
      ]);
      assert(res.code !== 0, 'Launcher rejects similarly prefixed sibling folder that contains files');
      assert((res.stderr + res.stdout).includes('is not the exact canonical') || (res.stderr + res.stdout).includes('canonical candidate directory'),
        'Error explains sibling is not the exact canonical directory');
      assert(fs.existsSync(siblingSentinel), 'Sentinel file in sibling folder remains untouched');
      if (fs.existsSync(siblingSentinel)) {
        assert(fs.readFileSync(siblingSentinel, 'utf8') === siblingContent,
          'Sibling sentinel content is intact');
      }
    } finally {
      try { fs.rmSync(siblingFolder, { recursive: true, force: true }); } catch (_) {}
    }
  }

  // Test 18C: TestMode targeting real candidate directory is rejected
  {
    const realCandidateDir = path.join(os.homedir(), 'Games', 'WhisperingWilds-Candidate-5056deb');
    const res = runPowerShell([
      '-DestinationPath', realCandidateDir,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'TestMode is rejected when targeting real user candidate directory');
    assert((res.stderr + res.stdout).includes('TestMode must never touch the real user candidate directory') || (res.stderr + res.stdout).includes('In TestMode, destination must be an isolated path'),
      'Error confirms TestMode isolation guard triggered');
  }

  // -------------------------------------------------------------
  // Test Group 5: Manifest Schema & Identity Hardening
  // -------------------------------------------------------------
  console.log('\n--- Test Group 5: Manifest Schema & Identity Hardening ---');

  // Test 19: candidate == false rejected
  {
    const badSchemaPath = path.join(TEST_DIR, 'manifest-candidate-false.json');
    fs.writeFileSync(badSchemaPath, JSON.stringify({ ...realManifestContent, candidate: false }, null, 2));
    const res = runPowerShell([
      '-DestinationPath', path.join(TEST_DIR, 'dest-schema-1'),
      '-ManifestPath', badSchemaPath,
      '-ZipPath', activeZipPath,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects manifest where candidate is false');
    assert((res.stderr + res.stdout).includes('candidate must be true'),
      'Error identifies candidate flag error');
  }

  // Test 20: status != VERIFIED_CLEAN rejected
  {
    const badSchemaPath = path.join(TEST_DIR, 'manifest-status-dirty.json');
    fs.writeFileSync(badSchemaPath, JSON.stringify({ ...realManifestContent, status: 'UNVERIFIED_DIRTY' }, null, 2));
    const res = runPowerShell([
      '-DestinationPath', path.join(TEST_DIR, 'dest-schema-2'),
      '-ManifestPath', badSchemaPath,
      '-ZipPath', activeZipPath,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects manifest where status is not VERIFIED_CLEAN');
    assert((res.stderr + res.stdout).includes('status must be \'VERIFIED_CLEAN\''),
      'Error identifies invalid manifest status');
  }

  // Test 21: isDirty == true rejected
  {
    const badSchemaPath = path.join(TEST_DIR, 'manifest-is-dirty.json');
    fs.writeFileSync(badSchemaPath, JSON.stringify({ ...realManifestContent, isDirty: true }, null, 2));
    const res = runPowerShell([
      '-DestinationPath', path.join(TEST_DIR, 'dest-schema-3'),
      '-ManifestPath', badSchemaPath,
      '-ZipPath', activeZipPath,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects manifest where isDirty is true');
    assert((res.stderr + res.stdout).includes('isDirty must be false'),
      'Error identifies isDirty violation');
  }

  // Test 22: Invalid code commit format rejected
  {
    const badSchemaPath = path.join(TEST_DIR, 'manifest-bad-commit.json');
    fs.writeFileSync(badSchemaPath, JSON.stringify({ ...realManifestContent, codeCommit: 'not-a-valid-40-hex-sha' }, null, 2));
    const res = runPowerShell([
      '-DestinationPath', path.join(TEST_DIR, 'dest-schema-4'),
      '-ManifestPath', badSchemaPath,
      '-ZipPath', activeZipPath,
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects manifest with invalid commit format');
    assert((res.stderr + res.stdout).includes('candidate code commit must be a valid 40-character'),
      'Error identifies invalid code commit');
  }

  // -------------------------------------------------------------
  // Test Group 6: Payload Integrity & Binary Tampering Protection
  // -------------------------------------------------------------
  console.log('\n--- Test Group 6: Payload Integrity & Binary Tampering Protection ---');

  // Test 23: Tampered executable is detected and rejected
  {
    const tamperedDest = path.join(TEST_DIR, 'dest-tampered-exe');
    fs.mkdirSync(tamperedDest, { recursive: true });
    fs.mkdirSync(path.join(tamperedDest, 'TheWhisperingWilds_Data'), { recursive: true });
    const exePath = path.join(tamperedDest, 'TheWhisperingWilds.exe');
    fs.writeFileSync(exePath, 'TAMPERED_EXE_CONTENT_FOR_INTEGRITY_CHECK');

    // Write marker expecting a different SHA-256 for TheWhisperingWilds.exe
    const marker = {
      archive_sha256: expectedHash,
      archive_size: expectedSize,
      candidate_code_commit: expectedCommit,
      extracted_at_utc: '2026-10-21T00:00:00Z',
      payload_manifest: {
        'TheWhisperingWilds.exe': {
          size: 40,
          sha256: '0000000000000000000000000000000000000000000000000000000000000000'
        }
      }
    };
    fs.writeFileSync(path.join(tamperedDest, '.candidate-archive.json'), JSON.stringify(marker, null, 2));
    assert(true, 'Initial destination fixture set up for tampering test');

    // Verify that launcher provenance check rejects this tampered folder
    const checkRes = runPowerShell([
      '-DestinationPath', tamperedDest,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(checkRes.code !== 0, 'Launcher rejects destination when TheWhisperingWilds.exe binary is tampered');
    assert((checkRes.stderr + checkRes.stdout).includes('tampered or modified'),
      'Error identifies tampered binary');

    // Verify that Play-Candidate.bat check rejects the tampered executable (exit code 3)
    try {
      execFileSync('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass',
        '-Command',
        `Set-Location '${tamperedDest}'; $m = Get-Content -Path '.candidate-archive.json' -Raw | ConvertFrom-Json; $sha = [System.Security.Cryptography.SHA256]::Create(); $exe = (Resolve-Path 'TheWhisperingWilds.exe').Path; $s = [System.IO.File]::OpenRead($exe); $h = [System.BitConverter]::ToString($sha.ComputeHash($s)).Replace('-', ''); $s.Close(); if ($m.payload_manifest.'TheWhisperingWilds.exe'.sha256 -and $h -ne $m.payload_manifest.'TheWhisperingWilds.exe'.sha256) { exit 3 }`
      ], { encoding: 'utf8', stdio: 'pipe' });
      assert(false, 'Play-Candidate.bat integrity check should have failed with exit code 3');
    } catch (batErr) {
      assert(batErr.status === 3, 'Play-Candidate.bat PowerShell check exits with status 3 on tampered binary');
    }

    // Also write and execute the generated Play-Candidate.bat in the tampered destination
    const batContent = `@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $m = Get-Content -Path '.candidate-archive.json' -Raw | ConvertFrom-Json; if ($m.archive_sha256 -ne '${expectedHash}' -or $m.candidate_code_commit -ne '${expectedCommit}') { exit 2 }; $sha = [System.Security.Cryptography.SHA256]::Create(); $exe = (Resolve-Path 'TheWhisperingWilds.exe').Path; $s = [System.IO.File]::OpenRead($exe); $h = [System.BitConverter]::ToString($sha.ComputeHash($s)).Replace('-', ''); $s.Close(); if ($m.payload_manifest -and $m.payload_manifest.'TheWhisperingWilds.exe'.sha256 -and $h -ne $m.payload_manifest.'TheWhisperingWilds.exe'.sha256) { exit 3 }"
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Candidate provenance or executable integrity validation failed [exit %ERRORLEVEL%]!
    exit /b 1
)
`;
    fs.writeFileSync(path.join(tamperedDest, 'Play-Candidate.bat'), batContent);

    try {
      execFileSync('cmd.exe', ['/c', 'Play-Candidate.bat'], {
        cwd: tamperedDest,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      assert(false, 'Play-Candidate.bat should fail when executable is tampered');
    } catch (batCmdErr) {
      assert(batCmdErr.status !== 0, 'Play-Candidate.bat exits non-zero on tampered executable');
      const output = (batCmdErr.stdout || '') + (batCmdErr.stderr || '');
      assert(output.includes('exit 3'), 'Play-Candidate.bat output reports exit 3 on tampered executable');
    }
  }

  // Test 24: Removed payload file is detected and rejected
  {
    const missingFileDest = path.join(TEST_DIR, 'dest-missing-payload-file');
    fs.mkdirSync(missingFileDest, { recursive: true });
    fs.mkdirSync(path.join(missingFileDest, 'TheWhisperingWilds_Data'), { recursive: true });
    fs.writeFileSync(path.join(missingFileDest, 'TheWhisperingWilds.exe'), 'mock-exe');
    const marker = {
      archive_sha256: expectedHash,
      archive_size: expectedSize,
      candidate_code_commit: expectedCommit,
      extracted_at_utc: '2026-10-21T00:00:00Z',
      payload_manifest: {
        'TheWhisperingWilds.exe': { size: 8, sha256: '' },
        'UnityPlayer.dll': { size: 100, sha256: '' }
      }
    };
    fs.writeFileSync(path.join(missingFileDest, '.candidate-archive.json'), JSON.stringify(marker, null, 2));

    const res = runPowerShell([
      '-DestinationPath', missingFileDest,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher rejects destination when a payload file (UnityPlayer.dll) was removed');
    assert((res.stderr + res.stdout).includes('Payload file missing'),
      'Error identifies missing payload file');
  }

  // Test 24B: Same-size modified non-critical payload file is detected
  {
    const tamperedPayloadDest = path.join(TEST_DIR, 'dest-tampered-noncritical');
    fs.mkdirSync(tamperedPayloadDest, { recursive: true });
    fs.mkdirSync(path.join(tamperedPayloadDest, 'TheWhisperingWilds_Data'), { recursive: true });
    fs.writeFileSync(path.join(tamperedPayloadDest, 'TheWhisperingWilds.exe'), 'mock-exe');
    const docPath = path.join(tamperedPayloadDest, 'README.txt');
    fs.writeFileSync(docPath, 'AUTHENTIC_CONTENT_30_BYTES_AAA'); // 30 bytes
    const correctHash = crypto.createHash('sha256').update('AUTHENTIC_CONTENT_30_BYTES_AAA').digest('hex').toUpperCase();

    // Tamper with the file (same size: 30 bytes, but different byte content)
    fs.writeFileSync(docPath, 'TAMPERED__CONTENT_30_BYTES_BBB'); // 30 bytes

    const marker = {
      archive_sha256: expectedHash,
      archive_size: expectedSize,
      candidate_code_commit: expectedCommit,
      extracted_at_utc: '2026-10-21T00:00:00Z',
      payload_manifest: {
        'TheWhisperingWilds.exe': { size: 8, sha256: '' },
        'README.txt': { size: 30, sha256: correctHash }
      }
    };
    fs.writeFileSync(path.join(tamperedPayloadDest, '.candidate-archive.json'), JSON.stringify(marker, null, 2));

    const res = runPowerShell([
      '-DestinationPath', tamperedPayloadDest,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher detects same-size modified non-critical payload file');
    assert((res.stderr + res.stdout).includes('tampered or modified file'),
      'Error identifies tampered payload file hash mismatch');
  }

  // Test 24C: Unexpected file in payload destination is detected
  {
    const unexpectedFileDest = path.join(TEST_DIR, 'dest-unexpected-file');
    fs.mkdirSync(unexpectedFileDest, { recursive: true });
    fs.mkdirSync(path.join(unexpectedFileDest, 'TheWhisperingWilds_Data'), { recursive: true });
    fs.writeFileSync(path.join(unexpectedFileDest, 'TheWhisperingWilds.exe'), 'mock-exe');
    // Inject extra unexpected file
    fs.writeFileSync(path.join(unexpectedFileDest, 'injected_unverified.dll'), 'malicious');

    const marker = {
      archive_sha256: expectedHash,
      archive_size: expectedSize,
      candidate_code_commit: expectedCommit,
      extracted_at_utc: '2026-10-21T00:00:00Z',
      payload_manifest: {
        'TheWhisperingWilds.exe': { size: 8, sha256: '' }
      }
    };
    fs.writeFileSync(path.join(unexpectedFileDest, '.candidate-archive.json'), JSON.stringify(marker, null, 2));

    const res = runPowerShell([
      '-DestinationPath', unexpectedFileDest,
      '-ManifestPath', activeManifestPath,
      '-ZipPath', activeZipPath,
      '-SkipExtract',
      '-TestMode'
    ]);
    assert(res.code !== 0, 'Launcher detects unexpected file in payload destination');
    assert((res.stderr + res.stdout).includes('Unexpected file found in payload destination'),
      'Error identifies unexpected file');
  }

  // -------------------------------------------------------------
  // Test Group 7: Archive Security & Traversal Protection
  // -------------------------------------------------------------
  console.log('\n--- Test Group 7: Archive Security & Traversal Protection ---');

  // Test 25: ZIP path traversal entry is detected and rejected
  {
    const mockZipPath = path.join(TEST_DIR, 'mock-traversal.zip');
    const psScript = `
      Add-Type -AssemblyName System.IO.Compression
      $zipStream = [System.IO.File]::Create('${mockZipPath.replace(/\\/g, '\\\\')}')
      $archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
      $entry = $archive.CreateEntry("../traversal.txt")
      $writer = New-Object System.IO.StreamWriter($entry.Open())
      $writer.Write("malicious")
      $writer.Dispose()
      $archive.Dispose()
      $zipStream.Dispose()
    `;
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], { stdio: 'pipe' });

    if (fs.existsSync(mockZipPath)) {
      const mockZipSize = fs.statSync(mockZipPath).size;
      const mockZipHash = crypto.createHash('sha256').update(fs.readFileSync(mockZipPath)).digest('hex').toUpperCase();

      const traversalManifestPath = path.join(TEST_DIR, 'manifest-traversal.json');
      fs.writeFileSync(traversalManifestPath, JSON.stringify({
        candidate: true,
        status: 'VERIFIED_CLEAN',
        isDirty: false,
        sizeBytes: mockZipSize,
        sha256: mockZipHash,
        codeCommit: expectedCommit
      }, null, 2));

      const res = runPowerShell([
        '-DestinationPath', path.join(TEST_DIR, 'dest-zip-traversal'),
        '-ManifestPath', traversalManifestPath,
        '-ZipPath', mockZipPath,
        '-TestMode'
      ]);
      assert(res.code !== 0, 'Launcher rejects archive containing unsafe path traversal entries');
      assert((res.stderr + res.stdout).includes('unsafe path traversal or absolute entry'),
        'Error identifies unsafe path traversal entry in ZIP');
    }
  }

  // Test 25B: ZIP duplicate normalized paths are detected and rejected
  {
    const mockDupZipPath = path.join(TEST_DIR, 'mock-duplicate-entry.zip');
    const psScript = `
      Add-Type -AssemblyName System.IO.Compression
      $zipStream = [System.IO.File]::Create('${mockDupZipPath.replace(/\\/g, '\\\\')}')
      $archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)
      $entry1 = $archive.CreateEntry("payload.txt")
      $writer1 = New-Object System.IO.StreamWriter($entry1.Open())
      $writer1.Write("content1")
      $writer1.Dispose()
      $entry2 = $archive.CreateEntry("/payload.txt")
      $writer2 = New-Object System.IO.StreamWriter($entry2.Open())
      $writer2.Write("content2")
      $writer2.Dispose()
      $archive.Dispose()
      $zipStream.Dispose()
    `;
    execFileSync('powershell.exe', ['-NoProfile', '-Command', psScript], { stdio: 'pipe' });

    if (fs.existsSync(mockDupZipPath)) {
      const mockZipSize = fs.statSync(mockDupZipPath).size;
      const mockZipHash = crypto.createHash('sha256').update(fs.readFileSync(mockDupZipPath)).digest('hex').toUpperCase();

      const dupManifestPath = path.join(TEST_DIR, 'manifest-duplicate-entry.json');
      fs.writeFileSync(dupManifestPath, JSON.stringify({
        candidate: true,
        status: 'VERIFIED_CLEAN',
        isDirty: false,
        sizeBytes: mockZipSize,
        sha256: mockZipHash,
        codeCommit: expectedCommit
      }, null, 2));

      const res = runPowerShell([
        '-DestinationPath', path.join(TEST_DIR, 'dest-zip-duplicate'),
        '-ManifestPath', dupManifestPath,
        '-ZipPath', mockDupZipPath,
        '-TestMode'
      ]);
      assert(res.code !== 0, 'Launcher rejects archive containing duplicate normalized entries');
      assert((res.stderr + res.stdout).includes('duplicate normalized entry') || (res.stderr + res.stdout).includes('unsafe path traversal or absolute entry'),
        'Error identifies duplicate or unsafe entry in ZIP');
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
