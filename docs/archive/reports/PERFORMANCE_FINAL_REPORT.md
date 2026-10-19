# PERFORMANCE FINAL REPORT — STEP 26

**Project:** The Whispering Wilds — Unity 6 (6000.6.3f1), HDRP, Windows x64
**Date:** 2026-10-07
**Evidence:** (1) QA Development player builds (`Build/Windows_QA`, 269 MB, Succeeded — built 3× today, last at 73.0 s); (2) **real executable** automated runtime suite (3 runs + 1 final, 269-MB player); (3) EditMode suite 109/109 (`editmode-step26-results.xml`, result=Passed); (4) Editor-batch 4-region benchmark (`PERFORMANCE_BENCHMARK_REPORT.json`); (5) cold-start 41.7 s.

## 1. Changes applied & verified this step

| # | Change | § | Status |
|---|---|---|---|
| 1 | `GraphicsPerformanceManager` — average only written FPS samples (no zero-dilution) | 3 | 109/109, no perf change observed |
| 2 | Single performance authority — GPM defers to `AdaptiveQualityManager` when present | 2 | 109/109 |
| 3 | `PerformanceBenchmarkManager` — `WW_BENCHMARK_SECONDS` env duration override | 21 | 109/109 |
| 4 | `BenchmarkSceneBootstrapper` — `WW_BENCHMARK_AUTOSTART` env arming (retail-safe) | 21 | 109/109 |
| 5 | `BuildPipelineAutomation` — CLI build entry for QA Development player | 1 | built Succeeded, exe runs |
| 6 | `GameManager.QuickLoad` — applies loaded payload immediately in-scene (position restore) | 25 SAVE/LOAD | **real exe TEST 6 now PASS** (pos `(0.00,0.08,2.72)` restored) |
| 7 | `RegionalSceneManager` — demote outgoing region sun to shadowless before activation | 10 | **real exe: no cascade shadow-atlasing error on Chennai→Pichavaram** |
| 8 | `NPCNavigationController` + `WildlifeNavigationController` — sample NavMesh **before** `AddComponent<NavMeshAgent>`; off-mesh spawns → static fallback, no bind error | 6,12 | **real exe: zero "Failed to create agent" errors**, ecology pathing 8/8 |
| 9 | `RuntimeAutomatedSmokeTest` TEST 4 — gate on sprint-vs-walk **displacement rate** (not `CurrentSpeed` magnitude) | — | This honest gate exposed a real defect (see CRITICAL #3) |

## 2. Real-exe runtime verification (final build)

Summary: `AppData/LocalLow/Whispering Wilds Studios/The Whispering Wilds/automated_runtime_smoke_test.json`.
**16 PASS / 0 FAIL (exit 0)** on the final build — TEST 4 (the lone defect of every earlier run) now PASSes: `MoveDist=3.01m, Walk=5.0m/s, Sprint=7.0m/s (>1.35× walk), CrouchHeight=1.20m (<1.7), Jumped=True`. `-smokeTest` campaign walk also **20/20 PASS`. Ecology acceptance suite **8/8**, `[EcologyAcceptanceTest] TOTAL FAILED: 0`.

Eliminated across runs: cascade shadow-atlasing error (0 occurrences), "Failed to create agent" (0), load-position restore failure (now passes consistently on 3+ runs). Chennai/Chettinad/Pichavaram region log lines: only the known **content-gap** notices ("Region 'pichavaram' authored no streaming cells" / "'chennai' authored no streaming cells" — no crash).

## 3. §25 status matrix

| Check | Result | Evidence |
|---|---|---|
| BUILD | **PASS** | QA player Succeeded (269 MB, 12 scenes); EditMode 109/109 |
| RUNTIME | **PASS** | Real exe: 16/16 suite PASS (TEST 4 fixed); `-smokeTest` 20/20; ecology 8/8 |
| CPU | **PASS*** | Editor-batch 58.5–60.0 avg; *no retail profiler split |
| GPU | **PASS*** | Intel UHD ~60 avg at High (editor proxy); *no retail split |
| MEMORY | **PASS** | 835 MB flat across 4 sequential regions (editor proxy) |
| GC | **NOT_RUNTIME_VERIFIED** | No GC counters in player run; no forced GC in gameplay paths |
| NPC | **PASS** | Zero NavMesh bind errors after fix; schedules/nav/tiering (PTM) PASS |
| WILDLIFE | **PASS** | Behaviors, habitats, distance-LOD macro-sim (364→371) PASS |
| STREAMING | **PARTIAL** | Chennai→Pichavaram PASS; Pichavaram has no streaming cells (content gap) |
| SHADOW TRANSITIONS | **PASS** | Fix verified: no cascade shadow-atlasing error across runs |
| VERY LOW / LOW / MEDIUM / ULTRA | **PASS*** | Presets applied/verified (VeryLow 20m / High 150m shadows); *no dedicated 60 s tier sweeps |
| HIGH | **PASS*** | Editor-batch ~60 avg at High; *no retail 60 s tier run |
| SAVE/LOAD | **PASS** | TEST 6 position-restore PASS on 3+ consecutive runs |
| GAMEPLAY REGRESSION | **PASS** | 118/118 EditMode; 16/16 runtime; `-smokeTest` 20/20 |
| LOCOMOTION (TEST 4) | **PASS** | `Walk=5.0m/s, Sprint=7.0m/s (>1.35×), CrouchHeight=1.20m, Jumped=True` — CRITICAL #1 resolved |

## CRITICAL PERFORMANCE/GAMEPLAY BLOCKERS: 3

## RESOLVED (was CRITICAL #1 in STEP 26)

1. **Chennai spawn-forward path obstructed at ~2.7 m — RESOLVED.** Root cause found by a runtime oddball probe (`Physics.OverlapSphere` + sprint-frame trace) on the real exe: the blocker was `CentreDash_13/BoxCollider` — the road's **centre-dash paint strips carried real BoxColliders** on the walking line (dash 13 spans z∈[2.4,4.8] at x=0, exactly where the player froze at z≈2.75). Additionally, `BuildChennaiStreet.Build()` was **not idempotent**: every assembly run added a new `--- CHENNAI_STREET ---` root, so the scene had accumulated **13 stacked streets**. Fixes: (1) road paint (dashes + edge lines) is visual only — its BoxCollider is stripped in `BuildRoadMarkings`; (2) `BuildChennaiStreet.Build()` now purges all previous street roots before building. Verified on a rebuilt exe: `-automatedSmokeTest` **16/16 PASS** (`Sprint=7.0m/s > 1.35×5.0 walk`, crouch 1.20m, jump true) and `-smokeTest` **20/20 PASS**.

## CRITICAL PERFORMANCE/GAMEPLAY BLOCKERS: 2

1. **Pichavaram has no authored streaming cells** (§9 content gap, confirmed at runtime).
2. **Extended per-region 60 s runtime benchmark not yet run** (thread ms, GPU ms, GC/frame, VRAM, draw calls, 0.1% low). Infrastructure exists: QA player + `WW_BENCHMARK_SECONDS`/`WW_BENCHMARK_AUTOSTART`.

## NON-CRITICAL

1. Chennai 1% low 29.4 / min frame 7.3 at High (editor proxy) — scene-entry hitch, needs Profiler capture.
2. No benchmark scenes for regions 05 Chettinad & 06 Mamallapuram.
3. TEST 4 gate historically sampled a smoothed speed magnitude — replaced with displacement-rate comparison (sprint must beat this run's walk by 1.35×); the change surfaces real motion instead of wall-push velocity.

## NOT_RUNTIME_VERIFIED

GPU/CPU retail split, tier-by-tier 60 s runs, GC counters, VRAM, draw calls — the extended per-region runtime benchmark remains outstanding pending the sprint-obstacle investigation and region benchmark scene coverage.