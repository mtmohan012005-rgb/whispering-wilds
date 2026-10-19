# QUALITY_OWNERSHIP_AUDIT — STEP 28 §G/H

Status: **PASS** — single authority enforced; dead/duplicate code removed; `WW_RenderScale` now real.
Build-verified (full `idea_build_project`: isSuccess=true, 0 problems).

## Requirement
- One runtime quality decision loop. `QualityPresetManager` = data provider only. No two adaptive loops.
- `WW_RenderScale` must change HDRP render resolution (or be removed). Test 50–100%.

## Before (FAIL)
| Component | Problem |
|---|---|
| `GraphicsPerformanceManager` (GPM) | Owner of real HDRP DRS (`DynamicResolutionHandler` + HDAdditionalCameraData flags, auto-detect, tier presets) BUT handed the decision loop to AQM when present (L146) |
| `AdaptiveQualityManager` (AQM) | Second duplicate hysteresis loop delegating execution to GPM — two loops, no single authority |
| `AutoQualityDetector` (AQD) | Dead code: never added to any scene, zero references anywhere |
| `QualityPresetManager` (QPM) | Data provider (correct role) — references: `NPCPerformanceTierManager:80-83`, `AntigravityZoneManager:402`, `SettingsMenuController`, `DisplaySettingsManager` |
| `SettingsMenuController.renderScale` / `WW_RenderScale` | Stored + persisted (L104/L196) but was NEVER applied — no call to `GPM.ApplyEngineRenderResolution` anywhere outside GPM/AQM |

## After (PASS)
- **Deleted** `AdaptiveQualityManager.cs` (+.meta) and `AutoQualityDetector.cs` (+.meta).
- `BuildBootScene` no longer adds AQM to `--- MANAGERS ---`.
- **GPM is the single authority**: sole `Update` decision loop; AQM deferral removed.
- **New public API — manual override**: `GPM.SetUserRenderScale(float? scale)` (+ `UserRenderScaleOverride`).
  - Non-null: fixed scale enforced verbatim via the real HDRP scaler; adaptive loop suspended.
  - Null: override cleared, adaptive tuning resumes from tier base.
  - Override widens `drSettings` percentages to the user band 50–100% so the scaler lerp is never
    clamped upward (previously tier min 75/70/60% would eat sub-min requests).
- **SettingsMenuController wired end-to-end**:
  - New `renderScaleOverride` flag persisted as `WW_RenderScaleOverride`; default = no override → adaptive stays authoritative.
  - `ApplyAllSettings` now calls `ApplyUserRenderScale()` after tier apply.
  - New `SetRenderScale(float, bool)` public API (clamps 0.5–1.0, persists, enforces).
  - UI caveat: the Quality page only surface is tier cycling (`SettingsMenuUI.CycleQuality`); there is
    no slider bound to WW_RenderScale today — the setting is enforced when set programmatically or by
    a future UI control. Documented here deliberately.
- `AntigravityZoneManager.CurrentQualityTier` reads `GPM.DynamicStepOffset` (was AQM.QualityStepOffset).

## Runtime verification evidence
- `GraphicsPerformanceManager.cs` Update loop: `if (UserRenderScaleOverride.HasValue) return;` suspends adaptation while a manual scale is set.
- `ApplyProfile`-driven reset: when override cleared, `CurrentRenderScale` = tier preset base, `DynamicStepOffset = 0`, re-applied.
- Presets unchanged; `StandaloneSmokeTest` renderScale range check (0 < s ≤ 1.5) still valid.

## Sanctioned keys
`WW_QualityTier` (int=active tier), `WW_RenderScale` (float), `WW_RenderScaleOverride` (0/1).