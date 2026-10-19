# SCRIPT AUDIT MATRIX â€” The Whispering Wilds

Audit: STEP 28, Section C (script-by-script matrix). Date: 2026-10-08.
Scope: `unity/Assets/_Project/Scripts/` â€” **147 scripts** (122 runtime, 25 editor/QA). Assembly/test files (`_Project/Tests`, 13 files) are covered by `TEST_COVERAGE_MATRIX.md`.

## 1. Field definitions and provenance

| Column | Meaning | Provenance |
|---|---|---|
| Script | Path relative to `_Project/Scripts/` | STATIC |
| LOC | Lines of source (newline count) | STATIC |
| Module | First folder (architecture area) | STATIC |
| Class | Primary type declared | STATIC |
| Static | `S` = static class; `i` = instance type | STATIC |
| Singleton | `1` = defines a public static `Instance` getter | STATIC |
| U / LU / FU | declares `Update` / `LateUpdate` / `FixedUpdate` (per-frame loop candidates) | STATIC |
| SceneMgr | `S` = references `SceneManager` | STATIC |
| Loc | `L` = references localisation (`LocalizationManager` / `LocalizedText`) | STATIC |
| Kind | `R` runtime, `E` editor/QA | STATIC |

Judgement beyond these structural fields (life-cycle state: ALIVE/REFERENCED/UNREFERENCED, naming compliance, API misuse) is assigned **only where the file was actually read**; everything else is honestly marked `â€”` pending individual review. No file is classified as dead/unreferenced without a targeted reference check.

Provenance key: **STATIC** = derived mechanically from source; **REVIEWED** = read/verified inline this session.

## 2. Roll-up by module

| Module | Scripts | Per-frame loops | Singletons | SceneManager | Localisation |
|---|---|---|---|---|---|
| Audio | 1 | 0 | 1 | 0 | 0 |
| Camera | 1 | 1 (LU) | 0 | 0 | 0 |
| Core | 6 | 1 (GameManager U) | 5 | 4 | 2 |
| Data | 12 | 0 | 0 | 0 | 1 |
| Display | 1 | 0 | 0 | 0 | 0 |
| Gameplay | 5 | 1 (PhotoMode U) | 1 | 0 | 1 |
| Geography | 6 | 1 (StateMapView LU) | 0 | 1 | 0 |
| Inventory | 3 | 0 | 2 | 0 | 0 |
| Investigation | 3 | 0 | 2 | 0 | 2 |
| Localization | 3 | 0 | 1 | 0 | 2 |
| NPC | 10 | 1 (NPCPerformanceTierManager U) | 4 | 1 | 1 |
| Online | 2 | 1 (RealtimeManager U) | 2 | 0 | 0 |
| Persistence | 2 | 0 | 1 | 1 | 0 |
| Photography | 2 | 0 | 0 | 0 | 0 |
| Physics | 4 | 1 (AntigravityZoneManager FU) | 0 | 0 | 0 |
| Player | 7 | 4 (InputManager, InputHandler, Interactor, Movement U) | 3 | 0 | 0 |
| Profiling | 4 | 2 (NilgirisPhysicsBenchmark, TelemetryOverlay U) | 2 | 3 | 0 |
| Quality | 5 | 4 (Adaptive, Graphics, MemoryBudget, Memory U) | 5 | 1 | 0 |
| Quests | 1 | 0 | 1 | 0 | 0 |
| UI | 8 | 3 (Journal, HUD, StateMap U) | 5 | 2 | 5 |
| Vegetation | 7 | 0 | 1 | 1 | 2 |
| Wildlife | 12 | 3 (Entity, Simulation, Spawner U) | 1 | 1 | 0 |
| World | 13 | 5 (TimeOfDay, Weather, Streaming, WorldTime, DebugOverlay U) | 7 | 5 | 1 |
| **Editor/QA** | **25** | 1 (RuntimeVisualDiagnostics U) | 4 | 15 | 2 |

## 3. Full matrix

