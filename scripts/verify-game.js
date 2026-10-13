#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - Unity Project Verification Suite
 * Verifies the Unity 6 standalone game project structure, assets, and configuration.
 *
 * Exit code 0 on PASS, 1 on FAIL.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const UNITY_DIR = path.join(ROOT_DIR, 'unity');

function runVerification() {
  console.log('================================================================');
  console.log('THE WHISPERING WILDS (KAATTU VAZHI) - UNITY PROJECT VERIFICATION');
  console.log('================================================================\n');

  const checklist = {};
  const failures = [];

  // 1. Unity project structure
  const requiredDirs = [
    'unity/Assets/_Project/Scripts',
    'unity/Assets/_Project/Scenes',
    'unity/Assets/_Project/Prefabs',
    'unity/Assets/_Project/Art',
    'unity/Packages',
    'unity/ProjectSettings'
  ];
  let structurePass = true;
  for (const dir of requiredDirs) {
    const full = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(full)) {
      structurePass = false;
      failures.push(`Missing directory: ${dir}`);
    }
  }
  checklist['UNITY PROJECT STRUCTURE'] = structurePass ? 'PASS' : 'FAIL';

  // 2. Assembly definitions
  const asmdefs = [
    'unity/Assets/_Project/Scripts/WhisperingWilds.asmdef',
    'unity/Assets/_Project/Scripts/Editor/WhisperingWilds.Editor.asmdef',
    'unity/Assets/_Project/Tests/Editor/WhisperingWilds.Tests.Editor.asmdef'
  ];
  let asmdefPass = true;
  for (const asmdef of asmdefs) {
    const full = path.join(ROOT_DIR, asmdef);
    if (!fs.existsSync(full)) {
      asmdefPass = false;
      failures.push(`Missing assembly definition: ${asmdef}`);
    }
  }
  checklist['ASSEMBLY DEFINITIONS'] = asmdefPass ? 'PASS' : 'FAIL';

  // 3. Build scenes
  const scenes = [
    'unity/Assets/_Project/Scenes/00_Boot.unity',
    'unity/Assets/_Project/Scenes/01_StateMap_TamilNadu.unity',
    'unity/Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity',
    'unity/Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity',
    'unity/Assets/_Project/Scenes/04_Thanjavur_Delta.unity',
    'unity/Assets/_Project/Scenes/05_Chettinad_Mansion.unity',
    'unity/Assets/_Project/Scenes/06_Mamallapuram_Shore.unity',
    'unity/Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity'
  ];
  let scenesPass = true;
  for (const scene of scenes) {
    const full = path.join(ROOT_DIR, scene);
    if (!fs.existsSync(full)) {
      scenesPass = false;
      failures.push(`Missing scene: ${scene}`);
    }
  }
  checklist['BUILD SCENES'] = scenesPass ? 'PASS' : 'FAIL';

  // 4. Package manifest
  const manifestPath = path.join(UNITY_DIR, 'Packages', 'manifest.json');
  let manifestPass = true;
  if (!fs.existsSync(manifestPath)) {
    manifestPass = false;
    failures.push('Missing unity/Packages/manifest.json');
  } else {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (!manifest.dependencies || !manifest.dependencies['com.unity.render-pipelines.high-definition']) {
        manifestPass = false;
        failures.push('HDRP package not found in manifest');
      }
    } catch (e) {
      manifestPass = false;
      failures.push(`Invalid manifest JSON: ${e.message}`);
    }
  }
  checklist['PACKAGE MANIFEST'] = manifestPass ? 'PASS' : 'FAIL';

  // 5. Player character model
  const playerModel = path.join(ROOT_DIR, 'unity/Assets/_Project/Art/Models/Characters/Player/player.glb');
  let playerPass = fs.existsSync(playerModel);
  if (!playerPass) {
    failures.push('Missing player character model');
  }
  checklist['PLAYER MODEL'] = playerPass ? 'PASS' : 'FAIL';

  // 6. Tamil font
  const tamilFont = path.join(ROOT_DIR, 'unity/Assets/_Project/Resources/Fonts/TamilFont.ttf');
  let fontPass = fs.existsSync(tamilFont);
  if (!fontPass) {
    failures.push('Missing Tamil font');
  }
  checklist['TAMIL FONT'] = fontPass ? 'PASS' : 'FAIL';

  // 7. NavMesh data (stored in subdirectories, so recursive search)
  const navMeshDir = path.join(ROOT_DIR, 'unity/Assets/_Project/NavMeshData/');
  let navMeshPass = true;
  if (fs.existsSync(navMeshDir)) {
    function countAssets(dir) {
      let count = 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) count += countAssets(full);
        else if (e.name.endsWith('.asset')) count++;
      }
      return count;
    }
    const navMeshCount = countAssets(navMeshDir);
    if (navMeshCount === 0) {
      navMeshPass = false;
      failures.push('No NavMesh assets found');
    }
  } else {
    navMeshPass = false;
    failures.push('NavMesh directory not found');
  }
  checklist['NAV MESH DATA'] = navMeshPass ? 'PASS' : 'FAIL';

  // 8. Backend server
  const serverFiles = ['server.js', 'server/server.js'];
  let serverPass = true;
  for (const sf of serverFiles) {
    const full = path.join(ROOT_DIR, sf);
    if (!fs.existsSync(full)) {
      serverPass = false;
      failures.push(`Missing server file: ${sf}`);
    }
  }
  checklist['BACKEND SERVER'] = serverPass ? 'PASS' : 'FAIL';

  // 9. Localization
  const locPath = path.join(ROOT_DIR, 'unity/Assets/_Project/Scripts/Localization/LocalizationManager.cs');
  let locPass = fs.existsSync(locPath);
  if (!locPass) {
    failures.push('Missing LocalizationManager');
  }
  checklist['LOCALIZATION'] = locPass ? 'PASS' : 'FAIL';

  // 10. Save system
  const savePath = path.join(ROOT_DIR, 'unity/Assets/_Project/Scripts/Core/SaveSystem.cs');
  let savePass = fs.existsSync(savePath);
  if (!savePass) {
    failures.push('Missing SaveSystem');
  }
  checklist['SAVE SYSTEM'] = savePass ? 'PASS' : 'FAIL';

  // 11. Campaign flow
  const campaignPath = path.join(ROOT_DIR, 'unity/Assets/_Project/Scripts/Core/CampaignFlow.cs');
  let campaignPass = fs.existsSync(campaignPath);
  if (!campaignPass) {
    failures.push('Missing CampaignFlow');
  }
  checklist['CAMPAIGN FLOW'] = campaignPass ? 'PASS' : 'FAIL';

  // 12. No browser game remnants
  const browserRemnants = ['index.html', 'js/', 'css/', 'sw.js', 'netlify.toml', 'electron-main.js'];
  let noBrowserPass = true;
  for (const remnant of browserRemnants) {
    const full = path.join(ROOT_DIR, remnant);
    if (fs.existsSync(full)) {
      noBrowserPass = false;
      failures.push(`Browser game remnant found: ${remnant}`);
    }
  }
  checklist['NO BROWSER GAME'] = noBrowserPass ? 'PASS' : 'FAIL';

  // 13. Editor build settings
  const buildSettings = path.join(ROOT_DIR, 'unity/ProjectSettings/EditorBuildSettings.asset');
  let buildSettingsPass = fs.existsSync(buildSettings);
  if (!buildSettingsPass) {
    failures.push('Missing EditorBuildSettings.asset');
  }
  checklist['BUILD SETTINGS'] = buildSettingsPass ? 'PASS' : 'FAIL';

  // 14. Source assets
  const assetsDir = path.join(ROOT_DIR, 'assets');
  let assetsPass = fs.existsSync(assetsDir);
  if (!assetsPass) {
    failures.push('Missing source assets directory');
  }
  checklist['SOURCE ASSETS'] = assetsPass ? 'PASS' : 'FAIL';

  // 15. Documentation
  const docs = ['docs/ARCHITECTURE.md'];
  let docsPass = true;
  for (const doc of docs) {
    const full = path.join(ROOT_DIR, doc);
    if (!fs.existsSync(full)) {
      docsPass = false;
      failures.push(`Missing documentation: ${doc}`);
    }
  }
  checklist['DOCUMENTATION'] = docsPass ? 'PASS' : 'FAIL';

  // Summary
  console.log('\nResults:');
  console.log('-------');
  for (const [key, value] of Object.entries(checklist)) {
    const icon = value === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${key}: ${value}`);
  }

  const total = Object.keys(checklist).length;
  const passed = Object.values(checklist).filter(v => v === 'PASS').length;
  console.log(`\n${passed}/${total} checks passed`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  - ${f}`));
  }

  console.log('\n================================================================');
  if (passed === total) {
    console.log('VERIFICATION PASSED');
    console.log('================================================================');
    process.exit(0);
  } else {
    console.log('VERIFICATION FAILED');
    console.log('================================================================');
    process.exit(1);
  }
}

runVerification();
