// ============================================================================
// THE WHISPERING WILDS — ACOUSTIC MUSICAL PILLAR PUZZLE
// ============================================================================
//
// Manages the acoustic resonance musical pillar puzzle in the mandapa chamber
// of the ancient Dravidian temple ruins.
//
// Inspired by the world-famous carved musical pillars (இசைத் தூண்கள்) of
// Madurai Meenakshi Amman Temple and Tirunelveli Nellaiappar Temple.
// Players strike carved granite pillars tuned to the pentatonic Mohanam raga
// (Sa, Ri, Ga, Pa, Dha) in the harmonic sequence [0, 2, 3, 1, 4] to open the final seal.
// ============================================================================

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Audio;
using WhisperingWilds.Localization;
using WhisperingWilds.UI;

namespace WhisperingWilds.Investigation
{
    public class AcousticPillarPuzzle : MonoBehaviour
    {
        [Header("Configuration")]
        [Tooltip("Stable puzzle identifier for PuzzleStateStore.")]
        public string puzzleId = "temple_acoustic_pillar_puzzle";

        [Tooltip("The required pillar strike sequence (0=Sa, 1=Ri, 2=Ga, 3=Pa, 4=Dha).")]
        public int[] targetSequence = { 0, 2, 3, 1, 4 };

        [Header("Pillar Audio Notes")]
        [Tooltip("Audio clips for the 5 Carnatic musical notes (Sa, Ri, Ga, Pa, Dha).")]
        public AudioClip[] noteClips;

        [Tooltip("Audio played when harmonic resonance is achieved.")]
        public AudioClip harmonicResonanceSound;

        [Tooltip("Audio played when dissonance occurs (sequence broken).")]
        public AudioClip dissonanceSound;

        [Header("Bilingual Inscription Clues")]
        public string clueEnglish = "Strike the five resonant pillars of the mandapa in the natural order of Mohanam raga: Sa, Ga, Pa, Ri, Dha.";
        public string clueTamil = "மோகன ராகத்தின் இயற்கையான வரிசையில் மண்டபத்தின் ஐந்து இசைத் தூண்களை மீட்டுக: ச, க, ப, ரி, த.";

        public string hintEnglish = "Listen to the resonance pitch: from deepest stone (Sa) rising through the skies.";
        public string hintTamil = "நாதத்தின் ஒலியை உற்றுக் கேளுங்கள்: ஆழமான மூல நாதத்திலிருந்து (ச) வான் வரை உயரும் இசை.";

        // Strike sequence tracking
        private List<int> _currentStrikes = new List<int>();
        private bool _isSolved;
        private int _failedAttempts;

        public event Action OnAcousticSolved;

        private void Start()
        {
            Initialize();
        }

        public void Initialize()
        {
            // Register Discovery Definition for the Dravidian Musical Pillars
            if (!DiscoveryLog.IsRegistered("temple_musical_pillars"))
            {
                DiscoveryLog.Register(new DiscoveryDefinition
                {
                    discoveryId = "temple_musical_pillars",
                    regionId = "ancient_temple",
                    titleEn = "Dravidian Acoustic Pillar Harmony",
                    titleTa = "திராவிட இசைத் தூண் இசைவமைப்பு",
                    bodyEn = "Carved from monolithic granite, these acoustic pillars vibrate with pure harmonic frequencies when struck, unlocking the innermost sanctum latch.",
                    bodyTa = "ஒற்றைக் கருங்கல்லில் செதுக்கப்பட்ட இந்த இசைத் தூண்கள், மீட்டும் போது தூய இசை அலைவரிசையுடன் அதிர்ந்து கருவறையின் உள் தாழ்ப்பாளைத் திறக்கின்றன."
                });
            }

            // Restore state if already solved
            if (PuzzleStateStore.IsSolved(puzzleId))
            {
                _isSolved = true;
                Debug.Log($"[AcousticPuzzle] Puzzle {puzzleId} restored as solved from save.");
            }
            else
            {
                ResetSequence();
            }
        }

        public void ResetSequence()
        {
            _currentStrikes.Clear();
            _isSolved = false;
        }

        /// <summary>
        /// Player strikes one of the 5 musical pillars (0 to 4).
        /// </summary>
        public bool StrikePillar(int pillarIndex)
        {
            if (_isSolved) return true;
            if (pillarIndex < 0 || pillarIndex >= 5) return false;

            // Play note sound
            if (AudioManager.Instance != null && noteClips != null && pillarIndex < noteClips.Length && noteClips[pillarIndex] != null)
            {
                AudioManager.Instance.PlaySFX(noteClips[pillarIndex], transform.position);
            }

            _currentStrikes.Add(pillarIndex);
            int stepIndex = _currentStrikes.Count - 1;

            // Check if current strike matches target sequence step
            if (_currentStrikes[stepIndex] != targetSequence[stepIndex])
            {
                // Dissonance / Mismatch
                Debug.Log($"[AcousticPuzzle] Incorrect note at step {stepIndex}. Expected {targetSequence[stepIndex]}, got {pillarIndex}.");
                _failedAttempts++;

                if (AudioManager.Instance != null && dissonanceSound != null)
                {
                    AudioManager.Instance.PlaySFX(dissonanceSound, transform.position);
                }

                _currentStrikes.Clear();
                return false;
            }

            // Check if full sequence completed
            if (_currentStrikes.Count == targetSequence.Length)
            {
                _isSolved = true;
                PuzzleStateStore.MarkSolved(puzzleId);
                DiscoveryLog.Record("temple_musical_pillars");

                if (AudioManager.Instance != null && harmonicResonanceSound != null)
                {
                    AudioManager.Instance.PlaySFX(harmonicResonanceSound, transform.position);
                }

                string notice = (LocalizationManager.Instance != null && LocalizationManager.Instance.CurrentLanguage == Language.Tamil)
                    ? "இசைத் தூண்களின் மோகன ராக இசைவமைப்பு கருவறைத் தாழ்ப்பாளை விடுவித்தது!"
                    : "The harmonic resonance of the musical pillars released the sanctum latch!";

                if (HUDManager.Instance != null)
                {
                    HUDManager.Instance.ShowNotification(notice, 4f);
                }
                else
                {
                    Debug.Log($"<color=#00FFAA><b>[AcousticPuzzle]</b></color> {notice}");
                }

                OnAcousticSolved?.Invoke();
                return true;
            }

            Debug.Log($"[AcousticPuzzle] Note {pillarIndex} struck correctly ({_currentStrikes.Count}/{targetSequence.Length}).");
            return false;
        }

        public string GetClueText(bool useTamil) => useTamil ? clueTamil : clueEnglish;
        public string GetHintText(bool useTamil) => useTamil ? hintTamil : hintEnglish;
        public bool IsSolved() => _isSolved;
        public int GetCurrentStep() => _currentStrikes.Count;
        public int GetTargetLength() => targetSequence.Length;
    }
}
