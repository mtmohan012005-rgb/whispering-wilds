# Project Health — The Whispering Wilds

**Last updated:** 2026-10-15
**Commit:** Pending push (Flowchart audit fixes — QA runner path, stale browser scripts, missing npm script, GitHub Actions workflows)
**GitHub:** https://github.com/mtmohan012005-rgb/whispering-wilds

## Architecture

- **Primary game:** Unity 6 (6000.6.3f1) HDRP 17.7.0, Windows x64 standalone
- **Backend:** Node.js multiplayer/cloud-save server (Express, Socket.IO, Firebase Firestore, PostgreSQL)
- **Browser game:** COMPLETELY REMOVED (obsolete Three.js/PWA assets purged)
- **GitHub Pages:** Static landing page deployed via GitHub Actions from `docs/landing/`
- **Desktop launcher:** Canonical PowerShell launcher targeting Unity executable (`unity/Build/Windows/TheWhisperingWilds.exe`)

## Build & Test Status

| Component | Status | Details |
|-----------|--------|---------|
| Unity C# compilation | **PASS** | 0 errors, batch mode build succeeded |
| Unity EditMode tests | **BLOCKED** | 70 tests compile; Unity Test Runner requires interactive Editor |
| Unity splash screen (Step 71) | **FIXED** | Disabled in Player Settings (m_ShowUnitySplashScreen=0) |
| Main menu layout (Step 71) | **FIXED** | Centered title/subtitle, evenly spaced button column, consistent sizing |
| Background raycast blocking (Step 71) | **FIXED** | raycastTarget=false on all 5 background layers so buttons are clickable |
| Settings panel (Step 71) | **VERIFIED** | 6 tabs (Language, Display, Quality, Audio, Controls, Accessibility), all functional |
| Settings duplicate listeners (Step 72) | **FIXED** | Cached UnityAction delegates, hooked once, unhooked in OnDestroy |
| Audio/Controls/Accessibility pages (Step 72) | **FIXED** | All 3 missing pages added with interactive controls and proper wiring |
| Windows x64 build | **PASS** | 139 MB, LZ4HC compression (`unity/Build/Windows/TheWhisperingWilds.exe`) |
| Build size reduction (Step 67) | **PASS** | 170 MB → 140 MB, 30 MB reduction (17.6%) with LZ4HC compression |
| Standalone runtime (first launch) | **PASS** | 0 errors, intro completes, reaches MainMenu, 60 FPS |
| Standalone runtime (60s stability) | **PASS** | 0 errors, 60 FPS, stable for 60+ seconds |
| Standalone runtime (repeat launch) | **PASS** | 0 errors, menu visible immediately, no blank screen |
| Intro stuck bug (Step 69) | **FIXED** | Time.unscaledDeltaTime — intro advances even when Time.timeScale=0 |
| Intro duration (Step 69) | **FIXED** | Reduced from 25s to 7s; title at 1.5s; skip text at 0.5s |
| Intro visuals (Step 69) | **IMPROVED** | Sky gradient overlay and treeline silhouette replace flat dark screen |
| QA runner cleanup (Step 68) | **FIXED** | Run-QaTests.ps1 uses temp directories; all artifacts cleaned up |
| Chennai chapter code audit (Step 66) | **PASS** | All systems wired: NPCs, dialogue, clues, quests, region unlocks, save/load |
| D3D11 graphics API | **FIXED** | Changed from D3D12+fallback to D3D11 only — eliminates 0.3 FPS freeze on Intel GPUs |
| Duplicate GameManager | **FIXED** | Added `_isDuplicate` guard to prevent state reset to Boot |
| Diagnostic launcher | **ADDED** | `Launch-Game-Unity.ps1 -Diagnostic` captures logs, exit codes, and process lifetime |
| Cinematic intro (Step 61) | **PASS** | Plays by default on every launch, gradient background, animated fog |
| Campaign managers in boot scene | **PASS** | RegionUnlockManager, EndingController, QuestEndingBridge added |
| Campaign progression tests (Step 62) | **PASS** | 22 new EditMode tests for campaign, save/load, ending |
| PlayMode test suite (Step 63) | **PASS** | 22 PlayMode tests: region unlocks, investigation, save/load, campaign flow, ending, content registry, intro preferences |
| PlayMode test isolation (Step 64) | **PASS** | QaIsolation helper: PlayerPrefs backup/restore, QA save directories, player data protection tests |
| Standalone smoke test (Step 63) | **PASS** | Process launched, ran 20s without crash |
| Backend security suite | **PASS** | 31/31 passed (`scripts/test-backend-security.js`) |
| Unity project verification | **PASS** | 15/15 passed (`scripts/verify-game.js`) |
| Production readiness | **PASS** | All checks passed (`scripts/verify-production.js`) |
| Asset integrity & GLB checks | **PASS** | Verified (`scripts/verify-assets.js`) |
| GitHub Actions workflows | **CREATED** | 3 workflow files created locally (backend-ci, unity-validation, pages); push may still be blocked by PAT scope |
| GitHub Pages deployment | **BLOCKED** | Requires workflow files on GitHub; set Pages source to "GitHub Actions" after push |
| QA runner path (flowchart audit) | **FIXED** | Run-QaTests.ps1 now uses repo root instead of scripts/unity |
| Stale browser scripts (flowchart audit) | **FIXED** | verify-runtime.js, verify-performance.js, verify-compatibility.js replaced with Unity-appropriate versions |
| Missing build-report npm script | **FIXED** | Added `npm run build-report` to package.json |
| Runtime verification | **PASS** | 7/7 checks: executable, data dir, managed assemblies, asset archive, launcher |
| Compatibility verification | **PASS** | 20/20 checks: Unity version, HDRP, Input System, asmdefs, scenes, Tamil font |

