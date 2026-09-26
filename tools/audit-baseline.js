const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Files existence check
const filesToCheck = [
  'index.html',
  'package.json',
  'package-lock.json',
  'render.yaml',
  'server/server.js',
  'server/config.js',
  'js/data/world-data.js',
  'js/data/world-region-data.js',
  'js/data/world-cell-data.js',
  'js/data/world-asset-registry.js',
  'js/engine/three-terrain.js',
  'js/engine/three-world.js',
  'js/engine/three-player.js',
  'js/engine/character-loader.js',
  'js/engine/production-world-assets.js',
  'js/engine/production-assets.js',
  'js/engine/material-system.js',
  'js/engine/render-quality.js',
  'js/engine/three-lighting.js',
  'js/engine/three-weather.js',
  'js/engine/water-renderer.js'
];

const fileStatus = {};
for (const f of filesToCheck) {
  fileStatus[f] = fs.existsSync(path.join(ROOT_DIR, f));
}

// 2. Physical GLB files
function getFilesRecursive(dir, ext) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'node_modules' && item.name !== '.git') {
        results = results.concat(getFilesRecursive(fullPath, ext));
      }
    } else {
      if (item.name.toLowerCase().endsWith(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const physicalGLBs = getFilesRecursive(path.join(ROOT_DIR, 'assets'), '.glb')
  .map(p => path.relative(ROOT_DIR, p).replace(/\\/g, '/'));

// Check GLB file sizes & validity
const glbDetails = {};
for (const glb of physicalGLBs) {
  const stat = fs.statSync(path.join(ROOT_DIR, glb));
  glbDetails[glb] = {
    sizeBytes: stat.size,
    isStub: stat.size < 1024
  };
}

// 3. Scan code for referenced GLBs
const allCodeFiles = getFilesRecursive(ROOT_DIR, '.js')
  .concat(getFilesRecursive(ROOT_DIR, '.html'))
  .concat(getFilesRecursive(ROOT_DIR, '.json'));

const referencedGLBs = new Set();
const glbRegex = /[a-zA-Z0-9_\-\.\/]+\.glb/gi;
for (const cf of allCodeFiles) {
  if (cf.includes('node_modules') || cf.includes('.git') || cf.includes('audit-baseline.js')) continue;
  try {
    const content = fs.readFileSync(cf, 'utf8');
    let m;
    while ((m = glbRegex.exec(content)) !== null) {
      let ref = m[0].replace(/['"`]/g, '').trim();
      if (!ref.startsWith('http')) {
        // Normalize
        ref = ref.replace(/^\.\//, '').replace(/^\//, '');
        referencedGLBs.add(ref);
      }
    }
  } catch (err) {}
}

const missingGLBs = [];
for (const ref of referencedGLBs) {
  const full = path.join(ROOT_DIR, ref);
  if (!fs.existsSync(full)) {
    missingGLBs.push(ref);
  }
}

// 4. Index.html Script References Audit
const indexHtmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
const linkRegex = /<link\s+[^>]*href=["']([^"']+)["']/gi;

let sm;
const indexScripts = [];
while ((sm = scriptRegex.exec(indexHtmlContent)) !== null) {
  indexScripts.push(sm[1]);
}

let lm;
const indexLinks = [];
while ((lm = linkRegex.exec(indexHtmlContent)) !== null) {
  indexLinks.push(lm[1]);
}

const staleScripts = [];
const externalScripts = [];
const validLocalScripts = [];

for (const s of indexScripts) {
  if (s.startsWith('http://') || s.startsWith('https://')) {
    externalScripts.push(s);
  } else {
    const full = path.join(ROOT_DIR, s);
    if (!fs.existsSync(full)) {
      staleScripts.push(s);
    } else {
      validLocalScripts.push(s);
    }
  }
}

const staleLinks = [];
for (const l of indexLinks) {
  if (!l.startsWith('http://') && !l.startsWith('https://')) {
    const full = path.join(ROOT_DIR, l);
    if (!fs.existsSync(full)) {
      staleLinks.push(l);
    }
  }
}

// 5. Package.json scripts audit
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
const missingPackageScriptTargets = [];
for (const [scriptName, cmd] of Object.entries(pkg.scripts || {})) {
  // Check if command references a file like 'node path/to/file.js'
  const match = /node\s+([a-zA-Z0-9_\-\.\/]+\.js)/.exec(cmd);
  if (match) {
    const targetFile = match[1];
    if (!fs.existsSync(path.join(ROOT_DIR, targetFile))) {
      missingPackageScriptTargets.push({ scriptName, command: cmd, targetFile });
    }
  }
}

// 6. External runtime URLs in JS files
const externalRuntimeUrls = [];
const jsFiles = getFilesRecursive(path.join(ROOT_DIR, 'js'), '.js');
for (const jf of jsFiles) {
  const content = fs.readFileSync(jf, 'utf8');
  const urlRegex = /(https?:\/\/[^\s"'`]+)/g;
  let um;
  while ((um = urlRegex.exec(content)) !== null) {
    const u = um[1];
    externalRuntimeUrls.push({
      file: path.relative(ROOT_DIR, jf).replace(/\\/g, '/'),
      url: u
    });
  }
}

// 7. Check player model status
const playerGLBPath = path.join(ROOT_DIR, 'assets/characters/player/player.glb');
const playerGLBExists = fs.existsSync(playerGLBPath);
const playerGLBSize = playerGLBExists ? fs.statSync(playerGLBPath).size : 0;
const isPlayerModelValid = playerGLBExists && playerGLBSize > 5000;

// 8. Regional environment assets check
const regions = ['chennai', 'cauvery_delta', 'pichavaram', 'chettinad', 'mamallapuram', 'nilgiris'];
const regionalAssetCounts = {};
for (const r of regions) {
  const dir = path.join(ROOT_DIR, 'assets/environment', r);
  const glbs = getFilesRecursive(dir, '.glb');
  regionalAssetCounts[r] = glbs.length;
}

// 9. Textures count
const textureExts = ['.png', '.jpg', '.jpeg', '.webp'];
let textureFiles = [];
for (const ext of textureExts) {
  textureFiles = textureFiles.concat(getFilesRecursive(path.join(ROOT_DIR, 'assets'), ext));
}

// 10. Check asset manifest
const hasAssetManifest = fs.existsSync(path.join(ROOT_DIR, 'assets/manifest.json'));

const baselineReport = {
  timestamp: new Date().toISOString(),
  filesAudited: fileStatus,
  glbs: {
    physicalCount: physicalGLBs.length,
    physicalFiles: physicalGLBs,
    details: glbDetails,
    referencedCount: referencedGLBs.size,
    referencedFiles: Array.from(referencedGLBs),
    missingCount: missingGLBs.length,
    missingFiles: missingGLBs
  },
  playerModel: {
    exists: playerGLBExists,
    sizeBytes: playerGLBSize,
    isValidProductionGLB: isPlayerModelValid
  },
  regionalAssets: regionalAssetCounts,
  texturesCount: textureFiles.length,
  indexHtml: {
    totalScripts: indexScripts.length,
    externalScriptsCount: externalScripts.length,
    externalScripts,
    validLocalScriptsCount: validLocalScripts.length,
    staleScriptsCount: staleScripts.length,
    staleScripts,
    staleLinksCount: staleLinks.length,
    staleLinks
  },
  packageJson: {
    missingScriptTargets: missingPackageScriptTargets,
    missingLockfile: !fs.existsSync(path.join(ROOT_DIR, 'package-lock.json')),
    hasVerifyGame: !!(pkg.scripts && pkg.scripts['verify-game']),
    hasVerifyAssets: !!(pkg.scripts && pkg.scripts['verify-assets']),
    hasVerifyProduction: !!(pkg.scripts && pkg.scripts['verify-production'])
  },
  hasAssetManifest,
  externalRuntimeUrlsCount: externalRuntimeUrls.length,
  externalRuntimeUrls: externalRuntimeUrls.slice(0, 50)
};

fs.mkdirSync(path.join(ROOT_DIR, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT_DIR, 'reports/current-production-baseline.json'), JSON.stringify(baselineReport, null, 2));

console.log('Baseline report generated at reports/current-production-baseline.json');
console.log('Summary:', {
  physicalGLBs: physicalGLBs.length,
  playerValid: isPlayerModelValid,
  staleScripts: staleScripts.length,
  missingPackageScripts: missingPackageScriptTargets.length,
  hasLockfile: fs.existsSync(path.join(ROOT_DIR, 'package-lock.json')),
  hasManifest: hasAssetManifest
});
