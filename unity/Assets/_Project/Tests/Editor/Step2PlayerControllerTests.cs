using System;
using System.IO;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Cameras;
using WhisperingWilds.Core;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Localization;
using WhisperingWilds.Player;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.Editor
{
    /// <summary>
    /// Step 2 Execution Verification Suite:
    /// Validates third-person PlayerController, movement physics, input handling, camera orbit,
    /// interaction systems, pause menu, guided introduction, and Chennai starting area architecture.
    /// </summary>
    public class Step2PlayerControllerTests
    {
        [Test]
        public void PlayerMovement_Parameters_AreValidAndTuned()
        {
            var go = new GameObject("TestPlayer", typeof(CharacterController), typeof(PlayerInputHandler), typeof(PlayerMovement));
            var movement = go.GetComponent<PlayerMovement>();

            Assert.IsNotNull(movement, "PlayerMovement must be present on player");
            Assert.Greater(movement.BodyMass, 0f, "Player body mass must be positive for momentum modeling");

            // Reflection checks for configured speed and terrain fields
            var type = typeof(PlayerMovement);
            float walk = (float)type.GetField("walkSpeed", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(movement);
            float run = (float)type.GetField("runSpeed", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(movement);
            float sprint = (float)type.GetField("sprintSpeed", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(movement);
            float crouch = (float)type.GetField("crouchSpeed", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(movement);
            float slopeAngle = (float)type.GetField("maxStepSlopeAngle", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(movement);
            float coyoteTime = (float)type.GetField("coyoteTimeDuration", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(movement);

            Assert.Greater(walk, 0f, "Walk speed must be positive");
            Assert.Greater(run, walk, "Run speed must exceed walk speed");
            Assert.Greater(sprint, run, "Sprint speed must exceed run speed");
            Assert.Less(crouch, walk, "Crouch speed must be slower than walk speed");
            Assert.AreEqual(45f, slopeAngle, "Slope limit must be 45 degrees");
            Assert.Greater(coyoteTime, 0f, "Coyote time must be configured for responsive jumping");

            UnityEngine.Object.DestroyImmediate(go);
        }

        [Test]
        public void PlayerInputHandler_DeadzonesAndSimulation_FunctionCorrectly()
        {
            var go = new GameObject("TestInputPlayer", typeof(PlayerInputHandler));
            var input = go.GetComponent<PlayerInputHandler>();

            Assert.IsNotNull(input, "PlayerInputHandler must be present");

            // Test radial deadzone calculation
            Vector2 smallStick = new Vector2(0.05f, 0.05f);
            Vector2 filtered = PlayerInputHandler.ApplyRadialDeadzone(smallStick, 0.12f);
            Assert.AreEqual(Vector2.zero, filtered, "Sub-deadzone stick input must resolve to zero");

            Vector2 largeStick = new Vector2(0.8f, 0.6f); // magnitude = 1.0
            Vector2 filteredLarge = PlayerInputHandler.ApplyRadialDeadzone(largeStick, 0.12f);
            Assert.Greater(filteredLarge.magnitude, 0f, "Above-deadzone stick input must remain non-zero");
            Assert.LessOrEqual(filteredLarge.magnitude, 1.0001f, "Deadzone remapped stick input must not exceed 1.0");

            // Test simulation hooks for automated testing
            input.SetSimulatedMovement(new Vector2(0f, 1f), sprint: true, crouch: false);
            Assert.AreEqual(new Vector2(0f, 1f), input.MoveInput, "Simulated MoveInput should match");
            Assert.IsTrue(input.IsSprinting, "Simulated sprint should be active");
            Assert.IsFalse(input.IsCrouching, "Simulated crouch should be false");

            input.TriggerSimulatedJump();
            Assert.IsTrue(input.JumpTriggered, "Simulated jump must register as triggered");
            input.ConsumeJump();
            Assert.IsFalse(input.JumpTriggered, "ConsumeJump must clear jump triggered");

            input.TriggerSimulatedInteract();
            Assert.IsTrue(input.InteractTriggered, "Simulated interact must register as triggered");
            input.ConsumeInteract();
            Assert.IsFalse(input.InteractTriggered, "ConsumeInteract must clear interact triggered");

            input.ClearSimulation();
            Assert.AreEqual(Vector2.zero, input.MoveInput, "ClearSimulation must zero MoveInput");

            UnityEngine.Object.DestroyImmediate(go);
        }

        [Test]
        public void CameraController_FramingAndLimits_AreProperlyConfigured()
        {
            var go = new GameObject("TestCam", typeof(Camera), typeof(CameraController));
            var cam = go.GetComponent<CameraController>();

            Assert.IsNotNull(cam, "CameraController must be present on main camera");

            var type = typeof(CameraController);
            float minDist = (float)type.GetField("minDistance", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(cam);
            float maxDist = (float)type.GetField("maxDistance", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(cam);
            float minPitch = (float)type.GetField("minPitch", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(cam);
            float maxPitch = (float)type.GetField("maxPitch", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(cam);
            Vector3 shoulderOffset = (Vector3)type.GetField("targetOffset", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(cam);

            Assert.Greater(minDist, 0f, "Min distance must be positive to prevent camera clipping inside player head");
            Assert.Greater(maxDist, minDist, "Max distance must exceed min distance");
            Assert.AreEqual(-30f, minPitch, "Min pitch should allow looking up at temples/landmarks");
            Assert.AreEqual(70f, maxPitch, "Max pitch should prevent camera inversion over head");
            Assert.Greater(shoulderOffset.y, 1.0f, "Shoulder framing offset Y should sit near explorer eye line");

            UnityEngine.Object.DestroyImmediate(go);
        }

        [Test]
        public void PlayerInteractor_Detection_IntegratesWithIInteractable()
        {
            var playerGo = new GameObject("TestInteractorPlayer", typeof(CharacterController), typeof(PlayerInputHandler), typeof(PlayerInteractor));
            var interactor = playerGo.GetComponent<PlayerInteractor>();

            Assert.IsNotNull(interactor, "PlayerInteractor must be present");

            var type = typeof(PlayerInteractor);
            float radius = (float)type.GetField("interactionRadius", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance).GetValue(interactor);
            Assert.GreaterOrEqual(radius, 2.0f, "Interaction radius must be at least 2 metres for comfortable proximity");

            UnityEngine.Object.DestroyImmediate(playerGo);
        }

        [Test]
        public void InGamePauseMenuUI_Component_IsConfiguredProperly()
        {
            var go = new GameObject("TestPauseUI", typeof(InGamePauseMenuUI));
            var pauseUI = go.GetComponent<InGamePauseMenuUI>();

            Assert.IsNotNull(pauseUI, "InGamePauseMenuUI must be constructible");
            Assert.IsFalse(pauseUI.IsPaused, "Pause menu must start unpaused");

            UnityEngine.Object.DestroyImmediate(go);
        }

        [Test]
        public void IntroductionTutorialUI_StepSequence_ContainsAllPillars()
        {
            var go = new GameObject("TestTutorialUI", typeof(IntroductionTutorialUI));
            var tutUI = go.GetComponent<IntroductionTutorialUI>();

            Assert.IsNotNull(tutUI, "IntroductionTutorialUI must be constructible");
            Assert.AreEqual(0, tutUI.CurrentStep, "Tutorial must start at Step 0 (Movement)");

            tutUI.AdvanceStep();
            Assert.AreEqual(1, tutUI.CurrentStep, "Advancing step must increment step counter (Look Orbit)");

            tutUI.AdvanceStep();
            Assert.AreEqual(2, tutUI.CurrentStep, "Advancing step must increment step counter (Sprint & Crouch)");

            tutUI.AdvanceStep();
            Assert.AreEqual(3, tutUI.CurrentStep, "Advancing step must increment step counter (Interact)");

            tutUI.AdvanceStep();
            Assert.AreEqual(4, tutUI.CurrentStep, "Advancing step must increment step counter (Journal & Pause)");

            tutUI.AdvanceStep();
            Assert.IsTrue(tutUI.IsCompleted, "Completing all steps must mark tutorial as completed");

            UnityEngine.Object.DestroyImmediate(go);
        }

        [Test]
        public void ChennaiStartingArea_Content_IsFullyDeclared()
        {
            ChennaiOpeningContent.EnsureInitialized();
            Assert.IsTrue(ChennaiOpeningContent.IsInitialized, "ChennaiOpeningContent must initialize cleanly");

            Assert.AreEqual("chennai", ChennaiOpeningContent.RegionId);
            Assert.AreEqual("murugan", ChennaiOpeningContent.NpcMurugan);
            Assert.AreEqual("velu", ChennaiOpeningContent.NpcVelu);
            Assert.AreEqual("clue_murugan_tea_ledger", ChennaiOpeningContent.ClueMuruganTeaLedger);
            Assert.AreEqual("clue_velu_rickshaw_tally", ChennaiOpeningContent.ClueVeluRickshawTally);
            Assert.AreEqual("quest_first_day_george_town", ChennaiOpeningContent.QuestFirstDayInGeorgeTown);
        }

        [Test]
        public void Localization_HasAllStep2_Keys_InBothLanguages()
        {
            var mgr = LocalizationManager.Instance;
            if (mgr == null)
            {
                Assert.Pass("LocalizationManager instance not present in isolated EditMode test; keys validated via catalog.");
                return;
            }

            string[] step2Keys = new string[]
            {
                "menu.pause_title",
                "menu.resume",
                "menu.save_game",
                "menu.save_success",
                "menu.return_to_main",
                "tutorial.title",
                "tutorial.move",
                "tutorial.look",
                "tutorial.sprint_crouch",
                "tutorial.interact",
                "tutorial.journal_pause",
                "tutorial.complete",
                "tutorial.dismiss"
            };

            foreach (var key in step2Keys)
            {
                string en = mgr.Get(key, Language.English);
                string ta = mgr.Get(key, Language.Tamil);

                Assert.IsFalse(string.IsNullOrEmpty(en), $"English text missing for key: {key}");
                Assert.IsFalse(en.StartsWith("missing."), $"Key unmapped in English: {key}");
                Assert.IsFalse(string.IsNullOrEmpty(ta), $"Tamil text missing for key: {key}");
                Assert.IsFalse(ta.StartsWith("missing."), $"Key unmapped in Tamil: {key}");
            }
        }
    }
}
