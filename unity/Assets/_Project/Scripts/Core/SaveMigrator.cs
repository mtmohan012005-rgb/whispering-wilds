using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Quests;

namespace WhisperingWilds.Core
{
    /// <summary>
    /// Forward-migrates an older save payload to the current schema.
    ///
    /// Migration is additive and conservative: every field added by a new schema gets a safe
    /// default rather than being left null. Nothing is ever dropped, and a payload already at the
    /// current version passes through untouched so a load/save round trip is stable.
    /// </summary>
    public static class SaveMigrator
    {
        /// <summary>
        /// Brings <paramref name="data"/> up to <see cref="GameSaveData.CurrentSchemaVersion"/>.
        /// Returns false with a message when the payload cannot be migrated safely, which the
        /// caller surfaces as a load failure instead of silently half-loading a campaign.
        /// </summary>
        public static bool TryMigrate(GameSaveData data, out string error)
        {
            error = null;
            if (data == null)
            {
                error = "No save data to migrate.";
                return false;
            }

            if (data.schemaVersion < 1)
            {
                error = "Save schema is older than v1 and cannot be migrated.";
                return false;
            }

            if (data.schemaVersion == GameSaveData.CurrentSchemaVersion)
            {
                return true;
            }

            Debug.Log($"[SaveMigrator] Migrating save from schema v{data.schemaVersion} to v{GameSaveData.CurrentSchemaVersion}.");

            // v1 -> v2: quest progress, deductions, photos, crafts, NPC history, language.
            if (data.schemaVersion < 2)
            {
                // v1 stored only activeQuestIds. questProgress stays empty so RestoreProgress
                // takes its v1 fallback path and rebuilds each quest at stage 0 rather than
                // pretending progress detail exists that was never recorded.
                data.questProgress = new List<SavedQuestProgress>();
                data.photographedTargets = new List<string>();
                data.craftedRecipeIds = new List<string>();
                data.craftedRecipeCounts = new List<int>();
                data.interactedNpcIds = new List<string>();
                data.languagePreference = 0; // English
                data.schemaVersion = 2;
            }

            data.schemaVersion = GameSaveData.CurrentSchemaVersion;
            return true;
        }
    }
}