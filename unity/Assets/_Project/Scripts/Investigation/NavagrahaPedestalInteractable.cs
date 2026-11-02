// ============================================================================
// THE WHISPERING WILDS — NAVAGRAHA PEDESTAL INTERACTABLE
// ============================================================================
//
// Interactable component for brass solar mirror pedestals in the ancient temple.
// Implements IInteractable so players can approach and press E to rotate mirrors.
// Directly advances the NavagrahaShadowPuzzle simulation state and triggers visual rotation.
// ============================================================================

using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.Localization;
using WhisperingWilds.UI;

namespace WhisperingWilds.Investigation
{
    public class NavagrahaPedestalInteractable : MonoBehaviour, IInteractable
    {
        [Header("Pedestal Configuration")]
        [Tooltip("Index of this solar mirror pedestal (0, 1, or 2).")]
        public int pedestalIndex = 0;

        [Tooltip("Reference to the parent NavagrahaShadowPuzzle controller.")]
        public NavagrahaShadowPuzzle puzzle;

        [Tooltip("Rotation angle in degrees applied to the visual model on each interaction.")]
        public float rotationAngleStep = 45f;

        private void Start()
        {
            if (puzzle == null)
            {
                puzzle = FindObjectOfType<NavagrahaShadowPuzzle>();
            }
        }

        #region IInteractable Implementation

        public string InteractionPrompt
        {
            get
            {
                if (puzzle != null && puzzle.IsSolved()) return string.Empty;

                bool useTamil = LocalizationManager.Instance != null &&
                                LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

                return useTamil
                    ? $"[E] சூரியக் கண்ணாடி {pedestalIndex + 1}-ஐத் திருப்பு"
                    : $"[E] Rotate Solar Mirror {pedestalIndex + 1}";
            }
        }

        public InteractionType Type => InteractionType.Inspect;

        public bool CanInteract(PlayerInteractor interactor)
        {
            return puzzle != null && !puzzle.IsSolved();
        }

        public void Interact(PlayerInteractor interactor)
        {
            if (!CanInteract(interactor)) return;

            // Visual rotation feedback
            transform.Rotate(0f, rotationAngleStep, 0f);

            // Advance puzzle state
            puzzle.RotatePedestal(pedestalIndex);

            int currentAngle = puzzle.GetPedestalAngle(pedestalIndex);
            bool useTamil = LocalizationManager.Instance != null &&
                            LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

            string feedback = useTamil
                ? $"சூரியக் கண்ணாடி {pedestalIndex + 1}: {currentAngle}° கோணம்"
                : $"Solar Mirror {pedestalIndex + 1}: {currentAngle}° Alignment";

            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.ShowNotification(feedback, 2.5f);
            }
        }

        public void OnFocusEnter()
        {
            if (puzzle != null && !puzzle.IsSolved())
            {
                Debug.Log($"[NavagrahaPedestal{pedestalIndex}] Player focused on solar mirror pedestal.");
            }
        }

        public void OnFocusExit()
        {
        }

        #endregion
    }
}
