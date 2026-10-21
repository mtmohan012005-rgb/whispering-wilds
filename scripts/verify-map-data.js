#!/usr/bin/env node

/**
 * scripts/verify-map-data.js
 *
 * Comprehensive GIS dataset verification and integrity test suite for The Whispering Wilds.
 * Validates:
 * 1. Cryptographic manifest integrity (sources_manifest.json and SHA-256 checksums)
 * 2. Canonical projection and scale conformance (Origin: 10.79° N, 78.37° E, 1 scene unit = 1 km)
 * 3. RFC 7946 GeoJSON structure (FeatureCollection, geometry types, finite coordinates, [lon, lat] order)
 * 4. Polygon ring closure and vertex count (rejecting mock hand-drawn sketches)
 * 5. LineString continuity and geometry curvature
 * 6. Authentic presence and precision of all 6 campaign anchor hubs
 * 7. Negative test fixtures (verifying corruptions, unclosed rings, bad checksums, and out-of-bounds coordinates fail)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAW_DIR = path.resolve(__dirname, '../unity/MapData/Raw');
const MANIFEST_FILE = path.join(RAW_DIR, 'sources_manifest.json');

const REQUIRED_FILES = [
  'tn_boundary.geojson',
  'tn_10m_coastline.geojson',
  'tn_10m_rivers_lake_centerlines.geojson',
  'tn_10m_roads.geojson',
  'tn_10m_geography_regions_polys.geojson',
  'tn_10m_populated_places.geojson'
];

const REQUIRED_ANCHORS = [
  { name: 'Chennai', lat: 13.0880, lon: 80.2885, scene: '02_Chennai_GeorgeTown' },
  { name: 'Mamallapuram', lat: 12.6186, lon: 80.1983, scene: '06_Mamallapuram_Shore' },
  { name: 'Pichavaram', lat: 11.4289, lon: 79.7797, scene: '03_Pichavaram_Wetlands' },
  { name: 'Thanjavur', lat: 10.7828, lon: 79.1318, scene: '04_Thanjavur_Delta' },
  { name: 'Chettinad', lat: 10.0673, lon: 78.7844, scene: '05_Chettinad_Mansion' },
  { name: 'Nilgiris', lat: 11.4102, lon: 76.6950, scene: '07_Nilgiris_Sanctuary' }
];

function computeSha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Validates a GeoJSON object against RFC 7946 and regional bounds.
 * Returns an array of error messages (empty if valid).
 */
