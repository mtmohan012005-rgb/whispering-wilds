# THE WHISPERING WILDS (காட்டு வழி • தடம்)

## Production Architecture Specification

**Target Engine**: Unity 6000.6.3f1 | HDRP 17.7.0  
**Target Platform**: Standalone Windows x64 Native

---

### 1. Architectural Philosophy

The Whispering Wilds runtime is architected as an authoritative, standalone PC exploration game. Gameplay logic, world simulation, physics, and input execute natively in C# within the Unity 6 engine. No web browser, JavaScript VM, or Node process is required to run the standalone single-player game.

```
+-----------------------------------------------------------------------------------+
|                        THE WHISPERING WILDS (UNITY 6)                             |
|                                                                                   |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  |    Core Systems    |  |  Living World Sim    |  |   Quality & Performance   |  |
|  | - GameManager      |  | - WorldTimeSystem    |  | - GraphicsPerformanceMgr  |  |
|  | - SaveManager      |  | - RegionalClimateSys |  | - AdaptiveQualityManager  |  |
|  | - AudioManager     |  | - WeatherSystem      |  | - MemoryManager           |  |
|  | - InputSystem      |  | - VegetationManager  |  | - NPCTierManager          |  |
|  | - RegionalSceneMgr |  | - WildlifeManager    |  | - Dynamic Buffer Scaling  |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
|             |                       |                            |                |
|  +--------------------+  +----------------------+  +---------------------------+  |
|  | Player Controller  |  |   NPC State FSM      |  |   Wildlife Simulation     |  |
|  | - PlayerMovement   |  | - 11-State FSM       |  | - 14-State Needs FSM      |  |
|  | - GroundCheck Mask |  | - Living Schedules   |  | - Habitat Bounding Zones  |  |
|  | - CharacterControl |  | - Occupation Actions |  | - Distance AI Tiers       |  |
|  +--------------------+  +----------------------+  +---------------------------+  |
+-----------------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v (Asynchronous HTTP)                                     v (WebSocket 20Hz)
+----------------------------------+             +----------------------------------+
|      Firebase Admin Backend      |             |     Node.js Multiplayer Server   |
|   /api/v1/persistence/saves      |             | - 20 Hz server tick              |
| - ID Token Authentication        |             | - Strict 5-player max room cap   |
| - Server-authoritative fields    |             | - Token-verified account ID      |
| - Optimistic concurrency (409)   |             | - Movement packet rate limit     |
+----------------------------------+             +----------------------------------+
```

---

### 2. Core Subsystem Boundaries

#### A. World Time & Calendar (`WorldTimeSystem.cs`)

- **Authoritative Clock**: Maintains `year`, `month` (1–12), `day` (1–30), `hour` (0–23), `minute` (0–59).
- **Diurnal Phases**: Dawn (05:00), Morning (07:00), Noon (11:30), Afternoon (14:00), Sunset (17:00), Evening (18:30), Night (21:00), Late Night (00:00).
- **Four Seasons**: Summer (Mar–May), Southwest Monsoon (Jun–Sep), Northeast Monsoon (Oct–Dec), Winter (Jan–Feb).
- **Time Skip Acceleration**: Fast-forward calculations step simulation state directly via `AdvanceWorldSimulation()` without minute-by-minute looping.

#### B. Regional Climate & Weather (`RegionalClimateSystem.cs`, `WeatherSystem.cs`)

- **Biomes**: 6 distinct regional climate profiles (Coastal, Delta, Wetland, Hills, DryInland, Forest).
- **Weather State Machine**: 11 data-driven states (`Clear` through `CoolClear`).
- **HDRP Volume Fog**: Updates `UnityEngine.Rendering.HighDefinition.Fog` volume overrides (`meanFreePath`, `albedo`) during smooth 10s transitions.
- **Surface Response**: Global shader properties `_GlobalWetness`, `_GlobalPuddleScale`, `_GlobalWindSpeed` modulated smoothly.

#### C. Wildlife Simulation & Habitat Boundaries (`WildlifeEntity.cs`, `WildlifeManager.cs`)

- **Sanctuary Enforcement**: Animals spawn exclusively within `WildlifeHabitatZone` triggers. Zero wild animals spawn in urban/residential zones.
- **Species**: Nilgiri Tahr, Gaur, Asian Elephant, Peafowl, Egret, Kingfisher. Domestic cattle/goats segregated into farm plot enclosures.
- **LOD Tiers**:
  - `Tier 0 (< 35m)`: Full 10Hz AI, dynamic avoidance, active look-at.
  - `Tier 1 (35–75m)`: 0.35s throttled tick rate.
  - `Tier 2 (75–150m)`: 1.2s low-cost tick rate.
  - `Tier 3 (> 150m)`: Culled to logical numbers in `LogicalCellPopulation`.

#### D. Community Residents & NPC Daily Routines (`NPCCharacter.cs`, `NPCPerformanceTierManager.cs`)

- **11-State FSM**: `Idle`, `GoToTarget`, `Working`, `Interacting`, `Talking`, `Resting`, `Eating`, `Socializing`, `ReturningHome`, `Sleeping`, `Interrupted`.
- **Occupations**: Farmer (plot irrigation/harvest), Fisherman (net handling), TeaWorker (shrub plucking), Shopkeeper, Elder.
- **Throttled Tick Execution**: Staggered across frames using round-robin batch cursor to prevent CPU spikes.

#### E. Botanical Agriculture (`VegetationManager.cs`, `CropInstance.cs`, `FruitTreeInstance.cs`, `FarmPlot.cs`)

- **Growth Pipeline**: 9 biological stages (`Seed` to `Harvestable`).
- **Zero Update Loop**: Individual crops have no per-frame `Update()`. Growth advances in batched passes on calendar day rollover or time skip.

#### F. Regional Scene Streaming (`RegionalSceneManager.cs`)

- **Additive Transition Protocol**:
  1. Validate destination `regionId`.
  2. Snapshot persistent world and player state.
  3. Preload target scene additively with `allowSceneActivation = false`.
  4. Activate target scene and set active.
  5. Position player at validated destination spawn.
  6. Rebind camera and active governors.
  7. Unload previous scene additively.
  8. Execute controlled boundary cleanup (no forced in-game GC).

#### G. Persistence & Firebase Backend Integration (`CloudSaveManager.cs`, `firestore.rules`)

- **Save Schema**: Canonical JSON DTOs carrying save revision, timestamp, player state, and world state.
- **Security Rules**: Locked down via Firestore rules; client cannot touch server-owned fields (`currency`, `role`, `appearanceChangeCount`, `antiCheat`).
- **Concurrency**: Revision checking guards against stale overwrites (`HTTP 409 Conflict`).

#### H. Realtime Multiplayer (`server.js`, `room-manager.js`)

- **Transport**: Node.js + Socket.IO.
- **Tick Rate**: 20 Hz server loop.
- **Capacity**: Hard 5-player limit per room; 6th player rejected.
- **Authentication**: Bearer ID token verified via Firebase Admin SDK.
