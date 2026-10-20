# Current HEAD QA Results & Verification Evidence
**Project:** The Whispering Wilds (காட்டு வழி • தடம்)  
**Date:** 20 October 2026  
**Active Working Branch:** `fix/real-3d-runtime-acceptance-20261020`  
**Base Commit SHA:** `2dbcc3aff0f7d2031604f535946130d8ff46b590` (merge of PR #14)  
**Environment:** Unity 6000.6.3f1, Windows 11 x64, HDRP 17.7.0  

---

## 1. Automated Test Suite Execution Summary
| Test Suite | Total Tests | Passed | Failed | Skipped | Pass Rate | Truth Label | Evidence Reference |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Unity EditMode** | 78 | 78 | 0 | 0 | **100%** | `PASS_EDITMODE` | `Step50VerticalSliceTests.cs` |
| **Unity PlayMode** | 34 | 34 | 0 | 0 | **100%** | `PASS_PLAYMODE` | `CampaignProgressionTests.cs` (`test_results_PlayMode_20261020_132853.xml`) |
| **Backend Security Suite** | 34 | 34 | 0 | 0 | **100%** | `PASS_STATIC` | `scripts/test-backend-security.js` (exit 0) |
| **Total Automated** | **146** | **146** | **0** | **0** | **100%** | Verified clean execution |

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

1. **Character Rigs & Modular Meshes:**
   - Static YAML parsing (`scripts/measure_character_rigs_dynamically.py`) is truthfully labeled `PASS_STATIC` / `STATIC_STRUCTURE_ONLY` in [`docs/audits/CHARACTER_RUNTIME_VALIDATION.csv`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/CHARACTER_RUNTIME_VALIDATION.csv).
   - Real Unity Editor API inspection (`AssetDatabase`, `PrefabUtility`, `Animator`, `Avatar`) is implemented in `unity/Assets/_Project/Scripts/Editor/QA/EditorCharacterRigAuditor.cs` (`PASS_EDITOR`).
   - Modular characters use an authentic `Generic` avatar (`GenericAvatar.asset`, built via `AvatarBuilder.BuildGenericAvatar` with 43 bone bindings) driving custom procedural clips, rather than an automatic Humanoid retargeter.
2. **Quality Gaps Analysis:**
   - 15 specific 3D quality gaps (NPC facial mesh diversity, Toda Mund models, Dravidian granite temple walls, authentic Tamil Nadu audio) are catalogued with severity and owner recommendations in [`docs/audits/REAL_3D_QUALITY_GAPS.csv`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/REAL_3D_QUALITY_GAPS.csv).
3. **Scene Visual Acceptance:**
   - Visual criteria for all 9 enabled release scenes and 4 benchmark scenes are documented in [`docs/audits/SCENE_VISUAL_ACCEPTANCE.csv`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/SCENE_VISUAL_ACCEPTANCE.csv).
4. **Whole-Game Test Matrix:**
   - Comprehensive traceability across 16 test rows is maintained in [`docs/audits/WHOLE_GAME_TEST_MATRIX.csv`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/WHOLE_GAME_TEST_MATRIX.csv).
5. **Campaign Checklist:**
   - 60 manual campaign gameplay checks are categorized into `PASS_STANDALONE` (10), `PASS_PLAYMODE` (43), `NOT_TESTED_HUMAN_TACTILE` (5), and `BLOCKED_CREDENTIALS` (2) in [`docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md`](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/docs/audits/MANUAL_CAMPAIGN_TEST_RECORD.md).
6. **Live Cloud Save Integration:**
   - 2 live Firebase tests classified as `SKIPPED / BLOCKED_CREDENTIALS` because external Google Cloud / Firebase service account secrets are not stored in repository code. Local persistence passed 100%.
7. **Multiplayer Synchronized Play:**
   - Classified as `NOT_TESTED_MULTI_CLIENT` (Socket.IO client/server endpoints pass automated tests; simultaneous live two-client network synchronization requires a dedicated multi-client harness).
8. **Audio Soundscape:**
   - 10 procedural WAV files catalogued as `BLOCKED_EXTERNAL_ASSET` in `assets/audio/AUDIO_LICENSE_MANIFEST.json` awaiting authentic Tamil Nadu field recordings.
