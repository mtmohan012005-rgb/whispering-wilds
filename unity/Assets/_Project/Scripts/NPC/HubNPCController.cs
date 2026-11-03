// ============================================================================
// THE WHISPERING WILDS — HUB NPC CONTROLLER
// ============================================================================
//
// Manages physical NPC characters and merchants stationed across regional hubs
// (Cauvery Delta, Nilgiris Tea Estate, Chettinad Mansions, Thanjavur, Mamallapuram).
// Bridges physical colliders with persistent relationship memories (NPCMemoryStore),
// trust tiers (EndingController / VendorSystem), and bilingual dialogue interactions.
// ============================================================================

using System;
using UnityEngine;
using WhisperingWilds.Economy;
using WhisperingWilds.Player;
using WhisperingWilds.NPC;
using WhisperingWilds.Localization;
using WhisperingWilds.UI;
using WhisperingWilds.Campaign;

namespace WhisperingWilds.Characters
{
    [RequireComponent(typeof(Collider))]
    [DisallowMultipleComponent]
    public class HubNPCController : MonoBehaviour, IInteractable
    {
        [Header("NPC Identity")]
        [Tooltip("Stable identifier matching persistent NPC memory and trust databases (e.g., 'murugan', 'velu', 'chettinad_artisan').")]
        public string npcId = "hub_resident";

        [Tooltip("Display name in English.")]
        public string npcDisplayName = "Resident";

        [Tooltip("Display name in Tamil.")]
        public string npcDisplayNameTamil = "ஊரார்";

        [Tooltip("Regional hub where this NPC is stationed (e.g., 'CauveryDelta', 'Nilgiris', 'Chettinad', 'Thanjavur').")]
        public string regionalHubName = "CauveryDelta";

        [Tooltip("Profession or social role.")]
        public string profession = "Merchant";

        [Header("System Integration")]
        [Tooltip("Optional VendorSystem component if this NPC trades regional goods.")]
        public VendorSystem associatedVendor;

        [Tooltip("Persistent memory flag required for specialized dialogue or unlocked tier.")]
        public string requiredMemoryFlagId;

        [Header("Authored Greetings")]
        [TextArea(2, 3)] public string defaultGreetingEn = "Greetings, traveler. How fares your journey across Tamil Nadu?";
        [TextArea(2, 3)] public string defaultGreetingTa = "வணக்கம் பயணியே! தமிழ்நாட்டின் வழியே உங்கள் பயணம் எவ்வாறு செல்கிறது?";

        [TextArea(2, 3)] public string unlockedGreetingEn = "Ah, welcome back my trusted friend! The community speaks well of your deeds.";
        [TextArea(2, 3)] public string unlockedGreetingTa = "வாருங்கள் என் நம்பிக்கைக்குரிய நண்பரே! உங்கள் நற்செயல்களைப் பற்றி ஊரே புகழ்கிறது.";

        [Header("Interaction Configuration")]
        [SerializeField] private string interactionPrompt = "Press [E] to Speak";
        [SerializeField] private bool isInteractable = true;

        public event Action<HubNPCController> OnInteracted;

        private void Reset()
        {
            Collider col = GetComponent<Collider>();
            if (col != null)
            {
                col.isTrigger = false;
            }
        }

        #region IInteractable Implementation

        public string InteractionPrompt
        {
            get
            {
                if (!isInteractable) return string.Empty;

                bool useTamil = LocalizationManager.Instance != null &&
                                LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

                string name = useTamil && !string.IsNullOrEmpty(npcDisplayNameTamil)
                    ? npcDisplayNameTamil
                    : npcDisplayName;

                return useTamil
                    ? $"[E] {name} உடன் பேசு"
                    : $"{interactionPrompt} with {name}";
            }
        }

        public string GetInteractionPrompt()
        {
            return InteractionPrompt;
        }

        public InteractionType Type => InteractionType.Talk;

        public bool CanInteract(PlayerInteractor interactor)
        {
            return isInteractable;
        }

        public void Interact(PlayerInteractor interactor)
        {
            if (!isInteractable) return;
            EvaluateRelationshipAndTriggerDialogue();
            OnInteracted?.Invoke(this);
        }

        /// <summary>
        /// Convenience overload for external invocations using GameObject references.
        /// </summary>
        public void Interact(GameObject interactor)
        {
            if (!isInteractable) return;
            EvaluateRelationshipAndTriggerDialogue();
            OnInteracted?.Invoke(this);
        }

        public void OnFocusEnter()
        {
            if (isInteractable)
            {
                Debug.Log($"[HubNPC] Player focused on {npcDisplayName} ({regionalHubName}).");
            }
        }

        public void OnFocusExit()
        {
        }

        #endregion

        /// <summary>
        /// Evaluates persistent memory flags and trust scores, logging telemetry and launching dynamic dialogue/vendor UI.
        /// </summary>
        public void EvaluateRelationshipAndTriggerDialogue()
        {
            bool hasMemory = !string.IsNullOrEmpty(requiredMemoryFlagId) &&
                             NPCMemoryStore.HasMemory(npcId, requiredMemoryFlagId);

            int trustScore = 0;
            if (EndingController.Instance != null)
            {
                trustScore = EndingController.Instance.GetTrust(npcId);
            }

            Debug.Log($"[HubNPC] Interacting with {npcDisplayName} ({npcId}) at {regionalHubName}. Trust: {trustScore}, Memory '{requiredMemoryFlagId}': {hasMemory}");

            if (associatedVendor != null)
            {
                Debug.Log($"[HubNPC] Associated Vendor Trust Tier: {associatedVendor.currentTrustTier}");
            }

            // Determine greeting
            bool useTamil = LocalizationManager.Instance != null &&
                            LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

            string greeting;
            if (hasMemory || trustScore >= 50)
            {
                greeting = useTamil && !string.IsNullOrEmpty(unlockedGreetingTa)
                    ? unlockedGreetingTa
                    : unlockedGreetingEn;
            }
            else
            {
                greeting = useTamil && !string.IsNullOrEmpty(defaultGreetingTa)
                    ? defaultGreetingTa
                    : defaultGreetingEn;
            }

            // Display notification / dialogue prompt in HUD
            if (HUDManager.Instance != null)
            {
                string header = useTamil && !string.IsNullOrEmpty(npcDisplayNameTamil)
                    ? npcDisplayNameTamil
                    : npcDisplayName;
                HUDManager.Instance.ShowNotification($"{header}: \"{greeting}\"", 4.5f);
            }
            else
            {
                Debug.Log($"[HubNPC Dialogue] {npcDisplayName}: \"{greeting}\"");
            }
        }

        public void SetInteractable(bool state)
        {
            isInteractable = state;
        }

        public bool IsInteractable() => isInteractable;
    }
}
