// ============================================================================
// THE WHISPERING WILDS — TEMPLE FOLKLORE PUZZLE CONTROLLER
// ============================================================================
//
// Manages the three-stone mechanism puzzle in the ancient temple.
// Players discover clues from inscriptions and murals, then align the
// stone mechanisms correctly to unlock the hidden chamber.
//
// The puzzle is inspired by Tamil folklore motifs but is entirely fictional.
// Clue text is provided in both Tamil and English.
// ============================================================================

using System;
using System.Collections;
using UnityEngine;
using WhisperingWilds.Audio;
using WhisperingWilds.World;
using WhisperingWilds.Localization;
using WhisperingWilds.UI;

namespace WhisperingWilds.Investigation
{
    public class TempleFolklorePuzzleController : MonoBehaviour
    {
        [Header("Puzzle Configuration")]
        [Tooltip("The correct sequence of stone mechanism positions (0-indexed).")]
        public int[] correctSequence = { 0, 2, 1 };

        [Tooltip("Number of failed attempts before showing a hint.")]
        public int hintThreshold = 3;

        [Tooltip("Stable puzzle ID for PuzzleStateStore persistence.")]
        public string puzzleId = "temple_folklore_puzzle";

        [Header("Audio Clips")]
        [Tooltip("Sound played when a stone mechanism is interacted with.")]
        public AudioClip stoneClickSound;
        [Tooltip("Sound played when the puzzle is solved correctly.")]
        public AudioClip puzzleSuccessSound;
        [Tooltip("Sound played when the puzzle sequence is wrong.")]
        public AudioClip wrongAnswerSound;
        [Tooltip("Sound played when the hidden chamber door opens.")]
        public AudioClip doorOpenSound;

        [Header("Clue Text (English)")]
        public string clue1English = "The first stone bears the symbol of the rising sun.";
        public string clue2English = "The second stone shows the flowing river Kaveri.";
        public string clue3English = "The third stone carries the palm tree of Chola.";

        [Header("Clue Text (Tamil)")]
        public string clue1Tamil = "முதல் கல்லில் சூரிய உதயத்தின் குறியீடு உள்ளது.";
        public string clue2Tamil = "இரண்டாவது கல்லில் காவிரி நதி ஓடுகிறது.";
        public string clue3Tamil = "மூன்றாவது கல்லில் சோழரின் தேன்மரம் உள்ளது.";

        [Header("Hint Text (English)")]
        public string hintEnglish = "Remember: Sun, River, Palm — the order of nature.";

        [Header("Hint Text (Tamil)")]
        public string hintTamil = "நினைவில் கொள்ளுங்கள்: சூரியன், நதி, தேன்மரம் — இயற்கையின் வரிசை.";

        // Puzzle state
        private int[] _currentSequence = { -1, -1, -1 };
        private int _failedAttempts;
        private bool _hintShown;
        private bool _puzzleCompleted;

        // References
        private AncientTempleLevelController _levelController;
        private StoneMechanism[] _mechanisms;

        private void Start()
        {
            // Find all StoneMechanism components in the scene
            _mechanisms = FindObjectsByType<StoneMechanism>(FindObjectsSortMode.None);
        }

        public void Initialize()
        {
            _levelController = FindObjectOfType<AncientTempleLevelController>();

            // Find all StoneMechanism components in the scene (in case Start already ran)
            if (_mechanisms == null)
            {
                _mechanisms = FindObjectsByType<StoneMechanism>(FindObjectsSortMode.None);
            }

            // Register discovery definition for the Kaveri Star Seal
            if (!DiscoveryLog.IsRegistered("kaveri_star_seal"))
            {
                DiscoveryLog.Register(new DiscoveryDefinition
                {
                    discoveryId = "kaveri_star_seal",
                    regionId = "ancient_temple",
                    titleEn = "Kaveri Star Seal",
                    titleTa = "காவிரி நட்சத்திர முத்திரை",
                    bodyEn = "An ancient stone seal bearing the constellation of the Kaveri river, said to grant wisdom to those who find it.",
                    bodyTa = "காவிரி நதியின் நட்சத்திர வடிவம் பொறிக்கப்பட்ட பழமையான கல் முத்திரை, அதனைக் கண்டுபிடிப்பவருக்கு ஞானம் தரும் என்று நம்பப்படுகிறது."
                });
            }
            
            // Restore solved state from PuzzleStateStore
            if (PuzzleStateStore.IsSolved(puzzleId))
            {
                _puzzleCompleted = true;
                Debug.Log($"[TemplePuzzle] Puzzle {puzzleId} restored as solved from save.");
            }
            else
            {
                ResetPuzzle();
            }
        }

        private void ResetPuzzle()
        {
            _currentSequence = new int[] { -1, -1, -1 };
            _failedAttempts = 0;
            _hintShown = false;
            _puzzleCompleted = false;
        }

        public void SetMechanismPosition(int mechanismIndex, int position)
        {
            if (_puzzleCompleted) return;

            if (mechanismIndex < 0 || mechanismIndex >= correctSequence.Length)
            {
                Debug.LogWarning($"[TemplePuzzle] Invalid mechanism index: {mechanismIndex}");
                return;
            }

            _currentSequence[mechanismIndex] = position;
            Debug.Log($"[TemplePuzzle] Mechanism {mechanismIndex} set to position {position}");

            // Play stone click sound
            if (AudioManager.Instance != null && stoneClickSound != null)
            {
                AudioManager.Instance.PlaySFX(stoneClickSound, transform.position);
            }

            // Check if all mechanisms are set
            bool allSet = true;
            for (int i = 0; i < _currentSequence.Length; i++)
            {
                if (_currentSequence[i] < 0)
                {
                    allSet = false;
                    break;
                }
            }

            if (allSet)
            {
                CheckSolution();
            }
        }

