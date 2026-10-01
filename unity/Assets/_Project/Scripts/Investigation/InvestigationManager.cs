using System;
using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Gameplay;

namespace WhisperingWilds.Investigation
{
    /// <summary>
    /// Detective investigation system. Manages clue discovery,
    /// evidence linking on the Investigation Board, and photography records.
    ///
    /// Persistence is by stable clue id only. The manager never stores object references to scene
    /// content, and clues are resolved through <see cref="GameDataCatalog"/> on restore, so a
    /// campaign loaded in a different scene, region, or process reconstructs identically.
    /// </summary>
    public class InvestigationManager : MonoBehaviour
    {
        public static InvestigationManager Instance { get; private set; }

        [Header("Discovered Evidence")]
        [SerializeField] private List<ClueData> discoveredClues = new List<ClueData>();
        [SerializeField] private List<string> linkedDeductions = new List<string>();

        public IReadOnlyList<ClueData> DiscoveredClues => discoveredClues;
        public IReadOnlyList<string> LinkedDeductions => linkedDeductions;

        public event Action<ClueData> OnClueDiscovered;
        public event Action<string> OnDeductionMade;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        /// <summary>
        /// Static form of <see cref="HasClue"/> so quest reconciliation can check clue history
        /// without requiring a live scene instance.
        /// </summary>
        public static bool HasClueStatic(string clueId)
        {
            return !string.IsNullOrEmpty(clueId) && GameDataCatalog.HasClue(clueId)
                && InvestigationRuntimeState.HasDiscovered(clueId);
        }

        /// <summary>
        /// Records a discovered clue. Duplicate discovery is rejected, including when the second
        /// call arrives with a different runtime instance of the same clue id, which is why
        /// identity is checked by id rather than by reference.
        /// </summary>
        public bool DiscoverClue(ClueData clue)
        {
            if (clue == null || string.IsNullOrEmpty(clue.clueId)) return false;
            if (HasClue(clue.clueId)) return false;

            // Resolve through the catalogue so the held instance is the shared one, not whatever
            // transient object a scene builder handed us.
            ClueData canonical = GameDataCatalog.GetClue(clue.clueId) ?? clue;

            discoveredClues.Add(canonical);
            InvestigationRuntimeState.MarkDiscovered(canonical.clueId);

            Debug.Log($"<color=#FFD700><b>[Investigation]</b></color> DISCOVERED CLUE: {canonical.titleEn} ({canonical.type})");
            OnClueDiscovered?.Invoke(canonical);

            // Only a genuinely new discovery is reported, so a re-load or a re-interact cannot
            // satisfy a DiscoverClue objective a second time.
            GameplayEventBus.ReportClueDiscovered(canonical.clueId);

            TryUnlockDeductions(canonical);
            return true;
        }

        /// <summary>Records a clue by id. Used by scripted beats and by tests.</summary>
        public bool DiscoverClueById(string clueId)
        {
            var clue = GameDataCatalog.GetClue(clueId);
            if (clue == null)
            {
                Debug.LogWarning($"[Investigation] Cannot discover unknown clue '{clueId}'.");
                return false;
            }
            return DiscoverClue(clue);
        }

        /// <summary>
        /// Evaluates every deduction whose two clues are both held. Each deduction key fires at
        /// most once for the lifetime of the campaign, so holding both clues for longer does not
        /// repeatedly re-trigger the event.
        /// </summary>
        private void TryUnlockDeductions(ClueData newlyFound)
        {
            // A deduction can be unlocked by either clue's relatedClueId pointing at the other.
            TryUnlockDeductionPair(newlyFound.clueId, newlyFound.relatedClueId);
            TryUnlockDeductionPair(newlyFound.relatedClueId, newlyFound.clueId);

            // Also sweep all held clues, so a save restore that adds clues out of order still
            // resolves every pair.
            for (int i = 0; i < discoveredClues.Count; i++)
            {
                var clue = discoveredClues[i];
                if (clue == null) continue;
                TryUnlockDeductionPair(clue.clueId, clue.relatedClueId);
            }
        }

        private void TryUnlockDeductionPair(string clueId, string relatedClueId)
        {
            if (string.IsNullOrEmpty(clueId) || string.IsNullOrEmpty(relatedClueId)) return;
            if (!HasClue(clueId) || !HasClue(relatedClueId)) return;

            // Canonical key so A->B and B->A resolve to the same single deduction.
            string deductionKey = BuildDeductionKey(clueId, relatedClueId);
            if (linkedDeductions.Contains(deductionKey)) return;
            if (InvestigationRuntimeState.HasDeduction(deductionKey)) return;

            linkedDeductions.Add(deductionKey);
            InvestigationRuntimeState.MarkDeduction(deductionKey);

            var clue = GameDataCatalog.GetClue(clueId);
            var related = GameDataCatalog.GetClue(relatedClueId);
            string note = ResolveDeductionNote(clue) ?? ResolveDeductionNote(related);

            Debug.Log($"<color=#00FF88><b>[Investigation]</b></color> DEDUCTION UNLOCKED between '{clue?.titleEn}' and '{related?.titleEn}'!");
            OnDeductionMade?.Invoke(note ?? deductionKey);
        }

