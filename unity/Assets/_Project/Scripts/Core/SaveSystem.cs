using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.Inventory;
using WhisperingWilds.Quests;
using WhisperingWilds.Investigation;
using WhisperingWilds.Localization;
using WhisperingWilds.NPC;
using WhisperingWilds.Photography;
using WhisperingWilds.Data;

namespace WhisperingWilds.Core
{
    /// <summary>One persisted inventory entry. Identifiers only, never object references.</summary>
    [Serializable]
    public class SavedInventoryItem
    {
        public string itemId;
        public int count;
    }

    /// <summary>
    /// Versioned local save payload.
    ///
    /// Schema v2 adds quest progress (stage index and objective counters), deduction keys,
    /// photographed targets, crafted recipes, NPC interaction history, and the language
    /// preference. Everything is stored as stable identifiers so the file stays small and stays
    /// valid across scene changes and content edits.
    /// </summary>
    [Serializable]
    public class GameSaveData
    {
        /// <summary>Current write version. Bump only with a migration in <see cref="SaveMigrator"/>.</summary>
        public const int CurrentSchemaVersion = 2;

        public int schemaVersion = CurrentSchemaVersion;
        public string saveTimestamp;

        // Player Position
        public float posX, posY, posZ;
        public float rotY;

        // Strict 5-Permanent Appearance Changes Constraint
        public int remainingPermanentAppearanceChanges = 5;
        public AppearanceProfile appearanceProfile;
        public RegionalOutfitType equippedOutfit;

        // Inventory & Economics
        public int currency = 100;
        public List<SavedInventoryItem> inventoryItems = new List<SavedInventoryItem>();

        // Quests (v1 stored ids only; v2 stores full progress)
        public List<string> activeQuestIds = new List<string>();
        public List<string> completedQuestIds = new List<string>();
        public List<SavedQuestProgress> questProgress = new List<SavedQuestProgress>();

        // Investigation & Codex
        public List<string> discoveredClueIds = new List<string>();
        public List<string> unlockedDeductions = new List<string>();

        // ---- Added in schema v2 ----

        /// <summary>Photo targets captured this campaign, for PhotographTarget objectives.</summary>
        public List<string> photographedTargets = new List<string>();

        /// <summary>Recipes crafted this campaign, with their total craft counts.</summary>
        public List<string> craftedRecipeIds = new List<string>();
        public List<int> craftedRecipeCounts = new List<int>();

        /// <summary>NPC ids the player has spoken to, so TalkToNPC objectives survive reload.</summary>
        public List<string> interactedNpcIds = new List<string>();

        /// <summary>Interface language at save time.</summary>
        public int languagePreference;

        // World State
        public string currentRegionId = "chennai";
        public float timeOfDayHours = 9.0f; // 09:00 AM
    }

    /// <summary>
    /// Outcome of a save or load attempt, so UI can report the truth instead of assuming success.
    /// </summary>
    public enum SaveOperationStatus
    {
        Success,
        NoSaveFound,
        SaveFailed,
        LoadFailed,
        CorruptPrimaryRecoveredFromBackup,
        CorruptSave
    }

    /// <summary>
    /// Versioned local save system storing JSON save files in Application.persistentDataPath.
    /// Strictly guarantees the 5-permanent appearance change constraint is preserved across saves.
    ///
    /// Writes are atomic: the payload is written to a temp file and only then swapped over the
    /// primary, with the previous primary retained as a backup. A corrupt or truncated primary is
    /// reported explicitly and the backup is tried, so the player never silently starts a blank
    /// campaign in place of a real one.
    /// </summary>
    public static class SaveSystem
    {
        private const string SaveFileName = "whispering_wilds_save.json";
        private const string BackupFileName = "whispering_wilds_save.backup.json";
        private const string TempFileName = "whispering_wilds_save.tmp.json";

        public static string SaveFilePath => Path.Combine(Application.persistentDataPath, SaveFileName);
        public static string BackupFilePath => Path.Combine(Application.persistentDataPath, BackupFileName);
        public static string TempFilePath => Path.Combine(Application.persistentDataPath, TempFileName);

        /// <summary>Result of the most recent load, including any recovery action taken.</summary>
        public static SaveOperationStatus LastLoadStatus { get; private set; } = SaveOperationStatus.NoSaveFound;

        /// <summary>Human-readable detail about the most recent load, for UI and logging.</summary>
        public static string LastLoadDetail { get; private set; } = string.Empty;

