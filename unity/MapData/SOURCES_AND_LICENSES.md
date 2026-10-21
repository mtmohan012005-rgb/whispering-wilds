# Tamil Nadu GIS Map Data: Sources, Licenses, and Import Pipeline

## 1. Overview
The Tamil Nadu State Map in *The Whispering Wilds* provides a cartographically grounded, state-scale overview and exploration map linking authentic Tamil cultural regions with playable 3D environments.

This directory (`unity/MapData/`) contains the source GIS data and specifications required to deterministically regenerate the Unity mesh and data assets under `Assets/_Project/Resources/Geography/Generated/`.

## 2. Source Datasets and Licensing
All raw geographic datasets utilized in this pipeline are derived from public domain upstream sources and curated project metadata:

1. **Natural Earth (Public Domain)**
   - **Repository:** `nvkelso/natural-earth-vector`
   - **Pinned Commit:** `f1890d9f152c896d250a77557a5751a93d494776` (Release `v5.1.2`)
   - **Base URL:** `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/f1890d9f152c896d250a77557a5751a93d494776/geojson/`
   - **Datasets:**
     - Admin-1 States & Provinces (`ne_10m_admin_1_states_provinces.geojson`) — SHA-256: `22d0e3ad85eb3e27f17cabf8ba2d50e554fbc27a87796ff891d958185da62fb5`
     - Coastline (`ne_10m_coastline.geojson`) — SHA-256: `6f75ae0e0de157b14946e2255eb1f5486d9a13819032e26d4610852d296788f6`
     - Rivers & Lake Centerlines (`ne_10m_rivers_lake_centerlines.geojson`) — SHA-256: `bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a`
     - Roads & Highways (`ne_10m_roads.geojson`) — SHA-256: `66a0c7b438e92fd124822cc5921cfa11042f48c294ade5e0f03f2c6640fd0248`
     - Physical Geography Regions (`ne_10m_geography_regions_polys.geojson`) — SHA-256: `b7b26e50ea917d3696aec87f932def2bf5f890f5770e441d59c162c6f4c92a77`
     - Populated Places (`ne_10m_populated_places.geojson`) — SHA-256: `9b8e3de09048ef00dfc70357dbb9fa324493f214b5e0ae4daf1aa79a8d10116b`
   - **License:** Public Domain. "All versions of Natural Earth raster and vector map data found on this website are in the public domain. You may use the maps in any manner, including modifying the content and design, either personally or commercially." (https://www.naturalearthdata.com/about/terms-of-use/)
   - **Attribution:** "Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com."

2. **The Whispering Wilds Project Metadata (Curated Gameplay Layer)**
   - **Dataset:** `campaign_anchors.geojson`
   - **Description:** Curated geographic coordinates, target playable scenes, bilingual Tamil/English naming, and progression unlock gating for the 6 primary campaign hubs (Chennai George Town, Mamallapuram Shore, Pichavaram Wetlands, Thanjavur Delta, Chettinad Mansion, Nilgiris Sanctuary).
   - **License:** Dedicated to the public domain / Project-owned CC0-compatible asset.

*Note on OpenStreetMap:* Earlier provisional pipeline documentation mentioned OpenStreetMap; however, the authoritative vector linework for roads and rivers is derived entirely from the Natural Earth 10m datasets. No OpenStreetMap ODbL data is embedded in the runtime map assets.

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

| File | Format | Upstream Source | Transformation & Description |
| :--- | :--- | :--- | :--- |
| `tn_boundary.geojson` | GeoJSON Polygon | Natural Earth 10m Admin-1 | Official state boundary polygon of Tamil Nadu (1,071 vertices) |
| `tn_10m_coastline.geojson` | GeoJSON LineString | Natural Earth 10m Coastline | Coromandel & Gulf of Mannar coastlines clipped with Cohen-Sutherland |
| `tn_10m_rivers_lake_centerlines.geojson` | GeoJSON FeatureCollection | Natural Earth 10m Rivers | Cauvery, Kollidam, Palar, Vaigai clipped with Cohen-Sutherland |
| `tn_10m_roads.geojson` | GeoJSON FeatureCollection | Natural Earth 10m Roads | Major National Highways (NH 44, 45, 83, 81) clipped with Cohen-Sutherland |
| `tn_10m_geography_regions_polys.geojson` | GeoJSON FeatureCollection | Natural Earth 10m Physical Geography | Western Ghats, Coromandel Coast, Deccan Plateau clipped with Sutherland-Hodgman |
| `tn_10m_populated_places.geojson` | GeoJSON FeatureCollection | Natural Earth 10m Populated Places | 19 authentic Tamil Nadu urban centers filtered by `ADM1NAME === 'Tamil Nadu'` |
| `campaign_anchors.geojson` | GeoJSON FeatureCollection | Project Curated Metadata | 6 primary campaign regional hubs with bilingual labels and scene bindings |
| `sources_manifest.json` | JSON Manifest | Upstream & Pipeline Metadata | Immutable commit, URLs, licenses, SHA-256 hashes, and canonical projection |

## 5. Verification and Regeneration
- Run `node scripts/verify-map-data.js` (or `npm run test:map-data`) to validate RFC 7946 compliance, bounding coordinates, coordinate finiteness, polygon ring closure, SHA-256 checksums, and anchor coordinates.
- Run `node unity/MapData/Tools/clip-to-tamilnadu.mjs` to deterministically regenerate `unity/MapData/Raw/*.geojson` from upstream cached snapshots.
- In Unity Editor, execute menu: `Whispering Wilds -> Geography -> Import Tamil Nadu Map Data` to regenerate runtime ScriptableObjects and meshes under `Assets/_Project/Resources/Geography/Generated/`.
