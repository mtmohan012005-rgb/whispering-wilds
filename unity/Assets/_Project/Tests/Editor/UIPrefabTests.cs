#if UNITY_EDITOR
using System.IO;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Loops;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class UIPrefabTests
    {
        private GameObject testHost;
        private AgricultureSystem agricultureSystem;
        private AgricultureMoistureHUD moistureHUD;

        [SetUp]
        public void SetUp()
        {
            testHost = new GameObject("TestUIHost");
            agricultureSystem = testHost.AddComponent<AgricultureSystem>();
            moistureHUD = testHost.AddComponent<AgricultureMoistureHUD>();
        }

        [TearDown]
        public void TearDown()
        {
            if (testHost != null)
            {
                Object.DestroyImmediate(testHost);
            }
        }

        [Test]
        public void TestUIPrefabs_AllExistOnDisk()
        {
            string[] requiredPrefabs = new string[]
            {
                "Assets/_Project/Prefabs/UI/WildlifeViewfinderHUD.prefab",
                "Assets/_Project/Prefabs/UI/BarterShopUI.prefab",
                "Assets/_Project/Prefabs/UI/DialogueBoxUI.prefab",
                "Assets/_Project/Prefabs/UI/AgricultureMoistureHUD.prefab"
            };

            foreach (var relPath in requiredPrefabs)
            {
                string fullPath = Path.Combine(Application.dataPath, "..", relPath);
                Assert.IsTrue(File.Exists(fullPath), $"Expected UI prefab to exist at: {relPath}");
            }
        }

        [Test]
        public void TestAgricultureMoistureHUD_DroughtWarningLogic()
        {
            // Set up UI hierarchy
            var hudRoot = new GameObject("HudRoot");
            hudRoot.transform.SetParent(testHost.transform);

            var moistureTextObj = new GameObject("MoistureText", typeof(Text));
            var moistureText = moistureTextObj.GetComponent<Text>();
            moistureTextObj.transform.SetParent(hudRoot.transform);

            var droughtIndicator = new GameObject("DroughtWarning");
            droughtIndicator.transform.SetParent(hudRoot.transform);
            droughtIndicator.SetActive(false);

            // Plant healthy crop
            agricultureSystem.PlantCrop("Cauvery_IR20", RegionClimate.CauveryDelta, 60f);
            moistureHUD.BindSystem(agricultureSystem);

            // Initially > 30% moisture -> drought inactive
            Assert.AreEqual(60f, agricultureSystem.activeCrop.currentWaterLevel);
            Assert.GreaterOrEqual(agricultureSystem.activeCrop.currentWaterLevel, AgricultureMoistureHUD.DroughtThreshold);

            // Simulate drought below 30%
            agricultureSystem.activeCrop.currentWaterLevel = 22f;
            moistureHUD.RefreshHUD();

            Assert.Less(agricultureSystem.activeCrop.currentWaterLevel, AgricultureMoistureHUD.DroughtThreshold);
        }

        [Test]
        public void TestWildlifeViewfinderHUD_ZoomAndStateTransitions()
        {
            var viewfinderHost = new GameObject("TestViewfinderHost");
            var vh = viewfinderHost.AddComponent<WildlifeViewfinderHUD>();

            Assert.IsFalse(vh.IsActive);

            vh.OpenViewfinder();
            Assert.IsTrue(vh.IsActive);

            vh.SetZoom(3.5f);
            Assert.AreEqual(3.5f, vh.currentZoom);

            vh.SetZoom(10f); // Should clamp to maxZoom (5.0f)
            Assert.AreEqual(5.0f, vh.currentZoom);

            vh.CloseViewfinder();
            Assert.IsFalse(vh.IsActive);

            Object.DestroyImmediate(viewfinderHost);
        }
    }
}
#endif
