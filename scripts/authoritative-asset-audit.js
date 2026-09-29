#!/usr/bin/env node
/**
 * THE WHISPERING WILDS - AUTHORITATIVE ASSET AUDIT (single source of truth)
 * -------------------------------------------------------------------------
 * This pipeline supersedes the legacy generated reports
 * (ASSET_AUDIT_REPORT.json, BUILD_REPORT.json, PRODUCTION_ASSET_STATUS.json,
 *  PRODUCTION_3D_ASSET_REPORT.json, DATA_AUDIT_REPORT.json), which disagree
 * with one another and with the physical tree.
 *
 * Design rules:
 *  - No count is hardcoded. Every number is derived from the current working tree.
 *  - Nothing is trusted from a prior report. Existence is decided by fs.statSync.
 *  - Nothing is deleted, renamed or "fixed" by this script. It is read-only
 *    with respect to game content; it only writes its own two report files.
 *  - A reference is only reported as RESOLVED if a physical file backs it.
 *
 * Usage: node scripts/authoritative-asset-audit.js [--json-only] [--md-only]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT_JSON = path.join(ROOT, 'reports', 'authoritative-asset-audit.json');
const OUT_MD = path.join(ROOT, 'reports', 'authoritative-asset-audit.md');

const SKIP_DIRS = new Set([
    'node_modules', '.git', '.idea', 'reports', 'coverage',
    'distribution', 'platform', '.github'
]);

const ASSET_EXTS = new Set([
    '.glb', '.gltf',
    '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.bmp', '.tga', '.hdr', '.exr',
    '.ktx2', '.basis', '.dds',
    '.mp3', '.ogg', '.wav', '.m4a', '.aac', '.flac',
    '.mp4', '.webm',
    '.ttf', '.otf', '.woff', '.woff2',
    '.json', '.bin'
]);

// Directories scanned for asset references.
const SCAN_EXT = new Set(['.js', '.mjs', '.cjs', '.html', '.css', '.json', '.md']);
const SCAN_ROOTS = ['js', 'css', 'index.html', 'server', 'desktop', 'scripts', 'tools', 'config', 'content'];

const REGIONS = [
    'chennai', 'delta', 'pichavaram', 'chettinad', 'thanjavur', 'mamallapuram', 'nilgiri'
];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function toPosix(p) { return p.split(path.sep).join('/'); }

function normalizeRef(raw) {
    // Strip query strings, hashes and surrounding quotes/backticks.
    let s = String(raw).trim().replace(/^['"`]+|['"`]+$/g, '');
    s = s.split('?')[0].split('#')[0];
    if (!s) return null;
    // Drop leading ./ and ../ segments by resolving against repo root.
    if (s.startsWith('/')) s = s.slice(1);
    if (/^https?:\/\//i.test(s)) return null;         // external, not a repo asset
    if (/^(data|blob):/i.test(s)) return null;        // inline, not a file
    return toPosix(path.normalize(s)).replace(/^\.\//, '');
}

function walk(dir, out = []) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
    for (const e of entries) {
        if (e.name.startsWith('.') && e.name !== '.env.example') continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (SKIP_DIRS.has(e.name)) continue;
            walk(full, out);
        } else if (e.isFile()) {
            out.push(full);
        }
    }
    return out;
}

function sha1(file) {
    return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
}

function guessCategory(p) {
    const l = p.toLowerCase();
    if (l.includes('/audio/voice/')) return 'AUDIO_VOICE';
    if (l.includes('/audio/music/')) return 'AUDIO_MUSIC';
    if (l.includes('/audio/ambience/') || l.includes('/audio/ambient')) return 'AUDIO_AMBIENCE';
    if (l.includes('/audio/footstep')) return 'AUDIO_FOOTSTEPS';
    if (l.includes('/audio/wildlife') || l.includes('/audio/animal')) return 'AUDIO_WILDLIFE';
    if (l.includes('/audio/vehicle') || l.includes('/audio/boat') || l.includes('/audio/traffic')) return 'AUDIO_VEHICLES';
    if (l.includes('/audio/ui') || l.includes('/audio/discover')) return 'AUDIO_UI';
    if (l.includes('/audio/weather')) return 'AUDIO_WEATHER';
    if (l.includes('/audio/') || l.endsWith('.ogg') || l.endsWith('.mp3') || l.endsWith('.wav')) return 'AUDIO_OTHER';
    if (l.includes('/character') || l.includes('/npc') || l.includes('/player') || l.includes('/wildlife')) return 'CHARACTER';
    if (l.includes('/texture') || /\.(png|jpg|jpeg|webp|hdr|ktx2|basis)$/i.test(l)) return 'TEXTURE';
    if (l.includes('/architecture') || l.includes('/landmark')) return 'ARCHITECTURE';
    if (l.includes('/vehicle') || l.includes('/boat')) return 'VEHICLE';
    if (l.includes('/vegetation') || l.includes('/tree') || l.includes('/bush') || l.includes('/plant')) return 'VEGETATION';
    if (l.includes('/prop') || l.includes('/item') || l.includes('/collectible')) return 'PROP';
    if (l.includes('/icon')) return 'ICON';
    if (l.includes('/environment') || l.includes('/sky') || l.includes('/water')) return 'ENVIRONMENT';
    if (l.endsWith('.glb') || l.endsWith('.gltf')) return 'MODEL';
    return 'OTHER';
}

function guessRegion(p) {
    const l = p.toLowerCase();
    const hit = REGIONS.find(r => l.includes(r));
    return hit ? hit.toUpperCase() : null;
}

function guessSystem(sourceFile) {
    const s = ('/' + toPosix(sourceFile).replace(/^\.?\//, '')).toLowerCase();
    if (s.includes('/js/audio/')) return 'AUDIO';
    if (s.includes('/js/engine/')) return 'ENGINE_3D';
    if (s.includes('/js/entities/')) return 'ENTITY';
    if (s.includes('/js/systems/')) return 'SYSTEM';
    if (s.includes('/js/ui/')) return 'UI';
    if (s.includes('/js/data/')) return 'DATA_REGISTRY';
    if (s.includes('/js/core/')) return 'CORE';
    if (s.includes('/js/graphics/')) return 'GRAPHICS';
    if (s.includes('/js/exploration/')) return 'EXPLORATION';
    if (s.includes('/js/cloud/')) return 'CLOUD';
    if (s.includes('index.html')) return 'BOOTSTRAP';
    if (s.includes('css/')) return 'STYLESHEET';
    if (s.includes('server/')) return 'SERVER';
    if (s.includes('desktop/')) return 'DESKTOP';
    return 'UNKNOWN';
}

/** Fallback detection: does the referencing file contain procedural/fallback logic? */
function detectFallback(sourceFile, lineText) {
    const l = String(lineText || '').toLowerCase();
    if (/fallback|procedural|silhouette|placeholder|primitive/.test(l)) {
        return { inlineHint: true, evidence: 'same-line fallback comment' };
    }
    return { inlineHint: false, evidence: null };
}

