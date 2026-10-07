# Step 2 — Living NPC & Wildlife Simulation: Verification Report

**Project:** The Whispering Wilds (காட்டு வழி • தடம்)
**Engine:** Unity 6000.6.3f1 · Target: StandaloneWindows64
**Branch:** `ai/unity-graphics-world-upgrade` · Base commit: `8b7719d`
**Date:** 2026-10-01
**Status:** IN PROGRESS — not complete. Two runtime test failures were fixed in source but the
rebuilt verification run has not yet produced a passing result.

---

## 1. Starting point

A Step 2 rewrite already existed in the working tree (uncommitted, from another agent session).
It matched the requested architecture — `NPCStateMachine`, `NPCScheduleAction`,
`NPCNavigationController`, `NPCActivityAnchor`, `WildlifeDefinition`,
`WildlifeNavigationController`, `WildlifePopulationState`, `WildlifeSimulation`, `WildlifeSpawner`
— but **did not compile**.

### Critical baseline finding

At the committed baseline `8b7719d` there was **no navigation data of any kind**:

- `com.unity.ai.navigation` absent from `Packages/manifest.json` and `packages-lock.json`
- no `NavMeshSurface` component anywhere in the project
- all scenes serialized `m_NavMeshData: {fileID: 0}`
- **zero** `NavMeshAgent` components in any scene
- no `NavMesh.SamplePosition` / `NavMesh.AllAreas` calls anywhere

Every NPC and every animal therefore moved via direct `transform.position`
`Vector3.MoveTowards` — straight-line steering with no pathfinding, no obstacle avoidance, and no
terrain conformance. The requirement "NPCs must navigate through valid NavMesh paths" could not
have passed at baseline.

---

## 2. Compile repairs (PASS)

WIP compile failures fixed:

| Error                                                                                                                       | Fix                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `NPCScheduleManager` / `NPCPerformanceTierManager` / `WildlifeManager` / `WildlifeSimulation` not found in `BuildBootScene` | added `using WhisperingWilds.NPC; using WhisperingWilds.Wildlife;`                    |
| `AssembleWhisperingWilds` has no `AssembleGeorgeTownScene`                                                                  | corrected to real method `BuildPlayableChennaiScene()`                                |
| `QualityPresetManager.OnPresetApplied` / `.CurrentPreset` do not exist (2 files)                                            | switched to real API `OnQualityPresetChanged` + `CurrentTier` + `GetPresetSettings()` |
| `PooledWildlifeCount` renamed                                                                                               | updated call site to `TotalPooledCount`                                               |
| `FindProperty("profession")` on removed field (2 sites)                                                                     | replaced with `FindProperty("occupation").intValue = (int)NPCOccupation...`           |

**Batchmode compile: 0 errors.** Only pre-existing benign `CS0414` unused-field warnings.

### Quality preset integration fix

`npcDensityFactor` and `wildlifeDensityFactor` were **dead fields** — written by the preset table
and never read by any NPC or wildlife system. Both subsystems now subscribe to
`OnQualityPresetChanged` and scale their budgets by the preset's own factor, so editing the
`QualityPresetManager` table actually changes ecology density.

---

## 3. NavMesh (NEW — verified by bake)

`com.unity.ai.navigation` was **not added**. Its authoring component (`NavMeshSurface`) is absent
from the built-in AI module, but everything required for baking _is_ present in
`com.unity.modules.ai`, which the project already depends on. Verified by metadata scan of
`UnityEngine.AIModule.dll`: `NavMeshBuilder`, `NavMeshBuildSource`, `NavMeshBuildSettings`,
`NavMeshBuildMarkup`, `NavMeshData`, `NavMeshAgent`, `NavMeshQueryFilter`, `NavMeshHit`,
`CollectSources`, `BuildNavMeshData` all present; only `NavMeshSurface` absent.

This avoids adding an unpinned package dependency and any registry/network resolution risk.

Added:

- `Assets/_Project/Scripts/Editor/EcologyNavMeshBaker.cs` — collects walkable sources, bakes via
  `NavMeshBuilder.BuildNavMeshData`, writes an asset per scene, verifies the bake by registering
  the data and measuring `NavMesh.CalculateTriangulation()`, and fails loudly on zero geometry.
- `Assets/_Project/Scripts/World/NavMeshSceneLink.cs` — registers the baked data at runtime via
  `NavMesh.AddNavMeshData`. Needed because Unity's scene-level `NavMeshSettings` object is
  editor-internal and cannot be written from script.