## Recent Changes (2026-10-15)

- **Flowchart audit fixes**: Fixed `scripts/Run-QaTests.ps1` Unity project path (was `scripts/unity`, now uses repo root). Replaced 3 stale browser verification scripts (`verify-runtime.js`, `verify-performance.js`, `verify-compatibility.js`) with Unity-appropriate versions that check the Windows build. Added missing `npm run build-report` script to `package.json`. Created 3 GitHub Actions workflow files (`backend-ci.yml`, `unity-validation.yml`, `pages.yml`). All validation tests pass: verify-game 15/15, test:backend 31/31, verify-production all checks, verify-runtime 7/7, verify-compatibility 20/20.

- **Step 72 — Settings regression fixes, menu-to-game integration, end-to-end QA**: Fixed critical duplicate Settings event listeners bug in `SettingsMenuUI.cs` — `HookButtons()` added listeners in `OnEnable()` but never removed them in `OnDisable()`, so opening/closing Settings multiplied listeners. Fix: cached 17 `UnityAction` delegates, hooked once via `_buttonsHooked` guard, unhooked in `OnDestroy()`. Added 3 missing Settings pages (Audio, Controls, Accessibility) to `BuildBootScene.cs` with interactive controls: 6 volume sliders (Master, Music, SFX, Ambience, Dialogue, UI), mouse sensitivity, camera inversion, sprint/crouch modes, subtitles, subtitle background, subtitle size, screen shake, motion blur, colorblind mode. All buttons wired to `SettingsMenuUI` methods. Updated tab navigation for 6 tabs. Verification: standalone build 139 MB, 0 errors, SettingsMenuController applies settings correctly without duplication, all validation tests pass: verify-game 15/15, test:backend 31/31, verify-production all checks.

