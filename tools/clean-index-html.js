const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const indexPath = path.join(ROOT_DIR, 'index.html');
let content = fs.readFileSync(indexPath, 'utf8');

const lines = content.split(/\r?\n/);
const newLines = [];
let removedCount = 0;
const removedList = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const scriptMatch = /<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/i.exec(line);
  
  if (scriptMatch) {
    const src = scriptMatch[1];
    
    // Check if test or debug
    const isTestOrDebug = src.startsWith('tests/') || 
                          src.startsWith('js/test-') || 
                          src.includes('/test-') || 
                          src.includes('/tests/') ||
                          src.startsWith('js/debug/');
    
    // Check if file exists locally
    let exists = false;
    if (src.startsWith('http://') || src.startsWith('https://')) {
      exists = true; // external
    } else {
      const fullPath = path.join(ROOT_DIR, src);
      exists = fs.existsSync(fullPath);
    }

    if (isTestOrDebug || !exists) {
      removedCount++;
      removedList.push({ lineNum: i + 1, src, reason: isTestOrDebug ? 'TEST_OR_DEBUG' : 'FILE_DOES_NOT_EXIST' });
      // Skip this line!
      // If previous line was a comment for this test suite, we can clean it if it was purely test-related
      if (newLines.length > 0 && /<!--.*(?:Test|QA|Suite).*-->/i.test(newLines[newLines.length - 1])) {
        // Only pop if the previous line is solely a test comment
        newLines.pop();
      }
      continue;
    }
  }

  newLines.push(line);
}

// Clean up any double blank lines
const finalLines = [];
for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].trim() === '' && i > 0 && finalLines[finalLines.length - 1].trim() === '') {
    continue;
  }
  finalLines.push(newLines[i]);
}

fs.writeFileSync(indexPath, finalLines.join('\n'), 'utf8');

console.log(`Cleaned index.html: Removed ${removedCount} stale/test script references.`);

// Now perform verification audit
const updatedContent = fs.readFileSync(indexPath, 'utf8');
const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
let m;
const remainingScripts = [];
while ((m = scriptRegex.exec(updatedContent)) !== null) {
  remainingScripts.push(m[1]);
}

let staleCount = 0;
let deletedRefMap = [];
for (const s of remainingScripts) {
  if (!s.startsWith('http://') && !s.startsWith('https://')) {
    const full = path.join(ROOT_DIR, s);
    if (!fs.existsSync(full)) {
      staleCount++;
      deletedRefMap.push(s);
    }
  }
}

console.log('\n====================================================');
console.log('PHASE 2 AUDIT RESULTS:');
console.log('====================================================');
if (staleCount === 0) {
  console.log('PRODUCTION SCRIPT REFERENCES: PASS');
  console.log('STALE SCRIPT REFERENCES: 0');
  console.log('DELETED FILE REFERENCES: 0');
} else {
  console.log(`PRODUCTION SCRIPT REFERENCES: FAIL (${staleCount} remaining)`);
  console.log('Stale list:', deletedRefMap);
}
console.log('====================================================');
