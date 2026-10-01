using System;
using System.Collections.Generic;

namespace WhisperingWilds.NPC
{
    /// <summary>
    /// Durable record of which residents the player has actually spoken to.
    ///
    /// NPC memory inside <see cref="NPCCharacter"/> lives on the scene object and is rebuilt
    /// whenever a scene reloads, so it cannot answer "has the player already met Velu?" after
    /// travel or restart. This log records npc ids instead of object references, which lets a
    /// quest accept after the fact and correctly see progress the player already made.
    /// </summary>
    public static class NPCInteractionLog
    {
        private static readonly HashSet<string> TalkedTo = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        public static event Action<string> OnTalkedTo;

        /// <summary>Number of distinct NPCs recorded. Used by tests and the investigation board.</summary>
        public static int Count => TalkedTo.Count;

        public static bool HasTalkedTo(string npcId)
        {
            return !string.IsNullOrEmpty(npcId) && TalkedTo.Contains(npcId);
        }

        /// <summary>
        /// Records a conversation. Returns false when the NPC was already recorded, so repeated
        /// interaction with the same resident behaves predictably and does not re-fire bonuses.
        /// </summary>
        public static bool Record(string npcId)
        {
            if (string.IsNullOrEmpty(npcId)) return false;
            if (!TalkedTo.Add(npcId)) return false;

            try
            {
                OnTalkedTo?.Invoke(npcId);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[NPCInteractionLog] Listener threw for '{npcId}': {ex}");
            }

            return true;
        }

        public static IReadOnlyCollection<string> All => TalkedTo;

        /// <summary>
        /// Replaces the whole log from a save. This deliberately does not raise
        /// <see cref="OnTalkedTo"/>: restoring history must not re-award talk bonuses or advance
        /// talk objectives again for conversations the player already completed.
        /// </summary>
        public static void Restore(IEnumerable<string> npcIds)
        {
            TalkedTo.Clear();
            if (npcIds == null) return;

            foreach (var id in npcIds)
            {
                if (!string.IsNullOrEmpty(id)) TalkedTo.Add(id);
            }
        }

        public static void Clear() => TalkedTo.Clear();
    }
}