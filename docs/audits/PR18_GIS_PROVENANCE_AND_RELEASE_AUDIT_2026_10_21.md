# The Whispering Wilds (காட்டு வழி • தடம்)
## PR #18 GIS Provenance, Fresh Build Evidence & Windows Release Verification Audit
**Audit Date:** 2026-10-21  
**Repository:** `https://github.com/mtmohan012005-rgb/whispering-wilds`  
**Pull Request:** [#18 — Real Gameplay and Tamil Nadu Map](https://github.com/mtmohan012005-rgb/whispering-wilds/pull/18)  
**Branch:** `feature/real-gameplay-map-vertical-slice-20261021`  
**Base Commit (`origin/main`):** `63d7ee08e8809de2384722f0e2773d047755eeaf`  
**Verified Code Commit SHA:** `5056deb833a1254f0e41bf134151663a08cca5f8`  
**Engine & Target:** Unity 6000.6.3f1 (HDRP 17.7.0), Windows x64, Direct3D 11 / Direct3D 12  

---

### Executive Summary

This audit establishes clean source provenance, deterministic raw GIS datasets from upstream Natural Earth, fresh native Unity in-engine visual evidence, and a verified standalone Windows x64 release candidate for Pull Request #18.

All 6 blocking findings identified in the previous review have been resolved:
1. **GIS Provenance:** All hand-authored synthetic geometries were removed from upstream-labeled layers. Upstream datasets are pinned to immutable commit `f1890d9f152c896d250a77557a5751a93d494776` of Natural Earth v5.1.2.
2. **Clipping Algorithms:** Replaced simple vertex bounding-box filtering with genuine Sutherland-Hodgman polygon clipping and Cohen-Sutherland line clipping.
3. **Data Separation & Attribution:** Campaign hubs (Chennai, Mamallapuram, Pichavaram, Thanjavur, Chettinad, Nilgiris) are authored into a dedicated `campaign_anchors.geojson` layer (`source: project_curated`). False claims of OpenStreetMap/ODbL consumption were removed from code, documentation, and the in-game HUD Credits window.
4. **Validation & Negative Testing:** Implemented an expanded validation suite with 7 negative and edge-case regression tests (open rings, out-of-bounds coords, non-finite coords, upstream hash drift, line clipping intersections, and deterministic output hashing). All 7 suites passed.
5. **Fresh Build & Evidence Provenance:** Reran native Unity EditMode (94/94 PASS), PlayMode (34/34 PASS), Character Rig audit (10/10 PASS), Asset Reference audit (0 missing refs), Standalone Windows x64 build (EXIT CODE 0), and GPU visual capture (19/19 scenes & contacts rendered). `BUILD_REPORT.json` matches the tested code commit `5056deb833a1254f0e41bf134151663a08cca5f8`.
6. **Release Manifest Verification:** Rebuilt the Windows candidate package `TheWhisperingWilds-v1.0.0-windows-x64.zip` directly from clean binaries, verified archive contents programmatically (208 entries including executable and data directory), and confirmed SHA-256 `AFF39CA7AA95516CA3E5EB8B5D7E33ACA456F877816734CD73E3CEA450705006` with `status: VERIFIED_CLEAN` and `isDirty: false`.

---

### 1. GIS Provenance Reconciliation

#### Pinned Upstream Sources (Natural Earth v5.1.2)
- Upstream Base URL: `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/f1890d9f152c896d250a77557a5751a93d494776`
- Upstream Commit: `f1890d9f152c896d250a77557a5751a93d494776` (Immutable)

| Layer | Upstream Dataset | Upstream SHA-256 | Transformed Output File | Transformed Output SHA-256 | Features |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **admin1** | `10m_cultural/ne_10m_admin_1_states_provinces.geojson` | `22d0e3ad85eb3e27...` | `tn_boundary.geojson` | `9c287073e505ff76...` | 1 |
| **coastline** | `10m_physical/ne_10m_coastline.geojson` | `6f75ae0e0de157b1...` | `tn_10m_coastline.geojson` | `33fea925f9f7fc2f...` | 5 |
| **rivers** | `10m_physical/ne_10m_rivers_lake_centerlines.geojson` | `bb854a900ecbd3b4...` | `tn_10m_rivers_lake_centerlines.geojson` | `9fa76672dd463756...` | 6 |
| **roads** | `10m_cultural/ne_10m_roads.geojson` | `66a0c7b438e92fd1...` | `tn_10m_roads.geojson` | `65b0552b438b3697...` | 28 |
| **geography** | `10m_physical/ne_10m_geography_regions_polys.geojson` | `b7b26e50ea917d36...` | `tn_10m_geography_regions_polys.geojson` | `dd177cb002b179ec...` | 5 |
| **places** | `10m_cultural/ne_10m_populated_places.geojson` | `9b8e3de09048ef00...` | `tn_10m_populated_places.geojson` | `0a39db09183211b1...` | 19 |
| **anchors** | *(Project Curated Gameplay Anchors)* | `N/A (curated)` | `campaign_anchors.geojson` | `08a258a46b180d7a...` | 6 |

#### Canonical Projection Agreement
- **Origin:** Latitude 10.79° N, Longitude 78.37° E
- **Scale:** `unitsPerMetre = 0.001` (1 Unity scene unit = 1 kilometre)
- **Axes:** +X East, +Z North, +Y Altitude
- All source files, C# importer classes, runtime shaders, and documentation strictly agree on these parameters.

---

### 2. Test Verification Ledger

| Suite | Scope | Target | Result | Exit Code | Evidence / Artifact |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Backend Security** | Node.js | Auth, tokens, session, rate limits | **PASS** | 0 | Automated test output |
| **Cloud Save Regression** | Node.js | Save envelopes, schema v4, FNV-1a checksums | **PASS** | 0 | Automated test output |
| **Game Verification** | Node.js | Unity project structure, assemblies, scenes | **PASS** | 0 | 16/16 checks passed |
| **Production Verification**| Node.js | Security endpoints, room cap, clean tree | **PASS** | 0 | All production checks passed |
| **Asset Verification** | Node.js | 36 curated models, player GLB, rigs | **PASS** | 0 | 36/36 audited assets READY |
| **Map Data & Regression** | Node.js | Manifest, 7 GeoJSONs, projection, 7 negative cases | **PASS** | 0 | Deterministic hashes verified |
| **Server Cleanup** | Node.js | Process tree lifecycle, port 3199 unbinding | **PASS** | 0 | Leak-free verified |
| **Unity EditMode Tests** | Unity 6000.6 | Editor unit tests, math, projection, parsing | **PASS** | 0 | `artifacts/test_results_EditMode.xml` (94/94) |
| **Unity PlayMode Tests** | Unity 6000.6 | Runtime tests, save/load, state machine | **PASS** | 0 | `artifacts/test_results_PlayMode.xml` (34/34) |
| **Character Rig Audit** | Unity 6000.6 | In-engine bone transforms & Animator hierarchy | **PASS** | 0 | `docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json` (10/10) |
| **Asset Reference Audit**| Unity 6000.6 | Serialized scene assets across 9 scenes | **PASS** | 0 | `docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json` (0 broken) |
| **Standalone Win64 Build**| Unity 6000.6 | Production StandaloneWindows64 executable | **PASS** | 0 | `unity/Build/Windows/BUILD_REPORT.json` (131 MB) |
| **Visual QA GPU Capture**| Unity 6000.6 | Real GPU rendering of 9 release scenes + contact | **PASS** | 0 | `artifacts/unity-visual-qa/5056deb.../` (19/19) |
| **Release Packaging** | PowerShell | ZIP creation, entry validation, SHA-256 calculation| **PASS** | 0 | `artifacts/releases/RELEASE_MANIFEST.json` |

---

### 3. Release Provenance & Artifact Integrity

#### Public Release vs Candidate Build
- **Currently Published GitHub Release:** `v1.0.0`
  - URL: `https://github.com/mtmohan012005-rgb/whispering-wilds/releases/tag/v1.0.0`
  - Asset Size: 62,835,087 bytes
  - Asset SHA-256: `6F2D73A01F3DED83D632450C1341247ABE93F6CBFB0450C21926CEA4686A9A58`
  - Status: Published historical asset (code revision `1f15eb80eec90146dc0d0111595c2743607929c0`). Left completely unmodified.
- **New Rebuilt Candidate Release:**
  - Asset: `artifacts/releases/TheWhisperingWilds-v1.0.0-windows-x64.zip`
  - Candidate Size: 62,868,410 bytes (59.96 MB)
  - Candidate SHA-256: `AFF39CA7AA95516CA3E5EB8B5D7E33ACA456F877816734CD73E3CEA450705006`
  - Tested Code Commit: `5056deb833a1254f0e41bf134151663a08cca5f8`
  - Manifest Status: `VERIFIED_CLEAN` (`isDirty: false`, `candidate: true`)
  - Target Release Tag: Recommend publishing as `v1.0.1` after human review and merge of PR #18.

---

### 4. PR #8 (`unity/full-3d-repair`) Comparative Audit

GitHub Status: 7 commits ahead, 74 commits behind `main`, `mergeable: false`.

#### Detailed Commit Analysis:
1. `62599b9`: *fix: cloud save contract, MEGA cleanup, and test runner*  
   **Status:** SUPERSEDED & ALREADY MERGED. The test runner (`scripts/run-all-tests.js`), save validation, and error code cleanups are already active in `main` and expanded in PR #18.
2. `35dcfa2`: *docs: add archived reports, repair report, and updated audit plan*  
   **Status:** ARCHIVAL DOCUMENTATION. Added historical Oct 19 audit markdown and JSON reports under `docs/archive/reports/`. None are required for runtime or current QA.
3. `55291de`: *ci: add backend and Unity validation GitHub Actions workflows*  
   **Status:** SUPERSEDED. Added initial CI workflows.
4. `99b88d9`: *docs: remove MEGA references, mark MEGA report as historical*  
   **Status:** SUPERSEDED. Already reflected across current documentation in `main` and PR #18.
5. `b398f2c`: *chore: remove GitHub Actions workflows (blocked by PAT workflow scope)*  
   **Status:** HARMFUL / REGRESSIVE. PR #8 deleted `.github/workflows/` because of a local PAT scope issue. In `main` and PR #18, these workflows are active and passing in GitHub Actions. Merging PR #8 would break CI.
6. `f86a726`: *docs: final repository status report*  
   **Status:** SUPERSEDED. Historical report from Oct 19, 2026.
7. `19f6046`: *docs: fresh repository status report*  
   **Status:** SUPERSEDED. Historical report from Oct 19, 2026.

#### Recommendation:
**Do not merge PR #8.** Close PR #8 with a comment noting that all meaningful code fixes are already in `main`/PR #18, and merging PR #8 would introduce merge conflicts and erroneously delete active GitHub Actions workflows.

---

### 5. Remaining Product Blockers & Honest Status

| Feature / Domain | Status | Explanation |
| :--- | :---: | :--- |
| **Firebase Cloud Sync** | `BLOCKED_CREDENTIALS` | Production and staging Firebase service account credentials are intentionally not committed. |
| **Authentic Regional Audio** | `BLOCKED_EXTERNAL_ASSET`| In-engine procedural ambient audio is active; authentic field recordings of local instruments and fauna are pending external licensing. |
| **Simultaneous Multiplayer** | `NOT_TESTED` | Current release slice is focused on single-player 3D narrative exploration. Real multi-client networked concurrency is not yet implemented. |
| **Interactive Walkthrough** | `NOT_TESTED_HUMAN` | Manifest honestly marks `interactive_walkthrough: NOT_TESTED_HUMAN` until full human playtest is recorded. Automated tests pass 100%. |
