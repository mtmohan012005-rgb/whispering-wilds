/**
 * scripts/generate-raw-map-data.js
 *
 * Invokes the authoritative GIS extraction and clipping pipeline
 * (unity/MapData/Tools/clip-to-tamilnadu.mjs) to generate RFC 7946 GeoJSON datasets
 * and the cryptographic sources manifest under unity/MapData/Raw/.
 */

const { execSync } = require('child_process');
const path = require('path');

const scriptPath = path.resolve(__dirname, '../unity/MapData/Tools/clip-to-tamilnadu.mjs');

console.log('Running authoritative GIS generation pipeline...');
try {
  execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  console.log('GIS data generation completed successfully.');
} catch (err) {
  console.error('GIS generation failed:', err.message);
  process.exit(1);
}
