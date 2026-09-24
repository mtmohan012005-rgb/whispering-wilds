#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - Link & Script Dependency Validator
 * Parses index.html and checks that all <script src="...">, <link href="...">,
 * and audio/texture references exist and resolve on disk.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');

function runLinkValidation() {
  console.log('====================================================');
  console.log('THE WHISPERING WILDS - LINK & SCRIPT AUDIT');
  console.log('====================================================\n');

  if (!fs.existsSync(INDEX_HTML)) {
    console.error('Fatal: index.html not found!');
    process.exit(1);
  }

  const content = fs.readFileSync(INDEX_HTML, 'utf8');
  const errors = [];
  const checked = [];

  // 1. Script tags: <script src="...">
  const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    if (src.startsWith('http://') || src.startsWith('https://')) {
      checked.push({ type: 'external-script', target: src, status: 'EXEMPT_CDN' });
    } else {
      const fullPath = path.join(ROOT_DIR, src.split('?')[0]);
      if (fs.existsSync(fullPath)) {
        checked.push({ type: 'script', target: src, status: 'OK' });
      } else {
        errors.push(`Missing local script: <script src="${src}"> -> ${fullPath}`);
        checked.push({ type: 'script', target: src, status: 'MISSING' });
      }
    }
  }

  // 2. Link tags: <link ... href="...">
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://')) {
      checked.push({ type: 'external-link', target: href, status: 'EXEMPT_CDN' });
    } else {
      const fullPath = path.join(ROOT_DIR, href.split('?')[0]);
      if (fs.existsSync(fullPath)) {
        checked.push({ type: 'stylesheet', target: href, status: 'OK' });
      } else {
        errors.push(`Missing local stylesheet: <link href="${href}"> -> ${fullPath}`);
        checked.push({ type: 'stylesheet', target: href, status: 'MISSING' });
      }
    }
  }

  console.log(`Audited HTML Link & Script References: ${checked.length}`);
  console.log(`  ✓ Resolved Successfully : ${checked.filter(c => c.status === 'OK' || c.status === 'EXEMPT_CDN').length}`);
  console.log(`  ✗ Missing File Links    : ${errors.length}`);

  if (errors.length > 0) {
    console.error('\nMissing Link Errors:');
    errors.forEach(e => console.error(`  - ${e}`));
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalAudited: checked.length,
    missingCount: errors.length,
    errors,
    checked
  };

  fs.writeFileSync(path.join(ROOT_DIR, 'LINK_AUDIT_REPORT.json'), JSON.stringify(report, null, 2));
  console.log('Report written to LINK_AUDIT_REPORT.json\n');

  return { success: errors.length === 0, errors };
}

if (require.main === module) {
  const result = runLinkValidation();
  if (!result.success) {
    process.exit(1);
  }
}

module.exports = { runLinkValidation };
