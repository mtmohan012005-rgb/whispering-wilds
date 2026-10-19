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

namespace WhisperingWilds.Investigation
{
    public class TempleFolklorePuzzleController : MonoBehaviour
    {
        [Header("Puzzle Configuration")]
        [Tooltip("The correct sequence of stone mechanism positions (0-indexed).")]
        public int[] correctSequence = { 0, 2, 1 };

        [Tooltip("Number of failed attempts before showing a hint.")]
        public int hintThreshold = 3;

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

        public void Initialize()
        {
            _levelController = FindObjectOfType<AncientTempleLevelController>();
            ResetPuzzle();
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

            // Notify level controller
            if (_levelController != null)
            {
                _levelController.OnPuzzleCompleted();
            }

            // TODO: Play success animation and audio
            // TODO: Open hidden chamber door
        }

        private void OnPuzzleFailed()
        {
            _failedAttempts++;
            Debug.Log($"[TemplePuzzle] Incorrect sequence. Failed attempts: {_failedAttempts}");

            // Show hint after threshold
            if (!_hintShown && _failedAttempts >= hintThreshold)
            {
                ShowHint();
            }

            // TODO: Play failure sound and visual feedback
            // TODO: Reset mechanisms after delay
            StartCoroutine(ResetMechanismsAfterDelay(2f));
        }

        private void ShowHint()
        {
            _hintShown = true;
            // TODO: Display hint in UI using LocalizationManager
            Debug.Log($"[TemplePuzzle] Hint shown: {hintEnglish}");
        }

        private IEnumerator ResetMechanismsAfterDelay(float delay)
        {
            yield return new WaitForSeconds(delay);
            for (int i = 0; i < _currentSequence.Length; i++)
            {
                _currentSequence[i] = -1;
            }
            Debug.Log("[TemplePuzzle] Mechanisms reset.");
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
