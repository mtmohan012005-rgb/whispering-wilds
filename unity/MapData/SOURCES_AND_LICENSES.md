# Tamil Nadu GIS Map Data: Sources, Licenses, and Import Pipeline

## 1. Overview
The Tamil Nadu State Map in *The Whispering Wilds* provides a cartographically grounded, state-scale overview and exploration map linking authentic Tamil cultural regions with playable 3D environments.

This directory (`unity/MapData/`) contains the source GIS data and specifications required to deterministically regenerate the Unity mesh and data assets under `Assets/_Project/Resources/Geography/Generated/`.

## 2. Source Datasets and Licensing
All raw geographic datasets utilized in this pipeline are derived from public domain and open-licensed data sources:

1. **Natural Earth (Public Domain)**
   - **Datasets:**
     - Admin 1 – States/Provinces Boundary (`ne_10m_admin_1_states_provinces`)
     - Coastline (`ne_10m_coastline`)
     - Rivers & Lake Centerlines (`ne_10m_rivers_lake_centerlines`)
     - Populated Places (`ne_10m_populated_places`)
     - Physical Geography Regions (`ne_10m_geography_regions_polys`)
   - **License:** Public Domain. "All versions of Natural Earth raster and vector map data found on this website are in the public domain. You may use the maps in any manner, including modifying the content and design, either personally or commercially." (https://www.naturalearthdata.com/about/terms-of-use/)
   - **Attribution:** "Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com."

2. **OpenStreetMap Contributors (ODbL 1.0)**
   - **Datasets:**
     - Major Highway Corridors: NH 16 (Coromandel), NH 32 (Kollidam), NH 81 (Cauvery Delta), NH 83 (Thanjavur), NH 38 (Chettinad), NH 181 (Sigur Ghat / Nilgiris).
     - River courses: Cauvery, Kollidam (Coleroon), Palar, Vaigai, Tamirabarani.
   - **License:** Open Database License (ODbL) 1.0 (https://opendatacommons.org/licenses/odbl/).
   - **Attribution:** "Contains information from OpenStreetMap and OpenStreetMap Foundation, which is made available under the Open Database License (ODbL)."

## 3. Geographic Bounds and Projection
- **Bounding Box (WGS84):**
  - South Latitude: `8.08° N` (Kanniyakumari)
  - North Latitude: `13.50° N` (Pulicat / Andhra border)
  - West Longitude: `76.20° E` (Nilgiris / Kerala border)
  - East Longitude: `80.35° E` (Coromandel Coast / Point Calimere)
- **Local Origin (LocalOrigin in `TamilNaduGeoReference`):**
  - Latitude: `10.79° N`
  - Longitude: `78.37° E` (Geographic center of Tamil Nadu near Tiruchirappalli)
- **Projection Model:**
  - Equirectangular projection with latitude cosine correction ($\cos(10.79^\circ) \approx 0.98233$) centered at $(10.79^\circ\text{ N}, 78.37^\circ\text{ E})$.
  - Ground scale: 1 scene unit = 1 kilometre (`unitsPerMetre = 0.001`).
  - Orientation: `+X` = East, `+Z` = North, `+Y` = Elevation (metres scaled by `unitsPerMetre`).
  - Interactive Camera Zoom Range: 150 scene units (regional detail) to 2800 scene units (entire state overview).

## 4. Raw Files (`unity/MapData/Raw/`) and Provenance Manifest
All datasets are clipped and verified via `unity/MapData/Tools/clip-to-tamilnadu.mjs` and documented in `unity/MapData/Raw/sources_manifest.json`:

| File | Format | Upstream Source | Description |
| :--- | :--- | :--- | :--- |
| `tn_boundary.geojson` | GeoJSON Polygon | Natural Earth 10m Admin 1 (`ne_10m_admin_1_states_provinces`) | Traceable state boundary polygon of Tamil Nadu |
| `tn_10m_coastline.geojson` | GeoJSON MultiLineString | Natural Earth 10m Coastline (`ne_10m_coastline`) | Coromandel and Gulf of Mannar coastlines |
| `tn_10m_rivers_lake_centerlines.geojson` | GeoJSON FeatureCollection | Natural Earth 10m Rivers & OSM | Cauvery, Kollidam, Palar, Vaigai, Tamirabarani rivers |
| `tn_10m_roads.geojson` | GeoJSON FeatureCollection | OpenStreetMap / Natural Earth 10m Roads | Major National Highways (NH 16, 32, 81, 83, 38, 181) connecting playable regions |
| `tn_10m_geography_regions_polys.geojson` | GeoJSON FeatureCollection | Natural Earth 10m Physical Geography | Nilgiris Biosphere and Western Ghats mountain ranges |
| `tn_10m_populated_places.geojson` | GeoJSON FeatureCollection | Natural Earth 10m Populated Places & Project Anchors | 12 key historic and regional centers with bilingual names |
| `sources_manifest.json` | JSON Manifest | Upstream metadata | Pinned source URLs, licenses, versions, and SHA-256 checksums |

## 5. Verification and Regeneration
- Run `node scripts/verify-map-data.js` (or `npm run test:map-data`) to validate RFC 7946 compliance, bounding coordinates, coordinate finiteness, polygon ring closure, SHA-256 checksums, and anchor coordinates.
- Run `node unity/MapData/Tools/clip-to-tamilnadu.mjs` to deterministically regenerate `unity/MapData/Raw/*.geojson` from upstream data.
- In Unity Editor, execute menu: `Whispering Wilds -> Geography -> Import Tamil Nadu Map Data` to regenerate runtime ScriptableObjects and meshes under `Assets/_Project/Resources/Geography/Generated/`.
