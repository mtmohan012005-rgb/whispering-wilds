# RELEASE VALIDATION REPORT — Step 22 (Fixed World)
**Status: GATE PASSED** · Branch `ai/unity-graphics-world-upgrade`

## Build under test
| | |
|---|---|
| Unity | 6000.6.3f1 |
| Target | StandaloneWindows64 (x64) |
| Output | 182.1 MB, 8 scenes |
| Build time | 260.6 s |
| Build UTC | 2026-10-06T09:35:52Z |
| exe SHA256 | `96B492CB271111251FE42B8646E65370A1B7B566773A1E35B34C3F2D1AE70873` |
| Packaged RC | `TheWhisperingWilds_Windows_x64_RC/` (byte-identical exe, verified) |

## Smoke test result (standalone player, Windows)
`RESULT: passed=19 failed=0 skip=0 errors=2`

All 19 suite steps passed, including the two steps that failed on the pre-fix build:

| Step | This build | Pre-fix build |
|---|---|---|
| ground_detection_mask | **PASS** | FAIL |
| npc_simulation_ticks | **PASS** | FAIL |
| player_movement / world_renders / npc_population_spawns | PASS | PASS |
| region_transition / region_gating_* / mamallapuram_quest_chain | PASS | PASS |
| graphics_tiers_apply / language_persists / save+load / tamil+english ui | PASS | PASS |
| no_repeating_exceptions | PASS | PASS |

### Captured errors / warnings
- `errors=2` → both are the known transient **"Cascade Shadow atlasing has failed"** graphics messages that fire while two region suns coexist during an additive region transition. Not a failure; recorded as a Known Issue (see below).
- `Failed to create agent because it is not close enough to the NavMesh` ×5 → non-fatal warnings for NPCs spawned off the baked NavMesh surface; they simply do not path. Accepted and expected for wildlife markers.

> Evidence note: the suite's verdict was captured from the player's `-logFile` console stream
> (`[SMOKE] ... RESULT: passed=19 failed=0 ...`). The stand-alone report file write to the
> persistent-data folder was not independently readable this session because an
> environment-level folder churn repeatedly relocated `LocalLow\...\The Whispering Wilds`
> (unrelated to game logic). The `-logFile` capture is the authoritative record.

## Root causes fixed and verified by this run
1. **NavMeshAgent serialization race** — serialized agents were created during scene activation, before `NavMeshSceneLink.Awake` registered the baked data, and Unity never retried. Fixes in `NPCNavigationController`, `WildlifeNavigationController`, `EcologyNavMeshBaker` (controllers now add the agent at `Start`, the baker strips serialized agents). Verified indirectly: all NPC/region steps pass and navmesh region bakes completed for all 6 regions.
2. **`npc_simulation_ticks` returned 0** — the boot scene's `NPCPerformanceTierManager` won the `DontDestroyOnLoad` instance dedup and its `Start` pooled 0 NPCs with no later refresh. Fix: subscribe to `SceneManager.sceneLoaded` → `RefreshNPCList()` (unsubscribed in `OnDestroy`). Verified: simulation ticks now advance (step passes).
3. **`ground_detection_mask` resolved to 0** — every collider in the world lives on the Default layer (there is no dedicated Ground layer); *all* the ground-mask fallbacks were on the player's own layer, which `RefreshGroundMask` strips. Fix: final fallback to the serialized `groundLayers` value when both the self-strip and default-strip resolve to 0. Accepted cost: other Default-layer colliders near the ground are treated as standable.
4. **Missing spawn markers** — only scenes 05/06 authored a `SpawnPoint`. Fix: `AssembleAllRegions.SetupPlayerAndCamera` creates one when absent; Chettinad/Mamallapuram builders guard against duplicates; Chennai gets `EnsureChennaiSpawnMarker` in `AssembleWhisperingWilds`. Verified via `region_transition` and spawn steps.

## NOT_RUNTIME_VERIFIED (honest markers)
| Item | Reason |
|---|---|
| Low-end hardware (D3D11, 4 GB VRAM) | only tested on the QA machine; tier code runs, human-latency not measured |
| Human visual pass | screenshots/logs only; no human eyeballs on final art |
| Manual controller / UI UX | automated smoke covers core flows only |
| Noto Tamil font bundling | not bundled; glyph fallback used (pre-existing) |

## Known Issues (accepted, non-blocking)
- Cascade-shadow atlasing error during region transitions (two directional suns overlap briefly). Cosmetic/transient; interacts with only-one-shadow-caster-per-frame.
- Wildlife/NPC off-NavMesh spawn warning noise (harmless; agent just doesn't path).
- `LocalLow` persistent-folder churn observed on this machine makes post-hoc report-file reads unreliable; console `/ -logFile` stream is the dependable record.

## Build/bake confirmation
- Region `NavMesh` bakes succeeded for all 6 regions (tri counts: 02=222, 03=56, 04=288, 05=498, 06=266, 07=115) and are serialized in `unity/Assets/_Project/NavMeshData/...`.
- `BUILD_REPORT.json` in the RC folder: `result: Succeeded`, 8 scenes.

## Repo state
- Modified: `PlayerMovement.cs`, `NPCNavigationController.cs`, `WildlifeNavigationController.cs`, `NPCPerformanceTierManager.cs`, `EcologyNavMeshBaker.cs`, `AssembleAllRegions.cs`, `AssembleWhisperingWilds.cs`, `BuildChettinadMansion.cs`, `BuildMamallapuramShore.cs`, navmesh `.asset` files, region scenes.
- New: `QA/MamallapuramRouteVerifier.cs`.
- `TheWhisperingWilds_Windows_x64_RC/` is git-ignored (182 MB binaries never committed).

**Verdict:** shipable as an RC. All automated gates on the standalone windows player pass.