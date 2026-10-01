using System;
using System.Collections.Generic;

namespace WhisperingWilds.Photography
{
    /// <summary>
    /// Durable record of photographs the player has captured.
    ///
    /// Photography previously had no capture log at all, so a PhotographTarget objective could
    /// not be satisfied or restored. Keyed by a stable photo target id rather than the scene
    /// object, so the record survives region travel and restart.
    /// </summary>
    public static class PhotoJournal
    {
        [Serializable]
        public struct PhotoRecord
        {
            public string targetId;
            public string capturedAtTimestampUtc;
            public string regionId;
        }

        private static readonly List<PhotoRecord> Captures = new List<PhotoRecord>();
        private static readonly HashSet<string> CapturedTargets = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        public static event Action<string> OnPhotoCaptured;

        public static int Count => Captures.Count;

        public static bool HasCaptured(string targetId)
        {
            return !string.IsNullOrEmpty(targetId) && CapturedTargets.Contains(targetId);
        }

        public static IReadOnlyList<PhotoRecord> All => Captures;

        /// <summary>
        /// Captured target ids only, which is what the save payload persists. Timestamps and the
        /// originating region are session metadata and are not part of the save contract.
        /// </summary>
        public static List<string> AllTargetIds()
        {
            var ids = new List<string>(Captures.Count);
            for (int i = 0; i < Captures.Count; i++) ids.Add(Captures[i].targetId);
            return ids;
        }

        /// <summary>
        /// Records a capture. Returns false when the same target was already captured, so repeated
        /// shutter presses on one target do not multiply a quest objective.
        /// </summary>
        public static bool Record(string targetId, string regionId = null)
        {
            if (string.IsNullOrEmpty(targetId)) return false;
            if (!CapturedTargets.Add(targetId)) return false;

            Captures.Add(new PhotoRecord
            {
                targetId = targetId,
                capturedAtTimestampUtc = DateTime.UtcNow.ToString("o"),
                regionId = regionId
            });

            try
            {
                OnPhotoCaptured?.Invoke(targetId);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"[PhotoJournal] Listener threw for '{targetId}': {ex}");
            }

            return true;
        }

        /// <summary>
        /// Replaces the journal from a save without raising <see cref="OnPhotoCaptured"/>. Restoring
        /// by calling <see cref="Record"/> would fire capture events and re-satisfy photo
        /// objectives for shots the player already took.
        /// </summary>
        public static void Restore(IEnumerable<PhotoRecord> records)
        {
            Clear();
            if (records == null) return;

            foreach (var record in records)
            {
                if (string.IsNullOrEmpty(record.targetId)) continue;
                if (!CapturedTargets.Add(record.targetId)) continue;
                Captures.Add(record);
            }
        }

        /// <summary>
        /// Replaces the journal from a saved id list without raising <see cref="OnPhotoCaptured"/>.
        /// Restoring by calling <see cref="Record"/> would fire capture events and re-satisfy photo
        /// objectives for shots the player already took. The save payload stores only target ids,
        /// so the restored records carry a fresh timestamp and the save's region.
        /// </summary>
        public static void Restore(IEnumerable<string> targetIds, string regionId = null)
        {
            Clear();
            if (targetIds == null) return;

            foreach (var targetId in targetIds)
            {
                if (string.IsNullOrEmpty(targetId)) continue;
                if (!CapturedTargets.Add(targetId)) continue;
                Captures.Add(new PhotoRecord
                {
                    targetId = targetId,
                    capturedAtTimestampUtc = DateTime.UtcNow.ToString("o"),
                    regionId = regionId
                });
            }
        }

        public static void Clear()
        {
            Captures.Clear();
            CapturedTargets.Clear();
        }
    }
}