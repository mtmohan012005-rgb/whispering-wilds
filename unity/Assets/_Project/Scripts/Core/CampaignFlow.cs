using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Core;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.Inventory;
using WhisperingWilds.Investigation;
using WhisperingWilds.Photography;
using WhisperingWilds.UI;

namespace WhisperingWilds.Campaign
{
    /// <summary>
    /// New Game and Continue entry points for the campaign shell.
    ///
    /// New Game resets every persisted subsystem before entering Chennai, so a player who starts
    /// over cannot inherit a previous run's inventory, quests, evidence, appearance allowance, or
    /// NPC memory. Continue validates the save before offering it, so a corrupt primary is
    /// surfaced instead of silently starting a blank campaign.
    /// </summary>
    public class CampaignFlow : MonoBehaviour
    {
        public static CampaignFlow Instance { get; private set; }

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

        /// <summary>
        /// Clears all campaign state for a fresh run. Called before the Chennai scene loads, when
        /// none of the scene-bound managers exist yet, so the static mirrors are cleared directly
        /// and the scene managers start clean when they are created.
        /// </summary>
        public static void ResetCampaignForNewGame()
        {
            ChennaiOpeningContent.EnsureInitialized();

            InvestigationRuntimeState.Clear();
            NPC.NPCInteractionLog.Clear();
            CraftingHistory.Clear();
            PhotoJournal.Clear();

            // Scene-bound managers may still exist if New Game is triggered from a loaded region.
            if (InventoryManager.Instance != null) InventoryManager.Instance.ResetToNewGameDefaults();
            if (Quests.QuestManager.Instance != null) Quests.QuestManager.Instance.ResetAllProgress();
            if (InvestigationManager.Instance != null) InvestigationManager.Instance.ResetState();

            // The permanent appearance allowance belongs to the player, so it is restored too.
            // Both counters exist and must agree: PlayerAppearanceManager owns the applied
            // profile, PlayerManager mirrors the remaining budget.
            var appearance = UnityEngine.Object.FindObjectOfType<Player.PlayerAppearanceManager>();
            if (appearance != null) appearance.ResetToNewGameDefaults();
            if (Player.PlayerManager.Instance != null) Player.PlayerManager.Instance.ResetAppearanceAllowance();

            SaveManager.PendingSaveToRestore = null;
        }

        /// <summary>
        /// Starts a new campaign. Any existing save is discarded so Continue cannot resurrect it,
        /// the opening quests are seeded, and the player enters Chennai.
        /// </summary>
        public void StartNewGame()
        {
            ResetCampaignForNewGame();
            SaveSystem.DeleteSave();

            ChennaiOpeningContent.EnsureInitialized();
            SaveManager.PendingSaveToRestore = null;

            Debug.Log("<color=#00FF88><b>[Campaign]</b></color> New game started. Entering Chennai George Town.");

            // The Chennai scene owns QuestManager, so the opening quests are accepted once it
            // exists. PendingNewGame is the hand-off that tells the scene to seed them.
            PendingNewGame = true;

            UnityEngine.SceneManagement.SceneManager.LoadScene("02_Chennai_GeorgeTown");
        }

        /// <summary>
        /// Set by New Game and consumed by the Chennai scene once its QuestManager exists, so the
        /// opening quests are seeded exactly once per new campaign.
        /// </summary>
        public static bool PendingNewGame { get; private set; }

        /// <summary>
        /// Requests a new-campaign hand-off without needing a CampaignFlow component. Used by the
        /// title menu fallback when the persistent flow object is missing from the scene.
        /// </summary>
        public static void RequestNewGameEnter()
        {
            PendingNewGame = true;
        }

        /// <summary>
        /// Called by the region bootstrap after its managers exist.
        /// </summary>
        public static void ConsumeNewGameRequest()
        {
            if (!PendingNewGame) return;
            PendingNewGame = false;

            if (Quests.QuestManager.Instance != null)
            {
                Quests.QuestManager.Instance.AcceptOpeningQuests();
            }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetGameState(GameState.Gameplay);
            }
        }

        /// <summary>
        /// Resumes the saved campaign. Returns false and leaves the game untouched when no usable
        /// save exists, so the caller can keep the player on the menu with an explanation rather
        /// than dropping them into a fresh region.
        /// </summary>
        public bool ContinueGame()
        {
            var save = SaveSystem.LoadGame();
            if (save == null)
            {
                Debug.LogWarning($"<color=#FFAA00><b>[Campaign]</b></color> Continue refused: {SaveSystem.LastLoadDetail}");
                ShowContinueFailure();
                return false;
            }

            int activeQuests = save.questProgress?.Count ?? save.activeQuestIds?.Count ?? 0;
            Debug.Log($"[Campaign] Continuing with {activeQuests} active quest(s), {save.discoveredClueIds?.Count ?? 0} clue(s).");

            SaveManager.PendingSaveToRestore = save;
            PendingNewGame = false;

            string targetScene = "02_Chennai_GeorgeTown";
            if (World.TamilNaduGeography.TryGetRegion(save.currentRegionId, out var geo) && !string.IsNullOrEmpty(geo.sceneName))
            {
                targetScene = geo.sceneName;
            }

            Debug.Log($"<color=#00D2FF><b>[Campaign]</b></color> Continuing in region '{save.currentRegionId}' via scene '{targetScene}'. Status: {SaveSystem.LastLoadStatus}");
            UnityEngine.SceneManagement.SceneManager.LoadScene(targetScene);
            return true;
        }

        private static void ShowContinueFailure()
        {
            if (HUDManager.Instance == null) return;

            switch (SaveSystem.LastLoadStatus)
            {
                case SaveOperationStatus.CorruptPrimaryRecoveredFromBackup:
                    HUDManager.Instance.ShowNotification("Save recovered from backup (சேமிப்பு காப்புப் பிரதியிலிருந்து மீட்டெடுக்கப்பட்டது)");
                    break;
                case SaveOperationStatus.CorruptSave:
                    HUDManager.Instance.ShowNotification("Save file is unreadable (சேமிப்புக் கோப்பு வாசிக்க முடியவில்லை)");
                    break;
                case SaveOperationStatus.NoSaveFound:
                default:
                    HUDManager.Instance.ShowNotification("No save to continue (தொடர வேண்டிய சேமிப்பு இல்லை)");
                    break;
            }
        }

        /// <summary>True when Continue should be offered on the menu.</summary>
        public static bool CanContinue() => SaveSystem.HasValidSave();
    }
}