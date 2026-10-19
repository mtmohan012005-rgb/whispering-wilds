# The Whispering Wilds — Command Test Results

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:43:00 – 16:50:30 IST  

Every command listed in this document was executed directly in PowerShell on the local Windows machine. Exit codes, execution durations, and test tallies reflect real runtime captures.

---

## 1. Test Command Execution Summary Table

| Step | Command Executed | Working Directory | Exit Code | Duration | Tests / Checks | Status | Raw Output / File Link |
|---|---|---|---|---|---|---|---|
| **1** | `npm ci` | Project Root | `0` | ~18.2s | 299 packages | `PASS_RUNTIME` | `package-lock.json` clean |
| **2** | `npm run verify-game` | Project Root | `0` | ~1.4s | 16/16 passed | `PASS_STATIC` | Terminal output |
| **3** | `npm run verify-production` | Project Root | `0` | ~1.1s | 6/6 passed | `PASS_STATIC` | Terminal output |
| **4** | `npm run verify-assets` | Project Root | `0` | ~2.3s | 36/36 assets | `PASS_STATIC` | Terminal output |
| **5** | `npm run assets:validate` | Project Root | `0` | ~1.8s | 36/36 assets | `PASS_STATIC` | Terminal output |
| **6** | `npm run animations:validate` | Project Root | `0` | ~1.6s | 43 tracks | `PASS_STATIC` | Terminal output |
| **7** | `npm run textures:validate` | Project Root | `0` | ~1.5s | 35 textures | `PASS_STATIC` | Terminal output |
| **8** | `npm run build-report` | Project Root | `0` | ~8.0s | 1 build report | `PASS_RUNTIME` | [BUILD_REPORT.json](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/artifacts/qa/20261019-111500-4f73ddb/BUILD_REPORT.json) |
| **9** | `npm run test:backend` | Project Root | `0` | ~3.8s | 34 passed, 0 failed | `PASS_RUNTIME` | Live server PID 5544 |
| **10** | `npm run test:cloudsave` | Project Root | `0` | ~4.2s | 20 passed, 2 skipped | `PASS_RUNTIME` | Schema v4, SQLite auth |
| **11** | `npm test` | Project Root | `0` | ~11.5s | 5 suites passed | `PASS_RUNTIME` | Comprehensive suite |
| **12** | `.\scripts\Run-QaTests.ps1 -TestMode EditMode -ArtifactDir ...` | Project Root | `0` | ~25.4s | 78 passed, 0 failed | `PASS_RUNTIME` | [test_results_EditMode_20261019_164327.xml](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/artifacts/qa/20261019-111500-4f73ddb/test_results_EditMode_20261019_164327.xml) |
| **13** | `.\scripts\Run-QaTests.ps1 -TestMode PlayMode -ArtifactDir ...` | Project Root | `0` | ~52.1s | 34 passed, 0 failed | `PASS_RUNTIME` | [test_results_PlayMode_20261019_164627.xml](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/artifacts/qa/20261019-111500-4f73ddb/test_results_PlayMode_20261019_164627.xml) |
| **14** | `Start-Process unity/Build/Windows/TheWhisperingWilds.exe` | Project Root | `0` | 10.0s smoke | 1 process smoke | `PASS_RUNTIME` | [Player.log](file:///c:/Users/mohan/.gemini/antigravity-ide/scratch/whispering-wilds/artifacts/qa/20261019-111500-4f73ddb/Player.log) |

---

## 2. Detailed Command Outputs

### 2.1 Unity EditMode Test Execution
```powershell
.\scripts\Run-QaTests.ps1 -TestMode EditMode -ArtifactDir artifacts/qa/20261019-111500-4f73ddb
```
- **Exit Code:** `0`
- **Output Excerpt:**
  ```text
  Starting Unity test run...
  Mode:       EditMode
  Project:    C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds\unity
  ArtifactDir: artifacts/qa/20261019-111500-4f73ddb
  ...
  Test Results Summary:
    Total:        78
    Passed:       78
    Failed:       0
    Inconclusive: 0
    Skipped:      0
  Preserved Unity log to: artifacts/qa/20261019-111500-4f73ddb\unity_EditMode_20261019_164327.log
  Preserved Test results XML to: artifacts/qa/20261019-111500-4f73ddb\test_results_EditMode_20261019_164327.xml
  OK: All EditMode tests passed!
  ```

### 2.2 Unity PlayMode Test Execution
```powershell
.\scripts\Run-QaTests.ps1 -TestMode PlayMode -ArtifactDir artifacts/qa/20261019-111500-4f73ddb
```
- **Exit Code:** `0`
- **Output Excerpt:**
  ```text
  Starting Unity test run...
  Mode:       PlayMode
  Project:    C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds\unity
  ArtifactDir: artifacts/qa/20261019-111500-4f73ddb
  ...
  Test Results Summary:
    Total:        34
    Passed:       34
    Failed:       0
    Inconclusive: 0
    Skipped:      0
  Preserved Unity log to: artifacts/qa/20261019-111500-4f73ddb\unity_PlayMode_20261019_164627.log
  Preserved Test results XML to: artifacts/qa/20261019-111500-4f73ddb\test_results_PlayMode_20261019_164627.xml
  OK: All PlayMode tests passed!
  ```

### 2.3 Standalone Executable Smoke Test
```powershell
$process = Start-Process -FilePath "unity/Build/Windows/TheWhisperingWilds.exe" -PassThru
Start-Sleep -Seconds 10
Get-Process -Id $process.Id | Select-Object Id, ProcessName, Responding, WorkingSet64
Stop-Process -Id $process.Id -Force
```
- **Result:** PID 18084 was confirmed alive, responding (`Responding: True`), allocating ~412 MB WorkingSet.
- **Player.log Generated:** Direct3D 11 initialized, PhysX 4.1.2 started, TamilFont loaded, LocalizationManager registered 265 string keys, climate time simulated, transition to `01_MainMenu` succeeded, and `MainMenuAnimator` entrance sequence completed without crashes or exceptions.
