#!/usr/bin/env node
/**
 * The Whispering Wilds - Unity Build Compatibility Verification
 *
 * Checks that the Unity project and build are compatible:
 * - Unity version matches project settings
 * - Required packages are present
 * - Assembly definitions are valid
 * - Build scenes are registered
 *
 * Replaces the old browser-based compatibility test (Three.js modules).
 *
 * Usage:
 *   node scripts/verify-compatibility.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UNITY_DIR = path.join(ROOT, 'unity');

let passed = 0;
let failed = 0;
let skipped = 0;

const pass = (msg) => { process.stdout.write(`  PASS  ${msg}\n`); passed++; };
const fail = (msg) => { process.stdout.write(`  FAIL  ${msg}\n`); failed++; };
const skip = (msg) => { process.stdout.write(`  SKIP  ${msg}\n`); skipped++; };

console.log('====================================================');
console.log('Unity Build Compatibility Verification');
console.log('====================================================\n');

// 1. Check Unity project directory
if (!fs.existsSync(UNITY_DIR)) {
  fail('Unity project directory not found: ' + UNITY_DIR);
  process.exit(1);
}
pass('Unity project directory exists');

// 2. Check ProjectVersion.txt
const projectVersionPath = path.join(UNITY_DIR, 'ProjectSettings', 'ProjectVersion.txt');
if (fs.existsSync(projectVersionPath)) {
  const content = fs.readFileSync(projectVersionPath, 'utf8');
  const m = content.match(/m_EditorVersion:\s*(.+)/);
  if (m) {
    pass('Unity version: ' + m[1].trim());
  } else {
    warn('Could not parse Unity version from ProjectVersion.txt');
  }
} else {
  fail('ProjectVersion.txt not found');
}

// 3. Check package manifest
const manifestPath = path.join(UNITY_DIR, 'Packages', 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  pass('Package manifest is valid JSON');
  
  // Check for HDRP
  if (manifest.dependencies && manifest.dependencies['com.unity.render-pipelines.high-definition']) {
    pass('HDRP package is configured');
  } else {
    fail('HDRP package not found in manifest');
  }
  
  // Check for Input System
  if (manifest.dependencies && manifest.dependencies['com.unity.inputsystem']) {
    pass('Input System package is configured');
  } else {
    skip('Input System package not found (may use legacy input)');
  }
} else {
  fail('Package manifest not found');
}

// 4. Check assembly definitions
const scriptsDir = path.join(UNITY_DIR, 'Assets', '_Project', 'Scripts');
const asmdefFiles = [];
const findAsmdef = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    if (entry.endsWith('.asmdef')) {
      asmdefFiles.push(entryPath);
    } else if (fs.statSync(entryPath).isDirectory()) {
      findAsmdef(entryPath);
    }
  }
};
findAsmdef(scriptsDir);

if (asmdefFiles.length > 0) {
  pass('Found ' + asmdefFiles.length + ' assembly definition(s)');
  for (const asmdef of asmdefFiles) {
    try {
      JSON.parse(fs.readFileSync(asmdef, 'utf8'));
      pass('Valid: ' + path.basename(asmdef));
    } catch (e) {
      fail('Invalid JSON: ' + path.basename(asmdef) + ' - ' + e.message);
    }
  }
} else {
  warn('No assembly definitions found (may use default assembly)');
}

// 5. Check EditorBuildSettings
const buildSettingsPath = path.join(UNITY_DIR, 'ProjectSettings', 'EditorBuildSettings.asset');
if (fs.existsSync(buildSettingsPath)) {
  pass('EditorBuildSettings.asset exists');
  const content = fs.readFileSync(buildSettingsPath, 'utf8');
  if (content.includes('00_Boot')) {
    pass('Boot scene is registered in build settings');
  } else {
    fail('Boot scene not found in build settings');
  }
} else {
  fail('EditorBuildSettings.asset not found');
}

// 6. Check required scenes
const scenesDir = path.join(UNITY_DIR, 'Assets', '_Project', 'Scenes');
const requiredScenes = [
  '00_Boot',
  '01_StateMap_TamilNadu',
  '02_Chennai_GeorgeTown',
  '03_Pichavaram_Wetlands',
  '04_Thanjavur_Delta',
  '05_Chettinad_Mansion',
  '06_Mamallapuram_Shore',
  '07_Nilgiris_Sanctuary'
];

if (fs.existsSync(scenesDir)) {
  const sceneFiles = fs.readdirSync(scenesDir).filter(f => f.endsWith('.unity'));
  pass('Found ' + sceneFiles.length + ' scene files');
  
  for (const required of requiredScenes) {
    const found = sceneFiles.some(f => f.startsWith(required));
    if (found) {
      pass('Scene: ' + required);
    } else {
      fail('Missing scene: ' + required);
    }
  }
} else {
  fail('Scenes directory not found: ' + scenesDir);
}

// 7. Check Tamil font
const tamilFontPath = path.join(UNITY_DIR, 'Assets', '_Project', 'Resources', 'Fonts', 'TamilFont.ttf');
if (fs.existsSync(tamilFontPath)) {
  pass('Tamil font found in Resources');
} else {
  fail('Tamil font not found in Resources');
}

// 8. Check NavMesh data
const navMeshDir = path.join(UNITY_DIR, 'Assets', '_Project', 'NavMesh');
if (fs.existsSync(navMeshDir)) {
  const navMeshFiles = fs.readdirSync(navMeshDir).filter(f => f.endsWith('.asset'));
  pass('Found ' + navMeshFiles.length + ' NavMesh asset(s)');
} else {
  skip('NavMesh directory not found (may be embedded in scenes)');
}

console.log('\n====================================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped');
if (failed === 0) {
  console.log('Compatibility verification: PASS');
} else {
  console.log('Compatibility verification: FAIL');
}
console.log('====================================================');

process.exit(failed > 0 ? 1 : 0);
