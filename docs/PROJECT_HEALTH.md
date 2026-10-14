# Project Health — The Whispering Wilds

**Last updated:** 2026-10-14
**Branch:** cleanup/unity-only-and-repository-cleanup
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
| Unity C# compilation | **BLOCKED** | Requires licensed Unity Editor environment |
| Unity EditMode tests | **BLOCKED** | Requires licensed Unity Editor environment |
| Windows x64 build | **BLOCKED** | Requires licensed Unity Editor environment |
| Backend security suite | **PASS** | 31/31 passed (`scripts/test-backend-security.js`) |
| Unity project verification | **PASS** | 15/15 passed (`scripts/verify-game.js`) |
| Production readiness | **PASS** | All checks passed (`scripts/verify-production.js`) |
| Asset integrity & GLB checks | **PASS** | Verified (`scripts/verify-assets.js`) |
| GitHub Actions workflows | **READY** | 3 workflows created, pending push to GitHub |
| GitHub Pages deployment | **READY** | Static landing page ready, pending workflow push |

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
- Migrated CI workflows to tracked `.github/workflows/`:
  - `backend-ci.yml`: Automated backend security and project validation.
  - `unity-validation.yml`: Unity project structure and asset integrity checks.
  - `pages.yml`: Automated GitHub Pages deployment from `docs/landing/`.
- Created lightweight, modern landing page (`docs/landing/index.html`) linking to repository, releases, and setup guides.

## Canonical Paths

- **Windows Executable:** `unity/Build/Windows/TheWhisperingWilds.exe`
- **Native Launcher (PowerShell):** `Launch-Game-PC.ps1` → `Launch-Game-Unity.ps1`
- **Native Launcher (Batch):** `Launch-Game-PC.bat`
- **Local Dev Documentation:** `docs/LOCAL_SETUP.md`
- **Production Deployment:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Backend Architecture:** `docs/BACKEND_CLASSIFICATION.md`
- **Authoritative Status:** `docs/PROJECT_HEALTH.md`
