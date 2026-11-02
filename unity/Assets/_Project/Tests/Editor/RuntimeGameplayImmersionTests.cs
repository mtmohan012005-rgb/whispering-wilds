#if UNITY_EDITOR
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Ecology;
using WhisperingWilds.Environment;
using WhisperingWilds.Loops;
using WhisperingWilds.Player;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class RuntimeGameplayImmersionTests
    {
        private GameObject testHost;
        private AnimalAIController animalAI;
        private WildlifeEcologySystem ecologySystem;
        private PlayerAnimationStateController animController;
        private WildlifeViewfinderHUD viewfinderHUD;
        private TimeAndWeatherManager weatherManager;
        private AgricultureSystem agricultureSystem;

        [SetUp]
        public void SetUp()
        {
            testHost = new GameObject("TestImmersionHost");

            ecologySystem = testHost.AddComponent<WildlifeEcologySystem>();
            animalAI = testHost.AddComponent<AnimalAIController>();
            animalAI.ecologySystem = ecologySystem;

            animController = testHost.AddComponent<PlayerAnimationStateController>();
            viewfinderHUD = testHost.AddComponent<WildlifeViewfinderHUD>();
            viewfinderHUD.ecologySystem = ecologySystem;

            agricultureSystem = testHost.AddComponent<AgricultureSystem>();
            weatherManager = testHost.AddComponent<TimeAndWeatherManager>();
            weatherManager.agricultureSystem = agricultureSystem;
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
        // 1. Animal AI & NavMesh Behavioral State Machine Tests
        // ====================================================================

        [Test]
        public void TestAnimalAI_StateTransitions_AlertAndFleeingOnThreatProximity()
        {
            GameObject threatObj = new GameObject("ThreatPlayer");
            threatObj.transform.position = new Vector3(0, 0, 20); // 20m away -> Grazing
            animalAI.transform.position = Vector3.zero;
            animalAI.targetThreat = threatObj.transform;

            animalAI.alertDistance = 15f;
            animalAI.fleeDistance = 7f;

            animalAI.EvaluateThreatProximity();
            Assert.AreEqual(AnimalState.Grazing, animalAI.currentState);

            // Move threat into alert distance (10m)
            threatObj.transform.position = new Vector3(0, 0, 10);
            animalAI.EvaluateThreatProximity();
            Assert.AreEqual(AnimalState.Alert, animalAI.currentState);

            // Move threat into flee distance (5m)
            bool spookedFired = false;
            animalAI.OnSpooked += (dir) => { spookedFired = true; };

            threatObj.transform.position = new Vector3(0, 0, 5);
            animalAI.EvaluateThreatProximity();
            Assert.AreEqual(AnimalState.Fleeing, animalAI.currentState);
            Assert.IsTrue(spookedFired);

            Object.DestroyImmediate(threatObj);
        }

        [Test]
        public void TestAnimalAI_ElevatedStress_IncreasesFleeDistance()
        {
            GameObject threatObj = new GameObject("ThreatPlayer");
            threatObj.transform.position = new Vector3(0, 0, 10);
            animalAI.transform.position = Vector3.zero;
            animalAI.targetThreat = threatObj.transform;
            animalAI.fleeDistance = 7f;

            // At baseline stress (10f), 10m does not trigger flee
            ecologySystem.herdStressLevel = 10f;
            animalAI.EvaluateThreatProximity();
            Assert.AreNotEqual(AnimalState.Fleeing, animalAI.currentState);

            // At maximum stress (100f), flee distance scales by 1.5x (7f * 1.5 = 10.5m) -> 10m triggers flee!
            ecologySystem.herdStressLevel = 100f;
            animalAI.EvaluateThreatProximity();
            Assert.AreEqual(AnimalState.Fleeing, animalAI.currentState);

            Object.DestroyImmediate(threatObj);
        }

        // ====================================================================
        // 2. Player Animation State Machine Tests
        // ====================================================================

        [Test]
        public void TestPlayerAnimationState_AimCamera_TogglesStateCorrectly()
        {
            bool aimState = false;
            animController.OnCameraAimStateChanged += (aiming) => { aimState = aiming; };

            animController.SetAimingCamera(true);
            Assert.IsTrue(animController.isAimingCamera);
            Assert.IsTrue(aimState);

            animController.SetAimingCamera(false);
            Assert.IsFalse(animController.isAimingCamera);
            Assert.IsFalse(aimState);
        }

        [Test]
        public void TestPlayerAnimationState_TriggerHarvestAndInteraction()
        {
            string harvestedCrop = null;
            animController.OnHarvestActionTriggered += (id) => { harvestedCrop = id; };

            animController.TriggerHarvest("nilgiris_tea");
            Assert.IsTrue(animController.isHarvesting);
            Assert.AreEqual("nilgiris_tea", harvestedCrop);

            InteractionType triggeredPose = InteractionType.None;
            animController.OnInteractionPoseTriggered += (t) => { triggeredPose = t; };

            animController.TriggerInteraction(InteractionType.Inspect);
            Assert.IsTrue(animController.isInteracting);
            Assert.AreEqual(InteractionType.Inspect, triggeredPose);

            animController.ResetInteractionFlags();
            Assert.IsFalse(animController.isHarvesting);
            Assert.IsFalse(animController.isInteracting);
        }

        // ====================================================================
        // 3. Wildlife Viewfinder HUD Tests
        // ====================================================================

        [Test]
        public void TestViewfinderHUD_OpenCloseAndZoom()
        {
            viewfinderHUD.OpenViewfinder();
            Assert.IsTrue(viewfinderHUD.IsActive);

            viewfinderHUD.SetZoom(3.5f);
            Assert.AreEqual(3.5f, viewfinderHUD.currentZoom, 0.01f);

            // Zoom clamping
            viewfinderHUD.SetZoom(10.0f);
            Assert.AreEqual(viewfinderHUD.maxZoom, viewfinderHUD.currentZoom, 0.01f);

            viewfinderHUD.CloseViewfinder();
            Assert.IsFalse(viewfinderHUD.IsActive);
        }

        [Test]
        public void TestViewfinderHUD_PhotoEvaluation_OptimalDistanceGivesBonus()
        {
            GameObject animalObj = new GameObject("TestAnimal");
            animalObj.transform.position = new Vector3(0, 0, 15); // 15m is optimal

            viewfinderHUD.SetTarget(animalObj.transform, "nilgiri_tahr", WildlifeBehavior.Grazing);
            PhotoSnapshotResult result = viewfinderHUD.TakeSnapshot();

            // Optimal distance gives base 100 + 50 (dist) + 30 (centered) = 180
            Assert.AreEqual("nilgiri_tahr", result.speciesId);
            Assert.GreaterOrEqual(result.calculatedResearchScore, 100);

            Object.DestroyImmediate(animalObj);
        }

        // ====================================================================
        // 4. Dynamic Time of Day & Weather System Tests
        // ====================================================================

        [Test]
        public void TestTimeAndWeather_AdvanceTime_RollsOverAt24Hours()
        {
            weatherManager.timeOfDay = 23.5f;
            weatherManager.dayDurationMinutes = 24f; // 1 min per in-game hour

            // Advance by 120 real seconds = 2 in-game hours -> 23.5 + 2.0 = 25.5 % 24 = 1.5
            weatherManager.AdvanceTime(120f);
            Assert.AreEqual(1.5f, weatherManager.timeOfDay, 0.05f);
        }

        [Test]
        public void TestTimeAndWeather_MonsoonRain_ReplenishesCropMoisture()
        {
            agricultureSystem.PlantCrop("cauvery_paddy", RegionClimate.CauveryDelta, 80f);
            agricultureSystem.activeCrop.currentWaterLevel = 40f;

            weatherManager.SetWeather(WeatherState.MonsoonRain);
            weatherManager.monsoonRainfallRate = 60f; // 60 units per in-game hour

            // Advance 60 real seconds at 24 min day = 1 in-game hour
            weatherManager.UpdateAgriculturalMoisture(60f);

            // Water level should have increased by ~60 units (up to 100 max)
            Assert.AreEqual(100f, agricultureSystem.activeCrop.currentWaterLevel, 0.1f);
        }

        [Test]
        public void TestTimeAndWeather_ClearMidday_AcceleratesEvaporation()
        {
            agricultureSystem.PlantCrop("cauvery_paddy", RegionClimate.CauveryDelta, 50f);
            agricultureSystem.activeCrop.currentWaterLevel = 50f;

            weatherManager.timeOfDay = 12f; // Midday noon
            weatherManager.SetWeather(WeatherState.Clear);

            weatherManager.UpdateAgriculturalMoisture(60f); // 1 in-game hour

            // Water level should have decreased due to midday sun evaporation
            Assert.Less(agricultureSystem.activeCrop.currentWaterLevel, 50f);
        }
    }
}
#endif
