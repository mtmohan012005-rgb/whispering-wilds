# Current HEAD QA Results & Verification Evidence
**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Date:** 20 October 2026  
**Active Working Branch:** `feature/unity-visual-gameplay-upgrade-20261020`  
**Base Commit SHA:** `1df8e4a1c5fb8544681512835a08691a47c4677c` (merge of PR #15)  
**Environment:** Unity 6000.6.3f1, Windows 11 x64, HDRP 17.7.0  

---

## 1. Automated Test Suite Execution Summary
| Test Suite | Total Tests | Passed | Failed | Skipped | Pass Rate | Truth Label | Evidence Reference |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Unity EditMode** | 78 | 78 | 0 | 0 | **100%** | `PASS_EDITMODE` | `Step50VerticalSliceTests.cs` |
| **Unity PlayMode** | 34 | 34 | 0 | 0 | **100%** | `PASS_PLAYMODE` | `CampaignProgressionTests.cs` (`test_results_PlayMode_20261020_132853.xml`) |
| **Native Unity Editor Rig Audit** | 10 | 10 | 0 | 0 | **100%** | `PASS_EDITOR` | `docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json` |
| **Unity Asset Reference Audit** | 9 Scenes / 10 Prefabs | Clean | 0 err / 0 warn | 0 | **100%** | `PASS_EDITOR` | `docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json` |
| **Backend Security Suite** | 34 | 34 | 0 | 0 | **100%** | `PASS_STATIC` | `scripts/test-backend-security.js` (exit 0) |
| **Total Automated** | **156** | **156** | **0** | **0** | **100%** | Verified clean native engine execution |

---

## 2. Standalone Windows Executable Runtime Telemetry
- **Executable Path:** `unity/Build/Windows/TheWhisperingWilds.exe`
- **Execution Arguments:** `-force-d3d11 -screen-fullscreen 0 -screen-width 1920 -screen-height 1080`
- **Framerate:** 58.5 – 60.0 FPS (V-Sync locked)
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
   - Real Unity Editor API inspection (`AssetDatabase`, `PrefabUtility`, `Animator`, `Avatar`, colliders) executed in native Unity 6 batchmode via `EditorCharacterRigAuditor.RunBatchAudit`: **10 / 10 PASS_EDITOR** recorded in [`docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/EDITOR_CHARACTER_RIG_AUDIT.json).
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
   - Verified 0 missing scripts, 0 null materials, 0 magenta error shaders, and 0 missing audio clips across all 9 release scenes in [`docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/UNITY_ASSET_REFERENCE_AUDIT.json).
3. **Quality Gaps Analysis:**
   - 15 specific 3D quality gaps catalogued with severity and owner recommendations in [`docs/audits/REAL_3D_QUALITY_GAPS.csv`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/REAL_3D_QUALITY_GAPS.csv), with NPC head geometry now verified `PASS_EDITOR_VERIFIED`.
4. **Scene Visual Acceptance:**
   - Visual criteria for all 9 enabled release scenes and 4 benchmark scenes documented in [`docs/audits/SCENE_VISUAL_ACCEPTANCE.csv`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/SCENE_VISUAL_ACCEPTANCE.csv).
5. **Whole-Game Test Matrix:**
   - Comprehensive traceability across 16 test rows maintained in [`docs/audits/WHOLE_GAME_TEST_MATRIX.csv`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/WHOLE_GAME_TEST_MATRIX.csv).
6. **Campaign Checklist:**
   - 60 manual campaign gameplay checks reconciled to 100% total in [`docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md): 38 `PASS_PLAYMODE`, 14 `PASS_STANDALONE`, 2 `PASS_STATIC`, 5 `NOT_TESTED_HUMAN_TACTILE`, 1 `BLOCKED_CREDENTIALS`.
7. **Live Cloud Save Integration:**
   - 1 live Firebase test classified as `SKIPPED / BLOCKED_CREDENTIALS` because external Google Cloud / Firebase service account secrets are not stored in repository code. Local persistence passed 100%.
8. **Multiplayer Synchronized Play:**
   - Classified as `NOT_TESTED_MULTI_CLIENT` (Socket.IO client/server endpoints pass automated tests; simultaneous live two-client network synchronization requires a dedicated multi-client harness).
9. **Audio Soundscape:**
   - 10 procedural WAV files catalogued as `BLOCKED_EXTERNAL_ASSET` in `assets/audio/AUDIO_LICENSE_MANIFEST.json` awaiting authentic Tamil Nadu field recordings.
