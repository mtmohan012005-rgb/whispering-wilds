using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Investigation;
using WhisperingWilds.Localization;
using WhisperingWilds.UI;

namespace WhisperingWilds.World
{
    /// <summary>
    /// The Chettinad mansion's three-dial medallion lock and the wall it opens.
    ///
    /// The lock is deterministic by construction. Its solution is authored data in
    /// <see cref="ChettinadMansionContent.MedallionOrderSolution"/>, derived from what the three
    /// architectural clue descriptions tell the player, and the lock refuses to judge a combination
    /// until all three of those clues are recorded. There is no random seed and no hidden state, so
    /// a save taken at any point restores into a puzzle that either is solved or is not.
    ///
    /// There is no submit button. Each dial is its own interactable, and the lock judges itself
    /// whenever the player has turned every dial at least once. That is deliberate: a separate
    /// "confirm" lever would have to compete with the dials for the player's focus, and whichever
    /// won would be arbitrary. Removing it removes the ambiguity rather than tuning around it.
    ///
    /// Only the resolved outcome is persisted, via <see cref="PuzzleStateStore"/>. Dial positions
    /// are session-local and start at the authored minimum, so reloading mid-attempt costs the player
    /// their current combination and nothing else.
    ///
    /// The objective event fires on solve only. Reporting on every turn would let the player
    /// complete "solve the mansion puzzle" by touching it once, which is the beat the puzzle exists
    /// to gate.
    /// </summary>
    [DisallowMultipleComponent]
    public class MansionPuzzleController : MonoBehaviour
    {
        [Header("Identity")]
        [Tooltip("Stable puzzle id the solved state is persisted under.")]
        [SerializeField] private string puzzleId = ChettinadMansionContent.PuzzleMedallionOrder;

        [Tooltip("Stable object id reported to the quest when the lock is solved.")]
        [SerializeField] private string solvedEventTargetId = ChettinadMansionContent.ObjectMansionDialMechanism;

        [Header("Dials")]
        [Tooltip("The dial components this lock drives, in solution order.")]
        [SerializeField] private MansionDial[] dials = new MansionDial[0];

        [Header("Revealed Area")]
        [Tooltip("Wall or panel that moves when the lock is solved. Disabled on solve.")]
        [SerializeField] private GameObject wallToReveal;

        [Tooltip("Discovery recorded when the lock opens.")]
        [SerializeField] private string discoveryOnSolvedId = ChettinadMansionContent.DiscoveryHiddenRoom;

        public bool IsSolved => PuzzleStateStore.IsSolved(puzzleId);

        /// <summary>The dials this lock drives. Exposed so the scene builder can wire them in order.</summary>
        public MansionDial[] Dials => dials;

        /// <summary>Live dial values, in solution order. Read by the smoke test to verify a solve.</summary>
        public int[] CurrentDialValues
        {
            get
            {
                var values = new int[dials?.Length ?? 0];
                for (int i = 0; i < values.Length; i++) values[i] = dials[i] != null ? dials[i].Value : -1;
                return values;
            }
        }

        /// <summary>Verdicts given this session. Exposed so the hint cadence is verifiable.</summary>
        public int WrongAttempts { get; private set; }

        private void Awake()
        {
            GameplayContentRegistry.EnsureAllInitialized();
            ResetDialsToStart();
        }

        private void OnEnable()
        {
            // A save restored into this scene finds the wall already open, so the player never has
            // to re-solve a puzzle the campaign already records as solved.
            PuzzleStateStore.OnPuzzleSolved += HandleExternalSolve;
            ApplyPersistedState();
        }

        private void OnDisable()
        {
            PuzzleStateStore.OnPuzzleSolved -= HandleExternalSolve;
        }

        private void ApplyPersistedState()
        {
            if (IsSolved) OpenRevealedArea();
        }

        private void HandleExternalSolve(string solvedPuzzleId)
        {
            if (string.Equals(solvedPuzzleId, puzzleId, System.StringComparison.Ordinal)) OpenRevealedArea();
        }

        private void ResetDialsToStart()
        {
            if (dials == null) return;
            for (int i = 0; i < dials.Length; i++)
            {
                if (dials[i] != null) dials[i].ResetToStart();
            }
        }

        // ---- Dial interaction ------------------------------------------------

        /// <summary>
        /// Advances one dial by one step, wrapping at the authored maximum, then judges the
        /// combination. Called only by <see cref="MansionDial"/>, so the lock never has to know
        /// whether a dial was turned by a player or by the smoke test.
        /// </summary>
        public void TurnDial(int dialIndex)
        {
            if (IsSolved) return;
            if (dials == null || dialIndex < 0 || dialIndex >= dials.Length) return;
            if (dials[dialIndex] == null) return;

            dials[dialIndex].CycleForward();
            NotifyDials();

            EvaluateAfterTurn();
        }

