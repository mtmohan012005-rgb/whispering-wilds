# The Whispering Wilds (காட்டு வழி • தடம்) - Unity 6 Migration Document

## 1. System Migration Matrix

| System Area | Old System (Three.js Web Prototype) | New Unity 6 PC System | Migration Status |
| :--- | :--- | :--- | :--- |
| **Engine Runtime** | Browser Canvas + WebGL + Three.js | Unity 6 (6000.6.3f1) Standalone Windows x64 Native Executable | **Complete & Verified** |
| **Locomotion** | Custom JS Raycast / Procedural Locomotion | `CharacterController` with slope & step handling, jump buffer & coyote time | **Complete & Verified** |
| **Camera** | OrbitControls / Custom JS Pushout | 3rd-person orbital framing with `SphereCast` occlusion pushout | **Complete & Verified** |
| **Input System** | HTML Keyboard/Mouse EventListeners | Unity New Input System (`UnityEngine.InputSystem`), Gamepad + KBM | **Complete & Verified** |
| **Dialogue & NPCs** | Custom JS Dialogue Trees (`dialogue.js`) | C# `NPCCharacter` with bilingual branching dialogue, memory flags & audio | **Complete & Verified** |
| **NPC Schedules** | JS Timer Intervals | `NPCScheduleManager` responding to 24h `TimeOfDayManager` cycle | **Complete & Verified** |
| **NPC Crowd Optimization**| Uncapped updates | `NPCPerformanceTierManager` (Near: 60Hz, Medium: 10Hz, Far: 2Hz, Hibernating) | **Complete & Verified** |
| **Investigation** | DOM Modal Overlays | Interactive 3D Inspection + Investigation Board (`IInteractable`, `InvestigationManager`)| **Complete & Verified** |
| **Quests & Codex** | In-memory JS Objects (`quest-data.js`) | `QuestManager` bilingual tracker with serializable progression & deductions | **Complete & Verified** |
| **Inventory & Crafting** | JS DOM Tables & LocalStorage | `InventoryManager` (24-slot) + `CraftingManager` with authentic regional recipes | **Complete & Verified** |
| **Appearance Limit** | UI Flag in JS | **Strict 5-Permanent Appearance Changes** enforced in runtime, UI, & save system | **Complete & Verified** |
| **Audio** | HTML5 Audio / Web Audio Nodes | Unity 6 Spatial Audio Buses (`AudioManager`: Master, Ambience, Music, SFX, Voice, UI)| **Complete & Verified** |
| **Quality Profiles** | Fixed WebGL settings | `QualityPresetManager` (Very Low, Low, Medium, High, Ultra, Custom) | **Complete & Verified** |
| **Auto Hardware Detection**| None | `AutoQualityDetector` evaluating GPU, VRAM, CPU cores, RAM, and display | **Complete & Verified** |
| **Dynamic Adaptation** | None | `AdaptiveQualityManager` monitoring frame times & hysteresis scaling | **Complete & Verified** |
| **Memory & Streaming** | Unmanaged browser memory | `MemoryBudgetManager` (Mipmap texture streaming + deterministic unloads) | **Complete & Verified** |
| **Geographic Foundation** | Procedural arbitrary grid | `TamilNaduGeography` grounded on OpenStreetMap coordinates & NH corridors | **Complete & Verified** |
| **Wildlife Simulation** | None | `WildlifeManager` & `WildlifeEntity` (Cattle, Goats, Dogs, Tahr, Egrets) | **Complete & Verified** |
| **Transit / Traffic** | None | `TrafficSystem` (Auto-rickshaw, Bus, Motorcycle, Bullock Cart, Boats) | **Complete & Verified** |
| **Settings & Accessibility**| None | `SettingsMenuController` (Graphics, Display, Audio, FOV, Subtitles, UI Scale) | **Complete & Verified** |
| **Cloud Persistence** | Direct Supabase fetch in browser | Asynchronous non-blocking `CloudSaveManager` with offline local fallback | **Complete & Verified** |
| **Benchmarking Suite** | None | `PerformanceBenchmarkManager` automated 15s stress benchmarks with JSON reports | **Complete & Verified** |
| **Save / Persistence** | `localStorage` / IndexedDB | Versioned JSON saves in `Application.persistentDataPath` with safety clamp | **Complete & Verified** |

---

## 2. Playable & Benchmark Scene Architecture (12 Scenes)