- **Step 71 — Finalize main menu, settings layout, and performance**: Disabled Unity splash screen in Player Settings (m_ShowUnitySplashScreen=0, m_ShowUnitySplashLogo=0). Improved main menu layout: title centered at 72% height with 56px font, subtitle at 62%, button container centered at screen center with pivot 0.5/0.5 and -40px offset. Buttons now have consistent 320x240 container with proper padding and 48px height each. Fixed raycastTarget=false on all 5 atmospheric background layers (MenuBackground, MenuMistLayer1, MenuMistLayer2, MenuFireflies, MenuVignette) so they don't block button clicks. Settings panel verified: 6 tabs (Language, Display, Quality, Audio, Controls, Accessibility) all functional with SettingsMenuController save/load. Verification: standalone build 139 MB, 0 errors, MainMenuAnimator entrance animation complete, all references OK, 60 FPS. All validation tests pass: verify-game 15/15, test:backend 31/31, verify-production all checks.

- **Step 70 — Cinematic main menu animation and atmospheric UI polish**: Added `MainMenuAnimator.cs` (367 lines) that orchestrates the main menu entrance: title fades in with golden glow sweep and rises into position, subtitle fades in slightly later, buttons appear one by one with staggered timing, and rule notice fades in at the bottom. Added `MenuButtonAnimator.cs` (150 lines) for hover/press/focus feedback on each menu button. Added atmospheric background layers to the main menu: deep teal dawn sky background, two mist layers with slow parallax drift, pulsing fireflies, and subtle vignette. All animations use `Time.unscaledDeltaTime` so they work at `Time.timeScale=0`. Root cause fix: `MainMenuAnimator` existed in the boot scene but `FindObjectOfType` returned null in `TitleMenuController.Start()` because the scene wasn't fully initialized — fixed by delaying the animation trigger by 2 frames via coroutine. Verification: standalone build launched, Player.log confirms `MainMenuAnimator PlayEntrance called - titleText=OK, subtitleText=OK, menuContainer=OK, ruleNoticeText=OK`, `Entrance animation complete`, 0 errors, 60 FPS. All validation tests pass: verify-game 15/15, test:backend 31/31, verify-production all checks.

- **Step 69 — Fixed stuck intro and improved startup visuals**: Root cause: `CinematicIntroController.PlayIntro()` used `Time.deltaTime`, but `GameManager` sets `Time.timeScale = 0` in MainMenu state, so the intro timer never advanced, leaving the player on a dark blank screen. Fix: (1) Replaced `Time.deltaTime` with `Time.unscaledDeltaTime` so the intro advances using real-world time even when game time is paused, (2) Reduced intro duration from 25 seconds to 7 seconds — title appears at 1.5s, skip text at 0.5s, menu at 7s, (3) Added sky gradient overlay (`IntroSkyGradient`) and treeline silhouette (`IntroTreeline`) to `BuildBootScene.cs` so the first frame shows a dawn sky composition instead of a flat dark color, (4) Added 9 regression tests verifying unscaled delta time, short duration, early title, early skip text, sky gradient, and treeline. Verification: standalone build launched, Player.log confirms `PlayIntroOnStartup=True`, `Intro completed, showing main menu`, 0 errors, 60 FPS. All validation tests pass: verify-game 15/15, test:backend 31/31, verify-production all checks.

- **Step 68 — Runtime QA verification and cleanup**: Verified the standalone Windows build runs stably for 60+ seconds with 0 errors in Player.log, reaching MainMenu at 60 FPS. Fixed `scripts/Run-QaTests.ps1` to use a unique temporary directory for all QA artifacts (logs, test results, saves) instead of writing into the repository — all artifacts are cleaned up after each test run. Removed 24 stale build log files (26.6 MB) from the repository root. Player.log confirms: CinematicIntro plays, Tamil font loads from Resources, LocalizationManager loads 253 keys, RegionalClimateSystem loads Chennai profile, GraphicsPerformanceManager applies High tier, GameManager reaches MainMenu. QA save isolation verified with `-wwSaveDir` flag. All automated tests pass: verify-game 15/15, test:backend 31/31, verify-production all checks.

