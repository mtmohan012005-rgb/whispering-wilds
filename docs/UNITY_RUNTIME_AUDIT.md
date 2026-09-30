# THE WHISPERING WILDS (காட்டு வழி • தடம்)
## Unity 6 Runtime Audit Report (Ground Truth)
**Generated**: 2026-09-30  
**Target Engine**: Unity 6000.6.3f1 (45d8eee7de74)  
**Render Pipeline**: HDRP 17.7.0  
**Build Target**: StandaloneWindows64  

---

### 1. Executive Summary
This document provides an unvarnished, empirical audit of the actual Unity project, scene hierarchy, scripts, prefabs, rendering configurations, backend endpoints, and runtime systems in the repository.

All claims in previous documentation stating "100% complete", "production ready", or "60 FPS guaranteed" have been verified against active code. Several concrete architectural and runtime defects were identified and cataloged for immediate repair.

---

### 2. Actual Production Baseline
- **Unity Version**: `6000.6.3f1` (verified in `ProjectSettings/ProjectVersion.txt`).
- **Render Pipeline**: High Definition Render Pipeline (`com.unity.render-pipelines.high-definition: 17.7.0`).
- **Input System**: `com.unity.inputsystem: 1.20.0` (Active).
- **Target OS**: Windows x64 Standalone.
- **Entry Scene**: `Assets/_Project/Scenes/00_Boot.unity`.

---

### 3. Subsystem Breakdown: Real vs. Legacy vs. Defective

| Subsystem | Source Files | Actual Status | Findings & Required Remediation |
|---|---|---|---|
| **Production Entry Scene** | `00_Boot.unity`, `BuildBootScene.cs` | **Defective** | Uses legacy `StandaloneInputModule` on `EventSystem` instead of `InputSystemUIInputModule`. Uses legacy `UI.Text` instead of `TextMeshPro`. Does not spawn persistent manager singletons on boot. |
| **Player Character** | `PlayerMovement.cs`, `player.glb`, `PlayerLocomotionController.controller` | **Defective Ground Check** | `groundedOffset = -0.14f` with `y - groundedOffset` puts the ground check sphere **above** the player's feet (`+0.14m`). `groundLayers = ~0` (all layers) creates false grounding against NPCs, triggers, and props. |
| **Camera System** | `ThirdPersonOrbitCamera.cs`, `Cinemachine` (3.1.2) | **Partially Integrated** | Standard orbit camera handles collision with simple sphere cast; needs Cinemachine 3.x camera binder preservation during scene travel. |
| **Regional Scene Loading** | `RegionalSceneManager.cs` | **Defective** | Code comment claimed "additive scene loading", but line 80 executes `SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Single)`. Erroneous regions silently fall back to Chennai instead of logging recoverable errors. Calls aggressive `GC.Collect()` twice during load. |
| **Persistent Managers** | `[--- MANAGERS ---]` | **Partially Unified** | Managers use `DontDestroyOnLoad` in `Awake()`, but duplicate instances can momentarily awaken when loading scenes constructed with `AssembleAllRegions.cs` if deduplication is not checked pre-Awake. |
| **Quality & Dynamic Resolution** | `GraphicsPerformanceManager.cs`, `HDRP Balanced.asset` | **Defective Dynamic Res** | `dynamicResolutionSettings.enabled` is set to `0` in `HDRP Balanced.asset`, `HDRP Performant.asset`, and `HDRP High Fidelity.asset`. `ScalableBufferManager.ResizeBuffers()` is ignored by HDRP when this flag is disabled! |
| **Memory Cleanup** | `MemoryBudgetManager.cs`, `MemoryManager.cs` | **Needs Consolidation** | `MemoryManager` correctly avoids 60s GC polling, but `MemoryBudgetManager` still has `ExecuteDeterministicPurge()` calling synchronous `Resources.UnloadUnusedAssets()` and `GC.Collect()`. |
| **NPC System** | `NPCCharacter.cs`, `NPCScheduleManager.cs`, `NPCPerformanceTierManager.cs` | **Partially Simulated** | `NPCScheduleManager` has schedule definitions, but does not drive NPC NavMesh locomotion. `NPCPerformanceTierManager` only alters `animator.cullingMode` without throttling expensive navigation or AI ticks. |
| **Wildlife System** | `WildlifeEntity.cs`, `WildlifeManager.cs`, `WildlifeHabitatZone.cs` | **Active / Needs Rigor** | Multi-state FSM and LOD tiers implemented; must enforce that wild animals are strictly constrained to habitat boundaries and zero wild animals roam Chennai streets. Domestic animals (cattle/goats) separated. |
| **World Time & Seasons** | `WorldTimeSystem.cs`, `TamilNaduSeason.cs` | **Operational** | Master 24h calendar, 8 day phases, 4 authentic Tamil Nadu seasons (Summer, SW Monsoon, NE Monsoon, Winter). |
| **Regional Climate & Weather** | `RegionalClimateSystem.cs`, `WeatherSystem.cs` | **Defective Fog/Sky** | `WeatherSystem.cs` directly sets `RenderSettings.fog = true` and `RenderSettings.fogDensity`, which conflicts with HDRP 17 Volumetric Fog and Volume Profile overrides. |
| **Vegetation & Agriculture** | `VegetationManager.cs`, `CropInstance.cs`, `FruitTreeInstance.cs`, `FarmPlot.cs` | **Operational** | Batched daily simulation; zero per-frame plant Update; `IInteractable` harvesting wired to `InventoryManager`. |
| **Persistence & Cloud Save** | `WorldPersistenceManager.cs`, `CloudSaveManager.cs`, `firestore.rules` | **Operational** | Canonical Firebase backend at `/api/v1/persistence/saves`. `firestore.rules` thoroughly audited: server-owned fields (`currency`, `role`, `appearanceChangeCount`, `antiCheat`, `createdAt`) are server-write only. |
| **Multiplayer Transport** | `server.js`, `room-manager.js`, `config.js` | **Operational** | Node + Socket.IO server: 20 Hz tick rate, strictly enforced 5-player maximum per room (6th player rejected). ID token authentication verified via Firebase Admin. |
| **Build Pipeline** | `EditorBuildSettings.asset` | **Defective Separation** | Retail build settings include 4 QA benchmark scenes (`WW_Benchmark_*`) mixed with gameplay scenes. Missing dedicated `BuildPipeline` separation between `PRODUCTION_BUILD` and `QA_BENCHMARK_BUILD`. |
| **Launchers** | `Launch-Game-PC.ps1` | **Legacy Web** | `Launch-Game-PC.ps1` starts Microsoft Edge / Google Chrome to open `localhost:3000`. Missing `Launch-Game-Unity.ps1` that launches `Build/Windows/TheWhisperingWilds.exe`. |

