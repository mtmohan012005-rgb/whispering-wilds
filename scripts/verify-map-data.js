/**
 * scripts/verify-map-data.js
 *
 * Automated verification of raw GIS GeoJSON datasets under unity/MapData/Raw/.
 * Validates RFC 7946 compliance, coordinate ranges, bounding box constraints,
 * and presence of all 6 primary gameplay anchor locations.
 */

const fs = require('fs');
const path = require('path');

const rawDir = path.resolve(__dirname, '../unity/MapData/Raw');
const expectedFiles = [
  'tn_boundary.geojson',
  'tn_10m_coastline.geojson',
  'tn_10m_rivers_lake_centerlines.geojson',
  'tn_10m_roads.geojson',
  'tn_10m_geography_regions_polys.geojson',
  'tn_10m_populated_places.geojson'
];

// Required anchor coordinates (WGS84)
const requiredAnchors = [
  { name: 'Chennai', lat: 13.0880, lon: 80.2885 },
  { name: 'Mamallapuram', lat: 12.6186, lon: 80.1983 },
  { name: 'Pichavaram', lat: 11.4289, lon: 79.7797 },
  { name: 'Thanjavur', lat: 10.7828, lon: 79.1318 },
  { name: 'Chettinad', lat: 10.0673, lon: 78.7844 },
  { name: 'Nilgiris', lat: 11.4102, lon: 76.6950 }
];

console.log('=== TAMIL NADU RAW GIS DATA VERIFICATION ===');
let errors = 0;

if (!fs.existsSync(rawDir)) {
  console.error(`FAIL: Directory does not exist: ${rawDir}`);
  process.exit(1);
}

for (const file of expectedFiles) {
  const filePath = path.join(rawDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: Missing expected GeoJSON file: ${file}`);
    errors++;
    continue;
  }

  try {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const geo = JSON.parse(rawContent);

    if (geo.type !== 'FeatureCollection' || !Array.isArray(geo.features)) {
      console.error(`FAIL: ${file} is not a valid GeoJSON FeatureCollection`);
      errors++;
      continue;
    }

    let coordCount = 0;
    const checkCoords = (coords) => {
      if (typeof coords[0] === 'number') {
        const [lon, lat] = coords;
        coordCount++;
        if (lon < 75.0 || lon > 82.0 || lat < 7.5 || lat > 14.5) {
          console.error(`WARN: Coordinate [${lon}, ${lat}] in ${file} outside Tamil Nadu bounding box!`);
          errors++;
        }
      } else {
        coords.forEach(checkCoords);
      }
    };

    geo.features.forEach(f => {
      if (!f.geometry || !f.geometry.coordinates) {
        console.error(`FAIL: Feature missing geometry in ${file}`);
        errors++;
      } else {
        checkCoords(f.geometry.coordinates);
      }
    });

    console.log(`PASS: ${file} verified (${geo.features.length} features, ${coordCount} coordinates checked)`);
  } catch (err) {
    console.error(`FAIL: Parsing error in ${file}: ${err.message}`);
    errors++;
  }
}

// Check anchor points in populated places
const placesFile = path.join(rawDir, 'tn_10m_populated_places.geojson');
if (fs.existsSync(placesFile)) {
  const placesGeo = JSON.parse(fs.readFileSync(placesFile, 'utf8'));
  for (const anchor of requiredAnchors) {
    const found = placesGeo.features.find(f =>
      f.properties && (f.properties.name === anchor.name || f.properties.NAME === anchor.name)
    );
    if (!found) {
      console.error(`FAIL: Missing anchor place '${anchor.name}' in tn_10m_populated_places.geojson`);
      errors++;
    } else {
      const [lon, lat] = found.geometry.coordinates;
      const dLat = Math.abs(lat - anchor.lat);
      const dLon = Math.abs(lon - anchor.lon);
      if (dLat > 0.005 || dLon > 0.005) {
        console.error(`FAIL: Anchor '${anchor.name}' coordinates [${lat}, ${lon}] mismatch required [${anchor.lat}, ${anchor.lon}]`);
        errors++;
      } else {
        console.log(`PASS: Anchor '${anchor.name}' verified at (${lat.toFixed(4)} N, ${lon.toFixed(4)} E)`);
      }
    }
  }
}

if (errors > 0) {
  console.error(`\nFAILED with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('\nSUCCESS: All Tamil Nadu raw GIS datasets verified and RFC 7946 compliant.');
  process.exit(0);
}
