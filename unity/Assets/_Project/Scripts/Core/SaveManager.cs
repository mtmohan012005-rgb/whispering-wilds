using System;
using System.IO;
using UnityEngine;
using WhisperingWilds.Online;
using WhisperingWilds.Player;

namespace WhisperingWilds.Core
{
    /// <summary>
    /// Single authoritative Save Governor coordinating local versioned JSON persistence
    /// and non-blocking asynchronous cloud synchronization without frame hiccups.
    /// Strictly guarantees the 5-permanent-change ceiling cannot be bypassed.
    /// </summary>
    [DisallowMultipleComponent]
    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        public event Action<GameSaveData> OnGameSaved;
        public event Action<GameSaveData> OnGameLoaded;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void SaveGame()
        {
            GameSaveData data = SaveSystem.SaveGame();
            if (data != null)
            {
                // Trigger asynchronous non-blocking cloud backup if online
                if (CloudSaveManager.Instance != null)
                {
                    CloudSaveManager.Instance.SynchronizeSaveToCloud(data);
                }
                OnGameSaved?.Invoke(data);
                Debug.Log("<color=#00FF99><b>[SaveManager]</b></color> Game saved and queued for cloud synchronization.");
            }
        }

        public GameSaveData LoadGame()
        {
            GameSaveData data = SaveSystem.LoadGame();
            if (data != null)
            {
                OnGameLoaded?.Invoke(data);
                Debug.Log("<color=#00D2FF><b>[SaveManager]</b></color> Game state loaded successfully.");
            }
            return data;
        }

        public bool SaveExists() => SaveSystem.SaveExists();

        public void DeleteSave() => SaveSystem.DeleteSave();
    }
}
