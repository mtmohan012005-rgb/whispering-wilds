using UnityEngine;
using System.IO;

public class SaveSystem : MonoBehaviour
{
    private static string SaveFilePath => Path.Combine(Application.persistentDataPath, "player_progress.json");

    [System.Serializable]
    public class GameData
    {
        public int remainingAppearanceTokens = 5;
        public string currentAttireID = "chennai_veshti";
        public int activeSceneIndex = 1;
        public Vector3 playerPosition = Vector3.zero;
    }

    public static void SaveProgress(int remainingTokens, string clothingID, int sceneIndex, Vector3 position)
    {
        GameData data = new GameData
        {
            // Clamp tokens immediately to ensure values never exceed the 5-change maximum
            remainingAppearanceTokens = Mathf.Clamp(remainingTokens, 0, 5),
            currentAttireID = clothingID,
            activeSceneIndex = sceneIndex,
            playerPosition = position
        };

        string jsonPayload = JsonUtility.ToJson(data, true);
        File.WriteAllText(SaveFilePath, jsonPayload);
        Debug.Log("?? Save System: Real-world gameplay parameters written securely to disk path.");
    }

    public static GameData LoadProgress()
    {
        if (!File.Exists(SaveFilePath))
        {
            Debug.Log("?? Save System: No previous save profile found. Initializing fresh token matrix (5/5).");
            return new GameData();
        }

        string jsonPayload = File.ReadAllText(SaveFilePath);
        GameData data = JsonUtility.FromJson<GameData>(jsonPayload);
        
        // Enforce data validation rule constraint on system initialization
        data.remainingAppearanceTokens = Mathf.Clamp(data.remainingAppearanceTokens, 0, 5);
        return data;
    }

    public static bool ConsumeCustomizationToken()
    {
        GameData currentData = LoadProgress();

        if (currentData.remainingAppearanceTokens <= 0)
        {
            Debug.LogWarning("? Customization Rejected: Strict maximum limit of 5 changes reached!");
            return false;
        }

        currentData.remainingAppearanceTokens--;
        SaveProgress(currentData.remainingAppearanceTokens, currentData.currentAttireID, currentData.activeSceneIndex, currentData.playerPosition);
        Debug.Log($"? Token Consumed: {currentData.remainingAppearanceTokens} modifications remaining across the journey.");
        return true;
    }

    public static void ProcessAttireSwap(string targetAttireID)
    {
        GameData currentData = LoadProgress();
        
        // Free cultural swap configuration logic—does not consume tokens
        currentData.currentAttireID = targetAttireID;
        SaveProgress(currentData.remainingAppearanceTokens, currentData.currentAttireID, currentData.activeSceneIndex, currentData.playerPosition);
        Debug.Log($"?? Attire Engine: Swapped to '{targetAttireID}'. Free regional swap processed successfully.");
    }
}
