using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;

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

        [Header("Info Displays")]
        [SerializeField] private Text ruleNoticeText;

        private void Start()
        {
            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;

            if (newGameButton != null) newGameButton.onClick.AddListener(OnNewGameClicked);
            if (continueButton != null)
            {
                continueButton.onClick.AddListener(OnContinueClicked);
                continueButton.interactable = SaveSystem.SaveExists();
            }
            if (settingsButton != null) settingsButton.onClick.AddListener(OnSettingsClicked);
            if (codexButton != null) codexButton.onClick.AddListener(OnOpenCodexClicked);
            if (closeCodexButton != null) closeCodexButton.onClick.AddListener(OnCloseCodexClicked);
            if (quitButton != null) quitButton.onClick.AddListener(OnQuitClicked);

            if (codexPanel != null) codexPanel.SetActive(false);

            if (ruleNoticeText != null)
            {
                ruleNoticeText.text = "விதிமுறை: முழு பயணத்திலும் அதிகபட்சம் 5 நிரந்தர தோற்ற மாற்றங்கள் மட்டுமே அனுமதிக்கப்படும்.\n" +
                                      "(Rule: Strict maximum of 5 permanent character appearance changes across the entire journey.)";
            }
        }

        public void OnNewGameClicked()
        {
            Debug.Log("<color=#00FF88><b>[Whispering Wilds]</b></color> Starting New Game -> Loading Chennai George Town...");
            SceneManager.LoadScene("02_Chennai_GeorgeTown");
        }

        public void OnContinueClicked()
        {
            var save = SaveSystem.LoadGame();
            if (save != null && !string.IsNullOrEmpty(save.currentRegionId))
            {
                Debug.Log($"<color=#00D2FF><b>[Whispering Wilds]</b></color> Continuing from region: {save.currentRegionId}...");
                string targetScene = save.currentRegionId == "chennai" ? "02_Chennai_GeorgeTown" : "02_Chennai_GeorgeTown";
                SceneManager.LoadScene(targetScene);
            }
            else
            {
                SceneManager.LoadScene("02_Chennai_GeorgeTown");
            }
        }

        public void OnSettingsClicked()
        {
            if (SettingsMenuController.Instance != null)
            {
                SettingsMenuController.Instance.ApplyAllSettings();
            }
            Debug.Log("<color=#00D2FF><b>[Whispering Wilds]</b></color> Settings menu accessed.");
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