| Scene File | Region / System | Tamil Name | Environment Theme | Key Authored 3D Assets |
| :--- | :--- | :--- | :--- | :--- |
| `00_Boot.unity` | Cold Bootloader | தொடக்கம் | Splash, Logo Animation, Asset Preload | Title menu UI, New Game, Continue, Codex, Rules Notice |
| `01_StateMap_TamilNadu.unity` | State Map Hub | பெருவழி வரைபடம் | Tamil Nadu macro relief board & highways | 3D state map, highway markers (NH16, NH32, NH81, NH181), fast-travel |
| `02_Chennai_GeorgeTown.unity` | Chennai George Town | சென்னை ஜார்ஜ் டவுன் | Dense colonial commercial fabric, wet monsoon asphalt | High Court plaza, Murugan Tea Kadai, auto-rickshaw, street row, props |
| `03_Pichavaram_Wetlands.unity`| Pichavaram Wetlands | பிச்சாவரம் | Dense tidal mangrove labyrinth & estuarine channels | Mangrove clusters, wooden boat dock, mangrove rowboat, fishing nets |
| `04_Thanjavur_Delta.unity` | Cauvery Delta & Thanjavur | காவிரி டெல்டா & தஞ்சை | Alluvial paddy fields, granaries, Chola granite citadel | Brihadisvara gopuram, Chola waterwheel, sluice, granary, bullock cart |
| `05_Chettinad_Mansion.unity` | Chettinad Mansions | செட்டிநாடு மாளிகை | Grand courtyard mansion with Athangudi floor tiles | Courtyard mansion, teak columns, ammi kallu, ural ulakkai, kuthu vilakku |
| `06_Mamallapuram_Shore.unity`| Mamallapuram Shore | மாமல்லபுரம் | Coastal granite boulders, ocean salt spray, stone craft| Shore temple heritage structure, stone workshop, sculptures, boats |
| `07_Nilgiris_Sanctuary.unity`| Nilgiris Biosphere | நீலகிரி வனம் | Montane shola forest, rolling tea terrace slopes | Toda mund hut, forest station, botanical portal, shola trees, Nilgiri Tahr |
| `WW_Benchmark_Chennai.unity` | Stress Benchmark | சென்னை சோதனை | High draw call urban market stress suite | Automated 15-second benchmark pass with frame pacing logging |
| `WW_Benchmark_Pichavaram.unity`| Stress Benchmark | பிச்சாவரம் சோதனை | Transparent water & foliage overdraw stress suite | Automated 15-second benchmark pass with frame pacing logging |
| `WW_Benchmark_Delta.unity` | Stress Benchmark | டெல்டா சோதனை | Open landscape & shadow cascades stress suite | Automated 15-second benchmark pass with frame pacing logging |
| `WW_Benchmark_Nilgiris.unity` | Stress Benchmark | நீலகிரி சோதனை | Dense foliage & wildlife physics stress suite | Automated 15-second benchmark pass with frame pacing logging |

---

## 3. Hardware Scalability & Quality Profiles

The game natively implements 5 distinct quality presets managed by `QualityPresetManager.cs`:
1. **Very Low (குறைந்தபட்சம்)**:
   - Render Scale: 0.70x, Shadow Distance: 20m, 1 cascade, soft shadows OFF, post-processing OFF.
   - Texture streaming budget: 256 MB. Target FPS: 30.
   - Designed for integrated graphics (Intel UHD/Iris, AMD Radeon Vega).
2. **Low (குறைவு)**:
   - Render Scale: 0.80x, Shadow Distance: 40m, 2 cascades, soft shadows OFF.
   - Texture streaming budget: 512 MB. Target FPS: 30.
3. **Medium (நடுத்தரம்)**:
   - Render Scale: 0.90x, Shadow Distance: 75m, 2 cascades, soft shadows ON, post-processing ON.
   - Texture streaming budget: 1024 MB. Target FPS: 60 with VSync.
4. **High (உயர்ந்தது)**:
   - Render Scale: 1.00x, Shadow Distance: 150m, 4 cascades, soft shadows ON, volumetric effects ON.
   - Texture streaming budget: 2048 MB. Target FPS: 60 with VSync.
5. **Ultra (அதிநவீனம்)**:
   - Render Scale: 1.00x, Shadow Distance: 250m, 4 cascades, 8x MSAA, full volumetrics, high density.
   - Texture streaming budget: 4096 MB. Target FPS: 120 with VSync.

---

## 4. Absolute Constraints & Rules

1. **Maximum 5 Permanent Appearance Changes**:
   - Strictly enforced across game logic (`PlayerAppearanceManager`), UI counter (`HUDManager`), and save files (`SaveSystem`).
   - Regional cultural attire swaps (veshti, thundu, nilgiri wool, farmer cotton) are unrestricted.
2. **Zero Web Browser Dependency**:
   - Standalone native Windows x64 binary (`TheWhisperingWilds.exe`) with direct hardware GPU rendering (Direct3D 11/12). Zero reliance on Chrome, Edge, Node.js, Electron, or localhost.
3. **Grounded Cultural Authenticity**:
   - Bilingual Tamil and English UI and dialogue.
   - Authentic 3D models for all heritage architecture, cultural utensils, domestic props, and regional wildlife. Zero placeholder geometric primitives.
