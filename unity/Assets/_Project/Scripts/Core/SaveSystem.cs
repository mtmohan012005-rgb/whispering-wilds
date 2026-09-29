using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.Inventory;
using WhisperingWilds.Quests;
using WhisperingWilds.Investigation;

namespace WhisperingWilds.Core
{
    [Serializable]
    public class SavedInventoryItem
    {
        public string itemId;
        public int count;
    }

    [Serializable]
    public class GameSaveData
    {
        public int schemaVersion = 1;
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

        // Quests
        public List<string> activeQuestIds = new List<string>();
        public List<string> completedQuestIds = new List<string>();

        // Investigation & Codex
        public List<string> discoveredClueIds = new List<string>();
        public List<string> unlockedDeductions = new List<string>();

        // World State
        public string currentRegionId = "chennai";
        public float timeOfDayHours = 9.0f; // 09:00 AM
    }

    /// <summary>
    /// Versioned local save system storing JSON save files in Application.persistentDataPath.
    /// Strictly guarantees the 5-permanent appearance change constraint is preserved across saves.
    /// </summary>
    public static class SaveSystem
    {
        private const string SaveFileName = "whispering_wilds_save.json";

        public static string SaveFilePath => Path.Combine(Application.persistentDataPath, SaveFileName);

        public static bool SaveExists() => File.Exists(SaveFilePath);

        public static void DeleteSave()
        {
            if (File.Exists(SaveFilePath))
            {
                File.Delete(SaveFilePath);
                Debug.Log("<color=#FFAA00><b>[SaveSystem]</b></color> Save file deleted.");
            }
        }

        public static GameSaveData SaveGame(GameObject playerObject = null)
        {
            try
            {
                if (playerObject == null)
                {
                    playerObject = GameObject.FindWithTag("Player");
                }

                var data = new GameSaveData
                {
                    schemaVersion = 1,
                    saveTimestamp = DateTime.UtcNow.ToString("o")
                };

                // Player Position
                if (playerObject != null)
                {
                    data.posX = playerObject.transform.position.x;
                    data.posY = playerObject.transform.position.y;
                    data.posZ = playerObject.transform.position.z;
                    data.rotY = playerObject.transform.eulerAngles.y;

                    // Appearance & Constraint
                    var appearance = playerObject.GetComponent<PlayerAppearanceManager>();
                    if (appearance != null)
                    {
                        data.remainingPermanentAppearanceChanges = Mathf.Clamp(appearance.RemainingPermanentChanges, 0, PlayerAppearanceManager.MaxPermanentAppearanceChanges);
                        data.appearanceProfile = appearance.CurrentProfile;
                        data.equippedOutfit = appearance.CurrentOutfit;
                    }
                }

                // Inventory & Currency
                if (InventoryManager.Instance != null)
                {
                    data.currency = InventoryManager.Instance.Currency;
                    data.inventoryItems = new List<SavedInventoryItem>();
                    foreach (var slot in InventoryManager.Instance.Slots)
                    {
                        if (slot.item != null)
                        {
                            data.inventoryItems.Add(new SavedInventoryItem { itemId = slot.item.itemId, count = slot.count });
                        }
                    }
                }

                // Quests
                if (QuestManager.Instance != null)
                {
                    data.completedQuestIds = new List<string>(QuestManager.Instance.CompletedQuestIds);
                    data.activeQuestIds = new List<string>();
                    foreach (var q in QuestManager.Instance.ActiveQuests)
                    {
                        data.activeQuestIds.Add(q.quest.questId);
                    }
                }

                // Investigation
                if (InvestigationManager.Instance != null)
                {
                    data.discoveredClueIds = new List<string>();
                    foreach (var clue in InvestigationManager.Instance.DiscoveredClues)
                    {
                        data.discoveredClueIds.Add(clue.clueId);
                    }
                }

                string json = JsonUtility.ToJson(data, true);
                File.WriteAllText(SaveFilePath, json);

                Debug.Log($"<color=#00FF88><b>[SaveSystem]</b></color> Game saved successfully to: {SaveFilePath}");
                return data;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to save game: {ex.Message}");
                return null;
            }
        }

        public static GameSaveData LoadGame()
        {
            if (!SaveExists())
            {
                Debug.LogWarning("[SaveSystem] No save file found.");
                return null;
            }

            try
            {
                string json = File.ReadAllText(SaveFilePath);
                var data = JsonUtility.FromJson<GameSaveData>(json);

                // Enforce safety clamp on load
                data.remainingPermanentAppearanceChanges = Mathf.Clamp(data.remainingPermanentAppearanceChanges, 0, PlayerAppearanceManager.MaxPermanentAppearanceChanges);

                Debug.Log($"<color=#00FF88><b>[SaveSystem]</b></color> Save data loaded. Remaining appearance changes: {data.remainingPermanentAppearanceChanges}");
                return data;
            }
            catch (Exception ex)
            {
                Debug.LogError($"[SaveSystem] Failed to load save file: {ex.Message}");
                return null;
            }
        }
    }
}
