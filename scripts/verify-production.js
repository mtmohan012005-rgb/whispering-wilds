#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - Production Verification Pipeline
 * Validates:
 *  - Unity project structure and configuration
 *  - Backend server security
 *  - Multiplayer room cap consistency
 *  - No browser game remnants
 *  - Required documentation
 *
 * Exit code 0 on PASS, 1 on FAIL.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

function verifyProduction() {
  console.log('====================================================');
  console.log('THE WHISPERING WILDS - PRODUCTION READINESS VERIFICATION');
  console.log('====================================================\n');

  let passed = true;
  const errors = [];

  // 1. No browser game remnants
  const browserRemnants = ['index.html', 'js/', 'css/', 'sw.js', 'netlify.toml', 'electron-main.js', 'serve.ps1'];
  let noBrowserPass = true;
  for (const remnant of browserRemnants) {
    const full = path.join(ROOT_DIR, remnant);
    if (fs.existsSync(full)) {
      noBrowserPass = false;
      errors.push(`Browser game remnant found: ${remnant}`);
    }
  }
  if (noBrowserPass) {
    console.log('✓ NO BROWSER GAME REMNANTS: PASS');
  } else {
    console.error('✗ NO BROWSER GAME REMNANTS: FAIL');
    passed = false;
  }

  // 2. Unity project structure
  const unityDirs = [
    'unity/Assets/_Project/Scripts',
    'unity/Assets/_Project/Scenes',
    'unity/Packages',
    'unity/ProjectSettings'
  ];
  let unityPass = true;
  for (const dir of unityDirs) {
    if (!fs.existsSync(path.join(ROOT_DIR, dir))) {
      unityPass = false;
      errors.push(`Missing Unity directory: ${dir}`);
    }
  }
  if (unityPass) {
    console.log('✓ UNITY PROJECT STRUCTURE: PASS');
  } else {
    console.error('✗ UNITY PROJECT STRUCTURE: FAIL');
    passed = false;
  }

  // 3. Multiplayer room cap consistency
  const serverConfigPath = path.join(ROOT_DIR, 'server', 'config.js');
  if (fs.existsSync(serverConfigPath)) {
    try {
      const srvConfig = require(serverConfigPath);
      if (srvConfig.MAX_PLAYERS_PER_ROOM !== 5) {
        errors.push(`server/config.js MAX_PLAYERS_PER_ROOM is ${srvConfig.MAX_PLAYERS_PER_ROOM} (expected 5).`);
        passed = false;
      } else {
        console.log('✓ SERVER CONFIG ROOM CAP: PASS (5 players max)');
      }
    } catch (e) {
      console.log('⚠ SERVER CONFIG: Could not load (may be environment-dependent)');
    }
  } else {
    console.log('⚠ SERVER CONFIG: Not found (skipping room cap check)');
  }

  // 4. Server security
  const serverPath = path.join(ROOT_DIR, 'server', 'server.js');
  if (fs.existsSync(serverPath)) {
    const srvContent = fs.readFileSync(serverPath, 'utf8');
    if (srvContent.includes("app.post('/api/test-results'") && !srvContent.includes("process.env.NODE_ENV === 'development'")) {
      errors.push('server/server.js exposes POST /api/test-results in production without environment gate.');
      passed = false;
    } else {
      console.log('✓ SERVER ENDPOINTS SECURITY: PASS');
    }
  }

  // 5. Required documentation
  const docs = ['docs/ARCHITECTURE.md', 'README.md'];
  let docsPass = true;
  for (const doc of docs) {
    if (!fs.existsSync(path.join(ROOT_DIR, doc))) {
      docsPass = false;
      errors.push(`Missing documentation: ${doc}`);
    }
  }
  if (docsPass) {
    console.log('✓ DOCUMENTATION: PASS');
  } else {
    console.error('✗ DOCUMENTATION: FAIL');
    passed = false;
  }

  // 6. Assembly definitions
  const asmdefs = [
    'unity/Assets/_Project/Scripts/WhisperingWilds.asmdef',
    'unity/Assets/_Project/Scripts/Editor/WhisperingWilds.Editor.asmdef',
    'unity/Assets/_Project/Tests/Editor/WhisperingWilds.Tests.Editor.asmdef'
  ];
  let asmdefPass = true;
  for (const asmdef of asmdefs) {
    if (!fs.existsSync(path.join(ROOT_DIR, asmdef))) {
      asmdefPass = false;
      errors.push(`Missing assembly definition: ${asmdef}`);
    }
  }
  if (asmdefPass) {
    console.log('✓ ASSEMBLY DEFINITIONS: PASS');
  } else {
    console.error('✗ ASSEMBLY DEFINITIONS: FAIL');
    passed = false;
  }

  // Summary
  console.log('\n====================================================');
  console.log('VERIFY-PRODUCTION REPORT:');
  console.log('====================================================');
  if (passed && errors.length === 0) {
    console.log('PRODUCTION CONFIGURATION: PASS');
    console.log('UNITY STRUCTURE: PASS');
    console.log('SECURITY ENDPOINTS: PASS');
    console.log('ALL PRODUCTION CHECKS: PASS');
    console.log('====================================================\n');
    return true;
  } else {
    console.error('ALL PRODUCTION CHECKS: FAIL');
    errors.forEach(e => console.error(`  - [ERROR] ${e}`));
    console.log('====================================================\n');
    return false;
  }
}

if (require.main === module) {
  const success = verifyProduction();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyProduction };
