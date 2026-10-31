// ============================================================================
// THE WHISPERING WILDS — NAVAGRAHA SHADOW ALIGNMENT PUZZLE
// ============================================================================
//
// Manages the astronomical sunlight reflection puzzle in the outer courtyard
// of the ancient Dravidian temple ruins.
//
// Inspired by ancient Tamil Nadu solar temple engineering (e.g. Kumbakonam Nageswaran
// and Modhera/Konark solar alignments). Players rotate three brass mirror pedestals
// to align the morning sunbeam into the inner sanctum niche.
// ============================================================================

using System;
using System.Collections;
using UnityEngine;
using WhisperingWilds.Audio;
using WhisperingWilds.Localization;
using WhisperingWilds.UI;

namespace WhisperingWilds.Investigation
{
    public class NavagrahaShadowPuzzle : MonoBehaviour
    {
        [Header("Configuration")]
        [Tooltip("Stable puzzle identifier for PuzzleStateStore.")]
        public string puzzleId = "temple_navagraha_puzzle";

        [Tooltip("Target angles in degrees for the 3 mirror pedestals (0, 45, 90, 135, 180, 225, 270, 315).")]
        public int[] targetAngles = { 45, 90, 135 };

        [Tooltip("Allowed angular tolerance for alignment.")]
        public int toleranceDegrees = 5;

        [Header("Audio Clips")]
        [Tooltip("Sound played when a brass pedestal is rotated.")]
        public AudioClip pedestalRotateSound;
        [Tooltip("Sound played when the beam aligns with the sanctum lens.")]
        public AudioClip beamAlignedSound;

        [Header("Bilingual Inscription Clues")]
        public string clueEnglish = "Align the brass pedestals to catch the dawn light and reflect it into the inner sanctum.";
        public string clueTamil = "விடியற்காலையின் சூரியக் கதிர்களை உள் கருவறைக்குத் திருப்ப பித்தளைப் பீடங்களை நேர் செய்யுங்கள்.";

        public string hintEnglish = "The three mirrors follow the ecliptic path: 45 degrees East, 90 degrees Zenith, 135 degrees West.";
        public string hintTamil = "மூன்று கண்ணாடிகளும் சூரியப் பாதையைப் பின்பற்றுகின்றன: 45 பாகை கிழக்கு, 90 பாகை உச்சி, 135 பாகை மேற்கு.";

        [Header("Visual Feedback")]
        [Tooltip("Optional visual light beam GameObject to activate when aligned.")]
        public GameObject lightBeamVisual;

        // Current pedestal angles in degrees
        private int[] _currentAngles = { 0, 0, 0 };
        private bool _isSolved;
        private int _failedRotations;

        public event Action OnNavagrahaSolved;

        private void Start()
        {
            Initialize();
        }

        public void Initialize()
        {
            // Register Discovery Definition for the Solar Alignment
            if (!DiscoveryLog.IsRegistered("temple_solar_alignment"))
            {
                DiscoveryLog.Register(new DiscoveryDefinition
                {
                    discoveryId = "temple_solar_alignment",
                    regionId = "ancient_temple",
                    titleEn = "Navagraha Solar Alignment",
                    titleTa = "நவகிரக சூரிய ஒருங்கமைப்பு",
                    bodyEn = "The celestial alignment of brass mirrors reveals ancient Dravidian mastery of solar equinox astronomy.",
                    bodyTa = "பித்தளைக் கண்ணாடிகளின் வான்வழி அமைப்பு, பண்டைய திராவிடர்களின் சூரிய சமபக்க வானியல் அறிவை வெளிப்படுத்துகிறது."
                });
            }

            // Restore state if already solved
            if (PuzzleStateStore.IsSolved(puzzleId))
            {
                _isSolved = true;
                _currentAngles = (int[])targetAngles.Clone();
                if (lightBeamVisual != null) lightBeamVisual.SetActive(true);
                Debug.Log($"[NavagrahaPuzzle] Puzzle {puzzleId} restored as solved from save.");
            }
            else
            {
                ResetPedestals();
            }
        }

        public void ResetPedestals()
        {
            _currentAngles = new int[] { 0, 0, 0 };
            _isSolved = false;
            if (lightBeamVisual != null) lightBeamVisual.SetActive(false);
        }

        /// <summary>
        /// Rotates a pedestal by 45 degrees clockwise.
        /// </summary>
        public bool RotatePedestal(int pedestalIndex)
        {
            if (_isSolved) return false;
            if (pedestalIndex < 0 || pedestalIndex >= _currentAngles.Length) return false;

            _currentAngles[pedestalIndex] = (_currentAngles[pedestalIndex] + 45) % 360;

            if (AudioManager.Instance != null && pedestalRotateSound != null)
            {
                AudioManager.Instance.PlaySFX(pedestalRotateSound, transform.position);
            }

            Debug.Log($"[NavagrahaPuzzle] Pedestal {pedestalIndex} rotated to {_currentAngles[pedestalIndex]}°");
            return CheckAlignment();
        }

        /// <summary>
        /// Directly sets a pedestal angle (for tests and save restoration).
        /// </summary>
        public void SetPedestalAngle(int pedestalIndex, int angleDegrees)
        {
            if (pedestalIndex >= 0 && pedestalIndex < _currentAngles.Length)
            {
                _currentAngles[pedestalIndex] = (angleDegrees % 360 + 360) % 360;
                CheckAlignment();
            }
        }

        public int GetPedestalAngle(int pedestalIndex)
        {
            if (pedestalIndex >= 0 && pedestalIndex < _currentAngles.Length)
            {
                return _currentAngles[pedestalIndex];
            }
            return -1;
        }

        public bool CheckAlignment()
        {
            if (_isSolved) return true;

            for (int i = 0; i < targetAngles.Length; i++)
            {
                int diff = Mathf.Abs(_currentAngles[i] - targetAngles[i]);
                if (diff > toleranceDegrees && diff < (360 - toleranceDegrees))
                {
                    return false;
                }
            }

            // All pedestals aligned!
            _isSolved = true;
            PuzzleStateStore.MarkSolved(puzzleId);
            DiscoveryLog.Record("temple_solar_alignment");

            if (lightBeamVisual != null) lightBeamVisual.SetActive(true);

            if (AudioManager.Instance != null && beamAlignedSound != null)
            {
                AudioManager.Instance.PlaySFX(beamAlignedSound, transform.position);
            }

            string notice = (LocalizationManager.Instance != null && LocalizationManager.Instance.CurrentLanguage == Language.Tamil)
                ? "நவகிரக சூரிய ஒளிக்கதிர் கருவறையுடன் இணைந்தது!"
                : "Navagraha solar beam aligned with the inner sanctum!";

            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.ShowNotification(notice, 4f);
            }
            else
            {
                Debug.Log($"<color=#00FFAA><b>[NavagrahaPuzzle]</b></color> {notice}");
            }

            OnNavagrahaSolved?.Invoke();
            return true;
        }

        public string GetClueText(bool useTamil) => useTamil ? clueTamil : clueEnglish;
        public string GetHintText(bool useTamil) => useTamil ? hintTamil : hintEnglish;
        public bool IsSolved() => _isSolved;
    }
}
