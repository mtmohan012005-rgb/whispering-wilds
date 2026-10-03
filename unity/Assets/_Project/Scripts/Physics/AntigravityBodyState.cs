using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.PhysicsZones
{
    /// <summary>
    /// Per-body record of the antigravity state applied to it, plus the pre-zone
    /// values needed to restore it exactly.
    ///
    /// Lives on the body rather than in a manager-side dictionary so that:
    ///  - duplicate registration is impossible (one component per body),
    ///  - a destroyed body cannot leave a dangling manager entry,
    ///  - cleanup does not require scanning global state.
    ///
    /// Also keeps a scene-wide registry of every floating-capable body. Save restore
    /// needs that: a body that was floating when the game was saved has not yet
    /// entered a zone after a reload, so it is absent from any zone's active list and
    /// would otherwise be silently unrestored.
    /// </summary>
    [DisallowMultipleComponent]
    public sealed class AntigravityBodyState : MonoBehaviour
    {
        private static readonly List<AntigravityBodyState> allBodies = new List<AntigravityBodyState>(128);

        /// <summary>Every registered floating-capable body in the loaded scene.</summary>
        public static IReadOnlyList<AntigravityBodyState> Registered => allBodies;

        [System.NonSerialized] public string ZoneId;
        [System.NonSerialized] public float ZoneDrag;
        [System.NonSerialized] public float ZoneAngularDrag;

        // Captured on admission so exit restores the authored values rather than
        // assuming gravity-on and damping zero.
        [System.NonSerialized] public bool OriginalUseGravity;
        [System.NonSerialized] public float OriginalLinearDamping;
        [System.NonSerialized] public float OriginalAngularDamping;

        /// <summary>Contacts observed during the single entry-time collision inspection.</summary>
        [System.NonSerialized] public int EntryContactCount;

        public bool IsFloating => ZoneId != null;

        /// <summary>
        /// Stable identifier used as the save key. Derived from the scene name and
        /// hierarchy path so it survives session reloads without a hand-assigned id,
        /// then cached so the string is built at most once per body.
        /// </summary>
        public string FloatingObjectId
        {
            get
            {
                if (!string.IsNullOrEmpty(cachedObjectId)) return cachedObjectId;

                Transform t = transform;
                string path = t.name;
                while (t.parent != null)
                {
                    t = t.parent;
                    path = t.name + "/" + path;
                }

                cachedObjectId = gameObject.scene.name + "::" + path;
                return cachedObjectId;
            }
        }

        [System.NonSerialized] private string cachedObjectId;

        /// <summary>Rigidbody this state belongs to. Cached; resolved on enable.</summary>
        public Rigidbody Body { get; private set; }

        private void OnEnable()
        {
            if (Body == null) Body = GetComponent<Rigidbody>();
            if (!allBodies.Contains(this)) allBodies.Add(this);
        }

        private void OnDisable()
        {
            allBodies.Remove(this);
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetStatics()
        {
            allBodies.Clear();
        }

        /// <summary>
        /// Guarantees the registry reflects the loaded scene.
        ///
        /// Enter Play Mode with domain reload disabled also skips OnEnable for objects
        /// that were already enabled, which would leave the registry empty and save
        /// restore silently doing nothing. Rescanning is only done when the registry
        /// is empty, and only from save/load, so the cost is irrelevant at runtime.
        /// </summary>
        public static void EnsureRegistry()
        {
            if (allBodies.Count > 0) return;

            var found = FindObjectsByType<AntigravityBodyState>(
                FindObjectsInactive.Exclude, FindObjectsSortMode.None);

            allBodies.Clear();
            for (int i = 0; i < found.Length; i++)
            {
                var body = found[i];
                if (body == null) continue;
                if (body.Body == null) body.Body = body.GetComponent<Rigidbody>();
                allBodies.Add(body);
            }
        }

        /// <summary>
        /// Restores the exact pre-zone rigidbody state. Safe to call more than once.
        /// </summary>
        public void Restore(Rigidbody rb)
        {
            if (rb == null) return;

            rb.useGravity = OriginalUseGravity;
            rb.linearDamping = OriginalLinearDamping;
            rb.angularDamping = OriginalAngularDamping;
        }
    }
}