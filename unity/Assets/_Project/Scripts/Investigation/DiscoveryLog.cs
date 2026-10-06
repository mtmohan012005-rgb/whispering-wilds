using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Investigation
{
    /// <summary>
    /// One important discovery as the player records it. Identifiers are stable and bilingual text
    /// is carried in the definition, so the journal can render an entry from an id alone and never
    /// needs a scene reference.
    /// </summary>
    public sealed class DiscoveryDefinition
    {
        public string discoveryId;
        public string regionId;
        public string titleEn;
        public string titleTa;
        public string bodyEn;
        public string bodyTa;
    }

    /// <summary>
    /// Static registry and log of the player's important discoveries.
    ///
    /// This is deliberately separate from <see cref="InvestigationRuntimeState"/>: clues are the
    /// evidence the player collects, whereas a discovery is the beat the player resolves from that
    /// evidence. The journal lists discoveries, the investigation board lists clues, and keeping
    /// them apart means a puzzle that resolves into a discovery does not have to invent a clue.
    ///
    /// Persistence is by stable discovery id only. A recorded id fires its event at most once for
    /// the lifetime of a campaign, so restoring a save cannot replay a discovery notification or
    /// re-trigger a quest objective that the resolve already satisfied.
    /// </summary>
    public static class DiscoveryLog
    {
        private static readonly Dictionary<string, DiscoveryDefinition> Definitions =
            new Dictionary<string, DiscoveryDefinition>(StringComparer.OrdinalIgnoreCase);

        private static readonly HashSet<string> RecordedIds =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>Raised with the definition the first time an id is recorded.</summary>
        public static event Action<DiscoveryDefinition> OnDiscoveryRecorded;

        /// <summary>Registers a discovery's bilingual text. Safe to call repeatedly.</summary>
        public static void Register(DiscoveryDefinition definition)
        {
            if (definition == null || string.IsNullOrEmpty(definition.discoveryId))
            {
                Debug.LogError("[DiscoveryLog] Refusing to register a discovery with an empty id.");
                return;
            }
            Definitions[definition.discoveryId] = definition;
        }

        public static bool TryGet(string discoveryId, out DiscoveryDefinition definition)
        {
            definition = null;
            if (string.IsNullOrEmpty(discoveryId)) return false;
            return Definitions.TryGetValue(discoveryId, out definition);
        }

        public static bool IsRegistered(string discoveryId) => TryGet(discoveryId, out _);

        public static bool Has(string discoveryId) => !string.IsNullOrEmpty(discoveryId) && RecordedIds.Contains(discoveryId);

        /// <summary>
        /// Records a discovery. Returns false when it was already recorded or is unregistered, so
        /// only genuine first-time resolutions fire <see cref="OnDiscoveryRecorded"/>.
        /// </summary>
        public static bool Record(string discoveryId)
        {
            if (!TryGet(discoveryId, out var definition)) return false;
            if (!RecordedIds.Add(discoveryId)) return false;

            Debug.Log($"<color=#00E5FF><b>[DiscoveryLog]</b></color> DISCOVERY RECORDED: {definition.titleEn}");
            OnDiscoveryRecorded?.Invoke(definition);
            return true;
        }

        /// <summary>Recorded ids only. Stable and ordered for deterministic save output.</summary>
        public static List<string> SnapshotRecordedIds()
        {
            var ids = new List<string>(RecordedIds);
            ids.Sort(StringComparer.OrdinalIgnoreCase);
            return ids;
        }

        /// <summary>
        /// Rebuilds the log from a save. Unknown ids are skipped with a warning so an older or
        /// newer save still opens on its recorded, registered portion.
        /// </summary>
        public static void RestoreRecordedIds(List<string> discoveryIds)
        {
            RecordedIds.Clear();

            if (discoveryIds == null) return;

            for (int i = 0; i < discoveryIds.Count; i++)
            {
                string id = discoveryIds[i];
                if (string.IsNullOrEmpty(id)) continue;
                if (Definitions.ContainsKey(id)) RecordedIds.Add(id);
                else Debug.LogWarning($"[DiscoveryLog] Save references unknown discovery '{id}'; skipping it.");
            }
        }

        public static void Clear() => RecordedIds.Clear();

        /// <summary>
        /// Title in the active interface language, falling back to English so an entry never
        /// renders as an empty line in Tamil.
        /// </summary>
        public static string ResolveTitle(DiscoveryDefinition definition)
        {
            if (definition == null) return string.Empty;
            if (Localization.LocalizationManager.Instance != null &&
                Localization.LocalizationManager.Instance.CurrentLanguage == Localization.Language.Tamil &&
                !string.IsNullOrEmpty(definition.titleTa))
            {
                return definition.titleTa;
            }
            return definition.titleEn;
        }

        /// <summary>Body in the active interface language, with the same English fallback.</summary>
        public static string ResolveBody(DiscoveryDefinition definition)
        {
            if (definition == null) return string.Empty;
            if (Localization.LocalizationManager.Instance != null &&
                Localization.LocalizationManager.Instance.CurrentLanguage == Localization.Language.Tamil &&
                !string.IsNullOrEmpty(definition.bodyTa))
            {
                return definition.bodyTa;
            }
            return definition.bodyEn;
        }
    }
}