        /// <summary>Sets one dial to an exact value without judging, for load and the smoke test.</summary>
        public void SetDial(int dialIndex, int value)
        {
            if (dials == null || dialIndex < 0 || dialIndex >= dials.Length) return;
            if (dials[dialIndex] != null) dials[dialIndex].SetValue(value);
        }

        /// <summary>
        /// Judges the current combination once every dial has been turned since the last verdict.
        ///
        /// The "every dial turned" condition is what keeps a wrong combination from producing a
        /// notification on every subsequent turn, and it also means the verdict matches what the
        /// player is actually reading on the dials rather than judging a half-entered attempt.
        /// </summary>
        public void EvaluateAfterTurn()
        {
            if (IsSolved) return;
            if (!AllDialsTurned()) return;

            // The lock refuses to judge anything until all three architectural clues are recorded.
            // This is what makes the clues load-bearing rather than decorative: without it the
            // puzzle would be solvable by turning dials at random, and a player who found only one
            // medallion could brute-force the answer before learning what the medallions mean.
            if (!AllCluesKnown())
            {
                Notify("chettinad.puzzle.needs_clues", 5.5f);
                ClearTurnFlags();
                return;
            }

            if (MatchesSolution())
            {
                Solve();
                return;
            }

            WrongAttempts++;
            Notify("chettinad.puzzle.wrong", 4.0f);

            // Hints escalate only after the player has actually tried, so the puzzle is solvable
            // from the courtyard alone but is never handed over for free.
            if (WrongAttempts == 1) Notify("chettinad.puzzle.hint_1", 6.0f);
            else if (WrongAttempts == 2) Notify("chettinad.puzzle.hint_2", 6.0f);

            ClearTurnFlags();
        }

        /// <summary>
        /// True when the sun, serpent, and wheel medallion carvings have all been recorded.
        /// </summary>
        public bool AllCluesKnown()
        {
            var mgr = InvestigationManager.Instance;
            if (mgr == null) return false;

            if (!mgr.HasClue(ChettinadMansionContent.ClueMarkSun)) return false;
            if (!mgr.HasClue(ChettinadMansionContent.ClueMarkSerpent)) return false;
            if (!mgr.HasClue(ChettinadMansionContent.ClueMarkWheel)) return false;
            return true;
        }

        private bool AllDialsTurned()
        {
            if (dials == null || dials.Length == 0) return false;
            for (int i = 0; i < dials.Length; i++)
            {
                if (dials[i] == null || !dials[i].HasBeenTurned) return false;
            }
            return true;
        }

        private void ClearTurnFlags()
        {
            if (dials == null) return;
            for (int i = 0; i < dials.Length; i++)
            {
                if (dials[i] != null) dials[i].ClearTurned();
            }
        }

        // ---- Solving ---------------------------------------------------------

        private bool MatchesSolution()
        {
            var solution = ChettinadMansionContent.MedallionOrderSolution;
            if (dials == null || dials.Length != solution.Length) return false;

            for (int i = 0; i < solution.Length; i++)
            {
                if (dials[i] == null || dials[i].Value != solution[i]) return false;
            }
            return true;
        }

        private void Solve()
        {
            // MarkSolved returns false when it was already recorded, which keeps a second solve from
            // replaying the resolve notification or re-reporting the objective.
            bool firstSolve = PuzzleStateStore.MarkSolved(puzzleId);

            OpenRevealedArea();

            if (!string.IsNullOrEmpty(solvedEventTargetId))
            {
                GameplayEventBus.Report(QuestObjectiveType.InvestigateObject, solvedEventTargetId);
            }

            if (!string.IsNullOrEmpty(discoveryOnSolvedId))
            {
                DiscoveryLog.Record(discoveryOnSolvedId);
            }

            if (firstSolve) Notify("chettinad.puzzle.solved", 6.0f);

            Debug.Log($"<color=#FFD700><b>[MansionPuzzle]</b></color> Medallion lock solved. Correct order: {DescribeSolution()}.");
        }

        private void OpenRevealedArea()
        {
            if (wallToReveal == null) return;
            if (!wallToReveal.activeSelf) return;
            wallToReveal.SetActive(false);
        }

        private static string DescribeSolution()
        {
            var solution = ChettinadMansionContent.MedallionOrderSolution;
            var parts = new string[solution.Length];
            for (int i = 0; i < solution.Length; i++) parts[i] = solution[i].ToString();
            return string.Join(", ", parts);
        }

        // ---- Feedback --------------------------------------------------------

        /// <summary>
        /// Shows the whole combination rather than just the dial that moved. Three dials in a row
        /// cannot each hold a toast, and the player needs the full reading to reason about the order.
        /// </summary>
        private void NotifyDials()
        {
            if (HUDManager.Instance == null) return;
            if (dials == null || dials.Length == 0) return;

            var values = CurrentDialValues;
            HUDManager.Instance.ShowNotificationKey("chettinad.puzzle.dials", 1.5f, values);
        }

        private static void Notify(string key, float duration)
        {
            if (HUDManager.Instance == null) return;
            HUDManager.Instance.ShowNotificationKey(key, duration);
        }
    }
}
