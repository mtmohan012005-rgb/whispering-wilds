/**
 * Build & Release Package Verification Script
 * Validates package configurations, build manifests, icons, entry points, and invariants.
 */

const fs = require('fs');
const path = require('path');
const { checkAssets } = require('./check-assets');

function verifyBuild() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const desktopDir = path.join(rootDir, 'desktop');
  const errors = [];

  // 1. Verify Entry HTML
  const entryHtml = path.join(rootDir, 'index.html');
  if (!fs.existsSync(entryHtml)) {
    errors.push('Missing index.html entry point.');
  }

  // 2. Verify Build Manifests
  const manifests = ['windows.json', 'macos.json', 'linux.json'];
  for (const m of manifests) {
    const p = path.join(desktopDir, 'build', m);
    if (!fs.existsSync(p)) {
      errors.push(`Missing build configuration: ${m}`);
    } else {
      try {
        const json = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (!json.appId || !json.productName) {
          errors.push(`Invalid build manifest ${m}: missing appId or productName`);
        }
      } catch (e) {
        errors.push(`Malformed JSON in build manifest ${m}`);
      }
    }
  }

  // 3. Verify Icons
  const icons = [
    path.join(desktopDir, 'icons', 'windows', 'icon.ico'),
    path.join(desktopDir, 'icons', 'macos', 'icon.icns'),
    path.join(desktopDir, 'icons', 'linux', 'icon.png')
  ];
  for (const iconPath of icons) {
    if (!fs.existsSync(iconPath)) {
      errors.push(`Missing icon: ${path.relative(rootDir, iconPath)}`);
    }
  }

  // 4. Verify Assets via checkAssets
  const assetReport = checkAssets(rootDir);
  if (!assetReport.valid) {
    errors.push(...assetReport.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
    assetReport
  };
}

if (require.main === module) {
  const res = verifyBuild();
  console.log('=== BUILD VERIFICATION RESULTS ===');
  console.log('Valid:', res.valid);
  if (!res.valid) {
    console.error('VERIFICATION ERRORS:');
    res.errors.forEach(e => console.error(' *', e));
    process.exit(1);
  } else {
    console.log('ALL BUILD AND PACKAGE CHECKS PASSED SUCCESSFULLY.');
  }
}

module.exports = { verifyBuild };
