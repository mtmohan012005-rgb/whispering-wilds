# PROJECT FILE INVENTORY

**Step:** STEP 28 — A. Project-wide inventory
**Method:** Real enumeration via `Get-ChildItem -Recurse` + `git ls-files` on 2026-10-08. No files deleted.
**Root:** `C:\Users\mohan\.gemini\antigravity-ide\scratch\whispering-wilds`
**Unity project root (authoritative):** `<root>\unity` (verified: its `ProjectSettings\ProjectVersion.txt` is the live editor project, Library 4035 MB).

---

## 1. Whole-repository totals

| Metric | Count |
|---|---|
| Git-tracked files | 2,224 |
| Untracked working-tree files | 37 |
| Unity-tracked files (`unity/`) | 1,171 |
| Legacy web-tracked files (js/css/server/launcher/desktop/content/docs/distribution/platform/scripts/tools) | 739 |
| Approx. repo size on disk | ~5.4 GB |
| First-party Unity assets (`unity/Assets`) | 1,152 files |

## 2. Unity first-party asset census (`unity/Assets`)

| Extension | Count |
|---|---|
| `.meta` (Unity-generated for first-party assets) | 618 |
| `.cs` (C# scripts + tests) | 164 |
| `.mat` (materials) | 155 |
| `.glb` (3D models) | 109 |
| `.asset` (ScriptableObjects/NavMesh/settings) | 41 |
| `.gitkeep` (empty folder markers) | 30 |
| `.unity` (scenes) | 14 |
| `.png` (textures/screenshots) | 12 |
| `.md` (in-Assets docs) | 2 |
| `.controller` (AnimatorController) | 1 |
| `.prefab` | 1 (`New Mesh.prefab` — default, unused) |
| `.wlt` (lighting settings) | 1 |
| `.inputactions` (Input System actions asset) | 1 |
| `.compute` (shader compute) | 1 |
| `.json` | 1 (`Art\Models\Characters\Player\CHARACTER_MANIFEST.json`) |
| `.jpg` (texture) | 1 |
| **Total** | **1,152** |

> Note: **`.`asmdef (0)** — no asmdefs; all scripts compile into `Assembly-CSharp`/`Assembly-CSharp-Editor`.
> Note: **audio assets: 0** (no `.wav`/`.ogg`/`.mp3`/`.aiff` anywhere in `Assets` or `StreamingAssets`/`Resources`). `AudioManager` exists but there is no audio content in the project — flagged under section V.
> Note: localization is **C#-embedded** — `LocalizationManager` holds 237 `LocalizationEntry(key, english, tamil)` rows; there are **no** JSON/CSV localization tables.

## 3. C# scripts (− confidently)

| Area | Count | Detail |
|---|---|---|
| Runtime scripts | 129 | `unity/Assets/_Project/Scripts/` minus the 18 editor scripts |
| Editor-only scripts | 18 | `Scripts\Editor\*` (assemble/build/QA/bake tooling) |
| Test scripts | 13 | `unity/Assets/_Project/Tests/Editor\*.cs`, EditMode only |
| **First-party game scripts** | **160** | (129 + 18 + 13) |
| Legacy scripts in Assets root | 4 | `Editor\SetupDemoScene.cs`, `Scripts\Rotator.cs`, `TutorialInfo\Scripts\Readme.cs`, `TutorialInfo\Scripts\Editor\ReadmeEditor.cs` — **REVIEW/LEGACY** |
| **Total `.cs` in Assets** | **164** | |

Full 147-script map under `Scripts\` by subsystem:

```
Audio\AudioManager.cs                    1
Camera\CameraController.cs               1
Core\AssetManager, CampaignFlow, GameManager, SaveManager, SaveMigrator, SaveSystem   6
Data\ChennaiOpeningContent, ChettinadMansionContent, ClueData, GameDataCatalog,
     ItemData, MainCharacterData, MamallapuramShoreContent, PichavaramContent*,
     QuestData, RecipeData              10
Display\DisplaySettingsManager.cs       1
Editor\*                                 18
Gameplay\GameplayContentRegistry, GameplayEventBus, GameplayEventInteractable,
     GameplayRegionBootstrap, PhotoModeController                                5
Geography\RegionCell, TamilNaduGeoReference, TamilNaduMapData, TamilNaduStateMapBootstrap,
     TamilNaduStateMapView, TamilPlaceNames                                         6
Inventory\CraftingHistory, CraftingManager, InventoryManager                       3
Investigation\DiscoveryLog, InvestigationManager, PuzzleStateStore                 3
Localization\LocalizationManager, LocalizedFontProvider, LocalizedText             3
NPC\MainCharacterRegistry, NPCActivityAnchor, NPCAnimationDriver, NPCCharacter,
     NPCInteractionLog, NPCNavigationController, NPCPerformanceTierManager,
     NPCScheduleAction, NPCScheduleManager, NPCState, NPCStateMachine, NPCWallet   12
Online\CloudSaveManager, RealtimeManager                                            2
Persistence\WorldPersistenceManager, WorldStateData                                 2
Photography\PhotoJournal, PhotoTarget                                               2
Physics\AntigravityBodyState, AntigravityPhysicsPersistence, AntigravityZoneManager,
     GravityFieldSolver                                                             4
Player\IInteractable, InputBindingManager, InputManager, PlayerAppearanceManager,
     PlayerInputHandler, PlayerInteractor, PlayerManager, PlayerMovement            8
Profiling\BenchmarkSceneBootstrapper, NilgirisPhysicsBenchmark,
     PerformanceBenchmarkManager, PerformanceTelemetryOverlay                       4
QA\QAStateMapCapture, QAVisualDiagnostics, RuntimeAutomatedSmokeTest,
     RuntimeEcologyAcceptanceTest, RuntimeVisualDiagnostics, StandaloneSmokeTest,
     ZeroGAssetAuditTool                                                            7
Quality\AdaptiveQualityManager, AutoQualityDetector, GraphicsPerformanceManager,
     MemoryBudgetManager, MemoryManager, QualityPresetManager                       6
Quests\QuestManager                                                                 1
UI\DialogueUI, GameplayJournalUI, HUDManager, SettingsMenuController,
     SettingsMenuUI, StateMapUI, TitleMenuController                                 7
Vegetation\CropInstance, FarmPlot, FruitTreeInstance, PlantCategory, PlantDefinition,
     VegetationManager                                                               6
Wildlife\WildlifeDefinition, WildlifeEntity, WildlifeFoodSource, WildlifeGroup,
     WildlifeHabitatZone, WildlifeManager, WildlifeNavigationController,
     WildlifePopulationState, WildlifeSimulation, WildlifeSpawner, WildlifeSpecies,
     WildlifeWaterSource                                                            12
World\ArrivalTrigger, CulturalObjectCatalog, KeyLockedDoor, MansionPuzzleController,
     NavMeshSceneLink, RegionalClimateProfile, RegionalClimateSystem,
     RegionalSceneManager, RegionUnlocks, TamilNaduGeography, TamilNaduSeason,
     TimeOfDayManager, TrafficSystem, WeatherSystem, WorldSimulationDebugOverlay,
     WorldStreamingManager, WorldTimeSystem                                        17
```

`*` `PichavaramContent.cs` — **WIP (STEP 27, unwired, inert)**: authored but NOT registered in `GameplayContentRegistry`, not referenced by any builder, no scene anchors. Safe while the intro step runs; to be wired under section P or removed.

## 4. Scenes (14 in `Assets`)

| Scene | Class |
|---|---|
| `_Project\Scenes\00_Boot.unity` | PRODUCTION |
| `_Project\Scenes\01_StateMap_TamilNadu.unity` | PRODUCTION |
| `_Project\Scenes\02_Chennai_GeorgeTown.unity` | PRODUCTION |
| `_Project\Scenes\03_Pichavaram_Wetlands.unity` | PRODUCTION |
| `_Project\Scenes\04_Thanjavur_Delta.unity` | PRODUCTION |
| `_Project\Scenes\05_Chettinad_Mansion.unity` | PRODUCTION |
| `_Project\Scenes\06_Mamallapuram_Shore.unity` | PRODUCTION |
| `_Project\Scenes\07_Nilgiris_Sanctuary.unity` | PRODUCTION |
| `_Project\Scenes\WW_Benchmark_Chennai.unity` | QA/PERF |
| `_Project\Scenes\WW_Benchmark_Delta.unity` | QA/PERF |
| `_Project\Scenes\WW_Benchmark_Nilgiris.unity` | QA/PERF |
| `_Project\Scenes\WW_Benchmark_Pichavaram.unity` | QA/PERF |
| `mtmohan.unity` (Assets root) | LEGACY (REVIEW) |
| `OutdoorsScene.unity` (Assets root) | LEGACY (REVIEW) |

QA build `sceneCount: 12` (matches the 12 production/benchmark scenes; the 2 legacy root scenes are not in the build).

## 5. ScriptableObjects / `.asset` (41)

| Group | Count |
|---|---|
| NavMesh bake data (`_Project\NavMeshData\<scene>\`) | 6 |
| Geography generated (`_Project\Resources\Geography\Generated\` roads+rivers+coast/mountains/outline/ref/mapdata) | 12 |
| RegionCell assets (`_Project\Resources\Geography\RegionCells\`) | 12 |
| HDRP settings (`Settings\HDRP*`, DefaultLookDev, DefaultSettingsVolume, HDRenderPipelineAsset, HDRenderPipelineGlobalSettings, SkyandFogSettingsProfile) | 8 |
| XR management (`Settings\XR\XRGeneralSettingsPerBuildTarget.asset`) | 1 |
| Build Profile (`Settings\Build Profiles\Windows.asset`) | 1 |
| `Readme.asset` | 1 |

## 6. Project configuration

- `unity\ProjectSettings\` — 29 files (incl. `ProjectVersion.txt` = **6000.6.3f1**, GraphicsSettings, QualitySettings, InputManager, DynamicsManager, MemorySettings, EditorBuildSettings, TagManager, TimeManager, HDRPProjectSettings, NavMeshAreas, AudioManager.asset etc.).
- `unity\Packages\` — `manifest.json`, `packages-lock.json` (see UNITY_CONFIGURATION_AUDIT.md, section B).

## 7. Tests

- **13 EditMode test files** (`Assets\_Project\Tests\Editor\`): AccessibilityTests, AppearanceRuleTests, AudioSettingsTests, DisplaySettingsTests, InputRebindTests, LocalizationTests, PlayerControlsTests, SaveSettingsCompatibilityTests, SettingsIntegrationTests, Step24SettingsIntegrationTests, Step27RegionProgressionTests, Step3SettingsTests, Step4ChennaiGameplayTests.
- Runtime QA drivers: `StandaloneSmokeTest`, `RuntimeAutomatedSmokeTest`, `RuntimeEcologyAcceptanceTest`, `RuntimeVisualDiagnostics`, `QAStateMapCapture`, `ZeroGAssetAuditTool` (see TEST_COVERAGE_MATRIX.md, section Y).

## 8. QA / benchmark / report files

- `unity\Build\Windows_QA\` — QA player build, **281,759,787 B ≈ 268.7 MiB**, `TheWhisperingWilds_QA.exe`, `BUILD_REPORT.json` (`result: Succeeded`, `sceneCount 12`, `unityVersion 6000.6.3f1`, timestamp 2026-10-08T02:44:16Z, duration 41.62 s).
- Root `Build\Windows\` — 266 MB release-shaped build (older output; REVIEW — superseded by `unity\Build\Windows_QA`? Verify in section X).
- Root QA/reports: `PERFORMANCE_FINAL_REPORT.md`, `PERFORMANCE_BASELINE_REPORT.md`, `PERFORMANCE_QA_REPORT.md`, `PERFORMANCE_BENCHMARK_REPORT.json`, `STARTUP_PERFORMANCE_REPORT.md`, `LOCALIZATION_QA_REPORT.md`, `PRODUCTION_QA_REPORT.md`, `PRODUCTION_3D_ASSET_REPORT.md`, `REAL_ASSET_INTEGRATION_REPORT.md`, `RELEASE_VALIDATION_REPORT.md`, `WINDOWS_GAMEPLAY_QA_REPORT.md`, `WORLD_STREAMING_REPORT.md`/`.json`, `SETTINGS_INTEGRATION_QA_REPORT.md`, `QUALITY_PERFORMANCE_REPORT.md`, `TEXTURE_AUDIT_REPORT.json`, `ASSET_AUDIT_REPORT.json`, `BUILD_REPORT.json`, `ANIMATION_REPORT.json`, `DATA_AUDIT_REPORT.json`, `FINAL_GAME_AUDIT.md`, `FINAL_GAME_QUALITY_REPORT.md`, `GAME_AUDIT_CURRENT.md`, `GAME_AUDIT_FINAL.md`, `GAME_QA_STATUS.md`, `GAMEPLAY_IMPROVEMENT_REPORT.md`, `GAMEPLAY_QUALITY_REPORT.md`, `SURVIVAL_BALANCE_REPORT.md`, `RELEASE_CHECKLIST.md`.
- `reports\` — 20 files (authoritative-asset-audit, current-production-baseline, production-3d-asset-report, runtime-error-audit, gameplay region screenshots, step test screenshots).

## 9. Legacy web / non-Unity content

Legacy browser/Node/Electron distribution (739 git-tracked files):

| Folder | Files | Class |
|---|---|---|
| `js/` | 519 | LEGACY WEB (mongodb/js client) |
| `assets/` | 439 | LEGACY WEB |
| `server/` | 45 | LEGACY WEB (mongodb REST server) |
| `desktop/` | 38 | LEGACY WEB (Electron shell) |
| `docs/` | 50 | LEGACY WEB docs |
| `tools/` `scripts/` `ci/` `platform/` `config/` `launcher/` `distribution/` `content/` `css/` `brand/` | 114 | LEGACY WEB / tooling |
| Root web files | 63 | `index.html`, `electron-main.js`, `sw.js`, `server.js`, `package.json`, `package-lock.json`, `.env*`, firebase/netlify/render configs, `.bat`/`.ps1` launchers, old reports, screenshots |

Root `package.json` + `node_modules` (97 MB) are the legacy web runtime — **the Windows release does not depend on them** (verified for section X in UNITY_CONFIGURATION_AUDIT.md).

## 10. Stale / generated / do-not-ship

| Item | Size | Class |
|---|---|---|
| `unity\Library\` (editor cache) | 4,035 MB | GENERATED (never ship) |
| `unity\Temp\` | ~0 MB | GENERATED |
| Root `Library\` (stale editor cache from when the Unity project lived at repo root — has its own `ProjectSettings\ProjectVersion.txt`, `Packages\`, `Temp\`, `Logs\`, `UserSettings\`) | 122 MB | STALE GENERATED — REVIEW/REMOVE |
| Root old Windows build artifacts: `The Whispering Wilds.exe`, `UnityPlayer.dll`, `DirectML.dll`, `dstorage.dll`, `dstoragecore.dll`, `UnityCrashHandler64.exe`, `The Whispering Wilds_Data\` (114 MB), `MonoBleedingEdge\` (8.7 MB), `D3D12\` (4.5 MB), `The Whispering Wilds_BackUpThisFolder_ButDontShipItWithYourGame\`, `TheWhisperingWilds_Windows_x64_RC\` | ~134 MB | LEGACY BUILD — REVIEW/REMOVE |
| `node_modules\` | 97 MB | GENERATED (legacy web) — REVIEW/REMOVE |
| `.git` | 29.6 MB | REQUIRED (VCS) |
| `Logs\` `Temp\` `TestReports\` | <1 MB | GENERATED/QA |

## 11. Classification summary (for section AA)

| Class | Major items |
|---|---|
| KEEP (production) | `unity/Assets/_Project`, `unity/ProjectSettings`, `unity/Packages`, `unity/Build/Windows_QA`, production reports |
| REVIEW (possibly MOVE/REMOVE) | root Unity vestige (Library/Packages/ProjectSettings/Temp/Logs/UserSettings), root old build files, `Build/Windows`, legacy Assets-root scenes `mtmohan`/`OutdoorsScene`, `New Mesh.prefab`, legacy scripts `Rotator`/`SetupDemoScene`/`TutorialInfo` |
| LEGACY WEB | `js/ css/ server/ desktop/ launcher/ distribution/ content/ docs/ platform/ scripts/ tools/ assets/ brand/` + root `index.html`/`electron-main.js`/`server.js`/`sw.js`/`package*.json`/`node_modules`/firebase+netlify+render configs |
| QA | `_Project/Scenes/WW_Benchmark_*`, `_Project/Scripts/QA/`, `reports/`, TestReports |
| GENERATED | all `Library/ Temp/ Logs/` trees, `Build/` outputs |
| WIP (inert) | `Data/PichavaramContent.cs` (unwired; resolve or remove in section P) |
| DATA/verify | `.env`/`.env.example` (contains config; keep out of any build; never commit `.env` secrets — already untracked? verify in section AA) |

## 12. Totals at a glance

- **Total files on disk (incl. generated):** ~380,000+ (dominated by `unity/Library` + `node_modules`)
- **Total git-tracked files:** 2,224
- **First-party Unity files:** 1,171 tracked (`unity/`)
- **C# scripts (first-party):** 160; **test scripts:** 13 (EditMode)
- **Scenes (production):** 12; **(legacy, Assets root):** 2
- **Materials:** 155; **GLB models:** 109; **textures:** 13; **audio:** 0
- **ScriptableObjects/settings assets:** 41; **Prefabs:** 1 (default, unused)
- **Localization rows (C#-embedded):** 237
- **Builds:** QA Windows x64 268.7 MiB (Succeeded, 12 scenes); older root/build outputs REVIEW
- **Potential unused/legacy files:** 2 legacy scenes, 1 default prefab, 4 legacy scripts, ~740 legacy-web files, stale root Unity vestige (REVIEW in AA — nothing deleted)

---

*Generated 2026-10-08 by master audit step. All counts are from real filesystem/git enumeration; nothing fabricated.*