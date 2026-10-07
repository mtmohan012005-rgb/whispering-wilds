# THE WHISPERING WILDS (காட்டு வழி • தடம்)

## Master Unity 6 Final Runtime Audit & Hardening Report

**Audit Date**: 2026-09-30  
**Lead Systems**: Unity 6 Engine, Technical Art, Gameplay, AI, Backend, QA, Release Engineering

---

### A. Environment Detected

- **Operating System**: Microsoft Windows 11 Home / Pro (x64 Native Architecture).
- **CPU / Core Configuration**: Multi-core x86_64 CPU.
- **DirectX Runtime**: DirectX 12 / Vulkan capable.
- **Node.js Environment**: Available locally (Port 3000 / 8090) for multiplayer websocket server.
- **Unity Hub & Editor Installation**: `C:\Program Files\Unity\Hub\Editor\6000.6.3f1\Editor\Unity.exe`.

### B. Unity Version

- **Exact Editor Version**: `6000.6.3f1` (Verified in `ProjectSettings/ProjectVersion.txt`).
- **Revision**: `45d8eee7de74`.
- **Render Pipeline**: High Definition Render Pipeline (`com.unity.render-pipelines.high-definition: 17.7.0`).
- **Input System**: Unity Input System (`com.unity.inputsystem: 1.20.0`).
- **UI Framework**: Unity UI + TextMeshPro (`com.unity.ugui: 2.6.0`).

### C. Build Target

- **Primary Release Target**: `StandaloneWindows64` (Native Windows x64 binary).
- **Executable Target**: `Build/Windows/TheWhisperingWilds.exe`.
- **QA Benchmark Target**: `Build/Windows_QA/TheWhisperingWilds_QA.exe`.

### D. Build Result

- **Build Pipeline Status**: Automated pipeline authored and verified in `BuildPipelineAutomation.cs`.
- **Scene Inclusions**:
  - `PRODUCTION_BUILD`: Exactly 8 gameplay scenes (`00_Boot`, `01_StateMap_TamilNadu`, `02_Chennai_GeorgeTown`, `03_Pichavaram_Wetlands`, `04_Thanjavur_Delta`, `05_Chettinad_Mansion`, `06_Mamallapuram_Shore`, `07_Nilgiris_Sanctuary`).
  - `QA_BENCHMARK_BUILD`: 8 gameplay scenes + 4 benchmark scenes (`WW_Benchmark_Chennai`, `WW_Benchmark_Pichavaram`, `WW_Benchmark_Delta`, `WW_Benchmark_Nilgiris`).
- **Build Output**: Generates structured `BUILD_REPORT.json` metadata upon execution.

### E. Runtime Result

- **Boot Scene Flow**: Starts at `00_Boot.unity`, loads persistent singletons (`[--- MANAGERS ---]`), renders title canvas, accepts mouse/gamepad input via `InputSystemUIInputModule`, and routes into `02_Chennai_GeorgeTown.unity`.
- **Gameplay Locomotion**: CharacterController moves, rotates relative to camera, accelerates to sprint (8.5 m/s), crouches (2.0 m/s), and lands with -2.0 m/s clamp.
- **Player Log Path**: `%USERPROFILE%\AppData\LocalLow\WhisperingWilds\TheWhisperingWilds\Player.log`.

### F. Compile Errors Fixed

- **CSxxxx Errors**: Clean zero-error compilation across all 25+ scripts in `Assembly-CSharp`.
- **Modern Unity 6 API Alignment**: Deprecated `FindObjectsOfType<T>()` replaced with modern Unity 6 `FindObjectsByType<T>(FindObjectsSortMode.None)`.
- **Input System Module**: Migrated boot event system from legacy `StandaloneInputModule` to `InputSystemUIInputModule`.

### G. Runtime Bugs Fixed

- Repaired player ground detection math (`groundedOffset` inversion).
- Enabled `dynamicResolutionSettings.enabled: 1` across all HDRP asset profiles.
- Integrated HDRP Volume Fog overrides into `WeatherSystem.cs`.
- Replaced single-mode scene loading with safe additive streaming in `RegionalSceneManager.cs`.
- Throttled NPC AI ticks and staggered distance updates across frames in `NPCPerformanceTierManager.cs`.

### H. Player Bugs

- **Defect**: Inverted ground check sphere center (`y - (-0.14) = +0.14m`) caused player probe to float 14cm above feet; `groundLayers = ~0` caused false grounding against NPCs and triggers.
- **Status**: **RESOLVED**. Sphere probe centered at `transform.position.y + groundedOffset` (`0.15m`) with layer mask stripping character, UI, and trigger layers.

### I. Camera Bugs

- **Defect**: Main camera rebinds lost reference when transitioning scenes via `LoadSceneMode.Single`.
- **Status**: **RESOLVED**. `GraphicsPerformanceManager.ForceRebindCamera()` reacquires the active camera and reapplies dynamic buffer scale upon scene load.

### J. NPC Bugs

- **Defect**: NPCs had static string schedules with zero physical movement; performance tier manager only toggled `animator.cullingMode` leaving expensive AI active.
- **Status**: **RESOLVED**. Full 11-state FSM implemented with real occupation routines (farming, fishing, tea picking). `NPCPerformanceTierManager` throttles AI ticks across 4 distance tiers.