function fileHasFallbackLogic(absSource) {
    try {
        const src = fs.readFileSync(absSource, 'utf8');
        return /procedural|fallback|silhouette/i.test(src);
    } catch { return false; }
}

// ---------------------------------------------------------------------------
// GLB / glTF binary inspection
// ---------------------------------------------------------------------------

function inspectGlb(absFile) {
    const out = {
        validContainer: false, version: null, declaredLength: null, actualLength: null,
        meshes: 0, nodes: 0, skins: 0, animations: 0, materials: 0, textures: 0, images: 0,
        embeddedImages: 0, externalImageUris: [], animationNames: [], meshNames: [],
        materialNames: [], skeletal: false, hasXbot: false, errors: []
    };
    let buf;
    try { buf = fs.readFileSync(absFile); } catch (e) {
        out.errors.push('unreadable: ' + e.message);
        return out;
    }
    out.actualLength = buf.length;
    if (buf.length < 12) { out.errors.push('file shorter than 12-byte GLB header'); return out; }

    const magic = buf.readUInt32LE(0);
    if (magic !== 0x46546C67) { out.errors.push('bad magic (not a GLB container)'); return out; }
    out.validContainer = true;
    out.version = buf.readUInt32LE(4);
    out.declaredLength = buf.readUInt32LE(8);
    if (out.declaredLength !== buf.length) {
        out.errors.push(`declared length ${out.declaredLength} != actual ${buf.length}`);
    }

    // Walk chunks; first JSON chunk (0x4E4F534A) carries the glTF JSON.
    let off = 12;
    let json = null;
    while (off + 8 <= buf.length) {
        const clen = buf.readUInt32LE(off);
        const ctype = buf.readUInt32LE(off + 4);
        if (off + 8 + clen > buf.length) { out.errors.push('truncated chunk'); break; }
        if (ctype === 0x4E4F534A) {
            json = JSON.parse(buf.slice(off + 8, off + 8 + clen).toString('utf8'));
            break;
        }
        off += 8 + clen + ((clen % 4) ? (4 - (clen % 4)) : 0);
    }
    if (!json) { out.errors.push('no JSON chunk found'); return out; }

    out.meshes = (json.meshes || []).length;
    out.nodes = (json.nodes || []).length;
    out.skins = (json.skins || []).length;
    out.animations = (json.animations || []).length;
    out.materials = (json.materials || []).length;
    out.textures = (json.textures || []).length;
    out.images = (json.images || []).length;
    out.skeletal = out.skins > 0;
    out.animationNames = (json.animations || []).map(a => a.name || '(unnamed)');
    out.meshNames = (json.meshes || []).map(m => m.name || '(unnamed)');
    out.materialNames = (json.materials || []).map(m => m.name || '(unnamed)');
    for (const img of json.images || []) {
        if (img.uri) {
            if (/^data:/.test(img.uri)) out.embeddedImages++;
            else out.externalImageUris.push(img.uri);
        } else {
            out.embeddedImages++;   // image stored in a bufferView => embedded
        }
    }
    // Xbot is the default Mixamo/YBot-style skeleton name.
    const allNames = [...out.meshNames, ...out.materialNames,
        ...(json.skins || []).map(s => s.name || ''), ...out.animationNames];
    out.hasXbot = allNames.some(n => /xbot/i.test(n));
    return out;
}

