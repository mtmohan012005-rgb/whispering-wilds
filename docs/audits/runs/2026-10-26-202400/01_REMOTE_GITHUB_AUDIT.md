# The Whispering Wilds — Remote GitHub Audit
**Remote URL:** `https://github.com/mtmohan012005-rgb/whispering-wilds.git`
**Audited Commit SHA:** `cfca83a8ba7b8431b64b48a7d74e14a6209b1454`
**Default Branch:** `main`
**Latest Merged PR:** PR #27 (`fix/temple-realism-audio-ci-20261026`)
**Published Releases:** `v1.0.0` (Latest, 2026-10-21)
**Total Remote Tracked Files:** 2,188 files

---

## 1. Remote Workflows Status
| Workflow Name | File | Trigger | Runner OS | Status | Run ID | Real Coverage |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Backend CI** | `.github/workflows/backend-ci.yml` | push/PR to main | ubuntu-latest & windows-latest | **SUCCESS** | 40340246247 | Node 18 & 20 syntax, verify-assets, test:data, full test suite, Windows candidate launcher tests (85 checks). |
| **Unity Validation** | `.github/workflows/unity-validation.yml` | push/PR to main | ubuntu-latest | **SUCCESS** | 40340247554 | Static file checks: ProjectVersion.txt, packages, build scenes, critical scripts, NavMesh assets, character prefabs. Notes: Unity compile/PlayMode blocked in CI without license. |
| **Pages Deployment** | `.github/workflows/pages.yml` | push to main | ubuntu-latest | **SUCCESS** | Historical | Documentation and static status pages. |

---

## 2. Remote Test Execution (Isolated Snapshot at cfca83a)
A detached worktree was created in a separate clean directory and evaluated:
- `npm ci`: Completed in 25s, 300 packages audited.
- `npm run verify-game`: 16/16 checks PASSED.
- `npm run verify-assets`: 36/36 curated manifest entries verified on disk.
- `npm run test:data`: 4 manifests, 83 entries verified consistent.
- `npm run test:map-data`: 4/4 GIS stages, boundary polygons, and 7 negative edge-case fixtures PASSED.
- `npm run animations:validate`: 43 animation tracks verified.
- `npm run textures:validate`: 38 textures verified.
- `npm run test:candidate-launcher`: 85/85 checks PASSED.
- `npm run build-report`: Successfully generated BUILD_REPORT.json (STATUS: READY_WITH_WARNINGS).
