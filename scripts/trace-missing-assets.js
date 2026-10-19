const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const codeExts = new Set(['.js', '.html', '.css', '.json']);
const skipDirs = new Set(['.git', 'node_modules', 'dist']);
const EXTENSIONS = new Set([
  '.glb', '.gltf', '.webp', '.png', '.jpg', '.jpeg',
  '.ogg', '.mp3', '.wav', '.json'
]);

const rep = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'ASSET_AUDIT_REPORT.json'), 'utf8'));
const missingSet = new Set(rep.missing);
const origins = {};
const refToOrigins = {};

for (const m of rep.missing) {
  refToOrigins[m] = new Set();
}

function scan(currentDir) {
  if (!fs.existsSync(currentDir)) return;
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        scan(path.join(currentDir, entry.name));
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (codeExts.has(ext)) {
        const filePath = path.join(currentDir, entry.name);
        const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
        // If this file is an audit report or build report, skip it
        if (relPath.startsWith('docs/audits/') || relPath.includes('AUDIT_REPORT') || relPath.includes('BUILD_REPORT')) {
          continue;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const regex = /(?:assets\/[a-zA-Z0-9_\-\.\/]+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          const ref = match[0].replace(/['"`]/g, '').trim();
          const fileExt = path.extname(ref).toLowerCase();
          if (EXTENSIONS.has(fileExt) && missingSet.has(ref)) {
            if (!origins[relPath]) origins[relPath] = new Set();
            origins[relPath].add(ref);
            refToOrigins[ref].add(relPath);
          }
        }
      }
    }
  }
}

scan(ROOT_DIR);

console.log('=== ORIGIN FILES SCANNED BY VALIDATE-ASSETS ===');
for (const [f, refs] of Object.entries(origins)) {
  console.log(`${f}: ${refs.size} missing references`);
}

// Check if any missing reference had NO non-report origin
const unmapped = [];
for (const [ref, files] of Object.entries(refToOrigins)) {
  if (files.size === 0) unmapped.push(ref);
}
console.log(`\nUnmapped references (originated only from old reports or other files): ${unmapped.length}`);
if (unmapped.length > 0) {
  console.log('Sample unmapped:', unmapped.slice(0, 10));
}
