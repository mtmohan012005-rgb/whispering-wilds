using System;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Campaign;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Title menu controller for The Whispering Wilds.
    ///
    /// Manages the main menu with New Game, Continue, Settings, and Quit actions.
    /// Integrates with CinematicIntroController for the opening sequence.
    /// </summary>
    public class TitleMenuController : MonoBehaviour
    {
        [Header("Menu Buttons")]
        [SerializeField] private Button newGameButton;
        [SerializeField] private Button continueButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button quitButton;

        [Header("Panels")]
        [SerializeField] private SettingsMenuUI settingsMenu;
        [SerializeField] private ConfirmationDialog confirmationDialog;

        [Header("Info Displays")]
        [SerializeField] private Text ruleNoticeText;

        [Header("Cinematic Intro")]
        [SerializeField] private CinematicIntroController cinematicIntro;

        [Header("STEP 70 — Menu Animation")]
        [SerializeField] private MainMenuAnimator mainMenuAnimator;

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
            if (quitButton != null) quitButton.onClick.AddListener(OnQuitClicked);

            if (settingsMenu != null) settingsMenu.SetVisible(false);

            ApplyLocalizedLabels();

            // STEP 70: Start the menu entrance animation after a short delay to ensure
            // the scene is fully initialized and MainMenuAnimator is discoverable.
            StartCoroutine(StartMenuAnimationDelayed());
        }

        private System.Collections.IEnumerator StartMenuAnimationDelayed()
        {
            // Wait a couple of frames to let all scene objects finish Awake/Start
            yield return null;
            yield return null;

            MainMenuAnimator animator = mainMenuAnimator;
            if (animator == null)
            {
                animator = FindObjectOfType<MainMenuAnimator>();
            }
            if (animator != null)
            {
                Debug.Log("<color=#FFD700><b>[TitleMenuController]</b></color> Starting MainMenuAnimator entrance animation");
                animator.PlayEntrance();
            }
            else
            {
                Debug.LogWarning("<color=#FF6666><b>[TitleMenuController]</b></color> MainMenuAnimator not found after delay — menu entrance animation will not play");
            }
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

            // STEP 70: Stop menu animations when leaving the title screen
            MainMenuAnimator anim = mainMenuAnimator;
            if (anim == null) anim = FindObjectOfType<MainMenuAnimator>();
            if (anim != null)
            {
                anim.StopAnimations();
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
            SetButtonLabel(quitButton, "menu.quit");

            LocalizationManager mgr = LocalizationManager.Instance;

            // The title and subtitle are authored as localization rows so English mode shows
            // only English and Tamil mode only Tamil, instead of the baked bilingual line.
            SetLabel(LocalizedFontProvider.Font, "GameTitle", () => mgr != null ? mgr.GetForDisplay("menu.title") : "THE WHISPERING WILDS");
            SetLabel(LocalizedFontProvider.Font, "GameSubtitle", () => mgr != null ? mgr.GetForDisplay("menu.subtitle") : string.Empty);

            if (ruleNoticeText != null)
            {
                LocalizedFontProvider.Apply(ruleNoticeText);
                if (mgr != null) ruleNoticeText.text = mgr.Get("hud.rule_notice");
            }
        }

        private static void SetLabel(UnityEngine.Font font, string objectName, Func<string> resolve)
        {
            Text label = null;
            var root = Camera.main != null ? Camera.main.transform.root : null;
            if (root != null)
            {
                var t = FindDeepChild(root, objectName);
                if (t != null) label = t.GetComponent<Text>();
            }
            if (label == null)
            {
                var go = GameObject.Find(objectName);
                if (go != null) label = go.GetComponent<Text>();
            }
            if (label == null) return;
            LocalizedFontProvider.Apply(label);
            label.text = resolve();
            label.resizeTextForBestFit = false;
        }

        private static Transform FindDeepChild(Transform root, string name)
        {
            for (int i = 0; i < root.childCount; i++)
            {
                Transform child = root.GetChild(i);
                if (child.name == name) return child;
                Transform nested = FindDeepChild(child, name);
                if (nested != null) return nested;
            }
            return null;
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

        public void OnNewGameClicked()
        {
            // If a valid save exists, ask the player to confirm before overwriting it.
            if (SaveSystem.HasValidSave())
            {
                ConfirmationDialog dialog = confirmationDialog != null
                    ? confirmationDialog
                    : ConfirmationDialog.Instance;

                if (dialog != null)
                {
                    dialog.Show("menu.new_game_confirm", () => ExecuteNewGame(), null);
                    return;
                }
            }

            // No dialog available or no save — proceed directly.
            ExecuteNewGame();
        }

        private void ExecuteNewGame()
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
            CampaignFlow.RequestCampaignEntry("chennai");
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
            CampaignFlow.RequestCampaignEntry(save.currentRegionId);
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
