#if UNITY_EDITOR
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.NPC;
using WhisperingWilds.Traversal;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class RegionalTravelManagerTests
    {
        private GameObject travelGameObject;
        private RegionalTravelManager travelManager;
        private TravelEncounterSystem encounterSystem;

        [SetUp]
        public void SetUp()
        {
            travelGameObject = new GameObject("TestTravelSystem");
            travelManager = travelGameObject.AddComponent<RegionalTravelManager>();
            encounterSystem = travelGameObject.AddComponent<TravelEncounterSystem>();

            // Setup test map topology: Chennai <-> Mamallapuram <-> Chettinad
            travelManager.worldNodes = new List<TravelNode>
            {
                new TravelNode
                {
                    nodeId = "chennai",
                    regionName = "Chennai George Town",
                    connectedNodeIds = new List<string> { "mamallapuram" },
                    baseTravelHours = 2.0f,
                    dangerLevel = 1,
                    isUnlocked = true
                },
                new TravelNode
                {
                    nodeId = "mamallapuram",
                    regionName = "Mamallapuram Shore",
                    connectedNodeIds = new List<string> { "chennai", "chettinad" },
                    baseTravelHours = 3.0f,
                    dangerLevel = 2,
                    isUnlocked = true
                },
                new TravelNode
                {
                    nodeId = "chettinad",
                    regionName = "Chettinad Heritage",
                    connectedNodeIds = new List<string> { "mamallapuram" },
                    baseTravelHours = 6.0f,
                    dangerLevel = 3,
                    isUnlocked = false // Initially locked
                }
            };

            travelManager.currentNodeId = "chennai";
            travelManager.currentStamina = 100f;
            travelManager.foodRations = 5;
            NPCMemoryStore.Clear();
        }

        [TearDown]
        public void TearDown()
        {
            if (travelGameObject != null)
            {
                Object.DestroyImmediate(travelGameObject);
            }
            NPCMemoryStore.Clear();
        }

        [Test]
        public void TestCanTravelTo_ConnectedAndUnlocked_ReturnsTrue()
        {
            bool canTravel = travelManager.CanTravelTo("mamallapuram");
            Assert.IsTrue(canTravel, "Player should be able to travel to a connected, unlocked destination.");
        }

        [Test]
        public void TestCanTravelTo_LockedNode_ReturnsFalse()
        {
            // Chettinad is connected from Mamallapuram, but locked
            travelManager.currentNodeId = "mamallapuram";
            bool canTravel = travelManager.CanTravelTo("chettinad");
            Assert.IsFalse(canTravel, "Player should NOT be able to travel to a locked destination.");
        }

        [Test]
        public void TestCanTravelTo_DisconnectedNode_ReturnsFalse()
        {
            // Chennai is not directly connected to Chettinad
            travelManager.currentNodeId = "chennai";
            bool canTravel = travelManager.CanTravelTo("chettinad");
            Assert.IsFalse(canTravel, "Player should NOT be able to travel to a disconnected destination.");
        }

        [Test]
        public void TestCanTravelTo_InvalidOrNullNode_ReturnsFalse()
        {
            Assert.IsFalse(travelManager.CanTravelTo(null));
            Assert.IsFalse(travelManager.CanTravelTo(""));
            Assert.IsFalse(travelManager.CanTravelTo("non_existent_node"));
        }

        [Test]
        public void TestInitiateTravel_ConsumesStaminaAndRations()
        {
            travelManager.currentNodeId = "chennai";
            float initialStamina = travelManager.currentStamina; // 100
            int initialRations = travelManager.foodRations;      // 5

            bool success = travelManager.InitiateTravel("mamallapuram"); // baseTravelHours = 3.0 -> staminaCost = 15
            Assert.IsTrue(success);

            Assert.AreEqual("mamallapuram", travelManager.currentNodeId);
            Assert.AreEqual(initialStamina - 15f, travelManager.currentStamina, 0.001f);
            Assert.AreEqual(initialRations - 1, travelManager.foodRations);
        }

        [Test]
        public void TestInitiateTravel_ResourceClampingAtZero()
        {
            travelManager.currentStamina = 5f;
            travelManager.foodRations = 0;

            bool success = travelManager.InitiateTravel("mamallapuram");
            Assert.IsTrue(success);

            Assert.AreEqual(0f, travelManager.currentStamina, "Stamina must clamp at 0.");
            Assert.AreEqual(0, travelManager.foodRations, "Rations must clamp at 0.");
        }

        [Test]
        public void TestInitiateTravel_FiresEventsInOrder()
        {
            string startedFrom = null;
            string startedTo = null;
            string completedAt = null;

            travelManager.OnTravelStarted += (from, to) =>
            {
                startedFrom = from;
                startedTo = to;
            };

            travelManager.OnTravelCompleted += (to) =>
            {
                completedAt = to;
            };

            travelManager.InitiateTravel("mamallapuram");

            Assert.AreEqual("chennai", startedFrom);
            Assert.AreEqual("mamallapuram", startedTo);
            Assert.AreEqual("mamallapuram", completedAt);
        }

        [Test]
        public void TestUnlockNode_EnablesTravel()
        {
            travelManager.currentNodeId = "mamallapuram";
            Assert.IsFalse(travelManager.CanTravelTo("chettinad"));

            travelManager.UnlockNode("chettinad");
            Assert.IsTrue(travelManager.CanTravelTo("chettinad"), "Unlocking node should enable travel.");
        }

        [Test]
        public void TestTravelEncounter_MemoryGating()
        {
            var regularEncounter = new TravelEncounter
            {
                encounterId = "weather_monsoon",
                type = EncounterType.WeatherBlockade,
                description = "Monsoon winds on the coast",
                requiredMemoryFlag = null
            };

            var memoryEncounter = new TravelEncounter
            {
                encounterId = "caravan_records",
                type = EncounterType.MerchantCaravan,
                description = "Cart driver recognizing your ledger assistance",
                requiredMemoryFlag = "helped_with_records"
            };

            Assert.IsTrue(encounterSystem.IsEncounterAvailable(regularEncounter));
            Assert.IsFalse(encounterSystem.IsEncounterAvailable(memoryEncounter, "velu"));

            // Record memory
            NPCMemoryStore.RecordMemory("velu", "helped_with_records");
            Assert.IsTrue(encounterSystem.IsEncounterAvailable(memoryEncounter, "velu"));
        }
    }
}
#endif
