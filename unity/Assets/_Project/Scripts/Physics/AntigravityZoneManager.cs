using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Quality;
using WhisperingWilds.Player;

namespace WhisperingWilds.PhysicsZones
{
    /// <summary>
    /// Applies an inverted-gravity field to Rigidbody props that enter the zone trigger.
    ///
    /// Deliberate non-goals, each of which caused real defects in the original design:
    ///  - This never touches Time.fixedDeltaTime, Physics.autoSimulation or
    ///    Physics.simulationMode. Setting autoSimulation false without a matching
    ///    Physics.Simulate call stops physics for the whole game; that is a global
    ///    side effect that gameplay code must not own. Low-end cost is managed by
    ///    bounding the active body count instead.
    ///  - It never calls FindObjectsByType / FindGameObjectsWithTag. Membership is
    ///    event-driven and cached.
    ///  - FixedUpdate performs no allocation: the active list is pre-sized and only
    ///    ever shrunk in place.
    ///
    /// PhysX remains authoritative for collision, contacts and integration. This
    /// component only changes per-body gravity/damping and applies an upward force.
    /// </summary>
    [DisallowMultipleComponent]
    public class AntigravityZoneManager : MonoBehaviour
    {
        public const string InteractableTag = "Interactable";

        // CompareTag against an undefined tag logs an error on every call, and
        // OnTriggerEnter fires per contact, so a misconfigured project would flood the
        // log and bury real failures. Tag existence is probed once during Awake (safe to
        // touch the hierarchy there, unlike inside a physics callback) and cached, so a
        // missing tag disables admission with one clear message instead of spamming.
        private static bool? interactableTagDefined;

        private static bool InteractableTagUsable => ResolveInteractableTagUsable();

        private static bool ResolveInteractableTagUsable()
        {
            if (interactableTagDefined.HasValue) return interactableTagDefined.Value;

            interactableTagDefined = true;
            try
            {
                var probe = new GameObject("__tag_probe");
                try
                {
                    probe.CompareTag(InteractableTag);
                }
                finally
                {
                    Destroy(probe);
                }
            }
            catch (System.Exception)
            {
                interactableTagDefined = false;
                Debug.LogError(
                    $"[AntigravityZoneManager] Tag '{InteractableTag}' is not defined in " +
                    "ProjectSettings/TagManager.asset. No bodies will be admitted to zero-g fields.");
            }

            return interactableTagDefined.Value;
        }

        // Player membership is resolved from the PlayerInteractor component and cached,
        // not via CompareTag. CompareTag against an undefined tag throws, and this
        // handler runs on every trigger contact, so the lookup also has to be free.
        private static Transform cachedPlayerRoot;

        // Collider entity ids currently counted as "player in field".
        private static readonly HashSet<EntityId> countedPlayerColliders = new HashSet<EntityId>();

        [Header("Identity")]
        [SerializeField] private string zoneId = "zone_default";

        [Header("Field")]
        [SerializeField] private float upwardAcceleration = 9.81f;
        [SerializeField] private float fieldDrag = 2.0f;
        [SerializeField] private float fieldAngularDrag = 2.0f;

        [Header("Damping response")]
        [Tooltip("Higher converges to the field damping faster. Applied per FixedUpdate.")]
        [SerializeField] private float dampingResponse = 6f;

        [Header("Capacity overrides (0 = derive from quality tier)")]
        [SerializeField] private int maxActiveBodiesOverride = 0;

        [Header("Collision inspection")]
        [Tooltip("Entry-time contact inspection only runs at High and Ultra. Never per frame.")]
        [SerializeField] private bool inspectContactsOnEntry = true;

        // Pre-sized to the largest tier cap so admission never grows the array.
        private const int MaxTierCapacity = 100;

        private readonly List<Rigidbody> activeBodies = new List<Rigidbody>(MaxTierCapacity);
        private readonly List<AntigravityBodyState> activeStates = new List<AntigravityBodyState>(MaxTierCapacity);

        private int maxActiveBodies = 40;
        private int qualityTierCache = -1;

        /// <summary>Raised when the player enters/leaves any inverted-gravity field.</summary>
        public static event Action<bool> PlayerFieldStateChanged;

        private static readonly List<AntigravityZoneManager> zones = new List<AntigravityZoneManager>(8);

        private static int playerFieldPresenceCount;

        /// <summary>All live zones, for save capture and QA reporting.</summary>
        public static IReadOnlyList<AntigravityZoneManager> ActiveZones => zones;

        public string ZoneId => zoneId;

        public int ActiveBodyCount => activeBodies.Count;

        public int MaxActiveBodies => maxActiveBodies;

        /// <summary>Read-only view of the bodies currently floated by this zone.</summary>
        public IReadOnlyList<Rigidbody> ActiveBodies => activeBodies;

        /// <summary>Marker state matching <see cref="ActiveBodies"/> by index.</summary>
        public IReadOnlyList<AntigravityBodyState> ActiveStates => activeStates;