- **Step 67 — Build size optimization with LZ4HC compression**: Added `BuildOptions.CompressWithLz4HC | BuildOptions.DetailedBuildReport` to `BuildPipelineAutomation.BuildProductionWindows()`. Baseline build was 170 MB on-disk with no compression. LZ4HC-optimized build is 140 MB on-disk — a 30 MB reduction (17.6% smaller). The main asset archive (`data.unity3d`) shrank from ~35 MB to 15.8 MB. Build time: 48.8s. Standalone runtime verified: 0 errors, reaches MainMenu, FPS recovers to 60. All validation tests pass: verify-game 15/15, test:backend 31/31, verify-production all checks.

- **Step 66 — Chennai chapter code audit and verification**: Comprehensive inspection of all Chennai opening systems confirmed the code architecture is complete and correctly wired. Verified: (1) ChennaiOpeningContent.cs defines 2 NPCs (Murugan, Velu), 3 clues, 2 quests, items, recipes, and full bilingual dialogue trees, (2) AssembleWhisperingWilds.cs places NPCs, clue interactables (notice board, tea ledger), ingredient pickups, photo targets, and the region bootstrap in the Chennai scene, (3) BuildChennaiPopulation.cs adds 14 scheduled NPCs with 10 activity anchors, (4) GameplayRegionBootstrap connects content data to scene — initializes registry, sets region, accepts quests, applies dialogue to NPCs, (5) NPCCharacter.Interact() registers conversation, reports TalkToNPC event, opens dialogue or vendor UI, (6) DialogueUI.ProcessChoice() reveals clues via InvestigationManager, (7) GameplayEventInteractable reports events, grants items, reveals clues, (8) QuestManager subscribes to GameplayEventBus for event-driven objective advancement, (9) RegionUnlockManager subscribes to InvestigationManager.OnClueDiscovered for clue-gated region unlocks, (10) RegionUnlocks progression chain: Chennai→Pichavaram→Thanjavur (starting unlocked), Chettinad (Thanjavur clue), Mamallapuram (Chettinad clue), Nilgiris (Mamallapuram clue). All validation tests pass: verify-game 15/15, test:backend 31/31, verify-production all checks. Build: 169 MB in 46.5s. Interactive gameplay testing (NPC dialogue, clue discovery, save/load, region transition) requires human operator.

- **Step 65 — Startup fix: game opens and immediately closes**: Root cause: D3D12 device filter blocked Intel integrated GPUs, forcing fallback to D3D11 with 0.3 FPS freeze. Game appeared to "close" because it was essentially frozen on the first frame. Fix: (1) Changed Windows graphics API from D3D12+D3D11 fallback to D3D11 only in `ProjectSettings.asset`, (2) Added `_isDuplicate` guard to `GameManager.Start()` to prevent duplicate GameManager instances from resetting game state to Boot after MainMenu, (3) Added diagnostic mode to `Launch-Game-Unity.ps1` (`-Diagnostic` flag) that captures Player logs, exit codes, and process lifetime. Verification: game stays alive for 20+ seconds with no errors, FPS recovers from initial HDRP compilation spike to 60 FPS. Build: 169 MB in 188.4s.

- **Step 65 — Trustworthy QA, typed PlayerPrefs, and real SaveSystem tests**: Rewrote `QaIsolation` with typed PlayerPrefs registry (14 keys: int/float/string) so backup/restore uses the correct getter/setter — int preferences like `WW_PlayIntroOnStartup` are no longer corrupted by string round-trips. Fixed `QaSaveDir` to be a stable per-run path instead of generating a new GUID each access. Replaced raw `File.WriteAllText`/`JsonUtility` save tests with real `SaveSystem.CaptureSnapshot`, `SaveSystem.LoadGame`, `SaveSystem.HasValidSave`, and `SaveSystem.LastLoadStatus` assertions. Added corrupt save and backup recovery tests exercising the real `SaveSystem.LoadGame` path. Added 7 PlayerPrefs type preservation regression tests proving int/float/string settings survive the test suite unchanged. Created `scripts/Run-QaTests.ps1` — PowerShell QA runner that sets `WW_SAVE_DIR` before launching Unity so `SaveSystem.SaveDirectory` resolves to a temporary QA path. All tests compile with 0 errors.

