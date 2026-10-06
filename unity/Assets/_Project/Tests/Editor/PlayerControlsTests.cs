using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Player;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Automated EditMode verification for Player input handling and locomotion controls.
    /// </summary>
    public class PlayerControlsTests
    {
        private GameObject playerGo;
        private PlayerInputHandler inputHandler;
        private CharacterController characterController;
        private PlayerMovement playerMovement;

        [SetUp]
        public void SetUp()
        {
            playerGo = new GameObject("TestPlayer");
            characterController = playerGo.AddComponent<CharacterController>();
            inputHandler = playerGo.AddComponent<PlayerInputHandler>();
            playerMovement = playerGo.AddComponent<PlayerMovement>();
        }

        [TearDown]
        public void TearDown()
        {
            if (playerGo != null)
            {
                Object.DestroyImmediate(playerGo);
            }
        }

        [Test]
        public void InputHandler_DefaultsAreClean()
        {
            Assert.AreEqual(Vector2.zero, inputHandler.MoveInput);
            Assert.IsFalse(inputHandler.IsSprinting);
            Assert.IsFalse(inputHandler.IsCrouching);
            Assert.IsFalse(inputHandler.JumpTriggered);
            Assert.IsFalse(inputHandler.InteractTriggered);
        }

        [Test]
        public void InputHandler_SimulatedForwardMovement_SetsMoveInput()
        {
            inputHandler.SetSimulatedMovement(Vector2.up, sprint: false, crouch: false);
            Assert.AreEqual(Vector2.up, inputHandler.MoveInput);
            Assert.IsFalse(inputHandler.IsSprinting);
            Assert.IsFalse(inputHandler.IsCrouching);
        }

        [Test]
        public void InputHandler_SimulatedSprint_EnablesSprinting()
        {
            inputHandler.SetSimulatedMovement(Vector2.up, sprint: true, crouch: false);
            Assert.IsTrue(inputHandler.IsSprinting);
            Assert.IsFalse(inputHandler.IsCrouching);
        }

        [Test]
        public void InputHandler_SimulatedCrouch_EnablesCrouching()
        {
            inputHandler.SetSimulatedMovement(Vector2.right, sprint: false, crouch: true);
            Assert.IsTrue(inputHandler.IsCrouching);
            Assert.IsFalse(inputHandler.IsSprinting);
        }

        [Test]
        public void InputHandler_SimulatedJump_TriggersJump()
        {
            inputHandler.TriggerSimulatedJump();
            Assert.IsTrue(inputHandler.JumpTriggered);
        }

        [Test]
        public void InputHandler_SimulatedInteract_TriggersInteract()
        {
            inputHandler.TriggerSimulatedInteract();
            Assert.IsTrue(inputHandler.InteractTriggered);
        }

        [Test]
        public void InputHandler_ClearSimulation_ResetsState()
        {
            inputHandler.SetSimulatedMovement(Vector2.up, sprint: true, crouch: true);
            inputHandler.TriggerSimulatedJump();
            inputHandler.TriggerSimulatedInteract();

            inputHandler.ClearSimulation();

            Assert.AreEqual(Vector2.zero, inputHandler.MoveInput);
            Assert.IsFalse(inputHandler.IsSprinting);
            Assert.IsFalse(inputHandler.IsCrouching);
            Assert.IsFalse(inputHandler.JumpTriggered);
            Assert.IsFalse(inputHandler.InteractTriggered);
        }

        [Test]
        public void PlayerMovement_InitializesWithComponents()
        {
            Assert.IsNotNull(playerMovement);
            Assert.IsNotNull(characterController);
            Assert.IsNotNull(inputHandler);
            Assert.AreEqual(Vector3.zero, playerMovement.Velocity);
        }
    }
}
