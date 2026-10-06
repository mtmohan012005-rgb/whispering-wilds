using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Investigation;
using WhisperingWilds.UI;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Static mirror of which destinations the campaign has made available.
    ///
    /// Unlock state lives here rather than on a scene object because the destination gate is asked
    /// from three places that do not all share a scene: the state map UI, the regional scene
    /// manager, and save capture. The manager component owns the reactions (notifications and the
    /// clue gate); this type owns the truth.
    ///
    /// Persistence is by stable region id only, matching <c>InvestigationRuntimeState</c> and
    /// <c>CraftingHistory</c>. Nothing here is randomised and nothing references scene content, so
    /// a snapshot restores identically in any process.
    /// </summary>
    public static class RegionUnlocks
    {
        // Region ids, taken from the authoritative geography catalogue.
        public const string ChennaiRegionId = "chennai";
        public const string PichavaramRegionId = "pichavaram";
        public const string ThanjavurRegionId = "thanjavur";
        public const string CauveryDeltaRegionId = "delta";
        public const string ChettinadRegionId = "chettinad";
        public const string MamallapuramRegionId = "mamallapuram";
        public const string NilgirisRegionId = "nilgiris";

        /// <summary>
        /// Later regions. Deliberately absent from <see cref="ProgressionOrder"/> so they can never
        /// be unlocked by whatever happens to satisfy a clue gate, and so the state map lists them
        /// as deferred rather than as a failed check.
        ///
        /// Nilgiris stays deferred until its own step builds it. Mamallapuram left this list when
        /// it gained a gate and a built scene: a destination the campaign has a real clue chain and
        /// a playable scene for does not belong in the "not part of this campaign yet" bucket, and
        /// leaving it here meant its gate could never fire.
        /// </summary>
        public static readonly string[] DeferredRegionIds = { NilgirisRegionId };

        /// <summary>
        /// The campaign's destination order, one entry per destination rather than per region id.
        /// Chennai, then Pichavaram, then Thanjavur, then Chettinad, then Mamallapuram.
        ///
        /// The delta plain and the Thanjavur city share one scene, so they are one destination here.
        /// See <see cref="DestinationFor"/> for how a region id resolves to one of these.
        ///
        /// Nilgiris is not in this list yet: its gate exists in the data but the region has no
        /// built scene, so listing it would advertise a destination that cannot be entered.
        /// </summary>
        public static readonly string[] ProgressionOrder =
        {
            ChennaiRegionId,
            PichavaramRegionId,
            ThanjavurRegionId,
            ChettinadRegionId,
            MamallapuramRegionId
        };

        /// <summary>
        /// The destinations that existed when regional gating shipped in save schema v4.
        ///
        /// This list is frozen on purpose. It is the migration source for pre-gate saves, and if it
        /// were derived from <see cref="ProgressionOrder"/> then every destination appended since v4
        /// would silently be handed to old campaigns the moment they were migrated, skipping the
        /// clue chain entirely.
        /// </summary>
        public static readonly string[] PreGateProgressionIds =
        {
            ChennaiRegionId,
            PichavaramRegionId,
            ThanjavurRegionId,
            ChettinadRegionId
        };

        /// <summary>
        /// Destinations a new campaign can travel to immediately. Chettinad is absent because it is
        /// held back for its Thanjavur clue. Making the starting set explicit, rather than seeding
        /// everything and removing the gate, means a future gated destination is added here once
        /// instead of needing an add-then-remove that silently disagrees with <see cref="ProgressionOrder"/>.
        /// </summary>
        public static readonly string[] StartingDestinationIds =
        {
            ChennaiRegionId,
            PichavaramRegionId,
            ThanjavurRegionId
        };

        /// <summary>
        /// Chettinad is the first gated destination: a historical clue recorded in Thanjavur opens
        /// the route. Both ids are listed because the delta plain and the city share one scene and
        /// either one counts as "in Thanjavur".
        /// </summary>
        public static readonly string[] ChettinadGateClueRegionIds =
        {
            ThanjavurRegionId,
            CauveryDeltaRegionId
        };

        /// <summary>
        /// Mamallapuram is the second gated destination: the coastal connection discovered in
        /// Chettinad opens the route. A single region id is enough here because the mansion and the
        /// causeway are one region, with no shared-scene alias to accommodate.
        /// </summary>
        public static readonly string[] MamallapuramGateClueRegionIds =
        {
            ChettinadRegionId
        };

        private static readonly HashSet<string> UnlockedRegionIds =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        private static bool seeded;

        /// <summary>Raised with the newly unlocked destination id whenever a gate opens.</summary>
        public static event Action<string> OnRegionUnlocked;

        /// <summary>
        /// Resolves a region id to the destination that owns it. The delta plain and the Thanjavur
        /// city are one scene and one map marker, so both resolve to the single Thanjavur
        /// destination; every other id is its own destination.
        ///
        /// Unlocking is therefore done per destination, not per region id, so the player can never
        /// end up in the state where one id of a shared scene is open and the other is not.
        /// </summary>
        public static string DestinationFor(string regionId)
        {
            if (string.IsNullOrEmpty(regionId)) return null;
            if (string.Equals(regionId, CauveryDeltaRegionId, StringComparison.OrdinalIgnoreCase))
            {
                return ThanjavurRegionId;
            }
            return regionId;
        }

        /// <summary>
        /// Seeds the opening state exactly once per process: the destinations a new campaign starts
        /// with are available, and Chettinad is held back for its Thanjavur clue. Idempotent, so any
        /// scene, test, or save load can call it without changing an established state.
        /// </summary>
        public static void EnsureSeeded()
        {
            if (seeded) return;
            seeded = true;

            for (int i = 0; i < StartingDestinationIds.Length; i++)
            {
                UnlockedRegionIds.Add(StartingDestinationIds[i]);
            }
        }

        /// <summary>Clears all unlock state and re-seeds the opening destinations. Used by New Game.</summary>
        public static void ResetForNewGame()
        {
            UnlockedRegionIds.Clear();
            seeded = false;
            EnsureSeeded();
        }

        /// <summary>
        /// The unlock set for a campaign created before regional gating existed.
        ///
        /// Regional gating shipped with save schema v4. A v3 save recorded nothing about regional
        /// progression at all, and at the time it was written every destination the player had
        /// reached was simply reachable, Chettinad included. Migrating such a save to the
        /// starting destinations alone would take away a destination that player had already been
        /// able to visit, which is a regression the player would experience as a locked map entry
        /// with no gate of theirs to clear.
        ///
        /// Deferred destinations are deliberately absent: they were never reachable before v4 and
        /// they are not reachable now, so they stay closed in both.
        ///
        /// The source is <see cref="PreGateProgressionIds"/> and not the live
        /// <see cref="ProgressionOrder"/>. That distinction is the whole point of this method:
        /// deriving from the live order would mean that when a later step appended Mamallapuram, it
        /// would also have been handed to every v3 save the next time one was migrated, and the
        /// player would arrive at a gated destination with none of the clue chain that gates it.
        /// </summary>
        public static List<string> SeedPreGateCampaign()
        {
            EnsureSeeded();

            var ids = new List<string>(PreGateProgressionIds.Length + StartingDestinationIds.Length);
            for (int i = 0; i < PreGateProgressionIds.Length; i++)
            {
                if (IsDeferred(PreGateProgressionIds[i])) continue;
                if (!ids.Contains(PreGateProgressionIds[i])) ids.Add(PreGateProgressionIds[i]);
            }

            // The starting set is unioned in so a destination that is starting but not yet in
            // PreGateProgressionIds cannot be dropped by this method alone.
            for (int i = 0; i < StartingDestinationIds.Length; i++)
            {
                if (!ids.Contains(StartingDestinationIds[i])) ids.Add(StartingDestinationIds[i]);
            }

            return ids;
        }

        /// <summary>
        /// True when the destination may be travelled to. Unknown regions are never unlocked, and
        /// deferred regions are never unlocked, so a missing entry cannot expose a later region.
        /// </summary>
        public static bool IsUnlocked(string regionId)
        {
            EnsureSeeded();
            string destination = DestinationFor(regionId);
            if (string.IsNullOrEmpty(destination)) return false;
            if (!TamilNaduGeography.IsValidRegion(destination)) return false;
            return UnlockedRegionIds.Contains(destination);
        }

        /// <summary>
        /// Opens a destination. Returns false when it was already open, unknown, or deferred, so
        /// callers can report only genuine unlocks.
        /// </summary>
        public static bool Unlock(string regionId)
        {
            EnsureSeeded();
            string destination = DestinationFor(regionId);
            if (string.IsNullOrEmpty(destination)) return false;
            if (!TamilNaduGeography.IsValidRegion(destination)) return false;
            if (IsDeferred(destination)) return false;

            if (!UnlockedRegionIds.Add(destination)) return false;

            Debug.Log($"<color=#00FF99><b>[RegionUnlocks]</b></color> Destination opened: {destination}");
            OnRegionUnlocked?.Invoke(destination);
            return true;
        }

        public static bool IsDeferred(string regionId)
        {
            if (string.IsNullOrEmpty(regionId)) return false;
            for (int i = 0; i < DeferredRegionIds.Length; i++)
            {
                if (string.Equals(DeferredRegionIds[i], regionId, StringComparison.OrdinalIgnoreCase)) return true;
            }
            return false;
        }

        /// <summary>
        /// Applies every destination gate to a clue that has just been recorded. Each gate names the
        /// clue regions that open it, so this stays data-driven and works with whatever evidence a
        /// region actually yields instead of needing a content edit here every time that changes.
        ///
        /// A gate that is already open is skipped rather than re-reported, so replaying the whole
        /// discovered-clue list on scene load cannot produce a duplicate unlock.
        /// </summary>
        public static bool EvaluateClueGate(string clueRegionId)
        {
            EnsureSeeded();
            if (string.IsNullOrEmpty(clueRegionId)) return false;

            if (TryOpenGate(ChettinadRegionId, ChettinadGateClueRegionIds, clueRegionId)) return true;
            return TryOpenGate(MamallapuramRegionId, MamallapuramGateClueRegionIds, clueRegionId);
        }

        /// <summary>
        /// Opens one destination if the clue came from a region that gates it. Returns false when
        /// the destination was already open, the clue came from elsewhere, or the destination is
        /// deferred, so callers report only genuine unlocks.
        /// </summary>
        private static bool TryOpenGate(string destinationId, string[] gatingClueRegionIds, string clueRegionId)
        {
            if (UnlockedRegionIds.Contains(destinationId)) return false;

            for (int i = 0; i < gatingClueRegionIds.Length; i++)
            {
                if (!string.Equals(gatingClueRegionIds[i], clueRegionId, StringComparison.OrdinalIgnoreCase)) continue;
                return Unlock(destinationId);
            }

            return false;
        }

        /// <summary>Stable destination ids only, for save capture.</summary>
        public static List<string> Snapshot()
        {
            EnsureSeeded();
            var ids = new List<string>(UnlockedRegionIds.Count);
            foreach (var id in UnlockedRegionIds) ids.Add(id);
            ids.Sort(StringComparer.OrdinalIgnoreCase);
            return ids;
        }

        /// <summary>
        /// Rebuilds unlock state from a save. Unknown ids are dropped, deferred destinations are
        /// refused, and the starting destinations are re-seeded first so a truncated older save still
        /// leaves the campaign playable.
        /// </summary>
        public static void Restore(List<string> destinationIds)
        {
            seeded = false;
            UnlockedRegionIds.Clear();
            EnsureSeeded();

            if (destinationIds == null) return;

            for (int i = 0; i < destinationIds.Count; i++)
            {
                string saved = destinationIds[i];
                string id = DestinationFor(saved);
                if (string.IsNullOrEmpty(id)) continue;
                if (!TamilNaduGeography.IsValidRegion(id))
                {
                    Debug.LogWarning($"[RegionUnlocks] Save references unknown region '{saved}'; skipping it.");
                    continue;
                }
                if (IsDeferred(id)) continue;
                UnlockedRegionIds.Add(id);
            }
        }

        /// <summary>
        /// Progression destinations the player has not reached yet, in travel order. Deferred
        /// regions are excluded, so this is exactly the set of gates still ahead of the player.
        /// </summary>
        public static List<string> LockedProgressionRegions()
        {
            EnsureSeeded();
            var locked = new List<string>();
            for (int i = 0; i < ProgressionOrder.Length; i++)
            {
                if (!UnlockedRegionIds.Contains(ProgressionOrder[i])) locked.Add(ProgressionOrder[i]);
            }
            return locked;
        }
    }

    /// <summary>
    /// Scene-side owner of destination unlock reactions: it opens gated destinations as the
    /// campaign produces the clues that gate them and tells the player when a route opens.
    ///
    /// The gate is data-driven rather than scripted against one clue id, so it works with whatever
    /// historical clue Thanjavur actually yields when that region is built, instead of needing a
    /// content edit here every time Thanjavur's evidence set changes.
    /// </summary>
    [DisallowMultipleComponent]
    public class RegionUnlockManager : MonoBehaviour
    {
        public static RegionUnlockManager Instance { get; private set; }

        /// <summary>Raised after a gate opens, for UI that wants to refresh without polling.</summary>
        public event Action<string> OnDestinationOpened;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;

            RegionUnlocks.EnsureSeeded();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        private void OnEnable()
        {
            RegionUnlocks.OnRegionUnlocked += HandleRegionUnlocked;
        }

        private void OnDisable()
        {
            RegionUnlocks.OnRegionUnlocked -= HandleRegionUnlocked;

            if (InvestigationManager.Instance != null)
            {
                InvestigationManager.Instance.OnClueDiscovered -= HandleClueDiscovered;
            }
        }

        private void Start()
        {
            // Subscribed in Start rather than OnEnable: Unity runs every Awake in the scene before
            // any Start, so InvestigationManager.Instance is guaranteed to exist here even though
            // the two managers are separate components.
            if (InvestigationManager.Instance != null)
            {
                InvestigationManager.Instance.OnClueDiscovered += HandleClueDiscovered;
            }

            // A save can be restored after this scene's Start (Continue loads the scene, then the
            // payload is applied), so the gate is re-evaluated against clues already on record.
            ReevaluateGates();
        }

        private void HandleClueDiscovered(ClueData clue)
        {
            if (clue == null) return;
            RegionUnlocks.EvaluateClueGate(clue.regionId);
        }

        private void HandleRegionUnlocked(string regionId)
        {
            if (string.IsNullOrEmpty(regionId)) return;

            if (!TamilNaduGeography.TryGetRegion(regionId, out var geo)) return;

            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.ShowNotificationKey(
                    "region.unlocked",
                    4.5f,
                    geo.englishName,
                    geo.tamilName);
            }

            Debug.Log($"[RegionUnlockManager] {geo.englishName} ({geo.tamilName}) is now available.");
            OnDestinationOpened?.Invoke(regionId);
        }

        /// <summary>
        /// Applies every gate against the clues already discovered. Used on scene start so a save
        /// restored after the region loaded still reflects the correct route availability.
        /// </summary>
        public void ReevaluateGates()
        {
            if (InvestigationManager.Instance == null) return;

            var discovered = InvestigationManager.Instance.DiscoveredClues;
            for (int i = 0; i < discovered.Count; i++)
            {
                var clue = discovered[i];
                if (clue != null) RegionUnlocks.EvaluateClueGate(clue.regionId);
            }
        }

        /// <summary>
        /// Whether the player may travel to <paramref name="regionId"/>. Every travel entry point
        /// asks this rather than testing region validity, so the gate cannot be bypassed by a
        /// caller that only knows the geography catalogue.
        /// </summary>
        public bool CanTravelTo(string regionId) => RegionUnlocks.IsUnlocked(regionId);
    }
}
