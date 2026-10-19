// ============================================================================
// THE WHISPERING WILDS — ANCIENT TEMPLE LEVEL CONTROLLER
// ============================================================================
//
// Manages the ancient Tamil Nadu temple level (08_Ancient_Temple_Ruins).
// Handles scene initialization, clue discovery, puzzle state, and artifact
// collection. Integrates with the existing quest, journal, and save systems.
//
// Usage: Attach to a GameObject in 08_Ancient_Temple_Ruins.unity
// ============================================================================

using UnityEngine;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.World
{
    public class AncientTempleLevelController : MonoBehaviour
    {
        [Header("References")]
        [Tooltip("The folklore puzzle controller for this temple.")]
        public TempleFolklorePuzzleController puzzleController;

        [Tooltip("The hidden artifact pickup component.")]
        public HiddenArtifactPickup artifactPickup;

        [Header("Scene Settings")]
        [Tooltip("Region identifier for save data.")]
        public string regionId = "ancient_temple";

        [Tooltip("Scene name for transitions.")]
        public string sceneName = "08_Ancient_Temple_Ruins";

        // Puzzle completion state
        private bool _puzzleCompleted;
        private bool _artifactCollected;

        private void Awake()
        {
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            InitializeLevel();
        }

        private void InitializeLevel()
        {
            // Load puzzle state from save data
            LoadPuzzleState();

            // Initialize puzzle controller if reference exists
            if (puzzleController != null)
            {
                puzzleController.Initialize();
            }

            // Initialize artifact pickup if reference exists
            if (artifactPickup != null)
            {
                artifactPickup.Initialize(_artifactCollected);
            }

            Debug.Log($"[AncientTemple] Level initialized. Puzzle completed: {_puzzleCompleted}, Artifact collected: {_artifactCollected}");
        }

        private void LoadPuzzleState()
        {
            // TODO: Load from SaveSystem when integrated
            // For now, use PlayerPrefs as a temporary fallback
            _puzzleCompleted = PlayerPrefs.GetInt($"{regionId}_puzzle_completed", 0) == 1;
            _artifactCollected = PlayerPrefs.GetInt($"{regionId}_artifact_collected", 0) == 1;
        }

        public void SavePuzzleState()
        {
            // TODO: Save to SaveSystem when integrated
            PlayerPrefs.SetInt($"{regionId}_puzzle_completed", _puzzleCompleted ? 1 : 0);
            PlayerPrefs.SetInt($"{regionId}_artifact_collected", _artifactCollected ? 1 : 0);
            PlayerPrefs.Save();
        }

        public void OnPuzzleCompleted()
        {
            if (_puzzleCompleted) return; // Prevent duplicate rewards

            _puzzleCompleted = true;
            Debug.Log("[AncientTemple] Puzzle completed! Hidden chamber unlocked.");

            // Enable artifact pickup
            if (artifactPickup != null)
            {
                artifactPickup.EnableArtifact();
            }

            SavePuzzleState();
        }

        public void OnArtifactCollected()
        {
            if (_artifactCollected) return; // Prevent duplicate rewards

            _artifactCollected = true;
            Debug.Log("[AncientTemple] Kaveri Star Seal collected!");

            // Update quest and journal systems
            UpdateQuestProgress();
            SavePuzzleState();
        }

        private void UpdateQuestProgress()
        {
            // TODO: Integrate with QuestManager and InvestigationManager
            // QuestManager.Instance?.AdvanceQuest("temple_exploration");
            // InvestigationManager.Instance?.AddDiscovery("kaveri_star_seal");
            Debug.Log("[AncientTemple] Quest progress updated: Kaveri Star Seal discovered.");
        }

        public bool IsPuzzleCompleted() => _puzzleCompleted;
        public bool IsArtifactCollected() => _artifactCollected;

        private void OnDestroy()
        {
            SavePuzzleState();
        }
    }
}
