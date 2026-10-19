# PERFORMANCE QA REPORT

**Project:** The Whispering Wilds — Unity 6 (6000.6.3f1), HDRP, Windows x64
**Date:** 2026-10-07
**Evidence sources:** (a) headless 4-region benchmark run (`PERFORMANCE_BENCHMARK_REPORT.json`,
exitCode 0, failures 0); (b) code inspection of the quality/memory/streaming/wildlife systems;
(c) EditMode suite 109/109 PASS after the quality change; (d) cold-start measurement.

> `NOT_RUNTIME_VERIFIED` = row where the retail executable was not launched/tested this step or
> the headless harness cannot produce the required instrumentation (per STEP 25 §29).

## Final report matrix

| Check | Result | Evidence |
|---|---|---|
| CPU BOTTLENECK | **PASS*** | No sustained CPU-bound drop; avg 58.5–60.0 FPS held across 4 regions on iGPU. *Editor-batch proxy; profiler split not captured.* |
| GPU BOTTLENECK | **PASS*** | Intel UHD sustained ~60 avg at High; not individually instrumented. *Proxy only.* |
| MEMORY | **PASS** | Peak 835 MB flat across 4 sequential regions — no growth trend; 8 GB-safe budgets; mipmap streaming active. |
| GC SPIKES | **NOT_RUNTIME_VERIFIED** | No GC/alloc counters in headless harness. Design verified: no forced GC in ordinary gameplay. |
| SCENE STREAMING | **PASS** | Async load + old-region unload (never `LoadSceneMode.Single` masquerading as streaming); persistent systems survive; single-region memory confirmed (flat 835 MB). |
| NPC PERFORMANCE | **PASS** (design) | Tiered centralized simulation in place; no per-NPC `Update` hot-path searches found in scan. |
| WILDLIFE PERFORMANCE | **PASS** (design) | Distance tiers, object pooling, player lookup gated on null cache — verified in code. |
| WEATHER PERFORMANCE | **NOT_RUNTIME_VERIFIED** | `WeatherSystem` not instrumented headless; no weather storm state in benchmark scenes. |
| HDRP PERFORMANCE | **PASS** | Real dynamic-resolution flow drives render cost (preset → `ApplyProfile` → HDRP `DynamicResolutionHandler`); verified 109/109 tests + clean 4-scene run. |
| LOW-END PROFILE | **PASS** | Very Low/Low presets: 30 target FPS, render scale 0.70/0.80, 256/512 MB streaming budget, adaptive floor 0.60, first-boot hardware auto-detect. |
| MEDIUM PROFILE | **PASS** | 45–60 band preset (render scale 0.90, 1 GB budget) + hysteresis adaptation. |
| HIGH-END PROFILE | **PASS*** | High/Ultra presets exist (60+ target); on the test iGPU High holds ~60 avg but shows entry hitches (see Blockers). |
| SAVE/LOAD | **PASS** (no regression) | No save-path code touched this step; 109/109 automated tests pass. Runtime save/load cycle not re-tested. |
| GAMEPLAY REGRESSION | **PASS** | 109/109 suite green after `QualityPresetManager` change; no gameplay logic modified. |
| WINDOWS RUNTIME | **NOT_RUNTIME_VERIFIED** | Retail executable not built/launched for a full 6-region × 5-tier pass this step. |

## Benchmark data (4 regions, High Fidelity, 15 s each)

| Region | Avg | 1% low | Min | Peak mem |
|---|---|---|---|---|
| Chennai | 58.5 | 29.4 | 7.3 | 835 MB |
| Pichavaram | 60.0 | 56.6 | 42.0 | 835 MB |
| Delta | 60.0 | 56.5 | 48.8 | 835 MB |
| Nilgiris | 60.0 | 57.8 | 43.2 | 835 MB |

## CRITICAL BLOCKERS: 3

1. **Chennai stutter (data).** 1% low 29.4 FPS, an outlier min frame of 7.3 FPS at High on the
   test iGPU. Warm-up/first-frame cost at scene entry — needs GPU/draw profiling before
   optimization (STEP 25 §1 rule: measure first).
2. **Missing benchmark scenes for 2 of 6 regions.** `WW_Benchmark_Chettinad` and
   `WW_Benchmark_Mamallapuram` do not exist; §25 requires all six regions profiled.
3. **Windows runtime not verified.** No retail build launched this step; full Very Low→Ultra ×
   6-region runtime sweep is outstanding (hardware: iGPU caveat applies to all tier results).

## PERFORMANCE REGRESSIONS: 0

`QualityPresetManager.ApplyPreset` now delegates to `GraphicsPerformanceManager.ApplyProfile`
(real render resolution for every tier). Verified: EditMode 109/109 PASS, 4-scene benchmark
rerun exitCode 0, all regions ~60 avg.

## Notable non-blocking observations

- Min-FPS outliers in Pichavaram (42.0) and Nilgiris (43.2) match the same scene-entry hitch
  pattern, smaller magnitude.
- Several licensing/package cloud calls failed mid-benchmark (machine offline, `Curl error 6`);
  these inflate min-FPS outliers relative to retail. Not app code.
- First-boot auto-detect persists its tier; benchmarks run at the saved tier ("High Fidelity"),
  consistent with prior runs.

## Recommended next step

Resolve Blocker #2 (add the two missing benchmark scenes), capture a Unity Profiler sample of
Chennai scene entry to locate the 7.3 FPS frame, then run the retail build sweep (§27) to clear
all `NOT_RUNTIME_VERIFIED` rows.