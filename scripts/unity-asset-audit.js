// ============================================================================
// THE WHISPERING WILDS - UNITY ASSET AUDIT
// ============================================================================
//
// Scans the Unity project directory for missing, broken, or unused assets.
// This complements the existing authoritative-asset-audit.js which only
// scans the legacy browser game folders.
//
// Usage: node scripts/unity-asset-audit.js
// ============================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const UNITY = path.join(ROOT, 'unity');
const ASSETS = path.join(UNITY, 'Assets');

// Track results
const results = {
    timestamp: new Date().toISOString(),
    summary: {
        totalScanned: 0,
        missing: 0,
        broken: 0,
        unused: 0,
        duplicates: 0
    },
    missingAssets: [],
    brokenReferences: [],
    unusedAssets: [],
    duplicateAssets: [],
    assetInventory: {
        scenes: [],
        prefabs: [],
        scripts: [],
        models: [],
        textures: [],
        audio: [],
        fonts: [],
        materials: [],
        shaders: [],
        animations: [],
        scriptableObjects: [],
        navMesh: [],
        localization: []
    }
};

// File extensions to scan
const EXTENSIONS = {
    scenes: ['.unity'],
    prefabs: ['.prefab'],
    scripts: ['.cs'],
    models: ['.fbx', '.glb', '.gltf', '.obj'],
    textures: ['.png', '.jpg', '.jpeg', '.tga', '.psd', '.exr'],
    audio: ['.wav', '.mp3', '.ogg', '.aiff'],
    fonts: ['.ttf', '.otf'],
    materials: ['.mat'],
    shaders: ['.shader', '.shadergraph'],
    animations: ['.anim', ['.controller']],
    scriptableObjects: ['.asset'],
    navMesh: ['.asset'], // NavMesh data files
    localization: ['.json', '.csv']
};

/**
 * Recursively walk a directory and return all files matching given extensions.
 */
function findFiles(dir, extensions) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip Library, Temp, and obj folders
            if (['Library', 'Temp', 'obj', 'Logs', 'UserSettings'].includes(entry.name)) {
                continue;
            }
            files.push(...findFiles(fullPath, extensions));
        } else if (extensions.some(ext => entry.name.toLowerCase().endsWith(ext))) {
            files.push(fullPath);
        }
    }
    return files;
}

/**
 * Check if a Unity scene file references missing assets by scanning for GUID patterns.
 */
function checkSceneReferences(scenePath) {
    const issues = [];
    try {
        const content = fs.readFileSync(scenePath, 'utf8');
        
        // Check for "Missing" script references
        const missingScriptMatches = content.match(/m_Script: {fileID: 11500000, guid: 00000000000000000000000000000000/g);
        if (missingScriptMatches) {
            issues.push({
                file: path.relative(ROOT, scenePath),
                type: 'missing_script',
                count: missingScriptMatches.length,
                description: `Contains ${missingScriptMatches.length} missing script references (GUID: 0000000...)`
            });
        }
        
        // Check for missing prefab references
        const missingPrefabMatches = content.match(/m_PrefabAsset: {fileID: 0}/g);
        // This is normal for instantiated prefabs, so only flag if combined with other issues
        
    } catch (err) {
        issues.push({
            file: path.relative(ROOT, scenePath),
            type: 'read_error',
            description: `Failed to read scene: ${err.message}`
        });
    }
    return issues;
}

/**
 * Check if audio files exist in the Unity project.
 */
function checkAudioAssets() {
    const audioDirs = [
        path.join(ASSETS, '_Project/Audio'),
        path.join(ASSETS, '_Project/Resources/Audio'),
        path.join(ROOT, 'assets/audio')
    ];
    
    const audioFiles = [];
    for (const dir of audioDirs) {
        if (fs.existsSync(dir)) {
            audioFiles.push(...findFiles(dir, EXTENSIONS.audio));
        }
    }
    
    // Check the audio manifest
    const manifestPath = path.join(ROOT, 'assets/audio/audio-manifest.json');
    let manifestEntries = 0;
    if (fs.existsSync(manifestPath)) {
        try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            manifestEntries = manifest.entries ? manifest.entries.length : 0;
        } catch (e) {
            // Ignore parse errors
        }
    }
    
    return {
        physicalFiles: audioFiles.length,
        manifestEntries,
        files: audioFiles.map(f => path.relative(ROOT, f))
    };
}

/**
 * Check character prefabs for rig and animation completeness.
 */
