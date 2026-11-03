#if UNITY_EDITOR
using System.IO;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Player;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class PlayerGameplayAnimationTests
    {
        private GameObject playerHost;
        private PlayerAnimationStateController animController;

        [SetUp]
        public void SetUp()
        {
            playerHost = new GameObject("PlayerAnimationTestHost");
            animController = playerHost.AddComponent<PlayerAnimationStateController>();
        }

        [TearDown]
        public void TearDown()
        {
            if (playerHost != null)
            {
                Object.DestroyImmediate(playerHost);
            }
        }

        [Test]
        public void TestGameplayClips_AllExistOnDisk()
        {
            string[] requiredClips = new string[]
            {
                "Assets/_Project/Art/Characters/Procedural/Clips/PlayerHarvestSickle.anim",
                "Assets/_Project/Art/Characters/Procedural/Clips/PlayerAimCamera.anim",
                "Assets/_Project/Art/Characters/Procedural/Clips/PlayerInteractInspect.anim",
                "Assets/_Project/Art/Characters/Procedural/Clips/NilgiriTahr_Walk.anim",
                "Assets/_Project/Art/Characters/Procedural/Clips/NilgiriTahr_Graze.anim"
            };

            foreach (var relPath in requiredClips)
            {
                string fullPath = Path.Combine(Application.dataPath, "..", relPath);
                Assert.IsTrue(File.Exists(fullPath), $"Expected animation clip at: {relPath}");
                var fileInfo = new FileInfo(fullPath);
                Assert.Greater(fileInfo.Length, 500, $"Expected valid YAML animation data in: {relPath}");
            }
        }

        [Test]
        public void TestPlayerAnimationStateController_AimCameraToggle()
        {
            bool stateChanged = false;
            bool lastAimState = false;

            animController.OnCameraAimStateChanged += (aiming) =>
            {
                stateChanged = true;
                lastAimState = aiming;
            };

            Assert.IsFalse(animController.isAimingCamera);

            animController.SetAimingCamera(true);
            Assert.IsTrue(animController.isAimingCamera);
            Assert.IsTrue(stateChanged);
            Assert.IsTrue(lastAimState);

            stateChanged = false;
            animController.SetAimingCamera(false);
            Assert.IsFalse(animController.isAimingCamera);
            Assert.IsTrue(stateChanged);
            Assert.IsFalse(lastAimState);
        }

        [Test]
        public void TestPlayerAnimationStateController_HarvestTrigger()
        {
            bool harvestTriggered = false;
            string cropHarvested = string.Empty;

            animController.OnHarvestActionTriggered += (cropId) =>
            {
                harvestTriggered = true;
                cropHarvested = cropId;
            };

            animController.TriggerHarvest("Cauvery_Paddy_IR20");

            Assert.IsTrue(animController.isHarvesting);
            Assert.IsTrue(harvestTriggered);
            Assert.AreEqual("Cauvery_Paddy_IR20", cropHarvested);

            animController.ResetInteractionFlags();
            Assert.IsFalse(animController.isHarvesting);
        }

        [Test]
        public void TestPlayerAnimationStateController_InteractionTrigger()
        {
            bool interactionTriggered = false;
            InteractionType triggeredType = InteractionType.None;

            animController.OnInteractionPoseTriggered += (type) =>
            {
                interactionTriggered = true;
                triggeredType = type;
            };

            animController.TriggerInteraction(InteractionType.Inspect);

            Assert.IsTrue(animController.isInteracting);
            Assert.IsTrue(interactionTriggered);
            Assert.AreEqual(InteractionType.Inspect, triggeredType);
            Assert.AreEqual(InteractionType.Inspect, animController.currentInteractionType);

            animController.ResetInteractionFlags();
            Assert.IsFalse(animController.isInteracting);
            Assert.AreEqual(InteractionType.None, animController.currentInteractionType);
        }
    }
}
#endif
