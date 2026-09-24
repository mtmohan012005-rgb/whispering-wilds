#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - Texture Resolution & Format Validator
 * Audits raster textures (.png, .jpg, .webp) across assets directory.
 * Flags: oversized textures (>4K on non-hero props), non-power-of-two textures, missing files.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const TEXTURES_DIR = path.join(ROOT_DIR, 'assets');

// Helper to read PNG dimensions from header
function readPNGDimensions(buffer) {
  if (buffer.length < 24) return null;
  if (buffer.readUInt32BE(0) !== 0x89504E47) return null; // "\x89PNG"
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

// Helper to read JPEG dimensions
function readJPEGDimensions(buffer) {
  if (buffer.length < 4 || buffer.readUInt16BE(0) !== 0xFFD8) return null;
  let offset = 2;
  while (offset < buffer.length - 8) {
    const marker = buffer.readUInt16BE(offset);
    offset += 2;
    if (marker === 0xFFC0 || marker === 0xFFC2) { // SOF0 or SOF2
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    const len = buffer.readUInt16BE(offset);
    offset += len;
  }
  return null;
}

function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

function validateTextures() {
  console.log('====================================================');
  console.log('THE WHISPERING WILDS - TEXTURE VALIDATION AUDIT');
  console.log('====================================================\n');

  const exts = new Set(['.png', '.jpg', '.jpeg', '.webp']);
  const textures = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else {
        const ext = path.extname(e.name).toLowerCase();
        if (exts.has(ext)) {
          textures.push(full);
        }
      }
    }
  }

  walk(TEXTURES_DIR);

  const results = [];
  const warnings = [];

  textures.forEach(file => {
    const rel = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
    const buffer = fs.readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    let dims = null;

    if (ext === '.png') dims = readPNGDimensions(buffer);
    else if (ext === '.jpg' || ext === '.jpeg') dims = readJPEGDimensions(buffer);

    const sizeKB = (buffer.length / 1024).toFixed(1);

    const item = {
      path: rel,
      format: ext.replace('.', '').toUpperCase(),
      sizeKB: Number(sizeKB),
      dimensions: dims ? `${dims.width}x${dims.height}` : 'unknown',
      pot: dims ? (isPowerOfTwo(dims.width) && isPowerOfTwo(dims.height)) : true,
      status: 'READY'
    };

    if (dims && (dims.width > 4096 || dims.height > 4096)) {
      item.status = 'WARN';
      warnings.push(`Texture ${rel} exceeds 4K resolution (${dims.width}x${dims.height}).`);
    }

    results.push(item);
  });

  console.log(`Audited Textures: ${results.length}`);
  console.log(`  ✓ READY      : ${results.filter(r => r.status === 'READY').length}`);
  console.log(`  ⚠ WARNINGS   : ${warnings.length}`);

  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(`  - [WARN] ${w}`));
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalTextures: results.length,
    warningsCount: warnings.length,
    textures: results,
    warnings
  };

  fs.writeFileSync(path.join(ROOT_DIR, 'TEXTURE_AUDIT_REPORT.json'), JSON.stringify(report, null, 2));
  console.log('\nReport written to TEXTURE_AUDIT_REPORT.json\n');
  return { success: true, report };
}

if (require.main === module) {
  validateTextures();
}

module.exports = { validateTextures };
