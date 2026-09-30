# THE WHISPERING WILDS (காட்டு வழி • தடம்)
## PC & Standalone Windows QA Checklist
**Test Suite Version**: 2.0.0  
**Target Engine**: Unity 6000.6.3f1 | HDRP 17.7.0  
**Target Platform**: Windows x64 Native Executable  

---

### Phase 1: Boot & Interface Initialization
- [x] **BOOT-01**: `00_Boot.unity` loads cleanly with zero missing reference exceptions.
- [x] **BOOT-02**: Exactly one main camera exists in the boot scene.
- [x] **BOOT-03**: Exactly one `EventSystem` exists, configured with modern `InputSystemUIInputModule`.
- [x] **BOOT-04**: `[--- MANAGERS ---]` root spawns all persistent singletons (`GameManager`, `SaveManager`, `WorldTimeSystem`, `QualityManager`).
- [x] **BOOT-05**: Main menu displays Title, Tamil Subtitle, and all menu buttons (`New Game`, `Continue`, `Settings`, `Codex`, `Quit`).
- [x] **BOOT-06**: Strict Appearance Rule Notice is visible at the bottom of the screen.
- [x] **BOOT-07**: Mouse click and gamepad navigation operate properly on all menu options.

---

### Phase 2: Locomotion, Physics & Grounding
- [x] **MOVE-01**: Authored `player.glb` model renders with full textures and materials.
- [x] **MOVE-02**: Humanoid avatar binds cleanly with zero T-pose or animation snapping.
- [x] **MOVE-03**: Ground check sphere probe correctly positions at player feet (`transform.position.y + groundedOffset`).
- [x] **MOVE-04**: Ground check layer mask excludes `Player`, `UI`, and `Ignore Raycast` triggers.
- [x] **MOVE-05**: Walking on flat ground advances smoothly without foot sliding.
- [x] **MOVE-06**: Walking uphill and downhill preserves continuous grounding without false airborne state.
- [x] **MOVE-07**: Jumping triggers jump animation and applies calculated vertical impulse (`v = sqrt(h * -2 * g)`).
- [x] **MOVE-08**: Falling triggers `FreeFall` animation state when descending below -4 m/s.
- [x] **MOVE-09**: Landing cleanly resets vertical velocity to -2 m/s.
- [x] **MOVE-10**: Sprinting increases locomotion speed to 8.5 m/s with corresponding animation blend.
- [x] **MOVE-11**: Crouching lowers player height and limits speed to 2.0 m/s.

---

### Phase 3: Camera & Viewport
- [x] **CAM-01**: Third-person orbit camera smoothly follows player orientation.
- [x] **CAM-02**: Camera distance and zoom respond accurately to mouse wheel and right stick.
- [x] **CAM-03**: Camera collision sphere cast prevents clipping through walls, buildings, and terrain.
- [x] **CAM-04**: Camera remains smoothly bound after scene transit and does not lose target.

---

### Phase 4: Regional Scene Streaming & Loading
- [x] **SCENE-01**: `RegionalSceneManager` preloads target scene additively.
- [x] **SCENE-02**: Target scene activates before previous scene is unloaded.
- [x] **SCENE-03**: Player CharacterController is moved safely to designated regional spawn point.
- [x] **SCENE-04**: Previous scene unloads cleanly without duplicate manager instantiation.
- [x] **SCENE-05**: Invalid region requests trigger `OnRegionLoadFailed` without blind fallback.
- [x] **SCENE-06**: Zero forced synchronous `GC.Collect()` calls during normal scene transit.

---

### Phase 5: Living World Simulation & Environment
- [x] **WORLD-01**: `WorldTimeSystem` advances 24-hour clock, day, month, and year.
- [x] **WORLD-02**: Diurnal phases transition smoothly (Dawn, Morning, Noon, Sunset, Night).
- [x] **WORLD-03**: Four authentic Tamil Nadu seasons derive automatically from calendar month.
- [x] **WORLD-04**: `RegionalClimateSystem` modulates regional temperature, humidity, and rainfall.
- [x] **WORLD-05**: `WeatherSystem` smoothly blends between 11 weather states over 10-second curves.
- [x] **WORLD-06**: HDRP Volume Fog overrides (`meanFreePath`, `albedo`) modulate atmospheric visibility.
- [x] **WORLD-07**: Rain emitter particles activate during rain weather states and stop during clear states.
- [x] **WORLD-08**: Global shader parameters `_GlobalWetness` and `_GlobalPuddleScale` update correctly.

---

