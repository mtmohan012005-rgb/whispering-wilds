# The Whispering Wilds — Unity PlayMode Test Results

**Test Run Identifier:** `20261019-111500-4f73ddb`  
**Execution Timestamp:** 2026-10-19 16:46:27 – 16:47:20 IST  
**Execution Command:** `.\scripts\Run-QaTests.ps1 -TestMode PlayMode -ArtifactDir artifacts/qa/20261019-111500-4f73ddb`  
**Raw Test Results XML:** [test_results_PlayMode_20261019_164627.xml](file:///c:/Users/mohan/.gemini/antigravity-ide\scratch\whispering-wilds\artifacts\qa\20261019-111500-4f73ddb\test_results_PlayMode_20261019_164627.xml) (29,347 bytes)  
**Raw Unity Log:** [unity_PlayMode_20261019_164627.log](file:///c:/Users/mohan/.gemini/antigravity-ide\scratch\whispering-wilds\artifacts\qa\20261019-111500-4f73ddb\unity_PlayMode_20261019_164627.log) (221,915 bytes)  

---

## 1. Executive Summary: PlayMode

- **Total Test Cases:** **34**
- **Passed:** **34** (100%)
- **Failed:** **0**
- **Inconclusive / Ignored:** **0**
- **Skipped:** **0**
- **Engine Test Execution Time:** **0.523s** (Total Unity batch execution ~52.1s)
- **Status:** **`PASS_RUNTIME`**

---

## 2. Test Fixture & Assembly Provenance

- **Assembly Name:** `WhisperingWilds.Tests.PlayMode.dll`
- **Location:** `unity/Library/ScriptAssemblies/WhisperingWilds.Tests.PlayMode.dll`
- **Engine Version:** NUnit 3.5.0.0 via Unity Test Framework
- **Test Fixture Class:** `WhisperingWilds.Tests.PlayMode.CampaignProgressionTests`

---

## 3. Detailed Results by Domain Category

### 3.1 Campaign Flow & Narrative State Transitions (5 Tests)
| Test Case Name | Result | Duration | Output & Runtime Evidence |
|---|---|---|---|
| `CampaignFlow_ResetCampaign_ResetsAllSystems` | Passed | 0.110s | Logged: `[RegionUnlocks] Destination opened: chettinad`, `[Investigation] DISCOVERED CLUE: Murugan's Tea Ledger` |
| `ChennaiContent_HasClues` | Passed | 0.012s | Verified clue items loaded dynamically in playmode |
| `EndingController_EvaluateEnding_ReturnsFallbackC_WhenNoProgress` | Passed | 0.019s | Logged: `[Ending] ENDING C: The Shadowed Sanctuary (fallback)` |
| `EndingController_ResetForNewGame_ClearsState` | Passed | 0.013s | Verified state wiped to defaults |
| `EndingController_SnapshotAndRestore_PreservesState` | Passed | 0.013s | Verified exact epilogue state snapshot restored |

### 3.2 Dynamic Investigation & Clue Tracking (4 Tests)
| Test Case Name | Result | Duration | Output & Runtime Evidence |
|---|---|---|---|
| `GameplayContentRegistry_AllRegions_Initialized` | Passed | 0.011s | Verified all 7 region profiles registered in memory |
| `InvestigationManager_DiscoverClueById_RecordsClue` | Passed | 0.013s | Verified clue ID recorded in active quest log |
| `InvestigationManager_DuplicateClue_ReturnsFalse` | Passed | 0.014s | Idempotency guard against duplicate clues verified |
| `InvestigationManager_ResetState_ClearsClues` | Passed | 0.013s | Verified active clue array wiped on new game |

### 3.3 Player Data Protection & QA Isolation (9 Tests)
These tests rigorously confirm that automated testing does NOT corrupt or delete real player saves or user preferences.
| Test Case Name | Result | Duration | Output & Runtime Evidence |
|---|---|---|---|
| `IntroPreference_CanBeDisabled` | Passed | 0.012s | PlayerPrefs intro toggle verified |
| `IntroPreference_DefaultPlaysIntro` | Passed | 0.012s | Default startup preference verified |
| `PlayerDataProtection_PlayerPrefs_RestoredAfterTests` | Passed | 0.012s | PlayerPrefs backup snapshot restored |
| `PlayerDataProtection_TestSuite_DoesNotDamageRealSave` | Passed | 0.012s | Real user save file untouchability verified |
| `PlayerPrefsType_Float_PreservedAfterBackupRestore` | Passed | 0.012s | Float preference preservation verified |
| `PlayerPrefsType_GamePreferences_NotCorruptedByQA` | Passed | 0.012s | Audio and graphics options protected |
| `PlayerPrefsType_Int_PreservedAfterBackupRestore` | Passed | 0.012s | Int preference preservation verified |
| `PlayerPrefsType_NonExistentKey_DeletedAfterRestore` | Passed | 0.012s | Scratch keys cleaned up after test run |
| `PlayerPrefsType_String_PreservedAfterBackupRestore` | Passed | 0.012s | String preference preservation verified |
| `PlayerPrefsType_TearDown_RestoresAfterFailedTest` | Passed | 0.012s | Exception handling cleanup verified |
| `PlayerPrefsType_TestKey_CleanedUpAfterRestore` | Passed | 0.012s | Zero leakage into production keys |

### 3.4 Region Unlock Progression System (6 Tests)
| Test Case Name | Result | Duration | Output & Runtime Evidence |
|---|---|---|---|
| `RegionUnlocks_CanUnlockRegion` | Passed | 0.011s | Unlocking region gate transitions state |
| `RegionUnlocks_Chennai_IsUnlockedByDefault` | Passed | 0.012s | Starting hub is immediately accessible |
| `RegionUnlocks_DuplicateUnlock_ReturnsFalse` | Passed | 0.012s | Re-unlocking returns false |
| `RegionUnlocks_Pichavaram_UnlockedByDefault` | Passed | 0.012s | Coastal wetland accessible at start |
| `RegionUnlocks_ProgressionOrder_IsCorrectOrder` | Passed | 0.012s | Verified sequence: Chennai -> Pichavaram -> Thanjavur -> Chettinad -> Madurai -> Western Ghats |
| `RegionUnlocks_ResetForNewGame_ResetsToStartingRegions`| Passed | 0.012s | Reverts unlocked regions back to default 2 |

### 3.5 SaveSystem Runtime IO & Corruption Recovery (8 Tests)
| Test Case Name | Result | Duration | Output & Runtime Evidence |
|---|---|---|---|
| `SaveSystem_CaptureSnapshot_CreatesValidData` | Passed | 0.014s | Creates valid `GameSaveData` structure |
| `SaveSystem_CorruptPrimaryWithValidBackup_RecoverFromBackup` | Passed | 0.017s | Automatically detects corrupted primary JSON and recovers from `.bak` |
| `SaveSystem_CorruptSave_ReturnsNull` | Passed | 0.013s | Handles unrecoverable malformed files gracefully |
| `SaveSystem_GameSaveData_SchemaVersionIsCorrect` | Passed | 0.013s | Schema version matches `4` |
| `SaveSystem_LoadGame_NoSave_ReturnsNull` | Passed | 0.013s | Cold boot returns null without exceptions |
| `SaveSystem_NoSave_HasValidSaveReturnsFalse` | Passed | 0.012s | Query method returns false when file absent |
| `SaveSystem_SaveAndLoad_RoundTrip` | Passed | 0.018s | Serializes, writes to disk, re-reads, verifies parity |
| `SaveSystem_SaveFilePath_EndsWithExpectedFilename` | Passed | 0.013s | File path matches `whispering_wilds_save.json` |

---

## 4. PlayMode Conclusions

All 34 PlayMode tests executed directly in the Unity game loop and passed with 100% success. The state management, corruption recovery algorithms, region unlock gating, and player data protection are robust.
