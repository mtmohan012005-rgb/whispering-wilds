# RELEASE VALIDATION REPORT - Step 22 (Real Windows Release Validation)

**Branch:** `ai/unity-graphics-world-upgrade`
**Unity:** 6000.6.3f1 · **Target:** StandaloneWindows64 (x64), HDRP project
**Candidate:** `TheWhisperingWilds_Windows_x64_RC/`
**Date (UTC):** 2026-10-06

## BUILD
- Clean release candidate produced with `BuildPipelineAutomation.BuildProductionWindowsFromCommandLine()` (non-development, `BuildOptions.None`); stale output deleted before each build.
- Succeeded: 8 scenes, output ~190,187,343 bytes (~181.4 MB).
- Region NavMesh bakes regenerated and serialized for all 6 regions:
  Chennai 222, Pichavaram 56, Thanjavur 288, Chettinad 498, Mamallapuram 266, Nilgiris 115 triangles.
- Package contents (runtime only, checked): `D3D12/`, `MonoBleedingEdge/`, `TheWhisperingWilds_Data/`, `TheWhisperingWilds.exe`, `UnityCrashHandler64.exe`, `UnityPlayer.dll`, `DirectML.dll`, `dstorage.dll`, `dstoragecore.dll`.
- Removed debug artifacts from the package per Step 19: `BUILD_REPORT.json` stripped; no `Library`, `Temp`, `Logs`, editor files, source assets, `.pdb`, or backup folder present.
- exe SHA256: `96B492CB271111251FE42B8646E65370A1B7B566773A1E35B34C3F2D1AE70873`.

## RUNTIME
- Standalone player (outside the Unity Editor) **launches** from its own folder and stays alive (verified alive after 12 s of a normal, non-`-smokeTest` launch) — **Pass**.
- Automated Step-11/18 standalone suite on the release player: **`passed=19 failed=0 skip=0 errors=2`**.
  - Boot scene loads; New Game reaches Gameplay; player integrates movement; world renders (497 renderers, 21 lights).
  - NPC population spawns (14 live, 5 mains, 12+ residents registered).
  - `ground_detection_mask` **Pass** after fix (mask now resolves non-zero).
  - `npc_simulation_ticks` **Pass** after fix (ticks/s=105; near=7 med=7).
  - Region transition (Chennai → Pichavaram additive), destination gating, Mamallapuram 11/11 quest chain, graphics tiers (5 presets apply), Tamil + English UI resolution, language persistence, save-write + load-restore in-process, NaN/Infinity save rejection, no repeating exceptions — all **Pass**.
- `errors=2`: transient **"Cascade Shadow atlasing has failed"** during an additive scene transition (two region suns coexist). See Known Issues.

## REGIONS
| Item | Result |
|---|---|
| Chennai (spawn, render, movement) | Runtime-verified via smoke (render/move/navmesh present) |
| Pichavaram (loadable, no spawn-artifact error) | Load transition verified; gameplay not manually played |
| Thanjavur / Chettinad / Mamallapuram | Not manually played — `NOT_RUNTIME_VERIFIED` |
| Mamallapuram route reachability | Verified 9/9 (route verifier: 266 tris; 4 arrival triggers + 5 interactables reachable) |
| Nilgiris | **Unreachable** — `RegionUnlocks.DeferredRegionIds` refuses it; no intended path |
| Final Chapter / Ending | **No implementation exists** in the build |
| Post-game exploration | Not applicable (no ending) — `NOT_RUNTIME_VERIFIED` |

## STORY
- Mamallapuram quest chain auto-verified 11/11 stages driven by their own gameplay events.
- Chennai → Pichavaram destination gating and Chettinad-clue-opens-Mamallapuram verified.
- Regional clue contribution to the main mystery across Pichavaram/Thanjavur/Chettinad/Nilgiris, final evidence, and ending: **no ending system in the build** — `NOT_RUNTIME_VERIFIED`.

## SAVE_LOAD
- In-process `save_writes` + `load_restores_player` pass (valid JSON, position restored).
- NaN/Infinity rejected, extreme coordinates clamped — pass.
- Save isolation worked on the final run (user save folder moved to stash and restored).
- Manual **Save → Quit app → Relaunch → Continue** flow on the packaged exe: **not performed** — `NOT_RUNTIME_VERIFIED`.
- Saves at each region / quest / nilgiris / final / completed: **not created** — `NOT_RUNTIME_VERIFIED`.

