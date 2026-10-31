using System;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Campaign;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Displays past games and save file details, allowing players to inspect
    /// their campaign state, resume progress, or delete an existing save.
    /// </summary>
    public class SavedGamesUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Text titleText;
        [SerializeField] private Text slotHeader;
        [SerializeField] private Text regionText;
        [SerializeField] private Text timestampText;
        [SerializeField] private Text statsText;
        [SerializeField] private Text noSaveText;
        [SerializeField] private GameObject saveInfoCard;
        [SerializeField] private Button loadButton;
        [SerializeField] private Button deleteButton;
        [SerializeField] private Button closeButton;

        public static SavedGamesUI Instance { get; private set; }

        private void Awake()
        {
            Instance = this;
            if (closeButton != null) closeButton.onClick.AddListener(OnCloseClicked);
            if (loadButton != null) loadButton.onClick.AddListener(OnLoadClicked);
            if (deleteButton != null) deleteButton.onClick.AddListener(OnDeleteClicked);
            gameObject.SetActive(false);
        }

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
            if (visible)
            {
                RefreshSaveInfo();
            }
        }

        public void RefreshSaveInfo()
        {
            ApplyLocalizedLabels();

            bool hasSave = SaveSystem.HasValidSave();
            if (saveInfoCard != null) saveInfoCard.SetActive(hasSave);
            if (noSaveText != null) noSaveText.gameObject.SetActive(!hasSave);
            if (loadButton != null) loadButton.interactable = hasSave;
            if (deleteButton != null) deleteButton.interactable = hasSave;

            if (!hasSave) return;

            var save = SaveSystem.LoadGame();
            if (save == null)
            {
                if (saveInfoCard != null) saveInfoCard.SetActive(false);
                if (noSaveText != null) noSaveText.gameObject.SetActive(true);
                return;
            }

            LocalizationManager mgr = LocalizationManager.Instance;

            string regionDisplay = !string.IsNullOrEmpty(save.currentRegionId) ? save.currentRegionId : "chennai";
            if (regionText != null)
            {
                string regionPrefix = mgr != null ? mgr.GetForDisplay("saved_games.current_region") : "Current Region";
                regionText.text = $"{regionPrefix}: <b>{regionDisplay.ToUpper()}</b>";
            }

            if (timestampText != null)
            {
                string timePrefix = mgr != null ? mgr.GetForDisplay("saved_games.saved_on") : "Saved";
                string ts = !string.IsNullOrEmpty(save.saveTimestamp) ? save.saveTimestamp : "Recent";
                timestampText.text = $"{timePrefix}: {ts}";
            }

            if (statsText != null)
            {
                int quests = save.completedQuestIds != null ? save.completedQuestIds.Count : 0;
                int clues = save.discoveredClueIds != null ? save.discoveredClueIds.Count : 0;
                int regions = (save.unlockedRegionIds != null ? save.unlockedRegionIds.Count : 0) + 1;
                string cluesLabel = mgr != null ? mgr.GetForDisplay("saved_games.clues_found") : "Clues Discovered";
                string questsLabel = mgr != null ? mgr.GetForDisplay("saved_games.quests_done") : "Quests Completed";
                statsText.text = $"{cluesLabel}: {clues}  |  {questsLabel}: {quests}  |  Regions: {regions}/7";
            }
        }

        public void ApplyLocalizedLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            if (titleText != null)
            {
                LocalizedFontProvider.Apply(titleText);
                titleText.text = mgr != null ? mgr.GetForDisplay("saved_games.title") : "Saved Campaigns";
            }
            if (noSaveText != null)
            {
                LocalizedFontProvider.Apply(noSaveText);
                noSaveText.text = mgr != null ? mgr.GetForDisplay("saved_games.no_saves") : "No saved campaigns found.";
            }
            if (loadButton != null)
            {
                var txt = loadButton.GetComponentInChildren<Text>();
                if (txt != null)
                {
                    LocalizedFontProvider.Apply(txt);
                    txt.text = mgr != null ? mgr.GetForDisplay("menu.continue") : "Continue";
                }
            }
            if (closeButton != null)
            {
                var txt = closeButton.GetComponentInChildren<Text>();
                if (txt != null)
                {
                    LocalizedFontProvider.Apply(txt);
                    txt.text = mgr != null ? mgr.GetForDisplay("menu.back") : "Back";
                }
            }
        }

        private void OnLoadClicked()
        {
            SetVisible(false);
            var titleCtrl = FindAnyObjectByType<TitleMenuController>();
            if (titleCtrl != null)
            {
                titleCtrl.OnContinueClicked();
            }
            else
            {
                CampaignFlow.Instance?.ContinueGame();
            }
        }

        private void OnDeleteClicked()
        {
            ConfirmationDialog dialog = ConfirmationDialog.Instance;
            if (dialog != null)
            {
                dialog.Show("menu.new_game_confirm", () =>
                {
                    SaveSystem.DeleteSave();
                    RefreshSaveInfo();
                    var titleCtrl = FindAnyObjectByType<TitleMenuController>();
                    titleCtrl?.ApplyLocalizedLabels();
                }, null);
            }
            else
            {
                SaveSystem.DeleteSave();
                RefreshSaveInfo();
            }
        }

        private void OnCloseClicked()
        {
            SetVisible(false);
        }
    }
}