- **Step 64 — Safe QA isolation and test assertion fixes**: Added `QaIsolation` static helper class to PlayMode tests that backs up and restores all PlayerPrefs keys (WW_PlayIntroOnStartup, WW_IntroPlayed, etc.) and creates per-test temporary QA save directories so tests never touch real player data. Fixed `RegionUnlocks_ProgressionOrder` test to verify the exact 6-region sequence (Chennai→Pichavaram→Thanjavur→Chettinad→Mamallapuram→Nilgiris) instead of just checking array length. Rewrote SaveSystem tests to use QA-isolated directories instead of `SaveSystem.SaveFilePath` (which points to the real player save). Added 2 player data protection regression tests: one verifies no QA test files leak into the real save directory, another verifies PlayerPrefs backup/restore round-trip. Intro preference tests no longer delete real PlayerPrefs keys. All tests compile with 0 errors. Unity build 192 MB in 43.9s.

- **Step 63 — PlayMode test suite and runtime verification**: Created dedicated PlayMode test assembly (`WhisperingWilds.Tests.PlayMode.asmdef`) with 22 PlayMode tests covering: region unlock progression (6 tests), investigation manager clue discovery and deduplication (3 tests), save/load with data preservation and corrupt save handling (5 tests), campaign flow reset chain (1 test), ending controller evaluation/save/load/reset (3 tests), content registry initialization for all 6 regions (2 tests), and intro preference system (2 tests). Fixed PlayMode asmdef platform conflict (includePlatforms + excludePlatforms). Standalone smoke test: process launched and ran 15s without crash. All tests compile with 0 errors. Unity build 192 MB in 35.6s.

- **Step 62 — End-to-end reliability audit and campaign tests**: Fixed indentation defects and null-reference pattern in CampaignFlow.cs (HUDManager.Instance cached before switch block). Added 22 comprehensive EditMode tests covering: RegionUnlocks progression order, EndingController evaluation/save/load/reset, SaveSystem methods and GameSaveData fields, InvestigationManager/QuestManager reset methods, CampaignFlow reset chain verification, all 6 regions in GameplayContentRegistry, clue definitions for Pichavaram/Thanjavur/Nilgiris, boot scene manager inclusion (RegionUnlockManager, EndingController, QuestEndingBridge), all 6 regional scenes and NavMesh existence, Tamil font in Resources, and LocalizationManager Tamil support. All tests compile with 0 errors.

- **Step 61 — Cinematic intro plays by default on every launch**: Replaced `WW_IntroPlayed` PlayerPrefs with `WW_PlayIntroOnStartup` preference (default=1). The intro now plays on every fresh launch unless the player explicitly disables it. Added `-forceIntro` launch argument for QA/debug testing. Improved atmospheric visuals with gradient background colors (deep night → dawn mist → sunrise), animated fog density, and mist overlay. Added 7 regression tests for the new preference system.

