// ============================================================================
// THE WHISPERING WILDS — STONE MECHANISM
// ============================================================================
//
// Interactable stone mechanism for the temple folklore puzzle.
// Players approach and press E to cycle the mechanism's position.
// The position is reported to TempleFolklorePuzzleController.
//
// Implements IInteractable so the player can press E to interact.
// ============================================================================

using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Investigation
{
    public class StoneMechanism : MonoBehaviour, IInteractable
    {
        [Header("Mechanism Settings")]
        [Tooltip("Index of this mechanism (0, 1, or 2).")]
        public int mechanismIndex = 0;

        [Tooltip("Number of positions this mechanism can cycle through.")]
        public int numberOfPositions = 3;

        [Header("Visual")]
        [Tooltip("Rotation angle per position step.")]
        public float rotationPerStep = 30f;

        // State
        private int _currentPosition = -1;
        private bool _isLocked;

        // Reference to the puzzle controller
        private TempleFolklorePuzzleController _puzzleController;

        private void Start()
        {
            _puzzleController = FindObjectOfType<TempleFolklorePuzzleController>();
        }

        #region IInteractable

        public string InteractionPrompt
        {
            get
            {
                if (_isLocked) return string.Empty;
                bool useTamil = LocalizationManager.Instance != null &&
                    LocalizationManager.Instance.CurrentLanguage == Language.Tamil;
                return useTamil 
                    ? $"[E] கல் இயந்திரம் {mechanismIndex + 1}" 
                    : $"[E] Rotate Stone {mechanismIndex + 1}";
            }
        }

        public InteractionType Type => InteractionType.Inspect;

        public bool CanInteract(PlayerInteractor interactor)
        {
            return !_isLocked && _puzzleController != null && !_puzzleController.IsPuzzleCompleted();
        }

        public void Interact(PlayerInteractor interactor)
        {
            if (_isLocked || _puzzleController == null) return;

            // Cycle position
            _currentPosition = (_currentPosition + 1) % numberOfPositions;

            // Rotate the mechanism visually
            transform.Rotate(0f, rotationPerStep, 0f);

            // Report to puzzle controller
            _puzzleController.SetMechanismPosition(mechanismIndex, _currentPosition);

            // Show feedback
            bool useTamil = LocalizationManager.Instance != null &&
                LocalizationManager.Instance.CurrentLanguage == Language.Tamil;
            string feedback = useTamil
                ? $"கல் {mechanismIndex + 1}: நிலை {_currentPosition + 1}/{numberOfPositions}"
                : $"Stone {mechanismIndex + 1}: Position {_currentPosition + 1}/{numberOfPositions}";

            if (UI.HUDManager.Instance != null)
            {
                UI.HUDManager.Instance.ShowNotification(feedback, 2f);
            }
        }

        public void OnFocusEnter()
        {
            if (!_isLocked)
            {
                Debug.Log($"[StoneMechanism{mechanismIndex}] Player focused on mechanism.");
            }
        }

        public void OnFocusExit()
        {
        }

        #endregion

        /// <summary>
        /// Reset this mechanism to its initial state.
        /// Called by the puzzle controller after a failed attempt.
        /// </summary>
        public void ResetMechanism()
        {
            _currentPosition = -1;
            transform.localRotation = Quaternion.identity;
        }

        /// <summary>
        /// Lock this mechanism so it can no longer be interacted with.
        /// Called when the puzzle is solved.
        /// </summary>
        public void LockMechanism()
        {
            _isLocked = true;
        }

        public int GetCurrentPosition() => _currentPosition;
        public bool IsLocked() => _isLocked;
    }
}
