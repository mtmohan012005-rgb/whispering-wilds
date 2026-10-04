using System;
using UnityEngine;
using WhisperingWilds.Core;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Photography;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Minimal photo mode. Free-aims the main camera, hides the player avatar so the subject is
    /// visible, and captures evidence when the shutter is pressed.
    ///
    /// A capture is only accepted for a registered photo target: the camera's forward ray must hit
    /// a collider tagged as a photo target, whose identifier is taken from the targetId property on
    /// <see cref="PhotoTarget"/>. This means PhotographTarget objectives can only be satisfied by
    /// actually photographing the intended subject.
    /// </summary>
    [DisallowMultipleComponent]
    public class PhotoModeController : MonoBehaviour
    {
        public static PhotoModeController Instance { get; private set; }

        [Header("Camera")]
        [SerializeField] private float fieldOfView = 55f;
        [SerializeField] private float captureRange = 60f;

        [Header("State")]
        [Tooltip("Cursor mode while photo mode is active.")]
        [SerializeField] private bool lockCursorWhileAiming = false;

        private Camera photoCamera;
        private GameObject playerAvatar;
        private GameState stateBeforePhotoMode = GameState.Gameplay;
        private bool isActive;

        public bool IsActive => isActive;

        /// <summary>Raised after a capture is accepted. The argument is the stable target id.</summary>
        public event Action<string> OnPhotoCaptured;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>Enters photo mode. Safe to call when already active.</summary>
        public void EnterPhotoMode()
        {
            if (isActive) return;
            ChennaiOpeningContent.EnsureInitialized();

            isActive = true;
            photoCamera = Camera.main;
            playerAvatar = GameObject.FindWithTag("Player");

            if (GameManager.Instance != null)
            {
                stateBeforePhotoMode = GameManager.Instance.CurrentState;
                GameManager.Instance.SetGameState(GameState.PhotoMode);
            }

            if (playerAvatar != null) playerAvatar.SetActive(false);

            if (photoCamera != null)
            {
                photoCamera.fieldOfView = fieldOfView;
            }

            ApplyCursor();

            Debug.Log("<color=#00D2FF><b>[PhotoMode]</b></color> Photo mode entered.");
        }

        /// <summary>Exits photo mode and restores the previous game state and player avatar.</summary>
        public void ExitPhotoMode()
        {
            if (!isActive) return;
            isActive = false;

            if (playerAvatar != null) playerAvatar.SetActive(true);

            if (GameManager.Instance != null && GameManager.Instance.CurrentState == GameState.PhotoMode)
            {
                GameManager.Instance.SetGameState(
                    stateBeforePhotoMode == GameState.PhotoMode ? GameState.Gameplay : stateBeforePhotoMode);
            }

            ApplyCursor();
            Debug.Log("<color=#00D2FF><b>[PhotoMode]</b></color> Photo mode exited.");
        }

        public void TogglePhotoMode()
        {
            if (isActive) ExitPhotoMode();
            else EnterPhotoMode();
        }

        private void ApplyCursor()
        {
            Cursor.lockState = lockCursorWhileAiming ? CursorLockMode.Locked : CursorLockMode.None;
            Cursor.visible = !lockCursorWhileAiming;
        }

        private void Update()
        {
            var input = GetComponent<Player.PlayerInputHandler>();
            if (input == null) return;

            if (!isActive)
            {
                // Photo mode is a gameplay tool, so it cannot be entered from a menu or dialogue.
                if (input.PhotoModeTriggered
                    && GameManager.Instance != null
                    && GameManager.Instance.CurrentState == GameState.Gameplay)
                {
                    input.ConsumePhotoMode();
                    EnterPhotoMode();
                }
                return;
            }

            if (input.CancelTriggered)
            {
                input.ConsumeCancel();
                ExitPhotoMode();
                return;
            }

            if (input.PhotoModeTriggered)
            {
                input.ConsumePhotoMode();
                ExitPhotoMode();
                return;
            }

            if (input.InteractTriggered)
            {
                Capture();
                input.ConsumeInteract();
            }
        }

        /// <summary>
        /// Attempts a capture. Returns the captured target id, or null when the camera is not
        /// aimed at a registered photo target.
        /// </summary>
        public string Capture()
        {
            if (photoCamera == null) photoCamera = Camera.main;
            if (photoCamera == null)
            {
                Debug.LogWarning("[PhotoMode] No main camera available; capture ignored.");
                return null;
            }

            if (!Physics.Raycast(photoCamera.transform.position, photoCamera.transform.forward,
                    out var hit, captureRange, ~0, QueryTriggerInteraction.Collide))
            {
                Debug.Log("[PhotoMode] Shutter pressed with no target in frame; nothing recorded.");
                return null;
            }

            var target = hit.collider.GetComponentInParent<PhotoTarget>();
            if (target == null || string.IsNullOrEmpty(target.TargetId))
            {
                Debug.Log("[PhotoMode] Aimed object is not a registered photo target; nothing recorded.");
                return null;
            }

            string regionId = GameManager.Instance != null ? GameManager.Instance.CurrentRegion : null;

            // A repeat capture of the same target is rejected, so a PhotographTarget objective is
            // never counted more than once.
            if (!PhotoJournal.Record(target.TargetId, regionId))
            {
                Debug.Log($"[PhotoMode] '{target.TargetId}' is already in the journal; nothing recorded.");
                return null;
            }

            GameplayEventBus.ReportPhotoCaptured(target.TargetId);
            OnPhotoCaptured?.Invoke(target.TargetId);

            Debug.Log($"<color=#00FF88><b>[PhotoMode]</b></color> Captured '{target.TargetId}'.");
            return target.TargetId;
        }
    }
}