using UnityEngine;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Localization;
using WhisperingWilds.Player;

namespace WhisperingWilds.World
{
    /// <summary>
    /// One numbered dial on the medallion lock.
    ///
    /// The dial is its own <see cref="IInteractable"/> rather than a
    /// <c>GameplayEventInteractable</c> on purpose: turning a dial is not a gameplay event, and
    /// reporting one would let an idle player satisfy the puzzle objective without solving it.
    /// </summary>
    [DisallowMultipleComponent]
    public class MansionDial : MonoBehaviour, IInteractable
    {
        [SerializeField] private MansionPuzzleController controller;

        [Tooltip("Which dial this is, in the lock's solution order.")]
        [SerializeField] private int dialIndex;

        [SerializeField] private int value = ChettinadMansionContent.DialMinValue;

        public int DialIndex => dialIndex;
        public int Value => value;

        /// <summary>True once the player has turned this dial since the lock last gave a verdict.</summary>
        public bool HasBeenTurned { get; private set; }

        public InteractionType Type => InteractionType.Open;

        private void Reset()
        {
            controller = GetComponentInParent<MansionPuzzleController>();
        }

        private void Awake()
        {
            if (controller == null) controller = GetComponentInParent<MansionPuzzleController>();
            ClampToRange();
        }

        /// <summary>
        /// Wires this dial to its lock and assigns its position in the solution order. The index is
        /// assigned rather than inferred from the hierarchy so the authored solution order cannot be
        /// broken by reordering siblings in the editor.
        /// </summary>
        public void Configure(MansionPuzzleController owner, int index)
        {
            controller = owner;
            dialIndex = Mathf.Max(0, index);
        }

        /// <summary>Advances to the next value, wrapping from the authored maximum to the minimum.</summary>
        public void CycleForward()
        {
            int span = ChettinadMansionContent.DialMaxValue - ChettinadMansionContent.DialMinValue + 1;
            if (span <= 1) return;

            value += 1;
            if (value > ChettinadMansionContent.DialMaxValue) value = ChettinadMansionContent.DialMinValue;
            ClampToRange();

            HasBeenTurned = true;
        }

        /// <summary>Sets an exact value without marking the dial turned.</summary>
        public void SetValue(int newValue)
        {
            value = newValue;
            ClampToRange();
        }

        public void ResetToStart() => SetValue(ChettinadMansionContent.DialMinValue);

        public void ClearTurned() => HasBeenTurned = false;

        private void ClampToRange()
        {
            value = Mathf.Clamp(value, ChettinadMansionContent.DialMinValue, ChettinadMansionContent.DialMaxValue);
        }

        public string InteractionPrompt
        {
            get
            {
                var mgr = LocalizationManager.Instance;
                string label = mgr != null ? mgr.Get("chettinad.puzzle.dial", value) : null;
                if (string.IsNullOrEmpty(label)) label = $"Turn the dial ({value})";
                // HUDManager prefixes "Press [E] ", so this stays a bare label.
                return label;
            }
        }

        public bool CanInteract(PlayerInteractor interactor)
        {
            return controller == null || !controller.IsSolved;
        }

        public void Interact(PlayerInteractor interactor)
        {
            if (controller == null)
            {
                Debug.LogWarning($"[MansionDial '{name}'] has no MansionPuzzleController; the dial cannot be turned.");
                return;
            }

            controller.TurnDial(dialIndex);
        }

        public void OnFocusEnter() { }
        public void OnFocusExit() { }
    }
}
