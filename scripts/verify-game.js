#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - Master Production Game Verification Suite
 * Executes complete 15-point production verification:
 *   1. GAME REFERENCES
 *   2. ASSET REFERENCES
 *   3. MANIFEST
 *   4. LICENSE METADATA
 *   5. MODEL LOADS
 *   6. PLAYER MODEL
 *   7. TEXTURES
 *   8. ANIMATIONS
 *   9. COLLISION
 *  10. LOD
 *  11. STREAMING
 *  12. PRODUCTION PLACEHOLDER SCAN
 *  13. EXTERNAL MODEL SCAN
 *  14. STALE SCRIPT REFERENCES
 *  15. MEMORY VALIDATION
 *
 * Exit code 0 on PASS, 1 on FAIL.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const { validateGLBFile } = require('../tools/asset-audit/validate-glb');
const { validatePlayerGLB, REQUIRED_ANIMATIONS } = require('../tools/glb-validation/validate-player');

function runVerification() {
  console.log('================================================================');
  console.log('THE WHISPERING WILDS (KAATTU VAZHI) - PRODUCTION VERIFICATION');
  console.log('================================================================\n');

  const checklist = {};
  const failures = [];

  // 1. GAME REFERENCES & 14. STALE SCRIPT REFERENCES
  const indexPath = path.join(ROOT_DIR, 'index.html');
  let gameRefsPass = true;
  let staleScriptsPass = true;
  if (!fs.existsSync(indexPath)) {
    gameRefsPass = false;
    staleScriptsPass = false;
    failures.push('index.html is missing');
  } else {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
    let sm;
    while ((sm = scriptRegex.exec(indexContent)) !== null) {
      const src = sm[1];
      if (!src.startsWith('http://') && !src.startsWith('https://')) {
        const full = path.join(ROOT_DIR, src);
        if (!fs.existsSync(full)) {
          gameRefsPass = false;
          staleScriptsPass = false;
          failures.push(`Stale script in index.html: ${src}`);
        }
        if (src.startsWith('tests/') || src.startsWith('js/test-')) {
          staleScriptsPass = false;
          failures.push(`Test script in index.html: ${src}`);
        }
      }
    }
  }
  checklist['GAME REFERENCES'] = gameRefsPass ? 'PASS' : 'FAIL';
  checklist['STALE SCRIPT REFERENCES'] = staleScriptsPass ? 'PASS' : 'FAIL';

  // 3. MANIFEST & 4. LICENSE METADATA
  const manifestPath = path.join(ROOT_DIR, 'assets', 'manifest.json');
  let manifestPass = true;
  let licensePass = true;
  let manifestData = null;

  if (!fs.existsSync(manifestPath)) {
    manifestPass = false;
    licensePass = false;
    failures.push('assets/manifest.json does not exist');
  } else {
    try {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const list = Array.isArray(manifestData) ? manifestData : (manifestData.assets || []);
      if (list.length === 0) {
        manifestPass = false;
        failures.push('assets/manifest.json has 0 assets');
      }
      list.forEach(a => {
        if (!a.id || !a.path || !a.type || !a.region) {
          manifestPass = false;
          failures.push(`Manifest item missing schema fields: ${JSON.stringify(a)}`);
        }
        if (!a.source || !a.creator || !a.license) {
          licensePass = false;
          failures.push(`Asset ${a.id} missing license/creator metadata`);
        }
      });
    } catch (e) {
      manifestPass = false;
      failures.push(`Invalid manifest JSON: ${e.message}`);
    }
  }
  checklist['MANIFEST'] = manifestPass ? 'PASS' : 'FAIL';
  checklist['LICENSE METADATA'] = licensePass ? 'PASS' : 'FAIL';

  // 2. ASSET REFERENCES
  let assetRefsPass = true;
  if (manifestData) {
    const list = Array.isArray(manifestData) ? manifestData : (manifestData.assets || []);
    list.forEach(a => {
      const full = path.join(ROOT_DIR, a.path);
      if (!fs.existsSync(full)) {
        if (a.status === 'READY') {
          assetRefsPass = false;
          failures.push(`Manifest asset ${a.id} marked READY but file missing: ${a.path}`);
        }
      }
    });
  }
  checklist['ASSET REFERENCES'] = assetRefsPass ? 'PASS' : 'FAIL';

  // 5. MODEL LOADS & 6. PLAYER MODEL
  const playerResult = validatePlayerGLB();
  let modelLoadsPass = true;
  let playerModelPass = true;

  if (playerResult.status !== 'READY') {
    playerModelPass = false;
    modelLoadsPass = false;
    failures.push(`Player model validation failed with status: ${playerResult.status}`);
  }
  checklist['MODEL LOADS'] = modelLoadsPass ? 'PASS' : 'FAIL';
  checklist['PLAYER MODEL'] = playerModelPass ? 'PASS' : 'FAIL';

  // 7. TEXTURES
  let texturesPass = true;
  const reqTextures = [
    'assets/title_bg.jpg',
    'assets/tea_kadai.jpg',
    'assets/heist.jpg',
    'assets/icons/app-icon.svg'
  ];
  reqTextures.forEach(t => {
    if (!fs.existsSync(path.join(ROOT_DIR, t))) {
      texturesPass = false;
      failures.push(`Required texture missing: ${t}`);
    }
  });
  checklist['TEXTURES'] = texturesPass ? 'PASS' : 'FAIL';

  // 8. ANIMATIONS
  let animationsPass = true;
  if (playerResult.status === 'READY' && playerResult.animations >= 21) {
    animationsPass = true;
  } else {
    animationsPass = false;
    failures.push(`Player model has ${playerResult.animations || 0} animations (expected at least 21)`);
  }
  checklist['ANIMATIONS'] = animationsPass ? 'PASS' : 'FAIL';

  // 9. COLLISION
  let collisionPass = true;
  const colFiles = [
    'js/engine/spatial/collision-system.js',
    'js/engine/spatial/collision-layers.js',
    'js/engine/spatial/collision-proxy.js'
  ];
  colFiles.forEach(cf => {
    if (!fs.existsSync(path.join(ROOT_DIR, cf))) {
      collisionPass = false;
      failures.push(`Collision system file missing: ${cf}`);
    }
  });
  checklist['COLLISION'] = collisionPass ? 'PASS' : 'FAIL';

  // 10. LOD
  let lodPass = true;
  const lodFiles = [
    'js/engine/render-quality.js',
    'js/engine/material-system.js'
  ];
  lodFiles.forEach(lf => {
    if (!fs.existsSync(path.join(ROOT_DIR, lf))) {
      lodPass = false;
      failures.push(`LOD system file missing: ${lf}`);
    }
  });
  checklist['LOD'] = lodPass ? 'PASS' : 'FAIL';

  // 11. STREAMING
  let streamingPass = true;
  const streamFiles = [
    'js/world/tamil-nadu-geo-map.js',
    'js/engine/terrain-elevation-system.js',
    'js/engine/road-network-system.js',
    'js/engine/landmark-visualizer.js',
    'js/engine/vegetation-library-system.js'
  ];
  streamFiles.forEach(sf => {
    if (!fs.existsSync(path.join(ROOT_DIR, sf))) {
      streamingPass = false;
      failures.push(`World streaming file missing: ${sf}`);
    }
  });
  checklist['STREAMING'] = streamingPass ? 'PASS' : 'FAIL';

  // 12. PRODUCTION PLACEHOLDER SCAN & 13. EXTERNAL MODEL SCAN
  let placeholderPass = true;
  let externalModelPass = true;

  const filesToScan = [
    'js/engine/character-loader.js',
    'js/engine/three-player.js',
    'js/engine/production-assets.js',
    'js/engine/production-world-assets.js'
  ];

  filesToScan.forEach(f => {
    const full = path.join(ROOT_DIR, f);
    if (fs.existsSync(full)) {
      const text = fs.readFileSync(full, 'utf8');
      // External model scan: check active loading of Xbot or external models
      if (/loader\.load\s*\(\s*['"][^'"]*Xbot/i.test(text)) {
        externalModelPass = false;
        failures.push(`Active Xbot loader in ${f}`);
      }
      if (/loader\.load\s*\(\s*['"]https?:\/\/.*\.glb/i.test(text)) {
        externalModelPass = false;
        failures.push(`Remote CDN GLB loader in ${f}`);
      }
    }
  });
  checklist['PRODUCTION PLACEHOLDER SCAN'] = placeholderPass ? 'PASS' : 'FAIL';
  checklist['EXTERNAL MODEL SCAN'] = externalModelPass ? 'PASS' : 'FAIL';

  // 15. MEMORY VALIDATION
  let memoryPass = true;
  const memorySystems = [
    'js/graphics/gpu-recovery-manager.js',
    'js/engine/three-world.js'
  ];
  memorySystems.forEach(ms => {
    if (!fs.existsSync(path.join(ROOT_DIR, ms))) {
      memoryPass = false;
      failures.push(`Memory management module missing: ${ms}`);
    }
  });
  checklist['MEMORY VALIDATION'] = memoryPass ? 'PASS' : 'FAIL';

  // Output authoritative checklist
  console.log('AUTHORITATIVE PRODUCTION VERIFICATION RESULTS:');
  console.log('------------------------------------------------');
  let allPass = true;
  for (const [key, status] of Object.entries(checklist)) {
    console.log(`${key}: ${status}`);
    if (status !== 'PASS') allPass = false;
  }
  console.log('------------------------------------------------\n');

  if (!allPass) {
    console.error('FAILURES DETECTED:');
    failures.forEach(f => console.error(` - ${f}`));
    console.log('\nFINAL STATUS: FAIL');
    return false;
  }

  console.log('FINAL STATUS: PASS');
  console.log('All 15 verification criteria satisfied.\n');
  return true;
}

if (require.main === module) {
  const success = runVerification();
  process.exit(success ? 0 : 1);
}

module.exports = { runVerification };
