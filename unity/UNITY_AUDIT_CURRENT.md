# The Whispering Wilds (காட்டு வழி • தடம்)

## Automated Unity 6 Project Audit — Current Baseline

**Timestamp**: 2026-09-29  
**Engine**: Unity 6000.6.3f1 (Release x64)  
**Target Platform**: Windows Standalone x64 (`TheWhisperingWilds.exe`)  
**Active Render Pipeline**: High Definition Render Pipeline (HDRP 17.7.0) with dynamic resolution scaling

---

### 1. Executive System Classification Summary

| System / Concern                | Status    | Assessment & Remediation Priority                                                                                                                                                                             |
| :------------------------------ | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Player Locomotion & Rig**     | `WORKING` | `player.glb` rigged with 23 bones, 24 animations, `CharacterController`, jump buffer & coyote time.                                                                                                           |
| **Appearance Limit (Max 5)**    | `WORKING` | Strictly clamped and persisted across runtime, save, UI, and cloud layers.                                                                                                                                    |
| **Authored 3D Assets**          | `WORKING` | 109 authored `.glb` models. Zero placeholder primitive cubes/spheres in production scenes.                                                                                                                    |
| **Scenes (12 Total)**           | `WORKING` | 8 playable regions + 4 automated benchmark suites registered in `EditorBuildSettings`.                                                                                                                        |
| **Camera Controller**           | `WORKING` | 3rd person orbital follow with `SphereCast` occlusion pushout. Cinemachine 3.1.2 integrated.                                                                                                                  |
| **Input System**                | `WORKING` | Unity New Input System (`UnityEngine.InputSystem`) for KBM & Gamepad. Legacy Input removed.                                                                                                                   |
| **Bilingual Dialogue & Quests** | `WORKING` | Tamil & English dialogue nodes, clue deduction engine, 24-slot inventory & crafting.                                                                                                                          |
| **Lighting & Day/Night**        | `WORKING` | 24-hour sun rotation, trilight ambient response, dynamic lighting presets.                                                                                                                                    |
| **Weather Simulation**          | `WORKING` | Dynamic monsoon rain, road puddles, wetness factor, fog attenuation.                                                                                                                                          |
| **Save & Persistence**          | `WORKING` | Versioned JSON local storage (`SaveSystem`) + asynchronous non-blocking Supabase cloud sync.                                                                                                                  |
| **Quality & Dynamic Scaling**   | `PARTIAL` | PresetManager and AutoDetector exist, but AdaptiveQualityManager previously updated variable without resizing engine render buffers (`ScalableBufferManager.ResizeBuffers`). Multi-manager conflicts present. |
| **Memory Management**           | `BROKEN`  | `MemoryBudgetManager` called periodic `GC.Collect()` and `Resources.UnloadUnusedAssets()` on a 60s timer, creating gameplay frame stalls. Must be moved strictly to loading boundaries.                       |
| **World Streaming & Cells**     | `PARTIAL` | Regional scene loader exists, but lacks deterministic chunk state machine (`UNLOADED`, `LOADING`, `LOADED`, `ACTIVE`, `INACTIVE`, `UNLOADING`) and predictive prefetch.                                       |
| **Asset Lifetime Authority**    | `MISSING` | No centralized `AssetManager` tracking Addressable and Resource load/retain/release lifecycles.                                                                                                               |
| **Crowd & NPC Tiers**           | `PARTIAL` | Schedules and distance culling exist; needs single-authority integration with quality-tier budgets.                                                                                                           |
| **Wildlife Simulation**         | `PARTIAL` | `WildlifeEntity` wander/flee exists with Nilgiri Tahr; needs quality scaling and broader species.                                                                                                             |
| **Traffic / Transit**           | `PARTIAL` | Waypoint traffic exists for auto-rickshaw; needs unified lifecycle management.                                                                                                                                |
| **Multiplayer / Realtime**      | `MISSING` | Dedicated `RealtimeManager` authority for network state synchronization is missing.                                                                                                                           |

---

### 2. Detailed Subsystem Audit

#### 2.1 Characters & NPCs

- **Player Character**: Rigged model at `Assets/_Project/Art/Models/Characters/Player/player.glb`. `CharacterController` locomotion driven by `PlayerMovement.cs` and `PlayerLocomotionController.controller`.
- **NPC Characters**: 8 authored human character models at `Assets/_Project/Art/Models/Characters/NPCs/` (`murugan.glb`, `velu.glb`, `selvam.glb`, `meenakshi.glb`, `forest-guide.glb`).
- **Appearance Constraint**: `PlayerAppearanceManager.cs` strictly enforces a ceiling of 5 permanent appearance changes.

