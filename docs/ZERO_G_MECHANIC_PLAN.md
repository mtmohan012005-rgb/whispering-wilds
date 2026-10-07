# Zero-G Antigravity Mechanic — Scoped Plan (Step 10)

Status: **proposed, not started.** No gameplay code has been written. This document
exists to record what the mechanic would require and which parts of the original
proposal cannot be built as written.

## 1. Why this is deferred

Step 9 is frozen on rendering, geography, streaming, performance and bug fixes.
An antigravity mechanic is new gameplay. It is additionally blocked on four
concrete prerequisites, all verified against the repository.

## 2. Verified blockers

**2.1 There is no `Interactable` tag.**
`ProjectSettings/TagManager.asset` defines only: `Default`, `TransparentFX`,
`Ignore Raycast`, `Water`, `UI` (the remaining slots are empty). The proposed
`other.CompareTag("Interactable")` raises `UnityException: Tag: Interactable is not
defined` on _every_ trigger event — the feature would appear dead and spew
exceptions. Either add the tag or, preferably, resolve membership by component
(`GetComponentInParent<IFloatingBody>()`), which is refactor-safe.

**2.2 There is no rigidbody inventory to cap.**
The entire project contains **4** `Rigidbody` references, all inside
`Assets/Editor/SetupDemoScene.cs` creating a demo "PhysicsBall". Zero runtime
gameplay scripts use `Rigidbody`. The caps "15 for Low / 100 for High" therefore
have no baseline to calibrate against — they are guesses. The body count must be
_measured_ (Phase 0) before any cap is chosen.

**2.3 The Nilgiri Tahr has no authored physics.**
`Assets/_Project/Art/Models/Wildlife/nilgiri_tahr.glb` has no prefab and no
authored `Rigidbody`/`Collider`. Instantiating 50 of these and calling
`AddComponent<Rigidbody>()` at runtime benchmarks the _spawner_, not the game.

**2.4 `Newtonsoft.Json` is unavailable.**
Absent from `unity/Packages/manifest.json`. Three of the proposed snippets
(`PhysicsBenchmark`, the save-schema writer, `ZeroGAssetAuditTool`) would not
compile. The project's established path is `JsonUtility` — `SaveSystem` and
`PerformanceBenchmarkManager` both use it.

## 3. Defects to carry into the design

These are properties of the proposal, to be resolved rather than copied.

| #   | Proposal                                                                   | Problem                                                                                                                                                                                                                               |
| :-- | :------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | `Physics.autoSimulation = false` on Low/Very Low                           | With no `Physics.Simulate()` call this **freezes all physics in the game**, not throttles it. `autoSimulation` is also obsolete in Unity 6 (`Physics.simulationMode`). Global physics stepping must not be driven from gameplay code. |
| D2  | `1% low` from `frameTimes[ceil(n*0.01)-1]` after ascending sort            | Selects the _fastest_ 1% — best case. 1% low requires the slowest frames. `PerformanceBenchmarkManager` already computes this correctly; reuse it.                                                                                    |
| D3  | `File.AppendAllText("benchmark_report.json", ...)`                         | `PerformanceBenchmarkManager.WriteBenchmarkReport` **overwrites** that same path with `JsonUtility.ToJson`. Appending produces a file that is not valid JSON. Reuse the existing writer.                                              |
| D4  | `using UnityEngine.FrameTiming;`                                           | Namespace does not exist; `FrameTiming`/`FrameTimingManager` live in `UnityEngine`. Also introduces a second, inconsistent measurement path alongside the existing manager.                                                           |
| D5  | `qualityManager.CurrentProfile`                                            | `AdaptiveQualityManager` has no such member. See §4.                                                                                                                                                                                  |
| D6  | `FindObjectOfType<AdaptiveQualityManager>()`                               | Obsolete in Unity 6; project already uses `FindAnyObjectByType`. It is also a `DontDestroyOnLoad` singleton — use `Instance`.                                                                                                         |
| D7  | `Mathf.Clamp` presented as NaN/infinity protection                         | It is not. Comparisons against NaN are false, so `Mathf.Clamp(float.NaN, a, b)` returns NaN. Load-time validation needs explicit `float.IsFinite` checks. Clamping on _save_ alone does not protect deserialization.                  |
| D8  | `Mathf.Lerp(rb.drag, 2f, Time.fixedDeltaTime * 5f)` once per trigger event | A single Lerp with `t ≈ 0.1` moves drag ~10%. It is not a smooth transition. Drag should be eased per-`FixedUpdate` while the body is inside the zone.                                                                                |
| D9  | `OnTriggerExit` for a body rejected by the cap                             | The body was never admitted, but exit still lerps its drag toward 0/0.05 — permanently mutating a body that never floated. Track the admitted set, not raw triggers.                                                                  |
| D10 | `rb.drag` / `rb.angularDrag` / `rb.velocity`                               | Obsolete in Unity 6: `linearDamping`, `angularDamping`, `linearVelocity`.                                                                                                                                                             |
| D11 | Audit: `Path.GetFileName(file)` onto a flat asset path                     | Discards the subdirectory. All models live in subfolders (`chennai/`, `chettinad/`, `delta/`, `mamallapuram/`, `wildlife/`), so every `LoadAssetAtPath` returns null and the audit **reports a false clean**.                         |
| D12 | Audit: `prefab.GetComponent<Rigidbody>()`                                  | Checks the root only; misses child bodies. Use `GetComponentsInChildren`.                                                                                                                                                             |
| D13 | HUD via `InputSystem.onBeforeUpdate += lambda` in `OnEnable`               | Never unsubscribed → handler leaks per enable and dereferences a null label.                                                                                                                                                          |
| D14 | HUD creates elements in `OnEnable`                                         | Duplicate meters accumulate on every re-enable.                                                                                                                                                                                       |
| D15 | GPU buffers created/released per call + `GetData()`                        | Per-frame GPU alloc churn and a synchronous readback stall — a pessimization at the stated 50-body scale.                                                                                                                             |