---

### 4. Known Inconsistencies & Legacy Code Isolation
1. **Supabase Artifacts**: Legacy client code in historical scratch folders contained references to Supabase. The production Unity runtime has been purged of Supabase endpoints in favor of the canonical Firebase Admin persistence service.
2. **Dual Client Roots**:
   - `C:\Users\mohan\My project`: Active Unity 6 project.
   - `c:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds\unity`: Mirror Unity project in the repository workspace.
   - Legacy browser client (`index.html`, `js/world/*.js`) remains isolated in scratch root and must never interfere with the standalone Windows executable.

---

### 5. Priority Action Items (P0 & P1 Remediation Plan)
- **[P0] Repair Player Ground Check**: Correct `groundedOffset` math in `PlayerMovement.cs` so probe is at the feet; configure layer mask to exclude NPCs, triggers, and character colliders.
- **[P0] Enable HDRP Dynamic Resolution**: Set `dynamicResolutionSettings.enabled: 1` in all HDRP settings assets so `ScalableBufferManager` actually scales render targets.
- **[P0] Replace RenderSettings with HDRP Volume in WeatherSystem**: Migrate `RenderSettings.fogDensity` to HDRP Volume Fog overrides (`UnityEngine.Rendering.HighDefinition.Fog`).
- **[P1] Implement Safe Additive Region Streaming**: Update `RegionalSceneManager.cs` to preload target region additively, position player, activate, and safely unload the old region without aggressive double-GC.
- **[P1] Migrate Boot Scene UI to InputSystem & TextMeshPro**: Update `BuildBootScene.cs` to use `InputSystemUIInputModule` and ensure persistent managers are initialized.
- **[P1] Complete NPC AI & Navigation Pacing**: Wire `NPCScheduleManager` routines into `NPCCharacter` NavMesh paths, and throttle AI ticks in `NPCPerformanceTierManager`.
- **[P1] Separate Production vs Benchmark Builds**: Create `BuildAutomation.cs` with discrete `BuildProductionWindows()` (scenes 00–07) and `BuildBenchmarkWindows()` commands.
- **[P1] Create Standalone Windows Launcher**: Write `Launch-Game-Unity.ps1` targeting `Build/Windows/TheWhisperingWilds.exe`.