- `EcologyNavMeshBaker.EnsureNavigationComponents()` — adds a real `NavMeshAgent` plus the correct
  navigation controller to every `NPCCharacter` and `WildlifeEntity`. `RequireComponent` only
  satisfies dependencies when a component is added at runtime, so entities restored from serialized
  scene data were missing them.
- Bake runs automatically inside `BuildPipelineAutomation.BuildProductionWindows`, after scene
  assembly and before the player build.

### Verified bake results (real triangles, not file presence)

| Scene                  | Sources | NavMesh triangles |
| ---------------------- | ------- | ----------------- |
| 02_Chennai_GeorgeTown  | 52      | 12                |
| 03_Pichavaram_Wetlands | 32      | 137               |
| 04_Thanjavur_Delta     | 41      | 288               |
| 05_Chettinad_Mansion   | 28      | 84                |
| 06_Mamallapuram_Shore  | 21      | 106               |
| 07_Nilgiris_Sanctuary  | 27      | 115               |

`NavMeshAgent` components now serialized into scenes: Chennai 2, Pichavaram 1, Delta 1,
Chettinad 1, Mamallapuram 1, Nilgiris 2. Baked `NavMeshData` assets are committed per scene under
`Assets/_Project/NavMeshData/<Scene>/`.

Chennai's count is low (12) because its geometry is mostly decorative architecture; flagged for art
pass, not a bake failure.

---

## 4. Logical ecology tick bug (FIXED, not yet runtime-verified)

`WildlifeSimulation.logicalTickInterval` was documented as "every minute of game time" but
accumulated `Time.deltaTime` and applied `0.25` units per tick — ecological drift ran ~1440x slower
than the comment claimed, so population growth was effectively inert.

Now separates real cadence (`realSecondsBetweenTicks`, 5s) from simulated drift
(`gameHoursPerTick`, scaled by `WorldTimeSystem.FastForwardMultiplier`) so pausing or
fast-forwarding the clock changes ecological speed consistently.

---

## 5. Habitat whitelist bug (FIXED, not yet runtime-verified)

`WildlifeHabitatZone.EnforceRegionalWhitelistDefaults()` applied its allow-list only
`if (allowedSpecies.Count == 0)`. `Awake` runs it first with the default `nilgiris`, so a later
`SetRegionId("chennai")` call left Nilgiris species in place. Effect: Chennai permitted
Spotted Deer and Peafowl while denying Egret — exactly the ecological leak the requirement targets.

The allow-list is now region-authoritative: cleared and replaced per region, with an unknown-region
fallback, and exclusion always wins.

---

## 6. Runtime acceptance suite

Added `TestBakedNavMeshAndAgentPathing()` to `RuntimeEcologyAcceptanceTest`. It locates a
`NavMeshSceneLink`, loads a gameplay scene additively when booted from `00_Boot`, samples points on
the real surface, and requires a `NavMeshAgent` to compute a `NavMeshPathStatus.PathComplete`
route. This is the check that distinguishes genuine pathfinding from the old transform fallback.

### Last completed run: 6 / 8 PASS

| #   | Test                                                    | Result                                         |
| --- | ------------------------------------------------------- | ---------------------------------------------- |
| 0   | Baked NavMesh present & agent pathing                   | **FAIL** — `00_Boot` has no `NavMeshSceneLink` |
| 1   | NPC daily routine schedule advancement                  | PASS (all three phases Idle — see gaps)        |
| 2   | NPC navigation & activity anchor interaction            | PASS                                           |
| 3   | Spatial whitelist & habitat containment                 | **FAIL** — Chennai allowed Nilgiris species    |
| 4   | Wildlife dynamic behaviors (Idle/Feed/Drink/Alert/Flee) | PASS                                           |
| 5   | Distance LOD tiers & background macro-simulation        | PASS — logical total 357 → 364                 |
| 6   | NPC performance tiering & CPU budget                    | PASS (telemetry active)                        |
| 7   | Living world time, season & atmosphere sync             | PASS                                           |

Both failures were diagnosed and fixed in source (Sections 3 and 5). **The rebuilt player has not
yet produced a passing run** — the verification build completed, but the subsequent play session
did not reach the ecology suite within its 600 s window and remains running. Treat both as
**FIXED, UNVERIFIED**.

---

## 7. Known gaps — requirements NOT met

