#if UNITY_EDITOR
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Campaign;
using WhisperingWilds.Economy;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class VendorSystemTests
    {
        private GameObject vendorGameObject;
        private VendorSystem vendor;

        [SetUp]
        public void SetUp()
        {
            vendorGameObject = new GameObject("TestVendor");
            vendor = vendorGameObject.AddComponent<VendorSystem>();
            vendor.vendorId = "test_merchant";
            vendor.vendorName = "Test Merchant";
            vendor.trustPoints = 0;
            vendor.currentTrustTier = TrustTier.Stranger;
            NPCMemoryStore.Clear();
        }

        [TearDown]
        public void TearDown()
        {
            if (vendorGameObject != null)
            {
                Object.DestroyImmediate(vendorGameObject);
            }
            NPCMemoryStore.Clear();
        }

        [Test]
        public void TestTrustTierPricingDiscount()
        {
            vendor.currentTrustTier = TrustTier.Stranger;
            int strangerPrice = vendor.CalculatePurchasePrice(100);

            vendor.currentTrustTier = TrustTier.Acquaintance;
            int acquaintancePrice = vendor.CalculatePurchasePrice(100);

            vendor.currentTrustTier = TrustTier.Trusted;
            int trustedPrice = vendor.CalculatePurchasePrice(100);

            vendor.currentTrustTier = TrustTier.Confidant;
            int confidantPrice = vendor.CalculatePurchasePrice(100);

            Assert.AreEqual(100, strangerPrice, "Stranger tier should have 0% discount (100 coins).");
            Assert.AreEqual(95, acquaintancePrice, "Acquaintance tier should have 5% discount (95 coins).");
            Assert.AreEqual(90, trustedPrice, "Trusted tier should have 10% discount (90 coins).");
            Assert.AreEqual(85, confidantPrice, "Confidant tier should have 15% discount (85 coins).");
            Assert.Less(confidantPrice, strangerPrice, "Higher trust tier should result in a lower purchase price.");
        }

        [Test]
        public void TestBarterPayoutScaling()
        {
            vendor.currentTrustTier = TrustTier.Stranger;
            int strangerPayout = vendor.CalculateBarterPayout(100);

            vendor.currentTrustTier = TrustTier.Confidant;
            int confidantPayout = vendor.CalculateBarterPayout(100);

            Assert.AreEqual(50, strangerPayout, "Stranger tier barter payout should be 50% base.");
            Assert.AreEqual(53, confidantPayout, "Confidant tier barter payout should receive trust bonus (53 coins).");
            Assert.Greater(confidantPayout, strangerPayout, "Higher trust tier should yield higher barter payout.");
        }

        [Test]
        public void TestAddTrustPointsClampingAndTiers()
        {
            vendor.AddTrustPoints(15);
            Assert.AreEqual(15, vendor.trustPoints);
            Assert.AreEqual(TrustTier.Stranger, vendor.currentTrustTier);

            vendor.AddTrustPoints(10); // 25
            Assert.AreEqual(25, vendor.trustPoints);
            Assert.AreEqual(TrustTier.Acquaintance, vendor.currentTrustTier);

            vendor.AddTrustPoints(30); // 55
            Assert.AreEqual(55, vendor.trustPoints);
            Assert.AreEqual(TrustTier.Trusted, vendor.currentTrustTier);

            vendor.AddTrustPoints(30); // 85
            Assert.AreEqual(85, vendor.trustPoints);
            Assert.AreEqual(TrustTier.Confidant, vendor.currentTrustTier);

            // Test Upper Bound Clamp
            vendor.AddTrustPoints(50);
            Assert.AreEqual(100, vendor.trustPoints, "Trust points must clamp at 100 maximum.");

            // Test Lower Bound Clamp
            vendor.AddTrustPoints(-200);
            Assert.AreEqual(0, vendor.trustPoints, "Trust points must clamp at 0 minimum.");
            Assert.AreEqual(TrustTier.Stranger, vendor.currentTrustTier);
        }

        [Test]
        public void TestTieredInventoryUnlocking()
        {
            vendor.inventory.Add(new VendorItemSlot
            {
                itemId = "common_tea",
                basePrice = 10,
                requiredTrust = TrustTier.Stranger,
                stockCount = 5
            });

            vendor.inventory.Add(new VendorItemSlot
            {
                itemId = "rare_spices",
                basePrice = 50,
                requiredTrust = TrustTier.Trusted,
                stockCount = 2
            });

            vendor.inventory.Add(new VendorItemSlot
            {
                itemId = "master_blueprint",
                basePrice = 200,
                requiredTrust = TrustTier.Confidant,
                stockCount = 1,
                isSpecialtyBlueprint = true
            });

            // At Stranger: only common_tea unlocked
            vendor.currentTrustTier = TrustTier.Stranger;
            var available = vendor.GetAvailableStock();
            Assert.AreEqual(1, available.Count);
            Assert.AreEqual("common_tea", available[0].itemId);

            // At Trusted: common_tea and rare_spices unlocked
            vendor.currentTrustTier = TrustTier.Trusted;
            available = vendor.GetAvailableStock();
            Assert.AreEqual(2, available.Count);

            // At Confidant: all 3 unlocked
            vendor.currentTrustTier = TrustTier.Confidant;
            available = vendor.GetAvailableStock();
            Assert.AreEqual(3, available.Count);
        }

        [Test]
        public void TestMemoryFlagGatedStock()
        {
            vendor.currentTrustTier = TrustTier.Confidant;
            vendor.inventory.Add(new VendorItemSlot
            {
                itemId = "secret_ledger_goods",
                basePrice = 80,
                requiredTrust = TrustTier.Acquaintance,
                requiredMemoryFlag = "helped_with_records",
                stockCount = 3
            });

            // Even with Confidant tier, memory flag is missing
            var available = vendor.GetAvailableStock();
            Assert.AreEqual(0, available.Count, "Item with required memory flag must remain locked if memory is missing.");

            // Record memory
            NPCMemoryStore.RecordMemory(vendor.vendorId, "helped_with_records");
            available = vendor.GetAvailableStock();
            Assert.AreEqual(1, available.Count, "Item with required memory flag must unlock when memory is recorded.");
            Assert.AreEqual("secret_ledger_goods", available[0].itemId);
        }

        [Test]
        public void TestRegionalScarcityModifier()
        {
            vendor.currentTrustTier = TrustTier.Stranger;
            int standardPrice = vendor.CalculatePurchasePrice(100, 1.0f);
            int scarcePrice = vendor.CalculatePurchasePrice(100, 1.5f);
            int abundantPrice = vendor.CalculatePurchasePrice(100, 0.8f);

            Assert.AreEqual(100, standardPrice);
            Assert.AreEqual(150, scarcePrice, "Regional scarcity modifier of 1.5 should increase price to 150.");
            Assert.AreEqual(80, abundantPrice, "Regional scarcity modifier of 0.8 should decrease price to 80.");
        }
    }
}
#endif
