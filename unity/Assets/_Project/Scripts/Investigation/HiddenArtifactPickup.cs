// ============================================================================
// THE WHISPERING WILDS — HIDDEN ARTIFACT PICKUP
// ============================================================================
//
// Handles the Kaveri Star Seal artifact discovery in the ancient temple.
// The artifact is only available after the puzzle is solved. Collecting
// it updates the journal, quest, and discovery systems.
//
// Implements IInteractable so the player can press E to collect it.
// The Kaveri Star Seal is a fictional artifact inspired by Tamil folklore.
// ============================================================================

using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.World;

namespace WhisperingWilds.Investigation
{
    public class HiddenArtifactPickup : MonoBehaviour, IInteractable
    {
        [Header("Artifact Settings")]
        [Tooltip("Unique identifier for this artifact.")]
        public string artifactId = "kaveri_star_seal";

        [Tooltip("Display name in English.")]
        public string displayNameEnglish = "Kaveri Star Seal";

        [Tooltip("Display name in Tamil.")]
        public string displayNameTamil = "காவிரி நட்சத்திர முத்திரை";

        [Tooltip("Description in English.")]
        public string descriptionEnglish = "An ancient stone seal bearing the constellation of the Kaveri river, said to grant wisdom to those who find it.";

        [Tooltip("Description in Tamil.")]
        public string descriptionTamil = "காவிரி நதியின் நட்சத்திர வடிவம் பொறிக்கப்பட்ட பழமையான கல் முத்திரை, அதனைக் கண்டுபிடிப்பவர்க்கு ஞானம் தரும் என நம்பப்படுகிறது.";

        [Header("Visual")]
        [Tooltip("The artifact model to show when enabled.")]
        public GameObject artifactModel;

        // State
        private bool _artifactEnabled;
        private bool _artifactCollected;

        // References
        private AncientTempleLevelController _levelController;

        #region IInteractable

        public string InteractionPrompt
        {
            get
            {
                if (!_artifactEnabled || _artifactCollected) return string.Empty;
                bool useTamil = Localization.LocalizationManager.Instance != null &&
                    Localization.LocalizationManager.Instance.CurrentLanguage == Localization.Language.Tamil;
                return useTamil ? "[E] காவிரி நட்சத்திர முத்திரையை எடு" : "[E] Collect Kaveri Star Seal";
            }
        }

        public InteractionType Type => InteractionType.Collect;

        public bool CanInteract(PlayerInteractor interactor)
        {
            return _artifactEnabled && !_artifactCollected;
        }

        public void Interact(PlayerInteractor interactor)
        {
            if (!_artifactEnabled || _artifactCollected) return;
            CollectArtifact();
        }

        public void OnFocusEnter()
        {
            if (_artifactEnabled && !_artifactCollected)
            {
                Debug.Log("[HiddenArtifact] Player focused on Kaveri Star Seal.");
            }
        }

        public void OnFocusExit()
        {
        }

        #endregion

        public void Initialize(bool alreadyCollected)
        {
            _levelController = FindObjectOfType<AncientTempleLevelController>();
            _artifactCollected = alreadyCollected;
            _artifactEnabled = false;

            // Hide artifact initially
            if (artifactModel != null)
            {
                artifactModel.SetActive(false);
            }

            // If already collected, disable interaction
            if (_artifactCollected)
            {
                gameObject.SetActive(false);
            }
        }

        public void EnableArtifact()
        {
            if (_artifactEnabled || _artifactCollected) return;

            _artifactEnabled = true;
            Debug.Log("[HiddenArtifact] Kaveri Star Seal is now available for collection.");

            // Show the artifact
            if (artifactModel != null)
            {
                artifactModel.SetActive(true);
            }
        }

        public void CollectArtifact()
        {
            if (!_artifactEnabled || _artifactCollected) return;

            _artifactCollected = true;
            Debug.Log("<color=#FFD700><b>[HiddenArtifact]</b></color> Kaveri Star Seal collected!");

            // Hide the artifact
            if (artifactModel != null)
            {
                artifactModel.SetActive(false);
            }

            // Notify level controller
            if (_levelController != null)
            {
                _levelController.OnArtifactCollected();
            }
        }

        public bool IsArtifactEnabled() => _artifactEnabled;
        public bool IsArtifactCollected() => _artifactCollected;

        public string GetDisplayName(bool useTamil)
        {
            return useTamil ? displayNameTamil : displayNameEnglish;
        }

        public string GetDescription(bool useTamil)
        {
            return useTamil ? descriptionTamil : descriptionEnglish;
        }
    }
}
