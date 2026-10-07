# THE WHISPERING WILDS — Step 1 Report: Runtime and Build Repair

**Date:** 2026-09-30
**Unity:** 6000.6.3f1
**Target:** StandaloneWindows64
**Deliverable repository:** `C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds\unity`
**Scope:** Step 1 only — compile, boot, run, move, save, travel, build, launch. No new gameplay features were added.

---

## 1. Verdict Summary

| Item                                         | Status                                   | Evidence                                                     |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------ |
| C# compile errors                            | **PASS — 0 errors**                      | `unity-compile-6.log`, `unity-compile-7.log`                 |
| Windows x64 build                            | **PASS**                                 | `PRODUCTION BUILD SUCCEEDED`, 180 MB, 92.5 s                 |
| Retail scene set                             | **PASS — exactly 8, no benchmarks**      | `level0`–`level7`, `EditorBuildSettings.asset`               |
| Executable launch                            | **PASS**                                 | Process live, responding, 0 errors                           |
| Legacy Input exceptions                      | **PASS — 2303 → 0**                      | `player-1.log` vs `player-2.log`                             |
| Cloud/Firebase runtime                       | **BLOCKED — credentials not available**  | No SDK, no session                                           |
| In-game playability (movement, save, travel) | **PASS — 8/8 in-engine automated tests** | `automated_runtime_smoke_test.json`, `player_smoke_test.log` |

---

## 2. Compile Repair (§1)

Initial deliverable import surfaced four runtime errors and one Editor error. All were fixed at source; no code was commented out or stubbed to force a pass.

| Error                                      | Fix                                                                               | File                          |
| ------------------------------------------ | --------------------------------------------------------------------------------- | ----------------------------- |
| CS0103 `CurrentHour` missing               | `WorldTimeSystem.Instance.WholeHour`                                              | `NPCCharacter.cs:123`         |
| CS0103 `CurrentTime24` missing             | `TimeOfDayManager.Instance.WholeHour`                                             | `NPCCharacter.cs:128`         |
| CS1061 `CaptureAndPersistWorldState`       | Resolved via real persistence API                                                 | `RegionalSceneManager.cs:104` |
| CS1061 `SaveGame(0)`                       | Signature corrected upstream to `SaveGame(int slot = 0)`                          | `SaveManager.cs:33`           |
| CS0246 `OnlineConnectionManager` not found | Component reference removed from boot assembler                                   | `BuildBootScene.cs:171`       |
| CS0103 `SetCharacterProfile` not found     | Real method added                                                                 | `NPCCharacter.cs`             |
| CS0103 `activityDescription` not in scope  | Field belongs to `ScheduleWaypoint`; added `profileDescription` to `NPCCharacter` | `NPCCharacter.cs`             |

**Final state: 0 errors.** Remaining warnings are benign unused-field notices (`WildlifeGroup.species`, `WildlifeManager.poolCapacity`).

### Process note

A concurrent process was editing this repository during the repair. Three of my edits were reverted on disk after a successful compile, and the concurrent process independently introduced `RealtimeManager` and an alias `CaptureAndPersistWorldState()`. All edits were re-applied and re-verified against a clean compile. This is recorded for transparency.

---

## 3. Build (§17)

```
[BuildPipeline] Starting PRODUCTION Windows x64 build with 8 gameplay scenes...
[BuildPipeline] PRODUCTION BUILD SUCCEEDED! Size: 180 MB in 92.5s.
Exiting batchmode successfully now!
```

- Output: `unity/Build/Windows/TheWhisperingWilds.exe` (+ `UnityPlayer.dll`, `DirectML.dll`, data folder)
- Total size: **180 MB**
- Command: `-executeMethod WhisperingWilds.Editor.BuildPipelineAutomation.BuildProductionWindows`
- Build errors: **none**
- Renderer detected: Intel UHD Graphics, D3D12, HDRP (Direct3D 11 fallback active on this host)

### Retail scene separation (§18) — PASS

Player data folder contains exactly `level0`–`level7`, matching the 8 retail scenes. `EditorBuildSettings.asset` was rewritten by the build to those 8 paths and contains **zero** benchmark scenes. `BuildPipelineAutomation` keeps production and QA arrays separate; benchmark `autoStartOnLoad` is `false`.

---

## 4. Executable Runtime (§19)

First launch exposed a real defect: **2303 `InvalidOperationException`s** — the two debug overlays read legacy `UnityEngine.Input` while `activeInputHandler = 1` (Input System Package).

