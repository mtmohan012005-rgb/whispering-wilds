using UnityEngine;

namespace WhisperingWilds.Gameplay
{
    /// <summary>
    /// Scene interactable that reports a specific gameplay event when the player interacts with
    /// it. This is the adapter between authored content and quest objectives.
    ///
    /// The object does not decide what it means narratively; it only carries a stable identifier
    /// and the event kind, and reports that identifier when actually interacted with. A target can
    /// optionally grant an item and reveal a clue, which is what the opening evidence pickups use.
    ///
    /// Repeat interaction is safe: the event is reported each time, so an objective that wants a count
    /// above one still progresses. The item grant is once-only per instance by default, because a
    /// grant that repeats on every press would let the player farm a pickup indefinitely. Clue
    /// reveals are always once-only, since the clue is already deduped by the investigation layer.
    /// </summary>
    [DisallowMultipleComponent]
    public class GameplayEventInteractable : MonoBehaviour, WhisperingWilds.Player.IInteractable
    {
        [Header("Stable Identity")]
        [Tooltip("Stable identifier reported on interaction, matched against quest objective targetId.")]
        [SerializeField] private string targetId;

        [Tooltip("Event kind reported on interaction.")]
        [SerializeField] private WhisperingWilds.Data.QuestObjectiveType reportType =
            WhisperingWilds.Data.QuestObjectiveType.InvestigateObject;

        [Header("Player Facing")]
        [Tooltip("Localization key for the prompt. Preferred over the bilingual fallback fields.")]
        [SerializeField] private string promptKey;
        [SerializeField] private string promptEn;
        [SerializeField] private string promptTa;
        [SerializeField] private WhisperingWilds.Player.InteractionType interactionType =
            WhisperingWilds.Player.InteractionType.Investigate;

        [Header("Optional Effects")]
        [Tooltip("Item granted on interaction, by stable item id. Empty means nothing is granted.")]
        [SerializeField] private string grantItemId;

        [SerializeField] private int grantItemCount = 1;

        [Tooltip("Granted once, so a pickup cannot be farmed by interacting repeatedly.")]
        [SerializeField] private bool grantOnce = true;

        [Tooltip("Clue revealed on interaction, by stable clue id. Empty means nothing is revealed.")]
        [SerializeField] private string revealClueId;

        [Header("Optional World Reporting")]
        [Tooltip("If true, reaching within interaction range reports a ReachLocation event for this target's location id.")]
        [SerializeField] private string locationId;

        [SerializeField] private bool reportArrival;

        [Header("Investigation Feedback")]
        [Tooltip("Shows the 'Something about this seems important.' notification when inspected. Used by evidence that should acknowledge the player without spoiling what it is.")]
        [SerializeField] private bool acknowledgeAsImportant;

        [Tooltip("Discovery recorded on interaction, by stable discovery id. Empty means nothing is recorded.")]
        [SerializeField] private string recordDiscoveryId;

        public string TargetId => targetId;
        public WhisperingWilds.Data.QuestObjectiveType ReportType => reportType;
        public string RecordDiscoveryId => recordDiscoveryId;

        public WhisperingWilds.Player.InteractionType Type => interactionType;

        public string InteractionPrompt
        {
            get
            {
                // A localization key wins when one is assigned; the bilingual fields are the
                // per-object fallback for content that has no shared key.
                string label = ResolvePromptLabel();
                if (string.IsNullOrEmpty(label))
                {
                    label = WhisperingWilds.Localization.LocalizationManager.Instance != null
                            && WhisperingWilds.Localization.LocalizationManager.Instance.CurrentLanguage == WhisperingWilds.Localization.Language.Tamil
                        ? promptTa
                        : promptEn;
                }

                // No "[E]" suffix here. HUDManager composes the prompt as "Press [E] " + this, so a
                // suffix would print the key twice for every interactable in the game.
                return label;
            }
        }

