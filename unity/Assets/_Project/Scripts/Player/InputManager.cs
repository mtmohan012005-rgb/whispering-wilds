using System;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Single authoritative Input Governor for keyboard, mouse, and gamepads.
    /// Operates exclusively through Unity's New Input System, eliminating legacy
    /// polling exceptions and providing unified state for player locomotion and UI.
    /// </summary>
    [DisallowMultipleComponent]
    public class InputManager : MonoBehaviour
    {
        public static InputManager Instance { get; private set; }

        [Header("Sensitivity & Look")]
        [Range(0.1f, 5f)] public float mouseSensitivity = 1.0f;
        [Range(0.5f, 5f)] public float gamepadSensitivity = 2.0f;
        public bool invertY = false;

        // Authoritative Input Properties
        public Vector2 MoveInput { get; private set; }
        public Vector2 LookInput { get; private set; }
        public bool IsSprinting { get; private set; }
        public bool IsCrouching { get; private set; }
        public bool JumpTriggered { get; private set; }
        public bool InteractTriggered { get; private set; }
        public bool MapTriggered { get; private set; }
        public bool JournalTriggered { get; private set; }
        public bool PhotoModeTriggered { get; private set; }

        private bool jumpConsumed = false;
        private bool interactConsumed = false;
        private bool mapConsumed = false;
        private bool journalConsumed = false;
        private bool photoConsumed = false;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Update()
        {
            ReadUnifiedInputs();
        }

        private void ReadUnifiedInputs()
        {
            float moveX = 0f;
            float moveZ = 0f;
            float lookX = 0f;
            float lookY = 0f;

#if ENABLE_INPUT_SYSTEM
            var kb = Keyboard.current;
            if (kb != null)
            {
                if (kb.wKey.isPressed || kb.upArrowKey.isPressed) moveZ += 1f;
                if (kb.sKey.isPressed || kb.downArrowKey.isPressed) moveZ -= 1f;
                if (kb.aKey.isPressed || kb.leftArrowKey.isPressed) moveX -= 1f;
                if (kb.dKey.isPressed || kb.rightArrowKey.isPressed) moveX += 1f;

                IsSprinting = kb.leftShiftKey.isPressed || kb.rightShiftKey.isPressed;
                IsCrouching = kb.cKey.isPressed;

                if (kb.spaceKey.wasPressedThisFrame) jumpConsumed = false;
                if (kb.eKey.wasPressedThisFrame) interactConsumed = false;
                if (kb.mKey.wasPressedThisFrame) mapConsumed = false;
                if (kb.jKey.wasPressedThisFrame || kb.tabKey.wasPressedThisFrame) journalConsumed = false;
                if (kb.pKey.wasPressedThisFrame) photoConsumed = false;
            }

            var gamepad = Gamepad.current;
            if (gamepad != null)
            {
                Vector2 lStick = gamepad.leftStick.ReadValue();
                if (lStick.sqrMagnitude > 0.04f)
                {
                    moveX += lStick.x;
                    moveZ += lStick.y;
                }

                if (gamepad.leftStickButton.isPressed) IsSprinting = true;
                if (gamepad.buttonEast.isPressed) IsCrouching = true;

                if (gamepad.buttonSouth.wasPressedThisFrame) jumpConsumed = false;
                if (gamepad.buttonWest.wasPressedThisFrame) interactConsumed = false;
                if (gamepad.selectButton.wasPressedThisFrame) mapConsumed = false;
                if (gamepad.dpad.up.wasPressedThisFrame) photoConsumed = false;
            }

            var mouse = Mouse.current;
            if (mouse != null && Cursor.lockState == CursorLockMode.Locked)
            {
                Vector2 delta = mouse.delta.ReadValue();
                lookX = delta.x * mouseSensitivity * 0.1f;
                lookY = delta.y * mouseSensitivity * 0.1f * (invertY ? 1f : -1f);
            }

            if (gamepad != null)
            {
                Vector2 rStick = gamepad.rightStick.ReadValue();
                if (rStick.sqrMagnitude > 0.05f)
                {
                    lookX += rStick.x * gamepadSensitivity * Time.deltaTime * 60f;
                    lookY += rStick.y * gamepadSensitivity * Time.deltaTime * 60f * (invertY ? 1f : -1f);
                }
            }
#endif

            MoveInput = Vector2.ClampMagnitude(new Vector2(moveX, moveZ), 1f);
            LookInput = new Vector2(lookX, lookY);

            JumpTriggered = !jumpConsumed;
            InteractTriggered = !interactConsumed;
            MapTriggered = !mapConsumed;
            JournalTriggered = !journalConsumed;
            PhotoModeTriggered = !photoConsumed;
        }

        public void ConsumeJump() => jumpConsumed = true;
        public void ConsumeInteract() => interactConsumed = true;
        public void ConsumeMap() => mapConsumed = true;
        public void ConsumeJournal() => journalConsumed = true;
        public void ConsumePhotoMode() => photoConsumed = true;
    }
}
