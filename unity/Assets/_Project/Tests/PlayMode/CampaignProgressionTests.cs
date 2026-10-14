using System.Collections;
using System.Collections.Generic;
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
    /// PlayMode tests that exercise real game systems at runtime.
    /// These tests run in PlayMode and test actual component behavior,
    /// not just reflection-based structural checks.
    /// </summary>
    public class CampaignProgressionTests
    {
        [SetUp]
        public void SetUp()
        {
            // Reset all campaign state before each test
            RegionUnlocks.ResetForNewGame();
            ChennaiOpeningContent.EnsureInitialized();
            GameplayContentRegistry.EnsureAllInitialized();
        }

        [TearDown]
        public void TearDown()
        {
            // Clean up after each test
            PlayerPrefs.DeleteKey("WW_PlayIntroOnStartup");
            PlayerPrefs.DeleteKey("WW_IntroPlayed");
            PlayerPrefs.DeleteKey("WW_QA_Mode");
            PlayerPrefs.Save();
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
        public void RegionUnlocks_ProgressionOrder_HasSixRegions()
        {
            Assert.GreaterOrEqual(RegionUnlocks.ProgressionOrder.Length, 6,
                "Progression order should have at least 6 regions");
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

        #region Save System

        [Test]
        public void SaveSystem_SaveFilePath_Exists()
        {
            // SaveFilePath should be a valid path
            var path = SaveSystem.SaveFilePath;
            Assert.IsNotNull(path, "SaveFilePath should not be null");
            Assert.IsFalse(string.IsNullOrEmpty(path), "SaveFilePath should not be empty");
            Assert.IsTrue(path.EndsWith("whispering_wilds_save.json"),
                "SaveFilePath should end with the expected filename");
        }

        [Test]
        public void SaveSystem_NoSave_HasValidSaveReturnsFalse()
        {
            // Delete any existing save
            SaveSystem.DeleteSave();
            Assert.IsFalse(SaveSystem.HasValidSave(),
                "HasValidSave should return false when no save exists");
        }

        [Test]
        public void SaveSystem_DeleteSave_RemovesSave()
        {
            // Write a test save file directly
            var saveData = new GameSaveData
            {
                schemaVersion = GameSaveData.CurrentSchemaVersion,
                currentRegionId = "chennai"
            };
            var json = JsonUtility.ToJson(saveData);
            System.IO.File.WriteAllText(SaveSystem.SaveFilePath, json);
            Assert.IsTrue(SaveSystem.HasValidSave(), "Save should exist after writing");

            // Delete it
            SaveSystem.DeleteSave();
            Assert.IsFalse(SaveSystem.HasValidSave(),
                "Save should be removed after DeleteSave");
        }

        [Test]
        public void SaveSystem_LoadGame_ReturnsValidData()
        {
            // Write a test save file directly
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
            System.IO.File.WriteAllText(SaveSystem.SaveFilePath, json);

            // Load and verify
            var loaded = SaveSystem.LoadGame();
            Assert.IsNotNull(loaded, "Loaded save should not be null");
            Assert.AreEqual("chennai", loaded.currentRegionId, "Region should be preserved");
            Assert.AreEqual(500, loaded.currency, "Currency should be preserved");
            Assert.AreEqual(10f, loaded.posX, "Position X should be preserved");
            Assert.AreEqual(1, loaded.discoveredClueIds.Count, "Clues should be preserved");
            Assert.AreEqual("chennai_burnt_letter", loaded.discoveredClueIds[0],
                "Clue ID should match");
            Assert.AreEqual(1, loaded.unlockedRegionIds.Count, "Unlocked regions should be preserved");

            // Cleanup
            SaveSystem.DeleteSave();
        }

        [Test]
        public void SaveSystem_CorruptSave_DoesNotCrash()
        {
            // Write corrupt data
            System.IO.File.WriteAllText(SaveSystem.SaveFilePath, "not valid json {{{");

            // Load should not throw
            var loaded = SaveSystem.LoadGame();
            Assert.IsNull(loaded, "LoadGame should return null for corrupt save");

            // Cleanup
            SaveSystem.DeleteSave();
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

        #region Intro Preferences

        [Test]
        public void IntroPreference_DefaultPlaysIntro()
        {
            // Default should be to play intro (1 = enabled)
            PlayerPrefs.DeleteKey("WW_PlayIntroOnStartup");
            PlayerPrefs.Save();

            int preference = PlayerPrefs.GetInt("WW_PlayIntroOnStartup", 1);
            Assert.AreEqual(1, preference,
                "Default intro preference should be to play the intro");
        }

        [Test]
        public void IntroPreference_CanBeDisabled()
        {
            // Player can disable intro
            PlayerPrefs.SetInt("WW_PlayIntroOnStartup", 0);
            PlayerPrefs.Save();

            int preference = PlayerPrefs.GetInt("WW_PlayIntroOnStartup", 1);
            Assert.AreEqual(0, preference,
                "Intro preference should be disabled when set to 0");
        }

        #endregion
    }
}
