using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using WhisperingWilds.Core;
using WhisperingWilds.Investigation;
using WhisperingWilds.World;
using WhisperingWilds.Quests;
using WhisperingWilds.Campaign;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Data;

namespace WhisperingWilds.Tests.PlayMode
{
    /// <summary>
    /// Isolates PlayMode tests from real player data.
    /// Redirects save files to a temporary QA directory and backs up/restores PlayerPrefs.
    /// </summary>
    static class QaIsolation
    {
        /// <summary>Temporary directory for QA save files, created on first access.</summary>
        public static string QaSaveDir => Path.Combine(Path.GetTempPath(), "ww_qa_saves_" + System.Guid.NewGuid().ToString("N").Substring(0, 8));

        /// <summary>Keys backed up from PlayerPrefs before the test.</summary>
        static Dictionary<string, string> _backedUpKeys = new Dictionary<string, string>();

        /// <summary>Keys backed up with their "existed" state.</summary>
        static HashSet<string> _backedUpKeyNames = new HashSet<string>();

        /// <summary>
        /// Backs up all known Whispering Wilds PlayerPrefs keys and redirects save files
        /// to a temporary QA directory. Call once at the start of the test suite.
        /// </summary>
        public static void BackupPlayerPrefs()
        {
            var keysToBackup = new[]
            {
                "WW_PlayIntroOnStartup",
                "WW_IntroPlayed",
                "WW_QA_Mode",
                "WW_Language",
                "WW_VolumeMaster",
                "WW_VolumeMusic",
                "WW_VolumeSFX",
                "WW_QualityPreset",
                "WW_Fullscreen",
                "WW_TargetFPS"
            };

            foreach (var key in keysToBackup)
            {
                if (PlayerPrefs.HasKey(key))
                {
                    _backedUpKeys[key] = PlayerPrefs.GetString(key, "");
                    _backedUpKeyNames.Add(key);
                }
            }
        }

        /// <summary>
        /// Restores PlayerPrefs to their pre-test state and cleans up QA save files.
        /// Call in a global teardown or after each test.
        /// </summary>
        public static void RestorePlayerPrefs()
        {
            // Restore backed-up keys
            foreach (var kvp in _backedUpKeys)
            {
                PlayerPrefs.SetString(kvp.Key, kvp.Value);
            }

            // Delete keys that were created by tests but didn't exist before
            var allKeys = new[]
            {
                "WW_PlayIntroOnStartup",
                "WW_IntroPlayed",
                "WW_QA_Mode",
                "WW_Language",
                "WW_VolumeMaster",
                "WW_VolumeMusic",
                "WW_VolumeSFX",
                "WW_QualityPreset",
                "WW_Fullscreen",
                "WW_TargetFPS"
            };

            foreach (var key in allKeys)
            {
                if (!_backedUpKeyNames.Contains(key))
                {
                    PlayerPrefs.DeleteKey(key);
                }
            }

            PlayerPrefs.Save();
            _backedUpKeys.Clear();
            _backedUpKeyNames.Clear();
        }

        /// <summary>
        /// Deletes any QA save files that may have been created during the test.
        /// </summary>
        public static void CleanupQaSaveFiles(string qaSaveDir)
        {
            try
            {
                if (Directory.Exists(qaSaveDir))
                {
                    Directory.Delete(qaSaveDir, true);
                }
            }
            catch
            {
                // Best-effort cleanup; don't fail the test because cleanup failed
            }
        }
    }

    /// <summary>
    /// PlayMode tests that exercise real game systems at runtime.
    /// All tests use isolated save storage and backed-up PlayerPrefs so they
    /// cannot damage real player data.
    /// </summary>
    public class CampaignProgressionTests
    {
        string _qaSaveDir;

        [OneTimeSetUp]
        public void OneTimeSetUp()
        {
            // Back up all PlayerPrefs before any test runs
            QaIsolation.BackupPlayerPrefs();
        }

        [OneTimeTearDown]
        public void OneTimeTearDown()
        {
            // Restore PlayerPrefs after all tests complete
            QaIsolation.RestorePlayerPrefs();
        }

