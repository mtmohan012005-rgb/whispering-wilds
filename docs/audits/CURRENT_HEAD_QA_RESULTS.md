# Current HEAD QA Results & Verification Evidence
**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Date:** 20 October 2026  
**Active Working Branch:** `fix/qa-evidence-head-integrity` (PR #17)  
**Tested Code Commit SHA:** `069b04b3fb791275c63f64888efa3fd31bbca699`  
**Base Commit SHA:** `7e3955cbb92095fda94df58fa34e7ef9e80c7fd9` (`main` target)  
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
  - **Editor Character Rig Audit:**
    - Command: `"C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -quit -projectPath "unity" -executeMethod "WhisperingWilds.Editor.QA.EditorCharacterRigAuditor.RunBatchAudit" -logFile "artifacts/unity_rig_audit.log"`
    - Exit Code: `0`
    - Output: [`docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json`](EDITOR_CHARACTER_RIG_AUDIT.json) (**10/10 PASS_EDITOR**, 43 bone bindings, active colliders, dynamic Git SHA stamped `069b04b3fb791275c63f64888efa3fd31bbca699`).
  - **Asset Reference Audit:**
    - Command: `"C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -nographics -quit -projectPath "unity" -executeMethod "WhisperingWilds.Editor.QA.AssetReferenceAudit.RunBatchAudit" -logFile "artifacts/unity_asset_ref_audit.log"`
    - Exit Code: `0`
    - Output: [`docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json`](UNITY_ASSET_REFERENCE_AUDIT.json) (**0 errors, 0 warnings across 9 release scenes deeply inspected, 293 materials, 57 textures, 10 audio clips**).
  - **Authentic In-Engine Visual Evidence (Graphics-Enabled Direct3D 11 Render):**
    - Command: `"C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe" -batchmode -quit -projectPath "unity" -executeMethod "WhisperingWilds.Editor.QA.SceneVisualCapturePipeline.RunBatchCapture" -logFile "artifacts/unity_visual_capture.log"`
    - Exit Code: `0`
    - Visual Artifact Index: [`artifacts/unity-visual-qa/069b04b3fb791275c63f64888efa3fd31bbca699/INDEX.md`](../../artifacts/unity-visual-qa/069b04b3fb791275c63f64888efa3fd31bbca699/INDEX.md) (**19/19 captures PASS_RENDERED** with camera coordinates, pixel variance, SHA-256 validation, and 100% repository-relative paths).
  - **9 Culturally Grounded Environment Models Wired Into Scenes:**
    - `temple_gate.glb` (Dravidian Torana Gateway), `temple_wall.glb` (Ashlar precinct walls), `temple_urn.glb` (Kalasam finials), `temple_well.glb` (Stepped theertham Kalyani tank), `kuthu_vilakku.glb`, `stone_inscription.glb` instantiated into `08_Ancient_Temple_Ruins.unity`.
    - `stone_sculpture.glb` (Mamallapuram Bas-Relief Monolith) and `stone_carving_tools.glb` instantiated into `06_Mamallapuram_Shore.unity`.
    - `toda_mund_hut.glb`, `tea_hedge.glb`, and `tea_rows.glb` instantiated into `07_Nilgiris_Sanctuary.unity`.

---

## 1. Automated Test Suite Execution Summary
| Test Suite | Total Tests | Passed | Failed | Skipped | Pass Rate | Truth Label | Evidence Reference |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Unity EditMode** | 83 | 83 | 0 | 0 | **100%** | `PASS_EDITMODE` | `artifacts/test_results_EditMode.xml` (includes 5 `GitShaResolverTests`) |
| **Unity PlayMode** | 34 | 34 | 0 | 0 | **100%** | `PASS_PLAYMODE` | `artifacts/test_results_PlayMode.xml` (`CampaignProgressionTests.cs`) |
| **Native Unity Editor Rig Audit** | 10 | 10 | 0 | 0 | **100%** | `PASS_EDITOR` | `docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json` |
| **Unity Asset Reference Audit** | 9 Scenes / 10 Prefabs | Clean | 0 err / 0 warn | 0 | **100%** | `PASS_EDITOR` | `docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json` (293 materials) |
| **Backend Security Suite** | 34 | 34 | 0 | 0 | **100%** | `PASS_STATIC` | `scripts/test-backend-security.js` (exit 0) |
| **Cloud Save Regression** | 22 | 20 | 0 | 2 (Firebase unset) | **100% (Non-cloud)** | `BLOCKED_CREDENTIALS` | `scripts/test-cloud-save-regression.js` |
| **Production Asset Verification** | 36 | 36 | 0 | 0 | **100%** | `PASS_STATIC` | `scripts/verify-assets.js` |
| **Total Automated** | **185** | **183** | **0** | **2** | **98.9%** | Clean native engine & server execution |

---

## 2. Standalone Windows Executable Runtime Telemetry
- **Executable Path:** `unity/Build/Windows/TheWhisperingWilds.exe`
- **Execution Arguments:** `-force-d3d11 -screen-fullscreen 0 -screen-width 1920 -screen-height 1080`
- **Fresh Native Standalone Production Build:** Verified on branch `fix/qa-evidence-head-integrity` tested at commit `069b04b3fb791275c63f64888efa3fd31bbca699` (`BUILD_REPORT.json`).
  - **Build Result:** `Succeeded` (Exit Code 0)
  - **Build Duration:** 71.03s (HDRP player build, 131 MB)
  - **Total Package Size:** 138,048,180 bytes (131 MB)
  - **Target Scenes Built:** All 9 gameplay scenes (`00_Boot.unity` through `08_Ancient_Temple_Ruins.unity`)
- **Active Subsystems Verified at Launch:**
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
2. **Asset Reference Integrity:**
   - Verified 0 missing scripts, 0 null materials, 0 magenta error shaders, and 0 missing audio clips across all 9 release scenes in [`docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json`](UNITY_ASSET_REFERENCE_AUDIT.json).
3. **Quality Gaps Analysis:**
   - 15 specific 3D quality gaps catalogued with severity and owner recommendations in [`docs/audits/REAL_3D_QUALITY_GAPS.csv`](REAL_3D_QUALITY_GAPS.csv), with NPC head geometry now verified `PASS_EDITOR_VERIFIED`.
4. **Scene Visual Acceptance:**
   - Visual criteria for all 9 enabled release scenes and 4 benchmark scenes documented in [`docs/audits/SCENE_VISUAL_ACCEPTANCE.csv`](SCENE_VISUAL_ACCEPTANCE.csv).
5. **Whole-Game Test Matrix:**
   - Comprehensive traceability across 16 test rows maintained in [`docs/audits/WHOLE_GAME_TEST_MATRIX.csv`](WHOLE_GAME_TEST_MATRIX.csv).
6. **Campaign Checklist:**
   - 60 manual campaign gameplay checks reconciled to 100% total in [`docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md`](MANUAL_CAMPAIGN_TEST_RECORD.md): 38 `PASS_PLAYMODE`, 14 `PASS_STANDALONE`, 2 `PASS_STATIC`, 5 `NOT_TESTED_HUMAN_TACTILE`, 1 `BLOCKED_CREDENTIALS`.
7. **Live Cloud Save Integration:**
   - 1 live Firebase test classified as `SKIPPED / BLOCKED_CREDENTIALS` because external Google Cloud / Firebase service account secrets are not stored in repository code. Local persistence passed 100%.
8. **Multiplayer Synchronized Play:**
   - Classified as `NOT_TESTED_MULTI_CLIENT` (Socket.IO client/server endpoints pass automated tests; simultaneous live two-client network synchronization requires a dedicated multi-client harness).
9. **Audio Soundscape:**
   - 10 procedural WAV files catalogued as `BLOCKED_EXTERNAL_ASSET` in `assets/audio/AUDIO_LICENSE_MANIFEST.json` awaiting authentic Tamil Nadu field recordings.
