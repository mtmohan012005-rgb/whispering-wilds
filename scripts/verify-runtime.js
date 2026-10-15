#!/usr/bin/env node
/**
 * The Whispering Wilds - Unity Standalone Runtime Verification
 *
 * Checks that the Unity Windows x64 standalone build exists and is valid.
 * Replaces the old browser-based runtime test (puppeteer/Chrome).
 *
 * Usage:
 *   node scripts/verify-runtime.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'unity', 'Build', 'Windows');
const EXE_PATH = path.join(BUILD_DIR, 'TheWhisperingWilds.exe');
const DATA_DIR = path.join(BUILD_DIR, 'TheWhisperingWilds_Data');

let passed = 0;
let failed = 0;
let skipped = 0;

const pass = (msg) => { process.stdout.write(`  PASS  ${msg}\n`); passed++; };
const fail = (msg) => { process.stdout.write(`  FAIL  ${msg}\n`); failed++; };
const skip = (msg) => { process.stdout.write(`  SKIP  ${msg}\n`); skipped++; };

console.log('====================================================');
console.log('Unity Standalone Runtime Verification');
console.log('====================================================\n');

// 1. Check build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fail('Build directory not found: ' + BUILD_DIR);
  console.log('\nBuild the game first:');
  console.log('  Open unity/ in Unity 6000.6.3f1');
  console.log('  Build via WhisperingWilds.Editor.BuildPipelineAutomation');
  process.exit(1);
}
pass('Build directory exists');

// 2. Check executable exists
if (!fs.existsSync(EXE_PATH)) {
  fail('Executable not found: ' + EXE_PATH);
  process.exit(1);
}
pass('Executable exists');

// 3. Check executable size (should be ~0.6 MB for the Unity player stub)
const exeStat = fs.statSync(EXE_PATH);
const exeSizeMB = (exeStat.size / (1024 * 1024)).toFixed(2);
if (exeStat.size < 100 * 1024) {
  fail('Executable too small (' + exeSizeMB + ' MB), likely incomplete');
} else {
  pass('Executable size: ' + exeSizeMB + ' MB');
}

// 4. Check data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fail('Player data directory not found: ' + DATA_DIR);
} else {
  pass('Player data directory exists');
  
  // 5. Check managed.dll exists (required for C# scripts)
  const managedDll = path.join(DATA_DIR, 'Managed', 'Assembly-CSharp.dll');
  const managedDllAlt = path.join(DATA_DIR, 'Managed', 'WhisperingWilds.dll');
  if (fs.existsSync(managedDll) || fs.existsSync(managedDllAlt)) {
    pass('Managed assemblies present');
  } else {
    // Check if any .dll exists in Managed/
    const managedDir = path.join(DATA_DIR, 'Managed');
    if (fs.existsSync(managedDir)) {
      const dlls = fs.readdirSync(managedDir).filter(f => f.endsWith('.dll'));
      if (dlls.length > 0) {
        pass('Managed assemblies present (' + dlls.length + ' DLLs)');
      } else {
        fail('No managed assemblies found in Managed/');
      }
    } else {
      skip('Managed directory not found (may be in data.unity3d archive)');
    }
  }
}

// 6. Check data.unity3d exists (main asset archive)
const dataArchive = path.join(DATA_DIR, 'data.unity3d');
if (fs.existsSync(dataArchive)) {
  const dataSizeMB = (fs.statSync(dataArchive).size / (1024 * 1024)).toFixed(2);
  pass('Asset archive exists: ' + dataSizeMB + ' MB');
} else {
  fail('Asset archive not found: ' + dataArchive);
}

// 7. Check launcher scripts
const launcher = path.join(ROOT, 'Launch-Game-Unity.ps1');
if (fs.existsSync(launcher)) {
  pass('Unity launcher script exists');
} else {
  fail('Unity launcher script not found');
}

console.log('\n====================================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped');
if (failed === 0) {
  console.log('Runtime verification: PASS');
} else {
  console.log('Runtime verification: FAIL');
}
console.log('====================================================');

process.exit(failed > 0 ? 1 : 0);