        private string ResolvePromptLabel()
        {
            if (string.IsNullOrEmpty(promptKey)) return null;

            var mgr = WhisperingWilds.Localization.LocalizationManager.Instance;
            if (mgr == null) return null;

            // A key the tables do not define must fall through to promptEn/promptTa.
            // Get() answers "missing.<key>" for an unknown key, which is non-empty, so
            // testing the return value alone would ship that placeholder to the HUD
            // instead of reaching the bilingual fallback below.
            if (!mgr.HasKey(promptKey)) return null;

            string value = mgr.Get(promptKey);
            return string.IsNullOrEmpty(value) ? null : value;
        }

        private bool arrivalReported;

        public bool CanInteract(WhisperingWilds.Player.PlayerInteractor interactor) => true;

        public void Interact(WhisperingWilds.Player.PlayerInteractor interactor)
        {
            GameplayContentRegistry.EnsureAllInitialized();

            // Report first, so objective progression happens even if an optional grant is refused
            // because the inventory is full.
            GameplayEventBus.Report(reportType, targetId);

            GrantItemIfConfigured();
            RevealClueIfConfigured();
            RecordDiscoveryIfConfigured();
            AcknowledgeIfConfigured();
        }

        /// <summary>
        /// Whether this target still has a consumable effect. Used by the world only for feedback;
        /// the objective event itself repeats so counted objectives keep progressing.
        /// </summary>
        public bool HasRemainingGrant => !itemGranted && !string.IsNullOrEmpty(grantItemId) && grantItemCount > 0;

        public void OnFocusEnter()
        {
            ReportArrivalIfConfigured();
        }

        public void OnFocusExit() { }

        private void ReportArrivalIfConfigured()
        {
            if (!reportArrival || arrivalReported || string.IsNullOrEmpty(locationId)) return;
            arrivalReported = true;
            GameplayEventBus.ReportReachedLocation(locationId);
        }

        private bool itemGranted;

        private void GrantItemIfConfigured()
        {
            if (string.IsNullOrEmpty(grantItemId) || grantItemCount <= 0) return;
            if (grantOnce && itemGranted) return;

            var inv = WhisperingWilds.Inventory.InventoryManager.Instance;
            if (inv == null) return;

            var item = WhisperingWilds.Data.GameDataCatalog.GetItem(grantItemId);
            if (item == null)
            {
                Debug.LogWarning($"[Interactable '{name}'] references unknown item '{grantItemId}'; nothing was granted.");
                return;
            }

            inv.AddItem(item, grantItemCount, WhisperingWilds.Inventory.InventoryManager.ItemGrantSource.Collected);

            // Marked as granted regardless of whether the inventory accepted it: a full inventory
            // means the player is overloaded, not that the pickup should refill itself later.
            itemGranted = true;
        }

        private void RevealClueIfConfigured()
        {
            if (string.IsNullOrEmpty(revealClueId)) return;

            var inv = WhisperingWilds.Investigation.InvestigationManager.Instance;
            if (inv == null)
            {
                Debug.LogWarning($"[Interactable '{name}'] cannot reveal '{revealClueId}': no InvestigationManager in this scene.");
                return;
            }

            inv.DiscoverClueById(revealClueId);
        }

        private void RecordDiscoveryIfConfigured()
        {
            if (string.IsNullOrEmpty(recordDiscoveryId)) return;

            if (!WhisperingWilds.Investigation.DiscoveryLog.IsRegistered(recordDiscoveryId))
            {
                Debug.LogWarning($"[Interactable '{name}'] references unregistered discovery '{recordDiscoveryId}'; nothing was recorded.");
                return;
            }

            WhisperingWilds.Investigation.DiscoveryLog.Record(recordDiscoveryId);
        }

        /// <summary>
        /// Gives the player the acknowledgement the investigation flow requires when they examine
        /// something that matters, without revealing what it is. The clue itself carries the content
        /// and is shown by the journal, so this stays a short prompt-level confirmation.
        /// </summary>
        private void AcknowledgeIfConfigured()
        {
            if (!acknowledgeAsImportant) return;
            if (WhisperingWilds.UI.HUDManager.Instance == null) return;

            WhisperingWilds.UI.HUDManager.Instance.ShowNotificationKey("investigate.important", 4.0f);
        }
    }
}