#### 2.2 3D Model Catalog (109 Models)

- **Architecture (22)**:
  - Chennai: `tea_kadai_stall.glb`, `old_tamil_house.glb`, `street_row.glb`, `market_building.glb`, `electrical_pole.glb`
  - Chettinad: `courtyard_mansion.glb`, `athangudi_floor.glb`, `carved_door.glb`, `wooden_column.glb`
  - Delta: `irrigation_sluice.glb`, `cattle_shed.glb`, `granary.glb`, `village_house.glb`
  - Mamallapuram: `heritage_structure.glb`, `stone_workshop.glb`
  - Nilgiris: `toda_mund_hut.glb`, `forest_station.glb`, `hill_house.glb`, `botanical_portal.glb`
  - Thanjavur: `thanjavur_gopuram.glb`, `artisan_workshop.glb`, `heritage_temple_area.glb`
- **Vehicles (9)**:
  - `chennai_auto.glb`, `city_bus.glb`, `old_motorcycle.glb`, `old_bicycle.glb`, `bullock_cart.glb`, `fishing_boat.glb`, `wooden_boat.glb`, `mangrove_boat.glb`, `mangrove_rowboat.glb`
- **Vegetation (6)**:
  - `tea_rows.glb`, `tea_hedge.glb`, `shola_tree.glb`, `mangrove_cluster.glb`, `rhizophora_mangrove.glb`, `palmyra_palm.glb`
- **Props (61)**:
  - Cultural items: `agal_lamp.glb`, `ammi_kallu.glb`, `brass_kudam.glb`, `coffee_dabarah.glb`, `filter_coffee_tumbler.glb`, `kuthu_vilakku.glb`, `ural_ulakkai.glb`, `korai_mat.glb`, `flower_cart.glb`
  - Temple & craft: `granite_column.glb`, `temple_bell.glb`, `stone_sculpture.glb`, `stone_inscription.glb`, `stone_carving_tools.glb`, `bronze_art_object.glb`
  - Agricultural & fishing: `chola_waterwheel.glb`, `water_pump.glb`, `paddy_bundle.glb`, `farm_tools.glb`, `boat_dock.glb`, `fishing_net.glb`, `cast_net.glb`
- **Wildlife (1)**:
  - `nilgiri_tahr.glb`

#### 2.3 Quality & Performance Architecture Defects Identified

1. **Adaptive Quality Render Scale Disconnect**:
   - `AdaptiveQualityManager.cs` maintained an internal `CurrentRenderScale` variable but did not call `ScalableBufferManager.ResizeBuffers(scale, scale)` or adjust the active camera dynamic resolution settings.
2. **Periodic Garbage Collection Stalls**:
   - `MemoryBudgetManager.cs` fired `Resources.UnloadUnusedAssets()` and `GC.Collect()` every 60.0 seconds in `Update()`, creating severe micro-stutters during player traversal.
3. **Hardware Detection Heuristics**:
   - `AutoQualityDetector.cs` used a simplistic substring match that could misclassify modern discrete Intel Arc GPUs as low-end integrated graphics.
4. **Multiple Manager Authority Overlap**:
   - Quality presets, auto detection, adaptive scaling, memory budgeting, and settings menu controller each held fragmented ownership over graphical and memory settings without a single coordinating authority.

---

### 3. Single Authority Architectural Requirements (Phase 2)

To eliminate duplicate settings mutation and establish rigorous architectural boundaries, the following single authorities are established:

1. `GameManager`: Master game lifecycle, runtime state transitions, pause/unpause.
2. `GraphicsPerformanceManager`: Single graphics authority unifying hardware detection, preset application, real dynamic resolution buffer scaling, and hysteresis adaptation.
3. `MemoryManager`: Single memory governor enforcing subsystem budgets; strictly guarantees zero forced GC during active gameplay, deferring cleanups to scene/chunk loading boundaries.
4. `WorldStreamingManager`: Single streaming authority managing regional additive scenes and cell-level state machines (`UNLOADED`, `LOADING`, `LOADED`, `ACTIVE`, `INACTIVE`, `UNLOADING`).
5. `AssetManager`: Centralized Addressable and Resource lifecycle governor (`LoadAsync`, `Retain`, `Release`, `Unload`).
6. `InputManager`: Unified reader for KBM & Gamepad input using the Unity New Input System.
7. `PlayerManager`: Authoritative player controller, locomotion, and the strict 5-permanent-appearance-change clamp.
8. `QuestManager`: Bilingual quest progression and forensic deduction board.
9. `SaveManager`: Unified local versioned JSON persistence and non-blocking asynchronous cloud synchronization.
10. `RealtimeManager`: Network and multiplayer state synchronization governor.