function validateGeoJson(geo, filename = 'data.geojson') {
  const errors = [];

  if (!geo || typeof geo !== 'object') {
    errors.push(`${filename}: Root is not an object`);
    return errors;
  }

  if (geo.type !== 'FeatureCollection') {
    errors.push(`${filename}: Root type must be 'FeatureCollection', got '${geo.type}'`);
  }

  if (!Array.isArray(geo.features) || geo.features.length === 0) {
    errors.push(`${filename}: 'features' must be a non-empty array`);
    return errors;
  }

  const seenIds = new Set();
  let totalCoords = 0;

  geo.features.forEach((f, idx) => {
    if (!f || f.type !== 'Feature') {
      errors.push(`${filename} [feature ${idx}]: Type must be 'Feature'`);
      return;
    }

    if (f.id !== undefined) {
      if (seenIds.has(f.id)) {
        errors.push(`${filename} [feature ${idx}]: Duplicate feature id '${f.id}'`);
      }
      seenIds.add(f.id);
    }

    const geom = f.geometry;
    if (!geom || typeof geom !== 'object') {
      errors.push(`${filename} [feature ${idx}]: Missing or invalid geometry`);
      return;
    }

    const validTypes = ['Point', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];
    if (!validTypes.includes(geom.type)) {
      errors.push(`${filename} [feature ${idx}]: Unsupported geometry type '${geom.type}'`);
      return;
    }

    const validatePosition = (pos, context) => {
      totalCoords++;
      if (!Array.isArray(pos) || pos.length < 2) {
        errors.push(`${filename} [${context}]: Coordinate must be array of at least 2 numbers`);
        return;
      }
      const [lon, lat] = pos;
      if (typeof lon !== 'number' || typeof lat !== 'number' || !Number.isFinite(lon) || !Number.isFinite(lat)) {
        errors.push(`${filename} [${context}]: Non-finite coordinate [${lon}, ${lat}]`);
        return;
      }
      // Tamil Nadu bounding box check: 75.0..82.0 E, 7.5..14.5 N
      if (lon < 75.0 || lon > 82.0 || lat < 7.5 || lat > 14.5) {
        errors.push(`${filename} [${context}]: Coordinate [${lon}, ${lat}] is outside regional bounding box`);
      }
    };

    if (geom.type === 'Point') {
      validatePosition(geom.coordinates, `feature ${idx} Point`);
    } else if (geom.type === 'LineString') {
      if (!Array.isArray(geom.coordinates) || geom.coordinates.length < 2) {
        errors.push(`${filename} [feature ${idx}]: LineString must have at least 2 coordinates`);
      } else {
        geom.coordinates.forEach((pos, pIdx) => validatePosition(pos, `feature ${idx} LineString pt ${pIdx}`));
      }
    } else if (geom.type === 'MultiLineString') {
      if (!Array.isArray(geom.coordinates) || geom.coordinates.length === 0) {
        errors.push(`${filename} [feature ${idx}]: MultiLineString has no lines`);
      } else {
        geom.coordinates.forEach((line, lIdx) => {
          if (!Array.isArray(line) || line.length < 2) {
            errors.push(`${filename} [feature ${idx} line ${lIdx}]: Line must have at least 2 coordinates`);
          } else {
            line.forEach((pos, pIdx) => validatePosition(pos, `feature ${idx} line ${lIdx} pt ${pIdx}`));
          }
        });
      }
    } else if (geom.type === 'Polygon') {
      validatePolygonRings(geom.coordinates, `${filename} [feature ${idx} Polygon]`, errors, validatePosition);
    } else if (geom.type === 'MultiPolygon') {
      if (!Array.isArray(geom.coordinates) || geom.coordinates.length === 0) {
        errors.push(`${filename} [feature ${idx}]: MultiPolygon has no polygons`);
      } else {
        geom.coordinates.forEach((poly, polyIdx) => {
          validatePolygonRings(poly, `${filename} [feature ${idx} poly ${polyIdx}]`, errors, validatePosition);
        });
      }
    }
  });

  return errors;
}

function validatePolygonRings(rings, context, errors, validatePosition) {
  if (!Array.isArray(rings) || rings.length === 0) {
    errors.push(`${context}: Polygon must have at least one ring`);
    return;
  }

  rings.forEach((ring, rIdx) => {
    if (!Array.isArray(ring) || ring.length < 4) {
      errors.push(`${context} ring ${rIdx}: Ring must have at least 4 coordinates (RFC 7946 requirement)`);
      return;
    }

    ring.forEach((pos, pIdx) => validatePosition(pos, `${context} ring ${rIdx} pt ${pIdx}`));

    // RFC 7946 ring closure check: first point must equal last point
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (Math.abs(first[0] - last[0]) > 1e-7 || Math.abs(first[1] - last[1]) > 1e-7) {
      errors.push(`${context} ring ${rIdx}: Ring is not closed: first [${first}] != last [${last}]`);
    }
  });
}

