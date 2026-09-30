using System;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.UI;

namespace WhisperingWilds.Core
{
    public enum GameState
    {
        Boot,
        MainMenu,
        Gameplay,
        Paused,
        Cinematic,
        Dialogue,
        InvestigationBoard,
        PhotoMode
    }

    /// <summary>
    /// Master game manager orchestrating game states, scene loading, and core loop execution.
    /// </summary>
    [DisallowMultipleComponent]
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Runtime State")]
        [SerializeField] private GameState currentState = GameState.Gameplay;
        [SerializeField] private string currentRegion = "Chennai";

        public GameState CurrentState => currentState;
        public string CurrentRegion => currentRegion;

        public event Action<GameState> OnGameStateChanged;

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

        private void Start()
        {
            SetGameState(GameState.Gameplay);
            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.SetRegionName("George Town, Chennai", "சென்னை ஜார்ஜ் டவுன்");
            }
        }

        public void SetGameState(GameState newState)
        {
            if (currentState == newState) return;

            currentState = newState;
            Debug.Log($"<color=#00D2FF><b>[GameManager]</b></color> Game state changed to: {currentState}");

            switch (currentState)
            {
                case GameState.Gameplay:
                    Time.timeScale = 1.0f;
                    Cursor.lockState = CursorLockMode.Locked;
                    Cursor.visible = false;
                    break;

                case GameState.Paused:
                case GameState.Dialogue:
                case GameState.InvestigationBoard:
                    Time.timeScale = 0.0f;
                    Cursor.lockState = CursorLockMode.None;
                    Cursor.visible = true;
                    break;
            }

            OnGameStateChanged?.Invoke(currentState);
        }

        /// <summary>
        /// Regional travel entry point. Delegates to RegionalSceneManager, which owns the
        /// safe additive transition (save -> preload -> activate -> reposition -> unload).
        /// A direct SceneManager.LoadScene would use LoadSceneMode.Single, destroying the
        /// active region without saving state or repositioning the player.
        /// </summary>
        public void LoadRegion(string regionSceneName)
        {
            string regionId = World.RegionalSceneManager.ResolveRegionIdFromSceneName(regionSceneName);

            if (regionId == null)
            {
                Debug.LogError($"[GameManager] '{regionSceneName}' does not map to a known Tamil Nadu region. Region travel refused; current region retained.");
                return;
            }

            if (World.RegionalSceneManager.Instance == null)
            {
                Debug.LogError("[GameManager] RegionalSceneManager is not present in this scene. Region travel refused; current region retained.");
                return;
            }

            Debug.Log($"<color=#00D2FF><b>[GameManager]</b></color> Requesting region travel: {regionId} (via RegionalSceneManager)");
            World.RegionalSceneManager.Instance.TravelToRegion(regionId);
        }

        public void QuickSave()
        {
            var player = GameObject.FindWithTag("Player");
            if (player != null)
            {
                SaveSystem.SaveGame(player);
                if (HUDManager.Instance != null)
                {
                    HUDManager.Instance.ShowNotification("Game Saved (விளையாட்டு சேமிக்கப்பட்டது)");
                }
            }
        }

        public void QuickLoad()
        {
            var save = SaveSystem.LoadGame();
            if (save != null)
            {
                var player = GameObject.FindWithTag("Player");
                if (player != null)
                {
                    player.transform.position = new Vector3(save.posX, save.posY, save.posZ);
                    var appearance = player.GetComponent<PlayerAppearanceManager>();
                    if (appearance != null)
                    {
                        appearance.RestoreState(save.remainingPermanentAppearanceChanges, save.appearanceProfile, save.equippedOutfit);
                    }
                }

                if (HUDManager.Instance != null)
                {
                    HUDManager.Instance.ShowNotification("Game Loaded (சேமிக்கப்பட்ட விளையாட்டு ஏற்றப்பட்டது)");
                }
            }
        }
    }
}
