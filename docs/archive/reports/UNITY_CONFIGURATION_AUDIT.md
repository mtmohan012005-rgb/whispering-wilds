# UNITY CONFIGURATION AUDIT

**Step:** STEP 28 — B. Unity project structure, packages, settings
**Method:** Read `ProjectSettings/*`, `Packages/manifest.json` + `packages-lock.json`, `unity/Assets` scene/settings assets as of 2026-10-08.
**Scale:** PASS / FAIL / WARNING / UNVERIFIED (per STEP 28). No fabricated PASS.

---

## 1. Versions

| Item | Value | Class | Notes |
|---|---|---|---|
| Unity Editor | **6000.6.3f1** (`ProjectVersion.txt`, revision 45d8eee7de74) | PASS | Matches QA build (`BUILD_REPORT.json` unityVersion). |
| HDRP | manifest **17.7.0**, lockfile **17.6.0** | WARNING | **Lock/manifest drift.** `packages-lock.json` still resolves 17.6.0. Unity will re-resolve on next package manager refresh; currently inconsistent. |
| Input System | **1.20.0** (built-in), `activeInputHandler: 1` (new Input System only) | PASS | Legacy Input Manager is disabled at the player level. |
| Cinemachine | manifest **3.1.2**, lockfile **6.6.0** | WARNING | **Lockfile value is wrong** (6.6.0 is the Timeline version; Cinemachine has no 6.6.0). Lockfile is stale/corrupted for this entry. Cinemachine is not referenced by `CameraController` (see C) so it is currently inert; the lock must still be regenerated. |
| Timeline | **6.6.0** | PASS | Installed. Usage in scenes: to be confirmed in C (no animation director usage expected). |
| UGUI | **2.6.0** | PASS | All HUD/menus are UGUI (`UnityEngine.UI`). |
| GLTFast (`com.unity.cloud.gltfast`) | **6.20.0** | PASS | Used by `InstantiateModel` in the assembly tooling. |
| NavMesh (`com.unity.modules.ai`) | built-in | PASS | 6 baked `NavMeshData` assets present (one per region 02–07). |
| VisualScripting | **1.9.12** | NOTE | Installed, unused by `_Project` code. |
| `com.community.antigravity-unity` (git) | git URL | NOTE | Experimental gravity/anti-gravity package — consumed by `Physics/*` (see W). |
| `com.coplaydev.unity-mcp` (git) | git URL | NOTE | Dev/MCP tooling only; not on the release runtime path. |
| `com.unity.xr.management` | **4.7.0** | WARNING | `XRGeneralSettingsPerBuildTarget.asset` exists but no XR plugin installed and no gameplay uses XR input. Outline-only; not shipped feature. |
| AI Assistant / AI Inference | 2.20.0-pre.1 / 2.6.1 | NOTE | Editor/experimental packages; not runtime. |

## 2. Render pipeline & graphics settings

| Setting | Value | Class |
|---|---|---|
| `GraphicsSettings.m_CustomRenderPipeline` | HDRP **High Fidelity** (`Settings/HDRP High Fidelity.asset`) | PASS |
| Quality `High Fidelity` tier override | High Fidelity pipeline | PASS |
| Quality `Balanced` tier override | `HDRP Balanced.asset` | PASS |
| Quality `Performant` tier override | `HDRP Performant.asset` | PASS |
| HDRP global settings | `HDRenderPipelineGlobalSettings.asset` present | PASS |
| Sky/fog volume | `SkyandFogSettingsProfile.asset` present | PASS |
| Lighting settings | `Settings/*Lighting` (`.wlt` = 1) | PASS |
| Always-included shaders / preloaded | default | PASS |

> Graphics/fidelity authority delegated to `GraphicsPerformanceManager` at runtime (verified in G); the 3 HDRP assets here are the **data** side of that mapping.

## 3. Quality settings

