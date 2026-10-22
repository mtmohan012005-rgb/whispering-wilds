#!/usr/bin/env node
/**
 * The Whispering Wilds — Game Data & Manifest Cross-Reference Validator
 *
 * Validates the authoritative JSON manifests that ship with the Unity project:
 *   - assets/manifest.json                       (curated runtime asset manifest)
 *   - PRODUCTION_3D_ASSET_MANIFEST.json          (production 3D asset manifest)
 *   - assets/audio/audio-manifest.json           (audio inventory + sha256)
 *   - assets/characters/player/CHARACTER_MANIFEST.json (hero rig contract)
 *
 * Detects: malformed JSON, duplicate IDs, missing required fields, READY assets
 * with no physical file, filePresent/sha256 drift, and dangling hero-model paths.
 *
 * The previous implementation read `js/data/*.js`, which was deleted when the
 * browser client was removed. It silently audited 0 entities and always passed;
 * this version fails loudly when its inputs are missing.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(ROOT_DIR, 'DATA_AUDIT_REPORT.json');

const errors = [];
const warnings = [];
const stats = [];

function readJson(relPath) {
  const abs = path.join(ROOT_DIR, relPath);
  if (!fs.existsSync(abs)) {
    errors.push(`Missing manifest: ${relPath}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (err) {
    errors.push(`Invalid JSON in ${relPath}: ${err.message}`);
    return null;
  }
}

function resolveInsideRepo(relPath) {
  const abs = path.resolve(ROOT_DIR, relPath);
  const rel = path.relative(ROOT_DIR, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    errors.push(`Path escapes repository root: ${relPath}`);
    return null;
  }
  return abs;
}

function fileSize(relPath) {
  const abs = resolveInsideRepo(relPath);
  if (!abs) return 0;
  try {
    const stat = fs.statSync(abs);
    return stat.isFile() ? stat.size : 0;
  } catch {
    return 0;
  }
}

function sha256(relPath) {
  const abs = resolveInsideRepo(relPath);
  if (!abs) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').toUpperCase();
}

function validateManifest(label, manifest, options) {
  const {
    entriesKey = 'assets',
    idField = 'id',
    pathField = 'path',
    readyStatuses = ['READY'],
    statusField = 'status',
  } = options;

  if (!manifest || typeof manifest !== 'object') return;

  const entries = manifest[entriesKey];
  if (!Array.isArray(entries) || entries.length === 0) {
    errors.push(`${label}: "${entriesKey}" must be a non-empty array`);
    return;
  }

  const seen = new Map();
  let ready = 0;
  let blocked = 0;
  let present = 0;

  for (const [index, entry] of entries.entries()) {
    const where = `${label}[${index}]`;
    const id = entry[idField];
    const relPath = entry[pathField];
    const status = entry[statusField];

    if (!id) {
      errors.push(`${where}: missing "${idField}"`);
    } else if (seen.has(id)) {
      errors.push(`${label}: duplicate id "${id}" (first at index ${seen.get(id)})`);
    } else {
      seen.set(id, index);
    }

    if (!relPath) {
      errors.push(`${where}: missing "${pathField}"`);
      continue;
    }

    const size = fileSize(relPath);
    if (size > 0) present += 1;

    if (readyStatuses.includes(status)) {
      ready += 1;
      if (size === 0) {
        errors.push(`${where} (${id || 'NO_ID'}): status ${status} but file is missing or empty: ${relPath}`);
      }
    } else if (status === 'BLOCKED') {
      blocked += 1;
    }
  }

  stats.push({ manifest: label, entries: entries.length, ready, blocked, filesPresent: present });
}

function validateAudioManifest() {
  const label = 'assets/audio/audio-manifest.json';
  const manifest = readJson(label);
  if (!manifest || !Array.isArray(manifest.assets)) {
    if (manifest) errors.push(`${label}: "assets" must be an array`);
    return;
  }

  const seen = new Set();
  let present = 0;
  let blocked = 0;

  for (const [index, entry] of manifest.assets.entries()) {
    const where = `${label}[${index}]`;
    if (!entry.id) errors.push(`${where}: missing "id"`);
    else if (seen.has(entry.id)) errors.push(`${label}: duplicate id "${entry.id}"`);
    else seen.add(entry.id);

    if (!entry.path) {
      errors.push(`${where}: missing "path"`);
      continue;
    }

    const onDisk = fileSize(entry.path) > 0;
    if (onDisk) present += 1;
    if (entry.status === 'BLOCKED') blocked += 1;

    if (entry.filePresent === true && !onDisk) {
      errors.push(`${where} (${entry.id}): filePresent=true but file is missing or empty: ${entry.path}`);
    }
    if (entry.filePresent === false && onDisk) {
      errors.push(`${where} (${entry.id}): filePresent=false but file exists on disk: ${entry.path}`);
    }
    if (entry.filePresent === true && onDisk && entry.sha256) {
      const actual = sha256(entry.path);
      if (actual && actual !== entry.sha256.toUpperCase()) {
        errors.push(`${where} (${entry.id}): sha256 drift for ${entry.path}`);
      }
    }
  }

  stats.push({
    manifest: label,
    entries: manifest.assets.length,
    ready: manifest.assets.filter((a) => a.status === 'PLACEHOLDER' || a.status === 'READY').length,
    blocked,
    filesPresent: present,
  });
}

function validateCharacterManifest() {
  const label = 'assets/characters/player/CHARACTER_MANIFEST.json';
  const manifest = readJson(label);
  if (!manifest) return;

  if (!manifest.characterId) errors.push(`${label}: missing "characterId"`);
  if (!manifest.targetFile) {
    errors.push(`${label}: missing "targetFile"`);
  } else if (fileSize(manifest.targetFile) === 0) {
    errors.push(`${label}: targetFile is missing or empty: ${manifest.targetFile}`);
  }

  const bones = manifest.rig && manifest.rig.standardBones;
  if (!Array.isArray(bones) || bones.length === 0) {
    errors.push(`${label}: "rig.standardBones" must be a non-empty array`);
  }

  const animations = manifest.animations;
  if (animations != null && !Array.isArray(animations)) {
    errors.push(`${label}: "animations" must be an array when present`);
  }

  stats.push({
    manifest: label,
    entries: 1,
    ready: 1,
    blocked: 0,
    filesPresent: fileSize(manifest.targetFile || '') > 0 ? 1 : 0,
    bones: Array.isArray(bones) ? bones.length : 0,
  });
}

function runDataValidation() {
  console.log('====================================================');
  console.log('THE WHISPERING WILDS - GAME DATA & MANIFEST AUDIT');
  console.log('====================================================\n');

  validateManifest('assets/manifest.json', readJson('assets/manifest.json'), {
    entriesKey: 'assets',
    pathField: 'path',
    readyStatuses: ['READY'],
  });

  validateManifest('PRODUCTION_3D_ASSET_MANIFEST.json', readJson('PRODUCTION_3D_ASSET_MANIFEST.json'), {
    entriesKey: 'assets',
    pathField: 'file',
    readyStatuses: ['READY'],
  });

  validateAudioManifest();
  validateCharacterManifest();

  let totalEntries = 0;
  let totalPresent = 0;
  for (const row of stats) {
    totalEntries += row.entries;
    totalPresent += row.filesPresent;
    console.log(
      `  ${row.manifest}: ${row.entries} entries ` +
        `(${row.ready} ready/placeholder, ${row.blocked} blocked, ${row.filesPresent} files present)`
    );
  }

  console.log('\nData Integrity Audit Summary:');
  console.log(`  Manifests Audited        : ${stats.length}`);
  console.log(`  Total Entries            : ${totalEntries}`);
  console.log(`  Files Verified On Disk   : ${totalPresent}`);
  console.log(`  Errors Detected          : ${errors.length}`);
  console.log(`  Warnings Detected        : ${warnings.length}`);

  if (errors.length > 0) {
    console.error('\nErrors:');
    errors.forEach((e) => console.error(`  x ${e}`));
  }
  if (warnings.length > 0) {
    console.warn('\nWarnings:');
    warnings.forEach((w) => console.warn(`  ! ${w}`));
  }

  const report = {
    timestamp: new Date().toISOString(),
    manifests: stats,
    totalEntries,
    filesVerified: totalPresent,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    errors,
    warnings,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log('\nReport written to DATA_AUDIT_REPORT.json');

  if (errors.length === 0) {
    console.log('\nSUCCESS: All game data manifests and cross-references are consistent.');
  } else {
    console.error('\nFAILURE: Game data manifest audit found inconsistencies.');
  }

  return { success: errors.length === 0, errors, warnings };
}

if (require.main === module) {
  const result = runDataValidation();
  if (!result.success) process.exit(1);
}

module.exports = { runDataValidation };