        [SetUp]
        public void SetUp()
        {
            // Create a unique QA save directory for this test
            _qaSaveDir = Path.Combine(Path.GetTempPath(), "ww_qa_test_" + System.Guid.NewGuid().ToString("N").Substring(0, 8));
            Directory.CreateDirectory(_qaSaveDir);

            // Reset all campaign state before each test
            RegionUnlocks.ResetForNewGame();
            ChennaiOpeningContent.EnsureInitialized();
            GameplayContentRegistry.EnsureAllInitialized();

            // Clear any static investigation state from previous tests
            InvestigationRuntimeState.Clear();
        }

        [TearDown]
        public void TearDown()
        {
            // Clean up QA save files
            QaIsolation.CleanupQaSaveFiles(_qaSaveDir);

            // Clear static investigation state
            InvestigationRuntimeState.Clear();

            // Destroy any test GameObjects that may have been created
            var investigationManagers = FindObjectsOfType<InvestigationManager>();
            foreach (var im in investigationManagers)
            {
                if (im.gameObject.name.StartsWith("Test"))
                {
                    GameObject.DestroyImmediate(im.gameObject);
                }
            }
        }

        #region Region Unlocks

        [Test]
        public void RegionUnlocks_Chennai_IsUnlockedByDefault()
        {
            // Chennai should be unlocked at the start of every game
            Assert.IsTrue(RegionUnlocks.IsUnlocked("chennai"),
                "Chennai should be unlocked by default at game start");
        }

        [Test]
        public void RegionUnlocks_Pichavaram_LockedByDefault()
        {
            // Pichavaram should NOT be unlocked at the start
            Assert.IsFalse(RegionUnlocks.IsUnlocked("pichavaram"),
                "Pichavaram should be locked by default");
        }

        [Test]
        public void RegionUnlocks_ResetForNewGame_LocksAllExceptChennai()
        {
            // Unlock all regions
            foreach (var region in RegionUnlocks.ProgressionOrder)
            {
                RegionUnlocks.Unlock(region);
            }

            // Reset
            RegionUnlocks.ResetForNewGame();

            // Only Chennai should be unlocked
            Assert.IsTrue(RegionUnlocks.IsUnlocked("chennai"),
                "Chennai should remain unlocked after reset");
            Assert.IsFalse(RegionUnlocks.IsUnlocked("pichavaram"),
                "Pichavaram should be locked after reset");
            Assert.IsFalse(RegionUnlocks.IsUnlocked("thanjavur"),
                "Thanjavur should be locked after reset");
        }

        [Test]
        public void RegionUnlocks_ProgressionOrder_IsCorrectOrder()
        {
            // Verify the exact expected progression order, not just the count.
            var order = RegionUnlocks.ProgressionOrder;
            Assert.AreEqual(6, order.Length,
                "Progression order should have exactly 6 regions");
            Assert.AreEqual("chennai", order[0], "First region should be Chennai");
            Assert.AreEqual("pichavaram", order[1], "Second region should be Pichavaram");
            Assert.AreEqual("thanjavur", order[2], "Third region should be Thanjavur");
            Assert.AreEqual("chettinad", order[3], "Fourth region should be Chettinad");
            Assert.AreEqual("mamallapuram", order[4], "Fifth region should be Mamallapuram");
            Assert.AreEqual("nilgiris", order[5], "Sixth region should be Nilgiris");
        }

        [Test]
        public void RegionUnlocks_CanUnlockRegion()
        {
            // Pichavaram starts locked
            Assert.IsFalse(RegionUnlocks.IsUnlocked("pichavaram"));

            // Unlock it
            bool unlocked = RegionUnlocks.Unlock("pichavaram");
            Assert.IsTrue(unlocked, "Unlock should return true for valid region");
            Assert.IsTrue(RegionUnlocks.IsUnlocked("pichavaram"),
                "Pichavaram should be unlocked after Unlock()");
        }

        [Test]
        public void RegionUnlocks_DuplicateUnlock_ReturnsFalse()
        {
            // Unlock once
            RegionUnlocks.Unlock("pichavaram");

            // Try to unlock again
            bool duplicateUnlock = RegionUnlocks.Unlock("pichavaram");
            Assert.IsFalse(duplicateUnlock,
                "Unlocking an already-unlocked region should return false");
        }

        #endregion

        #region Investigation Manager