| Item | Value | Class |
|---|---|---|
| Quality tiers defined | **3**: High Fidelity (idx 0), Balanced (1), Performant (2) | PASS |
| `m_CurrentQuality` (editor default) | 0 = High Fidelity | PASS |
| `vSyncCount` all tiers | 0 (managed at runtime) | WARNING — see settings audit T/H |
| `antiAliasing` | 0 across tiers | NOTE — HDRP uses its own AA path |

> STEP 28.Z asks to test "Very Low / Low / Medium / High / Ultra" (5 tiers). The project exposes 3 authored tiers. Either the runtime maps 3 tiers to labels, or the 5-tier test plan cannot be satisfied as-is. **Tracked under G** — must not fabricate tier results.

## 4. Player & input settings

| Item | Value | Class |
|---|---|---|
| productName / companyName | "The Whispering Wilds" / "Whispering Wilds Studios" | PASS |
| `activeInputHandler` | 1 (Input System only) | PASS |
| Input actions asset | 1 (`PlayerControls.inputactions`) | PASS — bindings verified in J |
| defaultIsNativeResolution | 1 | PASS |
| runInBackground / resizableWindow | 0 / 0 | NOTE — fixed window; acceptable for a living title; windowed display uses native res. |

## 5. Physics & time

| Item | Value | Class |
|---|---|---|
| Gravity | {0, -9.81, 0} (standard gravity preserved; antigravity is per-zone, see W) | PASS |
| Fixed Timestep | 0.02 s (50 Hz) | PASS |
| Maximum Allowed Timestep | 0.33333334 s | PASS |
| Default Solver Iterations | 6 | PASS |
| Broadphase | default | PASS |
| NavMeshAreas | asset present | PASS |

## 6. Memory settings

| Item | Value | Class |
|---|---|---|
| `MemorySettings.asset` | defaults (no custom bucket/dynamic heap overrides) | PASS-NOTE — runtime memory policy is governed by `MemoryManager`/`MemoryBudgetManager` code (audit I) |
| `GC.Collect` / `Resources.UnloadUnusedAssets` in normal gameplay | to be audited in D/I | UNVERIFIED → section I |

## 7. Build settings

| Item | Value | Class |
|---|---|---|
| `EditorBuildSettings` scenes | 12 (`00_Boot` … `07_Nilgiris`, 4 `WW_Benchmark_*`) | PASS — matches `BUILD_REPORT.json` `sceneCount: 12` |
| Build platform (latest QA) | StandaloneWindows64, Succeeded, 268.7 MiB | PASS |
| Legacy root-level `ProjectSettings`/`Build Profiles` (repo root, non-`unity/`) | present | WARNING — **stale**: the authoritative project is `unity/`. Cleanup under AA. |

## 8. Package health

| Item | Class |
|---|---|
| `manifest.json` vs `packages-lock.json` drift (HDRP 17.7.0→17.6.0; Cinemachine bogus 6.6.0) | WARNING — regenerate lock via OpenUPM/Unity Package Manager resolution before release build |
| Git dependencies (antigravity, MCP) in a release build | WARNING — release must not depend on dev/MCP tooling; audit W/W-extra. `unity-mcp` is editor-side; `antigravity-unity` is referenced by runtime `Physics/*` (audit W) |
| No `csc.rsp`/`mcs.rsp` custom defines in `Assets` | PASS |

---

## Summary

| Bucket | Count | Items |
|---|---|---|
| PASS | 24 | Editor/HDRP/InputSystem/UGUI/GLTFast/NavMesh; pipelines; physics/time; build list; QA build |
| WARNING | 6 | HDRP lock drift; Cinemachine lock drift; XR outline-only; 3-tier vs 5-tier plan mismatch; root stale ProjectSettings; git deps in release |
| FAIL | 0 | — |
| UNVERIFIED | 1 | GC/unload policy (deferred to D/I); audio content (0 audio assets — section V) |

**Live-blocking item from this section:** none P0. Highest-priority follow-ups: regenerate `packages-lock.json` (B-adjacent, do at build stage X), resolve 5-tier test plan vs 3 tiers (G), confirm git-dep runtime usage (W).

---

*Generated 2026-10-08 by master audit. All values read from actual project files.*