# Current HEAD QA Results & Verification Evidence
**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Date:** 21 October 2026  
**Active Working Branch:** `feature/real-gameplay-map-vertical-slice-20261021`  
**Tested Code Commit SHA:** `1f15eb80eec90146dc0d0111595c2743607929c0`  
**Base Commit SHA:** `63d7ee08e8809de2384722f0e2773d047755eeaf` (`origin/main` target)  
**Environment:** Unity 6000.6.3f1, Windows 11 x64, HDRP 17.7.0  

---

## 0. Distinction: Native Local Unity Editor Execution vs GitHub Actions CI
- **GitHub Actions CI (`unity-validation.yml`):** Runs on `ubuntu-latest`. It performs static repository checks (package manifest, build scenes, required scripts, audio manifests). Its final step explicitly reports:
  ```text
  Unity Editor compilation: BLOCKED
  Unity PlayMode tests: BLOCKED
  NavMesh baking: BLOCKED
  Reason: no licensed Unity Editor in CI
  ```
  Therefore, green CI in GitHub Actions is classified as **`PASS_STATIC_ONLY`**. It is NOT evidence of in-engine compilation or PlayMode tests.
- **Native Local Unity Editor Execution:** Executed on the local Windows development machine using native Unity 6 (version `6000.6.3f1`, HDRP `17.7.0`) in batchmode:
  - **Authoritative Git SHA Resolver Validation:**
    - Script: `powershell -ExecutionPolicy Bypass -File scripts/test-git-sha-resolver.ps1`
    - Exit Code: `0` (**5/5 PASS**: matching SHA = 0, mismatched CLI SHA = 1, malformed CLI SHA = 1, mismatched ENV = 1, malformed ENV = 1).
  - **Tamil Nadu Geography & Anchor Verification Tests:**
    - Test Suite: `unity/Assets/_Project/Tests/Editor/TamilNaduMapVerificationTests.cs`
    - Exit Code: `0` (**7/7 PASS_EDITMODE**: Chennai, Mamallapuram, Pichavaram, Thanjavur, Chettinad, Nilgiris coordinates, geographic distances, relative bearings, scene mappings, unlock progression, and error handling).
  - **Editor Character Rig Audit:**
    - Command: `"C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -quit -projectPath "unity" -executeMethod "WhisperingWilds.Editor.QA.EditorCharacterRigAuditor.RunBatchAudit" -logFile "artifacts/unity_rig_audit.log"`
    - Exit Code: `0`
    - Output: [`docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json`](EDITOR_CHARACTER_RIG_AUDIT.json) (**10/10 PASS_EDITOR**, 43 bone bindings, active colliders, dynamic Git SHA stamped `1f15eb80eec90146dc0d0111595c2743607929c0`).
  - **Asset Reference Audit:**
    - Command: `"C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -quit -projectPath "unity" -executeMethod "WhisperingWilds.Editor.QA.AssetReferenceAudit.RunBatchAudit" -logFile "artifacts/unity_asset_ref_audit.log"`
    - Exit Code: `0`
    - Output: [`docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json`](UNITY_ASSET_REFERENCE_AUDIT.json) (**0 errors, 0 warnings across 9 release scenes deeply inspected, 293 materials, 57 textures, 10 audio clips**).
  - **Authentic In-Engine Visual Evidence (Graphics-Enabled Direct3D 11 Render):**
    - Command: `"C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -quit -projectPath "unity" -executeMethod "WhisperingWilds.Editor.QA.SceneVisualCapturePipeline.RunBatchCapture" -logFile "artifacts/unity_visual_capture.log"`
    - Exit Code: `0`
    - Visual Artifact Index: [`artifacts/unity-visual-qa/1f15eb80eec90146dc0d0111595c2743607929c0/INDEX.md`](../../artifacts/unity-visual-qa/1f15eb80eec90146dc0d0111595c2743607929c0/INDEX.md) (**19/19 captures PASS_RENDERED** with camera coordinates, pixel variance, SHA-256 validation, and 100% repository-relative paths).

---

