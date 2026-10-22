# WHOLE GAME AUDIT — THE WHISPERING WILDS (காட்டு வழி • தடம்)

**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Repository:** [https://github.com/mtmohan012005-rgb/whispering-wilds.git](https://github.com/mtmohan012005-rgb/whispering-wilds.git)  
**Engine & Version:** Unity 6 (`6000.6.3f1`, changeset `45d8eee7de74`)  
**Render Pipeline:** High Definition Render Pipeline (`HDRP 17.7.0`)  
**Target Platform:** Windows x64 Standalone (`TheWhisperingWilds.exe`), Direct3D 11 (`-force-d3d11`)  
**Current Audited Git Commit:** `defec347fa570533c3a6b8ef1facee49a1c3db76`  
**Historical Unity In-Engine Tested Commit:** `5056deb833a1254f0e41bf134151663a08cca5f8`  
**Latest Merged Main Commit:** `defec347fa570533c3a6b8ef1facee49a1c3db76`  
**Audit Branch:** `fix/audit-reconciliation-and-human-acceptance`  
**Audit Date:** 22 October 2026  
**Auditor:** Senior Unity Gameplay, Technical Artist, QA & Release Engineer  

---

## 1. Executive Summary & Automated Check Reconciliation

This audit was conducted directly on the real project files of *The Whispering Wilds*. Rather than relying on static assumptions or web mock-ups, every subsystem was inspected, executed, and reconciled against underlying test outputs and engine logs.

### 1.1 Automated Verification Check Reconciliation (391 Total Executions: 389 Passed, 0 Failed, 2 Skipped)
The test figures have been forensically reconciled into two distinct, documented verification tiers:

1. **Tier 1: Historical In-Engine Unity Editor Test & Audit Suite (Tested on Unity 6000.6.3f1, Direct3D 11, Commit `5056deb`):**
   - **EditMode Unit Tests:** 94 passed, 0 failed, 0 skipped ([`artifacts/test_results_EditMode.xml`](../../artifacts/test_results_EditMode.xml))
   - **PlayMode Runtime Tests:** 34 passed, 0 failed, 0 skipped ([`artifacts/test_results_PlayMode.xml`](../../artifacts/test_results_PlayMode.xml))
   - **Character Rig & Hierarchy Audit:** 10 production characters passed, 0 failed ([`artifacts/unity_character_rig_audit.log`](../../artifacts/unity_character_rig_audit.log) / `editor-rig-audit.json`)
   - **Scene & Asset Reference Integrity Audit:** 9 canonical scenes verified, 0 broken references across 293 materials, 57 textures, and 10 audio clips ([`artifacts/unity_asset_ref_audit.log`](../../artifacts/unity_asset_ref_audit.log) / `asset-reference-audit.json`)
   - **Standalone Windows Player Production Build:** 1 production build verified, 94 build steps clean, exit code 0 ([`artifacts/unity_standalone_build.log`](../../artifacts/unity_standalone_build.log) / `BUILD_REPORT.json`)
   - *Subtotal Unity In-Engine Checks:* **148 verified executions (148 passed, 0 failed, 0 skipped)**.

2. **Tier 2: Repository Automation, Security & Launcher Regression Suites (Tested on Node 18/20, Windows CI, Commit `defec34` / `6905b87`):**
   - **Backend Security Tests (`test-backend-security.js`):** 34 passed assertions (CSRF, CORS, session tokens, rate limiting, security headers)
   - **Cloud Save Regression Tests (`test-cloud-save-regression.js`):** 20 passed assertions, 2 skipped (Firebase credentials unconfigured), 6 client/server checksum parity vectors verified
   - **Game Architecture & Structure (`verify-game.js`):** 16 passed checks (assembly definitions, scene GUIDs, package manifest, Tamil font, NavMesh data)
   - **Production Readiness (`verify-production.js`):** 6 passed checks (zero browser remnants, room cap 5 max, security endpoints)
   - **Production Asset Verification (`verify-assets.js`):** 41 passed checks (36 manifest entries + player hero GLB + sub-checks)
   - **Tamil Nadu GIS Map Data & Negative Edge Fixtures (`verify-map-data.js`):** 37 passed checks (8 Natural Earth sources + 7 GeoJSON checksums/RFC 7946 + 2 extent + 6 hubs + 7 negative fixtures)
   - **Server Cleanup Regression (`verify-server-cleanup.js`):** 2 passed checks (process tree kill and port 3199 rebinding)
   - **Candidate Windows Launcher Provenance & Safety (`verify-candidate-launcher.js` / `tests/test-launcher-regression.ps1`):** 85 passed checks on Windows (archive SHA-256 validation, provenance markers, path traversal guards, duplicate process locking, binary tampering rejection, published v1.0.0 immutability guards)
   - *Subtotal Node.js / Windows Launcher Checks:* **243 verified executions: 241 passed, 0 failed, 2 skipped**.

**Grand Total Automated Checks:** **391 total executions: 389 passed, 0 failed, 2 skipped** across in-engine Unity runs and repository regression suites.

> [!IMPORTANT]
> **Static CI vs Unity In-Engine Execution:**  
> The GitHub Actions CI job `unity-static-checks` (running in 11–13 seconds on an Ubuntu runner) is a static repository sanity check (validating file existence, GUIDs, and assembly definitions). It is **not** an actual Unity Editor execution of the 34 PlayMode and 94 EditMode suites on the current commit. The PlayMode and EditMode suites were executed directly in Unity Editor 6000.6.3f1 on commit `5056deb` and are cataloged as historical in-engine runtime evidence.

---

## 2. Realistic 3D Human Characters Assessment

Character realism was inspected across the player character and all 9 regional NPCs:
- **Player Character Arun Kumar:**
  - Prefab: `Assets/_Project/Prefabs/Characters/PlayerCharacter.prefab`
  - Mesh Source: `Assets/_Project/Art/Models/Characters/Player/player.glb` (13 modular submeshes, 43 bone bindings, GenericAvatar, active `CharacterController`).
  - Textures: 2048×2048 PBR maps (Albedo, Normal, Roughness, Ambient Occlusion).
  - Realism Diagnosis: Optimized stylized PBR character. Credible at third-person gameplay distance; photogrammetric high-spec scan pass roadmapped for high-end graphic presets.
- **Regional Story & Working NPCs (9 Characters):**
  - Murugan, Velu, Selvam, Meenakshi, Artisan, Farmer, Fisher, ForestGuide, TeaWorker.
  - Mesh Source: Procedural 3D head meshes (`Assets/_Project/Art/Characters/Procedural/Mesh_Head_*.asset`).
  - Realism Diagnosis: **Culturally grounded stylized procedural geometry**, not photorealistic 3D scans. Each character possesses visually distinct regional headgear, facial hair, and attire (e.g. Madurai meesai for Murugan, handlebar moustache and red thalappa for Velu, kudumi and spectacles for Selvam, Kanchipuram silk sari and jasmine malligai poo for Meenakshi, towel turban for Farmer).
  - Animation: Wired to `NPCCharacter` AnimatorController with 17 states (talk, idle, gesture). Active `CapsuleCollider`. Rigs verified 10/10 in [`artifacts/whole-game-audit/visual-evidence/characters-contact-sheet.png`](visual-evidence/characters-contact-sheet.png). Blendshape facial lip-sync is scheduled for post-v1.0.1.

---

## 3. Tamil Nadu World, 9 Regional Scenes & GIS Provenance

### 3.1 Geographic Source Provenance
- State boundary linework and coastlines are sourced from upstream **Natural Earth 10m Cultural/Physical datasets** (v5.1.2) spanning real-world coordinates `(8.08° to 13.54° N, 76.23° to 80.35° E)`.
- The 6 regional campaign hub pins in `campaign_anchors.geojson` (Chennai, Mamallapuram, Pichavaram, Thanjavur, Chettinad, Nilgiris) are **curated regional gameplay anchors** projected into scene space via canonical origin `(10.79° N, 78.37° E)` and scale `(0.001 units/meter)`, rather than survey-grade monuments.

### 3.2 9 Canonical Playable Scenes
All 9 scenes are present in `Assets/_Project/Scenes/` and configured in `EditorBuildSettings.asset` with zero broken references:
1. `00_Boot`: Bilingual title UI, audio sliders, Noto Sans Tamil dynamic font (`PASS_PLAYMODE`).
2. `01_StateMap_TamilNadu`: Interactive 3D overworld map with raycast marker tooltips (`PASS_PLAYMODE`).
3. `02_Chennai_GeorgeTown`: Dense urban streetscape, bilingual street signs, Murugan NPC (`PASS_PLAYMODE`).
4. `03_Pichavaram_Wetlands`: Mangrove aerial roots, water reflections, boat dock, Fisher NPC (`PASS_PLAYMODE`).
5. `04_Thanjavur_Delta`: Cauvery delta paddy landscape, canal sluice gates, Farmer NPC (`PASS_PLAYMODE`).
6. `05_Chettinad_Mansion`: Valavu courtyard architecture, Athangudi tiles, teak pillars, Meenakshi NPC (`PASS_PLAYMODE`).
7. `06_Mamallapuram_Shore`: Granite coastal cliffs, Arjuna's Penance bas-relief monolith, ocean surf, Artisan NPC (`PASS_PLAYMODE`).
8. `07_Nilgiris_Sanctuary`: Western Ghats shola-grassland, contoured Camellia tea hedgerows, Toda Mund hut (`PASS_PLAYMODE`).
9. `08_Ancient_Temple_Ruins`: Dravidian granite Gopuram gateway, stepped Theertham tank (Kalyani), Kalvettu stele (`PASS_PLAYMODE`).

### 3.3 9 Cultural Asset Replacements Verified
9 generic placeholder models were replaced with authentic Dravidian cultural assets and verified via before/after captures in `visual-evidence/environment-fixes-before-after/`:
- Toda Mund barrel-vault dwelling replaces colonial cottage.
- Dravidian Gopuram gateway replaces iron gate.
- Tiered brass Kuthuvilakku replaces lantern.
- Camellia Sinensis tea hedgerow replaces wild fern.
- Arjuna's Penance bas-relief monolith replaces raw boulder.
- Granite Kalvettu epigraph stele replaces wooden signpost.
- Panchaloha temple Kalasam urn replaces domestic clay pot.
- Interlocking granite ashlar wall replaces brick wall.
- Stepped Theertham tank (Kalyani) replaces circular farm well.

---

## 4. Subsystem Audits & Audio Separation

### 4.1 Audio Engine vs Regional Field Recordings
- **Operational Audio Engine (`FEAT_AUDIO_ENG_14`):** **`PASS_PLAYMODE` / `PASS_STANDALONE`**. `AudioManager.cs` manages volume sliders, distance attenuation, and mixer snapshots without errors.
- **Authentic Regional Field Audio (`FEAT_AUDIO_RES_15`):** **`BLOCKED_EXTERNAL_ASSET`**. The 10 current audio files are clean procedural synthetic waveforms. On-location field recordings of George Town street chatter, Cauvery river ripples, Nilgiri Shola bird songs, and temple bells are pending acquisition under documented CC0/commercial licenses.

### 4.2 Save Data & Recovery Architecture
- **Save System v4:** Atomic temporary-file writes, SHA-256 payload integrity validation, schema migration, and automatic corrupt-file `.bak` recovery (`PASS_PLAYMODE`).

---

## 5. Truthful Release Gate Disposition

| Release Gate | Required Verification | Status | Active Disposition |
| :--- | :--- | :---: | :--- |
| **Human Walkthrough** | Physical playthrough of 12-step campaign on target PC | `NOT_TESTED_HUMAN` | Detailed protocol prepared in `docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md`. |
| **Firebase Cloud Sync** | Live production credentials for cloud save synchronization | `BLOCKED_CREDENTIALS` | Offline local save v4 operates 100%; cloud endpoints safely return 503. |
| **Authentic Regional Audio** | Documented on-location Tamil Nadu field recordings | `BLOCKED_EXTERNAL_ASSET` | Audio engine fully functional with clean prototype waveforms. |
| **Two-Client Multiplayer** | Simultaneous 2-player state replication across 2 physical PCs | `NOT_TESTED_MULTI_CLIENT` | Single-player exploration vertical slice verified. |

---

## 6. Deliverable Directory Reference

- [**`WHOLE_GAME_AUDIT.md`**](WHOLE_GAME_AUDIT.md) — This executive report.
- [**`feature-matrix.csv`**](feature-matrix.csv) — Feature matrix with separated audio engine vs audio content.
- [**`character-rig-matrix.csv`**](character-rig-matrix.csv) — Character rig matrix with explicit procedural geometry labels and photorealism status.
- [**`scene-acceptance-matrix.csv`**](scene-acceptance-matrix.csv) — 9 campaign scenes with GIS provenance notes.
- [**`asset-duplicates.csv`**](asset-duplicates.csv) — 9 replaced cultural models and shared PBR textures.
- [**`test-results.json`**](test-results.json) — 389 reconciled automated checks across Unity in-engine and Node/Windows suites.
- [**`visual-evidence/INDEX.md`**](visual-evidence/INDEX.md) — 19 in-engine 1920×1080 GPU captures with file sizes and SHA-256 hashes.
- [**`release-blockers.md`**](release-blockers.md) — Prioritized P0–P3 blockers and external gate statuses.
- [**`../../docs/FULL_GAME_DEVELOPMENT_ROADMAP.md`**](../../docs/FULL_GAME_DEVELOPMENT_ROADMAP.md) — Full game development roadmap.
- [**`../../docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md`**](../../docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md) — Manual campaign acceptance record.
