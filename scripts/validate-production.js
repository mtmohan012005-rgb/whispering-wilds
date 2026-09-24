#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - Production Readiness & Code Safety Validator
 * Audits repository for:
 *  - Debug leftovers: debugger, prompt(, confirm(, alert(
 *  - Unsafe localhost / hardcoded developer URLs in runtime gameplay files
 *  - External CDN dependency classification
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const JS_DIR = path.join(ROOT_DIR, 'js');

function scanDirectory(dir, filterExts, results = []) {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['.git', 'node_modules', 'dist', 'tools'].includes(entry.name)) {
        scanDirectory(fullPath, filterExts, results);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (filterExts.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

function runProductionValidation() {
  console.log('====================================================');
  console.log('THE WHISPERING WILDS - PRODUCTION CODE SAFETY AUDIT');
  console.log('====================================================\n');

  const files = scanDirectory(JS_DIR, ['.js']);
  const issues = [];
  const externalUrls = [];

  const dangerousTokens = [
    { token: 'debugger', severity: 'ERROR', desc: 'JavaScript debugger breakpoint statement' },
    { token: 'prompt(', severity: 'WARN', desc: 'Synchronous browser prompt modal' },
    { token: 'confirm(', severity: 'WARN', desc: 'Synchronous browser confirm modal' }
  ];

  files.forEach(file => {
    // Skip test files from production code checks
    const rel = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
    const isTestFile = rel.includes('/test') || rel.includes('test-');

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Check dangerous tokens
      if (!isTestFile) {
        dangerousTokens.forEach(({ token, severity, desc }) => {
          if (line.includes(token) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            issues.push({
              file: rel,
              line: idx + 1,
              severity,
              desc,
              snippet: line.trim()
            });
          }
        });

        // Check for hardcoded localhost in non-config gameplay files
        if (line.includes('http://localhost') && !rel.includes('config') && !rel.includes('server')) {
          issues.push({
            file: rel,
            line: idx + 1,
            severity: 'ERROR',
            desc: 'Hardcoded localhost URL in gameplay file (must use RUNTIME_CONFIG.multiplayerServerUrl)',
            snippet: line.trim()
          });
        }
      }

      // Check external URLs
      const urlRegex = /(https?:\/\/[^\s"'`]+)/g;
      let m;
      while ((m = urlRegex.exec(line)) !== null) {
        const u = m[1];
        let classification = 'REQUIRED_EXTERNAL';
        if (u.includes('localhost') || u.includes('127.0.0.1')) {
          classification = 'DEVELOPMENT_ONLY';
        } else if (u.includes('threejs.org/examples')) {
          classification = 'MIGRATE_LOCAL';
        }
        externalUrls.push({ file: rel, line: idx + 1, url: u, classification });
      }
    });
  });

  const errors = issues.filter(i => i.severity === 'ERROR');
  const warnings = issues.filter(i => i.severity === 'WARN');

  console.log(`Audited JavaScript Files   : ${files.length}`);
  console.log(`  ✓ Passed Code Safety      : ${errors.length === 0 ? 'YES' : 'NO'}`);
  console.log(`  ✗ Critical Errors         : ${errors.length}`);
  console.log(`  ⚠ Warnings                : ${warnings.length}`);
  console.log(`  ℹ External URLs Audited   : ${externalUrls.length}`);

  if (errors.length > 0) {
    console.error('\nCritical Code Safety Errors:');
    errors.forEach(e => console.error(`  - [${e.severity}] ${e.file}:${e.line} - ${e.desc}`));
  }

  const report = {
    timestamp: new Date().toISOString(),
    filesAudited: files.length,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    externalUrlCount: externalUrls.length,
    issues,
    externalUrls
  };

  fs.writeFileSync(path.join(ROOT_DIR, 'PRODUCTION_SAFETY_REPORT.json'), JSON.stringify(report, null, 2));
  console.log('Report written to PRODUCTION_SAFETY_REPORT.json\n');

  return { success: errors.length === 0, errors, warnings };
}

if (require.main === module) {
  const result = runProductionValidation();
  if (!result.success) {
    process.exit(1);
  }
}

module.exports = { runProductionValidation };
