using System;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Campaign;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    public class TitleMenuController : MonoBehaviour
    {
        [Header("Menu Buttons")]
        [SerializeField] private Button newGameButton;
        [SerializeField] private Button continueButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button codexButton;
        [SerializeField] private Button quitButton;

        [Header("Panels")]
        [SerializeField] private GameObject codexPanel;
        [SerializeField] private Button closeCodexButton;
        [SerializeField] private SettingsMenuUI settingsMenu;

        [Header("Info Displays")]
        [SerializeField] private Text ruleNoticeText;

        private CampaignFlow campaignFlow;

        private void Start()
        {
            campaignFlow = CampaignFlow.Instance;

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetGameState(GameState.MainMenu);
            }

            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;

            if (newGameButton != null) newGameButton.onClick.AddListener(OnNewGameClicked);
            if (continueButton != null)
            {
                continueButton.onClick.AddListener(OnContinueClicked);
                // Continue is offered only when the save actually parses. A corrupt file must not
                // present a button that silently drops the player into a fresh campaign.
                continueButton.interactable = CampaignFlow.CanContinue();
            }
            if (settingsButton != null) settingsButton.onClick.AddListener(OnSettingsClicked);
            if (codexButton != null) codexButton.onClick.AddListener(OnOpenCodexClicked);
            if (closeCodexButton != null) closeCodexButton.onClick.AddListener(OnCloseCodexClicked);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuitClicked);

            if (codexPanel != null) codexPanel.SetActive(false);
            if (settingsMenu != null) settingsMenu.SetVisible(false);

            ApplyLocalizedLabels();
        }

        private void OnEnable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged += OnLanguageChanged;
            }
        }

        private void OnDisable()
        {
            if (LocalizationManager.Instance != null)
            {
                LocalizationManager.Instance.OnLanguageChanged -= OnLanguageChanged;
            }
        }

        private void OnLanguageChanged(Language language)
        {
            ApplyLocalizedLabels();
        }

        /// <summary>
        /// Rewrites every title-screen label from its localization key. Buttons are labelled
        /// through their child Text, matching how <c>BuildBootScene</c> constructs them.
        /// </summary>
        public void ApplyLocalizedLabels()
        {
            SetButtonLabel(newGameButton, "menu.new_game");
            SetButtonLabel(continueButton, "menu.continue");
            SetButtonLabel(settingsButton, "menu.settings");
            SetButtonLabel(codexButton, "menu.codex");
            SetButtonLabel(quitButton, "menu.quit");

            ApplyLocalizedFontToChild("GameTitle");
            ApplyLocalizedFontToChild("GameSubtitle");

            if (ruleNoticeText != null)
            {
                LocalizedFontProvider.Apply(ruleNoticeText);
                LocalizationManager mgr = LocalizationManager.Instance;
                if (mgr != null) ruleNoticeText.text = mgr.Get("hud.rule_notice");
            }
        }

        private void SetButtonLabel(Button button, string key)
        {
            if (button == null) return;
            Text label = button.GetComponentInChildren<Text>(true);
            if (label == null) return;

            LocalizedFontProvider.Apply(label);
            LocalizationManager mgr = LocalizationManager.Instance;

            // Never leak the internal "missing." identifier or the raw key to the player.
            label.text = mgr != null ? mgr.GetForDisplay(key) : string.Empty;
        }

        private void ApplyLocalizedFontToChild(string objectName)
        {
            Transform[] children = GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < children.Length; i++)
            {
                if (children[i].name != objectName) continue;
                Text label = children[i].GetComponent<Text>();
                if (label != null) LocalizedFontProvider.Apply(label);
                return;
            }
        }

        public void OnNewGameClicked()
        {
            Debug.Log("<color=#00FF88><b>[Whispering Wilds]</b></color> Starting New Game -> Loading Chennai George Town...");

            if (campaignFlow != null)
            {
                campaignFlow.StartNewGame();
                return;
            }

            // Fallback when the flow component is absent from the scene.
            CampaignFlow.ResetCampaignForNewGame();
            SaveSystem.DeleteSave();
            SaveManager.PendingSaveToRestore = null;
            CampaignFlow.RequestNewGameEnter();
            UnityEngine.SceneManagement.SceneManager.LoadScene("02_Chennai_GeorgeTown");
        }

        public void OnContinueClicked()
        {
            if (campaignFlow != null)
            {
                // ContinueGame returns false when the save is missing or corrupt; the player stays
                // on the menu with an explanation instead of losing the run.
                campaignFlow.ContinueGame();
                return;
            }

            var save = SaveSystem.LoadGame();
            if (save == null || string.IsNullOrEmpty(save.currentRegionId))
            {
                SaveManager.PendingSaveToRestore = null;
                return;
            }

            SaveManager.PendingSaveToRestore = save;
            string targetScene = "02_Chennai_GeorgeTown";
            if (World.TamilNaduGeography.TryGetRegion(save.currentRegionId, out var geo) && !string.IsNullOrEmpty(geo.sceneName))
            {
                targetScene = geo.sceneName;
            }
            UnityEngine.SceneManagement.SceneManager.LoadScene(targetScene);
        }

        public void OnSettingsClicked()
        {
            // Previously this only re-applied the stored settings and logged; there was no
            // screen to change them from. Now it opens the real settings panel.
            if (settingsMenu != null)
            {
                settingsMenu.SetVisible(true);
                return;
            }

            Debug.LogWarning("<color=#FFCC00><b>[Whispering Wilds]</b></color> SettingsMenuUI is not assigned on the title screen.");
        }

        public void OnOpenCodexClicked()
        {
            if (codexPanel != null) codexPanel.SetActive(true);
        }

        public void OnCloseCodexClicked()
        {
            if (codexPanel != null) codexPanel.SetActive(false);
        }

        public void OnQuitClicked()
        {
            Debug.Log("<color=#FFAA00><b>[Whispering Wilds]</b></color> Quitting game...");
            Application.Quit();
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#endif
        }
    }
}
