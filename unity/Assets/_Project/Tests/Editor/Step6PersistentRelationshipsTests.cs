using System;
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Campaign;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Localization;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Tests.Editor
{
    /// <summary>
    /// Step 6.1 Verification Suite:
    /// Validates Persistent NPC Relationships, Trust/Reputation Bounds (0-100),
    /// Faction Affinity Bounds (-100 to 100), Durable NPC Memory across Scenes,
    /// One-Time Choice Consequence Execution, Schema v5 Persistence & Migration,
    /// and Bilingual Localization of Relationship Tiers.
    /// </summary>
    public class Step6PersistentRelationshipsTests
    {
        private GameObject testEndingGo;
        private EndingController endingController;

        [SetUp]
        public void SetUp()
        {
            ChennaiOpeningContent.EnsureInitialized();
            NPCMemoryStore.Clear();

            testEndingGo = new GameObject("TestEndingController", typeof(EndingController));
            endingController = testEndingGo.GetComponent<EndingController>();
            endingController.ResetForNewGame();
        }

        [TearDown]
        public void TearDown()
        {
            NPCMemoryStore.Clear();
            if (testEndingGo != null)
            {
                UnityEngine.Object.DestroyImmediate(testEndingGo);
            }
        }

        [Test]
        public void TrustScore_Clamping_EnforcesZeroToHundredRange()
        {
            // Initial trust should default to 0
            Assert.AreEqual(0, endingController.GetTrust("murugan"));

            // Positive adjustments
            endingController.AdjustTrust("murugan", 25);
            Assert.AreEqual(25, endingController.GetTrust("murugan"));

            // Exceeding maximum upper bound (100)
            endingController.AdjustTrust("murugan", 150);
            Assert.AreEqual(100, endingController.GetTrust("murugan"), "Trust score must be clamped to 100 maximum.");

            // Exceeding lower bound (0)
            endingController.AdjustTrust("murugan", -200);
            Assert.AreEqual(0, endingController.GetTrust("murugan"), "Trust score must be clamped to 0 minimum.");

            // Direct setter clamping
            endingController.SetTrust("velu", 150);
            Assert.AreEqual(100, endingController.GetTrust("velu"));

            endingController.SetTrust("velu", -50);
            Assert.AreEqual(0, endingController.GetTrust("velu"));
        }

        [Test]
        public void FactionAffinity_Clamping_EnforcesMinusHundredToPlusHundred()
        {
            Assert.AreEqual(0, endingController.GetAffinity("heritage"));

            // Adjust within range
            endingController.AdjustAffinity("heritage", 50);
            Assert.AreEqual(50, endingController.GetAffinity("heritage"));

            // Upper bound clamp
            endingController.AdjustAffinity("heritage", 100);
            Assert.AreEqual(100, endingController.GetAffinity("heritage"));

            // Lower bound clamp
            endingController.AdjustAffinity("heritage", -250);
            Assert.AreEqual(-100, endingController.GetAffinity("heritage"));

            // Direct setter
            endingController.SetAffinity("archaeological", 75);
            Assert.AreEqual(75, endingController.GetAffinity("archaeological"));

            endingController.SetAffinity("agrarian", -80);
            Assert.AreEqual(-80, endingController.GetAffinity("agrarian"));
        }

        [Test]
        public void RelationshipTier_CalculatesCorrectLevels()
        {
            // Stranger: 0-19
            Assert.AreEqual(EndingController.NPCRelationshipTier.Stranger, EndingController.GetRelationshipTier(0));
            Assert.AreEqual(EndingController.NPCRelationshipTier.Stranger, EndingController.GetRelationshipTier(10));
            Assert.AreEqual(EndingController.NPCRelationshipTier.Stranger, EndingController.GetRelationshipTier(19));

            // Acquaintance: 20-39
            Assert.AreEqual(EndingController.NPCRelationshipTier.Acquaintance, EndingController.GetRelationshipTier(20));
            Assert.AreEqual(EndingController.NPCRelationshipTier.Acquaintance, EndingController.GetRelationshipTier(30));
            Assert.AreEqual(EndingController.NPCRelationshipTier.Acquaintance, EndingController.GetRelationshipTier(39));

            // Familiar: 40-59
            Assert.AreEqual(EndingController.NPCRelationshipTier.Familiar, EndingController.GetRelationshipTier(40));
            Assert.AreEqual(EndingController.NPCRelationshipTier.Familiar, EndingController.GetRelationshipTier(50));
            Assert.AreEqual(EndingController.NPCRelationshipTier.Familiar, EndingController.GetRelationshipTier(59));

            // Trusted: 60-79
            Assert.AreEqual(EndingController.NPCRelationshipTier.Trusted, EndingController.GetRelationshipTier(60));
            Assert.AreEqual(EndingController.NPCRelationshipTier.Trusted, EndingController.GetRelationshipTier(70));
            Assert.AreEqual(EndingController.NPCRelationshipTier.Trusted, EndingController.GetRelationshipTier(79));

            // Close Ally: 80-100
            Assert.AreEqual(EndingController.NPCRelationshipTier.CloseAlly, EndingController.GetRelationshipTier(80));
            Assert.AreEqual(EndingController.NPCRelationshipTier.CloseAlly, EndingController.GetRelationshipTier(95));
            Assert.AreEqual(EndingController.NPCRelationshipTier.CloseAlly, EndingController.GetRelationshipTier(100));
        }

        [Test]
        public void NPCMemoryStore_RecordsAndQueriesMemories()
        {
            Assert.IsFalse(NPCMemoryStore.HasMemory("murugan", "asked_about_ledger"));

            bool firstRecord = NPCMemoryStore.RecordMemory("murugan", "asked_about_ledger");
            Assert.IsTrue(firstRecord, "First recording of memory must return true");
            Assert.IsTrue(NPCMemoryStore.HasMemory("murugan", "asked_about_ledger"));

            // Duplicate recording returns false
            bool duplicateRecord = NPCMemoryStore.RecordMemory("murugan", "asked_about_ledger");
            Assert.IsFalse(duplicateRecord, "Duplicate recording of same memory must return false");

            // Case-insensitivity check
            Assert.IsTrue(NPCMemoryStore.HasMemory("MURUGAN", "asked_about_ledger"));

            // Unrecorded flag on same NPC
            Assert.IsFalse(NPCMemoryStore.HasMemory("murugan", "unknown_flag"));

            // Different NPC does not inherit memory
            Assert.IsFalse(NPCMemoryStore.HasMemory("velu", "asked_about_ledger"));
        }

        [Test]
        public void DialogueChoice_OneTimeConsequence_GuardsAgainstExploits()
        {
            string choiceId = "choice_murugan_ask_ledger";
            Assert.IsFalse(NPCMemoryStore.IsChoiceApplied(choiceId));

            // First application
            bool recorded = NPCMemoryStore.RecordChoiceApplied(choiceId);
            Assert.IsTrue(recorded, "First record of choice application must succeed");
            Assert.IsTrue(NPCMemoryStore.IsChoiceApplied(choiceId));

            // Repeated application is blocked
            bool duplicate = NPCMemoryStore.RecordChoiceApplied(choiceId);
            Assert.IsFalse(duplicate, "Re-recording already applied choice must return false");
        }

        [Test]
        public void SaveSystem_SchemaV5_SerializationRoundTrip()
        {
            var save = new GameSaveData();
            Assert.AreEqual(5, GameSaveData.CurrentSchemaVersion);

            save.schemaVersion = 5;
            save.npcTrustScores.Add(new SavedNPCTrust { npcId = "murugan", trust = 45 });
            save.npcTrustScores.Add(new SavedNPCTrust { npcId = "velu", trust = 70 });

            var memMurugan = new SavedNPCMemory { npcId = "murugan" };
            memMurugan.flags.Add("asked_about_ledger");
            memMurugan.flags.Add("sympathized_with_murugan");
            save.npcMemories.Add(memMurugan);

            save.appliedChoiceIds.Add("choice_murugan_ask_ledger");
            save.appliedChoiceIds.Add("choice_velu_investigate_records");

            save.factionAffinities.Add(new SavedFactionAffinity { factionId = "heritage", affinity = 25 });
            save.factionAffinities.Add(new SavedFactionAffinity { factionId = "agrarian", affinity = 15 });

            string json = JsonUtility.ToJson(save, true);
            Assert.IsTrue(json.Contains("\"schemaVersion\": 5") || json.Contains("\"schemaVersion\":5"), "JSON must contain schemaVersion 5");
            Assert.IsTrue(json.Contains("murugan"), "JSON must serialize murugan trust");
            Assert.IsTrue(json.Contains("asked_about_ledger"), "JSON must serialize memory flag");

            var restored = JsonUtility.FromJson<GameSaveData>(json);
            Assert.IsNotNull(restored);
            Assert.AreEqual(5, restored.schemaVersion);
            Assert.AreEqual(2, restored.npcTrustScores.Count);
            Assert.AreEqual("murugan", restored.npcTrustScores[0].npcId);
            Assert.AreEqual(45, restored.npcTrustScores[0].trust);
            Assert.AreEqual("velu", restored.npcTrustScores[1].npcId);
            Assert.AreEqual(70, restored.npcTrustScores[1].trust);

            Assert.AreEqual(1, restored.npcMemories.Count);
            Assert.AreEqual("murugan", restored.npcMemories[0].npcId);
            Assert.AreEqual(2, restored.npcMemories[0].flags.Count);

            Assert.AreEqual(2, restored.appliedChoiceIds.Count);
            Assert.Contains("choice_murugan_ask_ledger", restored.appliedChoiceIds);

            Assert.AreEqual(2, restored.factionAffinities.Count);
        }

        [Test]
        public void SaveMigrator_MigratesV4ToV5_WithoutDataLoss()
        {
            var v4Save = new GameSaveData
            {
                schemaVersion = 4,
                currentRegionId = "chennai",
                currency = 150,
                tutorialCompleted = true,
                unlockedRegionIds = new List<string> { "chennai", "pichavaram" },
                solvedPuzzleIds = new List<string> { "puzzle_water_gate" },
                recordedDiscoveryIds = new List<string> { "disc_ancient_tally" }
            };

            bool migrated = SaveMigrator.TryMigrate(v4Save, out string error);
            Assert.IsTrue(migrated, "Migration from v4 to v5 must succeed");
            Assert.IsNull(error);
            Assert.AreEqual(5, v4Save.schemaVersion);

            // Pre-existing v4 state must be completely preserved
            Assert.AreEqual("chennai", v4Save.currentRegionId);
            Assert.AreEqual(150, v4Save.currency);
            Assert.IsTrue(v4Save.tutorialCompleted);
            Assert.AreEqual(2, v4Save.unlockedRegionIds.Count);
            Assert.Contains("chennai", v4Save.unlockedRegionIds);
            Assert.AreEqual(1, v4Save.solvedPuzzleIds.Count);

            // New v5 fields must be non-null and cleanly initialized
            Assert.IsNotNull(v4Save.npcTrustScores);
            Assert.AreEqual(0, v4Save.npcTrustScores.Count);
            Assert.IsNotNull(v4Save.npcMemories);
            Assert.AreEqual(0, v4Save.npcMemories.Count);
            Assert.IsNotNull(v4Save.appliedChoiceIds);
            Assert.AreEqual(0, v4Save.appliedChoiceIds.Count);
            Assert.IsNotNull(v4Save.factionAffinities);
            Assert.AreEqual(0, v4Save.factionAffinities.Count);
        }

        [Test]
        public void CampaignFlow_ResetCampaign_ClearsMemoriesAndTrust()
        {
            // Seed state
            endingController.SetTrust("murugan", 50);
            endingController.SetAffinity("heritage", 30);
            NPCMemoryStore.RecordMemory("murugan", "asked_about_ledger");
            NPCMemoryStore.RecordChoiceApplied("choice_murugan_ask_ledger");

            Assert.AreEqual(50, endingController.GetTrust("murugan"));
            Assert.IsTrue(NPCMemoryStore.HasMemory("murugan", "asked_about_ledger"));
            Assert.IsTrue(NPCMemoryStore.IsChoiceApplied("choice_murugan_ask_ledger"));

            // Perform New Game reset
            CampaignFlow.ResetCampaignForNewGame();

            // Verify clean slate
            Assert.AreEqual(0, endingController.GetTrust("murugan"));
            Assert.AreEqual(0, endingController.GetAffinity("heritage"));
            Assert.IsFalse(NPCMemoryStore.HasMemory("murugan", "asked_about_ledger"));
            Assert.IsFalse(NPCMemoryStore.IsChoiceApplied("choice_murugan_ask_ledger"));
        }

        [Test]
        public void Localization_RelationshipTiers_ResolveBilingual()
        {
            var loc = LocalizationDatabase.AllEntries;
            var dict = new Dictionary<string, (string en, string ta)>();
            foreach (var entry in loc)
            {
                dict[entry.key] = (entry.english, entry.tamil);
            }

            string[] keys = {
                "relationship.stranger",
                "relationship.acquaintance",
                "relationship.familiar",
                "relationship.trusted",
                "relationship.close_ally",
                "npc.murugan",
                "npc.velu"
            };

            foreach (var key in keys)
            {
                Assert.IsTrue(dict.ContainsKey(key), $"Localization database must contain key '{key}'");
                var pair = dict[key];
                Assert.IsFalse(string.IsNullOrWhiteSpace(pair.en), $"Key '{key}' must have valid English text");
                Assert.IsFalse(string.IsNullOrWhiteSpace(pair.ta), $"Key '{key}' must have valid Tamil text");
                Assert.AreNotEqual(pair.en, pair.ta, $"Tamil translation for '{key}' must not be identical to English");
            }
        }

        [Test]
        public void ChennaiOpeningContent_AuthoredChoices_ContainConsequences()
        {
            var muruganDialogue = ChennaiOpeningContent.BuildDialogueFor("murugan");
            Assert.IsNotNull(muruganDialogue);
            Assert.Greater(muruganDialogue.Count, 0);

            bool foundConsequentialMuruganChoice = false;
            foreach (var node in muruganDialogue)
            {
                if (node.choices == null) continue;
                foreach (var choice in node.choices)
                {
                    if (choice.hasConsequence)
                    {
                        foundConsequentialMuruganChoice = true;
                        Assert.IsFalse(string.IsNullOrEmpty(choice.choiceId), "Consequential choice must have non-empty choiceId");
                        Assert.IsTrue(choice.trustDelta != 0 || !string.IsNullOrEmpty(choice.memoryFlag) || choice.factionDelta != 0);
                    }
                }
            }
            Assert.IsTrue(foundConsequentialMuruganChoice, "Murugan dialogue must include at least one consequential choice.");

            var veluDialogue = ChennaiOpeningContent.BuildDialogueFor("velu");
            Assert.IsNotNull(veluDialogue);
            Assert.Greater(veluDialogue.Count, 0);

            bool foundConsequentialVeluChoice = false;
            foreach (var node in veluDialogue)
            {
                if (node.choices == null) continue;
                foreach (var choice in node.choices)
                {
                    if (choice.hasConsequence)
                    {
                        foundConsequentialVeluChoice = true;
                        Assert.IsFalse(string.IsNullOrEmpty(choice.choiceId), "Consequential choice must have non-empty choiceId");
                    }
                }
            }
            Assert.IsTrue(foundConsequentialVeluChoice, "Velu dialogue must include at least one consequential choice.");
        }

        [Test]
        public void EndingController_RestoreRelationships_ReplacesExistingState_WithoutLeakage()
        {
            // Set up pre-existing state in memory
            endingController.SetTrust("murugan", 65);
            endingController.SetTrust("velu", 45);
            endingController.SetAffinity("heritage", 50);
            endingController.SetAffinity("agrarian", -30);

            // Set up unrelated ending state
            endingController.SetSanctuaryVerdict("LivingSanctuary");
            endingController.RecordMilestone("Epigraphist");

            Assert.AreEqual(65, endingController.GetTrust("murugan"));
            Assert.AreEqual(45, endingController.GetTrust("velu"));
            Assert.AreEqual(50, endingController.GetAffinity("heritage"));
            Assert.AreEqual(-30, endingController.GetAffinity("agrarian"));
            Assert.AreEqual("LivingSanctuary", endingController.GetSanctuaryVerdict());
            Assert.AreEqual(1, endingController.MilestoneCount);

            // Restore empty relationships (simulating loading a legacy v4 save or a save with no prior records)
            endingController.RestoreRelationships(new List<SavedNPCTrust>(), new List<SavedFactionAffinity>());

            // Trust and affinities must be reset to baseline 0, with NO state leaked from before
            Assert.AreEqual(0, endingController.GetTrust("murugan"), "Murugan trust must reset to 0 default on restore.");
            Assert.AreEqual(0, endingController.GetTrust("velu"), "Velu trust must reset to 0 default on restore.");
            Assert.AreEqual(0, endingController.GetAffinity("heritage"), "Heritage affinity must reset to 0 default on restore.");
            Assert.AreEqual(0, endingController.GetAffinity("agrarian"), "Agrarian affinity must reset to 0 default on restore.");

            // Unrelated ending state must be preserved
            Assert.AreEqual("LivingSanctuary", endingController.GetSanctuaryVerdict(), "Sanctuary verdict must be preserved.");
            Assert.AreEqual(1, endingController.MilestoneCount, "Milestones must be preserved.");
        }

        [Test]
        public void SaveManager_ApplySaveDataToGame_ReplacesStaleTrustAndMemoriesOnLoad()
        {
            var saveMgrGo = new GameObject("TestSaveManager", typeof(SaveManager));
            var saveMgr = saveMgrGo.GetComponent<SaveManager>();

            try
            {
                // Seed pre-existing state in memory
                endingController.SetTrust("murugan", 80);
                endingController.SetTrust("velu", 50);
                endingController.SetAffinity("heritage", 40);
                NPCMemoryStore.RecordMemory("murugan", "stale_memory_flag");
                NPCMemoryStore.RecordChoiceApplied("choice_murugan_ask_ledger");

                Assert.AreEqual(80, endingController.GetTrust("murugan"));
                Assert.IsTrue(NPCMemoryStore.HasMemory("murugan", "stale_memory_flag"));
                Assert.IsTrue(NPCMemoryStore.IsChoiceApplied("choice_murugan_ask_ledger"));

                // Create a migrated v4 save with empty v5 relationship lists
                var v4Save = new GameSaveData
                {
                    schemaVersion = 5,
                    currentRegionId = "chennai",
                    currency = 150,
                    tutorialCompleted = true,
                    npcTrustScores = new List<SavedNPCTrust>(),
                    npcMemories = new List<SavedNPCMemory>(),
                    appliedChoiceIds = new List<string>(),
                    factionAffinities = new List<SavedFactionAffinity>()
                };

                // Apply save data
                saveMgr.ApplySaveDataToGame(v4Save);

                // All prior relationship state must be cleared without leakage
                Assert.AreEqual(0, endingController.GetTrust("murugan"), "Stale trust must not leak into loaded v4 save.");
                Assert.AreEqual(0, endingController.GetTrust("velu"), "Stale trust must not leak into loaded v4 save.");
                Assert.AreEqual(0, endingController.GetAffinity("heritage"), "Stale affinity must not leak into loaded v4 save.");
                Assert.IsFalse(NPCMemoryStore.HasMemory("murugan", "stale_memory_flag"), "Stale memory must not leak into loaded v4 save.");
                Assert.IsFalse(NPCMemoryStore.IsChoiceApplied("choice_murugan_ask_ledger"), "Stale applied choices must not leak into loaded v4 save.");
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(saveMgrGo);
            }
        }

        [Test]
        public void SaveMigrator_AndSaveManager_V4JsonMigrationAndRestoration_ClearsStaleRelationships()
        {
            var saveMgrGo = new GameObject("TestSaveManager", typeof(SaveManager));
            var saveMgr = saveMgrGo.GetComponent<SaveManager>();

            try
            {
                // Seed pre-existing state in memory (simulating a dirty active session)
                endingController.SetTrust("murugan", 75);
                endingController.SetTrust("velu", 40);
                endingController.SetAffinity("heritage", 35);
                NPCMemoryStore.RecordMemory("murugan", "stale_memory_flag");
                NPCMemoryStore.RecordChoiceApplied("choice_murugan_ask_ledger");

                Assert.AreEqual(75, endingController.GetTrust("murugan"));
                Assert.AreEqual(40, endingController.GetTrust("velu"));
                Assert.AreEqual(35, endingController.GetAffinity("heritage"));
                Assert.IsTrue(NPCMemoryStore.HasMemory("murugan", "stale_memory_flag"));
                Assert.IsTrue(NPCMemoryStore.IsChoiceApplied("choice_murugan_ask_ledger"));

                // Real Schema v4 JSON payload lacking any v5 relationship fields
                string v4Json = "{" +
                    "\"schemaVersion\": 4," +
                    "\"currentRegionId\": \"chennai\"," +
                    "\"posX\": 12.5," +
                    "\"posY\": 0.0," +
                    "\"posZ\": -5.2," +
                    "\"rotY\": 90.0," +
                    "\"currency\": 150," +
                    "\"tutorialCompleted\": true," +
                    "\"unlockedRegionIds\": [\"chennai\", \"pichavaram\"]," +
                    "\"solvedPuzzleIds\": []," +
                    "\"recordedDiscoveryIds\": []" +
                "}";

                // Parse raw v4 JSON into GameSaveData
                var v4Data = JsonUtility.FromJson<GameSaveData>(v4Json);
                Assert.IsNotNull(v4Data, "JSON deserialization of v4 payload must succeed");
                Assert.AreEqual(4, v4Data.schemaVersion, "Parsed save data must have schemaVersion 4");

                // Execute actual forward-migration from v4 to v5
                bool migrated = SaveMigrator.TryMigrate(v4Data, out string migrationError);
                Assert.IsTrue(migrated, $"SaveMigrator.TryMigrate must succeed on v4 payload. Error: {migrationError}");
                Assert.IsNull(migrationError);
                Assert.AreEqual(5, v4Data.schemaVersion, "Save schema must be forward-migrated to v5");

                // Verify v5 relationship collections were cleanly initialized by migrator
                Assert.IsNotNull(v4Data.npcTrustScores, "npcTrustScores must be initialized after migration");
                Assert.AreEqual(0, v4Data.npcTrustScores.Count);
                Assert.IsNotNull(v4Data.npcMemories, "npcMemories must be initialized after migration");
                Assert.AreEqual(0, v4Data.npcMemories.Count);
                Assert.IsNotNull(v4Data.appliedChoiceIds, "appliedChoiceIds must be initialized after migration");
                Assert.AreEqual(0, v4Data.appliedChoiceIds.Count);
                Assert.IsNotNull(v4Data.factionAffinities, "factionAffinities must be initialized after migration");
                Assert.AreEqual(0, v4Data.factionAffinities.Count);

                // Apply migrated save through SaveManager
                saveMgr.ApplySaveDataToGame(v4Data);

                // Verify all prior relationship state was cleanly replaced with 0 defaults and zero stale state leaked
                Assert.AreEqual(0, endingController.GetTrust("murugan"), "Murugan trust must reset to 0 default on loading migrated v4 save.");
                Assert.AreEqual(0, endingController.GetTrust("velu"), "Velu trust must reset to 0 default on loading migrated v4 save.");
                Assert.AreEqual(0, endingController.GetAffinity("heritage"), "Heritage affinity must reset to 0 default on loading migrated v4 save.");
                Assert.IsFalse(NPCMemoryStore.HasMemory("murugan", "stale_memory_flag"), "Stale memory must not leak from prior session.");
                Assert.IsFalse(NPCMemoryStore.IsChoiceApplied("choice_murugan_ask_ledger"), "Stale applied choices must not leak from prior session.");
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(saveMgrGo);
            }
        }

        [Test]
        public void DialogueConsequences_OneTimeExecution_AndStateIsolation()
        {
            var choice = new DialogueChoice
            {
                choiceId = "choice_test_murugan_favor",
                trustDelta = 20,
                targetNpcId = "murugan",
                memoryFlag = "favored_murugan",
                factionId = "heritage",
                factionDelta = 10
            };

            Assert.IsTrue(choice.hasConsequence);
            Assert.IsFalse(NPCMemoryStore.IsChoiceApplied(choice.choiceId));
            Assert.AreEqual(0, endingController.GetTrust("murugan"));
            Assert.AreEqual(0, endingController.GetAffinity("heritage"));

            // Simulate consequence application (logic mirroring DialogueUI)
            if (choice.hasConsequence && !NPCMemoryStore.IsChoiceApplied(choice.choiceId))
            {
                endingController.AdjustTrust(choice.targetNpcId, choice.trustDelta);
                NPCMemoryStore.RecordMemory(choice.targetNpcId, choice.memoryFlag);
                endingController.AdjustAffinity(choice.factionId, choice.factionDelta);
                NPCMemoryStore.RecordChoiceApplied(choice.choiceId);
            }

            Assert.AreEqual(20, endingController.GetTrust("murugan"));
            Assert.AreEqual(10, endingController.GetAffinity("heritage"));
            Assert.IsTrue(NPCMemoryStore.HasMemory("murugan", "favored_murugan"));
            Assert.IsTrue(NPCMemoryStore.IsChoiceApplied(choice.choiceId));

            // Re-executing must be blocked by the anti-exploit guard
            if (choice.hasConsequence && !NPCMemoryStore.IsChoiceApplied(choice.choiceId))
            {
                endingController.AdjustTrust(choice.targetNpcId, choice.trustDelta);
                endingController.AdjustAffinity(choice.factionId, choice.factionDelta);
            }

            // Values remain unchanged
            Assert.AreEqual(20, endingController.GetTrust("murugan"), "Trust must not be re-awarded on duplicate selection.");
            Assert.AreEqual(10, endingController.GetAffinity("heritage"), "Affinity must not be re-awarded on duplicate selection.");
        }
    }
}
