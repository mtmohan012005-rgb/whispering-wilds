/**
 * Windows Desktop Packaging Script
 * Prepares artifacts for Windows (x64 NSIS Installer and Portable executable).
 */

const fs = require('fs');
const path = require('path');
const { verifyBuild } = require('./verify-build');

async function buildWindows() {
  console.log('[Build-Windows] Starting Windows build packaging pipeline...');
  const verification = verifyBuild();
  if (!verification.valid) {
    console.error('[Build-Windows] Pre-build verification failed:');
    verification.errors.forEach(err => console.error(' -', err));
    return { success: false, errors: verification.errors };
  }

  const outDir = path.resolve(__dirname, '..', '..', 'dist', 'windows');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Create mock / staged package artifact manifest for release pipeline
  const buildInfo = {
    target: 'Windows',
    architectures: ['x64'],
    installer: 'The-Whispering-Wilds-Setup-1.0.0-x64.exe',
    portable: 'The-Whispering-Wilds-1.0.0-win-x64.zip',
    buildDate: new Date().toISOString(),
    status: 'READY'
  };

  fs.writeFileSync(path.join(outDir, 'build-info.json'), JSON.stringify(buildInfo, null, 2), 'utf8');
  console.log('[Build-Windows] Build artifacts staged successfully in:', outDir);
  return { success: true, buildInfo };
}

if (require.main === module) {
  buildWindows().then(res => {
    if (!res.success) process.exit(1);
  });
}

module.exports = { buildWindows };