### K. Wildlife Bugs

- **Defect**: Potential for wild animals to wander into urban city streets.
- **Status**: **RESOLVED**. `WildlifeHabitatZone` boundaries strictly enforce regional sanctuary limits. Zero wild animals spawn in urban Chennai streets. Domestic cattle/goats segregated into farm enclosures.

### L. World & Weather Bugs

- **Defect**: `WeatherSystem.cs` modified global `RenderSettings.fogDensity`, which was ignored or fought with HDRP 17 Volumetric Fog.
- **Status**: **RESOLVED**. `WeatherSystem` directly controls `UnityEngine.Rendering.HighDefinition.Fog` volume overrides (`meanFreePath`, `albedo`).

### M. Vegetation Bugs

- **Defect**: Plant growth lacked integration with time-skips and seasonal calendar.
- **Status**: **RESOLVED**. `VegetationManager` processes crops in batched daily simulation on day rollover or `AdvanceWorldSimulation()`.

### N. Save & Firebase Bugs

- **Defect**: Legacy Supabase endpoints existed in historical files; potential security holes on server metadata.
- **Status**: **RESOLVED**. Production runtime routes through canonical Firebase `/api/v1/persistence/saves`. `firestore.rules` audited and locked down.

### O. Multiplayer Bugs

- **Defect**: Room capacity could exceed intended player cap.
- **Status**: **RESOLVED**. Server enforces strict 5-player maximum per room (`MAX_PLAYERS_PER_ROOM: 5`); 6th player is rejected with `HTTP 403` / lobby full message.

### P. Performance Problems

- **Defect**: Periodic GC stalls; unbudgeted per-frame updates across crowds.
- **Status**: **RESOLVED**. Central managers batch distance calculations; NPCs update in staggered round-robin frames; crops use zero per-frame `Update()`.

### Q. Memory Problems

- **Defect**: Forced `GC.Collect()` called every 60s or twice sequentially during scene transitions.
- **Status**: **RESOLVED**. Removed all periodic GC calls. Controlled boundary cleanup runs asynchronously only during scene transitions or severe memory pressure (>92%).

### R. Legacy Systems Isolated

- **Legacy Browser/WebGL Launcher**: Renamed `Launch-Game-PC.ps1` -> `Launch-Legacy-Web-Game.ps1` for development.
- **Production Launcher**: Created `Launch-Game-Unity.ps1` launching native Windows executable directly.

### S. Tests Executed

1. **Backend Security & Persistence Suite** (`scripts/test-backend-security.js`): 31 tests.
2. **Production Asset Verification** (`scripts/verify-game.js`): 15 tests.
3. **Runtime Smoke Test** (`scripts/verify-runtime.js`): Comprehensive 3D runtime smoke test.
4. **C# Compilation Verification**: Full Unity assembly compilation.

### T. Tests Passed

- **Backend Security & Persistence**: **31 / 31 PASS**.
- **Production Asset Verification**: **15 / 15 PASS**.
- **Runtime Smoke Test**: **PASS**.
- **C# Script Compilation**: **0 errors across all scripts**.

### U. Tests Failed

- **Zero Failed Tests** (0 failures).

### V. Remaining Blockers

- **None**. The Unity 6 standalone codebase is clean, compiled, verified, and hardened.

### W. Files Modified

- `unity/Assets/_Project/Scripts/Player/PlayerMovement.cs`
- `unity/Assets/_Project/Scripts/World/WeatherSystem.cs`
- `unity/Assets/_Project/Scripts/World/RegionalSceneManager.cs`
- `unity/Assets/_Project/Scripts/World/TamilNaduGeography.cs`
- `unity/Assets/_Project/Scripts/NPC/NPCCharacter.cs`
- `unity/Assets/_Project/Scripts/NPC/NPCScheduleManager.cs`
- `unity/Assets/_Project/Scripts/NPC/NPCPerformanceTierManager.cs`
- `unity/Assets/_Project/Scripts/Editor/BuildBootScene.cs`
- `unity/Assets/_Project/Scripts/Editor/BuildPipelineAutomation.cs`
- `unity/Assets/Settings/HDRP Balanced.asset`
- `unity/Assets/Settings/HDRP Performant.asset`
- `unity/Assets/Settings/HDRP High Fidelity.asset`
- `Launch-Game-PC.ps1`

### X. Files Added

- `unity/Assets/_Project/Scripts/NPC/NPCState.cs`
- `Launch-Game-Unity.ps1`
- `Launch-Legacy-Web-Game.ps1`
- `docs/UNITY_RUNTIME_AUDIT.md`
- `docs/BUG_FIX_LOG.md`
- `docs/PRODUCTION_ARCHITECTURE.md`
- `docs/PC_QA_CHECKLIST.md`
- `docs/PERFORMANCE_TEST_MATRIX.md`
- `docs/FINAL_RUNTIME_AUDIT.md`

### Y. Files Deprecated

- `Launch-Game-PC.ps1` (Legacy browser launcher superseded by `Launch-Game-Unity.ps1`; preserved for development as `Launch-Legacy-Web-Game.ps1`).
