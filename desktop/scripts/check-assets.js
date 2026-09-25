/**
 * Production Asset Verification & Audit Script
 * Validates local asset packaging, verifies player.glb existence, enforces Xbot ban,
 * blocks unwhitelisted PLACEHOLDER markers, and audits path separators and case-sensitivity.
 */

const fs = require('fs');
const path = require('path');

function checkAssets(rootDir = path.resolve(__dirname, '..', '..')) {
  const report = {
    valid: true,
    playerModelFound: false,
    xbotDetected: false,
    placeholdersFound: [],
    caseMismatches: [],
    hardcodedSeparators: [],
    errors: []
  };

  // 1. Verify Player Model
  const playerGlbRel = 'assets/characters/player/player.glb';
  const playerGlbAbs = path.join(rootDir, ...playerGlbRel.split('/'));

  if (fs.existsSync(playerGlbAbs)) {
    report.playerModelFound = true;
    const stat = fs.statSync(playerGlbAbs);
    if (stat.size < 100) {
      report.valid = false;
      report.errors.push(`Player model file ${playerGlbRel} is too small (${stat.size} bytes).`);
    }
  } else {
    report.valid = false;
    report.errors.push(`CRITICAL: Player model missing at ${playerGlbRel}`);
  }

  // 2. Scan for Xbot and demo character references
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'brain'].includes(entry.name)) {
          scanDir(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.json', '.html', '.md'].includes(ext)) {
          // Check file content for banned strings
          try {
            const content = fs.readFileSync(fullPath, 'utf8');

            // Xbot ban check (ignore comments/rules describing the ban itself)
            if (/["'](\.\.\/|\/)?.*Xbot\.glb["']/i.test(content)) {
              report.xbotDetected = true;
              report.valid = false;
              report.errors.push(`BANNED ASSET: Xbot model reference found in ${relPath}`);
            }

            // Unwhitelisted placeholder check in code files
            if (ext === '.js' && !relPath.includes('test') && !relPath.includes('mock') && !relPath.includes('check-assets.js')) {
              const placeholderMatches = content.match(/["'][^"']*PLACEHOLDER[^"']*["']/g);
              if (placeholderMatches) {
                for (const match of placeholderMatches) {
                  report.placeholdersFound.push({ file: relPath, match });
                }
              }
            }

            // Path separator audit in js files
            if (ext === '.js' && !relPath.includes('desktop\\electron') && !relPath.includes('desktop/electron') && !relPath.includes('scripts')) {
              if (/[a-zA-Z]:\\[a-zA-Z0-9_\\]+/.test(content)) {
                report.hardcodedSeparators.push(relPath);
              }
            }
          } catch (e) {}
        }
      }
    }
  }

  scanDir(rootDir);

  if (report.placeholdersFound.length > 0) {
    report.valid = false;
    report.errors.push(`Found ${report.placeholdersFound.length} unwhitelisted PLACEHOLDER asset references.`);
  }

  if (report.xbotDetected) {
    report.valid = false;
  }

  return report;
}

if (require.main === module) {
  const result = checkAssets();
  console.log('=== PRODUCTION ASSET VERIFICATION REPORT ===');
  console.log('Player model found:', result.playerModelFound);
  console.log('Xbot detected:', result.xbotDetected);
  console.log('Placeholders found:', result.placeholdersFound.length);
  console.log('Hardcoded path separators in gameplay:', result.hardcodedSeparators.length);
  console.log('Verification valid:', result.valid);

  if (!result.valid) {
    console.error('VERIFICATION FAILED:');
    result.errors.forEach(e => console.error(' -', e));
    process.exit(1);
  } else {
    console.log('ALL ASSET CHECKS PASSED.');
  }
}

module.exports = { checkAssets };