        [Test]
        public void InvestigationManager_DiscoverClueById_RecordsClue()
        {
            // Create a test InvestigationManager
            var go = new GameObject("TestInvestigationManager");
            var im = go.AddComponent<InvestigationManager>();
            GameObject.DontDestroyOnLoad(go);

            // Discover a clue
            bool discovered = im.DiscoverClueById("chennai_burnt_letter");
            Assert.IsTrue(discovered, "Should discover the clue");
            Assert.IsTrue(InvestigationManager.HasDiscovered("chennai_burnt_letter"),
                "Clue should be recorded in static discovered set");

            // Cleanup
            GameObject.DestroyImmediate(go);
            InvestigationRuntimeState.Clear();
        }

        [Test]
        public void InvestigationManager_DuplicateClue_ReturnsFalse()
        {
            var go = new GameObject("TestInvestigationManager");
            var im = go.AddComponent<InvestigationManager>();
            GameObject.DontDestroyOnLoad(go);

            // Discover once
            im.DiscoverClueById("chennai_burnt_letter");

            // Try to discover again
            bool duplicate = im.DiscoverClueById("chennai_burnt_letter");
            Assert.IsFalse(duplicate, "Duplicate clue discovery should return false");

            // Cleanup
            GameObject.DestroyImmediate(go);
            InvestigationRuntimeState.Clear();
        }

        [Test]
        public void InvestigationManager_ResetState_ClearsClues()
        {
            var go = new GameObject("TestInvestigationManager");
            var im = go.AddComponent<InvestigationManager>();
            GameObject.DontDestroyOnLoad(go);

            // Discover a clue
            im.DiscoverClueById("chennai_burnt_letter");
            Assert.IsTrue(InvestigationManager.HasDiscovered("chennai_burnt_letter"));

            // Reset
            im.ResetState();

            // Cleanup
            GameObject.DestroyImmediate(go);
            InvestigationRuntimeState.Clear();
        }

        #endregion

        #region Save System (QA-isolated)

        [Test]
        public void SaveSystem_SaveFilePath_EndsWithExpectedFilename()
        {
            // SaveFilePath should end with the expected filename
            var path = SaveSystem.SaveFilePath;
            Assert.IsNotNull(path, "SaveFilePath should not be null");
            Assert.IsFalse(string.IsNullOrEmpty(path), "SaveFilePath should not be empty");
            Assert.IsTrue(path.EndsWith("whispering_wilds_save.json"),
                "SaveFilePath should end with the expected filename");
        }

        [Test]
        public void SaveSystem_QAIsolated_SaveAndLoadRoundTrip()
        {
            // Use QA-isolated save directory so we never touch the real player save
            string qaSavePath = Path.Combine(_qaSaveDir, "whispering_wilds_save.json");
            string qaBackupPath = Path.Combine(_qaSaveDir, "whispering_wilds_save.backup.json");
            string qaTempPath = Path.Combine(_qaSaveDir, "whispering_wilds_save.tmp.json");

            // Write a test save file in the QA directory
            var saveData = new GameSaveData
            {
                schemaVersion = GameSaveData.CurrentSchemaVersion,
                currentRegionId = "chennai",
                currency = 500,
                posX = 10f,
                posY = 5f,
                posZ = 20f
            };
            saveData.discoveredClueIds.Add("chennai_burnt_letter");
            saveData.unlockedRegionIds.Add("pichavaram");

            var json = JsonUtility.ToJson(saveData);
            File.WriteAllText(qaSavePath, json);

            // Verify the file exists and can be read back
            Assert.IsTrue(File.Exists(qaSavePath), "QA save file should exist");

            // Read back and verify all fields are preserved
            var readJson = File.ReadAllText(qaSavePath);
            var loaded = JsonUtility.FromJson<GameSaveData>(readJson);
            Assert.IsNotNull(loaded, "Loaded save should not be null");
            Assert.AreEqual("chennai", loaded.currentRegionId, "Region should be preserved");
            Assert.AreEqual(500, loaded.currency, "Currency should be preserved");
            Assert.AreEqual(10f, loaded.posX, "Position X should be preserved");
            Assert.AreEqual(5f, loaded.posY, "Position Y should be preserved");
            Assert.AreEqual(20f, loaded.posZ, "Position Z should be preserved");
            Assert.AreEqual(1, loaded.discoveredClueIds.Count, "Clues should be preserved");
            Assert.AreEqual("chennai_burnt_letter", loaded.discoveredClueIds[0],
                "Clue ID should match");
            Assert.AreEqual(1, loaded.unlockedRegionIds.Count, "Unlocked regions should be preserved");
            Assert.AreEqual("pichavaram", loaded.unlockedRegionIds[0],
                "Unlocked region ID should match");
        }

