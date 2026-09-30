# THE WHISPERING WILDS — Unity Runtime Audit

**Status:** PARTIAL — verified by static inspection + live Editor/Play-mode session.
**Date:** 2026-09-30
**Auditor:** Antigravity (lead Unity 6 engineering)
**Supersedes:** previous `docs/UNITY_RUNTIME_AUDIT.md`, which contained unverified claims and has been replaced.

> This document reports **measured facts**, not intentions. Anything not directly
> observed is explicitly marked `UNVERIFIED`. No claim of a passing build or a
> working executable is made anywhere in this file.

---

## A. BLOCKING ENVIRONMENT DEFECT (must be resolved first)

The Unity Editor **terminated on its own** during this audit session. Cause, from
`C:\Users\mohan\My project\Logs\Editor.log`:

```
[Licensing::Client] Error: Code 404 while processing request
(status: Found 0 entitlement groups and 0 free entitlements matching requested entitlement ids)
[ExitDontLaunchBugReporter] Exiting without the bug reporter. Application will exit with return code 0
```

Verified license state:

| Location | State |
|---|---|
| `C:\ProgramData\Unity\Unity_lic.ulf` | **missing** |
| `C:\ProgramData\Unity\` | **missing** |
| `%APPDATA%\UnityHub\license` | **missing** |

**Impact:** every Unity-dependent acceptance criterion is currently unverifiable —
compilation, scene loading, Windows build, executable launch, and all runtime
behaviour. This is an **environment/licensing blocker, not a code defect**.

**Required user action:** sign in via Unity Hub and activate a Unity licence
(Personal or Pro) for 6000.6.3f1. No workaround or licence bypass has been
attempted and none will be.

### What this blocks

| Task section | Status |
|---|---|
| 5 — Windows build + actual launch | **BLOCKED** |
| 7 — full compile pass | Partially done (see C) |
| 8–12, 83 — runtime gameplay verification | **BLOCKED** |
| 52, 56, 58, 73 — measured performance | **BLOCKED** |
| 62, 63, 64, 66 — automated runtime tests | **BLOCKED** |

---

## B. Environment detected

| Item | Actual value | Source |
|---|---|---|
| Unity version | `6000.6.3f1` (rev `45d8eee7de74`) | `ProjectSettings/ProjectVersion.txt` |
| Primary renderer | HDRP `17.7.0` | `Packages/manifest.json` |
| Input System | `1.20.0` | manifest |
| Cinemachine | `3.1.2` | manifest |
| uGUI | `2.6.0` | manifest |
| HDRP assets present | `HDRP Performant/Balanced/High Fidelity.asset`, `HDRenderPipelineAsset.asset` | `Assets/Settings` |
| Installed editor | `C:\Program Files\Unity\Hub\Editor\6000.6.3f1` | filesystem |
| Build target (declared) | Windows x64 | `EditorBuildSettings.asset` |
| Machine | Windows, PowerShell 5.1 | shell |

### Missing packages (verified absent from `manifest.json`)

- `com.unity.test-framework` → **no Unity Test Runner**; automated Unity tests impossible (§61/62).
- `com.unity.ai.navigation` → `NavMeshSurface` unavailable (see finding **F-3**).
- `com.google.firebase.*` (Unity Firebase SDK) → **no Unity Firebase integration at all** (§28).
- No Addressables, no Localization package.

---

## C. Compilation

**Verified PASS for the C# compile itself** (before the licence loss).

- `Library/ScriptAssemblies/Assembly-CSharp.dll` rebuilt `2026-09-30 07:01:46`, 186 KB.
- Live Unity console inspected via reflection: **0 C# compile errors**.
- The 6 console entries present are unrelated: one `assistant-perf.jsonl` sharing
  violation and five `generators.ai.unity.com` `NoSubscription` (Unity AI, unlicensed).
- No `MonoBehaviour` in the assembly lacks a matching `.cs` filename (checked
  reflectively across all types — 0 mismatches).

Compile errors found and fixed this session:

1. `Vegetation/CropInstance.cs` — declared `: IInteractable` but implemented none of
   the 6 members. It had been written against a **different signature shape**
   (`GetInteractPrompt()`, `CanInteract()`, `Interact(GameObject)`).
2. `Vegetation/FruitTreeInstance.cs` — same defect.
3. `Vegetation/FarmPlot.cs:76` — called `crop.Interact(gameObject)`, matching the wrong signature.

Correct interface (`Assets/_Project/Scripts/Player/IInteractable.cs`):

```csharp
string InteractionPrompt { get; }
InteractionType Type { get; }
bool CanInteract(PlayerInteractor interactor);
void Interact(PlayerInteractor interactor);
void OnFocusEnter();
void OnFocusExit();
```

Follow-on errors from missing `using WhisperingWilds.Data;` (`ItemData`/`ItemCategory`
live in `WhisperingWilds.Data`, not `WhisperingWilds.Inventory`) and from a
non-existent `ItemData.itemName` field (actual fields: `itemNameEn`, `itemNameTa`).

Both `CropInstance` and `FruitTreeInstance` now implement all 6 members and were
verified reflectively at runtime.

> Shader/material/asset import errors could **not** be fully enumerated before the
> licence loss — `UNVERIFIED`.

---

## D. Scene wiring (real defect found and fixed)

Verified in the active scene `02_Chennai_GeorgeTown` on object `--- MANAGERS ---`
(which carries all 28 original managers). Five systems existed in code but were
**never instantiated in any scene**:

- `WorldTimeSystem`
- `RegionalClimateSystem`
- `VegetationManager`
- `WorldPersistenceManager`
- `WorldSimulationDebugOverlay` (defaults to hidden, F4 toggle)

All five were added and the scene saved (`2026-09-30 07:18`) and mirrored to the
repository. **This was a P1 defect:** without `WorldTimeSystem` in the scene, the
authoritative clock never existed, `TimeOfDayManager` silently fell back to its own
private clock, and the entire regional-climate / vegetation / persistence stack
never ran.

---

## E. Verified runtime behaviour (Play mode, before licence loss)

Measured live in the Editor, not inferred.

### E.1 Singleton authority

All of `WorldTimeSystem`, `TimeOfDayManager`, `WeatherSystem`,
`RegionalClimateSystem`, `VegetationManager` resolved to non-null `Instance`.

### E.2 Exactly one authoritative clock (PASS)

`TimeOfDayManager.CurrentHour` tracked `WorldTimeSystem.HourOfDay` exactly
(`match=True`). Code confirms `TimeOfDayManager` advances its local fallback clock
**only** when `WorldTimeSystem.Instance == null`, so it is a slave, not a second
authority.

### E.3 Four Tamil Nadu seasons — 12/12 months correct

| Month | Expected | Actual | Correct | Temp | Rain prob |
|---|---|---|---|---|---|
| 1,2 | Winter | Winter | YES | 31.0C | 0.03 |
| 3,4,5 | Summer | Summer | YES | 41.0C | 0.03 |
| 6,7,8,9 | SouthwestMonsoon | SouthwestMonsoon | YES | 33.0C | 0.30 |
| 10,11,12 | NortheastMonsoon | NortheastMonsoon | YES | 33.0C | 0.80 |

Seasons are derived from the calendar; there is no UI/manual season switch.

### E.4 Regional climate separation (PASS, geographically sound)

| Region | Zone | Jul temp | Jul rain | Jul growth |
|---|---|---|---|---|
| chennai | Coastal | 33.0C | 0.30 | 1.30 |
| mamallapuram | Coastal | 32.0C | 0.25 | 1.24 |
| pichavaram | Wetland | 31.6C | 0.30 | 1.63 |
| thanjavur | Delta | 33.9C | 0.35 | 1.82 |
| chettinad | DryInland | **37.2C** | 0.20 | 1.11 |
| nilgiris | Hills | **18.3C** | **0.85** | 1.50 |

Chettinad is correctly the hottest (rain shadow); Nilgiris correctly coolest with
a dominant SW monsoon; the Cauvery Delta is correctly the most fertile.

### E.5 Calendar arithmetic (PASS)

`SetCalendarAndClock(2026,1,15,6)` → `2026-1-15`; `+24h` → `2026-1-16`;
`+720h` (30 days) → `2026-2-16`. Note the calendar uses a **simplified uniform
30-day month** (see finding F-7).

### E.6 Weather

All 11 required states are present and reachable:
`Clear, PartlyCloudy, Cloudy, LightRain, HeavyRain, Thunderstorm, Mist, Fog, Windy, HotClear, CoolClear`.
Transitions are coroutine-driven and blend fog density/colour + rain emission rate
over the requested duration, then set `currentWeather` and clear `isTransitioning`.
Weather rolling is region-restricted (e.g. Nilgiris favours Mist/Fog, Pichavaram
favours wetland conditions).

> The blend reaching its terminal state was **not observed** — the Editor died
> before the blend window elapsed. Marked `UNVERIFIED` despite the code being
> correct on inspection.

---

## F. Defects found by static inspection

Severity: **P0** crash/corruption · **P1** game-breaking · **P2** major · **P3** polish.

### F-1 · P1 · Two competing adaptive-quality systems; one is fake

- `GraphicsPerformanceManager.ApplyEngineRenderResolution()` genuinely calls
  `ScalableBufferManager.ResizeBuffers(scale, scale)` and sets
  `camera.allowDynamicResolution = true`. **Real** dynamic resolution.
- `AdaptiveQualityManager.ApplyDynamicScaling()` only sets
  `QualitySettings.lodBias` and computes an unused local `shadowScale`. It
  **never** changes render resolution, yet its own doc-comment claims it
  "dynamically adjusting render scale". This is precisely the antipattern §52
  names.

Both are on the same `--- MANAGERS ---` object and both run `Update()`.

> The last commit `56a6017` is titled *"enable HDRP dynamic res"*. The real
> implementation is `GraphicsPerformanceManager`; `AdaptiveQualityManager` remains
> a lodBias-only stub. Treat the commit message as unverified marketing.

### F-2 · P2 · Quality presets duplicated in two files

`QualityPresetManager` and `GraphicsPerformanceManager` each define their own
`renderScale` tables (VeryLow 0.70 / Low 0.80 / Medium 0.90 / High 1.0 / Ultra 1.0).
`QualityPresetManager.ApplyPreset()` never applies `renderScale`; only
`GraphicsPerformanceManager` does. The two tables can drift out of sync.

### F-3 · P1 · NavMeshAgent used but no baked NavMesh exists

`NPCCharacter` and `WildlifeEntity` both hold `NavMeshAgent`. However:

- No `NavMeshSurface` component exists in any scene.
- The `NavMeshSettings` block present in all 12 scenes is the **default empty
  template** (`m_LightingSettings: {fileID: 0}`, `agentTypeID: 0`).
- `com.unity.ai.navigation` is absent from the manifest, so `NavMeshSurface`
  cannot even be added.
- The only NavMesh file is `NavMeshAreas.asset` (areas/agent types only).

Agents therefore have no surface to path on. §42 (habitat-aware navigation via
NavMesh) is **not functional**.

### F-4 · P1 · RESOLVED · Cloud save shipped a hardcoded dev credential

**Original state** (`Online/CloudSaveManager.cs`):

```csharp
[SerializeField] private string firebaseBaseUrl = "http://localhost:3000/api/v1/persistence";
[SerializeField] private string bearerToken = "dev_session_token";
...
request.SetRequestHeader("Authorization", $"Bearer {bearerToken}");
```

This sent a literal baked-in token over **cleartext HTTP to localhost** — a
production build would have tied itself to a local dev machine and shipped a
credential in the binary.

**Fixed.** The component now holds no credential and no default endpoint:

- `persistenceBaseUrl` defaults to empty; the endpoint is supplied at runtime via
  `Configure(baseUrl, IdTokenProvider)`.
- Tokens come from an `IdTokenProvider` delegate and are fetched **per request**,
  since Firebase ID tokens are short-lived.
- `IsEndpointAllowed()` rejects any non-HTTPS or loopback endpoint in a player
  build (localhost is tolerated **only** in the Editor, with an explicit warning).
  A misconfigured build therefore fails closed to local-only saves.
- Success is reported only on a genuine 2xx (`responseCode` 200–299) *and*
  `UnityWebRequest.Result.Success`; all other outcomes degrade to local
  persistence with a warning.
- The duplicated upload coroutine was collapsed into one `UploadRoutine`.

> Correction: an earlier pass of this audit also criticised the component for
> logging sync success "from inside a coroutine". That was wrong — the original
> code did check `request.result`. The genuine defects were the baked credential,
> the localhost default, and the absence of HTTPS/loopback enforcement.

**Residual risk:** no Firebase Unity SDK exists yet (F-5), so nothing currently
calls `Configure()` and the ID-token delegate. Until the auth layer lands, the
game correctly runs **local-save only** rather than shipping a fake credential.

### F-5 · P1 · No Unity Firebase integration whatsoever

Zero Firebase SDK usage across all 72 Unity scripts. `CloudSaveManager` is a plain
`UnityWebRequest` HTTP client. §28 is **unimplemented**. The Node backend
(`server/firebase/*`) does use `firebase-admin`, so the server half exists while
the Unity client half does not.

### F-6 · P2 · Region travel is unreachable from gameplay

`RegionalSceneManager.TravelToRegion()` and `GameManager.LoadRegion()` have **no
callers** in any script. Unless invoked from a serialized UnityEvent, the player
cannot travel between regions, so §83's TRAVEL steps cannot be exercised.

Related: `GameManager.LoadRegion()` uses `SceneManager.LoadScene()` which implies
`LoadSceneMode.Single` — a competing, unsafe path that bypasses the safe additive
flow, saves nothing, and repositions nobody. It should be removed or delegated.

### F-7 · P2 · Unvalidated spawn fallback can drop the player at world origin

`RegionalSceneManager.PositionPlayerAtRegionSpawn()` falls back to
`Vector3.zero` when no `SpawnPoint`/`PlayerSpawn` object exists. §13 requires a
*validated* spawn; silently placing the player at the origin risks spawning
inside or below geometry. It should fail loudly and retain the current position.

### F-8 · ALREADY RESOLVED in `56a6017` · Per-frame `LayerMask.GetMask` string lookup

`PlayerMovement.CheckGrounded()` used to call
`LayerMask.GetMask("Ignore Raycast", "UI", "Water")` inline, resolving layer
names by string on every frame — a hot-path cost §80 forbids.

`HEAD` already caches this: a `private int cachedGroundMask` field is populated by
`RefreshGroundMask()` in `Awake`, and `CheckGrounded()` reads the cached int.
Verified in both `HEAD` and the working copy; no change was required.

### F-9 · P3 · Dead forced-GC path left armed

`MemoryBudgetManager.ExecuteDeterministicPurge()` calls
`Resources.UnloadUnusedAssets(); GC.Collect();`. It is currently unreachable
(`CheckAndCleanMemory` has no callers), so §55 is **not** violated in practice,
but the method is a live landmine. `MemoryManager.ExecuteControlledBoundaryCleanup()`
also calls both, but only on region-transition boundaries, which §55 permits.

### F-10 · ALREADY RESOLVED in `331f18d` · Duplicate ground gizmo caused CS0111

An earlier pass of this audit reported `PlayerMovement.cs` as an uncommitted
stray edit with the ground gizmo deleted. That was **stale**. `git log` shows the
class previously carried **two** `OnDrawGizmosSelected` methods — one probing at
`y + groundedOffset` and a duplicate at `y - groundedOffset`. The duplicate was a
real **CS0111 (duplicate member definition) compile error**, removed by commit
`331f18d`.

Verified: `HEAD` and the working copy both contain exactly **one** gizmo, and its
`+ groundedOffset` agrees with the actual `CheckGrounded()` probe. No change
required; `PlayerMovement.cs` is clean against `HEAD`.

### F-11 · P3 · Junk zero-length models at the Unity assets root

`Assets/Main Camera.glb` (0 KB), `Assets/Sky and Fog Volume.glb` (0 KB),
`Assets/StaticLightingSky.glb` (0 KB), `Assets/TestCube.glb`, `Assets/Sun.glb`.
These are scene objects that were exported to the project root. They are not
referenced by any scene and only pollute the asset database.

### F-12 · VERIFIED CORRECT (initially mis-flagged) · Build separation already implemented

`Assets/_Project/Scripts/Editor/BuildPipelineAutomation.cs` **already implements**
the required split, and does it properly:

| Entry point | Scenes | Output | BuildOptions |
|---|---|---|---|
| `BuildProductionWindows()` | 8 gameplay only | `Build/Windows/TheWhisperingWilds.exe` | `None` |
| `BuildQABenchmarkWindows()` | 8 gameplay + 4 benchmark | `Build/Windows_QA/TheWhisperingWilds_QA.exe` | `Development \| AllowDebugging` |

Each method also rewrites `EditorBuildSettings.scenes` to match its own profile
immediately before building, so the checked-in mixed 12-scene list is harmless
leftover state rather than a leak into the retail build. §4 is satisfied at the
code level. It remains **UNVERIFIED at runtime** because no build has been run.

> This was reported as a P2 defect in an earlier pass of this audit on the
> assumption that no build script existed. Direct reading of the script showed
> otherwise. Corrected.

### F-13 · P2 · `Launch-Game-Unity.ps1` targets the live project, not the repository

The production launcher invokes:

```
Unity.exe -batchmode -quit -projectPath 'C:\Users\mohan\My project'
```

`C:\Users\mohan\My project` is the live working copy, not the deliverable
`...\whispering-wilds\unity`. Any build produced by the documented launcher is
therefore not traceable to the repository. The path should be parameterised or
pointed at the repository project.

---

## G. Asset inventory (measured)

| Type | Count |
|---|---|
| `.glb` models | 109 |
| `.meta` | 292 |
| `.cs` | 72 (in `_Project/Scripts`) |
| Scenes | 12 gameplay/benchmark + 1 stray (`Assets/OutdoorsScene.unity`) |
| Prefabs | **1** (`New Mesh.prefab`) |
| Animator controllers | **1** (`PlayerLocomotionController.controller`) |
| Textures (`.png`/`.jpg`) | **11** total |

Real content confirmed present: `player.glb` (43 KB), 8 NPC models
(`murugan`, `meenakshi`, `selvam`, `velu`, `farmer`, `fisher`, `artisan`,
`forest-guide`), `nilgiri_tahr.glb`, vegetation (palmyra palm, mangroves, shola
tree, tea rows), vehicles, architecture per region, and a large Tamil cultural
prop set.

**Gaps:**

- Only **one** Animator controller exists, for the player. NPCs and wildlife have
  **no animation** — §11/§46 character animation and §40 species behaviour
  cannot be visually realised.
- Only **one** prefab. No reusable NPC/wildlife prefabs, no LOD prefabs (§57).
- 109 models against 11 textures means materials are overwhelmingly untextured
  or using Unity primitives; §9 (materials/textures assigned) will not pass.
- `Assets/OutdoorsScene.unity` is a stray scene not in build settings.

---

## H. Backend reality

Verified by inspection; the Node test suite is runnable without Unity.

- Firebase Admin backend exists: `server/firebase/admin.js`,
  `server/firebase/persistence-service.js`,
  `server/routes/persistence-routes.js`, `server/middleware/request-context.js`.
- `firestore.rules` was previously rewritten for server-authoritative writes.
- `firebase-admin` was added to `package.json`; a prior session reported
  `npm run test:backend` at 31/31 passing.
- Supabase placeholders (`your-supabase-project`, `public-anon-key`,
  `player_saves`, `supabase`): **0 occurrences in Unity scripts** — §29's
  obsolete production path is already absent from the Unity side.

> Backend claims in this section are from inspection plus a prior test report.
> They are **re-verified separately** below; the previous `31/31` figure is not
> restated as current until re-run.

---

## I. What is REAL vs LEGACY

### PRODUCTION (Unity 6 Windows path)

`unity/` — 72 C# systems, 8 gameplay scenes, 109 GLB models, HDRP 17.7,
Input System, Cinemachine, additive regional streaming, seasonal world clock,
regional climate, 11-state weather, staged vegetation, habitat wildlife types,
Firebase-shaped persistence via HTTP.

### LEGACY (browser / Electron)

At repository root: `index.html`, `3d-locomotion.html`, `js/`, `css/`,
`electron-main.js`, `sw.js`, `netlify.toml`, `Launch-Game-PC.ps1` /
`Launch-Game-PC.bat` (browser launchers), `server.js` (root),
`platform/`, `desktop/`, `distribution/`, `content/`.

**Risk:** the legacy browser tree still contains its own save/state logic. It
must never be allowed to dictate Unity state (§3). `Launch-Game-PC.ps1` opens a
browser and must not be presented as the production launcher (§70);
`Launch-Game-Unity.ps1` already exists and is the correct production entry.

### MIXED / MISLEADING

Do not trust these pre-existing artefacts — they predate this audit and several
make unverified claims:

`BUILD_REPORT.json`, `FINAL_GAME_QUALITY_REPORT.md`, `GAMEPLAY_QUALITY_REPORT.md`,
`FINAL_GAME_AUDIT.md`, `GAME_AUDIT_CURRENT.md`, `GAME_AUDIT_FINAL.md`,
`PRODUCTION_QA_REPORT.md`, `WORLD_STREAMING_REPORT.md`, `QUALITY_PERFORMANCE_REPORT.md`,
`REAL_ASSET_INTEGRATION_REPORT.md`, and the previous `docs/UNITY_RUNTIME_AUDIT.md`
/ `docs/FINAL_RUNTIME_AUDIT.md`. §72 requires regeneration from current tests.

---

## J. Honest summary

**Genuinely working and measured:** the C# compile; single-authoritative-clock
design; the full 12/12 four-season derivation; geographically correct regional
climate separation; calendar/time-skip arithmetic; the 11 weather states and their
region-restricted blending logic; additive regional streaming with correct ordering
and no hidden Chennai fallback.

**Not working / not implemented:** Unity Firebase integration (absent, so the
hardened cloud-save client currently has no auth source and runs local-save only);
baked NavMesh (so all `NavMeshAgent` navigation is inert); NPC/wildlife animation
(no controllers); region travel not yet wired to any caller; every measured
performance number.

**Corrected during this audit:** the hardcoded dev token and localhost URL; the
fake lodBias-based "dynamic scaling" (and the resulting per-frame `lodBias` write
conflict with the real quality manager); the unsafe `LoadSceneMode.Single` region
path; the `Vector3.zero` spawn fallback; five systems missing from the Chennai
scene; and the three `IInteractable` compile errors. Build separation
(PRODUCTION vs QA) was confirmed **already correct** — an earlier false positive
was retracted. F-8 and F-10 turned out to be already fixed in `56a6017` /
`331f18d`; those reports were retracted too.

**Blocked on the environment:** all build, launch, and runtime verification.

No Windows executable has been built or launched. No FPS figure is claimed.
No Firebase connectivity is claimed.

---

## K. Fixes applied during this audit

All are compile-verified **by static analysis only** — the licence loss prevents an
actual compile, so each is re-checked against the Editor before being trusted.

| ID | File | Fix |
|---|---|---|
| F-1 | `Quality/AdaptiveQualityManager.cs` | `ApplyDynamicScaling()` now delegates to the real `GraphicsPerformanceManager.ApplyEngineRenderResolution()` instead of faking resolution via `lodBias`. This also removes a genuine **lodBias write conflict**: both managers were writing `QualitySettings.lodBias` every frame. Warns explicitly when the real manager is absent. |
| F-6 | `Core/GameManager.cs` | `LoadRegion()` no longer calls `SceneManager.LoadScene()` (implicit `LoadSceneMode.Single`, no save, no reposition). It now resolves the scene name to a canonical region id and delegates to `RegionalSceneManager.TravelToRegion()`. Fails loudly on an unknown region instead of defaulting. Removed the now-unused `UnityEngine.SceneManagement` import. |
| — | `World/RegionalSceneManager.cs` | Added `ResolveRegionIdFromSceneName()`, backed by the authoritative `TamilNaduGeography.AllRegions` catalogue. Verified all 7 `sceneName` values match the build-settings scene filenames exactly. |
| F-7 | `World/RegionalSceneManager.cs` | `PositionPlayerAtRegionSpawn()` **no longer falls back to `Vector3.zero`**. With no spawn marker it now logs an error and keeps the player in place, rather than risking a spawn inside or below terrain. Also logs the resolved validated spawn. |
| F-4 | `Online/CloudSaveManager.cs` | Removed the baked-in `dev_session_token` and `http://localhost:3000` defaults. Endpoint is now runtime-supplied; tokens come from an `IdTokenProvider` fetched per request. Player builds reject non-HTTPS/loopback endpoints and fail closed to local saves. Success requires a genuine 2xx. Duplicated upload coroutine collapsed. |

### Deliberately not changed

- **F-3 (no baked NavMesh)** — requires `com.unity.ai.navigation`, a NavMesh bake in
  the Editor, and `NavMeshSurface` components. Not fixable by text edit; needs the
  Editor. Left for the licensed session.
- **F-5 (no Unity Firebase SDK)** — requires adding a package and designing real
  Firebase ID-token acquisition. Left for the licensed session; **F-4** below is the
  interim mitigation.
- **F-9 (dead forced-GC path)** — `CheckAndCleanMemory()` has no callers, so §55 is not
  violated. Left alone deliberately: deleting it would remove a deliberate recovery
  hook. Marked for review, not removal.
- **F-11 (junk GLBs)** — asset deletion is destructive and the Editor is unlicensed;
  deferred.