### Phase 6: Botanical Agriculture & Farming
- [x] **PLANT-01**: Crops cycle through 9 biological stages (`Seed` to `Harvestable`).
- [x] **PLANT-02**: Individual crops execute zero per-frame `Update()` calls.
- [x] **PLANT-03**: Batched daily growth advances on day rollover or time skip.
- [x] **PLANT-04**: Fruit trees persist root trunk while fruit clusters cycle through flowering and ripening.
- [x] **PLANT-05**: Player interacts with harvestable crops, depositing items into `InventoryManager`.
- [x] **PLANT-06**: NPC farmers walk to `FarmPlot` anchors and perform tending actions.

---

### Phase 7: Wildlife Simulation & Habitat Boundaries
- [x] **WILD-01**: Wild species spawn strictly within designated `WildlifeHabitatZone` triggers.
- [x] **WILD-02**: Zero wild animals roam Chennai streets or residential market areas.
- [x] **WILD-03**: Domestic animals (cattle/goats) remain confined to pastoral farm enclosures.
- [x] **WILD-04**: Animals use NavMesh navigation rather than directly setting transform positions.
- [x] **WILD-05**: Animals transition through 14 behavior states based on hunger, thirst, and rest needs.
- [x] **WILD-06**: Animals react to approaching players: pausing, observing, and fleeing at safe thresholds.
- [x] **WILD-07**: Distant animals throttle tick rates (Tier 1: 0.35s, Tier 2: 1.2s, Tier 3: logical population).

---

### Phase 8: Community Residents & NPC Daily Routines
- [x] **NPC-01**: NPCs follow 11-state FSM routines driven by `WorldTimeSystem`.
- [x] **NPC-02**: Farmers, Fishermen, TeaWorkers, Shopkeepers, and Elders perform scheduled actions.
- [x] **NPC-03**: Player interaction pauses NPC movement and opens bilingual dialogue interface.
- [x] **NPC-04**: Dialogue choices record memory flags (`RecordMemory()`).
- [x] **NPC-05**: Dialogue completion returns NPC smoothly to scheduled activity.
- [x] **NPC-06**: `NPCPerformanceTierManager` throttles AI ticks (10Hz near, 3Hz medium, 0.5Hz far, 0.1Hz hibernating).

---

### Phase 9: Quality & Dynamic Resolution
- [x] **QUAL-01**: Quality presets (Very Low to Ultra) apply distinct shadow, texture, and LOD configurations.
- [x] **QUAL-02**: `dynamicResolutionSettings.enabled` is active across all HDRP assets.
- [x] **QUAL-03**: `ScalableBufferManager.ResizeBuffers()` dynamically modulates render target scale.
- [x] **QUAL-04**: Hysteresis timers prevent rapid oscillation between quality levels.
- [x] **QUAL-05**: Zero periodic 60-second `GC.Collect()` calls during gameplay.

---

### Phase 10: Persistence & Security
- [x] **SAVE-01**: Local save writes compact, structured JSON to persistent data path.
- [x] **SAVE-02**: Save reload restores player position, active region, inventory, and world time.
- [x] **SAVE-03**: `CloudSaveManager` synchronizes save records to Firebase backend asynchronously.
- [x] **SAVE-04**: Offline play falls back safely to local persistence without crash or hang.
- [x] **SAVE-05**: `firestore.rules` block client writes to server-owned fields (`currency`, `role`, `antiCheat`).
- [x] **SAVE-06**: Revision checking detects and prevents conflicting overwrites (`HTTP 409`).

---

### Phase 11: Realtime Multiplayer
- [x] **NET-01**: Node.js multiplayer server runs steady 20 Hz tick rate.
- [x] **NET-02**: Rooms enforce strict maximum of 5 players.
- [x] **NET-03**: 6th player attempting to join is rejected with appropriate capacity error.
- [x] **NET-04**: Socket connections authenticate using verified Firebase ID tokens.
- [x] **NET-05**: Movement packet rate limiter prevents client flooding.

---

### Phase 12: Build & Release Integrity
- [x] **BUILD-01**: Unity compiles with zero C# errors across `Assembly-CSharp`.
- [x] **BUILD-02**: Production build script outputs `Build/Windows/TheWhisperingWilds.exe` with only gameplay scenes.
- [x] **BUILD-03**: Benchmark scenes are isolated to QA benchmark build (`Build/Windows_QA/`).
- [x] **BUILD-04**: `Launch-Game-Unity.ps1` executes native Windows binary with zero web browser dependencies.
