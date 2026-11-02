// ============================================================================
// THE WHISPERING WILDS — ACOUSTIC PILLAR INTERACTABLE
// ============================================================================
//
// Interactable component for musical granite pillars in the ancient temple mandapa.
// Implements IInteractable so players can approach and strike individual resonant pillars.
// Advances the AcousticPillarPuzzle Carnatic sequence (Sa, Ri, Ga, Pa, Dha).
// ============================================================================

using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.Localization;
using WhisperingWilds.UI;

namespace WhisperingWilds.Investigation
{
    public class AcousticPillarInteractable : MonoBehaviour, IInteractable
    {
        private static readonly string[] NoteNamesEn = { "Sa (Stone)", "Ri (Wind)", "Ga (Fire)", "Pa (Water)", "Dha (Sky)" };
        private static readonly string[] NoteNamesTa = { "ச (நிலம்)", "ரி (காற்று)", "க (நெருப்பு)", "ப (நீர்)", "த (ஆகாயம்)" };

        [Header("Pillar Configuration")]
        [Tooltip("Index of this musical pillar (0=Sa, 1=Ri, 2=Ga, 3=Pa, 4=Dha).")]
        public int pillarIndex = 0;

        [Tooltip("Reference to the parent AcousticPillarPuzzle controller.")]
        public AcousticPillarPuzzle puzzle;

        private void Start()
        {
            if (puzzle == null)
            {
                puzzle = FindObjectOfType<AcousticPillarPuzzle>();
            }
        }

        #region IInteractable Implementation

        public string InteractionPrompt
        {
            get
            {
                if (puzzle != null && puzzle.IsSolved()) return string.Empty;

                bool useTamil = LocalizationManager.Instance != null &&
                                LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

                int idx = Mathf.Clamp(pillarIndex, 0, NoteNamesEn.Length - 1);
                return useTamil
                    ? $"[E] இசைத் தூணை மீட்டு ({NoteNamesTa[idx]})"
                    : $"[E] Strike Pillar ({NoteNamesEn[idx]})";
            }
        }

        public InteractionType Type => InteractionType.Inspect;

        public bool CanInteract(PlayerInteractor interactor)
        {
            return puzzle != null && !puzzle.IsSolved();
        }

        public void Interact(PlayerInteractor interactor)
        {
            if (!CanInteract(interactor)) return;

            int idx = Mathf.Clamp(pillarIndex, 0, NoteNamesEn.Length - 1);
            bool wasSolved = puzzle.StrikePillar(pillarIndex);
            int step = puzzle.GetCurrentStep();
            int total = puzzle.GetTargetLength();

            bool useTamil = LocalizationManager.Instance != null &&
                            LocalizationManager.Instance.CurrentLanguage == Language.Tamil;

            string feedback;
            if (wasSolved)
            {
                feedback = useTamil
                    ? $"மோகன ராக இசைவமைப்பு நிறைவு பெற்றது! ({NoteNamesTa[idx]})"
                    : $"Harmonic resonance unlocked! ({NoteNamesEn[idx]})";
            }
            else if (step > 0)
            {
                feedback = useTamil
                    ? $"நாதம்: {NoteNamesTa[idx]} — இசைவமைப்பு: {step}/{total}"
                    : $"Resonant Note: {NoteNamesEn[idx]} — Harmony: {step}/{total}";
            }
            else
            {
                feedback = useTamil
                    ? $"சுருதி முரண்! வரிசை மீளமைக்கப்பட்டது ({NoteNamesTa[idx]})"
                    : $"Dissonance! Melodic sequence reset ({NoteNamesEn[idx]})";
            }

            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.ShowNotification(feedback, 2.5f);
            }
        }

        public void OnFocusEnter()
        {
            if (puzzle != null && !puzzle.IsSolved())
            {
                Debug.Log($"[AcousticPillar{pillarIndex}] Player focused on musical pillar.");
            }
        }

        public void OnFocusExit()
        {
        }

        #endregion
    }
}
