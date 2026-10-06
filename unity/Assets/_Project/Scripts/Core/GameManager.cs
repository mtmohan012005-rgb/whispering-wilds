using System;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.UI;
using WhisperingWilds.Localization;

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
        [SerializeField] private GameState currentState = GameState.Boot;
        [SerializeField] private string currentRegion = "chennai";

        [Header("Autosave")]
        [Tooltip("Seconds between autosaves while playing. Disabled when <= 0.")]
        [SerializeField] private float autosaveIntervalSeconds = 120f;

        public GameState CurrentState => currentState;
        public string CurrentRegion => currentRegion;

        public event Action<GameState> OnGameStateChanged;

        private float autosaveTimer;
        private bool autosaveInProgress;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);

            // Opening content must exist before any manager resolves a saved identifier.
            Gameplay.ChennaiOpeningContent.EnsureInitialized();
        }

        private void Start()
        {
            // The boot scene owns the menu, so start in Boot and let the menu hand over to
            // Gameplay. Previously this forced Gameplay immediately, which meant the main menu
            // was reachable only as an overlay on a running campaign.
            SetGameState(GameState.Boot);

            if (HUDManager.Instance != null)
            {
                // Sourced from the localization database, never hard-coded, so the HUD region
                // label stays in the language the player selected (no bilingual mixing).
                string regionEn = "George Town, Chennai";
                string regionTa = "சென்னை ஜார்ஜ் டவுன்";
                if (LocalizationDatabase.TryGetEntry("hud.region_chennai_georgetown", out var regionEntry))
                {
                    regionEn = regionEntry.english;
                    regionTa = regionEntry.tamil;
                }
                HUDManager.Instance.SetRegionName(regionEn, regionTa);
            }
        }

        private void Update()
        {
            TickAutosave();
        }

        /// <summary>
        /// Conservative autosave: only while actually playing, never while a save is already in
        /// flight, and never inside a state where the world is deliberately paused.
        /// </summary>
        private void TickAutosave()
        {
            if (autosaveIntervalSeconds <= 0f) return;
            if (autosaveInProgress) return;
            if (currentState != GameState.Gameplay) return;

            autosaveTimer += Time.unscaledDeltaTime;
            if (autosaveTimer < autosaveIntervalSeconds) return;

            autosaveTimer = 0f;
            autosaveInProgress = true;
            try
            {
                var player = GameObject.FindWithTag("Player");
                if (SaveSystem.SaveGame(player) != null)
                {
                    Debug.Log("<color=#00FF99><b>[GameManager]</b></color> Autosave written.");
                }
            }
            finally
            {
                autosaveInProgress = false;
            }
        }

        public void SetGameState(GameState newState)
        {
            if (currentState == newState) return;

            currentState = newState;
            Debug.Log($"<color=#00D2FF><b>[GameManager]</b></color> Game state changed to: {currentState}");

            switch (currentState)
            {
                case GameState.Boot:
                case GameState.MainMenu:
                case GameState.Paused:
                case GameState.Cinematic:
                case GameState.Dialogue:
                case GameState.InvestigationBoard:
                case GameState.PhotoMode:
                    // Every non-playing state freezes the world and releases the cursor. Player
                    // movement and interaction input are additionally gated by IsPlayerInputAllowed
                    // so a frozen world cannot be walked through.
                    Time.timeScale = 0.0f;
                    Cursor.lockState = CursorLockMode.None;
                    Cursor.visible = true;
                    break;

                case GameState.Gameplay:
                    Time.timeScale = 1.0f;
                    Cursor.lockState = CursorLockMode.Locked;
                    Cursor.visible = false;
                    break;
            }

            OnGameStateChanged?.Invoke(currentState);
        }

        /// <summary>
        /// Single gate for player locomotion and interaction. UI states freeze the world, but a
        /// frozen <c>Update</c> is not enough of a guarantee on its own, so movement, interaction,
        /// and the interaction scanner all check this.
        /// </summary>
        public bool IsPlayerInputAllowed =>
            currentState == GameState.Gameplay || currentState == GameState.PhotoMode;

        /// <summary>True when the world is simulated, used by systems that should idle otherwise.</summary>
        public bool IsWorldSimulating => currentState == GameState.Gameplay;

        /// <summary>
        /// Records which region is active. Called by the region bootstrap so save capture and
        /// travel decisions agree on one region id instead of each keeping its own copy.
        /// </summary>
        public void SetRegion(string regionId)
        {
            if (string.IsNullOrEmpty(regionId) || string.Equals(currentRegion, regionId, System.StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            currentRegion = regionId;
            Debug.Log($"[GameManager] Active region: {currentRegion}");
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
            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.SaveGame();
                return;
            }

            var player = GameObject.FindWithTag("Player");
            if (SaveSystem.SaveGame(player) != null && HUDManager.Instance != null)
            {
                HUDManager.Instance.ShowNotificationKey("notify.game_saved");
            }
        }

        public void QuickLoad()
        {
            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.LoadGame();
                return;
            }

            var save = SaveSystem.LoadGame();
            if (save == null)
            {
                if (HUDManager.Instance != null)
                {
                    HUDManager.Instance.ShowNotificationKey("notify.save_none_to_load");
                }
                return;
            }

            if (SaveManager.Instance == null)
            {
                SaveManager.PendingSaveToRestore = save;
            }
            ApplyPlayerTransformFromSave(save);
        }

        /// <summary>
        /// Minimal positional restore used when no SaveManager exists in the scene. The full
        /// restore path (inventory, quests, investigation) belongs to SaveManager.
        /// </summary>
        private static void ApplyPlayerTransformFromSave(GameSaveData save)
        {
            var player = GameObject.FindWithTag("Player");
            if (player == null || save == null) return;

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
        }
    }
}
