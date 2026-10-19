# STARTUP PERFORMANCE REPORT

**Project:** The Whispering Wilds — Unity 6 (6000.6.3f1), HDRP, Windows x64
**Date:** 2026-10-07

## Measured

| Measurement | Value | Method |
|---|---|---|
| Editor batch cold start (project open → scripts compiled → clean exit) | **41.7 s** | `Start-Process` + `WaitForExit`, stopwatch, exit code 0 |
| Play-mode entry cadence per region (load → enter play → 15 s benchmark → exit play) | **~20 s / region** | Benchmark result timestamps: Chennai 16:18:22 → Pichavaram 16:18:42 → Delta 16:19:02 → Nilgiris 16:19:21 UTC (fixed 20 s cadence) |
| Benchmark run integrity | exitCode 0, 4/4 regions, 0 failures | `RunHeadlessBenchmark` aggregate report |

The 20 s cadence includes the transition (unload prior region, load next, re-enter play) plus the
15 s benchmark, so the region load-to-first-frame portion is **≈5 s** incremental in the Editor
harness during a warm run.

## Boot sequence under test (by inspection)

`00_Boot` → persistent systems (`--- MANAGERS ---`: game, save, settings, localization, audio,
quality, weather/time) → menu → selected region. Regional content loads on demand via
`RegionalSceneManager` (async load + prior-region unload), so **no region is initialized during
boot** — consistent with STEP 25 §22.

## Not runtime-verified

- **Retail executable startup time** (the real `TheWhisperingWilds` .exe): not measured this
  step. Editor-batch numbers are a proxy (Editor overhead is generally higher than a built
  player's).
- Splash/license/IL2CPP (or Mono) JIT cost of the standalone player: platform-dependent, must be
  measured on the built player.

## Recommendations

1. Add a Command-line/QA-only start counter at the top of `GameManager.Start` and log boot →
   main-menu → first-region timings through the existing benchmark harness so the retail exe
   reports its own startup numbers (closes the `NOT_RUNTIME_VERIFIED` gap).
2. A 41.7 s cold start is dominated by Editor script-compile; a built player skips that, so
   expect materially less. Verify once a Windows build exists.