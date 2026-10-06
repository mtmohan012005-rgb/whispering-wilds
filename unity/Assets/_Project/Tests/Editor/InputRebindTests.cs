using System.IO;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Player;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Documents the *default* rebinding catalog so any change to the shipped input bindings is
    /// caught: the action asset must contain the canonical key/gamepad bindings, and the gameplay
    /// handler must expose the hard-coded defaults with no Settings controller present.
    /// </summary>
    /// <remarks>
    /// The game currently ships without an interactive rebinding UI, so these bindings are the
    /// contract for the player. If rebinding is later added, this contract must be lifted.
    /// </remarks>
    public class InputRebindTests
    {
        private static string ActionAssetText()
        {
            string path = Path.Combine(Application.dataPath, "InputSystem_Actions.inputactions");
            Assert.That(File.Exists(path), Is.True, $"Input action asset not found at '{path}'.");
            return File.ReadAllText(path);
        }

        [Test]
        public void ActionAsset_ContainsCanonicalKeyboardBindings()
        {
            string asset = ActionAssetText();

            Assert.That(asset, Does.Contain("\"Move\""), "Move action missing.");
            Assert.That(asset, Does.Contain("\"<Keyboard>/w\""), "Move/W missing.");
            Assert.That(asset, Does.Contain("\"<Keyboard>/a\""), "Move/A missing.");
            Assert.That(asset, Does.Contain("\"<Keyboard>/s\""), "Move/S missing.");
            Assert.That(asset, Does.Contain("\"<Keyboard>/d\""), "Move/D missing.");

            Assert.That(asset, Does.Contain("\"Look\""), "Look action missing.");
            Assert.That(asset.Contains("\"<Mouse>/delta\"") || asset.Contains("\"<Pointer>/delta\""), Is.True, "Look delta missing.");

            Assert.That(asset, Does.Contain("\"Jump\""), "Jump action missing.");
            Assert.That(asset, Does.Contain("\"<Keyboard>/space\""), "Jump/Space missing.");

            Assert.That(asset, Does.Contain("\"Sprint\""), "Sprint action missing.");
            Assert.That(asset, Does.Contain("\"<Keyboard>/leftShift\""), "Sprint/LeftShift missing.");

            Assert.That(asset, Does.Contain("\"Interact\""), "Interact action missing.");
            Assert.That(asset, Does.Contain("\"<Keyboard>/e\""), "Interact/E missing.");

            Assert.That(asset, Does.Contain("\"Crouch\""), "Crouch action missing.");
            Assert.That(asset, Does.Contain("\"<Keyboard>/c\""), "Crouch/C missing.");
        }

        [Test]
        public void ActionAsset_ContainsGamepadFallbacks()
        {
            string asset = ActionAssetText();

            Assert.That(asset, Does.Contain("\"<Gamepad>/leftStick\""), "Move/leftStick missing.");
            Assert.That(asset, Does.Contain("\"<Gamepad>/rightStick\""), "Look/rightStick missing.");
            Assert.That(asset, Does.Contain("\"<Gamepad>/buttonSouth\""), "Jump/buttonSouth missing.");
            Assert.That(asset, Does.Contain("\"<Gamepad>/buttonWest\""), "Interact/buttonWest missing.");
            Assert.That(asset, Does.Contain("\"<Gamepad>/buttonEast\""), "Sprint/buttonEast missing.");
        }

        [Test]
        public void PlayerInputHandler_ExposesCanonicalDefaultBindings()
        {
            var go = new GameObject("TestPlayer");
            PlayerInputHandler handler = go.AddComponent<PlayerInputHandler>();

            // Canonical defaults, when no Settings controller has overridden anything.
            Assert.That(handler.mouseSensitivity, Is.EqualTo(1.0f));
            Assert.That(handler.gamepadSensitivity, Is.EqualTo(2.0f));
            Assert.That(handler.invertY, Is.False);
            Assert.That(handler.sprintKey, Is.Not.EqualTo(KeyCode.None));
            Assert.That(handler.crouchKey, Is.Not.EqualTo(KeyCode.None));
            Assert.That(handler.jumpKey, Is.Not.EqualTo(KeyCode.None));
            Assert.That(handler.interactKey, Is.Not.EqualTo(KeyCode.None));

            Object.DestroyImmediate(go);
        }

        [Test]
        public void SimulatedMovement_ReadsRawGamepadVector()
        {
            var go = new GameObject("TestPlayer");
            PlayerInputHandler handler = go.AddComponent<PlayerInputHandler>();

            handler.SetSimulatedMovement(new Vector2(-0.5f, 0.25f));
            Assert.That(handler.GetSimulatedMovement().x, Is.EqualTo(-0.5f).Within(1e-4f));
            Assert.That(handler.GetSimulatedMovement().y, Is.EqualTo(0.25f).Within(1e-4f));

            handler.ClearSimulation();
            Assert.That(handler.GetSimulatedMovement().magnitude, Is.EqualTo(0f).Within(1e-4f));

            Object.DestroyImmediate(go);
        }
    }
}