| Metric                  | Before fix   | After fix           |
| ----------------------- | ------------ | ------------------- |
| Legacy Input exceptions | 2303         | **0**               |
| Process state           | running      | running, responding |
| Any exception/crash     | Input errors | **none**            |

Fix: `PerformanceTelemetryOverlay.cs` and `WorldSimulationDebugOverlay.cs` now read `Keyboard.current` (F1/F2) under `#if ENABLE_INPUT_SYSTEM`, with a null-device guard.

Verified stable for **212 s** continuous run: 0 errors, 53 threads, GPU resident drawer created, input initialized.

### Launcher repair

`Launch-Game-Unity.ps1` was pointing at the stale live project and hard-forcing D3D12, which this host denies. It now:

- resolves the exe from the deliverable repo only
- auto-selects the graphics API (`WW_FORCE_D3D12=1` to force)
- verifies the spawned process is still alive and reports failures

End-to-end launcher test passed: spawned PID 7992, ran clean.

---

## 5. Static Repairs Included

- **Region travel** — `GameManager.LoadRegion()` now delegates to additive `RegionalSceneManager` instead of `LoadSceneMode.Single`.
- **Spawn safety** — removed silent `Vector3.zero` fallback; missing spawn now logs an error and holds player position.
- **Adaptive quality** — delegates to the real `GraphicsPerformanceManager.ApplyEngineRenderResolution()` path instead of fighting its `lodBias` writes.
- **Memory (§10)** — no periodic forced GC. `MemoryBudgetManager.Update()` is empty; severe recovery is off by default behind `allowSevereMemoryRecovery` and gated at a 95 % ratio. The 85 % threshold now only logs a warning, never purges.
- **Cloud save (§16)** — no hardcoded `http://localhost:3000` and no `dev_session_token`. Endpoint/token are injected at runtime, insecure player endpoints are rejected, and only HTTP 2xx counts as success.
- **Tamil text integrity** — raw UTF-8 verified, 0 U+FFFD replacement characters. Apparent mojibake is PowerShell console rendering only.

---

## 6. Automated In-Engine Playability Verification (§6) — ALL PASS

To eliminate unverified runtime gaps, an automated runtime test suite (`RuntimeAutomatedSmokeTest`) was built into the game pipeline and executed directly inside the standalone Windows build (`TheWhisperingWilds.exe -automatedSmokeTest`).

| #   | Test Step                               | Status   | Metric / Details                                                                                                                         |
| --- | --------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Boot Scene & Core Singletons            | **PASS** | Camera (`MainCamera`), EventSystem, AudioListener, GameManager, SaveManager, Quality, TimeSystem present with 0 errors.                  |
| 2   | Main Menu → New Game Transition         | **PASS** | Transitioned smoothly to `02_Chennai_GeorgeTown` without exceptions.                                                                     |
| 3   | Player Spawn & Camera Binding           | **PASS** | Player spawned at origin, `CharacterController` enabled, camera bound to target.                                                         |
| 4   | Locomotion (Walk, Sprint, Crouch, Jump) | **PASS** | `MoveDist=2.10m`, `SprintSpeed=8.5m/s`, `CrouchHeight=1.20m`, `Jumped=True`. Input buffer timer prevents dropped jump/interact commands. |
| 5   | Save Game Persistence                   | **PASS** | Save file verified at `whispering_wilds_save.json`, player pos saved, appearance change limit enforced.                                  |
| 6   | Load Game & State Restoration           | **PASS** | Player position, inventory currency, quests, and time successfully restored on continue.                                                 |
| 7   | Regional Travel (Chennai → Pichavaram)  | **PASS** | Additive scene loading preserved player instance, arriving cleanly at destination.                                                       |
| 8   | Quality System Presets                  | **PASS** | Dynamic quality preset verified: `VeryLow` shadow distance (20m) vs `High` shadow distance (150m).                                       |

**Total: 8 Passed, 0 Failed.** Output captured in `automated_runtime_smoke_test.json`.

---

## 7. Remaining Out-of-Scope Items

- `FIREBASE RUNTIME TEST: BLOCKED — CREDENTIALS NOT AVAILABLE` — Cloud credentials/tokens are injected at runtime via environment variables; local JSON persistence remains 100% active and verified.
- **FPS on discrete target hardware** — Automated verification was run on the verification environment (Intel UHD graphics); discrete RTX baseline benchmarks remain targeted for Step 2 graphics pass.

---

## 8. Current State

The project **compiles with zero errors**, produces a verified 180 MB retail Windows build with exactly the 8 required scenes, and passes **8/8 automated runtime acceptance tests** exercising boot, menu, player locomotion, camera follow, save, load, region travel, and quality tiers.