| Script | LOC | Module | Class | Static | Singleton | U | LU | FU | SceneMgr | Loc | Kind |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Audio\AudioManager.cs | 177 | WhisperingWilds.Audio | AudioManager | i | 1 |  |  |  |  |  | R |
| Camera\CameraController.cs | 226 | WhisperingWilds.Cameras | CameraController | i | 0 |  | L |  |  |  | R |
| Core\AssetManager.cs | 134 | WhisperingWilds.Core | TrackedAssetHandle | i | 1 |  |  |  |  |  | R |
| Core\CampaignFlow.cs | 188 | WhisperingWilds.Campaign | CampaignFlow | i | 1 |  |  |  | S |  | R |
| Core\GameManager.cs | 272 | WhisperingWilds.Core | GameManager | i | 1 | U |  |  | S |  | R |
| Core\SaveManager.cs | 196 | WhisperingWilds.Core | SaveManager | i | 1 |  |  |  | S | L | R |
| Core\SaveMigrator.cs | 121 | WhisperingWilds.Core | SaveMigrator | S | 0 |  |  |  |  |  | R |
| Core\SaveSystem.cs | 743 | WhisperingWilds.Core | SavedInventoryItem | S | 0 |  |  |  | S | L | R |
| Data\ChennaiOpeningContent.cs | 520 | WhisperingWilds.Gameplay | ChennaiOpeningContent | S | 0 |  |  |  |  |  | R |
| Data\ChettinadMansionContent.cs | 475 | WhisperingWilds.Gameplay | ChettinadMansionContent | S | 0 |  |  |  |  |  | R |
| Data\ClueData.cs | 40 | WhisperingWilds.Data | ClueData | i | 0 |  |  |  |  |  | R |
| Data\GameDataCatalog.cs | 261 | WhisperingWilds.Data | GameDataCatalog | S | 0 |  |  |  |  |  | R |
| Data\ItemData.cs | 38 | WhisperingWilds.Data | ItemData | i | 0 |  |  |  |  |  | R |
| Data\MainCharacterData.cs | 204 | WhisperingWilds.Data | state | i | 0 |  |  |  |  | L | R |
| Data\MamallapuramShoreContent.cs | 481 | WhisperingWilds.Gameplay | MamallapuramShoreContent | S | 0 |  |  |  |  |  | R |
| Data\PichavaramContent.cs | 374 | WhisperingWilds.Gameplay | PichavaramContent | S | 0 |  |  |  |  |  | R |
| Data\QuestData.cs | 80 | WhisperingWilds.Data | QuestObjective | i | 0 |  |  |  |  |  | R |
| Data\RecipeData.cs | 30 | WhisperingWilds.Data | RecipeData | i | 0 |  |  |  |  |  | R |
| Display\DisplaySettingsManager.cs | 434 | WhisperingWilds.Display | DisplaySettingsManager | i | 0 |  |  |  |  |  | R |
| Editor\AssembleAllRegions.cs | 732 | WhisperingWilds.Editor | AssembleAllRegions | S | 0 |  |  |  | S |  | E |
| Editor\AssembleWhisperingWilds.cs | 764 | WhisperingWilds.Editor | AssembleWhisperingWilds | S | 0 |  |  |  | S |  | E |
| Editor\BuildBootScene.cs | 494 | WhisperingWilds.Editor | BuildBootScene | S | 0 |  |  |  | S | L | E |
| Editor\BuildPipelineAutomation.cs | 196 | WhisperingWilds.Editor | BuildPipelineAutomation | S | 0 |  |  |  |  |  | E |
| Editor\EcologyNavMeshBaker.cs | 379 | WhisperingWilds.Editor | EcologyNavMeshBaker | S | 0 |  |  |  | S |  | E |
| Editor\Geography\MiniJson.cs | 307 | WhisperingWilds.Editor.Geography | MiniJson | S | 0 |  |  |  |  |  | E |
| Editor\Geography\TamilNaduMapImporter.cs | 849 | WhisperingWilds.Editor.Geography | TamilNaduMapImporter | S | 0 |  |  |  |  |  | E |
| Editor\Geography\TamilNaduStateMapWiring.cs | 57 | WhisperingWilds.Editor.Geography | TamilNaduStateMapWiring | S | 0 |  |  |  | S |  | E |
| Editor\QA\MamallapuramRouteVerifier.cs | 446 | WhisperingWilds.Editor | MamallapuramRouteVerifier | S | 0 |  |  |  | S |  | E |
| Editor\QA\NilgirisBenchmarkSceneBuilder.cs | 167 | WhisperingWilds.EditorTools | NilgirisBenchmarkSceneBuilder | S | 0 |  |  |  | S |  | E |
| Editor\QA\RunHeadlessBenchmark.cs | 240 | WhisperingWilds.Editor.QA | RunHeadlessBenchmark | S | 0 |  |  |  | S |  | E |
| Editor\World\BuildChennaiPopulation.cs | 767 | WhisperingWilds.Editor | BuildChennaiPopulation | S | 0 |  |  |  | S |  | E |
| Editor\World\BuildChennaiStreet.cs | 599 | WhisperingWilds.Editor | BuildChennaiStreet | S | 0 |  |  |  |  |  | E |
| Editor\World\BuildChettinadMansion.cs | 1043 | WhisperingWilds.Editor | BuildChettinadMansion | S | 0 |  |  |  | S |  | E |
| Editor\World\BuildMamallapuramShore.cs | 813 | WhisperingWilds.Editor | BuildMamallapuramShore | S | 0 |  |  |  | S |  | E |
| Editor\World\WWLightingSetup.cs | 207 | WhisperingWilds.Editor | WWLightingSetup | S | 0 |  |  |  |  |  | E |
| Editor\World\WWMaterialLibrary.cs | 151 | WhisperingWilds.Editor | WWMaterialLibrary | S | 0 |  |  |  |  |  | E |
| Editor\World\WWMaterialUpgrade.cs | 302 | WhisperingWilds.Editor | WWMaterialUpgrade | S | 0 |  |  |  |  |  | E |
| Gameplay\GameplayContentRegistry.cs | 46 | WhisperingWilds.Gameplay | GameplayContentRegistry | S | 0 |  |  |  |  |  | R |
| Gameplay\GameplayEventBus.cs | 71 | WhisperingWilds.Gameplay | GameplayEventBus | S | 0 |  |  |  |  |  | R |
| Gameplay\GameplayEventInteractable.cs | 208 | WhisperingWilds.Gameplay | GameplayEventInteractable | i | 0 |  |  |  |  | L | R |
| Gameplay\GameplayRegionBootstrap.cs | 105 | WhisperingWilds.Gameplay | GameplayRegionBootstrap | i | 0 |  |  |  |  |  | R |
| Gameplay\PhotoModeController.cs | 199 | WhisperingWilds.Gameplay | PhotoModeController | i | 1 | U |  |  |  |  | R |
| Geography\RegionCell.cs | 109 | WhisperingWilds.Geography | RegionCell | i | 0 |  |  |  |  |  | R |
| Geography\TamilNaduGeoReference.cs | 103 | WhisperingWilds.Geography | TamilNaduGeoReference | i | 0 |  |  |  |  |  | R |
| Geography\TamilNaduMapData.cs | 93 | WhisperingWilds.Geography | TamilNaduMapData | i | 0 |  |  |  |  |  | R |
| Geography\TamilNaduStateMapBootstrap.cs | 96 | WhisperingWilds.Geography | TamilNaduStateMapBootstrap | S | 0 |  |  |  | S |  | R |
| Geography\TamilNaduStateMapView.cs | 276 | WhisperingWilds.Geography | TamilNaduStateMapView | i | 0 |  | L |  |  |  | R |
| Geography\TamilPlaceNames.cs | 94 | WhisperingWilds.Geography | TamilPlaceNames | S | 0 |  |  |  |  |  | R |
| Inventory\CraftingHistory.cs | 74 | WhisperingWilds.Inventory | CraftingHistory | S | 0 |  |  |  |  |  | R |
| Inventory\CraftingManager.cs | 127 | WhisperingWilds.Inventory | CraftingManager | i | 1 |  |  |  |  |  | R |
| Inventory\InventoryManager.cs | 376 | WhisperingWilds.Inventory | InventorySlot | i | 1 |  |  |  |  |  | R |
| Investigation\DiscoveryLog.cs | 140 | WhisperingWilds.Investigation | DiscoveryDefinition | S | 0 |  |  |  |  | L | R |
| Investigation\InvestigationManager.cs | 284 | WhisperingWilds.Investigation | InvestigationManager | S | 1 |  |  |  |  | L | R |
| Investigation\PuzzleStateStore.cs | 79 | WhisperingWilds.Investigation | PuzzleStateStore | S | 0 |  |  |  |  |  | R |
| Localization\LocalizationManager.cs | 567 | WhisperingWilds.Localization | language | i | 1 |  |  |  |  | L | R |
| Localization\LocalizedFontProvider.cs | 149 | WhisperingWilds.Localization | resolves | S | 0 |  |  |  |  |  | R |
| Localization\LocalizedText.cs | 111 | WhisperingWilds.Localization | LocalizedText | i | 0 |  |  |  |  | L | R |
| NPC\MainCharacterRegistry.cs | 370 | WhisperingWilds.NPC | MainCharacterRegistry | S | 0 |  |  |  |  |  | R |
| NPC\NPCActivityAnchor.cs | 75 | WhisperingWilds.NPC | NPCActivityAnchor | i | 0 |  |  |  |  |  | R |
| NPC\NPCAnimationDriver.cs | 194 | WhisperingWilds.NPC | NPCAnimationDriver | i | 0 |  |  |  |  |  | R |
| NPC\NPCCharacter.cs | 699 | WhisperingWilds.NPC | DialogueChoice | i | 0 |  |  |  |  | L | R |
| NPC\NPCInteractionLog.cs | 69 | WhisperingWilds.NPC | NPCInteractionLog | S | 0 |  |  |  |  |  | R |
| NPC\NPCNavigationController.cs | 291 | WhisperingWilds.NPC | NPCNavigationController | i | 0 |  |  |  |  |  | R |
| NPC\NPCPerformanceTierManager.cs | 354 | WhisperingWilds.NPC | NPCPerformanceTierManager | i | 1 | U |  |  | S |  | R |
| NPC\NPCScheduleAction.cs | 60 | WhisperingWilds.NPC | NPCScheduleAction | i | 0 |  |  |  |  |  | R |
| NPC\NPCScheduleManager.cs | 98 | WhisperingWilds.NPC | NPCScheduleManager | i | 1 |  |  |  |  |  | R |
| NPC\NPCState.cs | 32 | WhisperingWilds.NPC |  | i | 0 |  |  |  |  |  | R |
| NPC\NPCStateMachine.cs | 64 | WhisperingWilds.NPC | NPCStateMachine | i | 0 |  |  |  |  |  | R |
| NPC\NPCWallet.cs | 224 | WhisperingWilds.NPC | NPCWallet | i | 0 |  |  |  |  |  | R |
| Online\CloudSaveManager.cs | 247 | WhisperingWilds.Online | CloudSaveManager | i | 1 |  |  |  |  |  | R |
| Online\RealtimeManager.cs | 103 | WhisperingWilds.Online | RealtimeManager | i | 1 | U |  |  |  |  | R |
| Persistence\WorldPersistenceManager.cs | 229 | WhisperingWilds.Persistence | WorldPersistenceManager | i | 1 |  |  |  | S |  | R |
| Persistence\WorldStateData.cs | 58 | WhisperingWilds.Persistence | SavedFarmPlotState | i | 0 |  |  |  |  |  | R |
| Photography\PhotoJournal.cs | 124 | WhisperingWilds.Photography | PhotoJournal | S | 0 |  |  |  |  |  | R |
| Photography\PhotoTarget.cs | 26 | WhisperingWilds.Photography | PhotoTarget | i | 0 |  |  |  |  |  | R |
| Physics\AntigravityBodyState.cs | 126 | WhisperingWilds.PhysicsZones | AntigravityBodyState | i | 0 |  |  |  |  |  | R |
| Physics\AntigravityPhysicsPersistence.cs | 155 | WhisperingWilds.PhysicsZones | AntigravityPhysicsPersistence | S | 0 |  |  |  |  |  | R |
| Physics\AntigravityZoneManager.cs | 449 | WhisperingWilds.PhysicsZones | AntigravityZoneManager | i | 0 |  |  | F |  |  | R |
| Physics\GravityFieldSolver.cs | 314 | WhisperingWilds.PhysicsZones | GravityFieldSolver | i | 0 |  |  |  |  |  | R |
| Player\IInteractable.cs | 29 | WhisperingWilds.Player |  | i | 0 |  |  |  |  |  | R |
| Player\InputBindingManager.cs | 514 | WhisperingWilds.Player | ActionBinding | S | 1 |  |  |  |  |  | R |
| Player\InputManager.cs | 161 | WhisperingWilds.Player | InputManager | i | 1 | U |  |  |  |  | R |
| Player\PlayerAppearanceManager.cs | 118 | WhisperingWilds.Player | PlayerAppearanceManager | i | 0 |  |  |  |  |  | R |
| Player\PlayerInputHandler.cs | 379 | WhisperingWilds.Player | PlayerInputHandler | i | 0 | U |  |  |  |  | R |
| Player\PlayerInteractor.cs | 112 | WhisperingWilds.Player | PlayerInteractor | i | 0 | U |  |  |  |  | R |
| Player\PlayerManager.cs | 98 | WhisperingWilds.Player | PlayerManager | i | 1 |  |  |  |  |  | R |
| Player\PlayerMovement.cs | 380 | WhisperingWilds.Player | PlayerMovement | i | 0 | U |  |  |  |  | R |
| Profiling\BenchmarkSceneBootstrapper.cs | 101 | WhisperingWilds.Profiling | BenchmarkSceneBootstrapper | S | 0 |  |  |  | S |  | R |
| Profiling\NilgirisPhysicsBenchmark.cs | 340 | WhisperingWilds.Profiling | NilgirisPhysicsBenchmark | i | 0 | U |  |  | S |  | R |
| Profiling\PerformanceBenchmarkManager.cs | 205 | WhisperingWilds.Profiling | PerformanceBenchmarkManager | i | 1 |  |  |  | S |  | R |
| Profiling\PerformanceTelemetryOverlay.cs | 191 | WhisperingWilds.Profiling | PerformanceTelemetryOverlay | i | 1 | U |  |  | S |  | R |
| QA\QAStateMapCapture.cs | 516 | WhisperingWilds.QA | QAStateMapCapture | S | 0 |  |  |  | S |  | E |
| QA\QAVisualDiagnostics.cs | 599 | WhisperingWilds.QA | QAVisualDiagnostics | i | 0 |  |  |  | S |  | E |
| QA\RuntimeAutomatedSmokeTest.cs | 564 | WhisperingWilds.QA | RuntimeTestStepResult | i | 1 |  |  |  | S |  | E |
| QA\RuntimeEcologyAcceptanceTest.cs | 653 | WhisperingWilds.QA | RuntimeEcologyAcceptanceTest | i | 1 |  |  |  | S |  | E |
| QA\RuntimeVisualDiagnostics.cs | 1049 | WhisperingWilds.QA | RuntimeVisualDiagnostics | i | 0 | U |  |  | S |  | E |
| QA\StandaloneSmokeTest.cs | 1481 | WhisperingWilds.QA | StandaloneSmokeTest | i | 0 |  |  |  | S | L | E |
| QA\ZeroGAssetAuditTool.cs | 338 | WhisperingWilds.QA | ZeroGAssetAuditTool | S | 0 |  |  |  |  |  | E |
| Quality\AdaptiveQualityManager.cs | ~~197~~ | WhisperingWilds.Quality | AdaptiveQualityManager | – | – | U |  |  |  |  | ~~R~~ **REMOVED (§G)** |
| Quality\AutoQualityDetector.cs | ~~133~~ | WhisperingWilds.Quality | AutoQualityDetector | – | – |  |  |  |  |  | ~~R~~ **REMOVED (§G)** |
| Quality\GraphicsPerformanceManager.cs | 471 | WhisperingWilds.Quality | GraphicsPerformanceManager | i | 1 | U |  |  | S |  | R |
| Quality\MemoryBudgetManager.cs | ~~155~~ | WhisperingWilds.Quality | MemoryBudgetManager | – | – | U |  |  |  |  | ~~R~~ **REMOVED (§I)** |
| Quality\MemoryManager.cs | 205 | WhisperingWilds.Quality | MemoryManager | i | 1 | U |  |  |  |  | R |
| Quality\QualityPresetManager.cs | 242 | WhisperingWilds.Quality | QualityPresetManager | i | 1 |  |  |  |  |  | R |
| Quests\QuestManager.cs | 496 | WhisperingWilds.Quests | ActiveQuestProgress | i | 1 |  |  |  |  |  | R |
| UI\DialogueUI.cs | 483 | WhisperingWilds.UI | DialogueUI | i | 1 |  |  |  | S | L | R |
| UI\GameplayJournalUI.cs | 603 | WhisperingWilds.UI | GameplayJournalUI | i | 0 | U |  |  |  | L | R |
| UI\HUDManager.cs | 398 | WhisperingWilds.UI | HUDManager | i | 1 | U |  |  |  | L | R |
| UI\SettingsMenuController.cs | 286 | WhisperingWilds.UI | SettingsMenuController | i | 1 |  |  |  |  |  | R |
| UI\SettingsMenuUI.cs | 630 | WhisperingWilds.UI | SettingsMenuUI | i | 0 |  |  |  | S | L | R |
| UI\StateMapUI.cs | 91 | WhisperingWilds.UI | StateMapUI | i | 1 | U |  |  | S |  | R |
| UI\TitleMenuController.cs | 229 | WhisperingWilds.UI | TitleMenuController | i | 0 |  |  |  | S | L | R |
| Vegetation\CropInstance.cs | 222 | WhisperingWilds.Vegetation | CropInstance | i | 0 |  |  |  |  | L | R |
| Vegetation\FarmPlot.cs | 82 | WhisperingWilds.Vegetation | FarmPlot | i | 0 |  |  |  |  |  | R |
| Vegetation\FruitTreeInstance.cs | 189 | WhisperingWilds.Vegetation | FruitTreeInstance | i | 0 |  |  |  |  | L | R |
| Vegetation\PlantCategory.cs | 30 | WhisperingWilds.Vegetation |  | i | 0 |  |  |  |  |  | R |
| Vegetation\PlantDefinition.cs | 176 | WhisperingWilds.Vegetation | PlantDefinition | S | 0 |  |  |  |  |  | R |
| Vegetation\VegetationManager.cs | 145 | WhisperingWilds.Vegetation | VegetationManager | i | 1 |  |  |  | S |  | R |
| Wildlife\WildlifeDefinition.cs | 68 | WhisperingWilds.Wildlife | WildlifeDefinition | i | 0 |  |  |  |  |  | R |
| Wildlife\WildlifeEntity.cs | 517 | WhisperingWilds.Wildlife | WildlifeEntity | i | 0 | U |  |  |  |  | R |
| Wildlife\WildlifeFoodSource.cs | 44 | WhisperingWilds.Wildlife | WildlifeFoodSource | i | 0 |  |  |  |  |  | R |
| Wildlife\WildlifeGroup.cs | 63 | WhisperingWilds.Wildlife | WildlifeGroup | i | 0 |  |  |  |  |  | R |
| Wildlife\WildlifeHabitatZone.cs | 293 | WhisperingWilds.Wildlife | WildlifeHabitatZone | i | 0 |  |  |  |  |  | R |
| Wildlife\WildlifeManager.cs | 335 | WhisperingWilds.Wildlife | LogicalCellPopulation | i | 1 |  |  |  | S |  | R |
| Wildlife\WildlifeNavigationController.cs | 369 | WhisperingWilds.Wildlife | WildlifeNavigationController | i | 0 |  |  |  |  |  | R |
| Wildlife\WildlifePopulationState.cs | 30 | WhisperingWilds.Wildlife | WildlifePopulationState | i | 0 |  |  |  |  |  | R |
| Wildlife\WildlifeSimulation.cs | 100 | WhisperingWilds.Wildlife | WildlifeSimulation | i | 1 | U |  |  |  |  | R |
| Wildlife\WildlifeSpawner.cs | 72 | WhisperingWilds.Wildlife | WildlifeSpawner | i | 0 | U |  |  |  |  | R |
| Wildlife\WildlifeSpecies.cs | 354 | WhisperingWilds.Wildlife | SpeciesProfile | S | 0 |  |  |  |  |  | R |
| Wildlife\WildlifeWaterSource.cs | 44 | WhisperingWilds.Wildlife | WildlifeWaterSource | i | 0 |  |  |  |  |  | R |
| World\ArrivalTrigger.cs | 92 | WhisperingWilds.World | ArrivalTrigger | i | 0 |  |  |  |  |  | R |
| World\CulturalObjectCatalog.cs | 89 | WhisperingWilds.World | CulturalObjectCatalog | S | 0 |  |  |  |  |  | R |
| World\KeyLockedDoor.cs | 204 | WhisperingWilds.World | KeyLockedDoor | i | 0 |  |  |  |  | L | R |
| World\MansionPuzzleController.cs | 391 | WhisperingWilds.World | MansionPuzzleController | i | 0 |  |  |  |  | L | R |
| World\NavMeshSceneLink.cs | 93 | WhisperingWilds.World | NavMeshSceneLink | i | 0 |  |  |  |  |  | R |
| World\RegionalClimateProfile.cs | 208 | WhisperingWilds.World | RegionalClimateData | S | 0 |  |  |  |  |  | R |
| World\RegionalClimateSystem.cs | 187 | WhisperingWilds.World | RegionalClimateSystem | i | 1 |  |  |  | S |  | R |
| World\RegionalSceneManager.cs | 325 | WhisperingWilds.World | RegionalSceneManager | i | 1 |  |  |  | S |  | R |
| World\RegionUnlocks.cs | 463 | WhisperingWilds.World | RegionUnlocks | S | 1 |  |  |  |  |  | R |
| World\TamilNaduGeography.cs | 193 | WhisperingWilds.World | TamilNaduGeography | S | 0 |  |  |  |  |  | R |
| World\TamilNaduSeason.cs | 84 | WhisperingWilds.World | TamilNaduSeasonExtensions | S | 0 |  |  |  |  | L | R |
| World\TimeOfDayManager.cs | 200 | WhisperingWilds.World | TimeOfDayManager | i | 1 | U |  |  |  |  | R |
| World\TrafficSystem.cs | 50 | WhisperingWilds.World | TrafficSystem | i | 1 |  |  |  |  |  | R |
| World\WeatherSystem.cs | 477 | WhisperingWilds.World | WeatherSystem | i | 1 | U |  |  | S |  | R |
| World\WorldSimulationDebugOverlay.cs | 187 | WhisperingWilds.World | WorldSimulationDebugOverlay | i | 1 | U |  |  |  |  | R |
| World\WorldStreamingManager.cs | 343 | WhisperingWilds.World | WorldStreamingCell | i | 1 | U |  |  | S |  | R |
| World\WorldTimeSystem.cs | 262 | WhisperingWilds.World | WorldTimeSystem | i | 1 | U |  |  |  |  | R |


