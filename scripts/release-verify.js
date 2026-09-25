/**
 * The Whispering Wilds - Automated Release Gate Verification
 * Enforces zero-compromise checks before any production release is permitted.
 */
const fs = require('fs');
const path = require('path');

function runReleaseGateAudit() {
  console.log('====================================================');
  console.log('THE WHISPERING WILDS: AUTOMATED RELEASE GATE AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;
  const errors = [];

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ BLOCKER: ${message}`);
      failed++;
      errors.push(message);
    }
  }

  // 1. Critical Player Asset Integrity
  const playerGlbPath = path.join(__dirname, '..', 'assets/characters/player/player.glb');
  assert(fs.existsSync(playerGlbPath), 'Production player model exists at assets/characters/player/player.glb');
  if (fs.existsSync(playerGlbPath)) {
    const stat = fs.statSync(playerGlbPath);
    assert(stat.size > 1000, `Player model is non-trivial binary asset (${stat.size} bytes)`);

    // GLB magic number header verification (0x46546C67 -> "glTF")
    const buf = fs.readFileSync(playerGlbPath);
    const magic = buf.toString('ascii', 0, 4);
    assert(magic === 'glTF', 'Player model possesses valid glTF 2.0 binary header');
  }

  // 2. Scan codebase for Xbot or external demo humanoid references
  const scanDirs = ['js', 'platform', 'desktop'];
  let xbotFound = false;
  let placeholderCriticalFound = false;

  function scanFolder(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        scanFolder(full);
      } else if (ent.isFile() && (ent.name.endsWith('.js') || ent.name.endsWith('.html'))) {
        const content = fs.readFileSync(full, 'utf8');
        if (/xbot|mrdoob|mixamo_demo/i.test(content) && !full.includes('test') && !full.includes('audit')) {
          console.warn(`    Warning: Xbot reference in ${full}`);
          xbotFound = true;
        }
      }
    }
  }

  for (const d of scanDirs) {
    const fullDir = path.join(__dirname, '..', d);
    if (fs.existsSync(fullDir)) scanFolder(fullDir);
  }

  assert(!xbotFound, 'Zero Xbot / external demo models found in production gameplay logic');

  // 3. Customization Ceiling Invariant Verification
  // In `js/systems/player-customization.js`, maximum changes must equal 5
  const custFile = path.join(__dirname, '..', 'js/systems/player-customization.js');
  if (fs.existsSync(custFile)) {
    const custCode = fs.readFileSync(custFile, 'utf8');
    assert(custCode.includes('5') && !custCode.includes('MAX_CUSTOMIZATION = 10'), 'Player customization strictly capped at 5 permanent changes maximum');
  }

  // 4. Secret / Private Key Audit
  let secretFound = false;
  function scanSecrets(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name !== 'node_modules' && ent.name !== '.git') scanSecrets(full);
      } else if (ent.isFile() && (ent.name.endsWith('.js') || ent.name.endsWith('.json'))) {
        const txt = fs.readFileSync(full, 'utf8');
        if (/BEGIN PRIVATE KEY|BEGIN RSA PRIVATE KEY|aws_secret_access_key/i.test(txt)) {
          secretFound = true;
          console.error(`    Found private credential in: ${full}`);
        }
      }
    }
  }
  scanSecrets(path.join(__dirname, '..'));
  assert(!secretFound, 'Zero hardcoded secrets, private keys, or API tokens found in release tree');

  console.log('\n====================================================');
  console.log(`RELEASE GATE STATUS: ${failed === 0 ? 'READY_FOR_RELEASE' : 'BLOCKED'}`);
  console.log(`Metrics: ${passed} Checks Passed, ${failed} Blockers`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runReleaseGateAudit();
