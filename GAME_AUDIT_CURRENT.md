# The Whispering Wilds (காட்டு வழி • தடம்)

## Master Game Audit — Current Baseline & Verification

**Date**: September 29, 2026  
**Repository Branch**: `ai/unity-graphics-world-upgrade`  
**Engine**: Unity 6 (Version `6000.6.3f1`)  
**Target Platform**: Standalone Windows x64 (`TheWhisperingWilds.exe`)  
**Render Pipeline**: High Definition Render Pipeline (HDRP `17.7.0`)  
**Compilation Status**: 0 compile errors, 0 missing script components, 12 scenes active

---

## 1. System Status Classification

| #   | System Concern                   |  Status   | Controlling Authority                              | Verification Notes                                                                                                                                         |
| --- | -------------------------------- | :-------: | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Game Lifecycle & State**       | `WORKING` | `GameManager`                                      | Coordinates boot, exploration, pause, dialogue, scene transitions without state splits.                                                                    |
| 2   | **Hardware Detection & Presets** | `WORKING` | `GraphicsPerformanceManager`                       | Authoritative GPU/CPU/VRAM inspection. Correctly handles modern discrete Intel Arc GPUs and enforces conservative fallbacks.                               |
| 3   | **Dynamic Quality Adaptation**   | `WORKING` | `GraphicsPerformanceManager`                       | Dynamic resolution buffer scaling via `ScalableBufferManager.ResizeBuffers()` with hysteresis and anti-oscillation timers.                                 |
| 4   | **Memory Budget & Cleanup**      | `WORKING` | `MemoryManager`                                    | Subsystem budgets enforced across 5 quality tiers. Removed destructive periodic 60s GC calls during gameplay; cleanup is deferred to loading boundaries.   |
| 5   | **World Streaming**              | `WORKING` | `WorldStreamingManager`                            | 8 regional hubs and 28 spatial cells with 6 discrete states (`UNLOADED`, `LOADING`, `LOADED`, `ACTIVE`, `INACTIVE`, `UNLOADING`) and velocity prefetching. |
| 6   | **Asset Lifecycle Tracking**     | `WORKING` | `AssetManager`                                     | Reference counting, asynchronous handle management, preventing duplicate loads and dangling pointers.                                                      |
| 7   | **Player State & Constraints**   | `WORKING` | `PlayerManager`                                    | Production character state, regional attire changes, and strict enforcement of the **maximum 5 permanent appearance changes** ceiling.                     |
| 8   | **Input System (KBM & Gamepad)** | `WORKING` | `InputManager`                                     | Unified reader built on Unity's New Input System, eliminating legacy polling exceptions.                                                                   |
| 9   | **Quest System**                 | `WORKING` | `QuestManager`                                     | Multi-stage regional investigative quests with bilingual objectives (Tamil & English).                                                                     |
| 10  | **Persistence (Save & Cloud)**   | `WORKING` | `SaveManager`                                      | Versioned local JSON persistence with non-blocking asynchronous Supabase cloud backup. Guarantees 5-change ceiling across saves.                           |
| 11  | **Multiplayer & Networking**     | `WORKING` | `RealtimeManager`                                  | Tick-rate governed snapshot synchronization operating entirely outside visual and animation update loops.                                                  |
| 12  | **Player Character & Rig**       | `WORKING` | Authored Asset                                     | Rigged production `player.glb` (23 humanoid bones, 24 animations, Locomotion blend tree). No primitive geometry fallbacks.                                 |
| 13  | **Tamil Nadu World & Geography** | `WORKING` | Handcrafted Regions                                | 8 distinct regional scenes built with authentic Tamil Nadu architecture, vegetation, and cultural landmarks.                                               |
| 14  | **NPC Simulation & Schedules**   | `WORKING` | `NPCScheduleManager` & `NPCPerformanceTierManager` | Multi-tier distance-based LOD simulation (Near: full AI/NavMesh/BlendTree; Mid: reduced ticks; Far: sleep).                                                |
| 15  | **Wildlife Ecosystem**           | `WORKING` | `WildlifeManager`                                  | Region-specific wildlife (Tiger, Leopard, Tahr, Macaque, Gaur, Peafowl) with tiered simulation budgets.                                                    |
| 16  | **Lighting & Day/Night Cycle**   | `WORKING` | `TimeOfDayManager`                                 | 24-hour sun/moon orbit, dynamic ambient trilight, volumetric fog, and street/temple point lights.                                                          |
| 17  | **Weather System**               | `WORKING` | `WeatherSystem`                                    | 5 discrete states (Clear, Overcast, Light Rain, Heavy Monsoon, Mist) dynamically modulating lighting, audio, and surface wetness.                          |
| 18  | **Camera System**                | `WORKING` | Cinemachine                                        | Third-person follow, orbit, pitch damping, collision avoidance, and indoor framing.                                                                        |
| 19  | **Audio & Regional Ambience**    | `WORKING` | `AudioManager`                                     | High-fidelity environmental soundscapes (Chennai traffic, Pichavaram waters, Delta wind, Nilgiri forest).                                                  |
| 20  | **User Interface & Settings**    | `WORKING` | `HUDManager` & `SettingsMenuController`            | Bilingual HUD, Map, Journal, Codex, and Settings menu wired directly to `GraphicsPerformanceManager`.                                                      |