        public static bool SaveExists() => File.Exists(SaveFilePath);

        public static bool BackupExists() => File.Exists(BackupFilePath);

        /// <summary>True when a save exists and parses into a valid payload with a known schema.</summary>
        public static bool HasValidSave()
        {
            if (!SaveExists()) return false;
            return TryReadValid(SaveFilePath, out _, out _);
        }

        public static void DeleteSave()
        {
            try
            {
                if (File.Exists(SaveFilePath)) File.Delete(SaveFilePath);
                if (File.Exists(BackupFilePath)) File.Delete(BackupFilePath);
                if (File.Exists(TempFilePath)) File.Delete(TempFilePath);
                Debug.Log("<color=#FFAA00><b>[SaveSystem]</b></color> Save and backup files deleted.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to delete save: {ex.Message}");
            }
        }

        /// <summary>
        /// Captures a save payload from live game state without touching the filesystem.
        /// Separated from writing so autosave checks can inspect the snapshot cheaply.
        /// </summary>
        public static GameSaveData CaptureSnapshot(GameObject playerObject = null)
        {
            if (playerObject == null)
            {
                playerObject = GameObject.FindWithTag("Player");
            }

            var data = new GameSaveData
            {
                schemaVersion = GameSaveData.CurrentSchemaVersion,
                saveTimestamp = DateTime.UtcNow.ToString("o"),
                languagePreference = LocalizationManager.Instance != null
                    ? (int)LocalizationManager.Instance.CurrentLanguage
                    : (int)Language.English
            };

            if (playerObject != null)
            {
                var t = playerObject.transform;
                data.posX = t.position.x;
                data.posY = t.position.y;
                data.posZ = t.position.z;
                data.rotY = t.eulerAngles.y;

                var appearance = playerObject.GetComponent<PlayerAppearanceManager>();
                if (appearance != null)
                {
                    data.remainingPermanentAppearanceChanges = Mathf.Clamp(appearance.RemainingPermanentChanges, 0, PlayerAppearanceManager.MaxPermanentAppearanceChanges);
                    data.appearanceProfile = appearance.CurrentProfile;
                    data.equippedOutfit = appearance.CurrentOutfit;
                }
                else
                {
                    // No appearance component: fall back to the player governor's counter so the
                    // strict 5-change ceiling is still persisted rather than reset to the default.
                    var playerMgr = playerObject.GetComponent<PlayerManager>();
                    if (playerMgr != null)
                    {
                        data.remainingPermanentAppearanceChanges = Mathf.Clamp(playerMgr.RemainingPermanentChanges, 0, PlayerManager.MaxPermanentAppearanceChanges);
                        data.equippedOutfit = playerMgr.CurrentRegionalOutfit;
                    }
                }
            }

            if (InventoryManager.Instance != null)
            {
                data.currency = InventoryManager.Instance.Currency;
                data.inventoryItems = new List<SavedInventoryItem>();
                foreach (var slot in InventoryManager.Instance.Slots)
                {
                    if (slot == null || slot.item == null || slot.count <= 0) continue;
                    data.inventoryItems.Add(new SavedInventoryItem { itemId = slot.item.itemId, count = slot.count });
                }
            }

            if (QuestManager.Instance != null)
            {
                data.completedQuestIds = new List<string>(QuestManager.Instance.CompletedQuestIds);
                data.activeQuestIds = new List<string>();
                foreach (var q in QuestManager.Instance.ActiveQuests)
                {
                    if (q != null && q.quest != null) data.activeQuestIds.Add(q.quest.questId);
                }
                data.questProgress = QuestManager.Instance.CaptureProgress();
            }

            if (InvestigationManager.Instance != null)
            {
                data.discoveredClueIds = InvestigationManager.Instance.CaptureDiscoveredClueIds();
                data.unlockedDeductions = InvestigationManager.Instance.CaptureDeductionKeys();
            }
            else
            {
                data.discoveredClueIds = new List<string>(InvestigationRuntimeState.SnapshotDiscovered());
                data.unlockedDeductions = new List<string>(InvestigationRuntimeState.SnapshotDeductions());
            }

            data.photographedTargets = PhotoJournal.AllTargetIds();

            data.craftedRecipeIds = new List<string>();
            data.craftedRecipeCounts = new List<int>();
            foreach (var pair in CraftingHistory.All)
            {
                if (pair.Value <= 0) continue;
                data.craftedRecipeIds.Add(pair.Key);
                data.craftedRecipeCounts.Add(pair.Value);
            }

            data.interactedNpcIds = new List<string>(NPCInteractionLog.All);

            if (World.RegionalSceneManager.Instance != null)
            {
                data.currentRegionId = World.RegionalSceneManager.Instance.ActiveRegionId;
            }

            if (World.WorldTimeSystem.Instance != null)
            {
                data.timeOfDayHours = World.WorldTimeSystem.Instance.HourOfDay;
            }

            return data;
        }

        