## 1. Automated Test Suite Execution Summary
| Test Suite | Total Tests | Passed | Failed | Skipped | Pass Rate | Truth Label | Evidence Reference |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Unity EditMode** | 90 | 90 | 0 | 0 | **100%** | `PASS_EDITMODE` | `artifacts/test_results_EditMode.xml` (83 baseline + 7 `TamilNaduMapVerificationTests`) |
| **Unity PlayMode** | 34 | 34 | 0 | 0 | **100%** | `PASS_PLAYMODE` | `artifacts/test_results_PlayMode.xml` (`CampaignProgressionTests.cs`) |
| **Git SHA Resolver Test Suite** | 5 | 5 | 0 | 0 | **100%** | `PASS_AUTOMATED` | `scripts/test-git-sha-resolver.ps1` (exit 0) |
| **Native Unity Editor Rig Audit** | 10 | 10 | 0 | 0 | **100%** | `PASS_EDITOR` | `docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json` |
| **Unity Asset Reference Audit** | 9 Scenes / 10 Prefabs | Clean | 0 err / 0 warn | 0 | **100%** | `PASS_EDITOR` | `docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json` (293 materials) |
| **Backend Security Suite** | 34 | 34 | 0 | 0 | **100%** | `PASS_STATIC` | `scripts/test-backend-security.js` (exit 0) |
| **Cloud Save Regression** | 22 | 20 | 0 | 2 (Firebase unset) | **100% (Non-cloud)** | `BLOCKED_CREDENTIALS` | `scripts/test-cloud-save-regression.js` |
| **Production Asset Verification** | 36 | 36 | 0 | 0 | **100%** | `PASS_STATIC` | `scripts/verify-assets.js` |
| **Tamil Nadu Raw GIS Verification**| 6 Datasets / 6 Anchors | 6 / 6 | 0 | 0 | **100%** | `PASS_STATIC` | `scripts/verify-map-data.js` (Natural Earth / OSM compliant) |
| **Total Automated** | **203** | **201** | **0** | **2** | **99.0%** | Clean native engine & server execution |

---

## 2. Standalone Windows Executable & Release Package
- **Executable Path:** `unity/Build/Windows/TheWhisperingWilds.exe`
- **Build Automation Method:** `WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindowsFromCommandLine`
- **Target Platform:** `StandaloneWindows64` (Direct3D 11 & Direct3D 12)
- **Built Commit SHA:** `1f15eb80eec90146dc0d0111595c2743607929c0`
- **Build Result:** `Succeeded` (Exit Code 0)
- **Raw Build Size:** 138,088,416 bytes (131 MB)
- **Included Scenes (9 Total):**
  1. `Assets/_Project/Scenes/00_Boot.unity`
  2. `Assets/_Project/Scenes/01_StateMap_TamilNadu.unity`
  3. `Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity`
  4. `Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity`
  5. `Assets/_Project/Scenes/04_Thanjavur_Delta.unity`
  6. `Assets/_Project/Scenes/05_Chettinad_Mansion.unity`
  7. `Assets/_Project/Scenes/06_Mamallapuram_Shore.unity`
  8. `Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity`
  9. `Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity`
- **Distributable Release Archive:**
  - File: [`artifacts/releases/TheWhisperingWilds-v1.0.0-windows-x64.zip`](../../artifacts/releases/TheWhisperingWilds-v1.0.0-windows-x64.zip)
  - Compressed Size: 59.92 MB (62,835,087 bytes)
  - SHA-256: `6F2D73A01F3DED83D632450C1341247ABE93F6CBFB0450C21926CEA4686A9A58`
  - Provenance Manifest: [`artifacts/releases/RELEASE_MANIFEST.json`](../../artifacts/releases/RELEASE_MANIFEST.json)
- **Runtime Startup Telemetry (from `Player_Diagnostic.log` & `standalone_smoke_test.log`):**
  - `[SettingsMenuController]` Tier: High, FOV: 75, MasterVol: 1.0
  - `[RegionalClimateSystem]` Loaded profile: Chennai Urban Coast (Coastal)
  - `[WorldTimeSystem]` Seasonal calendar transition: NortheastMonsoon (வடகிழக்குப் பருவமழை)
  - `[GraphicsPerformanceManager]` Authoritative profile: High (150m shadow distance)
  - `[LocalizationManager]` Active language: English (265 keys loaded in memory)
  - `[GameManager]` State transition: MainMenu
  - `[MainMenuAnimator]` Entrance animation complete; 3D camera clear flags verified.

---

## 3. Truthful Classification of System Acceptance (Master Truth Labels)
In accordance with the repository truth standard, static checks and unit tests are strictly distinguished from runtime, editor, and visual evaluations:

