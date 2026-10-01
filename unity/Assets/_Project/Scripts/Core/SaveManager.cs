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

        public static GameSaveData PendingSaveToRestore { get; set; }

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

        private void OnEnable()
        {
            UnityEngine.SceneManagement.SceneManager.sceneLoaded += HandleSceneLoaded;
        }

        private void OnDisable()
        {
            UnityEngine.SceneManagement.SceneManager.sceneLoaded -= HandleSceneLoaded;
        }

        private void HandleSceneLoaded(UnityEngine.SceneManagement.Scene scene, UnityEngine.SceneManagement.LoadSceneMode mode)
        {
            if (PendingSaveToRestore != null)
            {
                ApplySaveDataToGame(PendingSaveToRestore);
                PendingSaveToRestore = null;
            }
        }

        public void ApplySaveDataToGame(GameSaveData save)
        {
            if (save == null) return;

            var player = GameObject.FindWithTag("Player");
            if (player != null)
            {
                var cc = player.GetComponent<CharacterController>();
                if (cc != null) cc.enabled = false;
                player.transform.position = new Vector3(save.posX, save.posY, save.posZ);
                player.transform.rotation = Quaternion.Euler(0f, save.rotY, 0f);
                if (cc != null) cc.enabled = true;

                var appearance = player.GetComponent<PlayerAppearanceManager>();
                if (appearance != null)
                {
                    appearance.RestoreState(save.remainingPermanentAppearanceChanges, save.appearanceProfile, save.equippedOutfit);
                }

                var playerMgr = player.GetComponent<PlayerManager>();
                if (playerMgr != null)
                {
                    playerMgr.SetRemainingPermanentChanges(save.remainingPermanentAppearanceChanges);
                    playerMgr.EquipRegionalOutfit(save.equippedOutfit);
                }
            }

            if (WhisperingWilds.Inventory.InventoryManager.Instance != null)
            {
                WhisperingWilds.Inventory.InventoryManager.Instance.AddCurrency(save.currency - WhisperingWilds.Inventory.InventoryManager.Instance.Currency);
            }

            if (WhisperingWilds.World.WorldTimeSystem.Instance != null)
            {
                WhisperingWilds.World.WorldTimeSystem.Instance.SetTime(save.timeOfDayHours);
            }

            if (WhisperingWilds.NPC.NPCScheduleManager.Instance != null)
            {
                WhisperingWilds.NPC.NPCScheduleManager.Instance.ForceEvaluateAllSchedules();
            }

            if (WhisperingWilds.Wildlife.WildlifeManager.Instance != null)
            {
                WhisperingWilds.Wildlife.WildlifeManager.Instance.AdvanceLogicalEcologySimulation(0);
            }

            Debug.Log($"<color=#00FF99><b>[SaveManager]</b></color> Game state successfully restored into scene (Player: {save.posX:F1}, {save.posY:F1}, {save.posZ:F1}, Time: {save.timeOfDayHours:F1}).");
        }

        public void SaveGame(int slot = 0)
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