        /// <summary>
        /// Picks the deduction text for the active interface language, falling back to English so a
        /// deduction never displays an empty label in Tamil.
        /// </summary>
        private static string ResolveDeductionNote(ClueData clue)
        {
            if (clue == null) return null;
            if (Localization.LocalizationManager.Instance != null &&
                Localization.LocalizationManager.Instance.CurrentLanguage == Localization.Language.Tamil &&
                !string.IsNullOrEmpty(clue.deductionNoteTa))
            {
                return clue.deductionNoteTa;
            }
            return clue.deductionNote;
        }

        /// <summary>Order-independent key so a bidirectional link cannot unlock twice.</summary>
        public static string BuildDeductionKey(string clueA, string clueB)
        {
            if (string.IsNullOrEmpty(clueA) || string.IsNullOrEmpty(clueB)) return null;
            return string.CompareOrdinal(clueA, clueB) <= 0 ? $"{clueA}__{clueB}" : $"{clueB}__{clueA}";
        }

        public bool HasClue(string clueId)
        {
            if (string.IsNullOrEmpty(clueId)) return false;
            return discoveredClues.Exists(c => c != null && c.clueId == clueId);
        }

        public bool HasDeduction(string deductionKey)
        {
            return !string.IsNullOrEmpty(deductionKey) && linkedDeductions.Contains(deductionKey);
        }

        // ---- Persistence ----------------------------------------------------

        /// <summary>Stable clue identifiers only. No content is written into the save.</summary>
        public List<string> CaptureDiscoveredClueIds()
        {
            var ids = new List<string>();
            for (int i = 0; i < discoveredClues.Count; i++)
            {
                var clue = discoveredClues[i];
                if (clue == null || string.IsNullOrEmpty(clue.clueId)) continue;
                if (!ids.Contains(clue.clueId)) ids.Add(clue.clueId);
            }
            return ids;
        }

        public List<string> CaptureDeductionKeys() => new List<string>(linkedDeductions);

        /// <summary>
        /// Rebuilds investigation state from stable identifiers. Unknown ids are skipped with a
        /// warning instead of throwing, so an older or newer save still loads the playable portion
        /// of the campaign. Deductions already recorded are preserved and never re-fired.
        /// </summary>
        public void RestoreState(List<string> clueIds, List<string> deductionKeys)
        {
            discoveredClues.Clear();
            linkedDeductions.Clear();
            InvestigationRuntimeState.Clear();

            if (clueIds != null)
            {
                for (int i = 0; i < clueIds.Count; i++)
                {
                    var id = clueIds[i];
                    if (string.IsNullOrEmpty(id)) continue;
                    if (HasClue(id)) continue;

                    var clue = GameDataCatalog.GetClue(id);
                    if (clue == null)
                    {
                        Debug.LogWarning($"[Investigation] Save references unknown clue '{id}'; skipping it.");
                        continue;
                    }

                    discoveredClues.Add(clue);
                    InvestigationRuntimeState.MarkDiscovered(id);
                }
            }

            if (deductionKeys != null)
            {
                for (int i = 0; i < deductionKeys.Count; i++)
                {
                    var key = deductionKeys[i];
                    if (string.IsNullOrEmpty(key)) continue;
                    if (linkedDeductions.Contains(key)) continue;
                    linkedDeductions.Add(key);
                    InvestigationRuntimeState.MarkDeduction(key);
                }
            }
        }

        /// <summary>Clears all investigation state. Used by New Game.</summary>
        public void ResetState()
        {
            discoveredClues.Clear();
            linkedDeductions.Clear();
            InvestigationRuntimeState.Clear();
        }
    }

    /// <summary>
    /// Static mirror of discovered clue ids and unlocked deduction keys.
    ///
    /// Investigation state lives on a scene object that is recreated on every region load, but
    /// quest reconciliation and save capture both need to answer "was this already discovered?"
    /// without a scene reference. This mirrors the ids so those checks survive scene changes.
    /// The scene manager remains the authority for the clue objects themselves.
    /// </summary>
    public static class InvestigationRuntimeState
    {
        private static readonly HashSet<string> DiscoveredIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        private static readonly HashSet<string> DeductionKeys = new HashSet<string>(StringComparer.Ordinal);

        public static bool HasDiscovered(string clueId) => !string.IsNullOrEmpty(clueId) && DiscoveredIds.Contains(clueId);

        public static bool HasDeduction(string key) => !string.IsNullOrEmpty(key) && DeductionKeys.Contains(key);

        public static void MarkDiscovered(string clueId)
        {
            if (!string.IsNullOrEmpty(clueId)) DiscoveredIds.Add(clueId);
        }

        public static void MarkDeduction(string key)
        {
            if (!string.IsNullOrEmpty(key)) DeductionKeys.Add(key);
        }

        /// <summary>Snapshot of discovered ids for save capture when no scene manager exists.</summary>
        public static IReadOnlyCollection<string> SnapshotDiscovered() => DiscoveredIds;

        /// <summary>Snapshot of unlocked deduction keys for save capture.</summary>
        public static IReadOnlyCollection<string> SnapshotDeductions() => DeductionKeys;

        public static void Clear()
        {
            DiscoveredIds.Clear();
            DeductionKeys.Clear();
        }
    }
}