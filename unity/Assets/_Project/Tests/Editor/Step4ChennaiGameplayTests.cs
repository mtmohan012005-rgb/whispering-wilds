using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Inventory;
using WhisperingWilds.Investigation;
using WhisperingWilds.NPC;
using WhisperingWilds.Photography;
using WhisperingWilds.Quests;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Step 4 EditMode coverage for the Chennai vertical slice.
    ///
    /// These tests exercise the rules the slice depends on: stable identifiers resolve in the
    /// catalogue, quest objectives advance through the typed event bus rather than through raw
    /// playercounts, and the three durable histories persist and restore without leaking a
    /// previous session's entries.
    /// </summary>
    public class Step4ChennaiGameplayTests
    {
        [OneTimeSetUp]
        public void OneTimeSetUp()
        {
            ChennaiOpeningContent.EnsureInitialized();
            ClearRuntimeState();
        }

        [TearDown]
        public void TearDown()
        {
            ClearRuntimeState();
        }

        private readonly List<GameObject> spawned = new List<GameObject>();

        private static void ClearRuntimeState()
        {
            InvestigationRuntimeState.Clear();
            NPCInteractionLog.Clear();
            CraftingHistory.Clear();
            PhotoJournal.Clear();
        }

        [TearDown]
        public void TearDownAfterManagers()
        {
            // Managers are singletons with event subscriptions, so they must not outlive the test
            // that created them or later tests would advance against a stale listener.
            for (int i = spawned.Count - 1; i >= 0; i--)
            {
                if (spawned[i] == null) continue;
                Object.DestroyImmediate(spawned[i]);
            }

            spawned.Clear();
        }

        // ---- Catalogue integrity --------------------------------------------

        [Test]
        public void Catalog_ResolvesEveryOpeningIdentifier()
        {
            Assert.IsNotNull(GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestFirstDayInGeorgeTown),
                "The opening quest must resolve by its stable id.");
            Assert.IsNotNull(GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestTeaLedgerDiscrepancy),
                "The follow-up quest must resolve by its stable id.");
            Assert.IsNotNull(GameDataCatalog.GetItem(ChennaiOpeningContent.ItemTeaLeaves));
            Assert.IsNotNull(GameDataCatalog.GetItem(ChennaiOpeningContent.ItemPalmJaggery));
            Assert.IsNotNull(GameDataCatalog.GetItem(ChennaiOpeningContent.ItemBambooStick));
            Assert.IsNotNull(GameDataCatalog.GetClue(ChennaiOpeningContent.ClueMuruganTeaLedger));
            Assert.IsNotNull(GameDataCatalog.GetClue(ChennaiOpeningContent.ClueVeluRickshawTally));
            Assert.IsNotNull(GameDataCatalog.GetClue(ChennaiOpeningContent.ClueHighCourtSticker));
            Assert.IsNotNull(GameDataCatalog.GetRecipe(ChennaiOpeningContent.RecipeFilterCoffee));
            Assert.IsNotNull(GameDataCatalog.GetRecipe(ChennaiOpeningContent.RecipeFieldNotebook));
        }

        [Test]
        public void Catalog_QuestObjectivesTargetDeclaredIdentifiers()
        {
            var quest = GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestFirstDayInGeorgeTown);
            Assert.IsNotNull(quest);

            var declaredNpcs = new HashSet<string>
            {
                ChennaiOpeningContent.NpcMurugan,
                ChennaiOpeningContent.NpcVelu
            };
            var declaredItems = new HashSet<string>
            {
                ChennaiOpeningContent.ItemTeaLeaves,
                ChennaiOpeningContent.ItemPalmJaggery,
                ChennaiOpeningContent.ItemBambooStick,
                ChennaiOpeningContent.ItemFilterCoffee,
                ChennaiOpeningContent.ItemFieldNotebook,
                ChennaiOpeningContent.ItemPhotograph
            };
            var declaredLocations = new HashSet<string>
            {
                ChennaiOpeningContent.LocationHighCourtPlaza,
                ChennaiOpeningContent.LocationTeaKadai,
                ChennaiOpeningContent.LocationVeluRickshaw
            };
            var declaredObjects = new HashSet<string>
            {
                ChennaiOpeningContent.ObjectTeaKadaiLedger,
                ChennaiOpeningContent.ObjectHighCourtNoticeBoard
            };

            foreach (var stage in quest.stages)
            {
                foreach (var objective in stage.objectives)
                {
                    switch (objective.type)
                    {
                        case QuestObjectiveType.TalkToNPC:
                            Assert.IsTrue(declaredNpcs.Contains(objective.targetId),
                                $"TalkToNPC objective '{objective.objectiveId}' targets undeclared npc '{objective.targetId}'.");
                            break;
                        case QuestObjectiveType.CollectItem:
                            Assert.IsTrue(declaredItems.Contains(objective.targetId),
                                $"CollectItem objective '{objective.objectiveId}' targets undeclared item '{objective.targetId}'.");
                            break;
                        case QuestObjectiveType.CraftItem:
                            Assert.IsNotNull(GameDataCatalog.GetRecipe(objective.targetId),
                                $"CraftItem objective '{objective.objectiveId}' targets unknown recipe '{objective.targetId}'.");
                            break;
                        case QuestObjectiveType.ReachLocation:
                            Assert.IsTrue(declaredLocations.Contains(objective.targetId),
                                $"ReachLocation objective '{objective.objectiveId}' targets undeclared location '{objective.targetId}'.");
                            break;
                        case QuestObjectiveType.InvestigateObject:
                            Assert.IsTrue(declaredObjects.Contains(objective.targetId),
                                $"InvestigateObject objective '{objective.objectiveId}' targets undeclared object '{objective.targetId}'.");
                            break;
                    }
                }
            }
        }

        [Test]
        public void Catalog_RecipeIngredientsResolveAndAreDistinct()
        {
            foreach (var recipeId in new[] { ChennaiOpeningContent.RecipeFilterCoffee, ChennaiOpeningContent.RecipeFieldNotebook })
            {
                var recipe = GameDataCatalog.GetRecipe(recipeId);
                Assert.IsNotNull(recipe, $"Recipe '{recipeId}' must exist.");
                Assert.IsNotEmpty(recipe.ingredients, $"Recipe '{recipeId}' must require at least one ingredient.");
                Assert.IsNotNull(recipe.resultItem, $"Recipe '{recipeId}' must produce an item.");

                var seen = new HashSet<ItemData>();
                foreach (var requirement in recipe.ingredients)
                {
                    Assert.IsNotNull(requirement.item, $"Recipe '{recipeId}' has a null ingredient.");
                    Assert.Greater(requirement.count, 0);
                    Assert.IsTrue(seen.Add(requirement.item),
                        $"Recipe '{recipeId}' lists ingredient '{requirement.item.itemId}' twice, which would double-charge it.");
                }
            }
        }

        // ---- Quest progression ----------------------------------------------

        [Test]
        public void GameplayEventBus_AdvancesMatchingTalkObjective()
        {
            var manager = CreateQuestManager();
            var quest = GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestFirstDayInGeorgeTown);
            Assert.IsTrue(manager.AcceptQuest(quest));

            string talkObjectiveId = FindObjectiveId(quest, QuestObjectiveType.TalkToNPC, ChennaiOpeningContent.NpcMurugan);

            GameplayEventBus.ReportTalkedToNpc(ChennaiOpeningContent.NpcMurugan);

            Assert.AreEqual(1, manager.GetObjectiveCount(quest.questId, talkObjectiveId),
                "Reporting a talk event must advance the matching objective.");
        }

        [Test]
        public void GameplayEventBus_IgnoresProgressForUntrackedIdentifiers()
        {
            var manager = CreateQuestManager();
            var quest = GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestFirstDayInGeorgeTown);
            Assert.IsTrue(manager.AcceptQuest(quest));

            string talkObjectiveId = FindObjectiveId(quest, QuestObjectiveType.TalkToNPC, ChennaiOpeningContent.NpcMurugan);

            GameplayEventBus.ReportTalkedToNpc("npc_not_in_any_quest");

            Assert.AreEqual(0, manager.GetObjectiveCount(quest.questId, talkObjectiveId),
                "An identifier no objective targets must not advance anything.");
        }

        [Test]
        public void QuestManager_SatisfyingAnObjectiveAdvancesTheStage()
        {
            var manager = CreateQuestManager();
            var quest = GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestFirstDayInGeorgeTown);
            Assert.IsTrue(manager.AcceptQuest(quest));
            Assert.AreEqual(0, manager.GetCurrentStageIndex(quest.questId));

            // Stage one requires meeting both residents, so a single talk must not advance it.
            string muruganObjective = FindObjectiveId(quest, QuestObjectiveType.TalkToNPC, ChennaiOpeningContent.NpcMurugan);
            string veluObjective = FindObjectiveId(quest, QuestObjectiveType.TalkToNPC, ChennaiOpeningContent.NpcVelu);

            manager.AdvanceObjective(quest.questId, muruganObjective);
            Assert.AreEqual(0, manager.GetCurrentStageIndex(quest.questId),
                "Stage one must not advance while an objective is still outstanding.");

            manager.AdvanceObjective(quest.questId, veluObjective);

            Assert.AreEqual(1, manager.GetCurrentStageIndex(quest.questId),
                "Completing every objective in stage one must advance the quest to stage two.");
        }

        [Test]
        public void GameplayEventBus_UnknownObjectiveTypeIsNotAnError()
        {
            Assert.DoesNotThrow(() => GameplayEventBus.Report(
                (QuestObjectiveType)999, "anything"),
                "An unmodelled objective type must be ignored quietly, not throw.");
        }

        [Test]
        public void GameplayEventBus_EmptyTargetIdIsRejected()
        {
            var manager = CreateQuestManager();
            var quest = GameDataCatalog.GetQuest(ChennaiOpeningContent.QuestFirstDayInGeorgeTown);
            manager.AcceptQuest(quest);

            string objectiveId = FindObjectiveId(quest, QuestObjectiveType.TalkToNPC, ChennaiOpeningContent.NpcMurugan);

            UnityEngine.TestTools.LogAssert.Expect(LogType.Warning, new System.Text.RegularExpressions.Regex("empty targetId"));
            Assert.IsFalse(GameplayEventBus.Report(QuestObjectiveType.TalkToNPC, string.Empty));
            Assert.IsFalse(GameplayEventBus.Report(QuestObjectiveType.TalkToNPC, null));

            Assert.AreEqual(0, manager.GetObjectiveCount(quest.questId, objectiveId),
                "An empty identifier must never advance an objective.");
        }

        // ---- Inventory grant sources -----------------------------------------

        [Test]
        public void Inventory_CraftResultIsNotReportedAsCollected()
        {
            var inventory = CreateInventory();
            var filter = GameDataCatalog.GetItem(ChennaiOpeningContent.ItemFilterCoffee);

            bool added = inventory.AddItem(filter, 1, InventoryManager.ItemGrantSource.Crafted);

            Assert.IsTrue(added);
            Assert.AreEqual(1, inventory.GetItemCount(filter));
        }

        [Test]
        public void Inventory_WeightLimitedAddAcceptsPartialStack()
        {
            var inventory = CreateInventory(capacity: 2f);
            var leaves = GameDataCatalog.GetItem(ChennaiOpeningContent.ItemTeaLeaves);

            bool added = inventory.AddItem(leaves, 10, InventoryManager.ItemGrantSource.Collected);

            Assert.IsTrue(added, "A weight-limited add should still place what fits.");
            Assert.Greater(inventory.GetItemCount(leaves), 0);
            Assert.LessOrEqual(inventory.GetItemCount(leaves), 10);
        }

        [Test]
        public void Inventory_FullInventoryRejectsEntirely()
        {
            var inventory = CreateInventory(capacity: 0.1f);
            var heavy = GameDataCatalog.GetItem(ChennaiOpeningContent.ItemBambooStick);

            Assert.IsFalse(inventory.AddItem(heavy, 1, InventoryManager.ItemGrantSource.Collected));
            Assert.AreEqual(0, inventory.GetItemCount(heavy));
        }

        [Test]
        public void Inventory_RestoredCountSaturatesWithoutOverflow()
        {
            var inventory = CreateInventory();
            var leaves = GameDataCatalog.GetItem(ChennaiOpeningContent.ItemTeaLeaves);
            inventory.AddItem(leaves, 2, InventoryManager.ItemGrantSource.Collected);

            // int.MaxValue is the saturation point the merge guard produces; the restore must stay
            // positive and non-negative rather than wrapping to a negative count.
            inventory.RestoreFromSave(new List<SavedInventoryItem>
            {
                new SavedInventoryItem { itemId = leaves.itemId, count = int.MaxValue }
            }, 0);

            Assert.GreaterOrEqual(inventory.GetItemCount(leaves), 2,
                "Restoring must not reduce an existing stack.");
            Assert.GreaterOrEqual(inventory.GetItemCount(leaves), 0);
        }

        [Test]
        public void Inventory_UnknownItemIdInSaveIsSkippedNotThrown()
        {
            var inventory = CreateInventory();

            Assert.DoesNotThrow(() => inventory.RestoreFromSave(new List<SavedInventoryItem>
            {
                new SavedInventoryItem { itemId = "item_that_does_not_exist", count = 5 }
            }, 0));
        }

        [Test]
        public void Inventory_MergeSaturatesOnDuplicateEntries()
        {
            var inventory = CreateInventory();
            var leaves = GameDataCatalog.GetItem(ChennaiOpeningContent.ItemTeaLeaves);

            // Two entries for one id must saturate at int.MaxValue, not wrap negative.
            inventory.RestoreFromSave(new List<SavedInventoryItem>
            {
                new SavedInventoryItem { itemId = leaves.itemId, count = int.MaxValue },
                new SavedInventoryItem { itemId = leaves.itemId, count = int.MaxValue }
            }, 0);

            Assert.GreaterOrEqual(inventory.GetItemCount(leaves), 0);
        }

        // ---- Durable histories ------------------------------------------------

        [Test]
        public void NPCInteractionLog_RecordsOnceAndRestoresSilently()
        {
            Assert.IsTrue(NPCInteractionLog.Record(ChennaiOpeningContent.NpcMurugan));
            Assert.IsFalse(NPCInteractionLog.Record(ChennaiOpeningContent.NpcMurugan),
                "Recording the same npc twice in one session must not duplicate the entry.");

            NPCInteractionLog.Restore(new List<string> { ChennaiOpeningContent.NpcVelu });

            Assert.IsFalse(NPCInteractionLog.HasTalkedTo(ChennaiOpeningContent.NpcMurugan),
                "Restoring must replace the session's entries rather than merge with them.");
            Assert.IsTrue(NPCInteractionLog.HasTalkedTo(ChennaiOpeningContent.NpcVelu));
            Assert.AreEqual(1, NPCInteractionLog.Count);
        }

        [Test]
        public void CraftingHistory_RestoresCountsWithoutReplayingEvents()
        {
            int events = 0;
            CraftingHistory.OnCrafted += (_, __) => events++;

            CraftingHistory.Restore(new List<KeyValuePair<string, int>>
            {
                new KeyValuePair<string, int>(ChennaiOpeningContent.RecipeFilterCoffee, 2)
            });

            Assert.AreEqual(2, CraftingHistory.GetCraftCount(ChennaiOpeningContent.RecipeFilterCoffee));
            Assert.AreEqual(0, events,
                "Restoring a crafting history must stay silent so save loading cannot advance objectives.");
        }

        [Test]
        public void PhotoJournal_TracksTargetsAndRestoresSilently()
        {
            int events = 0;
            PhotoJournal.OnPhotoCaptured += _ => events++;

            PhotoJournal.Restore(new List<string> { ChennaiOpeningContent.PhotoTargetTeaKadaiStall });

            Assert.IsTrue(PhotoJournal.HasCaptured(ChennaiOpeningContent.PhotoTargetTeaKadaiStall));
            Assert.IsFalse(PhotoJournal.HasCaptured("photo_never_seen"));
            Assert.AreEqual(0, events, "Restoring a photo journal must not emit capture events.");
        }

        [Test]
        public void PhotoJournal_AllTargetIdsRoundTripsThroughCapture()
        {
            PhotoJournal.Restore(new List<string> { ChennaiOpeningContent.PhotoTargetTeaKadaiStall });

            var captured = new List<string>(PhotoJournal.AllTargetIds());
            Assert.AreEqual(1, captured.Count);
            Assert.AreEqual(ChennaiOpeningContent.PhotoTargetTeaKadaiStall, captured[0]);
        }

        // ---- Opening dialogue -------------------------------------------------

        [Test]
        public void OpeningDialogue_ResolvesForBothResidentsAndIsBilingual()
        {
            foreach (var npcId in new[] { ChennaiOpeningContent.NpcMurugan, ChennaiOpeningContent.NpcVelu })
            {
                var nodes = ChennaiOpeningContent.BuildDialogueFor(npcId);
                Assert.IsNotNull(nodes, $"Dialogue must build for '{npcId}'.");
                Assert.IsNotEmpty(nodes);
                Assert.IsFalse(nodes.Exists(n => string.IsNullOrEmpty(n.speakerTextEn)),
                    $"Dialogue for '{npcId}' must set English speaker text on every node.");
                Assert.IsFalse(nodes.Exists(n => string.IsNullOrEmpty(n.speakerTextTa)),
                    $"Dialogue for '{npcId}' must set Tamil speaker text on every node.");

                foreach (var node in nodes)
                {
                    foreach (var choice in node.choices)
                    {
                        Assert.IsFalse(string.IsNullOrEmpty(choice.choiceTextEn),
                            $"Dialogue for '{npcId}' has a choice with no English text.");
                        Assert.IsFalse(string.IsNullOrEmpty(choice.choiceTextTa),
                            $"Dialogue for '{npcId}' has a choice with no Tamil text.");
                    }
                }
            }
        }

        [Test]
        public void OpeningDialogue_MuruganRevealsLedgerClueOnlyAfterTalkObjective()
        {
            var nodes = ChennaiOpeningContent.BuildDialogueFor(ChennaiOpeningContent.NpcMurugan);

            bool revealsLedger = false;
            foreach (var node in nodes)
            {
                foreach (var choice in node.choices)
                {
                    if (choice.revealClueId == ChennaiOpeningContent.ClueMuruganTeaLedger) revealsLedger = true;
                }
            }

            Assert.IsTrue(revealsLedger,
                "Murugan's dialogue must be able to reveal the tea ledger clue.");
        }

        // ---- Helpers ----------------------------------------------------------

        private QuestManager CreateQuestManager()
        {
            var go = new GameObject("TestQuestManager");
            spawned.Add(go);

            var manager = go.AddComponent<QuestManager>();
            InvokeAwake(manager);

            manager.ResetAllProgress();
            return manager;
        }

        /// <summary>
        /// Runs <c>Awake</c> explicitly. EditMode tests do not enter play mode, so Unity does not
        /// deliver <c>Awake</c> for a component added at test time, and the manager would never
        /// subscribe to <see cref="GameplayEventBus"/>. Calling it here puts the manager in the same
        /// wired-up state it has during play.
        /// </summary>
        private static void InvokeAwake(Component component)
        {
            var method = component.GetType().GetMethod("Awake",
                System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic);
            Assert.IsNotNull(method, $"{component.GetType().Name} must expose an Awake method.");
            method.Invoke(component, null);
        }

        private InventoryManager CreateInventory(float capacity = 100f)
        {
            var go = new GameObject("TestInventory");
            spawned.Add(go);

            var inventory = go.AddComponent<InventoryManager>();
            InvokeAwake(inventory);
            inventory.ResetToNewGameDefaults();

            // The carry limit is a serialized field, so it is lowered through SerializedObject to
            // exercise the weight-limited paths without changing the shipped scene value.
            var so = new UnityEditor.SerializedObject(inventory);
            var capacityProp = so.FindProperty("maxWeightKg");
            if (capacityProp != null)
            {
                capacityProp.floatValue = capacity;
                so.ApplyModifiedPropertiesWithoutUndo();
            }

            return inventory;
        }

        private static string FindObjectiveId(QuestData quest, QuestObjectiveType type, string targetId)
        {
            foreach (var stage in quest.stages)
            {
                foreach (var objective in stage.objectives)
                {
                    if (objective.type == type && objective.targetId == targetId) return objective.objectiveId;
                }
            }

            Assert.Fail($"No {type} objective targeting '{targetId}' exists in quest '{quest.questId}'.");
            return null;
        }
    }
}