        private void CheckSolution()
        {
            bool isCorrect = true;
            for (int i = 0; i < correctSequence.Length; i++)
            {
                if (_currentSequence[i] != correctSequence[i])
                {
                    isCorrect = false;
                    break;
                }
            }

            if (isCorrect)
            {
                OnPuzzleSolved();
            }
            else
            {
                OnPuzzleFailed();
            }
        }

        private void OnPuzzleSolved()
        {
            _puzzleCompleted = true;
            Debug.Log("[TemplePuzzle] Puzzle solved! Hidden chamber unlocked.");

            // Play puzzle success sound
            if (AudioManager.Instance != null && puzzleSuccessSound != null)
            {
                AudioManager.Instance.PlaySFX(puzzleSuccessSound, transform.position);
            }

            // Record in PuzzleStateStore for save persistence
            PuzzleStateStore.MarkSolved(puzzleId);

            // Notify level controller
            if (_levelController != null)
            {
                _levelController.OnPuzzleCompleted();
            }

            // Open the hidden chamber door if referenced
            if (_levelController != null)
            {
                _levelController.OpenHiddenChamber();
                // Play door open sound after a short delay so it coincides with the door animation
                if (AudioManager.Instance != null && doorOpenSound != null)
                {
                    StartCoroutine(PlayDoorOpenSoundDelayed(0.5f));
                }
            }
        }

        private IEnumerator PlayDoorOpenSoundDelayed(float delay)
        {
            yield return new WaitForSeconds(delay);
            if (AudioManager.Instance != null && doorOpenSound != null)
            {
                AudioManager.Instance.PlaySFX(doorOpenSound, transform.position);
            }
        }

        private void OnPuzzleFailed()
        {
            _failedAttempts++;
            Debug.Log($"[TemplePuzzle] Incorrect sequence. Failed attempts: {_failedAttempts}");

            // Play wrong answer sound
            if (AudioManager.Instance != null && wrongAnswerSound != null)
            {
                AudioManager.Instance.PlaySFX(wrongAnswerSound, transform.position);
            }

            // Show hint after threshold
            if (!_hintShown && _failedAttempts >= hintThreshold)
            {
                ShowHint();
            }

            // Show failure feedback through the journal UI
            ShowFailureFeedback();
            StartCoroutine(ResetMechanismsAfterDelay(2f));
        }

        private void ShowFailureFeedback()
        {
            // Display wrong-answer feedback through the journal UI
            string feedback = LocalizationManager.Instance != null &&
                LocalizationManager.Instance.CurrentLanguage == Language.Tamil
                ? "தவறான வரிசை. மீண்டும் முயற்சிக்கவும்."
                : "Incorrect sequence. Try again.";
            
            // Show failure feedback through the HUD notification system
            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.ShowNotification(feedback, 3f);
            }
            else
            {
                Debug.LogWarning($"<color=#FF6B6B><b>[TemplePuzzle]</b></color> {feedback}");
            }
        }

        private void ShowHint()
        {
            _hintShown = true;
            bool useTamil = LocalizationManager.Instance != null &&
                LocalizationManager.Instance.CurrentLanguage == Language.Tamil;
            string hint = useTamil ? hintTamil : hintEnglish;
            
            // Display hint through the HUD notification system
            // so the player sees it in the actual game UI, not just the Console.
            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.ShowNotification(hint, 5f);
            }
            else
            {
                Debug.Log($"<color=#FFD700><b>[TemplePuzzle]</b></color> HINT: {hint}");
            }
        }

        private IEnumerator ResetMechanismsAfterDelay(float delay)
        {
            yield return new WaitForSeconds(delay);
            for (int i = 0; i < _currentSequence.Length; i++)
            {
                _currentSequence[i] = -1;
            }
            // Also reset the visual StoneMechanism components so the player sees them reset
            if (_mechanisms != null)
            {
                for (int i = 0; i < _mechanisms.Length; i++)
                {
                    if (_mechanisms[i] != null)
                    {
                        _mechanisms[i].ResetMechanism();
                    }
                }
            }
            Debug.Log("[TemplePuzzle] Mechanisms reset (logical + visual).");
        }

        public string GetClueText(int clueIndex, bool useTamil)
        {
            if (useTamil)
            {
                switch (clueIndex)
                {
                    case 0: return clue1Tamil;
                    case 1: return clue2Tamil;
                    case 2: return clue3Tamil;
                    default: return "";
                }
            }
            else
            {
                switch (clueIndex)
                {
                    case 0: return clue1English;
                    case 1: return clue2English;
                    case 2: return clue3English;
                    default: return "";
                }
            }
        }

        public string GetHintText(bool useTamil)
        {
            return useTamil ? hintTamil : hintEnglish;
        }

        public bool IsPuzzleCompleted() => _puzzleCompleted;
        public int GetFailedAttempts() => _failedAttempts;
        public bool IsHintShown() => _hintShown;
    }
}