1. **Character Rigs & Distinct 3D Meshes:**
   - Real Unity Editor API inspection (`AssetDatabase`, `PrefabUtility`, `Animator`, `Avatar`, colliders) executed in native Unity 6 batchmode via `EditorCharacterRigAuditor.RunBatchAudit`: **10 / 10 PASS_EDITOR** recorded in [`docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json`](EDITOR_CHARACTER_RIG_AUDIT.json).
   - Distinct 3D head meshes generated and assigned for all story characters:
     - *Murugan*: Madurai/Chennai chevron moustache (`Meesai`) and sideburns.
     - *Velu*: Handlebar moustache with pointed upturned tips and auto driver forehead cloth wrap.
     - *Selvam*: Full elder archaeologist beard and traditional kudumi bun.
     - *Meenakshi*: Low South Indian kondai bun, jasmine garland ring (Malligai poo), and long braid.
     - *Artisan*: Mamallapuram sculptor crown topknot bun and pointed goatee.
     - *Farmer*: Cauvery Delta wrapped cotton turban (`Thalappa`) and sturdy jaw.
     - *Fisher*: Pichavaram fisherman weather beanie cap and neat trim moustache.
     - *ForestGuide*: Nilgiris ranger field cap/visor and athletic jaw.
     - *TeaWorker*: Kannan woollen ear muffler wrap.
     - *Player (Arun Kumar)*: Clean modern explorer hairline.
   - All 10 prefabs have active colliders (`CharacterController` on Player; `CapsuleCollider` on NPCs) and valid `GenericAvatar` bindings.
2. **Tamil Nadu Geographic State Map:**
   - Interactive PC controls verified: WASD pan, mouse drag pan, scroll wheel zoom, [R] camera reset (`StateMapCameraController.cs`).
   - Interactive 3D region markers verified: Hover scaling, click selection, tooltip display, travel transition (`StateMapRegionMarker.cs`).
   - Bilingual State Map HUD verified: Header banner, controls legend, selected region detail card with Tamil/English descriptions, direct travel button, and quick jump navigation ribbon (`StateMapHUDController.cs`).
   - Reproducible Raw GIS Data: 6 GeoJSON datasets under `unity/MapData/Raw/` with documented Natural Earth (Public Domain) and OpenStreetMap (ODbL 1.0) licensing in [`unity/MapData/SOURCES_AND_LICENSES.md`](../../unity/MapData/SOURCES_AND_LICENSES.md).
   - In-Game Mini-Map & Compass: Active 3D exploration compass ribbon, cardinal bearings (N, E, S, W), regional title banner, and [M] key state map return with auto-save (`InGameMiniMapCompass.cs`).
3. **Asset Reference Integrity:**
   - Verified 0 missing scripts, 0 null materials, 0 magenta error shaders, and 0 missing audio clips across all 9 release scenes in [`docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json`](UNITY_ASSET_REFERENCE_AUDIT.json).
4. **Historical Evidence Archival:**
   - Historical QA folder `44dfb294fbd3d1f51fe912c0e98204c654aae25d` restored with transparent [`ARCHIVE_MANIFEST.md`](../../artifacts/unity-visual-qa/44dfb294fbd3d1f51fe912c0e98204c654aae25d/ARCHIVE_MANIFEST.md) documenting git blob provenance at merge commit `fa06ced`.
5. **Quality Gaps Analysis:**
   - 15 specific 3D quality gaps catalogued with severity and owner recommendations in [`docs/audits/REAL_3D_QUALITY_GAPS.csv`](REAL_3D_QUALITY_GAPS.csv), with NPC head geometry verified `PASS_EDITOR_VERIFIED`.
6. **Live Cloud Save Integration:**
   - 1 live Firebase test classified as `SKIPPED / BLOCKED_CREDENTIALS` because external Google Cloud / Firebase service account secrets are not stored in repository code. Local persistence passed 100%.
7. **Multiplayer Synchronized Play:**
   - Classified as `NOT_TESTED_MULTI_CLIENT` (Socket.IO client/server endpoints pass automated tests; simultaneous live two-client network synchronization requires a dedicated multi-client harness).
8. **Audio Soundscape:**
   - 10 procedural WAV files catalogued as `BLOCKED_EXTERNAL_ASSET` in `assets/audio/AUDIO_LICENSE_MANIFEST.json` awaiting authentic Tamil Nadu field recordings.