        /// <summary>
        /// Captures and writes a save. Returns null when the write failed, so callers never report
        /// success for a save that did not reach disk.
        /// </summary>
        public static GameSaveData SaveGame(GameObject playerObject = null)
        {
            GameSaveData data;
            try
            {
                data = CaptureSnapshot(playerObject);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to capture game state: {ex.Message}");
                return null;
            }

            return WriteAtomically(data) ? data : null;
        }

        /// <summary>
        /// Writes the payload via a temp file and an atomic swap, keeping the previous primary as a
        /// backup. A crash mid-write can therefore lose the new save but never the old one.
        /// </summary>
        private static bool WriteAtomically(GameSaveData data)
        {
            try
            {
                string json = JsonUtility.ToJson(data, true);

                // Serialize first so an encoding failure cannot truncate the primary.
                File.WriteAllText(TempFilePath, json);

                // Keep the previous good save as a backup before replacing it.
                if (File.Exists(SaveFilePath))
                {
                    TryDelete(BackupFilePath);
                    File.Copy(SaveFilePath, BackupFilePath, overwrite: true);
                }

                // File.Replace is atomic where the filesystem supports it; otherwise delete+move.
                if (File.Exists(SaveFilePath))
                {
                    try
                    {
                        File.Replace(TempFilePath, SaveFilePath, null);
                    }
                    catch (PlatformNotSupportedException)
                    {
                        File.Delete(SaveFilePath);
                        File.Move(TempFilePath, SaveFilePath);
                    }
                    catch (IOException)
                    {
                        File.Delete(SaveFilePath);
                        File.Move(TempFilePath, SaveFilePath);
                    }
                }
                else
                {
                    File.Move(TempFilePath, SaveFilePath);
                }

                Debug.Log($"<color=#00FF88><b>[SaveSystem]</b></color> Game saved successfully to: {SaveFilePath} (schema v{data.schemaVersion})");
                return true;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to write save file: {ex.Message}");
                TryDelete(TempFilePath);
                return false;
            }
        }

        private static void TryDelete(string path)
        {
            try
            {
                if (File.Exists(path)) File.Delete(path);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[SaveSystem] Could not delete '{path}': {ex.Message}");
            }
        }

        /// <summary>
        /// Reads and validates a save file. Never throws: a malformed file is reported as invalid
        /// so the caller can fall back to the backup.
        /// </summary>
        private static bool TryReadValid(string path, out GameSaveData data, out string error)
        {
            data = null;
            error = null;

            if (!File.Exists(path))
            {
                error = "File not found.";
                return false;
            }

            string json;
            try
            {
                json = File.ReadAllText(path);
            }
            catch (Exception ex)
            {
                error = $"Read failed: {ex.Message}";
                return false;
            }

            if (string.IsNullOrWhiteSpace(json))
            {
                error = "File is empty.";
                return false;
            }

            try
            {
                data = JsonUtility.FromJson<GameSaveData>(json);
            }
            catch (Exception ex)
            {
                error = $"Malformed JSON: {ex.Message}";
                data = null;
                return false;
            }

            if (data == null)
            {
                error = "Deserialization produced no data.";
                return false;
            }

            if (data.schemaVersion <= 0)
            {
                error = "Missing or invalid schemaVersion.";
                data = null;
                return false;
            }

            if (data.schemaVersion > GameSaveData.CurrentSchemaVersion)
            {
                error = $"Save schema v{data.schemaVersion} is newer than supported v{GameSaveData.CurrentSchemaVersion}.";
                data = null;
                return false;
            }

            if (!SaveMigrator.TryMigrate(data, out var migrationError))
            {
                error = migrationError;
                data = null;
                return false;
            }

            Sanitize(data);
            return true;
        }

