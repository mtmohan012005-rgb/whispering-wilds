# Project Health — The Whispering Wilds

**Last updated:** 2026-10-14  
**Commit:** bd97f34 (main)  
**Branch:** fix/release-readiness-and-deployment  
**GitHub:** https://github.com/mtmohan012005-rgb/whispering-wilds

## Architecture

- **Primary game:** Unity 6 (6000.6.3f1) HDRP 17.7.0, Windows x64 standalone
- **Backend:** Node.js multiplayer/cloud-save server (Express, Socket.IO, Firebase)
- **Browser game:** REMOVED (was Three.js, no longer maintained)
- **Desktop launcher:** REMOVED (was Electron wrapper for browser game)

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

## Changes in This Session (Step 55 — Release Readiness)

### Added
- `docs/LOCAL_SETUP.md` — Complete local development setup guide
- `docs/PRODUCTION_DEPLOYMENT.md` — Production deployment documentation
- `docs/BACKEND_CLASSIFICATION.md` — Backend persistence path classification
- `.github/workflows/backend-ci.yml` — Backend security and validation CI
- `.github/workflows/unity-validation.yml` — Unity project structure CI
- `.github/workflows/pages.yml` — GitHub Pages deployment workflow

### Fixed
- `Launch-Game-Unity.ps1` — Corrected build path from `Build\Windows\` to `unity\Build\Windows\`
- `Launch-Game-Unity.ps1` — Added helpful error message when executable not found

### Previous Session Changes (Cleanup)
- Browser game removed (751 files, 142K deletions)
- Unity assembly definitions fixed (removed `Unity.AI.Navigation`, added TestFramework)
- Dangerous utilities removed
- Root reports archived to `docs/archive/reports/`
- README and documentation updated
- `.gitignore` — No longer ignores `.github/workflows/`

## Known Issues

1. **Unity EditMode tests** — Cannot run in headless batch mode due to licensing validation
2. **Interactive gameplay testing** — Requires human operator to verify menu flow, NPC dialogue, saves
3. **Backend auth persistence** — JSON database is dev/test only; PostgreSQL required for production
4. **GitHub Pages** — Landing page and workflow created; Pages source must be set to GitHub Actions
5. **Firestore rules** — `firestore.rules` removed during cleanup; restore if Firebase is used in production

## Executable Path

Canonical path: `unity/Build/Windows/TheWhisperingWilds.exe`

Launcher: `Launch-Game-PC.ps1` → `Launch-Game-Unity.ps1`

## Completed Actions

- ✓ Browser game removed (751 files, 142K deletions)
- ✓ Cleanup merged into `main` and pushed to GitHub
- ✓ All validation tests pass (verify-game 15/15, test:backend 31/31, verify-production all checks)
- ✓ Unity assembly definitions fixed
- ✓ Launcher build path corrected to `unity/Build/Windows/`
- ✓ LOCAL_SETUP.md, PRODUCTION_DEPLOYMENT.md, BACKEND_CLASSIFICATION.md created
- ✓ GitHub Actions workflows created (backend-ci, unity-validation, pages)
- ✓ GitHub Pages landing page in `docs/landing/`

## Remaining Work (Requires Your Action)

1. **Push GitHub Actions workflows** — Add `workflow` scope to your Personal Access Token and push, or create via GitHub web interface.
2. **Set GitHub Pages source** — In repository Settings → Pages, set Source to "GitHub Actions".
3. **Interactive gameplay testing** — Smoke test the standalone build: menu flow, NPC dialogue, saves, and campaign progression.
4. **Restore Firestore rules** — If Firebase is used in production, restore `firestore.rules` with restrictive permissions.
