# SCENE_TRANSITION_AUDIT — STEP 28 §F

Status: **PASS** — implemented and build-verified (full `idea_build_project`: isSuccess=true, 0 problems; `idea_lint_files` 0 errors).

## Requirement
`CampaignFlow` must never call `SceneManager.LoadScene` directly. Every region transition flows
`CampaignFlow → RegionalSceneManager → validated/async load → spawn validation → manager binding → region ready`.

## Ownership
`RegionalSceneManager` is the ONLY component that touches `SceneManager`. All transitions route through it:

| API | Behavior | Usage |
|---|---|---|
| `RegionalSceneManager.EnterCampaignRegion(string regionId)` (L141) | Cold-start SINGLE-mode load. New in this audit. Gate-free by design (see below). Fires `OnRegionLoadStarted/Completed/Failed`. | All campaign entry |
| `RegionalSceneManager.EnterCampaignRegionFallback(string regionId)` (L118, static) | Last-resort single-mode load when no RSM instance exists (standalone tests/diagnostics). Keeps load ownership on RSM. | `CampaignFlow.RequestCampaignEntry` fallback |
| `RegionalSceneManager.TravelToRegion(string regionId)` (L70) | ADDITIVE streaming load (`LoadSceneAsync` + unload old, L218/L271), RegionUnlocks-gated, axe-geo validated. | In-game map travel |
| `SceneManager` internal sites | `LoadScene` L124 (fallback), L169 (EnterCampaignRegion); `LoadSceneAsync(Additive)` L218; `UnloadSceneAsync` L271. | sole touchpoints |

## Complete caller inventory (all entry points)
1. `CampaignFlow.StartNewGame` → `RequestCampaignEntry("chennai")` (CF:97)
2. `CampaignFlow.ContinueGame` → `RequestCampaignEntry(save.currentRegionId)` (CF:182)
3. `CampaignFlow.RequestCampaignEntry` (static funnel, CF:106) → RSM.Instance.EnterCampaignRegion, else EnterCampaignRegionFallback (CF:112/117) — CampaignFlow has ZERO direct SceneManager references.
4. `TitleMenuController.OnNewGameClicked` fallback → `RequestCampaignEntry("chennai")` (TMC:167)
5. `TitleMenuController.OnContinueClicked` fallback → `RequestCampaignEntry(save.currentRegionId)` (TMC:188) — geo/targetScene resolution removed.
6. `GameManager` → `RSM.TravelToRegion` (GM:200) — coolant/teleport travel.
7. `StateMapUI` → `RSM.TravelToRegion` (SMU:87) — map travel (gated).
8. `WorldStreamingManager` → `RSM.TravelToRegion` (WSM:278).
9. `StandaloneSmokeTest` L757 — QA-only diagnostic (no game semantics).

## Design decisions locked this turn
- **Cold start is single-mode, not TravelToRegion/additive.** Additive over the menu would leave
  two live manager sets (boot managers on `--- MANAGERS ---` DontDestroyOnLoad + the region's own
  duplicate assembly-build set) → P0 duplicate-singleton regression. Single-mode preserves the
  runtime-verified semantics of the 12-scene retail build.
- **`EnterCampaignRegion` does not re-check RegionUnlocks.** The menu/save already decided the
  destination, and the `RegionUnlocks` static is not yet synced from save at menu time; gating here
  would wrongly refuse a Continue into an already-unlocked region. `TravelToRegion` keeps its gate.
- Only QA diagnostics invoke the menu entry points (`QAVisualDiagnostics:234-237`,
  `RuntimeAutomatedSmokeTest:186-187`); no unit test asserts load-flavor semantics.

## Verification
- Compile: clean. Full project build: clean.
- Existing runtime/EditMode coverage (12 scenes, EN+TA, all 5 tiers) unchanged — retest in §X/Y/Z.