## LANGUAGE
- English + Tamil string resolution on the release player: pass (menu/localization keys resolve; `WW_Language` persists).
- Missing glyphs, broken Tamil shaping, overlapping/truncated text in actual menus/journals/map/ending: **not visually inspected** — `NOT_RUNTIME_VERIFIED`. (Noto Tamil is not bundled; glyph fallback is used — pre-existing.)

## INPUT
- Keyboard / mouse / camera / movement / sprint / crouch / jump / interact / inventory / journal / map / pause / save-load / quit: **not manually exercised** — `NOT_RUNTIME_VERIFIED`.
- Controller: not tested — `NOT_RUNTIME_VERIFIED`.

## NPC
- Population spawns (14 live in Chennai) and tiered simulation ticks measured (105 ticks/s; near=7, med=7).
- **7 Chennai NPC/wildlife agents emit `Failed to create agent because it is not close enough to the NavMesh`** — their transforms sit off the baked NavMesh surface, so those agents never bind and cannot path.
- 9 s observation window: `moved=0/14` (agents at/after the observed hour did not move). Day-cycle wake/travel/work/eat/socialize/return/sleep, stuck-NPC, duplication, and schedule-integrity checks over an extended period: **not observed** — `NOT_RUNTIME_VERIFIED`.

## WILDLIFE
- Species (elephant, gaur, Nilgiri tahr, langur, peafowl) regional placement, habitat bounds, wander/rest/flee, observation gameplay, controlled spawning: **not observed** — `NOT_RUNTIME_VERIFIED`.

## ECONOMY
- **Buy/sell/vendor stock is not reachable in the packaged game**: `NPCWallet` trading code exists but has no scene instance or gameplay caller, and vendors are not wired into any scene.
- Insufficient funds / missing item / unavailable item / repeated / zero-quantity / large-quantity transactions and currency-invariant checks: **not testable in the build** — `NOT_RUNTIME_VERIFIED` (blocking).

## PERFORMANCE
- FPS, 1% low, frame times, loading times, VRAM and per-tier (Very Low → Ultra) measurements in an actual playable session: **not measured** — `NOT_RUNTIME_VERIFIED`. No invented numbers.

## MEMORY
- No out-of-memory in the 5+ short automated/launch sessions.
- Formal memory profile (heap, VRAM ceiling, leak check over long sessions): **not measured** — `NOT_RUNTIME_VERIFIED`. QA machine has 7.75 GB RAM / Intel UHD; this is not a clean-environment or wide-hardware claim.

## CRASHES
- Multiple standalone sessions (3 clean RC builds + several smoke/launch runs) — no crash, hang, or device-lost observed so far.
- Session duration/stress coverage is minimal; not a release-level crash soak — `NOT_RUNTIME_VERIFIED` beyond the smoke/launch evidence.

## KNOWN_ISSUES
- Cascade-shadow atlasing error during additive region transitions (two directional suns coexist briefly); only one directional shadow caster works at a time — cosmetic, transient.
- 7 Chennai agents off the baked NavMesh; they never bind and never path (non-fatal warnings).
- Noto Tamil font not bundled; Tamil UI relies on glyph fallback (pre-existing, not introduced here).
- `LocalLow` persistent-folder churn on this QA machine makes post-hoc report-file reads unreliable; `-logFile` console captures are the dependable record.
- World authoring uses only the Default layer (no Ground/Structure layers actually applied to geometry) and no streaming cells in Chennai/Pichavaram — content gaps noted by the world streaming manager, non-fatal.

## RELEASE_BLOCKERS
1. **Critical — primary story cannot be completed.** Nilgiris is deferred and refuses unlock, and there is no Final Chapter or Ending in the build. Step 3 (progression to ending) is impossible on the packaged game.
2. **Major — NPC agents cannot path.** 7 agents fail to bind to the baked NavMesh from authored positions; day-cycle travel for those actors does not run.
3. **Major — economy unreachable.** No vendor/trading node exists in any reachable scene, so Step 13 cannot be satisfied in the build.
4. **Major — manual validation not performed.** Clean-machine flow (Save→Quit→Relaunch→Continue), controller/input, human visual and audio passes, multi-tier performance/memory measurement, and long-session crash soak are all `NOT_RUNTIME_VERIFIED`.

## VERDICT
**RELEASE_BLOCKED**

The automated standalone gates pass (19/19), the RC package is clean and launches, and two runtime blockers found during validation (ground mask, NPC simulation init) were fixed and verified. However, the complete game cannot be played to an ending, NPC pathing is broken for part of the population, trade is unreachable, and required manual/performance validation is unperformed. Per Step 21, a remaining Critical/Major issue forces `RELEASE_BLOCKED`, not `RELEASE_CANDIDATE_READY`.