These are unresolved and must not be reported as passing:

1. **Wildlife models: 1 of 11 species.** Only `nilgiri_tahr.glb` exists. Missing: Spotted Deer,
   Indian Gaur, Asian Elephant, Wild Boar, Bonnet Macaque, Peafowl, Egret, Kingfisher, Cattle, Goat.
   The requirement to use existing assets rather than invent replacements is satisfiable for exactly
   one species. Note the enum has both `BonnetMacaque` and the newly added `NilgiriLangur=11`.
2. **No wildlife prefabs.** `Assets/_Project/Prefabs` is empty; the only prefab in the project is
   `Assets/New Mesh.prefab`. `WildlifeManager.prefabPools` is empty in every scene, so pooling
   cannot spawn from serialized data.
3. **Population is negligible.** 7 NPCs and 1 animal exist across the entire project. "Herds" and
   "flocks" cannot be demonstrated with a single entity.
4. **NPC schedules are effectively inert.** Schedule lists serialize empty in every scene, so no
   schedule has been observed to cause actual movement. Test 1 passes while reporting Idle in all
   three day phases — it does not yet prove schedule-driven transitions.
5. **Habitat zones not serialized.** No `WildlifeHabitatZone`, `WildlifeGroup`,
   `WildlifeFoodSource`, or `WildlifeWaterSource` exists in any scene, despite the editor assembly
   scripts creating them.
6. **No AI diagnostics.** `PerformanceTelemetryOverlay` exposes no NPC/wildlife counters — no tick
   rate, tier distribution, active-AI count, or navigation cost.
7. **Stale scene serialization.** Scenes still write the removed `profession` field; that data is
   silently discarded by Unity. `artisan.glb`, `farmer.glb`, `fisher.glb` have zero scene
   references despite existing as assets.
8. **Profiling is not representative.** Test host is Intel UHD with D3D12 denied and D3D11 fallback.
   No target-hardware measurements exist.
9. **`GraphicsPerformanceManager` duplicates the preset table** verbatim with its own divergent
   copy of the same data. Not consolidated.
10. **Compilation path is slow.** A full build took ~5.9 hours under CPU contention from another
    concurrent Unity project.

---

## 8. Requirement status

| Requirement                                             | Status                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| NPC architecture classes                                | PASS                                                                       |
| Minimum NPC states                                      | PASS (enum present)                                                        |
| Minimum wildlife states                                 | PASS (enum present)                                                        |
| Real NavMesh pathing                                    | **UNVERIFIED** — baked and wired; rebuilt run pending                      |
| No direct transform teleportation                       | PASS (`SetDestination` validates + calculates path)                        |
| Distance-based performance tiers with hysteresis        | PASS                                                                       |
| Central AI tick / rate limiting                         | PASS                                                                       |
| Quality preset drives NPC + wildlife density            | PASS (was dead, now wired)                                                 |
| Species-specific behavior                               | PARTIAL — data present, 10/11 models missing                               |
| Habitat restrictions per region                         | PASS in logic, **unverified** after fix                                    |
| Wildlife pooling + population caps                      | PASS in code, no prefabs to pool                                           |
| Group movement / herding / flocking                     | PARTIAL — leader-offset exists, cannot demonstrate                         |
| Despawn / respawn rules                                 | PASS in code, untested                                                     |
| Save-safe deterministic state                           | PARTIAL                                                                    |
| Dev diagnostics hidden in retail                        | **FAIL** — no AI overlay exists; smoke/eco QA components ship in `00_Boot` |
| Region scene validation                                 | PARTIAL — only boot-scene path exercised end-to-end                        |
| Real profiling (avg FPS, 1% low, AI CPU, nav CPU, GC)   | **NOT DONE**                                                               |
| No new regions / quests / multiplayer / cloud / seasons | PASS                                                                       |

---

## 9. Next steps

1. Re-run the rebuilt player to obtain a clean ecology acceptance result for tests 0 and 3.
2. Author real NPC schedules and activity anchors per region so schedules cause observed movement.
3. Add `NavMeshAgent` + `WildlifeEntity` prefabs for Nilgiri Tahr, and populate `prefabPools`.
4. Serialize habitat zones, food and water sources, and groups into each region scene.
5. Add AI diagnostics (tier distribution, active counts, navigation cost) gated out of retail.
6. Decide how to source the 10 missing wildlife models — this needs a decision, not a code change.
7. Produce profiling numbers on real target hardware.
