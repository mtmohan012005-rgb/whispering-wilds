# The Whispering Wilds — Release Blockers & Defect Tracking

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:43:00 – 16:50:30 IST  

---

## 1. Active Release Blockers (Remaining for Commercial Launch)

| # | Severity | Category | Description | Impact | Action Required |
|---|---|---|---|---|---|
| **BLK-01** | **HIGH** | 3D Art & Assets | **Ancient Temple Ruins Greybox Geometry**<br>`GenerateTempleScene.cs` generates the temple using primitive cubes, cylinders, and spheres. | Puzzle works, but the visual fidelity resembles a prototype rather than a finished commercial game. | 3D artist must replace primitives with textured Dravidian modular stone masonry, gopuram, and carved pillars. |
| **BLK-02** | **HIGH** | Audio & SFX | **Missing Production Field Audio Recordings**<br>The 10 WAV files in `assets/audio/` are procedurally synthesized tones. | The game world lacks authentic immersion and ambient natural wildlife sounds of Tamil Nadu. | Source or commission field recordings of local fauna (Great Indian Hornbill, Bonnet Macaque, Nilgiri Tahr, cicadas, river ambiances). |
| **BLK-03** | **MEDIUM** | Cloud Backend | **Missing Live Firebase Credentials in Test Runner**<br>`GOOGLE_APPLICATION_CREDENTIALS` is unset in CI/local environment. | Local JSON/SQLite cloud save tests pass, but live Firestore round-trips return HTTP 503. | Create Firebase service account key, configure GitHub Actions secrets / local `.env`, and deploy Firestore rules. |
| **BLK-04** | **LOW** | Multiplayer | **Automated Multi-Client Network Testing**<br>Only server endpoint handshakes are covered by automated tests. | Simultaneous player synchronization across 2 machines has not been verified in continuous integration. | Establish a multi-machine LAN test procedure or automated headless client spawner for peer testing. |

---

## 2. Defects Verified & Repaired in This Run

All five defects identified during this testing run were diagnosed, patched in source code, and verified passing:

### DEF-01: `scripts/validate-links.js` Fatal Error on Web Remnants
- **Root Cause:** Script expected legacy `index.html` from the deprecated browser game.
- **Symptom:** `npm run build-report` crashed with `Fatal: index.html not found!`, breaking CI.
- **Resolution:** Updated `validate-links.js` to detect absence of `index.html`, emit an informational notice, and generate a valid `LINK_AUDIT_REPORT.json` with status `SKIPPED_UNITY_STANDALONE`.
- **Status:** **RESOLVED** (Verified: exit code 0).

### DEF-02: `test-cloud-save-regression.js` IP Registration Limit Exhaustion
- **Root Cause:** Helper `loginAs()` registered a new random user for every single test check, rapidly exceeding the 5 registration per hour IP rate limit and skipping 6 tests.
- **Symptom:** 6 cloud save regression tests skipped or failed with HTTP 429.
- **Resolution:** Added session caching in `test-cloud-save-regression.js` to reuse registered accounts (`default`, `user_a`, `user_b`).
- **Status:** **RESOLVED** (Verified: 20 passed, 0 skipped due to rate limits).

### DEF-03: `server/auth/auth-service.js` Hardcoded Rate Limit in Test Mode
- **Root Cause:** `AuthService.register()` had a hardcoded limit of 5 registrations per hour per IP with no bypass for automated test runners.
- **Symptom:** Subsequent test runs on the same IP address locked up with HTTP 429.
- **Resolution:** Conditioned the registration limit: `const maxRegistrations = (process.env.NODE_ENV === 'test') ? 100 : 5;`, and passed `NODE_ENV: 'test'` in `scripts/run-all-tests.js`.
- **Status:** **RESOLVED** (Verified: rapid test execution succeeds).

### DEF-04: HTTP 422 Unprocessable Entity Assertion in Cloud Save Test
- **Root Cause:** Server validator correctly returns HTTP 422 for malformed payloads missing checksums, but test asserted only `status === 400 || status === 503`.
- **Symptom:** Test threw assertion failure on receiving valid HTTP 422.
- **Resolution:** Added `status === 422` to the valid response assertion list.
- **Status:** **RESOLVED** (Verified: test passes cleanly).

### DEF-05: `scripts/Run-QaTests.ps1` Evidence Retention on Test Pass
- **Root Cause:** The script automatically purged the temporary QA folder upon test success, discarding logs and NUnit XMLs needed for compliance audits.
- **Symptom:** No raw XML or log artifacts remained after passing tests.
- **Resolution:** Added `-ArtifactDir` parameter to `Run-QaTests.ps1` to copy `unity_*.log` and `test_results_*.xml` into the artifact directory before temp folder cleanup.
- **Status:** **RESOLVED** (Verified: all XMLs and logs preserved in `artifacts/qa/20261019-111500-4f73ddb/`).