        /// <summary>
        /// Repairs a payload that parsed but carries impossible values. Runs after migration so
        /// migrated data is sanitized too.
        /// </summary>
        private static void Sanitize(GameSaveData data)
        {
            data.remainingPermanentAppearanceChanges = Mathf.Clamp(
                data.remainingPermanentAppearanceChanges, 0, PlayerAppearanceManager.MaxPermanentAppearanceChanges);

            data.currency = Mathf.Max(0, data.currency);
            data.activeQuestIds ??= new List<string>();
            data.completedQuestIds ??= new List<string>();
            data.questProgress ??= new List<SavedQuestProgress>();
            data.discoveredClueIds ??= new List<string>();
            data.unlockedDeductions ??= new List<string>();
            data.photographedTargets ??= new List<string>();
            data.craftedRecipeIds ??= new List<string>();
            data.craftedRecipeCounts ??= new List<int>();
            data.interactedNpcIds ??= new List<string>();
            data.inventoryItems ??= new List<SavedInventoryItem>();

            if (string.IsNullOrWhiteSpace(data.currentRegionId)) data.currentRegionId = "chennai";

            // timeOfDayHours must stay inside a single day so lighting never lands out of range.
            if (float.IsNaN(data.timeOfDayHours)) data.timeOfDayHours = 9f;
            data.timeOfDayHours = Mathf.Repeat(data.timeOfDayHours, 24f);

            if (float.IsNaN(data.posX)) data.posX = 0f;
            if (float.IsNaN(data.posY)) data.posY = 0f;
            if (float.IsNaN(data.posZ)) data.posZ = 0f;
            if (float.IsNaN(data.rotY)) data.rotY = 0f;
        }

        /// <summary>
        /// Loads the save, migrating older schemas. On a corrupt primary, attempts the backup and
        /// reports which path was used through <see cref="LastLoadStatus"/>.
        /// </summary>
        public static GameSaveData LoadGame()
        {
            if (!SaveExists())
            {
                if (BackupExists())
                {
                    if (TryReadValid(BackupFilePath, out var fromBackup, out var backupReadError))
                    {
                        LastLoadStatus = SaveOperationStatus.CorruptPrimaryRecoveredFromBackup;
                        LastLoadDetail = "Primary save was missing or unreadable; recovered from backup.";
                        Debug.LogWarning($"<color=#FFCC00><b>[SaveSystem]</b></color> {LastLoadDetail}");
                        return fromBackup;
                    }

                    LastLoadStatus = SaveOperationStatus.CorruptSave;
                    LastLoadDetail = $"Backup save is also unreadable: {backupReadError}";
                    Debug.LogError($"<color=#FF4444><b>[SaveSystem]</b></color> {LastLoadDetail}");
                    return null;
                }

                LastLoadStatus = SaveOperationStatus.NoSaveFound;
                LastLoadDetail = "No save file found.";
                Debug.LogWarning("[SaveSystem] No save file found.");
                return null;
            }

            if (TryReadValid(SaveFilePath, out var data, out var primaryError))
            {
                LastLoadStatus = SaveOperationStatus.Success;
                LastLoadDetail = "Save loaded.";
                Debug.Log($"<color=#00FF88><b>[SaveSystem]</b></color> Save data loaded (schema v{data.schemaVersion}). Remaining appearance changes: {data.remainingPermanentAppearanceChanges}");
                return data;
            }

            // Primary is corrupt. Try the backup before giving up.
            Debug.LogWarning($"<color=#FF4444><b>[SaveSystem]</b></color> Primary save is invalid: {primaryError}. Attempting backup...");

            if (TryReadValid(BackupFilePath, out var recovered, out var backupError))
            {
                LastLoadStatus = SaveOperationStatus.CorruptPrimaryRecoveredFromBackup;
                LastLoadDetail = $"Primary save is corrupt ({primaryError}). Recovered campaign from backup.";
                Debug.LogWarning($"<color=#FFCC00><b>[SaveSystem]</b></color> {LastLoadDetail}");
                return recovered;
            }

            LastLoadStatus = SaveOperationStatus.CorruptSave;
            LastLoadDetail = backupError != null
                ? $"Primary save is corrupt ({primaryError}) and backup is unreadable ({backupError})."
                : $"Primary save is corrupt ({primaryError}) and no usable backup exists.";
            Debug.LogError($"<color=#FF4444><b>[SaveSystem]</b></color> {LastLoadDetail}");
            return null;
        }
    }
}