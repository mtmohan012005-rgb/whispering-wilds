using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Centralized input handler supporting both Unity's New Input System and legacy fallback.
    /// Provides clean, decoupled input state for PlayerMovement and interaction systems.
    /// </summary>
    [DisallowMultipleComponent]
    public class PlayerInputHandler : MonoBehaviour
    {
        [Header("Sensitivity Settings")]
        [Range(0.1f, 5f)] public float mouseSensitivity = 1.0f;
        [Range(0.5f, 5f)] public float gamepadSensitivity = 2.0f;
        public bool invertY = false;

        // Public readable input properties
        public Vector2 MoveInput { get; private set; }
        public Vector2 LookInput { get; private set; }
        public bool IsSprinting { get; private set; }
        public bool IsCrouching { get; private set; }
        public bool JumpTriggered { get; private set; }
        public bool InteractTriggered { get; private set; }
        public bool JournalTriggered { get; private set; }
        public bool PhotoModeTriggered { get; private set; }

        private bool jumpConsumed = false;
        private bool interactConsumed = false;
        private bool journalConsumed = false;
        private bool photoConsumed = false;

        private void Update()
        {
            ReadInputs();
        }

        private void ReadInputs()
        {
            // 1. Movement axes
            float moveX = 0f;
            float moveZ = 0f;

#if ENABLE_INPUT_SYSTEM
            var keyboard = Keyboard.current;
            var gamepad = Gamepad.current;

            if (keyboard != null)
            {
                if (keyboard.wKey.isPressed || keyboard.upArrowKey.isPressed) moveZ += 1f;
                if (keyboard.sKey.isPressed || keyboard.downArrowKey.isPressed) moveZ -= 1f;
                if (keyboard.aKey.isPressed || keyboard.leftArrowKey.isPressed) moveX -= 1f;
                if (keyboard.dKey.isPressed || keyboard.rightArrowKey.isPressed) moveX += 1f;

                IsSprinting = keyboard.leftShiftKey.isPressed;
                IsCrouching = keyboard.cKey.isPressed;

                if (keyboard.spaceKey.wasPressedThisFrame) jumpConsumed = false;
                if (keyboard.eKey.wasPressedThisFrame) interactConsumed = false;
                if (keyboard.jKey.wasPressedThisFrame) journalConsumed = false;
                if (keyboard.pKey.wasPressedThisFrame) photoConsumed = false;
            }

            if (gamepad != null)
            {
                Vector2 stick = gamepad.leftStick.ReadValue();
                if (stick.sqrMagnitude > 0.05f)
                {
                    moveX = stick.x;
                    moveZ = stick.y;
                }

                if (gamepad.leftStickButton.isPressed) IsSprinting = true;
                if (gamepad.buttonEast.isPressed) IsCrouching = true;

                if (gamepad.buttonSouth.wasPressedThisFrame) jumpConsumed = false;
                if (gamepad.buttonWest.wasPressedThisFrame) interactConsumed = false;
                if (gamepad.selectButton.wasPressedThisFrame) journalConsumed = false;
                if (gamepad.dpad.up.wasPressedThisFrame) photoConsumed = false;
            }

            // Mouse / Gamepad Look
            float lookX = 0f;
            float lookY = 0f;
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

            LookInput = new Vector2(lookX, lookY);
#else
            moveX = Input.GetAxisRaw("Horizontal");
            moveZ = Input.GetAxisRaw("Vertical");
            IsSprinting = Input.GetKey(KeyCode.LeftShift);
            IsCrouching = Input.GetKey(KeyCode.C);

            if (Input.GetKeyDown(KeyCode.Space)) jumpConsumed = false;
            if (Input.GetKeyDown(KeyCode.E)) interactConsumed = false;
            if (Input.GetKeyDown(KeyCode.J)) journalConsumed = false;
            if (Input.GetKeyDown(KeyCode.P)) photoConsumed = false;

            float lookX = Input.GetAxis("Mouse X") * mouseSensitivity;
            float lookY = Input.GetAxis("Mouse Y") * mouseSensitivity * (invertY ? 1f : -1f);
            LookInput = new Vector2(lookX, lookY);
#endif

            MoveInput = Vector2.ClampMagnitude(new Vector2(moveX, moveZ), 1f);

            JumpTriggered = !jumpConsumed;
            InteractTriggered = !interactConsumed;
            JournalTriggered = !journalConsumed;
            PhotoModeTriggered = !photoConsumed;
        }

        public void ConsumeJump() => jumpConsumed = true;
        public void ConsumeInteract() => interactConsumed = true;
        public void ConsumeJournal() => journalConsumed = true;
        public void ConsumePhotoMode() => photoConsumed = true;
    }
}