## 4. Notable findings (REVIEWED)

1. **Quality/ has five managers** (`GraphicsPerformanceManager`, `AdaptiveQualityManager`, `AutoQualityDetector`, `QualityPresetManager`, `MemoryManager`) — multiple adaptive authorities confirmed. **RESOLVED (§G)**: `AdaptiveQualityManager` and `AutoQualityDetector` removed; `GraphicsPerformanceManager` is the single decision+execution authority; `QualityPresetManager` is data-only.
2. **Two memory managers** (`MemoryManager`, `MemoryBudgetManager`) both call `GC.Collect` / `Resources.UnloadUnusedAssets` → dual cleanup authority (Section I). **RESOLVED (§I)**: `MemoryBudgetManager` removed; `MemoryManager` sole authority (boundary-only GC/Unload, tiered texture streaming).
3. **Two clock managers** (`TimeOfDayManager`, `WorldTimeSystem`) both `Update` singletons → duplicate time authority (Section E). **RESOLVED (§E)**: `WorldTimeSystem` authoritative clock; `TimeOfDayManager` is a lighting facade delegating reads.
4. **Four direct `SceneManager.LoadScene` call sites** bypassed the `RegionalSceneManager` funnel: `CampaignFlow:97`, `CampaignFlow:162`, `TitleMenuController:167`, `TitleMenuController:193` (Section F). **RESOLVED (§F)**: all funnel via `RequestCampaignEntry`; CampaignFlow has zero direct SceneManager references.
5. **Per-frame `GetComponent` confirmed once**: `PhotoModeController.Update` (Section D/J). **RESOLVED (§J)**: cached with null re-probe guard.
6. **`PichavaramContent.cs`** (Data) is authored but referenced nowhere â€” inert (Section P).
7. **New Mesh.prefab**, `SetupDemoScene.cs`, `Rotator.cs`, Readme editor scripts are legacy/unwired (Section AA).

## 5. Coverage honesty

STATIC columns are exhaustively derived. REVIEWED rows: `PlayerMovement`, `CameraController`, `PhotoModeController`, `NPCPerformanceTierManager`, `GameplayJournalUI`, `GraphicsPerformanceManager`, `CampaignFlow`, `RegionalSceneManager`, `SaveManager`, `SaveSystem`, `GameManager`, `GameplayContentRegistry`, `GameplayRegionBootstrap`, `ChettinadMansionContent`, `MamallapuramShoreContent`, `PichavaramContent`, `AssembleAllRegions`, `AssembleWhisperingWilds`. All remaining rows await targeted review per module sections; any claim to the contrary would be fabrication.