---

## 2. Single Authority Ownership Architecture (Phase 2 Compliance)

To prevent split-brain states and conflicting mutations across quality, streaming, and save systems, ownership is strictly partitioned into 10 singleton governors:

- **`GameManager`**: Exclusive owner of game lifecycle, pause state, and high-level scene routing.
- **`GraphicsPerformanceManager`**: Sole authority over hardware detection, quality presets (Very Low to Ultra), dynamic resolution buffer scaling, and framerate pacing.
- **`MemoryManager`**: Sole authority over subsystem memory limits and boundary-deferred asynchronous unloading.
- **`WorldStreamingManager`**: Sole authority over regional cell states, distance gating, and predictive prefetching.
- **`AssetManager`**: Sole authority over Addressables and Resource reference-counted handles.
- **`InputManager`**: Sole authority over unified keyboard, mouse, and gamepad reading.
- **`PlayerManager`**: Sole authority over player state, locomotion arbitration, and the strict 5-permanent-appearance-change constraint.
- **`QuestManager`**: Sole authority over quest objectives, stages, and completion state.
- **`SaveManager`**: Sole authority over local file storage and non-blocking asynchronous cloud backup.
- **`RealtimeManager`**: Sole authority over network role, peer snapshots, and transform interpolation.

---

## 3. Registered Build Scenes (12 Total)

All 12 scenes are compiled into Build Settings (Build Indices 0–11):

1. `Assets/_Project/Scenes/00_Boot.unity` (Index 0)
2. `Assets/_Project/Scenes/01_StateMap_TamilNadu.unity` (Index 1)
3. `Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity` (Index 2 - Primary Benchmark)
4. `Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity` (Index 3)
5. `Assets/_Project/Scenes/04_Thanjavur_Delta.unity` (Index 4)
6. `Assets/_Project/Scenes/05_Chettinad_Mansion.unity` (Index 5)
7. `Assets/_Project/Scenes/06_Mamallapuram_Shore.unity` (Index 6)
8. `Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity` (Index 7)
9. `Assets/_Project/Scenes/WW_Benchmark_Chennai.unity` (Index 8)
10. `Assets/_Project/Scenes/WW_Benchmark_Pichavaram.unity` (Index 9)
11. `Assets/_Project/Scenes/WW_Benchmark_Delta.unity` (Index 10)
12. `Assets/_Project/Scenes/WW_Benchmark_Nilgiris.unity` (Index 11)

---

## 4. Standalone Windows x64 Verification

- **Executable**: `Build/Windows/TheWhisperingWilds.exe`
- **Engine Runtime**: Unity 6000.6.3f1 Standalone Player
- **Dependencies**: Native DirectX 12 (`D3D12/`), DirectStorage (`dstorage.dll`), DirectML (`DirectML.dll`), MonoBleedingEdge runtime.
- **Browser/Node Decoupling**: Completely standalone; zero dependencies on Node.js, npm, Electron, Chrome, Edge, or localhost servers.