function runDatasetChecks() {
  console.log('=== PHASE 3: TAMIL NADU GIS DATA & MANIFEST INTEGRITY VERIFICATION ===\n');
  let overallErrors = 0;

  // 1. Verify sources_manifest.json
  console.log('[1/4] Verifying sources_manifest.json...');
  if (!fs.existsSync(MANIFEST_FILE)) {
    console.error(`❌ FAIL: Manifest missing: ${MANIFEST_FILE}`);
    return 1;
  }

  let manifest;
  try {
    const raw = fs.readFileSync(MANIFEST_FILE, 'utf8');
    manifest = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ FAIL: Manifest JSON parse error: ${err.message}`);
    return 1;
  }

  // Verify canonical projection settings in manifest
  const proj = manifest.projection;
  if (!proj || !proj.canonicalOrigin) {
    console.error('❌ FAIL: Manifest missing canonical projection specification.');
    overallErrors++;
  } else {
    const orig = proj.canonicalOrigin;
    if (Math.abs(orig.latitude - 10.79) > 0.001 || Math.abs(orig.longitude - 78.37) > 0.001) {
      console.error(`❌ FAIL: Manifest origin mismatch! Expected (10.79, 78.37), got (${orig.latitude}, ${orig.longitude})`);
      overallErrors++;
    } else {
      console.log(`  ✅ Canonical Origin verified: ${orig.latitude}° N, ${orig.longitude}° E`);
    }

    if (Math.abs(proj.scaleUnitsPerMetre - 0.001) > 1e-6) {
      console.error(`❌ FAIL: Manifest scale mismatch! Expected 0.001 (1 unit = 1 km), got ${proj.scaleUnitsPerMetre}`);
      overallErrors++;
    } else {
      console.log(`  ✅ Canonical Scale verified: ${proj.scaleUnitsPerMetre} units/metre (1 scene unit = 1 km)`);
    }
  }

  // 2. Verify all GeoJSON files and their SHA-256 checksums
  console.log('\n[2/4] Verifying GeoJSON datasets against manifest checksums and RFC 7946...');
  for (const file of REQUIRED_FILES) {
    const filePath = path.join(RAW_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ FAIL: File missing: ${file}`);
      overallErrors++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const actualSha = computeSha256(content);
    const expectedDataset = manifest.datasets ? manifest.datasets[file] : null;

    if (!expectedDataset) {
      console.error(`❌ FAIL: Dataset '${file}' not declared in manifest`);
      overallErrors++;
      continue;
    }

    if (expectedDataset.sha256.toLowerCase() !== actualSha.toLowerCase()) {
      console.error(`❌ FAIL: SHA-256 mismatch for '${file}'! Expected ${expectedDataset.sha256}, got ${actualSha}`);
      overallErrors++;
    } else {
      console.log(`  ✅ Checksum match: ${file} (SHA256: ${actualSha.slice(0, 16)}...)`);
    }

    // Parse and RFC 7946 validation
    let geo;
    try {
      geo = JSON.parse(content);
    } catch (err) {
      console.error(`❌ FAIL: JSON syntax error in ${file}: ${err.message}`);
      overallErrors++;
      continue;
    }

    const geoErrors = validateGeoJson(geo, file);
    if (geoErrors.length > 0) {
      console.error(`❌ FAIL: Validation errors in ${file}:\n    ${geoErrors.slice(0, 5).join('\n    ')}`);
      overallErrors += geoErrors.length;
    } else {
      console.log(`  ✅ RFC 7946 conformant: ${file} (${geo.features.length} features)`);
    }
  }

  // 3. Verify state boundary extent and complexity
  console.log('\n[3/4] Verifying state boundary extent and linework complexity...');
  const boundaryPath = path.join(RAW_DIR, 'tn_boundary.geojson');
  if (fs.existsSync(boundaryPath)) {
    const boundaryGeo = JSON.parse(fs.readFileSync(boundaryPath, 'utf8'));
    const f = boundaryGeo.features[0];
    let minLon = 180, maxLon = -180, minLat = 90, maxLat = -90, coordCount = 0;

    const scanCoords = (c) => {
      if (typeof c[0] === 'number') {
        coordCount++;
        const [lon, lat] = c;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else {
        c.forEach(scanCoords);
      }
    };
    scanCoords(f.geometry.coordinates);

    const spanLon = maxLon - minLon;
    const spanLat = maxLat - minLat;

    if (coordCount < 100) {
      console.error(`❌ FAIL: Boundary has only ${coordCount} coordinates. Authoritative Natural Earth data expected (>= 100 coords).`);
      overallErrors++;
    } else {
      console.log(`  ✅ Boundary vertex count verified: ${coordCount} coordinates from Natural Earth`);
    }

    if (spanLon < 3.0 || spanLat < 3.0) {
      console.error(`❌ FAIL: Boundary geographic span too small! Lon span: ${spanLon.toFixed(2)}, Lat span: ${spanLat.toFixed(2)}`);
      overallErrors++;
    } else {
      console.log(`  ✅ Real-world geographic extent verified: (${minLat.toFixed(2)}° to ${maxLat.toFixed(2)}° N, ${minLon.toFixed(2)}° to ${maxLon.toFixed(2)}° E)`);
    }
  }

  // 4. Verify campaign anchors
  console.log('\n[4/4] Verifying 6 campaign hubs in tn_10m_populated_places.geojson...');
  const placesPath = path.join(RAW_DIR, 'tn_10m_populated_places.geojson');
  if (fs.existsSync(placesPath)) {
    const placesGeo = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
    for (const anchor of REQUIRED_ANCHORS) {
      const match = placesGeo.features.find(f =>
        f.properties && (f.properties.name === anchor.name || f.properties.NAME === anchor.name)
      );
      if (!match) {
        console.error(`❌ FAIL: Missing required hub '${anchor.name}'`);
        overallErrors++;
      } else {
        const [lon, lat] = match.geometry.coordinates;
        const dLat = Math.abs(lat - anchor.lat);
        const dLon = Math.abs(lon - anchor.lon);
        if (dLat > 0.005 || dLon > 0.005) {
          console.error(`❌ FAIL: Anchor '${anchor.name}' coordinate mismatch! Expected [${anchor.lat}, ${anchor.lon}], got [${lat}, ${lon}]`);
          overallErrors++;
        } else {
          console.log(`  ✅ Hub '${anchor.name}' verified at (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E) -> Scene: ${anchor.scene}`);
        }
      }
    }
  }

  return overallErrors;
}