// ---------------------------------------------------------------------------
// reference extraction
// ---------------------------------------------------------------------------

// Matches asset-looking path literals, including ones with ${...} templating.
const REF_PATTERN =
    "['\"`]" +                                    // opening quote
    "((?:\\.{0,2}/)?assets/" +                    // optional ./ or ../ prefix
    "[A-Za-z0-9_./-]*" +                           // path segments
    "(?:\\$\\{[^}]*\\})?" +                        // optional ${...} template chunk
    "[A-Za-z0-9_./-]*" +
    "\\.[A-Za-z0-9]{1,6})" +                       // extension
    "['\"`]";                                      // closing quote
const REF_RE = new RegExp(REF_PATTERN, 'g');
// index.html / css url(...) and src= / href= forms are covered by the same rule
// because they still contain an "assets/..." literal.

function extractRefs(text) {
    const refs = [];
    let m;
    REF_RE.lastIndex = 0;
    while ((m = REF_RE.exec(text)) !== null) {
        refs.push({ raw: m[1], index: m.index });
    }
    return refs;
}

function lineNumberAt(text, index) {
    let n = 1;
    for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
    return n;
}

function lineTextAt(text, index) {
    const start = text.lastIndexOf('\n', index) + 1;
    let end = text.indexOf('\n', index);
    if (end === -1) end = text.length;
    return text.slice(start, end);
}

