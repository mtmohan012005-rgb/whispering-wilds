# The Whispering Wilds — Prioritized Repair Roadmap

**Audit Date:** 2026-10-19 18:20 IST  
**Target Repository:** `https://github.com/mtmohan012005-rgb/whispering-wilds.git`  
**Target Branch:** `main` (Merged PR #9 `9d6c5bbd5f2e0bc51f1c0d4e4c56797fb4191c0f`)  

This roadmap classifies all identified defects, technical gaps, and production enhancements into strict priority tiers (P0 through P4) with exact file paths, dependencies, proposed changes, validation tests, and acceptance criteria.

---

## Priority 0 (P0) — Critical Blockers & Core Stability

> [!NOTE]
> All primary P0 execution defects identified during this testing session were successfully diagnosed, patched in source code, verified via live tests, and merged into `main` via PR #9.

### P0-01 (RESOLVED): `scripts/validate-links.js` Fatal Crash on Web Deprecation
- **File Path:** `scripts/validate-links.js`
- **Issue:** Script crashed with `Fatal: index.html not found!`, blocking build reporting.
- **Resolution:** Added graceful detection of Unity standalone architecture, generating `LINK_AUDIT_REPORT.json` without failing.
- **Validation Test:** `npm run build-report` (Passed, 8030ms).
- **Acceptance Criteria:** Exit code 0 on all clean runs.

### P0-02 (RESOLVED): Test Runner Session Rate-Limit Skips
- **File Paths:** `scripts/test-cloud-save-regression.js`, `server/auth/auth-service.js`, `scripts/run-all-tests.js`
- **Issue:** New account registration per test assertion exhausted the 5/hr IP rate limit.
- **Resolution:** Cached session tokens (`default`, `user_a`, `user_b`) and enabled higher rate limits under `NODE_ENV === 'test'`.
- **Validation Test:** `npm run test:cloudsave` (Passed: 20 passed, 0 skipped due to rate limits).
- **Acceptance Criteria:** Test suite runs repeatedly on the same machine without 429 errors.

### P0-03 (RESOLVED): Missing QA Test Runner Artifact Retention
- **File Path:** `scripts/Run-QaTests.ps1`
- **Issue:** Test runner purged all logs and NUnit XMLs upon passing tests.
- **Resolution:** Added `-ArtifactDir` parameter to copy `unity_*.log` and `test_results_*.xml` before temp cleanup.
- **Validation Test:** Verified raw XML files (56 KB and 29 KB) preserved in `artifacts/qa/`.
- **Acceptance Criteria:** Raw test evidence remains available on disk after every test run.

---

## Priority 1 (P1) — Essential Gameplay, Visuals & Progression

### P1-01: Replace Ancient Temple Ruins Greybox Primitives with 3D Models
- **File Paths:** `unity/Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity`, `unity/Assets/_Project/Scripts/Editor/GenerateTempleScene.cs`
- **Dependency:** 3D Art pipeline (Blender / Maya / FBX)
- **Proposed Change:** Replace primitive cubes, cylinders, and spheres generated in `GenerateTempleScene.cs` with textured Dravidian stone masonry models (carved granite pillars, sanctum gopuram, stone threshold, relief carvings).
- **Validation Test:** Visual inspection in Unity Editor and PlayMode verification that collider dimensions match puzzle trigger zones.
- **Acceptance Criteria:** Zero `PrimitiveType.Cube` or `PrimitiveType.Sphere` objects remain in the active scene hierarchy.

### P1-02: Commission & Integrate Authentic Tamil Nadu Wildlife Audio Recordings
- **File Paths:** `assets/audio/`, `assets/audio/AUDIO_LICENSE_MANIFEST.json`, `unity/Assets/_Project/Scripts/Audio/AudioManager.cs`
- **Dependency:** Audio sound designer / field recordist
- **Proposed Change:** Replace 10 synthetic procedural WAV placeholder tones with authentic field recordings of local fauna:
  - Great Indian Hornbill flight calls & wing beats
  - Bonnet Macaque chatter & alarm calls
  - Nilgiri Tahr mountain warning whistles
  - Monsoon rain canopy ambiance
- **Validation Test:** `npm run verify-assets` + audible listening test in standalone build.
- **Acceptance Criteria:** Audio files present on disk with valid CC-BY / custom commercial licenses listed in manifest.

### P1-03: Complete Human Campaign Playthrough Verification
- **File Path:** `docs/audits/HUMAN_VISUAL_AND_CAMPAIGN_CHECKLIST.md`
- **Dependency:** Human QA tester with laptop / gamepad
- **Proposed Change:** Execute the 60-item manual playthrough checklist from boot through all 7 regions to the 4 epilogue endings.
- **Validation Test:** Step-by-step verification and signature in `HUMAN_VISUAL_AND_CAMPAIGN_CHECKLIST.md`.
- **Acceptance Criteria:** All 60 test items marked PASS with no narrative blockers or game-breaking soft locks.

---

## Priority 2 (P2) — Environment Realism, Rigs & Narrative Voice

### P2-01: Voice-Over Acting for Opening Dialogue in Tamil
- **File Paths:** `unity/Assets/_Project/Scripts/Localization/`, `unity/Assets/_Project/Prefabs/NPCs/`
- **Dependency:** Tamil voice actors (Guide Murugan & Informant Velu)
- **Proposed Change:** Record authentic Tamil voice-over audio for Chennai opening quests and attach AudioSources to dialogue triggers.
- **Validation Test:** Dialogue triggers play Tamil audio synchronized with subtitle text boxes.
- **Acceptance Criteria:** Murugan and Velu conversations have full spoken Tamil audio.

### P2-02: Wildlife Herd Flocking & Realistic Fleeing Animations
- **File Paths:** `unity/Assets/_Project/Scripts/Wildlife/WildlifeAI.cs`, `assets/characters/wildlife/`
- **Dependency:** Wildlife animator & behavior designer
- **Proposed Change:** Add steering behaviors for deer herds (spotted deer / chital) so groups flee in formation when approached by the player or predator.
- **Validation Test:** EditMode AI test suite + runtime play in `02_Mudumalai_Forest.unity`.
- **Acceptance Criteria:** Animals maintain group cohesion and avoid running through tree trunks.

---

## Priority 3 (P3) — Optimization, UX & Accessibility

### P3-01: Gamepad Deadzone & Input Calibration
- **File Paths:** `unity/Assets/_Project/Scripts/Player/PlayerMovement.cs`, `unity/Assets/_Project/Scripts/Camera/PlayerCamera.cs`
- **Proposed Change:** Expose configurable stick sensitivity, deadzone curves, and camera smoothing in the Settings menu.
- **Validation Test:** Tested with Xbox/DualShock controllers.
- **Acceptance Criteria:** Zero stick drift on standard controllers; smooth camera rotation.

### P3-02: Tamil Script Complex Ligature Kerning Optimization
- **File Paths:** `unity/Assets/_Project/Resources/Fonts/TamilFont.ttf`, `unity/Assets/_Project/Scripts/Localization/LocalizedFontProvider.cs`
- **Proposed Change:** Tune TextMeshPro dynamic font asset padding and sampling to eliminate subtle clipping on complex vowel signs (e.g., கொ, ள, ஸ்ரீ).
- **Validation Test:** Visual inspection of all 265 Tamil string keys in UI dialogue panels.
- **Acceptance Criteria:** Clean ligature rendering across all screen resolutions without character truncation.

---

## Priority 4 (P4) — CI/CD, Packaging & Cloud Deployments

### P4-01: Enable GitHub Actions Workflow Token Scope
- **File Paths:** `.github/workflows/backend-ci.yml`, `.github/workflows/unity-validation.yml`
- **Dependency:** Repository Owner GitHub Account
- **Proposed Change:** Grant the `workflow` permission scope to the Personal Access Token or commit the workflows directly via GitHub's web interface.
- **Validation Test:** Push commit to GitHub triggers the `Backend CI` action.
- **Acceptance Criteria:** GitHub Actions runs `npm test` automatically on every push to `main` with green checkmark.

### P4-02: Live Firebase Firestore Cloud Save Provisioning
- **File Paths:** `server/config.js`, `server/routes/cloud-save.js`
- **Dependency:** Google Cloud Console / Firebase project
- **Proposed Change:** Provision Firebase project, generate service account key JSON, inject `GOOGLE_APPLICATION_CREDENTIALS` in server runtime, and deploy Firestore security rules.
- **Validation Test:** `npm run test:cloudsave` (All 22 passed, 0 skipped).
- **Acceptance Criteria:** Live cloud save round-trip test exits with HTTP 201/200 instead of HTTP 503.