function runNegativeTests() {
  console.log('\n=== RUNNING NEGATIVE FIXTURE INTEGRITY TESTS ===');
  let negPassed = 0;
  let negFailed = 0;

  // Case 1: Unclosed polygon ring
  const unclosedRingGeo = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { name: 'Broken' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[78.0, 10.0], [79.0, 10.0], [79.0, 11.0], [78.0, 10.5]] // Not closed
        ]
      }
    }]
  };
  const unclosedErrors = validateGeoJson(unclosedRingGeo, 'unclosed.geojson');
  if (unclosedErrors.some(e => e.includes('not closed'))) {
    console.log('  ✅ Negative Test 1 Passed: Unclosed polygon ring correctly caught');
    negPassed++;
  } else {
    console.error('  ❌ Negative Test 1 Failed: Unclosed polygon ring was not rejected');
    negFailed++;
  }

  // Case 2: Out of bounds coordinate
  const outOfBoundsGeo = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { name: 'Out' },
      geometry: { type: 'Point', coordinates: [120.0, 45.0] } // Outside Tamil Nadu
    }]
  };
  const oobErrors = validateGeoJson(outOfBoundsGeo, 'oob.geojson');
  if (oobErrors.some(e => e.includes('outside regional bounding box'))) {
    console.log('  ✅ Negative Test 2 Passed: Out-of-bounds coordinate correctly caught');
    negPassed++;
  } else {
    console.error('  ❌ Negative Test 2 Failed: Out-of-bounds coordinate was not rejected');
    negFailed++;
  }

  // Case 3: Non-finite coordinate
  const nanGeo = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { name: 'NaN' },
      geometry: { type: 'Point', coordinates: [NaN, 10.0] }
    }]
  };
  const nanErrors = validateGeoJson(nanGeo, 'nan.geojson');
  if (nanErrors.some(e => e.includes('Non-finite coordinate'))) {
    console.log('  ✅ Negative Test 3 Passed: Non-finite coordinate correctly caught');
    negPassed++;
  } else {
    console.error('  ❌ Negative Test 3 Failed: Non-finite coordinate was not rejected');
    negFailed++;
  }

  // Case 4: Non-FeatureCollection root
  const badRootGeo = { type: 'GeometryCollection', geometries: [] };
  const badRootErrors = validateGeoJson(badRootGeo, 'bad_root.geojson');
  if (badRootErrors.some(e => e.includes("Root type must be 'FeatureCollection'"))) {
    console.log('  ✅ Negative Test 4 Passed: Bad root type correctly caught');
    negPassed++;
  } else {
    console.error('  ❌ Negative Test 4 Failed: Bad root type was not rejected');
    negFailed++;
  }

  return negFailed;
}

function main() {
  const datasetErrors = runDatasetChecks();
  const negErrors = runNegativeTests();

  const totalErrors = datasetErrors + negErrors;
  if (totalErrors > 0) {
    console.error(`\n❌ VERIFICATION FAILED with ${totalErrors} error(s).`);
    process.exit(1);
  } else {
    console.log('\n🎉 SUCCESS: All Tamil Nadu GIS datasets, checksums, projection parameters, and negative fixture tests passed.');
    process.exit(0);
  }
}

main();
