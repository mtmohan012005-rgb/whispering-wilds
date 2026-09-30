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
        public bool JumpTriggered => jumpBufferTimer > 0f || simJump;
        public bool InteractTriggered => interactBufferTimer > 0f || simInteract;
        public bool JournalTriggered => journalBufferTimer > 0f || simJournal;
        public bool PhotoModeTriggered => photoBufferTimer > 0f || simPhoto;

        private float jumpBufferTimer = 0f;
        private float interactBufferTimer = 0f;
        private float journalBufferTimer = 0f;
        private float photoBufferTimer = 0f;

        // Simulation hooks for automated testing
        private bool isSimulated = false;
        private Vector2 simMove;
        private bool simSprint;
        private bool simCrouch;
        private bool simJump;
        private bool simInteract;
        private bool simJournal;
        private bool simPhoto;

        public void SetSimulatedMovement(Vector2 move, bool sprint = false, bool crouch = false)
        {
            isSimulated = true;
            simMove = move;
            simSprint = sprint;
            simCrouch = crouch;
        }

        public void TriggerSimulatedJump()
        {
            simJump = true;
        }

        public void TriggerSimulatedInteract()
        {
            simInteract = true;
        }

        public void ClearSimulation()
        {
            isSimulated = false;
            simMove = Vector2.zero;
            simSprint = false;
            simCrouch = false;
            simJump = false;
            simInteract = false;
            simJournal = false;
            simPhoto = false;
        }

        private void Update()
        {
            // Decrement buffer timers
            if (jumpBufferTimer > 0f) jumpBufferTimer -= Time.deltaTime;
            if (interactBufferTimer > 0f) interactBufferTimer -= Time.deltaTime;
            if (journalBufferTimer > 0f) journalBufferTimer -= Time.deltaTime;
            if (photoBufferTimer > 0f) photoBufferTimer -= Time.deltaTime;

            if (isSimulated)
            {
                MoveInput = simMove;
                IsSprinting = simSprint;
                IsCrouching = simCrouch;
                return;
            }

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

                if (keyboard.spaceKey.wasPressedThisFrame) jumpBufferTimer = 0.15f;
                if (keyboard.eKey.wasPressedThisFrame) interactBufferTimer = 0.15f;
                if (keyboard.jKey.wasPressedThisFrame) journalBufferTimer = 0.15f;
                if (keyboard.pKey.wasPressedThisFrame) photoBufferTimer = 0.15f;
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

                if (gamepad.buttonSouth.wasPressedThisFrame) jumpBufferTimer = 0.15f;
                if (gamepad.buttonWest.wasPressedThisFrame) interactBufferTimer = 0.15f;
                if (gamepad.selectButton.wasPressedThisFrame) journalBufferTimer = 0.15f;
                if (gamepad.dpad.up.wasPressedThisFrame) photoBufferTimer = 0.15f;
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

            if (Input.GetKeyDown(KeyCode.Space)) jumpBufferTimer = 0.15f;
            if (Input.GetKeyDown(KeyCode.E)) interactBufferTimer = 0.15f;
            if (Input.GetKeyDown(KeyCode.J)) journalBufferTimer = 0.15f;
            if (Input.GetKeyDown(KeyCode.P)) photoBufferTimer = 0.15f;

            float lookX = Input.GetAxis("Mouse X") * mouseSensitivity;
            float lookY = Input.GetAxis("Mouse Y") * mouseSensitivity * (invertY ? 1f : -1f);
            LookInput = new Vector2(lookX, lookY);
#endif

            MoveInput = Vector2.ClampMagnitude(new Vector2(moveX, moveZ), 1f);
        }

        public void ConsumeJump()
        {
            jumpBufferTimer = 0f;
            simJump = false;
        }

        public void ConsumeInteract()
        {
            interactBufferTimer = 0f;
            simInteract = false;
        }

        public void ConsumeJournal()
        {
            journalBufferTimer = 0f;
            simJournal = false;
        }

        public void ConsumePhotoMode()
        {
            photoBufferTimer = 0f;
            simPhoto = false;
        }
    }
}