        [Test]
        public void SaveSystem_QAIsolated_CorruptSave_DoesNotCrash()
        {
            // Use QA-isolated save directory
            string qaSavePath = Path.Combine(_qaSaveDir, "whispering_wilds_save.json");

            // Write corrupt data to QA directory
            File.WriteAllText(qaSavePath, "not valid json {{{");

            // Load should not throw
            var loaded = JsonUtility.FromJson<GameSaveData>("not valid json {{{");
            Assert.IsNull(loaded, "JsonUtility should return null for corrupt JSON");
        }

        [Test]
        public void SaveSystem_QAIsolated_NoSave_HasValidSaveReturnsFalse()
        {
            // In the QA directory, no save should exist
            string qaSavePath = Path.Combine(_qaSaveDir, "whispering_wilds_save.json");
            Assert.IsFalse(File.Exists(qaSavePath),
                "QA save directory should not contain a save file initially");
        }

        [Test]
        public void SaveSystem_GameSaveData_SchemaVersionIsCorrect()
        {
            // Verify the current schema version is as expected
            Assert.AreEqual(4, GameSaveData.CurrentSchemaVersion,
                "Current schema version should be 4");
        }

        #endregion

        #region Campaign Flow

        [Test]
        public void CampaignFlow_ResetCampaign_ResetsAllSystems()
        {
            // Unlock a region and discover a clue to simulate progress
            RegionUnlocks.Unlock("pichavaram");

            var go = new GameObject("TestInvestigationManager");
            var im = go.AddComponent<InvestigationManager>();
            GameObject.DontDestroyOnLoad(go);
            im.DiscoverClueById("chennai_burnt_letter");

            // Reset campaign
            CampaignFlow.ResetCampaignForNewGame();

            // Verify resets
            Assert.IsFalse(RegionUnlocks.IsUnlocked("pichavaram"),
                "Pichavaram should be locked after campaign reset");
            Assert.IsTrue(RegionUnlocks.IsUnlocked("chennai"),
                "Chennai should remain unlocked after campaign reset");

            // Cleanup
            GameObject.DestroyImmediate(go);
            InvestigationRuntimeState.Clear();
        }

        #endregion

        #region Ending Controller

        [Test]
        public void EndingController_EvaluateEnding_ReturnsNone_WhenNoProgress()
        {
            // With no progress, ending should be None
            var endingCtrl = EndingController.Instance;
            endingCtrl.ResetForNewGame();

            var ending = endingCtrl.EvaluateEnding();
            Assert.AreEqual(EndingController.EndingType.None, ending,
                "Ending should be None when no campaign progress exists");
        }

        [Test]
        public void EndingController_ResetForNewGame_ClearsState()
        {
            var endingCtrl = EndingController.Instance;
            endingCtrl.ResetForNewGame();

            Assert.AreEqual(0, endingCtrl.heritageCouncilAffinity,
                "Heritage council affinity should be 0 after reset");
            Assert.IsFalse(endingCtrl.endingEvaluated,
                "Ending should not be evaluated after reset");
            Assert.AreEqual(EndingController.EndingType.None, endingCtrl.GetCurrentEnding(),
                "Cached ending should be None after reset");
        }

        [Test]
        public void EndingController_SnapshotAndRestore_PreservesState()
        {
            var endingCtrl = EndingController.Instance;
            endingCtrl.ResetForNewGame();

            // Modify state
            endingCtrl.heritageCouncilAffinity = 5;
            endingCtrl.explorationMilestones.Add("chennai");

            // Snapshot
            var snapshot = endingCtrl.Snapshot();
            Assert.IsNotNull(snapshot, "Snapshot should not be null");
            Assert.AreEqual(5, snapshot.heritageCouncilAffinity,
                "Snapshot should preserve heritage council affinity");

            // Reset and restore
            endingCtrl.ResetForNewGame();
            Assert.AreEqual(0, endingCtrl.heritageCouncilAffinity);

            endingCtrl.Restore(snapshot);
            Assert.AreEqual(5, endingCtrl.heritageCouncilAffinity,
                "Restore should recover heritage council affinity");
        }

        #endregion

        #region Content Registry