        /// <summary>True while the player is inside any inverted-gravity field.</summary>
        public static bool IsPlayerInField => playerFieldPresenceCount > 0;

        /// <summary>True when the collider belongs to the player's own hierarchy.</summary>
        private static bool IsPlayerCollider(Collider other)
        {
            if (other == null) return false;

            if (cachedPlayerRoot == null)
            {
                var interactor = FindFirstObjectByType<PlayerInteractor>();
                if (interactor != null) cachedPlayerRoot = interactor.transform.root;
            }

            if (cachedPlayerRoot == null) return false;

            // The collider may sit on the root or on any child (capsule, camera rig).
            for (Transform t = other.transform; t != null; t = t.parent)
            {
                if (t == cachedPlayerRoot) return true;
            }

            return false;
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        private static void ResetStatics()
        {
            // EnterPlayModeOptions domain reload can be disabled, so statics must be
            // cleared explicitly or the player would appear stuck inside a field.
            playerFieldPresenceCount = 0;
            countedPlayerColliders.Clear();
            cachedPlayerRoot = null;
            zones.Clear();
        }

        private void OnEnable()
        {
            if (!zones.Contains(this)) zones.Add(this);
        }

        private void Awake()
        {
            RefreshCapacity(force: true);
        }

        private void OnDisable()
        {
            zones.Remove(this);

            // Never leave bodies floating with a dead zone driving them.
            ReleaseAll();
        }

        // ------------------------------------------------------------------
        // Trigger membership
        // ------------------------------------------------------------------

        private void OnTriggerEnter(Collider other)
        {
            if (other == null) return;

            // Player presence is independent of Rigidbody: the player controller may
            // not own a Rigidbody at all, but must still light the HUD.
            if (IsPlayerCollider(other))
            {
                // Counted per collider, not per enter-event, so a player with several
                // colliders inside the trigger cannot inflate the counter and strand
                // the HUD in the "in field" state.
                if (countedPlayerColliders.Add(other.GetEntityId()))
                {
                    playerFieldPresenceCount = countedPlayerColliders.Count;
                    if (playerFieldPresenceCount == 1) PlayerFieldStateChanged?.Invoke(true);
                }
            }

            if (!InteractableTagUsable) return;
            if (!other.CompareTag(InteractableTag)) return;

            Rigidbody rb = other.attachedRigidbody;
            if (rb == null) return;

            TryAdmit(rb);
        }

        private void OnTriggerExit(Collider other)
        {
            if (other == null) return;

            if (countedPlayerColliders.Remove(other.GetEntityId()))
            {
                playerFieldPresenceCount = countedPlayerColliders.Count;
                if (playerFieldPresenceCount == 0) PlayerFieldStateChanged?.Invoke(false);
            }

            if (!InteractableTagUsable) return;
            if (!other.CompareTag(InteractableTag)) return;

            Rigidbody rb = other.attachedRigidbody;
            if (rb == null) return;

            Release(rb);
        }

        private void TryAdmit(Rigidbody rb)
        {
            // Duplicate registration is impossible: the marker component is the record.
            AntigravityBodyState state = rb.GetComponent<AntigravityBodyState>();
            if (state != null && state.IsFloating) return;

            RefreshCapacity(force: false);

            // Over cap: leave the body completely untouched. It must not later have its
            // damping reset on exit, because it was never floated by this zone.
            if (activeBodies.Count >= maxActiveBodies) return;

            if (state == null)
            {
                state = rb.gameObject.AddComponent<AntigravityBodyState>();
            }

            state.ZoneId = zoneId;
            state.ZoneDrag = fieldDrag;
            state.ZoneAngularDrag = fieldAngularDrag;
            state.OriginalUseGravity = rb.useGravity;
            state.OriginalLinearDamping = rb.linearDamping;
            state.OriginalAngularDamping = rb.angularDamping;
            state.EntryContactCount = 0;

            rb.useGravity = false;

            // Entry-time collision inspection, High/Ultra only. This is the single
            // place a penetration test runs; FixedUpdate never does this.
            if (inspectContactsOnEntry && CurrentQualityTier() >= QualityTier.High)
            {
                state.EntryContactCount = CountEntryContacts(rb);
            }

            activeBodies.Add(rb);
            activeStates.Add(state);
        }

        /// <summary>
        /// Removes a body from the field and restores its authored rigidbody state.
        /// Public so save restore can drop a body the save recorded as resting, before
        /// the trigger has had a chance to hand it back.
        /// </summary>
        public void Release(Rigidbody rb)
        {
            int index = activeBodies.IndexOf(rb);
            if (index < 0) return;

            AntigravityBodyState state = index < activeStates.Count ? activeStates[index] : null;
            if (state != null) state.Restore(rb);

            int last = activeBodies.Count - 1;
            activeBodies[index] = activeBodies[last];
            activeBodies.RemoveAt(last);

            if (index < activeStates.Count)
            {
                activeStates[index] = activeStates[last];
                activeStates.RemoveAt(last);
            }

            // Clear the marker so the body can be admitted by another zone later.
            if (state != null) state.ZoneId = null;
        }

        private void ReleaseAll()
        {
            for (int i = activeBodies.Count - 1; i >= 0; i--)
            {
                Rigidbody rb = activeBodies[i];
                if (rb != null && i < activeStates.Count && activeStates[i] != null)
                {
                    activeStates[i].Restore(rb);
                    activeStates[i].ZoneId = null;
                }
            }
            activeBodies.Clear();
            activeStates.Clear();
        }

        // ------------------------------------------------------------------
        // Simulation
        // ------------------------------------------------------------------

        private void FixedUpdate()
        {
            float dt = Time.fixedDeltaTime;

            // Iterate backwards and compact in place: destroyed bodies are pruned and
            // no allocation occurs.
            for (int i = activeBodies.Count - 1; i >= 0; i--)
            {
                Rigidbody rb = activeBodies[i];
                if (rb == null)
                {
                    RemoveAtSwapBack(i);
                    continue;
                }

                rb.AddForce(Vector3.up * upwardAcceleration, ForceMode.Acceleration);

                // Exponential approach, frame-rate independent, applied every step.
                // A single Mathf.Lerp at trigger time moved damping ~10% and was not a
                // transition at all.
                float t = 1f - Mathf.Exp(-dampingResponse * dt);

                if (i < activeStates.Count)
                {
                    AntigravityBodyState state = activeStates[i];
                    if (state == null)
                    {
                        RemoveAtSwapBack(i);
                        continue;
                    }

                    rb.linearDamping = Mathf.Lerp(rb.linearDamping, state.ZoneDrag, t);
                    rb.angularDamping = Mathf.Lerp(rb.angularDamping, state.ZoneAngularDrag, t);
                }
            }
        }

        private void RemoveAtSwapBack(int index)
        {
            int last = activeBodies.Count - 1;
            activeBodies[index] = activeBodies[last];
            activeBodies.RemoveAt(last);

            if (index < activeStates.Count)
            {
                activeStates[index] = activeStates[last];
                activeStates.RemoveAt(last);
            }
        }

        // ------------------------------------------------------------------
        // Quality-driven capacity
        // ------------------------------------------------------------------

        private void RefreshCapacity(bool force)
        {
            QualityTier tier = CurrentQualityTier();
            int tierIndex = (int)tier;

            if (!force && tierIndex == qualityTierCache) return;
            qualityTierCache = tierIndex;

            if (maxActiveBodiesOverride > 0)
            {
                maxActiveBodies = Mathf.Clamp(maxActiveBodiesOverride, 1, MaxTierCapacity);
                return;
            }

            switch (tier)
            {
                case QualityTier.VeryLow:
                case QualityTier.Low:
                    maxActiveBodies = 15;
                    break;
                case QualityTier.High:
                case QualityTier.Ultra:
                    maxActiveBodies = 100;
                    break;
                case QualityTier.Medium:
                case QualityTier.Custom:
                default:
                    maxActiveBodies = 40;
                    break;
            }
        }

        private static QualityTier CurrentQualityTier()
        {
            if (QualityPresetManager.Instance != null) return QualityPresetManager.Instance.CurrentTier;
            if (AdaptiveQualityManager.Instance != null && AdaptiveQualityManager.Instance.QualityStepOffset < -3)
            {
                return QualityTier.Low;
            }
            return QualityTier.High;
        }

        /// <summary>
        /// Single-entry contact count between the body and this zone's own colliders.
        /// Runs only on admission and only at High/Ultra.
        /// </summary>
        private int CountEntryContacts(Rigidbody rb)
        {
            Collider zoneCollider = GetComponent<Collider>();
            if (zoneCollider == null) return 0;

            Collider[] bodyColliders = rb.GetComponentsInChildren<Collider>();
            int contacts = 0;

            for (int i = 0; i < bodyColliders.Length; i++)
            {
                if (bodyColliders[i] == zoneCollider) continue;

                Vector3 direction;
                float distance;
                if (UnityEngine.Physics.ComputePenetration(
                        zoneCollider, zoneCollider.transform.position, zoneCollider.transform.rotation,
                        bodyColliders[i], bodyColliders[i].transform.position, bodyColliders[i].transform.rotation,
                        out direction, out distance))
                {
                    contacts++;
                }
            }

            return contacts;
        }

#if UNITY_EDITOR
        private void OnDrawGizmosSelected()
        {
            Gizmos.color = new Color(0.4f, 0.8f, 1f, 0.35f);
            Collider c = GetComponent<Collider>();
            if (c != null) Gizmos.DrawWireCube(c.bounds.center, c.bounds.size);
        }
#endif
    }
}