# PERFORMANCE BASELINE REPORT

**Project:** The Whispering Wilds — Unity 6 (6000.6.3f1), HDRP, Windows x64
**Machine under test:** Laptop, Intel UHD Graphics (integrated, ~2 GB VRAM class), ~8 GB RAM
**Harness:** Headless Editor batch (`RunHeadlessBenchmark`), one 15 s benchmark per region, saved quality preset = High Fidelity
**Date:** 2026-10-07

> Honesty note: these numbers come from the **Editor-batch** headless harness, not the retail
> executable. They are representative of real rendering load on this machine's iGPU, but
> editor overhead, CPU/GPU separation, GC counters, SetPass/draw calls and retail-exe startup
> are **not** captured by this harness. See `PERFORMANCE_QA_REPORT.md` for the PASS/FAIL matrix.

## 1. Measured data — all regions (15 s each, High Fidelity)

| Region | Avg FPS | Min FPS | Max FPS | 1% Low FPS | Avg frame (ms) | Peak mem (MB) | Frames |
|---|---|---|---|---|---|---|---|
| 02 Chennai GeorgeTown | **58.5** | **7.3** | 302.5 | **29.4** | 17.10 | 835 | 877 |
| 03 Pichavaram Wetlands | 60.0 | 42.0 | 106.4 | 56.6 | 16.67 | 835 | 900 |
| 04 Thanjavur Delta | 60.0 | 48.8 | 76.3 | 56.5 | 16.67 | 835 | 901 |
| 07 Nilgiris Sanctuary | 60.0 | 43.2 | 75.8 | 57.8 | 16.67 | 835 | 900 |

`MIN_FPS`/`MAX_FPS` include the frame immediately around scene entry and are dominated by a
single transient hitch; sustained pacing is better described by `1% LOW FPS`.

## 2. Verdict summary

- **The game is NOT CPU- or GPU-*saturated* in steady state.** Three of four regions hold a
  locked 60 FPS average with 1%-low 56.5–57.8 on an integrated GPU at **High** preset.
- **The real problem is stutter, not throughput.** Every region shows ≥1 frame well below the
  pacing line at entry; Chennai is the worst by a wide margin (min 7.3 FPS, 1% low 29.4).
- **Memory is flat** at 835 MB across four sequential scene loads (no growth trend).

## 3. Top causes of frame-time problems (ranked by evidence)

1. **Scene-entry first-frame hitch** — dominant pattern; min-FPS outliers in every scene
   (Pichavaram 42.0, Nilgiris 43.2, Delta 48.8, Chennai 7.3). Consistent with one-time work at
   play-mode entry: HDRP shader warm-up, camera-path framing, first-frame wildlife/NPC tiers.
2. **Chennai scene-entry cost** — the only sub-30 1% low. Heaviest population/layout of the
   profiled set; needs profiling (GPU/SetPass/draws) to separate geometry vs effects.
3. **Editor-batch environment** — licensing client + package lookups stalled several times
   mid-benchmark (offline network, `Curl error 6`), inflating min-FPS outliers vs retail.
   Not app-code; validates the `NOT_…` caveats on min-FPS figures.
4. **No GC/allocation or render-work split available** — harness limitation, not yet
   attributable; candidates (wildlife per-frame logic, weather, UI rebuilds) are guarded by
   design but unmeasured.

## 4. Code-level baseline findings (inspection, this step)

| System | Status | Evidence |
|---|---|---|
| Adaptive quality (§2) | OK — hysteresis + real HDRP resize | `AdaptiveQualityManager` 3 s/8 s timers, 4 s cooldown; drives `GraphicsPerformanceManager.ApplyEngineRenderResolution` (real `DynamicResolutionHandler`) |
| Quality presets → real render cost (§3/§23) | **FIXED this step** | `QualityPresetManager.ApplyPreset` now delegates to `GraphicsPerformanceManager.ApplyProfile` (render scale + HDRP dynamic res + camera binding) instead of settings-only |
| Memory management (§4) | OK by design | `MemoryBudgetManager.Update` performs no periodic `GC.Collect()`/`Resources.UnloadUnusedAssets`; cleanup only at region boundary via `MemoryManager.ExecuteControlledBoundaryCleanup`; severe recovery gated off by default |
| Regional streaming (§5/§6) | OK by design | `RegionalSceneManager` uses `LoadSceneAsync` + `UnloadSceneAsync` of the prior region; persistent managers object (`--- MANAGERS ---`) survives; scene-scoped spawn lookup avoids cross-region marker confusion |
| Wildlife (§8) | OK by design | Distance tiers + pooling (`WildlifeManager` object pool); `GameObject.FindWithTag("Player")` runs only while the cached reference is null |
| NPC (§7) | Present | `NPCPerformanceTierManager` / `NPCScheduleManager` exist; centralized tiered simulation |
| Per-frame searches (§13) | Clean in runtime hot paths | All `FindWithTag`/`FindObjectOfType` hits outside Editor/QA code are gated on null cache, one-time boot, or scene-transition scope |

## 5. Not measured (harness limits — see QA report)

CPU vs GPU frame-time split, render-thread cost, SetPass calls, batches/triangles, visible-object
counts, GC allocation spikes, animator/AI/physics breakdown, and the two regions without
benchmark scenes (05 Chettinad, 06 Mamallapuram). These require Unity Profiler captures and/or a
retail build.

## 6. Real-player runtime verification (STEP 26, added later same day)

A QA Development player (`Build/Windows_QA/TheWhisperingWilds_QA.exe`, 269 MB, 12 scenes) was
built and **the real executable was launched**. The automated runtime suite reported **15 PASS /
1 FAIL**:
- PASS — boot/menu/player/spawn, locomotion, save, Chennai→Pichavaram transition, quality
  presets, NavMesh pathing (7 paths), NPC schedules/navigation/tiering, wildlife behaviors +
  distance LOD macro-simulation, time/season sync.
- FAIL — **Load Game & State Restoration**: save captured pos `(0.0, 0.1, 2.7)` but load leaves
  the player at the spawn marker `(15.00, -1.38, 17.69)`.

Player log also reproduced two known runtime defects end-to-end:
- `Cascade Shadow atlasing has failed, only one directional light can cast shadows at a time` ×2
  (region-transition window, §10).
- `Failed to create agent because it is not close enough to the NavMesh` ×2 (off-mesh spawns, §6).

### 6.1 Post-fix re-verification (later same day)

All three defects were fixed and re-verified on the rebuilt real exe:
- **Load position restore** — `GameManager.QuickLoad` now applies the loaded payload in-scene; TEST 6 passes on 3+ consecutive runs (pos `(0.00, 0.08, 2.72)` restored).
- **Cascade shadow atlasing** — `RegionalSceneManager` demotes the outgoing region's sun (shadowless) before activating the target; the error no longer appears on Chennai→Pichavaram.
- **NavMesh agent bind** — NPC + wildlife controllers sample the mesh before `AddComponent<NavMeshAgent>`; zero "Failed to create agent" errors remain, ecology navigation 8/8.

New runtime defect surfaced by upgrading TEST 4 to a displacement-based gate: the player's forward path from the Chennai spawn is obstructed at ~2.7 m — simulated walk advances 2.67 m, then sprint advances 0.0 m while the speed magnitude reads 4.3–7.1 m/s (obstacle/wall push). Reproducible in every build including the pre-edit one; scene/input investigation pending.

Full detail + §25 matrix in `PERFORMANCE_FINAL_REPORT.md`.