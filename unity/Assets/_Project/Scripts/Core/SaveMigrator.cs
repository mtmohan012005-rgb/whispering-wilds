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

            // v2 -> v3: antigravity zone and floating-body state.
            if (data.schemaVersion < 3)
            {
                // v2 recorded no physics state at all. Empty lists are the honest
                // default: every zone despawns non-inverted and no body is floating.
                // Inventing gravity-inverted zones from a v2 save would put the player
                // somewhere the campaign never put them.
                if (data.gravityZones == null) data.gravityZones = new List<SavedGravityZone>();
                if (data.floatingBodies == null) data.floatingBodies = new List<SavedGravityBody>();

                // Drop any entry that could not have come from a v2 writer but is
                // non-finite, so downstream restore can assume clean input.
                data.floatingBodies.RemoveAll(b => b == null || !IsBodySane(b));

                data.schemaVersion = 3;
            }

            // v3 -> v4: destination unlocks, solved puzzles, and discovery log entries.
            if (data.schemaVersion < 4)
            {
                // A pre-v4 save records no regional progression at all, and gating did not exist yet,
                // so every destination that player could already reach was reachable. Reconstructing
                // the opening destinations instead would lock a destination they had already
                // visited. Deferred destinations stay closed because they were closed before too.
                if (data.unlockedRegionIds == null || data.unlockedRegionIds.Count == 0)
                {
                    data.unlockedRegionIds = World.RegionUnlocks.SeedPreGateCampaign();
                }

                // A puzzle that was solved before v4 cannot be identified, because nothing recorded
                // the outcome. An empty list re-presents the puzzle unsolved rather than silently
                // skipping a gate the player may not have reached at all.
                if (data.solvedPuzzleIds == null) data.solvedPuzzleIds = new List<string>();
                if (data.recordedDiscoveryIds == null) data.recordedDiscoveryIds = new List<string>();

                data.schemaVersion = 4;
            }

            data.schemaVersion = GameSaveData.CurrentSchemaVersion;
            return true;
        }

        /// <summary>
        /// Rejects bodies whose stored transform or velocity is unusable. NaN and
        /// Infinity are checked explicitly because Mathf.Clamp passes them through.
        /// </summary>
        private static bool IsBodySane(SavedGravityBody body)
        {
            return SavedGravityPhysics.IsUsable(body.posX)
                && SavedGravityPhysics.IsUsable(body.posY)
                && SavedGravityPhysics.IsUsable(body.posZ)
                && SavedGravityPhysics.IsUsable(body.rotX)
                && SavedGravityPhysics.IsUsable(body.rotY)
                && SavedGravityPhysics.IsUsable(body.rotZ)
                && SavedGravityPhysics.IsUsable(body.rotW)
                && SavedGravityPhysics.IsUsable(body.linearVelocityX)
                && SavedGravityPhysics.IsUsable(body.linearVelocityY)
                && SavedGravityPhysics.IsUsable(body.linearVelocityZ)
                && SavedGravityPhysics.IsUsable(body.angularVelocityX)
                && SavedGravityPhysics.IsUsable(body.angularVelocityY)
                && SavedGravityPhysics.IsUsable(body.angularVelocityZ);
        }
    }
}