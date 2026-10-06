using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Trigger volume that reports a ReachLocation event the first time the player enters it.
    ///
    /// ReachLocation objectives need to fire on the player physically arriving somewhere, not on
    /// the player examining something there. A plain trigger volume is the honest way to express
    /// that: there is nothing to look at, so there is nothing to focus and nothing to prompt, and
    /// the arrival still registers.
    ///
    /// Reporting is once-only per instance, so walking back and forth through a doorway cannot
    /// inflate a counted objective or re-fire anything downstream. The event itself carries only the
    /// stable location id, so nothing about this object crosses the save boundary.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    [DisallowMultipleComponent]
    public class ArrivalTrigger : MonoBehaviour
    {
        [Tooltip("Stable location id reported on first entry, matched against ReachLocation quest objectives.")]
        [SerializeField] private string locationId;

        [Tooltip("Optional bilingual label used only in the editor hierarchy and debug logs.")]
        [SerializeField] private string debugLabel;

        public string LocationId => locationId;

        private bool reported;
        private bool warnedAboutMissingId;

        private void Reset()
        {
            // Keeps the authored collider a trigger: a solid box here would be a wall the player
            // bumps into instead of a volume they walk through.
            var col = GetComponent<Collider>();
            if (col != null) col.isTrigger = true;
        }

        private void Awake()
        {
            var col = GetComponent<Collider>();
            if (col != null && !col.isTrigger)
            {
                Debug.LogWarning($"[ArrivalTrigger '{name}'] is missing the isTrigger flag; correcting it so the volume does not block the player.");
                col.isTrigger = true;
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            ReportIfPlayer(other);
        }

        private void OnTriggerExit(Collider other) { }

        private void ReportIfPlayer(Collider other)
        {
            if (reported) return;
            if (other == null) return;

            // The player root carries the tag; the movement collider is a child of it.
            Transform root = other.transform.root;
            bool isPlayer = other.CompareTag("Player") || (root != null && root.CompareTag("Player"));
            if (!isPlayer) return;

            if (string.IsNullOrEmpty(locationId))
            {
                if (warnedAboutMissingId) return;
                warnedAboutMissingId = true;
                Debug.LogError($"[ArrivalTrigger '{name}'] has no locationId; it will not report any arrival.");
                return;
            }

            reported = true;
            GameplayEventBus.Report(QuestObjectiveType.ReachLocation, locationId);
            Debug.Log($"[ArrivalTrigger] Arrival reported for '{locationId}'{(string.IsNullOrEmpty(debugLabel) ? "" : $" ({debugLabel})")}.");
        }

        /// <summary>True once this volume has reported. Exposed for the smoke test.</summary>
        public bool HasReported => reported;

        /// <summary>
        /// Clears the reported flag. Only used when a scene is rebuilt in the editor, never at
        /// runtime, so a mid-quest reload cannot replay an arrival the player already triggered.
        /// </summary>
        public void ResetReportedState() => reported = false;
    }
}