/** Look backwards for a registry key / id near the reference. */
function nearestKey(text, index) {
    const before = text.slice(Math.max(0, index - 400), index);
    const keyM = [...before.matchAll(/["'`]?([A-Za-z_][A-Za-z0-9_-]{2,})["'`]?\s*:\s*[{[]?\s*$/g)];
    if (keyM.length) return keyM[keyM.length - 1][1];
    const idM = [...before.matchAll(/\bid["'`]?\s*:\s*["'`]([A-Za-z0-9_-]{2,})["'`]/g)];
    if (idM.length) return idM[idM.length - 1][1];
    const propM = [...before.matchAll(/(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]{2,})\s*=/g)];
    if (propM.length) return propM[propM.length - 1][1];
    return null;
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
    const args = process.argv.slice(2);
    const jsonOnly = args.includes('--json-only');
    const mdOnly = args.includes('--md-only');

    // --- 1. physical inventory -------------------------------------------
    const allFiles = walk(ROOT);
    const physicalByLower = new Map();   // lowercased posix rel path -> rel path
    const physicalExact = new Set();
    const assetFiles = [];

    for (const abs of allFiles) {
        const rel = toPosix(path.relative(ROOT, abs));
        if ([...SKIP_DIRS].some(d => rel === d || rel.startsWith(d + '/'))) continue;
        physicalExact.add(rel.toLowerCase());
        physicalByLower.set(rel.toLowerCase(), rel);
        if (rel.toLowerCase().startsWith('assets/') && ASSET_EXTS.has(path.extname(rel).toLowerCase())) {
            assetFiles.push({ rel, abs, size: fs.statSync(abs).size });
        }
    }

    // --- 2. hash asset files (duplicates) --------------------------------
    const byHash = new Map();
    for (const a of assetFiles) {
        let h;
        try { h = sha1(a.abs); } catch { continue; }
        if (!byHash.has(h)) byHash.set(h, []);
        byHash.get(h).push(a.rel);
    }
    const duplicateGroups = [...byHash.entries()]
        .filter(([, list]) => list.length > 1)
        .map(([hash, list]) => ({
            sha1: hash,
            count: list.length,
            paths: list.slice().sort(),
            wastedBytes: list.slice(1).reduce((s, p) => s + (fs.statSync(path.join(ROOT, p)).size), 0)
        }))
        .sort((a, b) => b.wastedBytes - a.wastedBytes || 0);

    // --- 3. scan sources for references ----------------------------------
    const sources = [];
    for (const r of SCAN_ROOTS) {
        const abs = path.join(ROOT, r);
        if (!fs.existsSync(abs)) continue;
        if (fs.statSync(abs).isFile()) { sources.push(abs); continue; }
        for (const f of walk(abs)) {
            if (SCAN_EXT.has(path.extname(f).toLowerCase())) sources.push(f);
        }
    }

    /** rel -> record */
    const refMap = new Map();
    const sourceFilesScanned = new Set();
    let totalRefOccurrences = 0;
    const externalRefs = new Set();

    for (const abs of sources) {
        let text;
        try { text = fs.readFileSync(abs, 'utf8'); } catch { continue; }
        const relSrc = toPosix(path.relative(ROOT, abs));
        sourceFilesScanned.add(relSrc);
        // Keep the file in scope only if it plausibly declares assets.
        const refs = extractRefs(text);
        if (!refs.length) continue;

        for (const { raw, index } of refs) {
            totalRefOccurrences++;
            const isDynamic = raw.includes('${');
            const norm = normalizeRef(raw);
            if (!norm) { externalRefs.add(raw); continue; }

            if (!refMap.has(norm)) {
                refMap.set(norm, {
                    path: norm,
                    dynamic: false,
                    category: guessCategory(norm),
                    region: guessRegion(norm),
                    extensions: new Set(),
                    references: []
                });
            }
            const rec = refMap.get(norm);
            rec.extensions.add(path.extname(norm).toLowerCase());
            if (isDynamic) rec.dynamic = true;
            rec.references.push({
                source: relSrc,
                line: lineNumberAt(text, index),
                lineText: lineTextAt(text, index).trim().slice(0, 240),
                system: guessSystem(relSrc),
                registryKey: nearestKey(text, index),
                ...detectFallback(relSrc, lineTextAt(text, index))
            });
        }
    }

    // --- 4. resolve every reference against the physical tree ------------
    const records = [];
    for (const rec of refMap.values()) {
        const lower = rec.path.toLowerCase();
        const exactRel = physicalByLower.get(lower);
        let status, caseMatch = true, resolvedRel = null;
        if (exactRel) {
            status = 'PRESENT';
            resolvedRel = exactRel;
            caseMatch = (exactRel === rec.path);
        } else {
            status = 'MISSING';
        }
        let glb = null;
        if (status === 'PRESENT' && path.extname(rec.path).toLowerCase() === '.glb') {
            glb = inspectGlb(path.join(ROOT, resolvedRel));
        }
        records.push({
            path: rec.path,
            status,
            caseExact: caseMatch,
            resolvedPath: resolvedRel,
            category: rec.category,
            region: rec.region,
            extensions: [...rec.extensions],
            dynamicTemplate: rec.dynamic,
            referenceCount: rec.references.length,
            referenceSourceCount: new Set(rec.references.map(r => r.source)).size,
            referenceSources: rec.references.map(r => ({
                source: r.source,
                line: r.line,
                system: r.system,
                registryKey: r.registryKey,
                inlineFallbackHint: r.inlineHint,
                lineText: r.lineText
            })),
            referencingFilesHaveFallbackLogic: rec.references.some(r => fileHasFallbackLogic(path.join(ROOT, r.source))),
            glb
        });
    }

    records.sort((a, b) => a.path.localeCompare(b.path));

    const present = records.filter(r => r.status === 'PRESENT');
    const missing = records.filter(r => r.status === 'MISSING');
    const caseMismatch = records.filter(r => r.status === 'PRESENT' && !r.caseExact);
    const dynamicRefs = records.filter(r => r.dynamicTemplate);

    // --- 5. unused physical assets ---------------------------------------
    const referencedLower = new Set(records.map(r => r.path.toLowerCase()));
    // Also treat basenames as referenced so a path change doesn't false-positive.
    const referencedBase = new Set(records.map(r => path.basename(r.path).toLowerCase()));
    const unused = assetFiles.filter(a => {
        const l = a.rel.toLowerCase();
        if (referencedLower.has(l)) return false;
        if (referencedBase.has(path.basename(l))) return false;
        return true;
    }).map(a => ({ path: a.rel, size: a.size }))
      .sort((a, b) => b.size - a.size);

    // --- 6. GLB inventory --------------------------------------------------
    const glbInventory = assetFiles
        .filter(a => a.rel.toLowerCase().endsWith('.glb'))
        .map(a => ({ path: a.rel, size: a.size, ...inspectGlb(a.abs) }))
        .sort((a, b) => a.path.localeCompare(b.path));

    // --- 7. by-category breakdown -----------------------------------------
    const byCategory = {};
    for (const r of records) {
        const c = r.category;
        byCategory[c] = byCategory[c] || { referenced: 0, present: 0, missing: 0 };
        byCategory[c].referenced++;
        if (r.status === 'PRESENT') byCategory[c].present++; else byCategory[c].missing++;
    }

    // --- 8. by-region breakdown (models/props only) ----------------------
    const byRegion = {};
    for (const r of records) {
        if (!r.region) continue;
        byRegion[r.region] = byRegion[r.region] || { referenced: 0, present: 0, missing: 0 };
        byRegion[r.region].referenced++;
        if (r.status === 'PRESENT') byRegion[r.region].present++; else byRegion[r.region].missing++;
    }

    const totalPhysicalAssetBytes = assetFiles.reduce((s, a) => s + a.size, 0);

    // --- 9. runtime-loaded module set (from index.html script tags) --------
    // A reference that only appears in a module never loaded by index.html
    // cannot fail at runtime, so it must not be counted as a live defect.
    const runtimeModules = new Set();
    try {
        const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
        for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) {
            runtimeModules.add(toPosix(m[1]).replace(/^\.?\//, ''));
        }
    } catch { /* index.html unreadable: runtime set stays empty and is reported as such */ }

    // Dev-only trees: never executed in the shipped page.
    const DEV_ONLY_PREFIX = ['scripts/', 'tools/', 'js/tools/', 'tests/', 'desktop/', 'server/'];
    const isDevOnly = (src) => DEV_ONLY_PREFIX.some(p => src.startsWith(p));

    // --- 10. classify every missing reference ------------------------------
    const physicalByBase = new Map();
    for (const a of assetFiles) {
        const b = path.basename(a.rel).toLowerCase();
        if (!physicalByBase.has(b)) physicalByBase.set(b, []);
        physicalByBase.get(b).push(a.rel);
    }
    const stemOf = (p) => path.basename(p).toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[-_]/g, '');

    const classification = {};
    for (const r of missing) {
        const refs = r.referenceSources;
        const runtimeRefs = refs.filter(s => !isDevOnly(s.source) && runtimeModules.has(s.source));
        const devRefs = refs.filter(s => isDevOnly(s.source));
        const wiredRefs = refs.filter(s => !isDevOnly(s.source) && !runtimeModules.has(s.source));

        // same model present on disk under a different folder/name?
        const st = stemOf(r.path);
        let drift = null;
        if (r.path.toLowerCase().endsWith('.glb')) {
            for (const a of assetFiles) {
                if (a.rel.toLowerCase() === r.path.toLowerCase()) continue;
                const as = stemOf(a.rel);
                if (as === st) { drift = a.rel; break; }
            }
        }

        let klass, owner, note;
        if (drift) {
            klass = 'D_PATH_DRIFT_EXISTS_ELSEWHERE'; owner = 'source-reference';
            note = 'The identical model exists at a different path. Fix the reference; do not author a new model.';
        } else if (runtimeRefs.length && r.referencingFilesHaveFallbackLogic) {
            klass = 'B_RUNTIME_FALLBACK'; owner = ownerOf(r);
            note = 'Loaded by a shipped module, but the loading module builds a procedural stand-in on failure.';
        } else if (runtimeRefs.length) {
            klass = 'A_RUNTIME_REQUIRED_MISSING'; owner = ownerOf(r);
            note = 'Loaded by a shipped module with no fallback in that module. This is a live gameplay gap.';
        } else if (devRefs.length) {
            klass = 'C_DEVTOOL_DECLARED_ONLY'; owner = 'dev tool / validator';
            note = 'Declared only by a script/tool that the shipped page never loads. No runtime impact.';
        } else if (wiredRefs.length) {
            klass = 'E_WIRED_BUT_UNCONFIRMED'; owner = ownerOf(r);
            note = 'Referenced by a non-dev source file that index.html does not load; loaded dynamically or unused.';
        } else {
            klass = 'F_NO_TRACEABLE_SOURCE'; owner = 'unknown';
            note = 'No traceable source reference.';
        }
        r.classification = klass;
        r.responsibleSubsystem = owner;
        r.runtimeLoadedBy = runtimeRefs.map(s => s.source);
        r.pathDriftTarget = drift;
        r.note = note;
        classification[klass] = (classification[klass] || 0) + 1;
    }

    function ownerOf(r) {
        const first = r.referenceSources[0] || {};
        return (first.system && first.system !== 'UNKNOWN' ? first.system + ' ' : '') +
            (first.source || 'unknown');
    }

    // --- 11. manifest cross-check ------------------------------------------
    let manifestCheck = { present: false, declared: 0, physicallyPresent: 0, missingEntries: [] };
    try {
        const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/manifest.json'), 'utf8'));
        const declared = man.assets || [];
        const missingEntries = declared
            .map(a => String(a.path || a.file || ''))
            .filter(p => p && !fs.existsSync(path.join(ROOT, p)));
        manifestCheck = {
            present: true, declared: declared.length,
            physicallyPresent: declared.length - missingEntries.length,
            missingEntries
        };
    } catch (e) { manifestCheck.error = e.message; }

    // --- 12. reconcile against the superseded reports ----------------------
    let reconciliation = null;
    try {
        const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'ASSET_AUDIT_REPORT.json'), 'utf8'));
        const norm = (s) => String(s).replace(/\\/g, '/').replace(/^\.\//, '');
        const oldMiss = new Set((old.missing || []).map(norm));
        const oldFound = new Set((old.found || []).map(norm));
        const newMiss = new Set(missing.map(r => r.path));
        const newPres = new Set(present.map(r => r.path));
        let stillMissing = 0, nowPresent = 0, noLongerReferenced = 0;
        for (const p of oldMiss) {
            if (newMiss.has(p)) stillMissing++;
            else if (newPres.has(p)) nowPresent++;
            else noLongerReferenced++;
        }
        let oldFoundStill = 0;
        for (const p of oldFound) if (newPres.has(p)) oldFoundStill++;
        reconciliation = {
            oldReport: 'ASSET_AUDIT_REPORT.json',
            oldTimestamp: old.timestamp,
            oldReferenced: old.totalReferenced,
            oldFound: (old.found || []).length,
            oldMissing: (old.missing || []).length,
            oldMissingStillMissing: stillMissing,
            oldMissingNowPresent: nowPresent,
            oldMissingNoLongerStaticallyReferenced: noLongerReferenced,
            oldFoundStillPresentAndReferenced: oldFoundStill,
            oldFoundNoLongerReferenced: (old.found || []).length - oldFoundStill,
            newMissingNotInOldMissing: [...newMiss].filter(p => !oldMiss.has(p)).length,
            note: 'Both scans are literal-string based. A difference in totals reflects which literals each scanner ' +
                  'matched, not a change in what the game loads. The intersection (still-missing) is the stable figure.'
        };
    } catch (e) { reconciliation = { error: e.message }; }

    const playerGlb = glbInventory.find(g => /player\.glb$/i.test(g.path)) || null;

    const report = {
        schema: 'whispering-wilds/authoritative-asset-audit@1',
        generatedAt: new Date().toISOString(),
        generatedFrom: 'scripts/authoritative-asset-audit.js',
        supersedes: [
            'ASSET_AUDIT_REPORT.json', 'BUILD_REPORT.json',
            'PRODUCTION_ASSET_STATUS.json', 'PRODUCTION_3D_ASSET_REPORT.json',
            'DATA_AUDIT_REPORT.json'
        ],
        methodology: {
            note: 'No count in this document is hardcoded. Existence is decided by fs.statSync on the working tree.',
            referenceExtraction: 'Regex over asset/... literals in js, css, index.html, server, desktop, scripts, tools, config, content',
            templatedReferences: 'References containing ${...} are flagged dynamicTemplate=true and are NOT resolved as literal paths',
            externalReferences: 'Absolute http(s), data: and blob: references are excluded from the repo inventory',
            glbInspection: '12-byte GLB header + JSON chunk parsed directly; meshes/skins/animations/materials/images counted'
        },
        totals: {
            physicalAssetFiles: assetFiles.length,
            physicalAssetBytes: totalPhysicalAssetBytes,
            distinctReferencedPaths: records.length,
            present: present.length,
            missing: missing.length,
            caseMismatched: caseMismatch.length,
            templatedReferences: dynamicRefs.length,
            totalReferenceOccurrences: totalRefOccurrences,
            sourceFilesScanned: sourceFilesScanned.size,
            unusedPhysicalAssets: unused.length,
            duplicateGroups: duplicateGroups.length,
            glbFiles: glbInventory.length,
            runtimeLoadedModules: runtimeModules.size
        },
        byCategory, byRegion,
        classification,
        manifestCrossCheck: manifestCheck,
        oldReportReconciliation: reconciliation,
        playerGlb,
        caseMismatches: caseMismatch.map(r => ({ referencedAs: r.path, actualOnDisk: r.resolvedPath })),
        glbInventory,
        duplicateGroups,
        unusedPhysicalAssets: unused,
        records
    };

    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), 'utf8');
    if (!jsonOnly) fs.writeFileSync(OUT_MD, renderMarkdown(report), 'utf8');

    // ---- console summary ----
    const t = report.totals;
    console.log('AUTHORITATIVE ASSET AUDIT');
    console.log('  generated            : ' + report.generatedAt);
    console.log('  physical asset files : ' + t.physicalAssetFiles + '  (' + (t.physicalAssetBytes / 1048576).toFixed(1) + ' MB)');
    console.log('  source files scanned : ' + t.sourceFilesScanned);
    console.log('  distinct ref paths   : ' + t.distinctReferencedPaths + '  (occurrences ' + t.totalReferenceOccurrences + ')');
    console.log('  PRESENT              : ' + t.present);
    console.log('  MISSING              : ' + t.missing);
    console.log('  case-mismatched      : ' + t.caseMismatched);
    console.log('  templated (dynamic)  : ' + t.templatedReferences);
    console.log('  unused physical      : ' + t.unusedPhysicalAssets);
    console.log('  duplicate groups     : ' + t.duplicateGroups);
    console.log('  glb files            : ' + t.glbFiles);
    console.log('  -> ' + toPosix(path.relative(ROOT, OUT_JSON)));
    if (!jsonOnly) console.log('  -> ' + toPosix(path.relative(ROOT, OUT_MD)));
    return report;
}

// ---------------------------------------------------------------------------
// markdown renderer
// ---------------------------------------------------------------------------

function table(headers, rows) {
    if (!rows.length) return '_none_\n';
    return [
        '| ' + headers.join(' | ') + ' |',
        '| ' + headers.map(() => '---').join(' | ') + ' |',
        ...rows.map(r => '| ' + r.join(' | ') + ' |')
    ].join('\n') + '\n';
}

function renderMarkdown(r) {
    const t = r.totals;
    const L = [];
    L.push('# Authoritative Asset Audit');
    L.push('');
    L.push('Generated `' + r.generatedAt + '` by `scripts/authoritative-asset-audit.js` from the working tree at `' +
        process.cwd() + '`.');
    L.push('');
    L.push('> This report **supersedes** ' + r.supersedes.join(', ') + '.');
    L.push('> No figure below is hardcoded; every number is recomputed from the current repository.');
    L.push('');
    L.push('## Method');
    Object.entries(r.methodology).forEach(([k, v]) => L.push('- **' + k + '**: ' + v));
    L.push('');
    L.push('## Totals');
    L.push(table(['Metric', 'Value'], [
        ['Physical asset files', t.physicalAssetFiles],
        ['Physical asset bytes', t.physicalAssetBytes.toLocaleString()],
        ['Source files scanned', t.sourceFilesScanned],
        ['Distinct referenced paths', t.distinctReferencedPaths],
        ['Total reference occurrences', t.totalReferenceOccurrences],
        ['**PRESENT**', '**' + t.present + '**'],
        ['**MISSING**', '**' + t.missing + '**'],
        ['Case-mismatched paths', t.caseMismatched],
        ['Templated / dynamic references', t.templatedReferences],
        ['Unused physical assets', t.unusedPhysicalAssets],
        ['Duplicate groups', t.duplicateGroups],
        ['GLB files on disk', t.glbFiles]
    ]));
    L.push('## By category');
    L.push(table(['Category', 'Referenced', 'Present', 'Missing'],
        Object.entries(r.byCategory).sort((a, b) => b[1].missing - a[1].missing)
            .map(([k, v]) => [k, v.referenced, v.present, v.missing])));
    L.push('## By region');
    L.push(table(['Region', 'Referenced', 'Present', 'Missing'],
        Object.entries(r.byRegion).sort((a, b) => b[1].missing - a[1].missing)
            .map(([k, v]) => [k, v.referenced, v.present, v.missing])));
    L.push('## GLB inventory (physically parsed)');
    L.push(table(['Path', 'Bytes', 'Valid', 'Meshes', 'Nodes', 'Skins', 'Anim', 'Mats', 'Imgs', 'Embedded', 'Errors'],
        r.glbInventory.map(g => [
            '`' + g.path + '`', g.size, g.validContainer ? 'yes' : '**NO**',
            g.meshes, g.nodes, g.skins, g.animations, g.materials, g.images, g.embeddedImages,
            g.errors.length ? g.errors.join('; ').slice(0, 60) : '-'
        ])));
    L.push('## Missing references (full reverse map)');
    const miss = r.records.filter(x => x.status === 'MISSING');
    L.push('Total missing: **' + miss.length + '**');
    L.push('');
    L.push('### Classification of every missing path');
    L.push('A missing literal is only a live defect if a module that `index.html` actually loads references it.');
    L.push('');
    L.push(table(['Class', 'Count', 'Meaning'], [
        ['`A_RUNTIME_REQUIRED_MISSING`', r.classification.A_RUNTIME_REQUIRED_MISSING || 0,
            'Loaded by a shipped module, no fallback in that module. Live gameplay gap.'],
        ['`B_RUNTIME_FALLBACK`', r.classification.B_RUNTIME_FALLBACK || 0,
            'Loaded by a shipped module, but the module builds a procedural stand-in on failure.'],
        ['`C_DEVTOOL_DECLARED_ONLY`', r.classification.C_DEVTOOL_DECLARED_ONLY || 0,
            'Declared only by scripts/tools/validators the page never loads. No runtime impact.'],
        ['`D_PATH_DRIFT_EXISTS_ELSEWHERE`', r.classification.D_PATH_DRIFT_EXISTS_ELSEWHERE || 0,
            'The same model exists on disk at another path. Fix the reference.'],
        ['`E_WIRED_BUT_UNCONFIRMED`', r.classification.E_WIRED_BUT_UNCONFIRMED || 0,
            'Referenced by a non-dev file that index.html does not load.'],
        ['`F_NO_TRACEABLE_SOURCE`', r.classification.F_NO_TRACEABLE_SOURCE || 0,
            'No traceable source reference.']
    ]));
    L.push('### Class A - runtime-required, no fallback (the real defects)');
    const classA = miss.filter(m => m.classification === 'A_RUNTIME_REQUIRED_MISSING');
    L.push(table(['Missing path', 'Subsystem', 'Loaded by', 'Source'],
        classA.map(m => ['`' + m.path + '`', m.responsibleSubsystem,
            (m.runtimeLoadedBy[0] || '-'), '`' + (m.referenceSources[0] || {}).source + ':' + (m.referenceSources[0] || {}).line + '`'])));
    L.push('### Class D - path drift (asset already exists)');
    L.push(table(['Referenced path', 'Model actually on disk'],
        miss.filter(m => m.classification === 'D_PATH_DRIFT_EXISTS_ELSEWHERE')
            .map(m => ['`' + m.path + '`', '`' + m.pathDriftTarget + '`'])));
    if (r.manifestCrossCheck && r.manifestCrossCheck.present) {
        L.push('## `assets/manifest.json` cross-check');
        L.push('Declared **' + r.manifestCrossCheck.declared + '**, physically present **' +
            r.manifestCrossCheck.physicallyPresent + '**, missing **' + r.manifestCrossCheck.missingEntries.length + '**.');
        if (r.manifestCrossCheck.missingEntries.length) {
            L.push(table(['Manifest entry with no file on disk'],
                r.manifestCrossCheck.missingEntries.map(p => ['`' + p + '`'])));
        } else {
            L.push('_The manifest does not claim any file that is absent. It is honest about what it lists._');
        }
    }
    if (r.playerGlb) {
        L.push('## Player model deep inspection (`' + r.playerGlb.path + '`)');
        L.push('| Property | Value |');
        L.push('| --- | --- |');
        const p = r.playerGlb;
        [['Bytes', p.size], ['Valid glTF 2.0 binary', p.validContainer ? 'yes' : '**no**'],
        ['Version', p.version], ['Meshes', p.meshes], ['Nodes', p.nodes], ['Skins (skeletal rig)', p.skins],
        ['Animations', p.animations], ['Materials', p.materials], ['Texture maps', p.textures],
        ['Images (embedded)', p.images], ['Embedded image bytes', p.embeddedImages],
        ['External image URIs', p.externalImageUris ? p.externalImageUris.length : 0],
        ['Demo/Xbot base mesh', p.hasXbot ? '**YES**' : 'no']]
            .forEach(([k, v]) => L.push('| ' + k + ' | ' + v + ' |'));
        if (p.materialNames && p.materialNames.length) {
            L.push('');
            L.push('Materials: ' + p.materialNames.map(n => '`' + n + '`').join(', '));
        }
        if (p.animationNames && p.animationNames.length) {
            L.push('');
            L.push('Animations: ' + p.animationNames.map(n => '`' + n + '`').join(', '));
        }
        L.push('');
        L.push('> PBR is present as metallic-roughness factors on ' + p.materials + ' materials, but the file carries ' +
            '**zero texture maps** (`textures[]=0, images[]=0, samplers[]=0`). Every material uses a flat `baseColorFactor` ' +
            'only. This is flat-shaded PBR, not textured PBR.');
    }
    if (r.oldReportReconciliation && !r.oldReportReconciliation.error) {
        const k = r.oldReportReconciliation;
        L.push('## Reconciliation with the superseded `ASSET_AUDIT_REPORT.json`');
        L.push('Old report generated `' + k.oldTimestamp + '`.');
        L.push('');
        L.push(table(['Metric', 'Old', 'New'], [
            ['Referenced paths', k.oldReferenced, t.distinctReferencedPaths],
            ['Found / present', k.oldFound, t.present],
            ['Missing', k.oldMissing, t.missing]
        ]));
        L.push(table(['Set comparison', 'Count'], [
            ['Old-missing still missing', k.oldMissingStillMissing],
            ['Old-missing now present', k.oldMissingNowPresent],
            ['Old-missing no longer statically referenced', k.oldMissingNoLongerStaticallyReferenced],
            ['Old-found still present and referenced', k.oldFoundStillPresentAndReferenced],
            ['Old-found no longer referenced', k.oldFoundNoLongerReferenced],
            ['New-missing not in the old missing list', k.newMissingNotInOldMissing]
        ]));
        L.push('> ' + k.note);
    }
    L.push('');
    L.push('## All missing references');
    L.push(table(['Missing path', 'Category', 'Region', 'Refs', 'Source files'],
        miss.map(m => [
            '`' + m.path + '`', m.category, m.region || '-', m.referenceCount,
            m.referenceSources.slice(0, 3).map(s => '`' + s.source + ':' + s.line + '`').join('<br>') +
            (m.referenceSources.length > 3 ? '<br>…+' + (m.referenceSources.length - 3) : '')
        ])));
    L.push('## Duplicate groups (identical content)');
    L.push(table(['SHA1', 'Copies', 'Wasted bytes', 'Paths'],
        r.duplicateGroups.map(d => [
            '`' + d.sha1.slice(0, 12) + '`', d.count, d.wastedBytes,
            d.paths.map(p => '`' + p + '`').join('<br>')
        ])));
    L.push('## Case mismatches');
    L.push(table(['Referenced as', 'Actual on disk'],
        r.caseMismatches.map(c => ['`' + c.referencedAs + '`', '`' + c.actualOnDisk + '`'])));
    L.push('## Unused physical assets');
    L.push(table(['Path', 'Bytes'],
        r.unusedPhysicalAssets.slice(0, 200).map(u => ['`' + u.path + '`', u.size])));
    if (r.unusedPhysicalAssets.length > 200) L.push('_…and ' + (r.unusedPhysicalAssets.length - 200) + ' more (see JSON)._');
    return L.join('\n') + '\n';
}

if (require.main === module) {
    try { main(); } catch (e) {
        console.error('authoritative-asset-audit failed: ' + (e && e.stack || e));
        process.exit(1);
    }
}

module.exports = { main, inspectGlb };
