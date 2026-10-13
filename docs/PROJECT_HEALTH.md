# Project Health — The Whispering Wilds

**Last updated:** 2026-10-13  
**Commit:** fff7667  
**Branch:** cleanup/unity-only-and-repository-cleanup

## Architecture

- **Primary game:** Unity 6 (6000.6.3f1) HDRP 17.7.0, Windows x64 standalone
- **Backend:** Node.js multiplayer/cloud-save server (Express, Socket.IO, Firebase)
- **Browser game:** Removed (was Three.js, no longer maintained)
- **Desktop launcher:** Removed (was Electron wrapper for browser game)

## Build Status

| Component | Status |
|-----------|--------|
| Unity compilation | PASS (0 errors) |
| Windows x64 build | PASS (192 MB, unity/Build/Windows/) |
| Backend tests | PASS (31/31) |
| verify-game | PASS (15/15) |
| verify-assets | PASS (all checks) |
| verify-production | PASS (all checks) |
| Unity EditMode tests | BLOCKED (requires Unity Editor licensing) |

## Changes in This Session

### Removed
- Browser game: `js/`, `css/`, `index.html`, `3d-locomotion.html`, `sw.js`, `netlify.toml`
- Electron/desktop: `desktop/`, `launcher/`, `electron-main.js`
- Browser platforms: `platform/`, `content/`
- Dangerous utilities: `clean_game_and_system_files.bat`, `check_and_rebuild_language.bat`, `game_installation_and_performance_tester.bat`
- Browser launchers: `Launch-Game-PC.bat`, `The-Whispering-Wilds.bat`, `Install-On-Laptop.*`, `install-laptop.ps1`, `sync_unity_to_repo.ps1`, `Launch-Legacy-Web-Game.ps1`, `serve.ps1`
- Old CI: `ci/workflows/` (browser/Electron-focused)
- Deployment configs: `render.yaml`, `firebase.json`, `firestore.indexes.json`, `firestore.rules`, `config/`, `distribution/`, `reports/`, `TestReports/`
- Root-level reports: 68 files moved to `docs/archive/reports/`

### Added
- `.github/workflows/backend-ci.yml` — Backend security and validation CI
- `.github/workflows/unity-validation.yml` — Unity project structure CI
- `.github/workflows/pages.yml` — GitHub Pages deployment
- `docs/landing/index.html` — GitHub Pages landing page

### Fixed
- `.gitignore` — No longer ignores `.github/workflows/`
- `WhisperingWilds.asmdef` — Removed unused `Unity.AI.Navigation` reference
- `WhisperingWilds.Tests.Editor.asmdef` — Added `Unity.TestFramework` and `TestAssemblies`
- `package.json` — Removed browser game scripts and puppeteer-core dependency
- `Launch-Game-PC.ps1` — Removed reference to deleted legacy launcher
- `scripts/verify-game.js` — Rewritten for Unity project verification
- `scripts/verify-production.js` — Rewritten for Unity/backend verification
- `README.md` — Updated executable path and documentation links

## Known Issues

1. **Unity EditMode tests** — Cannot run in headless batch mode due to licensing validation
2. **Interactive gameplay testing** — Requires human operator to verify menu flow, NPC dialogue, saves
3. **Backend auth persistence** — Legacy JSON auth database; PostgreSQL/Firebase migration pending
4. **GitHub Pages** — Landing page created; deployment requires GitHub Pages settings configuration

## Executable Path

Canonical path: `unity/Build/Windows/TheWhisperingWilds.exe`

Launcher: `Launch-Game-PC.ps1` → `Launch-Game-Unity.ps1`
