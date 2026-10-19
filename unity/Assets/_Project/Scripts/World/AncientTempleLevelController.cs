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
using WhisperingWilds.Investigation;

namespace WhisperingWilds.World
{
    public class AncientTempleLevelController : MonoBehaviour
    {
        [Header("References")]
        [Tooltip("The folklore puzzle controller for this temple.")]
        public TempleFolklorePuzzleController puzzleController;

        [Tooltip("The hidden artifact pickup component.")]
        public HiddenArtifactPickup artifactPickup;

        [Tooltip("The hidden chamber door GameObject to activate when puzzle is solved.")]
        public GameObject hiddenChamberDoor;

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
            // Use PuzzleStateStore for puzzle state and DiscoveryLog for artifact
            _puzzleCompleted = PuzzleStateStore.IsSolved("temple_folklore_puzzle");
            _artifactCollected = DiscoveryLog.Has("kaveri_star_seal");
        }

        public void SavePuzzleState()
        {
            // PuzzleStateStore and DiscoveryLog are static — they persist through
            // SaveSystem's InvestigationRuntimeState automatically. No extra save needed here.
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
            // Record the discovery in DiscoveryLog (prevents duplicate rewards)
            bool recorded = DiscoveryLog.Record("kaveri_star_seal");
            if (recorded)
            {
                Debug.Log("[AncientTemple] Discovery recorded: Kaveri Star Seal");
            }
            else
            {
                Debug.LogWarning("[AncientTemple] Kaveri Star Seal was already recorded — duplicate reward prevented.");
            }
        }

        public bool IsPuzzleCompleted() => _puzzleCompleted;
        public bool IsArtifactCollected() => _artifactCollected;

        /// <summary>
        /// Opens the hidden chamber door when the puzzle is solved.
        /// Called by TempleFolklorePuzzleController after correct solution.
        /// </summary>
        public void OpenHiddenChamber()
        {
            if (hiddenChamberDoor != null)
            {
                hiddenChamberDoor.SetActive(true);
                Debug.Log("[AncientTemple] Hidden chamber door opened!");
            }
            else
            {
                Debug.LogWarning("[AncientTemple] hiddenChamberDoor reference is null — door cannot open.");
            }
        }

        private void OnDestroy()
        {
            SavePuzzleState();
        }
    }
}
