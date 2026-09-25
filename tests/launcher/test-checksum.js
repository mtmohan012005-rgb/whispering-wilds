/**
 * tests/launcher/test-checksum.js
 * Verifies SHA-256 cryptographic checksum calculations, file mismatch detection,
 * and critical file launch gating.
 */

(function () {
  'use strict';

  async function runTestLauncherChecksum() {
    const results = { passed: true, checks: [] };
    const assert = (desc, cond) => {
      results.checks.push({ desc, passed: !!cond });
      if (!cond) results.passed = false;
    };

    const FileValidator = window.FileValidator;
    assert('FileValidator is loaded', !!FileValidator);

    const fv = new FileValidator();

    // Test 1: SHA-256 hash calculation returns 64 hex characters
    const sampleHash = await fv.computeHash('whispering_wilds_sample_payload');
    assert('Generated valid 64-character hex SHA-256 hash', typeof sampleHash === 'string' && sampleHash.length === 64);

    // Test 2: File validation against manifest
    const manifest = {
      files: [
        { path: 'index.html', sha256: sampleHash, critical: true },
        { path: 'assets/characters/player/player.glb', sha256: 'valid_hero_hash'.padEnd(64, '0'), critical: true },
        { path: 'assets/audio/extra.mp3', sha256: 'ambient_sound'.padEnd(64, '0'), critical: false }
      ]
    };

    // Case A: All valid
    const fileMapValid = {
      'index.html': { sha256: sampleHash },
      'assets/characters/player/player.glb': { sha256: 'valid_hero_hash'.padEnd(64, '0') },
      'assets/audio/extra.mp3': { sha256: 'ambient_sound'.padEnd(64, '0') }
    };

    const resA = await fv.validateFiles(fileMapValid, manifest);
    assert('Valid files pass verification with canLaunch = true', resA.allValid === true && resA.canLaunch === true);

    // Case B: Critical file corrupted
    const fileMapCorruptCritical = {
      'index.html': { sha256: sampleHash },
      'assets/characters/player/player.glb': { sha256: 'bad_tampered_hash'.padEnd(64, '0') }, // CORRUPT
      'assets/audio/extra.mp3': { sha256: 'ambient_sound'.padEnd(64, '0') }
    };

    const resB = await fv.validateFiles(fileMapCorruptCritical, manifest);
    assert('Corrupted critical player asset blocks launch', resB.canLaunch === false && resB.criticalFailure === true);

    // Case C: External Xbot demo character blocked
    const manifestWithXbot = {
      files: [
        { path: 'assets/characters/Xbot.glb', sha256: 'xbot_hash'.padEnd(64, '0'), critical: true }
      ]
    };
    const resC = await fv.validateFiles({ 'assets/characters/Xbot.glb': { sha256: 'xbot_hash'.padEnd(64, '0') } }, manifestWithXbot);
    assert('External demo character (Xbot) triggers audit failure', resC.hasExternalDemoModel === true && resC.canLaunch === false);

    return results;
  }

  window.runTestLauncherChecksum = runTestLauncherChecksum;
})();
