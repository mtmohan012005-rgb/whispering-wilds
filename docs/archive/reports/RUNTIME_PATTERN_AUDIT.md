# RUNTIME PATTERN AUDIT — The Whispering Wilds

Audit: STEP 28, Section D (runtime patterns: safe-by-construction vs allocation/scanning hazards). Date: 2026-10-08.
Method: regex census over **147 scripts** (`unity/Assets/_Project/Scripts/`, all files). Occurrence counts = matches, not distinct lines. Every pattern with positive hits was reviewed at source level before a verdict (REVIEWED), so an all-clear is a real all-clear, not a guess.

## 1. Pattern census

| # | Pattern | Occurrences | Files | Verdict | Note |
|---|---|---|---|---|---|
| 1 | `GameObject.Find` / `FindWithTag` | 43 | 10 | SAFE | 41 in editor/QA assembly + capture; **2 runtime** (`RegionalSceneManager` scene-scoped-first spawn lookup, `TitleMenuController`). |
| 2 | `FindObjectOfType` / `FindObjectsOfType` (legacy) | 8 | 6 | SAFE | Start/Awake/one-time paths only (Journal.Start, SettingsMenu, InputBinding, CampaignFlow.Reset, RegionBootstrap). Never in an update loop. |
| 3 | `FindObjectsByType` / `FindAnyObjectByType` (modern) | 53 | 21 | SAFE | Scene-refresh and diagnostics, event driven (refresh on sceneLoaded / registration). Worst heat: `RuntimeVisualDiagnostics` (12, QA) and `NPCPerformanceTierManager.RefreshNPCList` (scene-load + register). |
| 4 | `Resources.Load` | 0 | – | SAFE | No resource-database loading anywhere. |
| 5 | `UnloadUnusedAssets` | 3 | 3 | **RESOLVED** | Now 1 runtime site: `MemoryManager.ControlledCleanupRoutine` (boundary-only). `MemoryBudgetManager` removed; `QAVisualDiagnostics` stays QA-only. Section I. |
| 6 | `GC.Collect` | 3 | 2 | **RESOLVED** | Now 1 runtime site, same boundary routine (never normal gameplay). Section I. |
| 7 | `PlayerPrefs` | 124 | 8 | **ACTION** | Settings/Display/Input/Graphics/Localization/AutoDetect/QualityPreset + smoke test. Sections T (stored/applied/persisted/verified) and U (settings vs campaign separation). |
| 8 | `SceneManager.Load/UnloadScene` | 11 runtime | 4 | **RESOLVED** | All 4 direct call sites now funnel through `CampaignFlow.RequestCampaignEntry → RegionalSceneManager` (or RSM fallback). Only RSM touches SceneManager. Section F → `SCENE_TRANSITION_AUDIT.md`. |
| 9 | `Camera.main` | 34 | 15 | SAFE | Every use lazy-caches after first resolution (verified in `PlayerMovement`, `NPCPerformanceTierManager`, `PhotoModeController`, Camera chain). No unconditional per-frame `Camera.main`. |
| 10 | LINQ (`using System.Linq`, `.Where/.Select/.ToList/...`) | 17 | 5 | SAFE | All in QA/editor (SmokeTest 9, Diagnostics, RunHeadlessBenchmark, RouteVerifier, BuildChennaiPopulation). No LINQ in hot runtime paths. |
| 11 | Per-frame allocations (`new List<`, `new GameObject`, `Instantiate` in update bodies) | – | – | SAFE | No confirmed allocation inside any reviewed Update/LateUpdate/FixedUpdate. `GameplayJournalUI.Refresh()` allocates panel rows only while the panel is open (acceptable). `GraphicsPerformanceManager` HDRP clone is a one-time guarded instance. |
| 12 | Per-frame `GetComponent` in Update | 1 | 1 | **FIXED** | `PhotoModeController.Update` resolved `PlayerInputHandler` every frame; now cached with a null re-probe guard. Section J. |
| 13 | `GetComponentInChildren<Animator>` re-probe when null | 1 | 1 | WATCH | `PlayerMovement.UpdateAnimator` re-queries every frame while animator is null. Retail builders attach an Animator + controller to the player visual, so the cache lands on frame one; a scene without an Animator would re-scan every frame. |
| 14 | Singleton `Instance` getters | 33 | 33 | SAFE | Ownership conflicts audited in Section E (Quality/ and World/ multipliers). |
| 15 | NavMesh API usage | 32 | 8 | SAFE | `NPCNavigationController` + `WildlifeNavigationController` probe-before-construct (no permanent Unity agent-creation errors), stuck recovery, bounds/zone containment, no-teleport fallback. All 6 region scenes ship baked `NavMeshData` (Assets/_Project/NavMeshData/*/). Bake-time `MamallapuramRouteVerifier` + runtime `RuntimeEcologyAcceptanceTest` gate real pathing — no failure suppression. Verdict below (§L). |
| 16 | Coroutines (`StartCoroutine`/`IEnumerator`) | 89 | 13 | SAFE | Concentrated where they belong: transitions, streaming, weather/daytime, wildlife, camping, benchmarks. |

## 2. Verified examples (evidence)

- **Camera.main lazily cached** — `PlayerMovement.Update` guards `mainCameraTransform == null && Camera.main != null`; `NPCPerformanceTierManager.AcquireCamera` resolves once and re-acquires only when the cached transform is null; `PhotoModeController` re-queries only when `photoCamera == null`.
- **`RegionalSceneManager` is the correct transition path** — additive async preload, gate via `RegionUnlocks`, scene-scoped spawn marker lookup with global fallback, sun demotion for single HDRP shadow-caster, manager rebinding, boundary cleanup through `MemoryManager` only. Every compliant caller funnels through `GameManager.TravelToRegion` → `RegionalSceneManager.TravelToRegion` (StateMapUI, WorldStreamingManager, SaveSystem read-back).
- **Entity animator binding is one-time** — `NPCCharacter`, `NPCNavigationController`, `WildlifeEntity` bind `Animator` in cached fields, and `NPCAnimationDriver` writes parameters only on state change.

## 3. Remediation backlog produced by this audit

| ID | Severity | Fix | Section |
|---|---|---|---|
| D-1 | MED | Cache `PlayerInputHandler` in `PhotoModeController`, remove per-frame `GetComponent`. | J | **FIXED** — cached + null re-probe guard. |
| D-2 | HIGH | Route the 4 direct `SceneManager.LoadScene` call sites through `RegionalSceneManager`. | F | **FIXED** — 0 direct sites remain. See `SCENE_TRANSITION_AUDIT.md`. |
| D-3 | HIGH | Define single memory authority (`MemoryManager`) for boundary cleanup; demote/remove `MemoryBudgetManager` duplicate. | I | **FIXED** — `MemoryBudgetManager` removed; `MemoryManager` sole GC/Unload + streaming authority. See `MEMORY_LIFETIME_AUDIT.md`. |
| D-4 | MED | Single quality authority (`GraphicsPerformanceManager`); keep only one adaptive loop. | G | **FIXED** — `AdaptiveQualityManager`+`AutoQualityDetector` removed; GPM sole loop. See `QUALITY_OWNERSHIP_AUDIT.md`. |
| D-5 | MED | Single clock/weather system owner. | E | **PASS** — `WorldTimeSystem` authoritative; `TimeOfDayManager` facade only. |
| D-6 | MED | PlayerPrefs settings audit: STORED/APPLIED/PERSISTED/RUNTIME VERIFIED per setting; keep settings separate from campaign save. | T/U | PENDING — tabla awaits §T/U run. |
| D-7 | MED | NavMesh failure fixes in NPC navigation (no suppression). | L | **PASS** — no suppression; failures keep entities stationary (no teleport), Unity agent-creation errors prevented by probe-before-construct, every region scene ships baked data (verified), route verifier + ecology acceptance test gate real pathing. |

## §L NavMesh verdict (census #15)
Deep-read all three runtime nav consumers and the baker:
- `NPCNavigationController.cs` (290L) — `SetDestination` rate-limits, clamps to scene bounds, samples the destination, `CalculatePath` reachability check, stuck detection with recovery via nearby valid clearance point, and *fails safe stationary on missing NavMesh* (no transform teleport for ordinary movement, per class contract). `Start()` probes before `AddComponent<NavMeshAgent>` so off-mesh spawns never trigger Unity's permanent "Failed to create agent because it is not close enough to the NavMesh" error.
- `WildlifeNavigationController.cs` (368L) — dual-mode ground + avian, ground walkers construct the agent in `Start()` after NavMeshSceneLink registers data, habitat clamping, stuck recovery to a random roaming point, ground-clearance safeguard for birds, containment turn-back.
- `NavMeshSceneLink.cs` — registers the baked `NavMeshData` at asset level via `NavMesh.AddNavMeshData`; ships real data (each of 02–07 scenes has a non-trivial baked asset, 22KB+).
- Bake + QA scaffolding — `EcologyNavMeshBaker` writes assets and binds via `SetNavMeshData`; `MamallapuramRouteVerifier` (bake-time route audit) + `RuntimeEcologyAcceptanceTest` (runtime `HasUsableNavMesh` + agent pathing assertions) prove reachability rather than suppressing it.
- No console-spam suppression of real failures: the sole warning dedups are static bools that still report exact scene + position once; `.isDebugBuild` gating on the link warning is covered by the runtime acceptance gate which asserts pathing in test and QA builds.

No code change required for §L this pass; all runtime + QA paths already enforce "fix, never suppress".

No other unsafe patterns were found in the scanned runtime code; there are no `Resources.Load`, no per-frame `FindObject*`, no per-frame allocations, and no per-frame `Camera.main` in the verified scope.