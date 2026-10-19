# The Whispering Wilds (காட்டு வழி • தடம்) — Test Results Report
**Run Identifier:** `20261019-190300-repair`  
**Execution Timestamp:** 2026-10-19 19:07 IST  
**Git Base Commit:** `9d6c5bbd5f2e0bc51f1c0d4e4c56797fb4191c0f`  
**Active Repair Branch:** `fix/temple-realism-assets-ci`  
**Environment:** Windows 11 Home 64-bit, Intel Core i3-N305, 8 GB RAM, Intel UHD Graphics, Unity 6000.6.3f1 (HDRP 17.7.0), Node.js v24.19.0  

---

## 1. Executive Summary & Authoritative Test Tally

| Category | Suite | Total Cases | Passed | Failed | Skipped / Blocked | Pass Rate | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Unity Test Framework** | EditMode Tests | 78 | 78 | 0 | 0 | 100.0% | **PASS** |
| **Unity Test Framework** | PlayMode Tests | 34 | 34 | 0 | 0 | 100.0% | **PASS** |
| **Backend & API** | Backend Security & Auth Tests | 34 | 34 | 0 | 0 | 100.0% | **PASS** |
| **Cloud Save Integration** | Cloud Save Regression Suite | 22 | 20 | 0 | 2 *(Credentials missing)* | 100.0% of executable | **PASS (2 Skipped)** |
| **Total Automated Cases** | **Comprehensive Automated Tally** | **168** | **166** | **0** | **2** | **98.81%** | **PASS** |
| *Static Verification (Distinct)* | *Game Verification Script* | *16* | *16* | *0* | *0* | *100.0%* | *PASS* |
| *Curated Manifest Audit* | *Asset Manifest Verification* | *36* | *36* | *0* | *0* | *100.0%* | *PASS* |

> [!NOTE]
> **Tally Reconciliation Note:** The 168-case automated total comprises exactly 112 Unity tests (78 EditMode + 34 PlayMode) + 34 backend security tests + 22 cloud-save cases (20 passed, 2 skipped due to unprovisioned live Firestore credentials). The 16 static verifications in `scripts/verify-game.js` and the 36 curated manifest checks are kept as distinct categories to prevent double-counting.

---

## 2. Unity Test Framework Results

### 2.1 EditMode Tests (78 / 78 Passed)
- **Command:** `powershell -ExecutionPolicy Bypass -File .\scripts\Run-QaTests.ps1 -TestMode EditMode -ArtifactDir artifacts\qa\20261019-190300-repair`
- **Duration:** 1.05 seconds
- **Raw Evidence:** `artifacts/qa/20261019-190300-repair/test_results_EditMode_20261019_190345.xml`
- **Unity Log:** `artifacts/qa/20261019-190300-repair/unity_EditMode_20261019_190345.log`
- **Key Test Areas Covered:**
  - `CampaignProgressionTests`: Chapter unlock ordering, objective sequencing, milestone persistence.
  - `SaveSystemTests`: JSON serialization, atomic writes, schema version validation, corruption recovery.
  - `LocalizationTests`: Bilingual Tamil/English lookup, font asset availability, fallback mechanisms.
  - `InvestigationDataTests`: Temple clue parsing, artifact ledger updates, mechanism interaction state.
  - `ClimateAndLightingTests`: Regional weather transitions, volumetric fog profiles, HDRP lighting setups.

### 2.2 PlayMode Tests (34 / 34 Passed)
- **Command:** `powershell -ExecutionPolicy Bypass -File .\scripts\Run-QaTests.ps1 -TestMode PlayMode -ArtifactDir artifacts\qa\20261019-190300-repair`
- **Duration:** 0.54 seconds
- **Raw Evidence:** `artifacts/qa/20261019-190300-repair/test_results_PlayMode_20261019_190517.xml`
- **Unity Log:** `artifacts/qa/20261019-190300-repair/unity_PlayMode_20261019_190517.log`
- **Key Test Areas Covered:**
  - `PlayerControllerPlayModeTests`: Locomotion state transitions (idle, walk, run, crouch, swim, climb).
  - `TemplePuzzlePlayModeTests`: Stone mechanism rotation, sequence verification, incorrect sequence reset, chamber door opening trigger.
  - `ArtifactInteractionPlayModeTests`: Kaveri Star Seal medallion proximity trigger, pickup event dispatch, quest ledger progression.
  - `SaveLoadRoundTripPlayModeTests`: Full runtime state capture and restore across scene transitions.

---

## 3. Backend & Cloud Save Results

### 3.1 Backend Security Suite (34 / 34 Passed)
- **Command:** `node scripts/test-backend-security.js`
- **Execution Mode:** Automated local server startup on port 3000
- **Verifications:**
  - Strict CSRF protection: Rejection of state-changing POST requests lacking `X-WW-CSRF`.
  - Authentication guard: 401 Unauthorized for unauthenticated access to protected player endpoints.
  - Rate limiting: Automated throttling on rapid connection requests.
  - Payload sanitization: Rejection of malformed email strings and oversized payloads.
  - Legacy sanitization: Complete removal of MEGA endpoints (`/api/v1/mega/*` returning 404).

### 3.2 Cloud Save Regression Suite (20 Passed, 2 Skipped)
- **Command:** `node scripts/test-cloud-save-regression.js`
- **Status Summary:** 20 Passed, 0 Failed, 2 Skipped
- **Passing Cases (20):**
  - Checksum calculation parity (client/server hash determinism across reordered JSON keys).
  - Authentication requirement verification (401 on unauthenticated GET/POST `/saves`).
  - Cross-account access denial (404/503 isolation).
  - Malformed payload rejection (400 Bad Request on empty or missing checksum).
  - Oversized payload rejection (413 Payload Too Large).
  - Expired/invalid session token rejection (401 Unauthorized).
- **Skipped Cases (2):**
  - `Schema v4 save round-trip with real checksum`: Skipped (503 Service Unavailable).
  - `Stale revision conflict detection`: Skipped (503 Service Unavailable).
  - **Blocker Reason:** `GOOGLE_APPLICATION_CREDENTIALS` is not configured in the local development environment. The server securely halts live Firestore calls with HTTP 503 rather than corrupting test states or accepting mock writes.

---

## 4. Static Verification & Quality Checks (16 Checks Passed)

- **Command:** `node scripts/verify-game.js`
- **Results:**
  1. Unity Project Structure: `PASS`
  2. Assembly Definitions (`WhisperingWilds.asmdef`, `WhisperingWilds.Tests.Editor.asmdef`): `PASS`
  3. Build Scenes Configuration: `PASS`
  4. Package Manifest: `PASS`
  5. Player Model Rig & Meshes: `PASS`
  6. Tamil Font Provider: `PASS`
  7. NavMesh Data Assets (Scenes 02-07): `PASS`
  8. Backend Server Architecture: `PASS`
  9. Localization Resource Files: `PASS`
  10. Save System Serialization: `PASS`
  11. Campaign Progression Graph: `PASS`
  12. Zero Browser Game Remnants: `PASS`
  13. Build Settings Configuration: `PASS`
  14. Source Asset Paths: `PASS`
  15. Documentation Compliance: `PASS`
  16. Scene GUID Validation: `PASS`
