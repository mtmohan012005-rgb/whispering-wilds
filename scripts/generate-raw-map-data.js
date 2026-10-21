/**
 * scripts/generate-raw-map-data.js
 *
 * Generates RFC 7946 compliant GeoJSON datasets under unity/MapData/Raw/
 * for reproducible importing into Unity via TamilNaduMapImporter.
 *
 * Datasets:
 * 1. tn_boundary.geojson (Polygon)
 * 2. tn_10m_coastline.geojson (MultiLineString)
 * 3. tn_10m_rivers_lake_centerlines.geojson (FeatureCollection of LineStrings)
 * 4. tn_10m_roads.geojson (FeatureCollection of LineStrings)
 * 5. tn_10m_geography_regions_polys.geojson (FeatureCollection of Polygons)
 * 6. tn_10m_populated_places.geojson (FeatureCollection of Points)
 */

const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../unity/MapData/Raw');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. tn_boundary.geojson
const boundary = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Tamil Nadu",
        NAME: "Tamil Nadu",
        adm0_a3: "IND",
        type: "State"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [80.32, 13.50], // Pulicat Lake / Andhra border
            [80.2885, 13.0880], // Chennai
            [80.1983, 12.6186], // Mamallapuram
            [79.95, 12.20], // Marakkanam
            [79.83, 11.93], // Puducherry perimeter
            [79.7797, 11.4289], // Pichavaram / Kollidam estuary
            [79.84, 10.76], // Nagapattinam
            [79.85, 10.30], // Point Calimere
            [79.35, 9.85],  // Palk Strait
            [79.30, 9.28],  // Mandapam / Rameswaram
            [78.50, 9.10],  // Gulf of Mannar
            [78.1348, 8.7642], // Thoothukudi
            [78.12, 8.49],  // Tiruchendur
            [77.75, 8.20],  // Radhapuram
            [77.55, 8.08],  // Kanniyakumari
            [77.30, 8.35],  // Western Ghats south
            [77.25, 8.98],  // Shenkottai / Tenkasi pass
            [77.55, 9.45],  // Rajapalayam
            [77.35, 10.01], // Bodinayakanur / Theni
            [76.95, 10.32], // Anaimalai / Valparai
            [76.70, 10.90], // Palghat gap border
            [76.6950, 11.4102], // Nilgiris / Ooty
            [76.55, 11.55], // Gudalur / Mudumalai
            [76.85, 11.75], // Moyar river gorge
            [77.20, 11.50], // Sathyamangalam
            [77.78, 12.12], // Hogenakkal / Dharmapuri
            [77.82, 12.73], // Hosur
            [78.50, 12.92], // Jolarpettai
            [79.1325, 12.9165], // Vellore
            [79.62, 13.18], // Tiruttani
            [79.90, 13.40], // Gummidipoondi
            [80.32, 13.50]  // Close ring
          ]
        ]
      }
    }
  ]
};

// 2. tn_10m_coastline.geojson
const coastline = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { featurecla: "Coastline", name: "Coromandel and Gulf of Mannar Coast" },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.32, 13.50],
          [80.2885, 13.0880],
          [80.1983, 12.6186],
          [79.95, 12.20],
          [79.83, 11.93],
          [79.7797, 11.4289],
          [79.84, 10.76],
          [79.85, 10.30],
          [79.35, 9.85],
          [79.30, 9.28],
          [78.50, 9.10],
          [78.1348, 8.7642],
          [78.12, 8.49],
          [77.75, 8.20],
          [77.55, 8.08]
        ]
      }
    }
  ]
};

// 3. tn_10m_rivers_lake_centerlines.geojson
const rivers = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Cauvery", NAME: "Cauvery", featurecla: "River" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.78, 12.12],
          [77.80, 11.80],
          [77.72, 11.34],
          [78.08, 10.96],
          [78.69, 10.82],
          [78.81, 10.83],
          [79.15, 10.85],
          [79.48, 10.95],
          [79.85, 11.14]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Kolidam", NAME: "Kolidam", featurecla: "River" },
      geometry: {
        type: "LineString",
        coordinates: [
          [78.81, 10.83],
          [79.10, 10.98],
          [79.40, 11.15],
          [79.60, 11.30],
          [79.7797, 11.4289]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Palar", NAME: "Palar", featurecla: "River" },
      geometry: {
        type: "LineString",
        coordinates: [
          [78.61, 12.68],
          [79.1325, 12.9165],
          [79.33, 12.92],
          [79.70, 12.83],
          [80.05, 12.60],
          [80.15, 12.51]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "River", NAME: "Vaigai", featurecla: "River" },
      geometry: {
        type: "LineString",
        coordinates: [
          [77.40, 9.60],
          [77.70, 9.80],
          [78.1198, 9.9252],
          [78.45, 9.65],
          [78.85, 9.40]
        ]
      }
    }
  ]
};

// 4. tn_10m_roads.geojson
const roads = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Major_Highway", label: "Major Highway", featurecla: "Major Highway" },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.2885, 13.0880], // Chennai
          [79.90, 12.90],
          [79.1325, 12.9165], // Vellore
          [78.50, 12.60],
          [78.15, 11.66],     // Salem
          [77.72, 11.34],     // Erode
          [76.9558, 11.0168]  // Coimbatore
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Road", label: "Road", featurecla: "Road" },
      geometry: {
        type: "LineString",
        coordinates: [
          [80.2885, 13.0880], // Chennai
          [80.1983, 12.6186], // Mamallapuram
          [79.83, 11.93],     // Puducherry
          [79.7797, 11.4289], // Pichavaram
          [79.4879, 10.9629], // Kumbakonam
          [79.1318, 10.7828], // Thanjavur
          [78.7844, 10.0673], // Chettinad
          [78.1198, 9.9252],  // Madurai
          [77.7567, 8.7139],  // Tirunelveli
          [77.55, 8.08]       // Kanniyakumari
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Unknown", label: "Unknown", featurecla: "Unknown" },
      geometry: {
        type: "LineString",
        coordinates: [
          [76.9558, 11.0168], // Coimbatore
          [76.85, 11.20],
          [76.73, 11.35],
          [76.6950, 11.4102]  // Nilgiris
        ]
      }
    }
  ]
};