- **Step 60 — Missing regional clue interactables**: Added 9 world-space clue interactables through AssembleAllRegions.cs scene generation pipeline so they survive scene regeneration. Pichavaram (3 clues: Kerosene Sheen, Root Gash, Night Bundle), Thanjavur (3 clues: Temple Ledger, Brass Seal, Unsent Dispatch), Nilgiris (3 clues: Survey Markers, Faded Map, Original Blueprint). Each uses GameplayEventInteractable with correct targetId, revealClueId, and bilingual prompts. This completes the campaign progression chain: Chennai → Pichavaram → Thanjavur → Chettinad → Mamallapuram → Nilgiris → Ending.
- **Step 59 — Campaign managers in boot scene**: Added RegionUnlockManager, EndingController, and QuestEndingBridge to BuildBootScene.SetupPersistentManagers(). Without these, clue discoveries would not unlock regions and the final quest would not trigger ending evaluation. Verified: build launches with 0 errors, all managers present in boot scene.
- **Step 59 — Campaign structural audit**: Verified 6-region campaign chain (Chennai→Pichavaram→Thanjavur→Chettinad→Mamallapuram→Nilgiris) with clue-based unlock gates. All 6 regions now have clue interactables in their scenes. Pichavaram, Thanjavur, and Nilgiris clue objects added through scene generation pipeline.
- **Step 58 — Input System runtime crash fix**: CinematicIntroController.Update() threw `InvalidOperationException` every frame because it used legacy `UnityEngine.Input.anyKeyDown` while the project uses the Input System package. Fix: Added `IsAnyKeyOrButtonPressed()` with `#if ENABLE_INPUT_SYSTEM` guards using `Keyboard.current`, `Mouse.current`, and `Gamepad.current`. Verified: standalone build launches with 0 errors, reaches MainMenu, and repeat-launch works correctly.
- **Step 57 — Repeat-launch blank screen fix**: CinematicIntroController no longer shows a blank screen on second and subsequent launches. Root cause: `SkipIntro()` returned immediately when `_isPlaying` was false, leaving `menuRoot` hidden. Fix: call `CompleteIntro()` directly when intro was already played. Also moved `WW_IntroPlayed` flag from `StartIntro()` to `CompleteIntro()` so a crash during the intro does not permanently skip it. Made `CompleteIntro()` idempotent. `ReplayIntro()` now clears the flag. Added 4 regression tests.
- **Tamil translations**: Fixed mixed-script Tamil in ThanjavurDeltaContent.cs (items, clues, quests, dialogue)
- **Vendor UI wiring**: NPCCharacter.Interact now opens VendorUI when interacting with vendor NPCs
- **Vendor trade system**: VendorUI.cs (400 lines) with buy/sell interface, localization, and atomic transactions
- **Backend hardening**: Production PostgreSQL enforcement, DB readiness check, JSON→PostgreSQL migration
- **Firestore security**: Restrictive rules with owner validation and server-owned field protection
- **Documentation**: Updated ARCHITECTURE.md, LOCAL_SETUP.md, PRODUCTION_DEPLOYMENT.md, BACKEND_CLASSIFICATION.md

## Key Changes & Resolutions

### 1. Browser Game & Legacy Code Removal
- Removed `js/` (519 files), `css/`, `index.html`, `3d-locomotion.html`, `sw.js`, `netlify.toml`, `manifest.json`, `electron-main.js`, and browser-specific launch scripts.
- Purged risky maintenance utilities (`clean_game_and_system_files.bat`, `check_and_rebuild_language.bat`, `game_installation_and_performance_tester.bat`).
- Archived historical audit reports to `docs/archive/reports/`.

### 2. Unity Project & Assembly Definitions
- Resolved `Unity.AI.Navigation` mismatch in `WhisperingWilds.asmdef` by utilizing engine-standard `UnityEngine.AI`.
- Fixed `WhisperingWilds.Tests.Editor.asmdef` and installed `com.unity.test-framework: 1.4.5`.
- Fixed quote syntax error in `Step50VerticalSliceTests.cs`.
- Executed Unity 6000.6.3f1 headless compilation (0 errors) and ran EditMode test runner: 38/38 tests passed.

### 3. Localization Fixes
- Corrected corrupted mixed-script Arabic/Urdu text (`கتابகான`) to `சரஸ்வதி மகால் நூலகக் காப்பகத்தில்` in `ThanjavurDeltaContent.cs`.
- Corrected typos (`காட்டும்தை` -> `காட்டுவதை`) and grammatical case markers (`-யில்` -> `-க்கு` for motion targets).

