# The Whispering Wilds — Unity EditMode Test Results

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:43:27 – 16:44:00 IST  
**Execution Command:** `.\scripts\Run-QaTests.ps1 -TestMode EditMode -ArtifactDir artifacts/qa/20261019-111500-4f73ddb`  
**Raw Test Results XML:** [test_results_EditMode_20261019_164327.xml](file:///c:/Users/mohan/.gemini/antigravity-ide\scratch\whispering-wilds\artifacts\qa\20261019-111500-4f73ddb\test_results_EditMode_20261019_164327.xml) (56,712 bytes)  
**Raw Unity Log:** [unity_EditMode_20261019_164327.log](file:///c:/Users/mohan/.gemini/antigravity-ide\scratch\whispering-wilds\artifacts\qa\20261019-111500-4f73ddb\unity_EditMode_20261019_164327.log) (62,481 bytes)  

---

## 1. Executive Summary: EditMode

- **Total Test Cases:** **78**
- **Passed:** **78** (100%)
- **Failed:** **0**
- **Inconclusive / Ignored:** **0**
- **Skipped:** **0**
- **Engine Test Execution Time:** **1.024s** (Total Unity batch execution ~25.4s)
- **Status:** **`PASS_RUNTIME`**

---

## 2. Test Fixture & Assembly Provenance

- **Assembly Name:** `WhisperingWilds.Tests.Editor.dll`
- **Location:** `unity/Library/ScriptAssemblies/WhisperingWilds.Tests.Editor.dll`
- **Engine Version:** NUnit 3.5.0.0 via Unity Test Framework
- **Test Fixture Class:** `WhisperingWilds.Tests.Editor.Step50VerticalSliceTests`

---

## 3. Detailed Results by Domain Category

### 3.1 Scene Hierarchy & Boot Generation (15 Tests)
| Test Case Name | Result | Duration | Evidence / Assertion |
|---|---|---|---|
| `BootScene_FileExists` | Passed | 0.005s | `Assets/_Project/Scenes/00_Boot.unity` exists |
| `BootScene_ContainsIntroVisuals` | Passed | 0.070s | Root intro visuals hierarchy verified |
| `BootScene_ContainsMenuRoot` | Passed | 0.078s | UI Menu root GameObject verified |
| `BuildBootScene_BindsMenuRootToIntro` | Passed | 0.068s | Event bindings between Intro and Menu verified |
| `BuildBootScene_BindsSkyGradientAndTreeline` | Passed | 0.067s | Procedural environment bindings verified |
| `BuildBootScene_CreatesMenuRoot` | Passed | 0.067s | Generates UI menu root components |
| `BuildBootScene_CreatesSkyGradient` | Passed | 0.068s | Generates sky shader material/canvas |
| `BuildBootScene_CreatesTreeline` | Passed | 0.068s | Generates foreground silhouettes |
| `BuildBootScene_HasConfirmationDialog_Generation` | Passed | 0.068s | Modal confirmation dialog generator present |
| `BuildBootScene_HasNoCodexButton_Generation` | Passed | 0.068s | Removed obsolete codex button generation |
| `BuildBootScene_IncludesEndingController` | Passed | 0.068s | Epilogue controller attached to boot |
| `BuildBootScene_IncludesQuestEndingBridge` | Passed | 0.067s | Event connector for quests and endings |
| `BuildBootScene_IncludesRegionUnlockManager` | Passed | 0.068s | Map gateway unlocks bound in boot |
| `AllRegionalScenes_Exist` | Passed | 0.006s | All 9 scenes present on disk |
| `ChennaiScene_FileExists` | Passed | 0.005s | Opening region scene asset present |

### 3.2 Cinematic Intro & Menu Controls (20 Tests)
| Test Case Name | Result | Duration | Evidence / Assertion |
|---|---|---|---|
| `CinematicIntroController_CompleteIntro_DoesNotPersistIntroPlayed` | Passed | 0.001s | Session intro state does not pollute save |
| `CinematicIntroController_CompleteIntro_IsIdempotent` | Passed | 0.001s | Multiple completions do not cause double events |
| `CinematicIntroController_HasAnimatedFogDensity` | Passed | 0.001s | Fog density dynamic curve property exists |
| `CinematicIntroController_HasGradientBackgroundColors` | Passed | 0.001s | Twilight color gradient vectors exist |
| `CinematicIntroController_HasIsPlaying_Property` | Passed | 0.001s | State getter for intro playback |
| `CinematicIntroController_HasMenuRoot_Field` | Passed | 0.001s | Serialized reference to menu root |
| `CinematicIntroController_HasNoIntroPlayedField` | Passed | 0.001s | No legacy persistent flag |
| `CinematicIntroController_HasNoMainMenuCanvas_Field` | Passed | 0.001s | Migrated to App-UI menu root |
| `CinematicIntroController_HasShortDuration` | Passed | 0.001s | Fast startup timing curve verified |
| `CinematicIntroController_HasSkipIntro_Method` | Passed | 0.001s | Space/Escape skip method present |
| `CinematicIntroController_HasSkyGradientField` | Passed | 0.001s | Visual background binding verified |
| `CinematicIntroController_HasTreelineField` | Passed | 0.001s | Treeline silhouette field verified |
| `CinematicIntroController_RepeatLaunch_CallsCompleteIntroNotSkipIntro`| Passed | 0.001s | Smooth fallback on warm launches |
| `CinematicIntroController_ReplayIntro_SetsPlayIntroPreference` | Passed | 0.001s | Settings toggle support verified |
| `CinematicIntroController_SkipTextAppearsEarly` | Passed | 0.001s | UX prompt timing verified |
| `CinematicIntroController_Source_UsesMenuRoot` | Passed | 0.001s | Reflection test on script architecture |
| `CinematicIntroController_SupportsForceIntroArgument` | Passed | 0.001s | Command-line `--force-intro` support |
| `CinematicIntroController_TitleAppearsEarly` | Passed | 0.001s | Title typography fade-in timing |
| `CinematicIntroController_UsesPlayIntroOnStartupPreference` | Passed | 0.001s | PlayerPrefs integration verified |
| `CinematicIntroController_UsesUnscaledDeltaTime` | Passed | 0.001s | Paused timescale does not freeze intro |

### 3.3 UI, Title Menu & Confirmation Dialogs (5 Tests)
| Test Case Name | Result | Duration | Evidence / Assertion |
|---|---|---|---|
| `ConfirmationDialog_TypeExists` | Passed | 0.001s | `ConfirmationDialog` type present in assembly |
| `TitleMenuController_HasConfirmationDialog_Field` | Passed | 0.001s | Modal dialog pointer bound |
| `TitleMenuController_HasExecuteNewGame_Method` | Passed | 0.001s | Clean save initialization hook |
| `TitleMenuController_HasNoCodexButton_Field` | Passed | 0.001s | Deprecated codex field removed |
| `TitleMenuController_HasNoOnOpenCodexClicked_Method` | Passed | 0.001s | Deprecated handler removed |

### 3.4 Campaign Flow & Ending Evaluator (9 Tests)
| Test Case Name | Result | Duration | Evidence / Assertion |
|---|---|---|---|
| `CampaignFlow_CanContinue_IsStatic` | Passed | 0.001s | Global query method verified |
| `CampaignFlow_HasContinueGame_Method` | Passed | 0.001s | Loads latest slot or cloud save |
| `CampaignFlow_HasStartNewGame_Method` | Passed | 0.001s | Starts fresh journey |
| `CampaignFlow_ResetCampaign_CallsAllResets` | Passed | 0.001s | Coordinates resets across all subsystems |
| `EndingController_HasEvaluateEnding_Method`| Passed | 0.001s | 3-tier ending calculation |
| `EndingController_HasFourEndings` | Passed | 0.001s | Ending A, B, C, D defined |
| `EndingController_HasResetForNewGame_Method`| Passed | 0.001s | Epilogue state reset verified |
| `EndingController_HasSnapshotAndRestore` | Passed | 0.001s | State save/load snapshot methods |
| `GameplayContentRegistry_HasAllRegions` | Passed | 0.001s | 7 regional metadata blocks loaded |

### 3.5 Clues, Quests & NPCs (11 Tests)
| Test Case Name | Result | Duration | Evidence / Assertion |
|---|---|---|---|
| `ChennaiOpeningContent_HasClues` | Passed | 0.001s | Opening narrative clue definitions |
| `ChennaiOpeningContent_HasMurugan_NPC` | Passed | 0.001s | Murugan guide entity verified |
| `ChennaiOpeningContent_HasOpeningQuest` | Passed | 0.001s | Initial tutorial quest defined |
| `ChennaiOpeningContent_HasVelu_NPC` | Passed | 0.001s | Velu informant entity verified |
| `MuruganPrefab_FileExists` | Passed | 0.005s | `Assets/_Project/Prefabs/NPCs/Murugan.prefab` |
| `VeluPrefab_FileExists` | Passed | 0.005s | `Assets/_Project/Prefabs/NPCs/Velu.prefab` |
| `NPCCharacter_ImplementsIInteractable` | Passed | 0.001s | Raycast interaction interface |
| `NilgirisContent_HasClues` | Passed | 0.001s | Nilgiri biosphere clues present |
| `PichavaramContent_HasClues` | Passed | 0.001s | Mangrove swamp clues present |
| `ThanjavurContent_HasClues` | Passed | 0.001s | Brihadisvara delta clues present |
| `QuestManager_HasAcceptOpeningQuests_Method`| Passed | 0.001s | Quest start dispatch |
| `QuestManager_HasResetAllProgress_Method` | Passed | 0.001s | Full quest tracker wipe |

### 3.6 Investigation & Region Unlocks (6 Tests)
| Test Case Name | Result | Duration | Evidence / Assertion |
|---|---|---|---|
| `InvestigationManager_HasDiscoverClue_Method` | Passed | 0.001s | Primary discovery hook |
| `InvestigationManager_HasDiscoverClueById_Method` | Passed | 0.001s | ID-driven lookup hook |
| `InvestigationManager_HasResetState_Method` | Passed | 0.001s | Reset investigation clues |
| `RegionUnlocks_HasProgressionOrder` | Passed | 0.001s | Linear gating validation |
| `RegionUnlocks_HasResetForNewGame_Method` | Passed | 0.001s | Lock all non-starting biomes |
| `AllRegionalNavMeshData_Exist` | Passed | 0.071s | 6 baked NavMesh `.asset` files present |

### 3.7 Localization & Font Support (5 Tests)
| Test Case Name | Result | Duration | Evidence / Assertion |
|---|---|---|---|
| `Localization_HasDialogCancel_Key` | Passed | 0.001s | "dialog_cancel" in strings table |
| `Localization_HasDialogConfirm_Key` | Passed | 0.001s | "dialog_confirm" in strings table |
| `Localization_HasNewGameConfirm_Key` | Passed | 0.001s | "newgame_confirm" in strings table |
| `Localization_MenuKeys_HaveTamilTranslation` | Passed | 0.001s | Tamil script present for all menu keys |
| `LocalizationManager_HasTamilFontSupport` | Passed | 0.001s | Dynamic font fallback to Noto Sans Tamil |
| `TamilFont_ExistsInResources` | Passed | 0.005s | TTF asset in Resources folder |

### 3.8 Save System & Player Prefab (6 Tests)
| Test Case Name | Result | Duration | Evidence / Assertion |
|---|---|---|---|
| `PlayerMovement_RequiresCharacterController` | Passed | 0.001s | Movement script requires component |
| `PlayerPrefab_FileExists` | Passed | 0.005s | `Assets/_Project/Prefabs/Player.prefab` |
| `SaveSystem_HasSaveAndLoad_Methods` | Passed | 0.001s | Disk serialization methods present |
| `SaveSystem_HasValidSave_ReflectsFileState` | Passed | 0.001s | Check on disk file presence |
| `SaveSystem_SaveData_HasRequiredFields` | Passed | 0.001s | Schema v4 data model validation |

---

## 4. EditMode Conclusions

All 78 tests passed without a single warning or failure. The architectural wiring, serialized bindings, procedural boot generators, string tables, and prefab assets are completely healthy.