// 5. tn_10m_geography_regions_polys.geojson
const regions = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Nilgiri Biosphere", NAME: "Nilgiri Biosphere", featurecla: "Mountain" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.50, 11.20],
            [76.90, 11.25],
            [76.85, 11.60],
            [76.45, 11.55],
            [76.50, 11.20]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Western Ghats Range", NAME: "Western Ghats Range", featurecla: "Mountain" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.80, 10.10],
            [77.30, 10.15],
            [77.40, 9.30],
            [77.10, 9.25],
            [76.80, 10.10]
          ]
        ]
      }
    }
  ]
};

// 6. tn_10m_populated_places.geojson
const places = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Chennai", NAME: "Chennai", POP_MAX: 8653521, POP_MIN: 7088403, LATITUDE: 13.0880, LONGITUDE: 80.2885 },
      geometry: { type: "Point", coordinates: [80.2885, 13.0880] }
    },
    {
      type: "Feature",
      properties: { name: "Mamallapuram", NAME: "Mamallapuram", POP_MAX: 15172, POP_MIN: 12000, LATITUDE: 12.6186, LONGITUDE: 80.1983 },
      geometry: { type: "Point", coordinates: [80.1983, 12.6186] }
    },
    {
      type: "Feature",
      properties: { name: "Pichavaram", NAME: "Pichavaram", POP_MAX: 5000, POP_MIN: 3000, LATITUDE: 11.4289, LONGITUDE: 79.7797 },
      geometry: { type: "Point", coordinates: [79.7797, 11.4289] }
    },
    {
      type: "Feature",
      properties: { name: "Thanjavur", NAME: "Thanjavur", POP_MAX: 290220, POP_MIN: 222943, LATITUDE: 10.7828, LONGITUDE: 79.1318 },
      geometry: { type: "Point", coordinates: [79.1318, 10.7828] }
    },
    {
      type: "Feature",
      properties: { name: "Chettinad", NAME: "Chettinad", POP_MAX: 35000, POP_MIN: 20000, LATITUDE: 10.0673, LONGITUDE: 78.7844 },
      geometry: { type: "Point", coordinates: [78.7844, 10.0673] }
    },
    {
      type: "Feature",
      properties: { name: "Nilgiris", NAME: "Nilgiris", POP_MAX: 88430, POP_MIN: 60000, LATITUDE: 11.4102, LONGITUDE: 76.6950 },
      geometry: { type: "Point", coordinates: [76.6950, 11.4102] }
    },
    {
      type: "Feature",
      properties: { name: "Madurai", NAME: "Madurai", POP_MAX: 1470755, POP_MIN: 1017865, LATITUDE: 9.9252, LONGITUDE: 78.1198 },
      geometry: { type: "Point", coordinates: [78.1198, 9.9252] }
    },
    {
      type: "Feature",
      properties: { name: "Coimbatore", NAME: "Coimbatore", POP_MAX: 1601438, POP_MIN: 1050721, LATITUDE: 11.0168, LONGITUDE: 76.9558 },
      geometry: { type: "Point", coordinates: [76.9558, 11.0168] }
    },
    {
      type: "Feature",
      properties: { name: "Kumbakonam", NAME: "Kumbakonam", POP_MAX: 140156, POP_MIN: 112000, LATITUDE: 10.9629, LONGITUDE: 79.4879 },
      geometry: { type: "Point", coordinates: [79.4879, 10.9629] }
    },
    {
      type: "Feature",
      properties: { name: "Thoothukudi", NAME: "Thoothukudi", POP_MAX: 410742, POP_MIN: 320000, LATITUDE: 8.7642, LONGITUDE: 78.1348 },
      geometry: { type: "Point", coordinates: [78.1348, 8.7642] }
    },
    {
      type: "Feature",
      properties: { name: "Vellore", NAME: "Vellore", POP_MAX: 484690, POP_MIN: 375000, LATITUDE: 12.9165, LONGITUDE: 79.1325 },
      geometry: { type: "Point", coordinates: [79.1325, 12.9165] }
    },
    {
      type: "Feature",
      properties: { name: "Tirunelveli", NAME: "Tirunelveli", POP_MAX: 473637, POP_MIN: 360000, LATITUDE: 8.7139, LONGITUDE: 77.7567 },
      geometry: { type: "Point", coordinates: [77.7567, 8.7139] }
    }
  ]
};

const files = [
  { name: 'tn_boundary.geojson', data: boundary },
  { name: 'tn_10m_coastline.geojson', data: coastline },
  { name: 'tn_10m_rivers_lake_centerlines.geojson', data: rivers },
  { name: 'tn_10m_roads.geojson', data: roads },
  { name: 'tn_10m_geography_regions_polys.geojson', data: regions },
  { name: 'tn_10m_populated_places.geojson', data: places }
];

for (const file of files) {
  const filePath = path.join(outDir, file.name);
  fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2), 'utf8');
  console.log(`Generated ${file.name} (${file.data.features.length} features, ${fs.statSync(filePath).size} bytes)`);
}

console.log('All 6 raw GeoJSON files successfully generated in unity/MapData/Raw/');
