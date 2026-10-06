using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using WhisperingWilds.UI;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Centralized input handler integrating InputBindingManager, Unity's New Input System,
    /// and simulation hooks for automated testing.
    /// Drives PlayerMovement, camera look, interactions, and menu shortcuts.
    /// </summary>
    [DisallowMultipleComponent]
    public class PlayerInputHandler : MonoBehaviour
    {
        [Header("Sensitivity Settings")]
        [Range(0.1f, 5f)] public float mouseSensitivity = 1.0f;
        [Range(0.5f, 5f)] public float gamepadSensitivity = 2.0f;
        public bool invertY = false;
        public bool invertX = false;

        public KeyCode sprintKey = KeyCode.LeftShift;
        public KeyCode crouchKey = KeyCode.C;
        public KeyCode jumpKey = KeyCode.Space;
        public KeyCode interactKey = KeyCode.E;

        // Public readable input properties
        public Vector2 MoveInput { get; private set; }
        public Vector2 LookInput { get; private set; }
        public bool IsSprinting { get; private set; }
        public bool IsCrouching { get; private set; }

        public float EffectiveMouseSensitivity =>
            SettingsMenuController.Instance != null ? SettingsMenuController.Instance.mouseSensitivity : mouseSensitivity;

        public float EffectiveMouseSensitivityY =>
            SettingsMenuController.Instance != null ? SettingsMenuController.Instance.mouseSensitivityY : EffectiveMouseSensitivity;

        public float EffectiveGamepadSensitivity =>
            SettingsMenuController.Instance != null ? SettingsMenuController.Instance.gamepadSensitivity : gamepadSensitivity;

        public bool EffectiveInvertY =>
            SettingsMenuController.Instance != null ? SettingsMenuController.Instance.invertY : invertY;

        public bool EffectiveInvertX =>
            SettingsMenuController.Instance != null ? SettingsMenuController.Instance.invertX : invertX;

        // Action buffer properties
        public bool JumpTriggered => jumpBufferTimer > 0f || simJump;
        public bool InteractTriggered => interactBufferTimer > 0f || simInteract;
        public bool JournalTriggered => journalBufferTimer > 0f || simJournal;
        public bool PhotoModeTriggered => photoBufferTimer > 0f || simPhoto;
        public bool CancelTriggered => cancelBufferTimer > 0f || simCancel;
        public bool CraftingTriggered => craftingBufferTimer > 0f || simCrafting;
        public bool QuickSaveTriggered => quickSaveBufferTimer > 0f || simQuickSave;
        public bool QuickLoadTriggered => quickLoadBufferTimer > 0f || simQuickLoad;

        public bool PrimaryActionTriggered => primaryActionBufferTimer > 0f || simPrimaryAction;
        public bool SecondaryActionTriggered => secondaryActionBufferTimer > 0f || simSecondaryAction;
        public bool ReloadTriggered => reloadBufferTimer > 0f || simReload;
        public bool SwapToolTriggered => swapToolBufferTimer > 0f || simSwapTool;
        public bool QuickItemTriggered => quickItemBufferTimer > 0f || simQuickItem;
        public bool InventoryTriggered => inventoryBufferTimer > 0f || simInventory;
        public bool MapTriggered => mapBufferTimer > 0f || simMap;

        public bool IsPrimaryActionPressed => isPrimaryActionPressed || simPrimaryAction;
        public bool IsSecondaryActionPressed => isSecondaryActionPressed || simSecondaryAction;

        private float jumpBufferTimer = 0f;
        private float interactBufferTimer = 0f;
        private float journalBufferTimer = 0f;
        private float photoBufferTimer = 0f;
        private float cancelBufferTimer = 0f;
        private float craftingBufferTimer = 0f;
        private float quickSaveBufferTimer = 0f;
        private float quickLoadBufferTimer = 0f;
        private float primaryActionBufferTimer = 0f;
        private float secondaryActionBufferTimer = 0f;
        private float reloadBufferTimer = 0f;
        private float swapToolBufferTimer = 0f;
        private float quickItemBufferTimer = 0f;
        private float inventoryBufferTimer = 0f;
        private float mapBufferTimer = 0f;

        private bool isPrimaryActionPressed = false;
        private bool isSecondaryActionPressed = false;
        private bool toggleSprintActive = false;
        private bool toggleCrouchActive = false;

        // Simulation hooks for automated testing
        private bool isSimulated = false;
        private Vector2 simMove;
        private bool simSprint;
        private bool simCrouch;
        private bool simJump;
        private bool simInteract;
        private bool simJournal;
        private bool simPhoto;
        private bool simCancel;
        private bool simCrafting;
        private bool simQuickSave;
        private bool simQuickLoad;
        private bool simPrimaryAction;
        private bool simSecondaryAction;
        private bool simReload;
        private bool simSwapTool;
        private bool simQuickItem;
        private bool simInventory;
        private bool simMap;

        public void SetSimulatedMovement(Vector2 move, bool sprint = false, bool crouch = false)
        {
            isSimulated = true;
            simMove = move;
            simSprint = sprint;
            simCrouch = crouch;
            MoveInput = move;
            IsSprinting = sprint;
            IsCrouching = crouch;
        }

        public Vector2 GetSimulatedMovement() => simMove;

        public void TriggerSimulatedJump() => simJump = true;
        public void TriggerSimulatedInteract() => simInteract = true;
        public void TriggerSimulatedJournal() => simJournal = true;
        public void TriggerSimulatedPhotoMode() => simPhoto = true;
        public void TriggerSimulatedCancel() => simCancel = true;
        public void TriggerSimulatedCrafting() => simCrafting = true;
        public void TriggerSimulatedQuickSave() => simQuickSave = true;
        public void TriggerSimulatedQuickLoad() => simQuickLoad = true;
        public void TriggerSimulatedPrimaryAction() => simPrimaryAction = true;
        public void TriggerSimulatedSecondaryAction() => simSecondaryAction = true;
        public void TriggerSimulatedReload() => simReload = true;
        public void TriggerSimulatedSwapTool() => simSwapTool = true;
        public void TriggerSimulatedQuickItem() => simQuickItem = true;
        public void TriggerSimulatedInventory() => simInventory = true;
        public void TriggerSimulatedMap() => simMap = true;

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
            simCancel = false;
            simCrafting = false;
            simQuickSave = false;
            simQuickLoad = false;
            simPrimaryAction = false;
            simSecondaryAction = false;
            simReload = false;
            simSwapTool = false;
            simQuickItem = false;
            simInventory = false;
            simMap = false;

            MoveInput = Vector2.zero;
            IsSprinting = false;
            IsCrouching = false;
        }

        private void Update()
        {
            // Decrement buffer timers
            if (jumpBufferTimer > 0f) jumpBufferTimer -= Time.deltaTime;
            if (interactBufferTimer > 0f) interactBufferTimer -= Time.deltaTime;
            if (journalBufferTimer > 0f) journalBufferTimer -= Time.deltaTime;
            if (photoBufferTimer > 0f) photoBufferTimer -= Time.deltaTime;
            if (cancelBufferTimer > 0f) cancelBufferTimer -= Time.deltaTime;
            if (craftingBufferTimer > 0f) craftingBufferTimer -= Time.deltaTime;
            if (quickSaveBufferTimer > 0f) quickSaveBufferTimer -= Time.deltaTime;
            if (quickLoadBufferTimer > 0f) quickLoadBufferTimer -= Time.deltaTime;
            if (primaryActionBufferTimer > 0f) primaryActionBufferTimer -= Time.deltaTime;
            if (secondaryActionBufferTimer > 0f) secondaryActionBufferTimer -= Time.deltaTime;
            if (reloadBufferTimer > 0f) reloadBufferTimer -= Time.deltaTime;
            if (swapToolBufferTimer > 0f) swapToolBufferTimer -= Time.deltaTime;
            if (quickItemBufferTimer > 0f) quickItemBufferTimer -= Time.deltaTime;
            if (inventoryBufferTimer > 0f) inventoryBufferTimer -= Time.deltaTime;
            if (mapBufferTimer > 0f) mapBufferTimer -= Time.deltaTime;

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
            float moveX = 0f;
            float moveZ = 0f;

            var bindings = InputBindingManager.Instance;

#if ENABLE_INPUT_SYSTEM
            var keyboard = Keyboard.current;
            var gamepad = Gamepad.current;
            var mouse = Mouse.current;

            // 1. Rebindable Keyboard & Mouse Actions
            if (bindings != null)
            {
                if (bindings.IsActionPressed(GameAction.MoveForward)) moveZ += 1f;
                if (bindings.IsActionPressed(GameAction.MoveBackward)) moveZ -= 1f;
                if (bindings.IsActionPressed(GameAction.MoveLeft)) moveX -= 1f;
                if (bindings.IsActionPressed(GameAction.MoveRight)) moveX += 1f;

                // Sprint (Hold vs Toggle)
                if (bindings.sprintMode == ActionMode.Toggle)
                {
                    if (bindings.WasActionTriggered(GameAction.Sprint)) toggleSprintActive = !toggleSprintActive;
                    IsSprinting = toggleSprintActive;
                }
                else
                {
                    IsSprinting = bindings.IsActionPressed(GameAction.Sprint);
                }

                // Crouch (Hold vs Toggle)
                if (bindings.crouchMode == ActionMode.Toggle)
                {
                    if (bindings.WasActionTriggered(GameAction.Crouch)) toggleCrouchActive = !toggleCrouchActive;
                    IsCrouching = toggleCrouchActive;
                }
                else
                {
                    IsCrouching = bindings.IsActionPressed(GameAction.Crouch);
                }

                if (bindings.WasActionTriggered(GameAction.Jump)) jumpBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.Interact)) interactBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.Journal)) journalBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.Pause)) cancelBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.PrimaryAction)) primaryActionBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.SecondaryAction)) secondaryActionBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.Reload)) reloadBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.SwapTool)) swapToolBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.QuickItem)) quickItemBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.Inventory)) inventoryBufferTimer = 0.15f;
                if (bindings.WasActionTriggered(GameAction.Map)) mapBufferTimer = 0.15f;

                isPrimaryActionPressed = bindings.IsActionPressed(GameAction.PrimaryAction);
                isSecondaryActionPressed = bindings.IsActionPressed(GameAction.SecondaryAction);
            }
            else if (keyboard != null)
            {
                // Fallback direct keyboard polling
                if (keyboard.wKey.isPressed || keyboard.upArrowKey.isPressed) moveZ += 1f;
                if (keyboard.sKey.isPressed || keyboard.downArrowKey.isPressed) moveZ -= 1f;
                if (keyboard.aKey.isPressed || keyboard.leftArrowKey.isPressed) moveX -= 1f;
                if (keyboard.dKey.isPressed || keyboard.rightArrowKey.isPressed) moveX += 1f;

                IsSprinting = keyboard.leftShiftKey.isPressed;
                IsCrouching = keyboard.cKey.isPressed;

                if (keyboard.spaceKey.wasPressedThisFrame) jumpBufferTimer = 0.15f;
                if (keyboard.eKey.wasPressedThisFrame) interactBufferTimer = 0.15f;
                if (keyboard.jKey.wasPressedThisFrame) journalBufferTimer = 0.15f;
                if (keyboard.escapeKey.wasPressedThisFrame) cancelBufferTimer = 0.15f;
                if (keyboard.iKey.wasPressedThisFrame) inventoryBufferTimer = 0.15f;
                if (keyboard.mKey.wasPressedThisFrame) mapBufferTimer = 0.15f;
                if (keyboard.rKey.wasPressedThisFrame) reloadBufferTimer = 0.15f;
                if (keyboard.qKey.wasPressedThisFrame) swapToolBufferTimer = 0.15f;
                if (keyboard.fKey.wasPressedThisFrame) quickItemBufferTimer = 0.15f;
            }

            // Keyboard direct shortcuts for photo mode, crafting, quick save/load
            if (keyboard != null)
            {
                if (keyboard.pKey.wasPressedThisFrame) photoBufferTimer = 0.15f;
                if (keyboard.kKey.wasPressedThisFrame) craftingBufferTimer = 0.15f;
                if (keyboard.f5Key.wasPressedThisFrame) quickSaveBufferTimer = 0.15f;
                if (keyboard.f9Key.wasPressedThisFrame) quickLoadBufferTimer = 0.15f;
            }

            // Gamepad input polling
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
                if (gamepad.startButton.wasPressedThisFrame) cancelBufferTimer = 0.15f;
                if (gamepad.dpad.down.wasPressedThisFrame) craftingBufferTimer = 0.15f;
                if (gamepad.leftShoulder.wasPressedThisFrame) quickSaveBufferTimer = 0.15f;
                if (gamepad.rightShoulder.wasPressedThisFrame) quickLoadBufferTimer = 0.15f;

                if (gamepad.rightTrigger.wasPressedThisFrame) primaryActionBufferTimer = 0.15f;
                if (gamepad.leftTrigger.wasPressedThisFrame) secondaryActionBufferTimer = 0.15f;
                if (gamepad.rightTrigger.isPressed) isPrimaryActionPressed = true;
                if (gamepad.leftTrigger.isPressed) isSecondaryActionPressed = true;
            }

            // Mouse / Gamepad Look
            float lookX = 0f;
            float lookY = 0f;
            float sensX = EffectiveMouseSensitivity;
            float sensY = EffectiveMouseSensitivityY;
            float gamepadSens = EffectiveGamepadSensitivity;
            bool invY = EffectiveInvertY;
            bool invX = EffectiveInvertX;

            if (mouse != null && Cursor.lockState == CursorLockMode.Locked)
            {
                Vector2 delta = mouse.delta.ReadValue();
                lookX = delta.x * sensX * 0.1f * (invX ? -1f : 1f);
                lookY = delta.y * sensY * 0.1f * (invY ? 1f : -1f);
            }

            if (gamepad != null)
            {
                Vector2 rStick = gamepad.rightStick.ReadValue();
                if (rStick.sqrMagnitude > 0.05f)
                {
                    lookX += rStick.x * gamepadSens * Time.deltaTime * 60f * (invX ? -1f : 1f);
                    lookY += rStick.y * gamepadSens * Time.deltaTime * 60f * (invY ? 1f : -1f);
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
            if (Input.GetKeyDown(KeyCode.Escape)) cancelBufferTimer = 0.15f;
            if (Input.GetMouseButtonDown(0)) primaryActionBufferTimer = 0.15f;
            if (Input.GetMouseButtonDown(1)) secondaryActionBufferTimer = 0.15f;
            isPrimaryActionPressed = Input.GetMouseButton(0);
            isSecondaryActionPressed = Input.GetMouseButton(1);
            LookInput = new Vector2(Input.GetAxis("Mouse X") * EffectiveMouseSensitivity, Input.GetAxis("Mouse Y") * EffectiveMouseSensitivityY * (EffectiveInvertY ? 1f : -1f));
#endif

            // Normalize and clamp vector
            Vector2 rawMove = new Vector2(moveX, moveZ);
            MoveInput = rawMove.sqrMagnitude > 1f ? rawMove.normalized : rawMove;
        }

        public void ConsumeJump() { jumpBufferTimer = 0f; simJump = false; }
        public void ConsumeInteract() { interactBufferTimer = 0f; simInteract = false; }
        public void ConsumeJournal() { journalBufferTimer = 0f; simJournal = false; }
        public void ConsumePhotoMode() { photoBufferTimer = 0f; simPhoto = false; }
        public void ConsumeCancel() { cancelBufferTimer = 0f; simCancel = false; }
        public void ConsumeCrafting() { craftingBufferTimer = 0f; simCrafting = false; }
        public void ConsumeQuickSave() { quickSaveBufferTimer = 0f; simQuickSave = false; }
        public void ConsumeQuickLoad() { quickLoadBufferTimer = 0f; simQuickLoad = false; }
        public void ConsumePrimaryAction() { primaryActionBufferTimer = 0f; simPrimaryAction = false; }
        public void ConsumeSecondaryAction() { secondaryActionBufferTimer = 0f; simSecondaryAction = false; }
        public void ConsumeReload() { reloadBufferTimer = 0f; simReload = false; }
        public void ConsumeSwapTool() { swapToolBufferTimer = 0f; simSwapTool = false; }
        public void ConsumeQuickItem() { quickItemBufferTimer = 0f; simQuickItem = false; }
        public void ConsumeInventory() { inventoryBufferTimer = 0f; simInventory = false; }
        public void ConsumeMap() { mapBufferTimer = 0f; simMap = false; }
    }
}
