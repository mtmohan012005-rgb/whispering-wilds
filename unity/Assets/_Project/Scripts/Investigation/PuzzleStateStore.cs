using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Investigation
{
    /// <summary>
    /// Static store of solved environmental puzzles, keyed by stable puzzle id.
    ///
    /// Only the resolved outcome is persisted, never the mid-solve dial positions or any other
    /// transient mechanism state. That is the whole reason a Chettinad-style lock is safe to save:
    /// the solution is authored data, so a restored puzzle can be checked against the same constant
    /// the player solved it with and a mid-solve reload simply starts the mechanism from its
    /// initial position without any chance of the save and the mechanism disagreeing.
    ///
    /// Mirrors <see cref="InvestigationRuntimeState"/> in shape: a static mirror for the scene-bound
    /// mechanism components, so save capture and the journal can read solved state without one.
    /// </summary>
    public static class PuzzleStateStore
    {
        private static readonly HashSet<string> SolvedPuzzleIds =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>Raised with the puzzle id the first time it is resolved, and again for every
        /// solved puzzle found in a save being restored.</summary>
        public static event Action<string> OnPuzzleSolved;

        public static bool IsSolved(string puzzleId) =>
            !string.IsNullOrEmpty(puzzleId) && SolvedPuzzleIds.Contains(puzzleId);

        /// <summary>
        /// Records a puzzle as solved. Returns false when it was already solved, so a mechanism that
        /// re-triggers on a second interaction cannot replay its resolve notification or re-satisfy
        /// a quest objective.
        /// </summary>
        public static bool MarkSolved(string puzzleId)
        {
            if (string.IsNullOrEmpty(puzzleId)) return false;
            if (!SolvedPuzzleIds.Add(puzzleId)) return false;

            Debug.Log($"<color=#FFD700><b>[PuzzleStateStore]</b></color> Puzzle solved: {puzzleId}");
            OnPuzzleSolved?.Invoke(puzzleId);
            return true;
        }

        /// <summary>Solved puzzle ids only. Stable and ordered for deterministic save output.</summary>
        public static List<string> SnapshotSolvedPuzzleIds()
        {
            var ids = new List<string>(SolvedPuzzleIds);
            ids.Sort(StringComparer.OrdinalIgnoreCase);
            return ids;
        }

        /// <summary>
        /// Rebuilds solved state from a save. Blank ids are dropped.
        ///
        /// This raises <see cref="OnPuzzleSolved"/> for each restored id. It does not report a
        /// gameplay event, so no quest objective is re-satisfied; it only tells scene mechanisms to
        /// re-apply their solved presentation. Without it, a mechanism whose <c>OnEnable</c> already
        /// ran before the payload was applied would stay visibly unsolved after a Continue.
        /// </summary>
        public static void RestoreSolvedPuzzleIds(List<string> puzzleIds)
        {
            SolvedPuzzleIds.Clear();
            if (puzzleIds == null) return;

            for (int i = 0; i < puzzleIds.Count; i++)
            {
                string id = puzzleIds[i];
                if (string.IsNullOrEmpty(id)) continue;
                if (!SolvedPuzzleIds.Add(id)) continue;
                OnPuzzleSolved?.Invoke(id);
            }
        }

        public static void Clear() => SolvedPuzzleIds.Clear();
    }
}
