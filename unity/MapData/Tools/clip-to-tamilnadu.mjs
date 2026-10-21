#!/usr/bin/env node

/**
 * unity/MapData/Tools/clip-to-tamilnadu.mjs
 *
 * Authoritative, reproducible GIS extraction and clipping pipeline for The Whispering Wilds.
 * Extracts authentic vector geometry for Tamil Nadu from pinned, immutable Natural Earth v5.1.2
 * datasets and generates RFC 7946 GeoJSON files under unity/MapData/Raw/ along with a
 * cryptographic sources manifest.
 *
 * Implements:
 * 1. Pinned immutable upstream commit: f1890d9f152c896d250a77557a5751a93d494776 (Natural Earth v5.1.2)
 * 2. Separate .upstream_cache/ folder to prevent regeneration from reusing clipped files
 * 3. Cohen-Sutherland line clipping with exact segment intersection calculation at bounding box edges
 * 4. Sutherland-Hodgman polygon clipping for authentic physical geography regions
 * 5. Extraction of authentic Natural Earth populated places (ADM1NAME === 'Tamil Nadu')
 * 6. Explicitly separated curated campaign anchor hubs (campaign_anchors.geojson)
 * 7. Fail-closed hash verification against drift
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_DIR = path.resolve(__dirname, '../Raw');
const CACHE_DIR = path.join(RAW_DIR, '.upstream_cache');

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

// Bounding box for Tamil Nadu mainland & immediate coastal waters (WGS84 degrees)
const TN_BBOX = [76.15, 8.05, 80.35, 13.55]; // [minLon, minLat, maxLon, maxLat]
const [minLon, minLat, maxLon, maxLat] = TN_BBOX;

const UPSTREAM_COMMIT = 'f1890d9f152c896d250a77557a5751a93d494776';
const UPSTREAM_TAG = 'v5.1.2';
const UPSTREAM_BASE_URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${UPSTREAM_COMMIT}/geojson/`;

const UPSTREAM_SOURCES = {
  admin1: {
    name: 'Natural Earth 10m Admin-1 States & Provinces',
    file: 'ne_10m_admin_1_states_provinces.geojson',
    url: `${UPSTREAM_BASE_URL}ne_10m_admin_1_states_provinces.geojson`,
    license: 'Public Domain',
    version: `${UPSTREAM_TAG} (commit ${UPSTREAM_COMMIT})`,
    expectedSha256: '22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5',
    expectedBytes: 40726851,
    attribution: 'Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.'
  },
  coastline: {
    name: 'Natural Earth 10m Coastline',
    file: 'ne_10m_coastline.geojson',
    url: `${UPSTREAM_BASE_URL}ne_10m_coastline.geojson`,
    license: 'Public Domain',
    version: `${UPSTREAM_TAG} (commit ${UPSTREAM_COMMIT})`,
    expectedSha256: '6f75ae0e0de157b14946e2255eb1f5486d9a13819032e26d4610852d296788f6',
    expectedBytes: 10110735,
    attribution: 'Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.'
  },
  rivers: {
    name: 'Natural Earth 10m Rivers & Lake Centerlines',
    file: 'ne_10m_rivers_lake_centerlines.geojson',
    url: `${UPSTREAM_BASE_URL}ne_10m_rivers_lake_centerlines.geojson`,
    license: 'Public Domain',
    version: `${UPSTREAM_TAG} (commit ${UPSTREAM_COMMIT})`,
    expectedSha256: 'bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a',
    expectedBytes: 7307743,
    attribution: 'Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.'
  },
  roads: {
    name: 'Natural Earth 10m Roads & Highways',
    file: 'ne_10m_roads.geojson',
    url: `${UPSTREAM_BASE_URL}ne_10m_roads.geojson`,
    license: 'Public Domain',
    version: `${UPSTREAM_TAG} (commit ${UPSTREAM_COMMIT})`,
    expectedSha256: '66a0c7b438e92fd124822cc5921cfa11042f48c294ade5e0f03f2c6640fd0248',
    expectedBytes: 50474096,
    attribution: 'Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.'
  },
  geography: {
    name: 'Natural Earth 10m Physical Geography Regions',
    file: 'ne_10m_geography_regions_polys.geojson',
    url: `${UPSTREAM_BASE_URL}ne_10m_geography_regions_polys.geojson`,
    license: 'Public Domain',
    version: `${UPSTREAM_TAG} (commit ${UPSTREAM_COMMIT})`,
    expectedSha256: 'b7b26e50ea917d3696aec87f932def2bf5f890f5770e441d59c162c6f4c92a77',
    expectedBytes: 5583870,
    attribution: 'Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.'
  },
  places: {
    name: 'Natural Earth 10m Populated Places',
    file: 'ne_10m_populated_places.geojson',
    url: `${UPSTREAM_BASE_URL}ne_10m_populated_places.geojson`,
    license: 'Public Domain',
    version: `${UPSTREAM_TAG} (commit ${UPSTREAM_COMMIT})`,
    expectedSha256: '9b8e3de09048ef00dfc70357dbb9fa324493f214b5e0ae4daf1aa79a8d10116b',
    expectedBytes: 19359003,
    attribution: 'Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.'
  }
};

function computeFileSha(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function countCoords(coords) {
  if (!Array.isArray(coords)) return 0;
  if (typeof coords[0] === 'number') return 1;
  return coords.reduce((acc, c) => acc + countCoords(c), 0);
}

async function getUpstreamSource(key) {
  const meta = UPSTREAM_SOURCES[key];
  const cachedPath = path.join(CACHE_DIR, meta.file);

  let rawBytes;
  if (fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 1000) {
    rawBytes = fs.readFileSync(cachedPath);
  } else {
    console.log(`Downloading upstream source '${meta.name}'...`);
    rawBytes = await new Promise((resolve, reject) => {
      https.get(meta.url, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download ${meta.url}: HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    });
    fs.writeFileSync(cachedPath, rawBytes);
  }

  const sha256 = crypto.createHash('sha256').update(rawBytes).digest('hex');
  if (meta.expectedSha256 && sha256.toLowerCase() !== meta.expectedSha256.toLowerCase()) {
    throw new Error(`Upstream source integrity failure for '${key}'! Expected ${meta.expectedSha256}, got ${sha256}`);
  }

  const json = JSON.parse(rawBytes.toString('utf8'));
  return {
    data: json,
    sha256,
    bytes: rawBytes.length
  };
}

// =====================================================================
// Cohen-Sutherland Line Clipping Algorithm
// =====================================================================
const INSIDE = 0, LEFT = 1, RIGHT = 2, BOTTOM = 4, TOP = 8;

function computeOutCode(x, y) {
  let code = INSIDE;
  if (x < minLon) code |= LEFT;
  else if (x > maxLon) code |= RIGHT;
  if (y < minLat) code |= BOTTOM;
  else if (y > maxLat) code |= TOP;
  return code;
}

export function clipSegmentCohenSutherland(x0, y0, x1, y1) {
  let code0 = computeOutCode(x0, y0);
  let code1 = computeOutCode(x1, y1);
  let accept = false;

  while (true) {
    if ((code0 | code1) === 0) {
      accept = true;
      break;
    } else if ((code0 & code1) !== 0) {
      break;
    } else {
      let x, y;
      const outcodeOut = code1 > code0 ? code1 : code0;
      if (outcodeOut & TOP) {
        x = x0 + (x1 - x0) * (maxLat - y0) / (y1 - y0);
        y = maxLat;
      } else if (outcodeOut & BOTTOM) {
        x = x0 + (x1 - x0) * (minLat - y0) / (y1 - y0);
        y = minLat;
      } else if (outcodeOut & RIGHT) {
        y = y0 + (y1 - y0) * (maxLon - x0) / (x1 - x0);
        x = maxLon;
      } else if (outcodeOut & LEFT) {
        y = y0 + (y1 - y0) * (minLon - x0) / (x1 - x0);
        x = minLon;
      }

      if (outcodeOut === code0) {
        x0 = x;
        y0 = y;
        code0 = computeOutCode(x0, y0);
      } else {
        x1 = x;
        y1 = y;
        code1 = computeOutCode(x1, y1);
      }
    }
  }

  if (!accept) return null;
  return [
    [Number(x0.toFixed(6)), Number(y0.toFixed(6))],
    [Number(x1.toFixed(6)), Number(y1.toFixed(6))]
  ];
}

export function clipLineString(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return [];
  const lines = [];
  let currentLine = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const [p0x, p0y] = coords[i];
    const [p1x, p1y] = coords[i + 1];
    const seg = clipSegmentCohenSutherland(p0x, p0y, p1x, p1y);

    if (seg) {
      const [startPt, endPt] = seg;
      if (currentLine.length === 0) {
        currentLine.push(startPt);
        currentLine.push(endPt);
      } else {
        const lastPt = currentLine[currentLine.length - 1];
        if (Math.abs(lastPt[0] - startPt[0]) < 1e-5 && Math.abs(lastPt[1] - startPt[1]) < 1e-5) {
          currentLine.push(endPt);
        } else {
          lines.push(currentLine);
          currentLine = [startPt, endPt];
        }
      }
    } else {
      if (currentLine.length >= 2) {
        lines.push(currentLine);
      }
      currentLine = [];
    }
  }

  if (currentLine.length >= 2) {
    lines.push(currentLine);
  }
  return lines;
}

function clipLineFeatures(features) {
  const out = [];
  for (const f of features) {
    if (!f.geometry || !f.geometry.coordinates) continue;
    const inputLines = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates];
    const clippedLines = inputLines.flatMap(clipLineString);
    if (clippedLines.length === 1) {
      out.push({
        type: 'Feature',
        properties: f.properties || {},
        geometry: { type: 'LineString', coordinates: clippedLines[0] }
      });
    } else if (clippedLines.length > 1) {
      out.push({
        type: 'Feature',
        properties: f.properties || {},
        geometry: { type: 'MultiLineString', coordinates: clippedLines }
      });
    }
  }
  return out;
}

// =====================================================================
// Sutherland-Hodgman Polygon Clipping Algorithm
// =====================================================================
export function clipPolygonRingToBbox(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return null;

  const edges = [
    { inside: p => p[0] >= minLon, intersect: (p1, p2) => [minLon, p1[1] + (p2[1] - p1[1]) * (minLon - p1[0]) / (p2[0] - p1[0])] },
    { inside: p => p[0] <= maxLon, intersect: (p1, p2) => [maxLon, p1[1] + (p2[1] - p1[1]) * (maxLon - p1[0]) / (p2[0] - p1[0])] },
    { inside: p => p[1] >= minLat, intersect: (p1, p2) => [p1[0] + (p2[0] - p1[0]) * (minLat - p1[1]) / (p2[1] - p1[1]), minLat] },
    { inside: p => p[1] <= maxLat, intersect: (p1, p2) => [p1[0] + (p2[0] - p1[0]) * (maxLat - p1[1]) / (p2[1] - p1[1]), maxLat] }
  ];

  let outputList = ring.slice();
  if (outputList.length > 1 &&
      outputList[0][0] === outputList[outputList.length - 1][0] &&
      outputList[0][1] === outputList[outputList.length - 1][1]) {
    outputList.pop();
  }

  for (const edge of edges) {
    const inputList = outputList;
    outputList = [];
    if (inputList.length === 0) break;

    let s = inputList[inputList.length - 1];
    for (const e of inputList) {
      if (edge.inside(e)) {
        if (!edge.inside(s)) outputList.push(edge.intersect(s, e));
        outputList.push(e);
      } else if (edge.inside(s)) {
        outputList.push(edge.intersect(s, e));
      }
      s = e;
    }
  }

  if (outputList.length < 3) return null;
  outputList.push([outputList[0][0], outputList[0][1]]);
  return outputList.map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))]);
}

// =====================================================================
// Main Pipeline Execution
// =====================================================================
export async function runPipeline() {
  console.log('=== AUTHORITATIVE TAMIL NADU GIS EXTRACTION & CLIPPING PIPELINE ===');
  console.log('Pinned Upstream Commit:', UPSTREAM_COMMIT);
  console.log('Target Directory:', RAW_DIR);

  const manifest = {
    pipelineVersion: '1.1.0',
    generatedAtUtc: new Date().toISOString(),
    projection: {
      canonicalOrigin: { latitude: 10.79, longitude: 78.37, description: 'Tiruchirappalli geographic center' },
      scaleUnitsPerMetre: 0.001,
      scaleDescription: '1 scene unit = 1 kilometre (1000 metres)',
      axes: '+X = East, +Z = North, +Y = Elevation',
      zoomLimits: { minHeightSceneUnits: 150, maxHeightSceneUnits: 2800 },
      model: 'Equirectangular projection with cosine latitude correction (cos 10.79 deg)'
    },
    sources: {},
    datasets: {}
  };

  // 1. Boundary: Extract Tamil Nadu state polygon from Natural Earth Admin-1
  console.log('\n[1/7] Processing State Boundary (tn_boundary.geojson)...');
  const admin1Source = await getUpstreamSource('admin1');
  manifest.sources.admin1 = {
    ...UPSTREAM_SOURCES.admin1,
    upstreamSha256: admin1Source.sha256,
    upstreamBytes: admin1Source.bytes,
    retrievalDate: '2026-10-21'
  };

  const tnFeature = admin1Source.data.features.find(f =>
    f.properties && (f.properties.name === 'Tamil Nadu' || f.properties.NAME === 'Tamil Nadu')
  );
  if (!tnFeature) throw new Error('Tamil Nadu boundary not found in upstream admin-1 dataset');

  const boundaryPath = path.join(RAW_DIR, 'tn_boundary.geojson');
  fs.writeFileSync(boundaryPath, JSON.stringify({ type: 'FeatureCollection', features: [tnFeature] }, null, 2), 'utf8');
  const boundarySha = computeFileSha(boundaryPath);
  manifest.datasets['tn_boundary.geojson'] = {
    source: 'admin1',
    transformation: 'Admin-1 State Boundary Extract',
    featureCount: 1,
    coordinateCount: countCoords(tnFeature.geometry.coordinates),
    sha256: boundarySha,
    sizeBytes: fs.statSync(boundaryPath).size
  };
  console.log(`  ✅ Boundary saved: 1 feature, ${manifest.datasets['tn_boundary.geojson'].coordinateCount} coordinates, SHA: ${boundarySha.slice(0, 16)}...`);

  // 2. Coastline: Clip Coromandel and Gulf of Mannar coastline with Cohen-Sutherland
  console.log('\n[2/7] Processing Coastline (tn_10m_coastline.geojson)...');
  const coastSource = await getUpstreamSource('coastline');
  manifest.sources.coastline = {
    ...UPSTREAM_SOURCES.coastline,
    upstreamSha256: coastSource.sha256,
    upstreamBytes: coastSource.bytes,
    retrievalDate: '2026-10-21'
  };

  const clippedCoast = clipLineFeatures(coastSource.data.features);
  const coastPath = path.join(RAW_DIR, 'tn_10m_coastline.geojson');
  fs.writeFileSync(coastPath, JSON.stringify({ type: 'FeatureCollection', features: clippedCoast }, null, 2), 'utf8');
  const coastSha = computeFileSha(coastPath);
  manifest.datasets['tn_10m_coastline.geojson'] = {
    source: 'coastline',
    transformation: 'Cohen-Sutherland Line Clipping to Tamil Nadu Coastal Bounding Box',
    featureCount: clippedCoast.length,
    coordinateCount: countCoords(clippedCoast.map(f => f.geometry.coordinates)),
    sha256: coastSha,
    sizeBytes: fs.statSync(coastPath).size
  };
  console.log(`  ✅ Coastline saved: ${clippedCoast.length} features, ${manifest.datasets['tn_10m_coastline.geojson'].coordinateCount} coordinates, SHA: ${coastSha.slice(0, 16)}...`);

  // 3. Rivers: Cauvery, Kollidam, Palar, Vaigai, Tamirabarani clipped with Cohen-Sutherland
  console.log('\n[3/7] Processing Rivers (tn_10m_rivers_lake_centerlines.geojson)...');
  const riverSource = await getUpstreamSource('rivers');
  manifest.sources.rivers = {
    ...UPSTREAM_SOURCES.rivers,
    upstreamSha256: riverSource.sha256,
    upstreamBytes: riverSource.bytes,
    retrievalDate: '2026-10-21'
  };

  const clippedRivers = clipLineFeatures(riverSource.data.features);
  const riverPath = path.join(RAW_DIR, 'tn_10m_rivers_lake_centerlines.geojson');
  fs.writeFileSync(riverPath, JSON.stringify({ type: 'FeatureCollection', features: clippedRivers }, null, 2), 'utf8');
  const riverSha = computeFileSha(riverPath);
  manifest.datasets['tn_10m_rivers_lake_centerlines.geojson'] = {
    source: 'rivers',
    transformation: 'Cohen-Sutherland Line Clipping to Tamil Nadu River Basin Bounding Box',
    featureCount: clippedRivers.length,
    coordinateCount: countCoords(clippedRivers.map(f => f.geometry.coordinates)),
    sha256: riverSha,
    sizeBytes: fs.statSync(riverPath).size
  };
  console.log(`  ✅ Rivers saved: ${clippedRivers.length} features, ${manifest.datasets['tn_10m_rivers_lake_centerlines.geojson'].coordinateCount} coordinates, SHA: ${riverSha.slice(0, 16)}...`);

  // 4. Roads: Major highway network clipped with Cohen-Sutherland
  console.log('\n[4/7] Processing Roads & Highways (tn_10m_roads.geojson)...');
  const roadSource = await getUpstreamSource('roads');
  manifest.sources.roads = {
    ...UPSTREAM_SOURCES.roads,
    upstreamSha256: roadSource.sha256,
    upstreamBytes: roadSource.bytes,
    retrievalDate: '2026-10-21'
  };

  const clippedRoads = clipLineFeatures(roadSource.data.features);
  const roadPath = path.join(RAW_DIR, 'tn_10m_roads.geojson');
  fs.writeFileSync(roadPath, JSON.stringify({ type: 'FeatureCollection', features: clippedRoads }, null, 2), 'utf8');
  const roadSha = computeFileSha(roadPath);
  manifest.datasets['tn_10m_roads.geojson'] = {
    source: 'roads',
    transformation: 'Cohen-Sutherland Line Clipping to Tamil Nadu Highway Network Bounding Box',
    featureCount: clippedRoads.length,
    coordinateCount: countCoords(clippedRoads.map(f => f.geometry.coordinates)),
    sha256: roadSha,
    sizeBytes: fs.statSync(roadPath).size
  };
  console.log(`  ✅ Roads saved: ${clippedRoads.length} features, ${manifest.datasets['tn_10m_roads.geojson'].coordinateCount} coordinates, SHA: ${roadSha.slice(0, 16)}...`);

  // 5. Geography regions: Extracted and clipped from Natural Earth Physical Geography
  console.log('\n[5/7] Processing Physical Geography Regions (tn_10m_geography_regions_polys.geojson)...');
  const geoSource = await getUpstreamSource('geography');
  manifest.sources.geography = {
    ...UPSTREAM_SOURCES.geography,
    upstreamSha256: geoSource.sha256,
    upstreamBytes: geoSource.bytes,
    retrievalDate: '2026-10-21'
  };

  const relevantRegions = geoSource.data.features.filter(f => {
    const name = (f.properties && f.properties.NAME) ? f.properties.NAME.toUpperCase() : '';
    if (name.includes('INDIA') || name.includes('SRI LANKA') || name.includes('ASIA')) return false;
    return ['WESTERN GHATS', 'SOUTHERN GHATS', 'EASTERN GHATS', 'COROMANDEL COAST', 'DECCAN PLATEAU'].some(n => name.includes(n));
  });

  const clippedRegions = [];
  for (const f of relevantRegions) {
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    const clippedPolys = [];
    for (const poly of polys) {
      const clippedRings = [];
      for (const ring of poly) {
        const cRing = clipPolygonRingToBbox(ring);
        if (cRing) clippedRings.push(cRing);
      }
      if (clippedRings.length > 0) clippedPolys.push(clippedRings);
    }
    if (clippedPolys.length > 0) {
      clippedRegions.push({
        type: 'Feature',
        properties: f.properties,
        geometry: {
          type: clippedPolys.length === 1 ? 'Polygon' : 'MultiPolygon',
          coordinates: clippedPolys.length === 1 ? clippedPolys[0] : clippedPolys
        }
      });
    }
  }

  const geoPath = path.join(RAW_DIR, 'tn_10m_geography_regions_polys.geojson');
  fs.writeFileSync(geoPath, JSON.stringify({ type: 'FeatureCollection', features: clippedRegions }, null, 2), 'utf8');
  const geoSha = computeFileSha(geoPath);
  manifest.datasets['tn_10m_geography_regions_polys.geojson'] = {
    source: 'geography',
    transformation: 'Sutherland-Hodgman Polygon Clipping to Tamil Nadu Physiographic Bounding Box',
    featureCount: clippedRegions.length,
    coordinateCount: countCoords(clippedRegions.map(f => f.geometry.coordinates)),
    sha256: geoSha,
    sizeBytes: fs.statSync(geoPath).size
  };
  console.log(`  ✅ Physical regions saved: ${clippedRegions.length} features, ${manifest.datasets['tn_10m_geography_regions_polys.geojson'].coordinateCount} coordinates, SHA: ${geoSha.slice(0, 16)}...`);

  // 6. Populated Places: Extracted from Natural Earth 10m Populated Places for Tamil Nadu
  console.log('\n[6/7] Processing Populated Places (tn_10m_populated_places.geojson)...');
  const placesSource = await getUpstreamSource('places');
  manifest.sources.places = {
    ...UPSTREAM_SOURCES.places,
    upstreamSha256: placesSource.sha256,
    upstreamBytes: placesSource.bytes,
    retrievalDate: '2026-10-21'
  };

  const tnPlaces = placesSource.data.features.filter(f =>
    f.properties && f.properties.ADM1NAME === 'Tamil Nadu'
  );

  const placesPath = path.join(RAW_DIR, 'tn_10m_populated_places.geojson');
  fs.writeFileSync(placesPath, JSON.stringify({ type: 'FeatureCollection', features: tnPlaces }, null, 2), 'utf8');
  const placesSha = computeFileSha(placesPath);
  manifest.datasets['tn_10m_populated_places.geojson'] = {
    source: 'places',
    transformation: 'Admin-1 Point Attribute Filter (ADM1NAME === "Tamil Nadu")',
    featureCount: tnPlaces.length,
    coordinateCount: tnPlaces.length,
    sha256: placesSha,
    sizeBytes: fs.statSync(placesPath).size
  };
  console.log(`  ✅ Populated places saved: ${tnPlaces.length} authentic settlements, SHA: ${placesSha.slice(0, 16)}...`);

  // 7. Curated Campaign Hubs Layer: Explicitly identified project gameplay metadata
  console.log('\n[7/7] Processing Campaign Hubs (campaign_anchors.geojson)...');
  const campaignAnchors = [
    {
      type: 'Feature',
      properties: {
        id: 'chennai',
        name: 'Chennai',
        NAME: 'Chennai',
        name_ta: 'சென்னை',
        scene: '02_Chennai_GeorgeTown',
        is_anchor: true,
        unlocked_by_default: true,
        featurecla: 'Admin-1 capital & mercantile port'
      },
      geometry: { type: 'Point', coordinates: [80.2885, 13.0880] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'mamallapuram',
        name: 'Mamallapuram',
        NAME: 'Mamallapuram',
        name_ta: 'மாமல்லபுரம்',
        scene: '06_Mamallapuram_Shore',
        is_anchor: true,
        unlocked_by_default: false,
        featurecla: 'UNESCO granite monolith heritage center'
      },
      geometry: { type: 'Point', coordinates: [80.1983, 12.6186] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'pichavaram',
        name: 'Pichavaram',
        NAME: 'Pichavaram',
        name_ta: 'பிச்சாவரம்',
        scene: '03_Pichavaram_Wetlands',
        is_anchor: true,
        unlocked_by_default: false,
        featurecla: 'Tidal mangrove estuarine ecosystem'
      },
      geometry: { type: 'Point', coordinates: [79.7797, 11.4289] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'thanjavur',
        name: 'Thanjavur',
        NAME: 'Thanjavur',
        name_ta: 'தஞ்சாவூர்',
        scene: '04_Thanjavur_Delta',
        is_anchor: true,
        unlocked_by_default: false,
        featurecla: 'Historic delta Brihadisvara cultural quarter'
      },
      geometry: { type: 'Point', coordinates: [79.1318, 10.7828] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'chettinad',
        name: 'Chettinad',
        NAME: 'Chettinad',
        name_ta: 'செட்டிநாடு',
        scene: '05_Chettinad_Mansion',
        is_anchor: true,
        unlocked_by_default: false,
        featurecla: 'Kanadukathan merchant heritage quarter'
      },
      geometry: { type: 'Point', coordinates: [78.7844, 10.0673] }
    },
    {
      type: 'Feature',
      properties: {
        id: 'nilgiris',
        name: 'Nilgiris',
        NAME: 'Nilgiris',
        name_ta: 'நீலகிரி',
        scene: '07_Nilgiris_Sanctuary',
        is_anchor: true,
        unlocked_by_default: false,
        featurecla: 'Shola-tea montane biosphere sanctuary'
      },
      geometry: { type: 'Point', coordinates: [76.6950, 11.4102] }
    }
  ];

  const anchorsPath = path.join(RAW_DIR, 'campaign_anchors.geojson');
  fs.writeFileSync(anchorsPath, JSON.stringify({ type: 'FeatureCollection', features: campaignAnchors }, null, 2), 'utf8');
  const anchorsSha = computeFileSha(anchorsPath);
  manifest.datasets['campaign_anchors.geojson'] = {
    source: 'project_curated',
    transformation: 'Authored Game Design Regional Bindings (Bilingual Tamil/English)',
    featureCount: campaignAnchors.length,
    coordinateCount: campaignAnchors.length,
    sha256: anchorsSha,
    sizeBytes: fs.statSync(anchorsPath).size
  };
  console.log(`  ✅ Campaign anchors saved: ${campaignAnchors.length} hubs, SHA: ${anchorsSha.slice(0, 16)}...`);

  // Write sources_manifest.json
  const manifestPath = path.join(RAW_DIR, 'sources_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n✅ Generated sources_manifest.json at ${manifestPath}`);
  console.log('All 7 GeoJSON datasets and cryptographic manifest ready for Unity import.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPipeline().catch(err => {
    console.error('Pipeline error:', err);
    process.exit(1);
  });
}