## 4. The real quality signal

`AdaptiveQualityManager` (`WhisperingWilds.Quality`) exposes no profile name.
The usable signal is:

- `AdaptiveQualityManager.Instance.QualityStepOffset` — signed int, negative when
  stepped down. Bounded by `minRenderScale 0.65` / `scaleStep 0.05`, so it ranges
  roughly **−7 … 0**.
- `CurrentRenderScale`, `CurrentFPS`, `CurrentFrameTimeMS` are also public.

Tiering should key off `QualityStepOffset` thresholds, never a string compare
against a name that does not exist.

Note the manager stops stepping once `CurrentRenderScale` reaches `minRenderScale`,
so `QualityStepOffset` saturates — do not treat it as an unbounded scalar.

## 5. Phases

### Phase 0 — Measurement (blocking; do this before writing the mechanic)

1. Build a QA-only spawn harness that instantiates N prefabs with authored
   colliders and rigidbodies in the Nilgiri region.
2. Drive it through `PerformanceBenchmarkManager.StartBenchmark()` and record
   `averageFPS`, `onePercentLowFPS`, `averageFrameTimeMS` per N.
3. Derive the low/high caps from the measured knee. Record N and results in the
   plan before Phase 1 proceeds.

### Phase 1 — Adaptive response

- Scope every reaction to the _bodies the zone owns_.
- Cap admission count by `QualityStepOffset` tier.
- Degrade per body via `collisionDetectionMode = Discrete` and reduced solver
  iterations (`Rigidbody.solverIterations`) rather than global `fixedDeltaTime`
  or `simulationMode`.
- If global physics stepping must change, do it in one owner with hysteresis and
  never to a stopped state.

### Phase 2 — Zone mechanic

- Membership by component, not tag (or add the tag and use it consistently).
- Maintain an admitted-set; reconcile it in `FixedUpdate` against destroyed and
  departed bodies instead of trusting trigger pairing.
- Ease `linearDamping`/`angularDamping` per `FixedUpdate` toward the zone target
  and restore each body's **captured original** values on exit, not constants.

### Phase 3 — Save schema v3

- `GameSaveData.CurrentSchemaVersion` is `2`, with the documented rule _"Bump only
  with a migration in `SaveMigrator`"_. Adding physics state means v3 **plus** a
  migration.
- Preserve the atomic write path (`TempFilePath` → `BackupFilePath`); never
  `File.WriteAllText` directly over `SaveFilePath`.
- Validate with `float.IsFinite` on both save and load.
- Persist only `isFloating` plus position/rotation; persisting live velocity for
  every interactable will make old saves load mid-air.

### Phase 4 — HUD (uGUI, not UI Toolkit)

The project has **zero** `UIDocument`/`PanelSettings` references; the HUD is
uGUI `Text`. `HUDManager` (`WhisperingWilds.UI`) already exposes
`interactionPromptRoot`/`interactionPromptText` and retexts prompts via
`OnLanguageChanged`. So:

- add `hud.zero_g.*` keys to `LocalizationDatabase` (English + Tamil) rather than
  inlining Tamil strings in C#;
- swap the prompt text inside the existing `OnLanguageChanged` / focus-changed flow;
- read language via `LocalizationManager.Instance.CurrentLanguage` — **not**
  `SystemManager.Language`, which does not exist in this project;
- build the meter once in `Awake`, toggled in `SetActive`, not recreated.

### Phase 5 — Asset audit tool

- Enumerate via `AssetDatabase.FindAssets("t:Model")` to get correct asset paths.
- `GetComponentsInChildren<Rigidbody>()` and `GetComponentsInChildren<Collider>()`.
- Write to the repo's existing report convention (`ASSET_AUDIT_REPORT.json` at
  root) instead of `Application.dataPath + "/../"`.

### Phase 6 — GPU field solver (deferred; likely unnecessary)

At ≤100 bodies a GPU path with per-frame readback is slower than the CPU loop.
Keep CPU. Revisit only if the target body count reaches the thousands, and then
with persistent buffers and asynchronous double-buffered readback — never a
`GetData()` per frame.

## 6. Compliance note

Do **not** add the proposed `OpenVolumetricFieldSim` MIT entry:

- No such dependency exists in the project (no `Assets/_Project/Physics/GravitySim/`,
  no vendored code). An entry would assert a licence and copyright for software
  that was never integrated.
- The real schema in `PRODUCTION_LICENSE_MANIFEST.json` is
  `{version, audited, licenses[{asset, creator, source, license, commercialUse,
modificationAllowed, redistributionAllowed, proofReference, status}]}`. None of
  the proposed keys (`dependency_name`, `license_type`, `version_tag`,
  `project_directory_target`, `attribution_requirements`,
  `copyleft_safety_status`) exist in it, so the entry would not validate.

Map/geodata attribution obligations are tracked separately in
`unity/MapData/SOURCES_AND_LICENSES.md`. No geodata is currently integrated, so
no ODbL attribution is owed yet.

## 7. Exit criteria

Zero-G is done when: a measured body-count baseline exists (§Phase 0); no global
physics stepping is touched; v2 saves migrate cleanly to v3; bilingual prompts
work through the existing localization path; and the benchmark report is produced
by the existing `PerformanceBenchmarkManager` writer.
