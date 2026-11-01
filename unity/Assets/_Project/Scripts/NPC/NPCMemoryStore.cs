using System;
using System.Collections.Generic;
using WhisperingWilds.Core;

namespace WhisperingWilds.NPC
{
    /// <summary>
    /// Central, durable static store for NPC memories and applied dialogue choices.
    /// 
    /// Scene GameObjects (including <see cref="NPCCharacter"/>) are destroyed on scene unload,
    /// region travel, and game restart. This store ensures that memories formed with residents
    /// (e.g. asking about Murugan's ledger, helping Velu) and applied one-time choices persist
    /// across transitions and are serialized into Schema v5 save payloads.
    /// </summary>
    public static class NPCMemoryStore
    {
        // NPC ID -> Set of memory flag keys
        private static readonly Dictionary<string, HashSet<string>> NpcMemories =
            new Dictionary<string, HashSet<string>>(StringComparer.OrdinalIgnoreCase);

        // Track choice IDs that have already applied one-time consequences
        private static readonly HashSet<string> AppliedChoiceIds =
            new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        public static event Action<string, string> OnMemoryRecorded;
        public static event Action<string> OnChoiceApplied;

        /// <summary>
        /// Records a memory flag for a specific NPC.
        /// Returns true if this is a newly recorded flag, false if already known.
        /// </summary>
        public static bool RecordMemory(string npcId, string flag)
        {
            if (string.IsNullOrEmpty(npcId) || string.IsNullOrEmpty(flag)) return false;

            if (!NpcMemories.TryGetValue(npcId, out var flags))
            {
                flags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                NpcMemories[npcId] = flags;
            }

            if (!flags.Add(flag)) return false;

            try
            {
                OnMemoryRecorded?.Invoke(npcId, flag);
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogWarning($"[NPCMemoryStore] Exception in OnMemoryRecorded: {ex.Message}");
            }

            return true;
        }

        /// <summary>
        /// Checks whether the specified NPC remembers the given memory flag.
        /// </summary>
        public static bool HasMemory(string npcId, string flag)
        {
            if (string.IsNullOrEmpty(npcId) || string.IsNullOrEmpty(flag)) return false;
            if (NpcMemories.TryGetValue(npcId, out var flags))
            {
                return flags.Contains(flag);
            }
            return false;
        }

        /// <summary>
        /// Returns all memory flags recorded for the specified NPC.
        /// </summary>
        public static IReadOnlyCollection<string> GetMemories(string npcId)
        {
            if (!string.IsNullOrEmpty(npcId) && NpcMemories.TryGetValue(npcId, out var flags))
            {
                return flags;
            }
            return Array.Empty<string>();
        }

        /// <summary>
        /// Checks if a choice has already applied its one-time consequences.
        /// </summary>
        public static bool IsChoiceApplied(string choiceId)
        {
            return !string.IsNullOrEmpty(choiceId) && AppliedChoiceIds.Contains(choiceId);
        }

        /// <summary>
        /// Records that a choice's one-time consequences have been applied.
        /// </summary>
        public static bool RecordChoiceApplied(string choiceId)
        {
            if (string.IsNullOrEmpty(choiceId)) return false;
            if (!AppliedChoiceIds.Add(choiceId)) return false;

            try
            {
                OnChoiceApplied?.Invoke(choiceId);
            }
            catch (Exception ex)
            {
                UnityEngine.Debug.LogWarning($"[NPCMemoryStore] Exception in OnChoiceApplied: {ex.Message}");
            }

            return true;
        }

        public static IReadOnlyCollection<string> AllAppliedChoices => AppliedChoiceIds;

        /// <summary>
        /// Captures a serializable snapshot of all NPC memories for Schema v5 persistence.
        /// </summary>
        public static List<SavedNPCMemory> SnapshotMemories()
        {
            var list = new List<SavedNPCMemory>(NpcMemories.Count);
            foreach (var kvp in NpcMemories)
            {
                if (string.IsNullOrEmpty(kvp.Key) || kvp.Value == null || kvp.Value.Count == 0) continue;
                list.Add(new SavedNPCMemory
                {
                    npcId = kvp.Key,
                    flags = new List<string>(kvp.Value)
                });
            }
            return list;
        }

        /// <summary>
        /// Restores NPC memories from a Schema v5 save payload without re-triggering events.
        /// </summary>
        public static void RestoreMemories(IEnumerable<SavedNPCMemory> saved)
        {
            NpcMemories.Clear();
            if (saved == null) return;

            foreach (var entry in saved)
            {
                if (entry == null || string.IsNullOrEmpty(entry.npcId) || entry.flags == null) continue;

                if (!NpcMemories.TryGetValue(entry.npcId, out var flags))
                {
                    flags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    NpcMemories[entry.npcId] = flags;
                }

                foreach (var f in entry.flags)
                {
                    if (!string.IsNullOrEmpty(f)) flags.Add(f);
                }
            }
        }

        /// <summary>
        /// Captures a serializable list of applied choice IDs for Schema v5 persistence.
        /// </summary>
        public static List<string> SnapshotAppliedChoices()
        {
            return new List<string>(AppliedChoiceIds);
        }

        /// <summary>
        /// Restores applied choice IDs from a Schema v5 save payload without re-triggering events.
        /// </summary>
        public static void RestoreAppliedChoices(IEnumerable<string> saved)
        {
            AppliedChoiceIds.Clear();
            if (saved == null) return;

            foreach (var id in saved)
            {
                if (!string.IsNullOrEmpty(id)) AppliedChoiceIds.Add(id);
            }
        }

        /// <summary>
        /// Clears all stored memories and applied choices. Called when starting a fresh campaign.
        /// </summary>
        public static void Clear()
        {
            NpcMemories.Clear();
            AppliedChoiceIds.Clear();
        }
    }
}
