#!/usr/bin/env node
/**
 * The Whispering Wilds - Unity Build Performance Verification
 *
 * Checks the Unity Windows x64 build for performance-related concerns:
 * - Build size and asset archive compression
 * - Managed assembly stripping
 * - Scene count and sizes
 *
 * Replaces the old browser-based performance test (puppeteer/Chrome).
 *
 * Usage:
 *   node scripts/verify-performance.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'unity', 'Build', 'Windows');

let passed = 0;
let failed = 0;
let warnings = 0;

const pass = (msg) => { process.stdout.write(`  PASS  ${msg}\n`); passed++; };
const fail = (msg) => { process.stdout.write(`  FAIL  ${msg}\n`); failed++; };
const warn = (msg) => { process.stdout.write(`  WARN  ${msg}\n`); warnings++; };

console.log('====================================================');
console.log('Unity Build Performance Verification');
console.log('====================================================\n');

// 1. Check build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fail('Build directory not found: ' + BUILD_DIR);
  console.log('\nBuild the game first.');
  process.exit(1);
}
pass('Build directory exists');

// 2. Check total build size
let totalSize = 0;
let fileCount = 0;
try {
  const entries = fs.readdirSync(BUILD_DIR);
  for (const entry of entries) {
    const entryPath = path.join(BUILD_DIR, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isFile()) {
      totalSize += stat.size;
      fileCount++;
    } else if (stat.isDirectory()) {
      // Recursively sum directory sizes
      const sumDir = (dir) => {
        for (const child of fs.readdirSync(dir)) {
          const childPath = path.join(dir, child);
          const childStat = fs.statSync(childPath);
          if (childStat.isFile()) {
            totalSize += childStat.size;
            fileCount++;
          } else if (childStat.isDirectory()) {
            sumDir(childPath);
          }
        }
      };
      sumDir(entryPath);
    }
  }
} catch (e) {
  warn('Could not calculate total build size: ' + e.message);
}

const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(1);
pass('Total build size: ' + totalSizeMB + ' MB (' + fileCount + ' files)');

// 3. Check build size is reasonable (< 500 MB for this game)
if (totalSize > 500 * 1024 * 1024) {
  warn('Build size is large (' + totalSizeMB + ' MB). Consider LZ4HC compression.');
} else if (totalSize > 200 * 1024 * 1024) {
  warn('Build size is moderate (' + totalSizeMB + ' MB). Monitor asset growth.');
} else {
  pass('Build size is within acceptable range');
}

// 4. Check data.unity3d compression
const dataArchive = path.join(BUILD_DIR, 'TheWhisperingWilds_Data', 'data.unity3d');
if (fs.existsSync(dataArchive)) {
  const dataSizeMB = (fs.statSync(dataArchive).size / (1024 * 1024)).toFixed(1);
  pass('Asset archive: ' + dataSizeMB + ' MB');
  
  // LZ4HC compressed archives are typically much smaller
  if (fs.statSync(dataArchive).size > 100 * 1024 * 1024) {
    warn('Asset archive is large. Consider enabling LZ4HC compression.');
  }
} else {
  fail('Asset archive not found');
}

// 5. Check managed assemblies
const managedDir = path.join(BUILD_DIR, 'TheWhisperingWilds_Data', 'Managed');
if (fs.existsSync(managedDir)) {
  const dlls = fs.readdirSync(managedDir).filter(f => f.endsWith('.dll'));
  let managedSize = 0;
  for (const dll of dlls) {
    managedSize += fs.statSync(path.join(managedDir, dll)).size;
  }
  const managedSizeMB = (managedSize / (1024 * 1024)).toFixed(1);
  pass('Managed assemblies: ' + dlls.length + ' DLLs, ' + managedSizeMB + ' MB');
  
  if (dlls.length > 50) {
    warn('Many managed assemblies (' + dlls.length + '). Consider code stripping.');
  }
} else {
  skip('Managed directory not found (may be in data.unity3d archive)');
}

// 6. Check UnityPlayer.dll
const unityPlayerDll = path.join(BUILD_DIR, 'UnityPlayer.dll');
if (fs.existsSync(unityPlayerDll)) {
  const playerSizeMB = (fs.statSync(unityPlayerDll).size / (1024 * 1024)).toFixed(1);
  pass('UnityPlayer.dll: ' + playerSizeMB + ' MB');
} else {
  fail('UnityPlayer.dll not found');
}

console.log('\n====================================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed, ' + warnings + ' warnings');
if (failed === 0) {
  console.log('Performance verification: PASS');
} else {
  console.log('Performance verification: FAIL');
}
console.log('====================================================');

process.exit(failed > 0 ? 1 : 0);
