# Step 3 Implementation Status

Branch: `ai/unity-graphics-world-upgrade`
Unity: `6000.6.3f1` — HDRP `17.7.0` — Target: Standalone Windows x64
Status: **IN PROGRESS** — sections below record what is actually written vs. still unverified.

## Delivered so far

| Item                                      | Path                                                                | State                 |
| ----------------------------------------- | ------------------------------------------------------------------- | --------------------- |
| Localization manager + bilingual database | `unity/Assets/_Project/Scripts/Localization/LocalizationManager.cs` | Written, not compiled |
| Auto-refreshing uGUI label                | `unity/Assets/_Project/Scripts/Localization/LocalizedText.cs`       | Written, not compiled |
| Display/resolution/UI-scale manager       | `unity/Assets/_Project/Scripts/Display/DisplaySettingsManager.cs`   | Written, not compiled |

## Section 14 — Localization and fonts

Implemented:

- `WhisperingWilds.Localization.Language` enum: `English`, `Tamil`.
- `LocalizationDatabase` holds all bilingual strings in one place (menu, settings, HUD,
  notifications, gameplay, region names). Real Tamil Unicode, not transliteration.
- `LocalizationManager.Get(key)` and `Get(key, args)` central lookup with English fallback when a
  Tamil string is empty.
- Missing keys report **once per key per session** (`HashSet` guard) so a per-frame `Get()` call
  cannot flood the log in development builds.
- `LocalizedText` binds a legacy `UnityEngine.UI.Text` to a key and re-renders on
  `OnLanguageChanged` — immediate runtime refresh, no scene reload.
- Persistence via `PlayerPrefs` key `WW_Language`, applied in `Start()`.

Open / not done:

- **No Tamil font asset is committed yet.** Labels currently rely on the legacy UI font and will
  fall back to system shaping; Tamil glyph coverage is unverified.
- Existing UI strings across the project are **not yet migrated** to keys, so the menu still shows
  hardcoded English in places.
- Not compiled, not run, not visually verified.

## Section 15 — Screen space, DPI, aspect, 16:9 to ultrawide

Implemented in `DisplaySettingsManager`:

- Real mode enumeration from `Screen.resolutions`, deduplicated, sorted by pixel count.
- Safe fallback synthetic mode when Unity reports none (headless / remote desktop) so the game
  stays playable.
- `ApplyMode` (fullscreen window) and `ApplyWindowed`; `SetFullscreen` re-applies the active mode
  because a mode switch alone is not enough on some drivers.
- VSync toggle and frame cap that force VSync off below 240 (a cap and VSync otherwise deadlock the
  frame rate on slow hardware).
- `UiScaleLevel` Small/Medium/Large applied to every `CanvasScaler` in `ScaleWithScreenSize` mode
  via `matchWidthOrHeight` weighting.

Deliberate scope boundary: this manager owns **display only**. Graphics quality stays with
`QualityPresetManager` and memory budgets with `MemoryBudgetManager`, under distinct PlayerPrefs
keys, so the systems cannot overwrite each other.

Open / not done:

- No automated DPI / ultrawide / 4K test matrix.
- `RefreshAvailableModes` is not re-run on display hot-plug or resolution change events.
- No `[SerializeField]`-driven defaults menu wiring yet; the existing `SettingsMenuController` has
  not been re-pointed at this manager.

## Sections 7, 16, 17, 18, 19, 20, 23 — not started

### Section 7 dynamic resolution — implemented, unverified at runtime

- `QualityPresetManager.GetPreset` is now the single static owner of the tier table; the duplicate
  60-line copy in `GraphicsPerformanceManager` is gone and that manager delegates. The two tables
  had already drifted in intent, and the settings menu would otherwise stop reflecting what the
  adaptive loop actually applied.
- `GraphicsPerformanceManager.ApplyEngineRenderResolution` now drives
  `DynamicResolutionHandler` rather than `ScalableBufferManager.ResizeBuffers`, which HDRP does not
  honour, so the previous adaptive loop was mutating a value that never reached the GPU.
- The HDRP asset ships with `minPercentage` and `maxPercentage` both at 100, which clamps the
  handler's lerp to a fixed 100%. `ApplyHdrpDynamicResolution` widens that range from the tier's
  bounds before registering the scaler.
- The handler stores a `PerformDynamicRes` delegate returning a lerp factor between min and max, so
  the delegate is registered once and reads `CurrentRenderScale` thereafter. Registered with
  `DynamicResScalePolicyType.ReturnsMinMaxLerpFactor`.
- Falls back to `ScalableBufferManager` when the active pipeline is not HDRP, so the built-in
  render pipeline path still works.

Open / not done:

- **Not verified at runtime.** No player build yet, so actual screen percentages, GPU frame timing,
  and visible scaling are unproven.
- The scaler target width/height and upsample filter are left at HDRP asset defaults rather than
  tuned per tier.
- No telemetry surfaced to the HUD yet (scale, FPS, tier, dynamic state all exist on the manager
  but nothing displays them).
- Unity registers only three quality levels while the C# side has five tiers; the mapping between
  Unity levels and HDRP asset assignment is still unaddressed.

### Sections 16-20, 23 — not started

- Weather is primarily fog/rain and needs Volume-driven expansion.
- Time/season, vegetation, post-processing authoring, and localized region identity are
  unimplemented.
- No centralized TMP assets; scenes carry few authored materials, LOD groups, and volumes.

## Compile status

The project compiles clean: a `-batchmode -quit` run reported **0 errors** and
`Exiting batchmode successfully now!`. This covers the localization, display, and quality changes
above. It does not cover runtime behaviour or rendering.

## Environment blocker

Production builds currently cannot complete on this machine. Repeated `-batchmode` runs compiled
all C# with **0 errors**, baked all six region NavMeshes successfully, reached
`Starting PRODUCTION Windows x64 build`, then crashed inside HDRP sky shader compilation with
`Failed to initialise UDS client`. Cause is memory pressure: **7.7 GB total RAM, ~1 GB free**,
with another Unity project holding the remainder. Per user instruction, no processes were
terminated. Builds must be retried when the machine has headroom.

Last verified ecology player run remains **6/8**; the two failures (boot-scene NavMesh absence,
Chennai whitelist leakage) are fixed in source but still unverified in a fresh player.
`TestReports/step2-npc-wildlife-report.md` records the honest state.