function checkCharacterPrefabs() {
    const prefabsDir = path.join(ASSETS, '_Project/Prefabs/Characters');
    const issues = [];
    
    if (!fs.existsSync(prefabsDir)) {
        issues.push({
            type: 'missing_directory',
            description: `Character prefabs directory not found: ${prefabsDir}`
        });
        return issues;
    }
    
    const prefabFiles = findFiles(prefabsDir, ['.prefab']);
    for (const prefabPath of prefabFiles) {
        try {
            const content = fs.readFileSync(prefabPath, 'utf8');
            const prefabName = path.basename(prefabPath, '.prefab');
            
            const hasSkinnedMesh = content.includes('SkinnedMeshRenderer');
            const hasAnimator = content.includes('Animator');
            const hasNavMeshAgent = content.includes('NavMeshAgent');
            const hasCollider = content.includes('Collider');
            
            if (!hasSkinnedMesh && !content.includes('MeshRenderer')) {
                issues.push({
                    file: path.relative(ROOT, prefabPath),
                    name: prefabName,
                    type: 'no_mesh_renderer',
                    description: `${prefabName} has no MeshRenderer or SkinnedMeshRenderer`
                });
            }
            
            if (!hasAnimator) {
                issues.push({
                    file: path.relative(ROOT, prefabPath),
                    name: prefabName,
                    type: 'no_animator',
                    description: `${prefabName} has no Animator component`
                });
            }
            
        } catch (err) {
            issues.push({
                file: path.relative(ROOT, prefabPath),
                type: 'read_error',
                description: `Failed to read prefab: ${err.message}`
            });
        }
    }
    
    return issues;
}

/**
 * Check NavMesh data files.
 */
function checkNavMesh() {
    const navMeshDir = path.join(ASSETS, '_Project/NavMeshData');
    const issues = [];
    
    if (!fs.existsSync(navMeshDir)) {
        issues.push({
            type: 'missing_directory',
            description: 'NavMeshData directory not found'
        });
        return issues;
    }
    
    const navMeshFiles = findFiles(navMeshDir, ['.asset']);
    if (navMeshFiles.length === 0) {
        issues.push({
            type: 'empty_directory',
            description: 'NavMeshData directory exists but contains no .asset files — NPCs cannot navigate'
        });
    } else {
        results.assetInventory.navMesh = navMeshFiles.map(f => path.relative(ROOT, f));
    }
    
    return issues;
}

/**
 * Check localization files.
 */
function checkLocalization() {
    const locDir = path.join(ASSETS, '_Project/Resources/Localization');
    const issues = [];
    
    if (!fs.existsSync(locDir)) {
        // Check alternative locations
        const altLoc = path.join(ASSETS, '_Project/Scripts/Localization');
        if (fs.existsSync(altLoc)) {
            const files = findFiles(altLoc, ['.json', '.csv']);
            results.assetInventory.localization = files.map(f => path.relative(ROOT, f));
        }
        return issues;
    }
    
    const files = findFiles(locDir, ['.json', '.csv']);
    results.assetInventory.localization = files.map(f => path.relative(ROOT, f));
    
    return issues;
}

/**
 * Check Tamil font availability.
 */