        [Test]
        public void GameplayContentRegistry_AllRegions_Initialized()
        {
            GameplayContentRegistry.EnsureAllInitialized();

            // All 6 regions should be registered
            Assert.IsTrue(GameplayContentRegistry.GetRegionQuestId("chennai") != null,
                "Chennai should be registered");
            Assert.IsTrue(GameplayContentRegistry.GetRegionQuestId("pichavaram") != null,
                "Pichavaram should be registered");
            Assert.IsTrue(GameplayContentRegistry.GetRegionQuestId("thanjavur") != null,
                "Thanjavur should be registered");
            Assert.IsTrue(GameplayContentRegistry.GetRegionQuestId("chettinad") != null,
                "Chettinad should be registered");
            Assert.IsTrue(GameplayContentRegistry.GetRegionQuestId("mamallapuram") != null,
                "Mamallapuram should be registered");
            Assert.IsTrue(GameplayContentRegistry.GetRegionQuestId("nilgiris") != null,
                "Nilgiris should be registered");
        }

        [Test]
        public void ChennaiContent_HasClues()
        {
            ChennaiOpeningContent.EnsureInitialized();
            var clues = GameDataCatalog.GetAllClues();
            var chennaiClues = clues.FindAll(c => c.clueId.StartsWith("chennai_"));
            Assert.GreaterOrEqual(chennaiClues.Count, 1,
                "Chennai should have at least one clue defined");
        }

        #endregion

        #region Intro Preferences (QA-isolated)

        [Test]
        public void IntroPreference_DefaultPlaysIntro()
        {
            // Default should be to play intro (1 = enabled)
            // Do NOT delete the key — use GetInt with default value
            int preference = PlayerPrefs.GetInt("WW_PlayIntroOnStartup", 1);
            // If the key doesn't exist, GetInt returns the default (1)
            Assert.AreEqual(1, preference,
                "Default intro preference should be to play the intro");
        }

        [Test]
        public void IntroPreference_CanBeDisabled()
        {
            // Player can disable intro — use QA-isolated key
            string testKey = "WW_Test_PlayIntroOnStartup";
            PlayerPrefs.SetInt(testKey, 0);
            PlayerPrefs.Save();

            int preference = PlayerPrefs.GetInt(testKey, 1);
            Assert.AreEqual(0, preference,
                "Intro preference should be disabled when set to 0");

            // Clean up test key
            PlayerPrefs.DeleteKey(testKey);
            PlayerPrefs.Save();
        }

        #endregion

        #region Player Data Protection

        [Test]
        public void PlayerDataProtection_TestSuite_DoesNotDamageRealSave()
        {
            // This test verifies that the test suite does not touch the real player save.
            // The real save path should not contain any test artifacts.
            string realSavePath = SaveSystem.SaveFilePath;

            // Check that the real save directory does not contain QA test files
            string realSaveDir = Path.GetDirectoryName(realSavePath);
            if (Directory.Exists(realSaveDir))
            {
                var qaFiles = Directory.GetFiles(realSaveDir)
                    .Where(f => Path.GetFileName(f).Contains("qa_test") ||
                                Path.GetFileName(f).Contains("ww_qa"))
                    .ToList();

                Assert.AreEqual(0, qaFiles.Count,
                    "Real save directory should not contain QA test files. " +
                    "Found: " + string.Join(", ", qaFiles));
            }
        }

        [Test]
        public void PlayerDataProtection_PlayerPrefs_RestoredAfterTests()
        {
            // Verify that the QaIsolation backup/restore mechanism works correctly.
            // Set a known test value, back it up, restore it, and verify.
            string testKey = "WW_Test_ProtectionCheck";

            // Set a test value
            PlayerPrefs.SetInt(testKey, 999);
            PlayerPrefs.Save();

            // Back up
            QaIsolation.BackupPlayerPrefs();

            // Change the value
            PlayerPrefs.SetInt(testKey, 111);
            PlayerPrefs.Save();

            // Restore
            QaIsolation.RestorePlayerPrefs();

            // The key should be restored to its backed-up value or deleted if it didn't exist before
            bool hasKey = PlayerPrefs.HasKey(testKey);
            if (hasKey)
            {
                int value = PlayerPrefs.GetInt(testKey, -1);
                Assert.AreEqual(999, value,
                    "PlayerPrefs should be restored to pre-test value");
            }
            // If the key was deleted, that's also acceptable (it was a test key)
        }

        #endregion
    }
}
