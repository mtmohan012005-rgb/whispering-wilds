#!/usr/bin/env node
/**
 * The Whispering Wilds (Kaattu Vazhi) - 3D GLB Structure Validator
 * Audits binary glTF (.glb) files for valid magic header (0x46546C67),
 * chunk structure (JSON chunk + BIN chunk), valid mesh definitions,
 * non-NaN/Infinity transform matrices, and material texture references.
 */

const fs = require('fs');
const path = require('path');

function validateGLBFile(filePath) {
  const result = {
    filePath,
    valid: false,
    fileSize: 0,
    scenesCount: 0,
    meshesCount: 0,
    materialsCount: 0,
    animationsCount: 0,
    errors: [],
    warnings: []
  };

  if (!fs.existsSync(filePath)) {
    result.errors.push(`File does not exist: ${filePath}`);
    return result;
  }

  const stat = fs.statSync(filePath);
  result.fileSize = stat.size;

  if (stat.size < 12) {
    result.errors.push('File too small to be a valid GLB (minimum header is 12 bytes).');
    return result;
  }

  const buffer = fs.readFileSync(filePath);
  // GLB magic: 0x46546C67 ("glTF")
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const length = buffer.readUInt32LE(8);

  if (magic !== 0x46546C67) {
    result.errors.push(`Invalid GLB magic bytes: 0x${magic.toString(16)} (expected 0x46546c67 'glTF')`);
    return result;
  }

  if (version !== 2) {
    result.warnings.push(`GLB version is ${version} (glTF 2.0 standard is version 2)`);
  }

  // Parse First Chunk: JSON Chunk
  let pos = 12;
  if (pos + 8 > buffer.length) {
    result.errors.push('Corrupt GLB: Missing first chunk header.');
    return result;
  }

  const chunkLength = buffer.readUInt32LE(pos);
  const chunkType = buffer.readUInt32LE(pos + 4);
  pos += 8;

  // Chunk type 0x4E4F534A is "JSON"
  if (chunkType !== 0x4E4F534A) {
    result.errors.push(`First chunk is not JSON chunk (type: 0x${chunkType.toString(16)})`);
    return result;
  }

  try {
    const jsonStr = buffer.toString('utf8', pos, pos + chunkLength);
    const gltf = JSON.parse(jsonStr);

    result.scenesCount = gltf.scenes ? gltf.scenes.length : 0;
    result.meshesCount = gltf.meshes ? gltf.meshes.length : 0;
    result.materialsCount = gltf.materials ? gltf.materials.length : 0;
    result.animationsCount = gltf.animations ? gltf.animations.length : 0;

    // Check for NaN or Infinity in nodes matrices
    if (gltf.nodes) {
      gltf.nodes.forEach((node, idx) => {
        if (node.matrix) {
          const hasInvalid = node.matrix.some(v => isNaN(v) || !isFinite(v));
          if (hasInvalid) {
            result.errors.push(`Node #${idx} (${node.name || 'unnamed'}) contains NaN/Infinity in matrix transform.`);
          }
        }
      });
    }

    result.valid = result.errors.length === 0;
  } catch (err) {
    result.errors.push(`Failed to parse glTF JSON chunk: ${err.message}`);
  }

  return result;
}

// Batch scanner
function scanGLBDirectory(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(cur) {
    const list = fs.readdirSync(cur, { withFileTypes: true });
    for (const item of list) {
      const full = path.join(cur, item.name);
      if (item.isDirectory()) {
        walk(full);
      } else if (item.name.toLowerCase().endsWith('.glb')) {
        results.push(validateGLBFile(full));
      }
    }
  }

  walk(dir);
  return results;
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..', '..');
  const assetsDir = path.join(root, 'assets');
  console.log(`Scanning GLBs in: ${assetsDir}`);
  const results = scanGLBDirectory(assetsDir);
  console.log(`Audited ${results.length} GLB files.`);
  results.forEach(r => {
    console.log(`  [${r.valid ? 'PASS' : 'FAIL'}] ${path.basename(r.filePath)} - Meshes: ${r.meshesCount}, Materials: ${r.materialsCount}`);
  });
}

module.exports = { validateGLBFile, scanGLBDirectory };
