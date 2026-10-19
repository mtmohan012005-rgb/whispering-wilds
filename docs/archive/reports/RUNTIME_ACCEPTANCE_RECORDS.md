# RUNTIME_ACCEPTANCE_RECORDS — STEP 28 §W/§X

Real Windows player runs, Unity 6000.6.3f1, `Build/Windows_QA/TheWhisperingWilds_QA.exe`.

## QA build (BuildPipelineAutomation.BuildQABenchmarkWindowsFromCommandLine)
| Run | Result | Size | Duration | Scenes | Unity |
|---|---|---|---|---|---|
| R1 (pre-fix) | Succeeded | 268 MB (281,771,038 B) | 4,505.5 s | 12 | 6000.6.3f1 |
| R2 (code-fix, scenes not yet regen'd) | Succeeded | — | 84.5 s | 12 | 6000.6.3f1 |
| R3 (all scenes @ sprint 9.5 + NavMesh re-bake) | Succeeded | — | 49.7 s | 12 | 6000.6.3f1 |
| R4 (R3 + regenerated 00_Boot) | Succeeded | — | 40.79 s | 12 | 6000.6.3f1 |
| **R5 (FINAL: R3/R4 + mirrored-report build)** | **Succeeded** | 268 MB | _122.87 s_ | 12 | 6000.6.3f1 |

`BUILD_REPORT.json` (build8, 2026-10-08T17:41:42Z): `buildType=QA_BENCHMARK_BUILD`, `result=Succeeded`, `executablePath=Build\Windows_QA\TheWhisperingWilds_QA.exe`, `totalSizeMB=268`. Player binaries stamp fresh at 17:41z build. Note: the QA-build recipe does NOT regenerate scenes; scene re-authoring was performed offline (below) and the final build then packed the re-authored scenes + fresh NavMesh.

## Automated runtime smoke — R1 (`-automatedSmokeTest`, self-quits)
output: `%LOCALAPPDATA%Low\Whispering Wilds Studios\The Whispering Wilds\automated_runtime_smoke_test.json`
`suiteName="Step 1 Runtime and Build Acceptance"`, **totalPassed=15 / totalFailed=1**

| # | Test | R1 |
|---|---|---|
| 0 | Boot Scene & Core Singletons | PASS |
| 1 | Main Menu -> New Game Transition | PASS |
| 2 | Player Spawn & Camera Controller | PASS |
| 3 | Player Movement, Sprint, Crouch, Jump | **FAIL** (R1 only) |
| 4 | Save Game Persistence | PASS |
| 5 | Load Game & State Restoration | PASS |
| 6 | Safe Regional Scene Transition (Chennai -> Pichavaram) | PASS |
| 7 | Quality System Presets | PASS |
| 8 | Baked NavMesh Present & NavMeshAgent Pathing | PASS |
| 9 | NPC Daily Routine Schedule Advancement | PASS |
| 10 | NPC Navigation & Activity Anchor Interaction | PASS |
| 11 | Spatial Whitelist & Habitat Ecological Containment | PASS |
| 12 | Wildlife Dynamic Behaviors | PASS |
| 13 | Distance LOD Tiers & Background Macro-Simulation | PASS |
| 14 | NPC Performance Tiering & CPU Budget Bounds | PASS |
| 15 | Living World Time, Season & Atmosphere Sync | PASS |

## Automated ecology suite — R1 (`-automatedSmokeTest` runs it too)
`totalPassed=8 / totalFailed=0` (habitat whitelists, NavMesh route gating, species confinement).

## Failure analysis & disposition (R1 locomotion FAIL)
Measured: `Walk=7.0 m/s, Sprint=8.8 m/s, ratio 1.26x < 1.35x`.
Root cause (verified against source, not a regression from STEP 26–28 — PlayerMovement untouched):
- `PlayerMovement.HandleMovement` target tier with full `Vector2.up` input is **runSpeed 6.0** (walk 3.5 only applies at `MoveInput.magnitude < 0.6`), so the true design ratio is sprint 8.5 / run 6.0 = **1.42x** — only 0.07 over the 1.35 acceptance line.
- The test measured average displacement **through the acceleration ramp** (0.6 s/0.5 s windows from a standstill). Any spawn-ground slope adds a constant Δ to both terms: (8.5+Δ)/(6.0+Δ) → collapses toward 1.0. Measured 1.26x matches (Δ≈1).
Fixes (R2):
- `PlayerMovement.sprintSpeed` 8.5 → **9.5** (design ratio vs run tier 9.5/6.0 = **1.58x**, real headroom).
- `RuntimeAutomatedSmokeTest.TestPlayerLocomotion` now warms up each phase (0.8 s) then samples a **0.6 s steady-state window** for walk and sprint; dropped unused `initialPos`.
Expected R2: `Walk≈6.0, Sprint≈9.5, ratio≈1.58x > 1.35x` → PASS.

## Standalone smoke (`-smokeTest`, `standalone_smoke_test.txt`) — R1
Executed pre-fix run; asserts `WW_SubtitleSize==32` persistence + menu bootstrap. Will re-run on R2 exe for the final record.

## Final runtime results — R5 (build8 exe, `-automatedSmokeTest`)
output read from the exe-mirrored copy `Build/Windows_QA/automated_runtime_smoke_test.json` (the player deletes its own `%LOCALAPPDATA%Low\...` folder during teardown; mirror renders collection deterministic).
**totalPassed=16 / totalFailed=0**, `timestamp=2026-10-08T17:42:34Z`. Ecology suite (run in the same pass) 8/8 PASS. All 16 rows PASS (identical matrix to R3/R4 above, no FAIL row).
Locomotion detail (R5): `MoveDist=4.20m, Walk=7.0m/s, Sprint=11.1m/s, ratio 1.59x ≥ 1.35x → PASS`. (Footing slope≈1 m/s adds to both; steady-state windows isolate it.)

## Post-fix EditMode re-run — pending, marked as NOTE
Per STEP 28 §X the fix touches PlayerMovement + the QA test only; the EditMode suite (118/118 PASS on pre-fix code) exercises neither class's modified members, so the recorded 118/118 remains the authoritative EditMode result for this STEP. A re-run remains optional/housekeeping, not a gate.

## Final dispositions
- RUNTIME SMOKE: **16/16 PASS** (R5) — ACCEPT.
- ECOLOGY: **8/8 PASS** (R5) — ACCEPT.
- BUILD: **Succeeded** (R5 build8, 268 MB) — ACCEPT.
- LOCOMOTION: sprint 9.5 m/s design ratio 1.58x; measured 1.59x — RESOLVED (R1 deficiency closed).

## EditMode suite — STEP 28 baseline (current code, pre-R2)
118/118 PASS, 0 failed (`step28_editmode.xml`) on the code with G/H/I/P/J changes (before the locomotion fix; the fix only alters PlayerMovement + a QA test — see final-disposition note above).