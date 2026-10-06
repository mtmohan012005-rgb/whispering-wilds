using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Inventory;
using WhisperingWilds.Investigation;
using WhisperingWilds.Localization;
using WhisperingWilds.Player;
using WhisperingWilds.UI;

namespace WhisperingWilds.World
{
    /// <summary>
    /// A door that opens once the player is holding the key item it names.
    ///
    /// This is the only inventory-gated door in the Chettinad flow, and it gates one room rather
    /// than starting a puzzle chain: the key is found in the side room, and the thing behind the
    /// door is the medallion lock, which is solved from evidence rather than from items.
    ///
    /// The key is not consumed. A single Chettinad door does not need a consumable economy, and
    /// keeping the key is what lets the door's state be reconstructed from the save rather than
    /// needing its own persisted flag: see <see cref="EnsureRestoredFromInventory"/>.
    ///
    /// The open state is therefore derived, not stored. Any save that has the key also has the door
    /// open, and any save that lacks the key has it closed, so there is no way for the two to
    /// disagree. Deriving it also means the door is restored correctly no matter whether the save
    /// load happens before or after this object's Awake.
    /// </summary>
    [DisallowMultipleComponent]
    public class KeyLockedDoor : MonoBehaviour, IInteractable
    {
        [Header("Identity")]
        [Tooltip("Stable object id reported to the quest when the door is opened.")]
        [SerializeField] private string openedEventTargetId;

        [Tooltip("Optional clue recorded the first time the door is examined, whether or not it opens. " +
            "This is what tells the player the key exists before they have it.")]
        [SerializeField] private string clueOnOpenId = ChettinadMansionContent.ClueSealedDoor;

        [Header("Locking")]
        [Tooltip("Stable item id required to open this door.")]
        [SerializeField] private string requiredItemId = ChettinadMansionContent.ItemOldBrassKey;

        [Header("World State")]
        [Tooltip("Colliders blocked while the door is closed. Disabled when it opens.")]
        [SerializeField] private Collider[] blockers = new Collider[0];

        [Tooltip("Optional visual object hidden when the door opens, for a panel or door leaf.")]
        [SerializeField] private GameObject closedVisual;

        public InteractionType Type => InteractionType.Open;

        public bool IsOpen { get; private set; }

        private bool notifiedMissingKey;
        private bool sealClueRevealed;

        private void Awake()
        {
            GameplayContentRegistry.EnsureAllInitialized();
            EnsureRestoredFromInventory();
        }

        private void Start()
        {
            // SaveManager may finish restoring the inventory after Awake has already run, so the
            // derived open state is re-checked once the scene has started.
            EnsureRestoredFromInventory();
        }

        public string InteractionPrompt
        {
            get
            {
                EnsureRestoredFromInventory();
                if (IsOpen)
                {
                    string open = LocalizationManager.Instance != null
                        ? LocalizationManager.Instance.Get("chettinad.door.open")
                        : null;
                    return string.IsNullOrEmpty(open) ? "Open" : open;
                }

                var mgr = LocalizationManager.Instance;
                string label = mgr != null ? mgr.Get("chettinad.door.family_room") : null;
                // HUDManager prefixes "Press [E] ", so this stays a bare label.
                return string.IsNullOrEmpty(label) ? "Locked door" : label;
            }
        }

        public bool CanInteract(PlayerInteractor interactor)
        {
            EnsureRestoredFromInventory();
            // An open door is scenery, not a target. Leaving it focusable would park the crosshair
            // on it forever and swallow the prompt for whatever is behind it.
            return !IsOpen;
        }

        public void Interact(PlayerInteractor interactor)
        {
            EnsureRestoredFromInventory();
            if (IsOpen) return;

            // The seal clue is recorded on the first inspection, key or no key. Recording it only on
            // a successful open would make the clue circular: the player would need the key to learn
            // where the key is.
            RevealSealClueOnce();

            if (!HasKey())
            {
                if (!notifiedMissingKey)
                {
                    notifiedMissingKey = true;
                    Notify("chettinad.door.needs_key", 4.5f);
                }
                return;
            }

            Open();
        }

        private void RevealSealClueOnce()
        {
            if (sealClueRevealed) return;
            if (string.IsNullOrEmpty(clueOnOpenId)) return;
            if (InvestigationManager.Instance == null) return;

            sealClueRevealed = true;
            InvestigationManager.Instance.DiscoverClueById(clueOnOpenId);
        }

        /// <summary>
        /// Opens the door as a player action: this reports the gameplay event and shows the unlock
        /// notification. Restoration deliberately does not go through here.
        /// </summary>
        public void Open()
        {
            if (IsOpen) return;

            ApplyOpenState();

            if (!string.IsNullOrEmpty(openedEventTargetId))
            {
                GameplayEventBus.Report(QuestObjectiveType.InvestigateObject, openedEventTargetId);
            }

            Notify("chettinad.door.unlocked_key", 4.0f);
            Debug.Log($"<color=#FFD700><b>[KeyLockedDoor '{name}']</b></color> Opened (required item '{requiredItemId}').");
        }

        /// <summary>
        /// Applies the open world state without reporting anything or notifying the player.
        /// Separated from <see cref="Open"/> so a restored door does not replay the beat the player
        /// already saw, and does not re-fire an objective event.
        /// </summary>
        public void ApplyOpenState()
        {
            if (IsOpen) return;
            IsOpen = true;

            if (blockers != null)
            {
                for (int i = 0; i < blockers.Length; i++)
                {
                    if (blockers[i] != null) blockers[i].enabled = false;
                }
            }

            if (closedVisual != null) closedVisual.SetActive(false);
        }

        /// <summary>
        /// Reopens the door silently when the inventory already holds its key, which is the case for
        /// every save loaded after the key was collected. Cheap and idempotent, so it is safe to
        /// call from every entry point rather than depending on component execution order.
        /// </summary>
        private void EnsureRestoredFromInventory()
        {
            if (IsOpen) return;
            if (!HasKey()) return;
            ApplyOpenState();
        }

        /// <summary>True when the player is carrying the key this door names.</summary>
        public bool HasKey()
        {
            if (string.IsNullOrEmpty(requiredItemId)) return true;
            if (InventoryManager.Instance == null) return false;
            return InventoryManager.Instance.HasItemById(requiredItemId, 1);
        }

        /// <summary>Stable item id this door requires. Exposed for the smoke test.</summary>
        public string RequiredItemId => requiredItemId;

        private static void Notify(string key, float duration)
        {
            if (HUDManager.Instance == null) return;
            HUDManager.Instance.ShowNotificationKey(key, duration);
        }

        public void OnFocusEnter() { }
        public void OnFocusExit() { }
    }
}
