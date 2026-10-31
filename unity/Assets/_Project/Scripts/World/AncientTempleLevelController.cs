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
using WhisperingWilds.Audio;
using WhisperingWilds.Investigation;

namespace WhisperingWilds.World
{
    public class AncientTempleLevelController : MonoBehaviour
    {
        [Header("References")]
        [Tooltip("The folklore puzzle controller for this temple.")]
        public TempleFolklorePuzzleController puzzleController;

        [Tooltip("The astronomical sunlight alignment puzzle in the courtyard.")]
        public NavagrahaShadowPuzzle navagrahaPuzzle;

        [Tooltip("The Dravidian acoustic musical resonance pillar puzzle in the mandapa.")]
        public AcousticPillarPuzzle acousticPuzzle;

        [Tooltip("The hidden artifact pickup component.")]
        public HiddenArtifactPickup artifactPickup;

        [Tooltip("The hidden chamber door GameObject to activate when puzzle is solved.")]
        public GameObject hiddenChamberDoor;

        [Header("Audio")]
        [Tooltip("Ambient loop played while in the temple scene.")]
        public AudioClip templeAmbienceClip;

        [Header("Scene Settings")]
        [Tooltip("Region identifier for save data.")]
        public string regionId = "ancient_temple";

        [Tooltip("Scene name for transitions.")]
        public string sceneName = "08_Ancient_Temple_Ruins";

        // Puzzle completion state
        private bool _puzzleCompleted;
        private bool _artifactCollected;

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

            // Initialize Navagraha solar puzzle if present
            if (navagrahaPuzzle != null)
            {
                navagrahaPuzzle.Initialize();
                navagrahaPuzzle.OnNavagrahaSolved += CheckAllChambersUnlocked;
            }

            // Initialize Acoustic musical pillar puzzle if present
            if (acousticPuzzle != null)
            {
                acousticPuzzle.Initialize();
                acousticPuzzle.OnAcousticSolved += CheckAllChambersUnlocked;
            }

            // Initialize artifact pickup if reference exists
            if (artifactPickup != null)
            {
                artifactPickup.Initialize(_artifactCollected);
            }

            // Play temple ambience
            if (AudioManager.Instance != null && templeAmbienceClip != null)
            {
                AudioManager.Instance.PlayAmbient(templeAmbienceClip);
            }

            // Register co-op multiplayer mechanism listeners
            if (WhisperingWilds.Online.RealtimeManager.Instance != null)
            {
                WhisperingWilds.Online.RealtimeManager.Instance.OnMechanismUpdated += HandleRemoteMechanismUpdate;
            }

            Debug.Log($"[AncientTemple] Level initialized. Puzzle completed: {_puzzleCompleted}, Artifact collected: {_artifactCollected}");
        }

        private void OnDestroy()
        {
            if (WhisperingWilds.Online.RealtimeManager.Instance != null)
            {
                WhisperingWilds.Online.RealtimeManager.Instance.OnMechanismUpdated -= HandleRemoteMechanismUpdate;
            }

            // Stop ambience when leaving the scene
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.StopAmbient();
            }
            SavePuzzleState();
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

        public bool AreAllTemplePuzzlesSolved()
        {
            bool folkloreOk = _puzzleCompleted || (puzzleController == null || puzzleController.IsPuzzleCompleted());
            bool solarOk = (navagrahaPuzzle == null || navagrahaPuzzle.IsSolved());
            bool acousticOk = (acousticPuzzle == null || acousticPuzzle.IsSolved());
            return folkloreOk && solarOk && acousticOk;
        }

        private void CheckAllChambersUnlocked()
        {
            if (AreAllTemplePuzzlesSolved())
            {
                Debug.Log("[AncientTemple] All three Dravidian temple puzzle chambers solved! Unlocking inner garbhagriha.");
                OpenHiddenChamber();
            }
        }

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

        private void HandleRemoteMechanismUpdate(string mechanismId, System.Collections.Generic.Dictionary<string, object> state)
        {
            if (state == null) return;

            bool solved = WhisperingWilds.Online.MiniJson.GetBool(state, "solved", false);
            if (solved)
            {
                if (mechanismId == "temple_folklore")
                {
                    OnPuzzleCompleted();
                }
                else if (mechanismId == "navagraha_shadow" && navagrahaPuzzle != null && !navagrahaPuzzle.IsSolved())
                {
                    navagrahaPuzzle.SetPedestalAngle(0, 45);
                    navagrahaPuzzle.SetPedestalAngle(1, 90);
                    navagrahaPuzzle.SetPedestalAngle(2, 135);
                    navagrahaPuzzle.CheckAlignment();
                }
                else if (mechanismId == "acoustic_pillar" && acousticPuzzle != null && !acousticPuzzle.IsSolved())
                {
                    acousticPuzzle.StrikePillar(0);
                    acousticPuzzle.StrikePillar(2);
                    acousticPuzzle.StrikePillar(3);
                    acousticPuzzle.StrikePillar(1);
                    acousticPuzzle.StrikePillar(4);
                }
                CheckAllChambersUnlocked();
            }
        }

        public void BroadcastMechanismInteraction(string mechanismId, System.Collections.Generic.Dictionary<string, object> payload)
        {
            if (WhisperingWilds.Online.RealtimeManager.Instance != null &&
                WhisperingWilds.Online.RealtimeManager.Instance.IsConnected)
            {
                WhisperingWilds.Online.RealtimeManager.Instance.SendMechanismInteraction(mechanismId, payload);
            }
        }
    }
}
