// ============================================================================
// THE WHISPERING WILDS — HIDDEN ARTIFACT PICKUP
// ============================================================================
//
// Handles the Kaveri Star Seal artifact discovery in the ancient temple.
// The artifact is only available after the puzzle is solved. Collecting
// it updates the journal, quest, and discovery systems.
//
// The Kaveri Star Seal is a fictional artifact inspired by Tamil folklore.
// ============================================================================

using UnityEngine;

namespace WhisperingWilds.Investigation
{
    public class HiddenArtifactPickup : MonoBehaviour
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
        public string descriptionTamil = "காவிரி நததியின் நட்சத்திர வடிவம் பொறிக்கபப்ட்ற பழமையான கல்ல முத்திரை, அதன கண்டுபிடிப்பவருக்கு ஞானம் தரும்னு நம்பப்ட்டு.";

        [Header("Visual")]
        [Tooltip("The artifact model to show when enabled.")]
        public GameObject artifactModel;

        // State
        private bool _artifactEnabled;
        private bool _artifactCollected;

        // References
        private AncientTempleLevelController _levelController;

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

            // TODO: Play discovery sound
            // TODO: Show interaction prompt
        }

        public void CollectArtifact()
        {
            if (!_artifactEnabled || _artifactCollected) return;

            _artifactCollected = true;
            Debug.Log("[HiddenArtifact] Kaveri Star Seal collected!");

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

            // Update journal and quest systems
            UpdateJournal();

            // TODO: Play collection sound and animation
            // TODO: Show reward UI
        }

        private void UpdateJournal()
        {
            // TODO: Integrate with InvestigationManager
            // InvestigationManager.Instance?.AddDiscovery(artifactId, displayNameEnglish, descriptionEnglish);
            Debug.Log($"[HiddenArtifact] Journal updated: {displayNameEnglish} discovered.");
        }

        private void OnTriggerEnter(Collider other)
        {
            // Check if the player entered the trigger
            if (other.CompareTag("Player") && _artifactEnabled && !_artifactCollected)
            {
                // TODO: Show interaction prompt
                Debug.Log("[HiddenArtifact] Player can collect the Kaveri Star Seal.");
            }
        }

        private void OnTriggerExit(Collider other)
        {
            // Check if the player left the trigger
            if (other.CompareTag("Player"))
            {
                // TODO: Hide interaction prompt
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
