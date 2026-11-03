#if UNITY_EDITOR
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Campaign;
using WhisperingWilds.Platform;
using WhisperingWilds.Prototypes;
using WhisperingWilds.Traversal;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class TheFourHorizonsTests
    {
        private GameObject testHost;
        private SteamManager steamManager;
        private SangamHorizonsExpansion expansionManager;
        private RegionalTravelManager travelManager;
        private CholaMaritimeTacticsManager cholaManager;
        private MadrasCyberpunkDialogueEngine cyberpunkEngine;

        [SetUp]
        public void SetUp()
        {
            testHost = new GameObject("TestHorizonsHost");

            steamManager = testHost.AddComponent<SteamManager>();
            travelManager = testHost.AddComponent<RegionalTravelManager>();
            expansionManager = testHost.AddComponent<SangamHorizonsExpansion>();
            cholaManager = testHost.AddComponent<CholaMaritimeTacticsManager>();
            cyberpunkEngine = testHost.AddComponent<MadrasCyberpunkDialogueEngine>();
            expansionManager.InitializeExpansionHubs();
            cyberpunkEngine.InitializeSampleNoirCase();
        }

        [TearDown]
        public void TearDown()
        {
            if (testHost != null)
            {
                Object.DestroyImmediate(testHost);
            }
        }

        // ====================================================================
        // 1. Steamworks & Steam Deck Optimization Tests
        // ====================================================================

        [Test]
        public void TestSteamManager_InitializationAndAchievements()
        {
            steamManager.InitializePlatform();
            Assert.IsTrue(steamManager.isSteamInitialized);

            bool unlocked = steamManager.UnlockAchievement(SteamManager.ACH_DRAVIDIAN_SCHOLAR);
            Assert.IsTrue(unlocked);
            Assert.IsTrue(steamManager.IsAchievementUnlocked(SteamManager.ACH_DRAVIDIAN_SCHOLAR));

            // Idempotent duplicate check
            bool unlockAgain = steamManager.UnlockAchievement(SteamManager.ACH_DRAVIDIAN_SCHOLAR);
            Assert.IsFalse(unlockAgain);
        }

        // ====================================================================
        // 2. Sangam Horizons Expansion Pack Tests
        // ====================================================================

        [Test]
        public void TestSangamHorizons_HubRegistrationAndUnlock()
        {
            Assert.AreEqual(3, expansionManager.expansionHubs.Count);

            bool unlocked = expansionManager.UnlockExpansionHub("madurai", travelManager);
            Assert.IsTrue(unlocked);

            // Verify travel node was appended to travel manager
            bool hasMaduraiNode = travelManager.worldNodes.Exists(n => n.nodeId == "madurai");
            Assert.IsTrue(hasMaduraiNode);

            // Relic discovery
            expansionManager.DiscoverRelic("vaigai_inscription");
            Assert.AreEqual(1, expansionManager.relicsDiscovered);
        }

        // ====================================================================
        // 3. Chola Maritime Tactics Tests
        // ====================================================================

        [Test]
        public void TestCholaMaritime_MonsoonPassageCalculation()
        {
            cholaManager.SetMonsoonSeason(MonsoonWindSeason.SouthwestMonsoon);
            cholaManager.windSpeedKnots = 20f;

            // Sailing East (1000 nautical miles) with SW monsoon assistance should be significantly faster
            float assistedDays = cholaManager.CalculatePassageTimeDays(1000f, true);
            float unassistedDays = cholaManager.CalculatePassageTimeDays(1000f, false);

            Assert.Less(assistedDays, unassistedDays);
        }

        [Test]
        public void TestCholaMaritime_PortCommodityTrading()
        {
            cholaManager.goldCoins = 500;
            cholaManager.spicesCargo = 0;

            // Buy 10 spices at 20 coins = 200 coins
            bool bought = cholaManager.TradeAtPort("spices", 10, 20, true);
            Assert.IsTrue(bought);
            Assert.AreEqual(10, cholaManager.spicesCargo);
            Assert.AreEqual(300, cholaManager.goldCoins);

            // Cannot overspend
            bool overspend = cholaManager.TradeAtPort("spices", 50, 20, true); // 1000 coins > 300
            Assert.IsFalse(overspend);
        }

        // ====================================================================
        // 4. Madras Cyberpunk Noir Dialogue Tests
        // ====================================================================

        [Test]
        public void TestMadrasCyberpunk_SkillChecksPassAndFailAppropriately()
        {
            cyberpunkEngine.techSavvy = 5;
            cyberpunkEngine.streetCred = 2;

            // Choice 0: TechSavvy check (difficulty 4) -> should PASS with 5
            bool hackPassed = cyberpunkEngine.SelectChoice(0, out string nextNode);
            Assert.IsTrue(hackPassed);
            Assert.AreEqual("hack_success", nextNode);

            // Reset
            cyberpunkEngine.InitializeSampleNoirCase();

            // Choice 1: StreetCred check (difficulty 3) -> should FAIL with 2
            bool credPassed = cyberpunkEngine.SelectChoice(1, out string credNode);
            Assert.IsFalse(credPassed);
            Assert.IsNull(credNode);
        }
    }
}
#endif