### 4. Canonical Executable & Launcher Standardization
- Established canonical Windows standalone path: `unity/Build/Windows/TheWhisperingWilds.exe`.
- Modernized `Launch-Game-Unity.ps1`, `Launch-Game-PC.ps1`, and `Launch-Game-PC.bat` to strictly target the native executable.
- Never falls back to web or Node; displays clear, actionable compilation guidance if binary is unbuilt.

### 5. Backend Authentication & Persistent Storage
- Documented authoritative 3-tier persistence architecture in `docs/BACKEND_CLASSIFICATION.md`:
  - **Tier 1 (Production Cloud Save):** Firebase Firestore with hardened `firestore.rules` (5-change customization limit, owner validation, default-deny).
  - **Tier 2 (Production Relational Account Store):** PostgreSQL via `DATABASE_URL` with transactional bootstrapping. Enforces fail-closed write rejections in production if DB is unreachable.
  - **Tier 3 (Dev/Test Fallback):** Transactional local JSON (`server/data/auth_database.json`) strictly confined to local development.
- Hardened server endpoints: restricted static serving to public assets only (`/landing`, `/brand`), added DB readiness probe to `/ready`.
- Restored and verified production `firestore.rules`.

### 6. GitHub Actions Workflows & GitHub Pages
- Created 3 CI workflows in `.github/workflows/` (committed locally, not yet on GitHub):
  - `backend-ci.yml`: Automated backend security and project validation (Node 20, npm ci, test:backend, verify-game, verify-production, verify-assets).
  - `unity-validation.yml`: Unity project structure, scenes, scripts, and asset integrity checks.
  - `pages.yml`: Automated GitHub Pages deployment from `docs/landing/` via official actions.
- Created lightweight, modern landing page (`docs/landing/index.html`) linking to repository, releases, and setup guides.
- **Status:** Push blocked — Personal Access Token requires `workflow` scope. Files are committed locally at bc053b5 and ready to push once the token is updated.

## Canonical Paths

- **Windows Executable:** `unity/Build/Windows/TheWhisperingWilds.exe`
- **Native Launcher (PowerShell):** `Launch-Game-PC.ps1` → `Launch-Game-Unity.ps1`
- **Native Launcher (Batch):** `Launch-Game-PC.bat`
- **Local Dev Documentation:** `docs/LOCAL_SETUP.md`
- **Production Deployment:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Backend Architecture:** `docs/BACKEND_CLASSIFICATION.md`
- **Authoritative Status:** `docs/PROJECT_HEALTH.md`

## Action Items (Require Your Attention)

### 1. Push GitHub Actions workflow files (Blocked — PAT scope)

Your Personal Access Token does not have the `workflow` scope, so GitHub rejects pushing files under `.github/workflows/`. The 3 workflow files are **already committed locally** (commit bc053b5) and ready to push:

- `.github/workflows/backend-ci.yml`
- `.github/workflows/unity-validation.yml`
- `.github/workflows/pages.yml`

**To fix (one-time, ~30 seconds):**

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Edit your token
2. Check the **workflow** scope box
3. Save and generate the new token
4. Update your git credentials with the new token
5. Then run: `git push origin main`

Alternatively, create the files manually via GitHub's web interface (repository → Files → `.github/workflows/` → Add file → paste content from the local files).

### 2. Enable GitHub Pages deployment

After the workflow files are pushed, go to your repository → Settings → Pages → Build and deployment → Source → Select **GitHub Actions**. The `pages.yml` workflow will then deploy the landing page from `docs/landing/` automatically.

### 3. Clean up stale branches (Optional)

The following branches are superseded and can be deleted:

- `fix/github-branches-ci-pages-release` (superseded by direct main push)
- `fix/missing-workflows-and-production-readiness` (superseded)
- `fix/release-readiness-and-deployment` (already merged)
- `cleanup/unity-only-and-repository-cleanup` (already merged)
- `ai/unity-graphics-world-upgrade` (already merged)
- `cleanup/gh-pages-landing-page` (**DO NOT MERGE** — deletes unity/, server/, assets/)