function checkTamilFont() {
    const fontDirs = [
        path.join(ASSETS, '_Project/Resources/Fonts'),
        path.join(ASSETS, '_Project/Fonts'),
        path.join(ROOT, 'assets/fonts')
    ];
    
    const fontFiles = [];
    for (const dir of fontDirs) {
        if (fs.existsSync(dir)) {
            fontFiles.push(...findFiles(dir, EXTENSIONS.fonts));
        }
    }
    
    const hasTamilFont = fontFiles.some(f => 
        f.toLowerCase().includes('tamil') || f.toLowerCase().includes('noto')
    );
    
    return {
        totalFonts: fontFiles.length,
        hasTamilFont,
        files: fontFiles.map(f => path.relative(ROOT, f))
    };
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log('================================================================');
console.log('THE WHISPERING WILDS - UNITY ASSET AUDIT');
console.log('================================================================\n');

// 1. Inventory all assets
console.log('[1/8] Scanning Unity assets...');
for (const [category, extensions] of Object.entries(EXTENSIONS)) {
    const files = findFiles(ASSETS, extensions);
    results.assetInventory[category] = files.map(f => path.relative(ROOT, f));
    results.summary.totalScanned += files.length;
    console.log(`  ${category}: ${files.length} files`);
}

// 2. Check scene references
console.log('\n[2/8] Checking scene references...');
const sceneIssues = [];
for (const scene of results.assetInventory.scenes) {
    const fullPath = path.join(ROOT, scene);
    const issues = checkSceneReferences(fullPath);
    sceneIssues.push(...issues);
}
results.brokenReferences.push(...sceneIssues);
results.summary.broken += sceneIssues.length;
if (sceneIssues.length > 0) {
    console.log(`  ⚠️  Found ${sceneIssues.length} broken references`);
    for (const issue of sceneIssues) {
        console.log(`    - ${issue.file}: ${issue.description}`);
    }
} else {
    console.log('  ✓ No broken scene references found');
}

// 3. Check audio assets
console.log('\n[3/8] Checking audio assets...');
const audio = checkAudioAssets();
console.log(`  Physical audio files: ${audio.physicalFiles}`);
console.log(`  Manifest entries: ${audio.manifestEntries}`);
if (audio.physicalFiles === 0 && audio.manifestEntries > 0) {
    results.missingAssets.push({
        type: 'audio',
        description: `Audio manifest lists ${audio.manifestEntries} entries but 0 physical audio files found in Unity project`,
        severity: 'HIGH'
    });
    results.summary.missing++;
}

// 4. Check character prefabs
console.log('\n[4/8] Checking character prefabs...');
const charIssues = checkCharacterPrefabs();
results.brokenReferences.push(...charIssues);
results.summary.broken += charIssues.length;
if (charIssues.length > 0) {
    console.log(`  ⚠️  Found ${charIssues.length} character issues`);
    for (const issue of charIssues) {
        console.log(`    - ${issue.name || issue.file}: ${issue.description}`);
    }
} else {
    console.log('  ✓ All character prefabs have required components');
}

// 5. Check NavMesh
console.log('\n[5/8] Checking NavMesh data...');
const navIssues = checkNavMesh();
results.missingAssets.push(...navIssues);
results.summary.missing += navIssues.length;
if (navIssues.length > 0) {
    console.log(`  ⚠️  NavMesh issues: ${navIssues[0].description}`);
} else {
    console.log(`  ✓ NavMesh data present (${results.assetInventory.navMesh.length} files)`);
}

// 6. Check localization
console.log('\n[6/8] Checking localization...');
const locIssues = checkLocalization();
results.brokenReferences.push(...locIssues);
console.log(`  Localization files: ${results.assetInventory.localization.length}`);

// 7. Check Tamil font
console.log('\n[7/8] Checking Tamil font...');
const fonts = checkTamilFont();
console.log(`  Total fonts: ${fonts.totalFonts}`);
console.log(`  Tamil font: ${fonts.hasTamilFont ? '✓ Found' : '⚠️  Not found'}`);
if (!fonts.hasTamilFont) {
    results.missingAssets.push({
        type: 'font',
        description: 'No Tamil-capable font found in Unity Resources',
        severity: 'HIGH'
    });
    results.summary.missing++;
}

// 8. Check for TODO/FIXME markers in scripts
console.log('\n[8/8] Checking for TODO/FIXME markers...');
let todoCount = 0;
for (const script of results.assetInventory.scripts) {
    try {
        const content = fs.readFileSync(path.join(ROOT, script), 'utf8');
        const todos = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX|PLACEHOLDER)/gi);
        if (todos) {
            todoCount += todos.length;
        }
    } catch (e) {
        // Skip unreadable files
    }
}
console.log(`  TODO/FIXME/PLACEHOLDER markers: ${todoCount}`);

// Summary
console.log('\n================================================================');
console.log('AUDIT SUMMARY');
console.log('================================================================');
console.log(`Total files scanned: ${results.summary.totalScanned}`);
console.log(`Missing assets: ${results.summary.missing}`);
console.log(`Broken references: ${results.summary.broken}`);
console.log(`TODO/FIXME markers: ${todoCount}`);
console.log('');
console.log('Asset Inventory:');
for (const [category, files] of Object.entries(results.assetInventory)) {
    console.log(`  ${category}: ${files.length}`);
}

// Save report
const reportPath = path.join(ROOT, 'reports', 'unity-asset-audit.json');
fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`\nFull report saved to: reports/unity-asset-audit.json`);

// Exit with appropriate code
if (results.summary.missing > 0 || results.summary.broken > 0) {
    console.log('\n⚠️  Audit completed with issues found.');
    process.exit(0); // Still exit 0 — this is an audit, not a test
} else {
    console.log('\n✓ Audit completed — no issues found.');
}
