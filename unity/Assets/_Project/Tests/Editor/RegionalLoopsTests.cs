#if UNITY_EDITOR
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Crafting;
using WhisperingWilds.Ecology;
using WhisperingWilds.Loops;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class RegionalLoopsTests
    {
        private GameObject testHost;
        private AgricultureSystem agricultureSystem;
        private WildlifeEcologySystem ecologySystem;
        private RegionalCraftingSystem craftingSystem;

        [SetUp]
        public void SetUp()
        {
            testHost = new GameObject("TestRegionalLoopsHost");
            agricultureSystem = testHost.AddComponent<AgricultureSystem>();
            ecologySystem = testHost.AddComponent<WildlifeEcologySystem>();
            craftingSystem = testHost.AddComponent<RegionalCraftingSystem>();
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
        // 1. Agriculture System Tests
        // ====================================================================

        [Test]
        public void TestAgriculture_CropGrowth_TransitionsStatesCorrectly()
        {
            agricultureSystem.PlantCrop("cauvery_paddy", RegionClimate.CauveryDelta, 50f);
            Assert.AreEqual(CropState.Seeded, agricultureSystem.activeCrop.currentState);

            // Tick 2 hours at base growth rate 10 = +20% -> Sprouting
            agricultureSystem.SimulateTick(2f, 10f);
            Assert.AreEqual(CropState.Sprouting, agricultureSystem.activeCrop.currentState);

            // Tick 4 more hours = +40% (total 60%) -> Maturing
            agricultureSystem.SimulateTick(4f, 10f);
            Assert.AreEqual(CropState.Maturing, agricultureSystem.activeCrop.currentState);

            // Tick 4 more hours = +40% (total 100%) -> ReadyForHarvest
            agricultureSystem.SimulateTick(4f, 10f);
            Assert.AreEqual(CropState.ReadyForHarvest, agricultureSystem.activeCrop.currentState);

            // Verify harvest
            bool harvested = agricultureSystem.TryHarvest(out string harvestedId);
            Assert.IsTrue(harvested);
            Assert.AreEqual("cauvery_paddy", harvestedId);
            Assert.IsNull(agricultureSystem.activeCrop);
        }

        [Test]
        public void TestAgriculture_DroughtCausesWithering()
        {
            agricultureSystem.PlantCrop("nilgiri_tea", RegionClimate.Nilgiris, 60f);

            // Simulate extreme drought: environmental moisture = 0, delta = 5 hours
            // water loss = (0 - 5) * 5 = -25 -> drops water level to 35, then next tick below 18 (30% of 60)
            agricultureSystem.SimulateTick(10f, 0f);

            Assert.AreEqual(CropState.Withered, agricultureSystem.activeCrop.currentState,
                "Crop should wither when moisture falls below critical threshold.");
        }

        // ====================================================================
        // 2. Wildlife Ecology & Research Photography Tests
        // ====================================================================

        [Test]
        public void TestWildlife_PhotographEvaluation_OptimalDistanceAndFraming()
        {
            ecologySystem.regionId = "nilgiris";
            
            // Distance = 10m (optimal: +50), centered (+30), action shot (+50), base 100 -> score 230
            var photo = ecologySystem.EvaluatePhotograph("nilgiri_tahr", 10f, true, true);

            Assert.AreEqual("nilgiri_tahr", photo.speciesId);
            Assert.AreEqual(230, photo.calculatedResearchScore);
            Assert.IsTrue(photo.isCenteredInFrame);
            Assert.IsTrue(photo.isActionShot);
        }

        [Test]
        public void TestWildlife_PhotographEvaluation_TooCloseSpooksHerd()
        {
            ecologySystem.regionId = "nilgiris";
            ecologySystem.herdStressLevel = 10f;

            // Distance = 2m (too close: -40, base 100, not centered, no action) -> score 60
            // Also adds +15 stress because distance < 5m
            var photo = ecologySystem.EvaluatePhotograph("nilgiri_tahr", 2f, false, false);

            Assert.AreEqual(60, photo.calculatedResearchScore);
            Assert.AreEqual(25f, ecologySystem.herdStressLevel, "Getting within 5m must increase herd stress.");
        }

        [Test]
        public void TestWildlife_StressShiftsBehavior()
        {
            ecologySystem.regionId = "nilgiris";
            ecologySystem.herdStressLevel = 10f;
            ecologySystem.currentBehavior = WildlifeBehavior.Grazing;

            // Moderate stress: Alert
            ecologySystem.AdjustHerdStress(40f); // 50
            Assert.AreEqual(WildlifeBehavior.Alert, ecologySystem.currentBehavior);

            // Severe stress: Fleeing
            ecologySystem.AdjustHerdStress(30f); // 80 (>70)
            Assert.AreEqual(WildlifeBehavior.Fleeing, ecologySystem.currentBehavior);

            // Calming down below 30: returns to Grazing
            ecologySystem.AdjustHerdStress(-60f); // 20 (<30)
            Assert.AreEqual(WildlifeBehavior.Grazing, ecologySystem.currentBehavior);
        }

        // ====================================================================
        // 3. Regional Crafting System Tests
        // ====================================================================

        [Test]
        public void TestRegionalCrafting_LockedRecipe_CannotCraft()
        {
            craftingSystem.availableRecipes.Add(new RegionalRecipe
            {
                recipeId = "chettinad_brass_lamp",
                recipeName = "Chettinad Brass Lamp",
                targetRegion = "Chettinad",
                resultingItemId = "item_brass_lamp",
                isUnlocked = false
            });

            Assert.IsFalse(craftingSystem.CanCraft("chettinad_brass_lamp"));
            Assert.IsFalse(craftingSystem.CraftItem("chettinad_brass_lamp"));
        }

        [Test]
        public void TestRegionalCrafting_UnlockedRecipe_CraftsSuccessfully()
        {
            craftingSystem.availableRecipes.Add(new RegionalRecipe
            {
                recipeId = "thanjavur_plate_replica",
                recipeName = "Thanjavur Art Plate Replica",
                targetRegion = "Thanjavur",
                resultingItemId = "item_art_plate",
                isUnlocked = true
            });

            string craftedItem = null;
            craftingSystem.OnItemCrafted += (item) => craftedItem = item;

            bool success = craftingSystem.CraftItem("thanjavur_plate_replica");

            Assert.IsTrue(success);
            Assert.AreEqual("item_art_plate", craftedItem);
        }
    }
}
#endif
