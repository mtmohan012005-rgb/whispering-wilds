using System;
using System.Collections.Generic;

namespace WhisperingWilds.Inventory
{
    /// <summary>
    /// Durable record of which recipes the player has successfully crafted.
    ///
    /// Crafting removed ingredients and granted results but left no trace of what was made, so
    /// a CraftItem objective could not be reconstructed after a restart, and re-crafting the same
    /// recipe could double-count a quest objective. Keyed by stable recipe id.
    /// </summary>
    public static class CraftingHistory
    {
        private static readonly Dictionary<string, int> CraftCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        public static event Action<string, int> OnCrafted;

        /// <summary>Number of times a recipe has been crafted. 0 when never crafted.</summary>
        public static int GetCraftCount(string recipeId)
        {
            if (string.IsNullOrEmpty(recipeId)) return 0;
            return CraftCounts.TryGetValue(recipeId, out var count) ? count : 0;
        }

        public static bool HasCrafted(string recipeId) => GetCraftCount(recipeId) > 0;

        /// <summary>
        /// Records a successful craft and returns the new total. Recorded before the caller
        /// advances any quest objective, so the count is authoritative even if the follow-up
        /// objective update is skipped.
        /// </summary>
        public static int Record(string recipeId)
        {
            if (string.IsNullOrEmpty(recipeId)) return 0;

            int updated = GetCraftCount(recipeId) + 1;
            CraftCounts[recipeId] = updated;

            try
            {
                OnCrafted?.Invoke(recipeId, updated);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[CraftingHistory] Listener threw for '{recipeId}': {ex}");
            }

            return updated;
        }

        public static IReadOnlyDictionary<string, int> All => CraftCounts;

        /// <summary>
        /// Replaces craft counts from a save without raising <see cref="OnCrafted"/>. Replaying
        /// <see cref="Record"/> to restore counts would fire craft events once per craft and could
        /// double-advance craft objectives for work already done.
        /// </summary>
        public static void Restore(IEnumerable<KeyValuePair<string, int>> counts)
        {
            CraftCounts.Clear();
            if (counts == null) return;

            foreach (var pair in counts)
            {
                if (string.IsNullOrEmpty(pair.Key)) continue;
                if (pair.Value <= 0) continue;
                CraftCounts[pair.Key] = pair.Value;
            }
        }

        public static void Clear() => CraftCounts.Clear();
    }
}