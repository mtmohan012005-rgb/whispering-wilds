using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using WhisperingWilds.Campaign;
using WhisperingWilds.Economy;
using WhisperingWilds.NPC;
using WhisperingWilds.Quests;
using WhisperingWilds.Characters;

namespace WhisperingWilds.Tests.Editor
{
    /// <summary>
    /// Editor tests for Step 37-38: ending system, vendor economy, and NPC navigation fixes.
    /// </summary>
    [TestFixture]
    public class Step37ReleaseStabilizationTests
    {
        // ==================================================================
        // EndingController tests
        // ==================================================================

        [Test]
        public void EndingController_CreatesInstance()
        {
            var go = new GameObject("EndingControllerTest");
            var controller = go.AddComponent<EndingController>();
            Assert.IsNotNull(controller, "EndingController should be addable");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_SingletonPattern()
        {
            var go1 = new GameObject("EC1");
            var go2 = new GameObject("EC2");
            go1.AddComponent<EndingController>();
            go2.AddComponent<EndingController>();

            // Second instance should destroy itself
            Assert.IsNotNull(EndingController.Instance, "Instance should be set");
            Object.DestroyImmediate(go1);
            Object.DestroyImmediate(go2);
        }

        [Test]
        public void EndingController_AdjustAffinity_Heritage()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            ec.AdjustAffinity("heritage", 30);
            Assert.AreEqual(30, ec.GetAffinity("heritage"), "Heritage affinity should be 30");
            ec.AdjustAffinity("heritage", -10);
            Assert.AreEqual(20, ec.GetAffinity("heritage"), "Heritage affinity should be 20 after -10");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_AdjustAffinity_Clamped()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            ec.AdjustAffinity("heritage", 150);
            Assert.AreEqual(100, ec.GetAffinity("heritage"), "Affinity should clamp to 100");
            ec.AdjustAffinity("heritage", -200);
            Assert.AreEqual(-100, ec.GetAffinity("heritage"), "Affinity should clamp to -100");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_AdjustTrust()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            ec.AdjustTrust("murugan", 50);
            Assert.AreEqual(50, ec.GetTrust("murugan"), "Murugan trust should be 50");
            ec.AdjustTrust("murugan", 60);
            Assert.AreEqual(100, ec.GetTrust("murugan"), "Murugan trust should clamp to 100");
            ec.AdjustTrust("murugan", -200);
            Assert.AreEqual(0, ec.GetTrust("murugan"), "Murugan trust should clamp to 0");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_AverageTrust()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            ec.AdjustTrust("murugan", 60);
            ec.AdjustTrust("velu", 40);
            Assert.AreEqual(50f, ec.GetAverageTrust(), 0.01f, "Average trust should be 50");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_CountNPCsWithTrust()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            ec.AdjustTrust("murugan", 80);
            ec.AdjustTrust("velu", 30);
            ec.AdjustTrust("selvam", 75);
            Assert.AreEqual(2, ec.CountNPCsWithTrust(70), "Should count 2 NPCs with trust >= 70");
            Assert.AreEqual(3, ec.CountNPCsWithTrust(25), "Should count 3 NPCs with trust >= 25");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_RecordMilestone()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            ec.RecordMilestone("Epigraphist");
            ec.RecordMilestone("LostHerbarium");
            Assert.AreEqual(2, ec.MilestoneCount, "Should have 2 milestones");
            ec.RecordMilestone("Epigraphist"); // duplicate
            Assert.AreEqual(2, ec.MilestoneCount, "Duplicate milestone should not increase count");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_EvaluateEnding_Fallback()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            // With no affinity, trust, or verdict, should fall back to Ending C
            var ending = ec.EvaluateEnding();
            Assert.AreEqual(EndingController.EndingType.EndingC_ShadowedSanctuary, ending,
                "Should fall back to Ending C with no prerequisites met");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_EvaluateEnding_Cached()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            var ending1 = ec.EvaluateEnding();
            // Change state after evaluation
            ec.AdjustAffinity("heritage", 100);
            ec.SetSanctuaryVerdict("LivingSanctuary");
            var ending2 = ec.EvaluateEnding();
            Assert.AreEqual(ending1, ending2, "Ending should be cached and not change after first evaluation");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_ResetForNewGame()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            ec.AdjustAffinity("heritage", 50);
            ec.AdjustTrust("murugan", 80);
            ec.RecordMilestone("Epigraphist");
            ec.EvaluateEnding();

            ec.ResetForNewGame();

            Assert.AreEqual(0, ec.GetAffinity("heritage"), "Affinity should reset to 0");
            Assert.AreEqual(0, ec.GetTrust("murugan"), "Trust should reset to 0");
            Assert.AreEqual(0, ec.MilestoneCount, "Milestones should reset");
            Assert.AreEqual(EndingController.EndingType.None, ec.GetCurrentEnding(), "Cached ending should reset");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_GetEndingTitle_Bilingual()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            string en = ec.GetEndingTitle(EndingController.EndingType.EndingA_LivingHeritage, false);
            string ta = ec.GetEndingTitle(EndingController.EndingType.EndingA_LivingHeritage, true);
            Assert.AreEqual("The Living Heritage", en, "English title should match");
            Assert.AreNotEqual(en, ta, "Tamil title should differ from English");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void EndingController_SnapshotAndRestore()
        {
            var go = new GameObject("ECTest");
            var ec = go.AddComponent<EndingController>();
            ec.AdjustAffinity("heritage", 70);
            ec.AdjustTrust("murugan", 90);
            ec.RecordMilestone("Epigraphist");
            ec.SetSanctuaryVerdict("LivingSanctuary");

            var data = ec.Snapshot();
            ec.ResetForNewGame();

            ec.Restore(data);
            Assert.AreEqual(70, ec.GetAffinity("heritage"), "Heritage affinity should restore");
            Assert.AreEqual(90, ec.GetTrust("murugan"), "Murugan trust should restore");
            Assert.AreEqual(1, ec.MilestoneCount, "Milestones should restore");
            Assert.AreEqual("LivingSanctuary", ec.GetSanctuaryVerdict(), "Verdict should restore");
            Object.DestroyImmediate(go);
        }

        // ==================================================================
        // QuestEndingBridge tests
        // ==================================================================

        [Test]
        public void QuestEndingBridge_ComponentExists()
        {
            var go = new GameObject("QEBTest");
            var bridge = go.AddComponent<QuestEndingBridge>();
            Assert.IsNotNull(bridge, "QuestEndingBridge should be addable");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void QuestEndingBridge_SetFinalQuestId()
        {
            var go = new GameObject("QEBTest");
            var bridge = go.AddComponent<QuestEndingBridge>();
            // Use reflection to check the field since it's private
            var field = typeof(QuestEndingBridge).GetField("finalQuestId",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(field, "finalQuestId field should exist");
            Object.DestroyImmediate(go);
        }

        // ==================================================================
        // VendorInteraction tests
        // ==================================================================

        [Test]
        public void VendorInteraction_ComponentExists()
        {
            var go = new GameObject("VendorTest");
            go.AddComponent<NPCCharacter>();
            var vendor = go.AddComponent<VendorInteraction>();
            Assert.IsNotNull(vendor, "VendorInteraction should be addable with NPCCharacter");
            Object.DestroyImmediate(go);
        }

        [Test]
        public void VendorInteraction_RequireComponent_NPCCharacter()
        {
            var attr = typeof(VendorInteraction).GetCustomAttributes(typeof(RequireComponent), false);
            Assert.AreEqual(1, attr.Length, "VendorInteraction should have RequireComponent attribute");
            var requireComp = (RequireComponent)attr[0];
            Assert.AreEqual(typeof(NPCCharacter), requireComp.m_Type0, "Should require NPCCharacter");
        }

        [Test]
        public void VendorStockItem_Structure()
        {
            var item = new VendorStockItem
            {
                itemId = "tea",
                displayNameEn = "Tea",
                displayNameTa = "தேநீர்",
                unitPrice = 15,
                quantity = 10,
                maxQuantity = 50
            };
            Assert.AreEqual("tea", item.itemId);
            Assert.AreEqual(15, item.unitPrice);
            Assert.AreEqual(10, item.quantity);
            Assert.AreEqual(50, item.maxQuantity);
        }

        // ==================================================================
        // NPCWallet helper methods tests
        // ==================================================================

        [Test]
        public void NPCWallet_AddStock()
        {
            var wallet = new NPCWallet("test_vendor", 500, 4000);
            wallet.AddStock("tea", 10, 50);
            var snapshot = wallet.SnapshotStock();
            Assert.AreEqual(1, snapshot.Count, "Should have 1 stock line");
            Assert.AreEqual("tea", snapshot[0].itemId);
        }

        [Test]
        public void NPCWallet_RemoveStock()
        {
            var wallet = new NPCWallet("test_vendor", 500, 4000);
            wallet.AddStock("tea", 10, 50);
            wallet.RemoveStock("tea", 3);
            var snapshot = wallet.SnapshotStock();
            Assert.AreEqual(7, snapshot[0].count, "Should have 7 tea remaining");
        }

        [Test]
        public void NPCWallet_AddRemoveCoins()
        {
            var wallet = new NPCWallet("test_vendor", 500, 4000);
            wallet.AddCoins(100);
            Assert.AreEqual(600, wallet.CoinBalance, "Should have 600 coins");
            wallet.RemoveCoins(50);
            Assert.AreEqual(550, wallet.CoinBalance, "Should have 550 coins");
        }

        [Test]
        public void NPCWallet_CoinsClamped()
        {
            var wallet = new NPCWallet("test_vendor", 500, 1000);
            wallet.AddCoins(600);
            Assert.AreEqual(1000, wallet.CoinBalance, "Coins should clamp to max");
            wallet.RemoveCoins(1500);
            Assert.AreEqual(0, wallet.CoinBalance, "Coins should clamp to 0");
        }

        // ==================================================================
        // NPC Navigation fix verification
        // ==================================================================

        [Test]
        public void NPCNavigationController_MaxNavMeshSampleDistance_Increased()
        {
            var go = new GameObject("NPCNavTest");
            var nav = go.AddComponent<NPCNavigationController>();
            var field = typeof(NPCNavigationController).GetField("maxNavMeshSampleDistance",
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            float value = field != null ? (float)field.GetValue(nav) : 0f;
            Assert.GreaterOrEqual(value, 10f,
                $"maxNavMeshSampleDistance should be >= 10m for off-mesh NPC spawns, got {value}m");
            Object.DestroyImmediate(go);
        }

        // ==================================================================
        // Character prefab existence
        // ==================================================================

        [Test]
        public void CharacterPrefabCatalog_TeaWorkerPath_Exists()
        {
            Assert.IsNotNull(CharacterPrefabCatalog.TeaWorkerPrefabPath, "TeaWorker prefab path should be defined");
            Assert.IsTrue(CharacterPrefabCatalog.TeaWorkerPrefabPath.Contains("NPC_TeaWorker"),
                "TeaWorker path should contain NPC_TeaWorker");
        }

        [Test]
        public void RegionUnlocks_DeferredRegionIds_Empty()
        {
            Assert.AreEqual(0, WhisperingWilds.World.RegionUnlocks.DeferredRegionIds.Length,
                "DeferredRegionIds should be empty — Nilgiris should not be permanently deferred");
        }

        [Test]
        public void RegionUnlocks_Nilgiris_InProgressionOrder()
        {
            bool found = false;
            foreach (var id in WhisperingWilds.World.RegionUnlocks.ProgressionOrder)
            {
                if (id == WhisperingWilds.World.RegionUnlocks.NilgirisRegionId)
                {
                    found = true;
                    break;
                }
            }
            Assert.IsTrue(found, "Nilgiris should be in ProgressionOrder");
        }
    }
}
