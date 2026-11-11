using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.InputSystem;
using WhisperingWilds.Core;
using WhisperingWilds.Campaign;
using WhisperingWilds.Localization;
using WhisperingWilds.Online;
using WhisperingWilds.Audio;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Title menu controller for The Whispering Wilds (காட்டு வழி • தடம்).
    ///
    /// Professional Cinematic PC Game Interface:
    /// 1. BEGIN GAME — opens Game Mode Selection (Solo vs Multiplayer)
    /// 2. PREVIOUS JOURNEY — inspect and continue/load existing campaign
    /// 3. BACKUPS & SAVES — local and cloud save management
    /// 4. SETTINGS — audio, display, quality, controls, accessibility
    /// 5. DEVELOPER CREDITS — solo developer Mohanraj
    /// 6. QUIT GAME — confirmation dialog before exit
    ///
    /// Top-Right: ACCOUNT / SIGN IN badge showing signed-in status or Guest.
    /// Does not force account login for solo offline gameplay.
    /// </summary>
    [DisallowMultipleComponent]
    public class TitleMenuController : MonoBehaviour
    {
        public static TitleMenuController Instance { get; private set; }

        [Header("Menu Buttons (Section 1 Structure)")]
        [SerializeField] private Button beginGameButton;
        [SerializeField] private Button previousJourneyButton;
        [SerializeField] private Button backupsSavesButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button creditsButton;
        [SerializeField] private Button quitButton;

        [Header("Legacy Button Aliases (Backward Compatibility)")]
        [SerializeField] private Button newGameButton;
        [SerializeField] private Button continueButton;
        [SerializeField] private Button coopButton;
        [SerializeField] private Button savedGamesButton;
        [SerializeField] private Button loginButton;

        [Header("Top-Right Account Control")]
        [SerializeField] private Button accountButton;
        [SerializeField] private Text accountStatusText;

        [Header("Panels")]
        [SerializeField] private GameModeSelectionUI gameModeSelectionUI;
        [SerializeField] private SavedGamesUI savedGamesUI;
        [SerializeField] private SaveManagementUI saveManagementUI;
        [SerializeField] private SettingsMenuUI settingsMenu;
        [SerializeField] private CreditsUI creditsUI;
        [SerializeField] private LoginUI loginUI;
        [SerializeField] private ConfirmationDialog confirmationDialog;

        [Header("Title Labels")]
        [SerializeField] private Text titleText;
        [SerializeField] private Text subtitleText;
        [SerializeField] private Text ruleNoticeText;

        [Header("Audio")]
        [SerializeField] private AudioClip menuAmbienceClip;
        [SerializeField] private AudioClip menuMusicClip;

        [Header("Cinematic Intro")]
        [SerializeField] private CinematicIntroController cinematicIntro;

        [Header("Animation")]
        [SerializeField] private MainMenuAnimator mainMenuAnimator;

        [Header("Menu Navigation Container")]
        [SerializeField] private GameObject menuRoot;
        [SerializeField] private GameObject menuContainer;

        [Header("Audio SFX")]
        [SerializeField] private AudioClip clickClip;

        private CampaignFlow campaignFlow;
        private bool _hasPlayedEntrance = false;
        private bool _isTransitioning = false;

        private void Awake()
        {
            Instance = this;
        }

        private void Start()
        {
            campaignFlow = CampaignFlow.Instance;

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetGameState(GameState.MainMenu);
            }

            Cursor.lockState = CursorLockMode.None;
            Cursor.visible = true;

            EnsurePanels();
            BindButtonListeners();

            // Hide modal panels on start
            if (gameModeSelectionUI != null) gameModeSelectionUI.SetVisible(false);
            if (savedGamesUI != null) savedGamesUI.SetVisible(false);
            if (saveManagementUI != null) saveManagementUI.SetVisible(false);
            if (settingsMenu != null) settingsMenu.SetVisible(false);
            if (creditsUI != null) creditsUI.SetVisible(false);
            if (loginUI != null) loginUI.SetVisible(false);

            ApplyLocalizedLabels();
            UpdateAccountBadge();

            bool anyModalOpen = (gameModeSelectionUI != null && gameModeSelectionUI.IsVisible())
                || (savedGamesUI != null && savedGamesUI.gameObject.activeSelf)
                || (saveManagementUI != null && saveManagementUI.IsVisible())
                || (settingsMenu != null && settingsMenu.gameObject.activeSelf)
                || (creditsUI != null && creditsUI.gameObject.activeSelf)
                || (loginUI != null && loginUI.gameObject.activeSelf)
                || (confirmationDialog != null && confirmationDialog.IsVisible);

            if (menuContainer != null && menuContainer.activeSelf == anyModalOpen)
            {
                menuContainer.SetActive(!anyModalOpen);
            }
            // Check if continue/previous journey should be enabled
            UpdateJourneyButtonsInteractable();

            if (loginUI != null)
            {
                loginUI.OnBackToMenu += OnLoginClosed;
            }

            // Only trigger delayed entrance if there is NO CinematicIntroController present
            if (cinematicIntro == null)
            {
                StartCoroutine(StartMenuAnimationDelayed());
            }

            // Ensure audio systems are present and start menu ambience/music from boot.
            EnsureAudioSystemsInitialized();

            if (AudioManager.Instance != null)
            {
                // Ensure an AudioListener exists so audio is audible.
                if (FindAnyObjectByType<AudioListener>() == null && Camera.main != null)
                {
                    Camera.main.gameObject.AddComponent<AudioListener>();
                }
                else if (FindAnyObjectByType<AudioListener>() == null)
                {
                    var listenerGo = new GameObject("MainAudioListener");
                    listenerGo.AddComponent<AudioListener>();
                }

                // Menu ambient bed (independent of music bus)
                if (menuAmbienceClip == null)
                {
                    menuAmbienceClip = Resources.Load<AudioClip>("Audio/Ambience/temple_ambience")
                        ?? Resources.Load<AudioClip>("Audio/temple_ambience")
                        ?? Resources.Load<AudioClip>("temple_ambience");
                }
                if (menuAmbienceClip != null)
                {
                    AudioManager.Instance.PlayAmbient(menuAmbienceClip);
                }

                // Menu music (music bus) - if intro is not playing, start/crossfade to menu theme.
                if (menuMusicClip == null)
                {
                    menuMusicClip = Resources.Load<AudioClip>("Audio/Music/bgm_main_menu")
                        ?? Resources.Load<AudioClip>("Audio/Music/Region/bgm_main_menu")
                        ?? Resources.Load<AudioClip>("bgm_main_menu");
                }
                bool introPlaying = cinematicIntro != null && cinematicIntro.IsPlaying;
                if (!introPlaying && menuMusicClip != null)
                {
                    AudioManager.Instance.PlayMusic(menuMusicClip, 1.5f);
                }
            }

            // Environmental soundscape (ambience layers). Avoid routing BGM through ambience for menu.
            if (RegionalSoundscapeManager.Instance != null)
            {
                // Keep regional ambience system initialized; menu uses AudioManager for ambience/music separation.
                RegionalSoundscapeManager.Instance.EnsureInitialized();
            }
        }

        private void Update()
        {
            // Update account badge when sign-in state changes
            UpdateAccountBadge();

            // ESC closes any open panel safely
#if ENABLE_INPUT_SYSTEM
            var kb = Keyboard.current;
            if (kb != null && kb.escapeKey.wasPressedThisFrame)
            {
                HandleEscapeKey();
            }
#else
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                HandleEscapeKey();
            }
#endif
        }

        private void BindButtonListeners()
        {
            // 1. Begin Game
            Button btnBegin = beginGameButton != null ? beginGameButton : newGameButton;
            if (btnBegin != null)
            {
                btnBegin.onClick.RemoveAllListeners();
                btnBegin.onClick.AddListener(OnBeginGameClicked);
            }

            // 2. Previous Journey
            Button btnPrev = previousJourneyButton != null ? previousJourneyButton : continueButton;
            if (btnPrev != null)
            {
                btnPrev.onClick.RemoveAllListeners();
                btnPrev.onClick.AddListener(OnPreviousJourneyClicked);
            }

            // 3. Backups & Saves
            Button btnBackups = backupsSavesButton != null ? backupsSavesButton : savedGamesButton;
            if (btnBackups != null)
            {
                btnBackups.onClick.RemoveAllListeners();
                btnBackups.onClick.AddListener(OnBackupsSavesClicked);
            }

            // 4. Settings
            if (settingsButton != null)
            {
                settingsButton.onClick.RemoveAllListeners();
                settingsButton.onClick.AddListener(OnSettingsClicked);
            }

            // 5. Credits
            if (creditsButton != null)
            {
                creditsButton.onClick.RemoveAllListeners();
                creditsButton.onClick.AddListener(OnCreditsClicked);
            }

            // 6. Quit Game
            if (quitButton != null)
            {
                quitButton.onClick.RemoveAllListeners();
                quitButton.onClick.AddListener(OnQuitClicked);
            }

            // Account / Sign In control
            Button btnAcc = accountButton != null ? accountButton : loginButton;
            if (btnAcc != null)
            {
                btnAcc.onClick.RemoveAllListeners();
                btnAcc.onClick.AddListener(OnAccountClicked);
            }
        }

        private void UpdateJourneyButtonsInteractable()
        {
            bool hasValidSave = CampaignFlow.CanContinue() || SaveSystem.HasValidSave();

            Button btnPrev = previousJourneyButton != null ? previousJourneyButton : continueButton;
            if (btnPrev != null)
            {
                btnPrev.interactable = hasValidSave;
            }

            if (continueButton != null && continueButton != btnPrev)
            {
                continueButton.interactable = hasValidSave;
            }
        }

        public void UpdateAccountBadge()
        {
            if (accountStatusText == null) return;

            LocalizedFontProvider.Apply(accountStatusText);
            LocalizationManager mgr = LocalizationManager.Instance;

            AuthService auth = AuthService.Instance;
            if (auth != null && auth.IsSignedIn && auth.CurrentUser != null)
            {
                string name = !string.IsNullOrEmpty(auth.CurrentUser.displayName)
                    ? auth.CurrentUser.displayName
                    : (!string.IsNullOrEmpty(auth.CurrentUser.email) ? auth.CurrentUser.email : "Account");
                accountStatusText.text = $"👤 {name}";
            }
            else
            {
                string guestLabel = mgr != null ? mgr.GetForDisplay("menu.account_guest") : "Guest (Offline)";
                accountStatusText.text = $"👤 {guestLabel}";
            }
        }

        private void OnDestroy()
        {
            if (loginUI != null)
            {
                loginUI.OnBackToMenu -= OnLoginClosed;
            }
        }

        private System.Collections.IEnumerator StartMenuAnimationDelayed()
        {
            yield return null;
            yield return null;

            OnIntroCompleted();
        }

        /// <summary>
        /// Called when the cinematic intro finishes or is skipped.
        /// Activates the menu root and plays the visible entrance animation.
        /// </summary>
        public void CompleteIntro()
        {
            OnIntroCompleted();
        }

        public void OnIntroCompleted()
        {
            if (_hasPlayedEntrance) return;
            _hasPlayedEntrance = true;

            EnsurePanels();

            if (menuRoot != null)
            {
                menuRoot.SetActive(true);
            }
            if (menuContainer != null)
            {
                menuContainer.SetActive(true);
                var cg = menuContainer.GetComponent<CanvasGroup>();
                if (cg != null)
                {
                    cg.alpha = 1f;
                    cg.interactable = true;
                    cg.blocksRaycasts = true;
                }
            }

            // Smooth crossfade from intro music to main menu music on the music bus.
            if (AudioManager.Instance != null)
            {
                if (menuMusicClip == null)
                {
                    menuMusicClip = Resources.Load<AudioClip>("Audio/Music/bgm_main_menu")
                        ?? Resources.Load<AudioClip>("Audio/Music/Region/bgm_main_menu")
                        ?? Resources.Load<AudioClip>("bgm_main_menu");
                }
                if (menuMusicClip != null)
                {
                    AudioManager.Instance.PlayMusic(menuMusicClip, 2.0f);
                }
            }

            MainMenuAnimator animator = mainMenuAnimator != null ? mainMenuAnimator : FindAnyObjectByType<MainMenuAnimator>();
            if (animator != null)
            {
                animator.ResetAnimationState();
                animator.PlayEntrance();
            }
        }

        private void PlayClickSound()
        {
            if (clickClip == null)
            {
                clickClip = Resources.Load<AudioClip>("Audio/ui_click") ?? Resources.Load<AudioClip>("ui_click");
            }
            if (clickClip != null)
            {
                var audioSrc = GetComponent<AudioSource>();
                if (audioSrc == null) audioSrc = gameObject.AddComponent<AudioSource>();
                audioSrc.PlayOneShot(clickClip, 0.7f);
            }
        }

        // ====================================================================
        // BUTTON HANDLERS
        // ====================================================================

        /// <summary>
        /// 1. BEGIN GAME: Opens cinematic Game Mode Selection (Solo vs Multiplayer).
        /// </summary>
        public void OnBeginGameClicked()
        {
            CloseAllModals();
            if (gameModeSelectionUI != null)
            {
                gameModeSelectionUI.SetVisible(true);
            }
            else
            {
                // Fallback: check confirmation before starting new game
                OnNewGameClicked();
            }
        }

        /// <summary>
        /// 2. PREVIOUS JOURNEY: Opens SavedGamesUI to inspect and continue save.
        /// </summary>
        public void OnPreviousJourneyClicked()
        {
            CloseAllModals();
            if (savedGamesUI != null)
            {
                savedGamesUI.SetVisible(true);
            }
            else
            {
                OnContinueClicked();
            }
        }

        /// <summary>
        /// 3. BACKUPS & SAVES: Opens local and cloud save management screen.
        /// </summary>
        public void OnBackupsSavesClicked()
        {
            CloseAllModals();
            if (saveManagementUI != null)
            {
                saveManagementUI.SetVisible(true);
            }
            else if (savedGamesUI != null)
            {
                savedGamesUI.SetVisible(true);
            }
        }

        /// <summary>
        /// 4. SETTINGS: Opens settings screen.
        /// </summary>
        public void OnSettingsClicked()
        {
            CloseAllModals();
            if (settingsMenu != null)
            {
                settingsMenu.SetVisible(true);
            }
        }

        /// <summary>
        /// 5. DEVELOPER CREDITS: Opens credits screen.
        /// </summary>
        public void OnCreditsClicked()
        {
            CloseAllModals();
            if (creditsUI != null)
            {
                creditsUI.SetVisible(true);
            }
        }

        /// <summary>
        /// 6. QUIT GAME: Shows quit confirmation dialog.
        /// </summary>
        public void OnQuitClicked()
        {
            ConfirmationDialog dialog = confirmationDialog != null ? confirmationDialog : ConfirmationDialog.Instance;
            if (dialog != null)
            {
                dialog.Show("dialog.quit_confirm", ExecuteQuit, null);
            }
            else
            {
                ExecuteQuit();
            }
        }

        private void ExecuteQuit()
        {
            Debug.Log("<color=#FFAA00><b>[TitleMenuController]</b></color> Quitting game...");
            Application.Quit();
#if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
#endif
        }

        /// <summary>
        /// TOP-RIGHT ACCOUNT: Opens login / account screen with smooth slide and fade transitions.
        /// </summary>
        public void OnAccountClicked()
        {
            if (_isTransitioning) return;
            if (loginUI != null && loginUI.gameObject.activeSelf) return;

            _isTransitioning = true;
            PlayClickSound();

            CloseAllModals();

            if (menuContainer != null)
            {
                StartCoroutine(TransitionMenuContainer(false, () =>
                {
                    if (loginUI != null)
                    {
                        loginUI.TransitionIn(() =>
                        {
                            _isTransitioning = false;
                        });
                    }
                    else
                    {
                        _isTransitioning = false;
                    }
                }));
            }
            else
            {
                if (loginUI != null)
                {
                    loginUI.TransitionIn(() =>
                    {
                        _isTransitioning = false;
                    });
                }
                else
                {
                    _isTransitioning = false;
                }
            }
        }

        public void OnLoginClosed()
        {
            if (_isTransitioning) return;
            _isTransitioning = true;

            if (loginUI != null && loginUI.gameObject.activeSelf)
            {
                loginUI.TransitionOut(() =>
                {
                    if (menuContainer != null)
                    {
                        menuContainer.SetActive(true);
                        StartCoroutine(TransitionMenuContainer(true, () =>
                        {
                            _isTransitioning = false;
                            UpdateAccountBadge();
                            RestoreFocus();
                        }));
                    }
                    else
                    {
                        _isTransitioning = false;
                        UpdateAccountBadge();
                        RestoreFocus();
                    }
                });
            }
            else
            {
                if (menuContainer != null)
                {
                    menuContainer.SetActive(true);
                    StartCoroutine(TransitionMenuContainer(true, () =>
                    {
                        _isTransitioning = false;
                        UpdateAccountBadge();
                        RestoreFocus();
                    }));
                }
                else
                {
                    _isTransitioning = false;
                    UpdateAccountBadge();
                    RestoreFocus();
                }
            }
        }

        private void RestoreFocus()
        {
            var btn = beginGameButton != null ? beginGameButton : newGameButton;
            if (btn != null && UnityEngine.EventSystems.EventSystem.current != null)
            {
                UnityEngine.EventSystems.EventSystem.current.SetSelectedGameObject(btn.gameObject);
            }
        }

        private System.Collections.IEnumerator TransitionMenuContainer(bool show, Action onComplete)
        {
            if (menuContainer == null)
            {
                onComplete?.Invoke();
                yield break;
            }

            var cg = menuContainer.GetComponent<CanvasGroup>();
            if (cg == null) cg = menuContainer.AddComponent<CanvasGroup>();

            var rt = menuContainer.GetComponent<RectTransform>();
            // Preserve the menu's designed anchored position (set by layout/scene) instead of forcing
            // a hard-coded offset that can push the menu off-screen at different resolutions.
            Vector2 basePos = rt.anchoredPosition;
            if (show && Mathf.Abs(basePos.x) < 0.01f && Mathf.Abs(basePos.y) < 0.01f)
            {
                // Fallback only when the container has no meaningful position yet.
                basePos = new Vector2(0f, -40f);
            }

            float duration = 0.25f;
            float elapsed = 0f;
            float startAlpha = cg.alpha;
            float endAlpha = show ? 1f : 0f;
            Vector2 startPos = show ? basePos + new Vector2(-30f, 0f) : rt.anchoredPosition;
            Vector2 endPos = show ? basePos : basePos + new Vector2(-30f, 0f);

            cg.interactable = false;
            cg.blocksRaycasts = false;

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float smoothT = t * t * (3f - 2f * t);

                cg.alpha = Mathf.Lerp(startAlpha, endAlpha, smoothT);
                rt.anchoredPosition = Vector2.Lerp(startPos, endPos, smoothT);
                yield return null;
            }

            cg.alpha = endAlpha;
            rt.anchoredPosition = endPos;
            cg.interactable = show;
            cg.blocksRaycasts = show;

            if (!show)
            {
                menuContainer.SetActive(false);
            }

            onComplete?.Invoke();
        }

        // Legacy Aliases
        public void OnNewGameClicked()
        {
            if (SaveSystem.HasValidSave())
            {
                ConfirmationDialog dialog = confirmationDialog != null ? confirmationDialog : ConfirmationDialog.Instance;
                if (dialog != null)
                {
                    dialog.Show("menu.new_game_confirm", ExecuteNewGame, null);
                    return;
                }
            }
            ExecuteNewGame();
        }

        private void ExecuteNewGame()
        {
            RealtimeManager.Instance?.EnterSoloMode();
            Debug.Log("<color=#00FF88><b>[TitleMenuController]</b></color> Starting New Game -> Chennai George Town...");

            if (campaignFlow != null)
            {
                campaignFlow.StartNewGame();
                return;
            }

            CampaignFlow.ResetCampaignForNewGame();
            SaveSystem.DeleteSave();
            SaveManager.PendingSaveToRestore = null;
            CampaignFlow.RequestNewGameEnter();
            CampaignFlow.RequestCampaignEntry("chennai");
        }

        public void OnContinueClicked()
        {
            RealtimeManager.Instance?.EnterSoloMode();
            if (campaignFlow != null)
            {
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

        public void OnCoopClicked()
        {
            CloseAllModals();
            CoopLobbyUI.Show();
        }

        public void OnLoginClicked()
        {
            OnAccountClicked();
        }

        public void OnSavedGamesClicked()
        {
            OnPreviousJourneyClicked();
        }

        private void HandleEscapeKey()
        {
            if (gameModeSelectionUI != null && gameModeSelectionUI.IsVisible())
            {
                gameModeSelectionUI.SetVisible(false);
                return;
            }
            if (saveManagementUI != null && saveManagementUI.IsVisible())
            {
                saveManagementUI.SetVisible(false);
                return;
            }
            if (savedGamesUI != null && savedGamesUI.gameObject.activeSelf)
            {
                savedGamesUI.SetVisible(false);
                return;
            }
            if (settingsMenu != null && settingsMenu.gameObject.activeSelf)
            {
                settingsMenu.SetVisible(false);
                return;
            }
            if (creditsUI != null && creditsUI.gameObject.activeSelf)
            {
                creditsUI.SetVisible(false);
                return;
            }
            if (loginUI != null && loginUI.gameObject.activeSelf)
            {
                OnLoginClosed();
                return;
            }
            if (confirmationDialog != null && confirmationDialog.IsVisible)
            {
                confirmationDialog.Dismiss();
                return;
            }

            // If no modal is open, pressing ESC on main menu prompts quit confirmation
            OnQuitClicked();
        }

        public void CloseAllModals()
        {
            if (gameModeSelectionUI != null) gameModeSelectionUI.SetVisible(false);
            if (savedGamesUI != null) savedGamesUI.SetVisible(false);
            if (saveManagementUI != null) saveManagementUI.SetVisible(false);
            if (settingsMenu != null) settingsMenu.SetVisible(false);
            if (creditsUI != null) creditsUI.SetVisible(false);
            if (loginUI != null && loginUI.gameObject.activeSelf)
            {
                loginUI.SetVisible(false);
            }
            if (confirmationDialog != null) confirmationDialog.Dismiss();
        }

        private void EnsurePanels()
        {
            if (gameModeSelectionUI == null) gameModeSelectionUI = FindAnyObjectByType<GameModeSelectionUI>();
            if (savedGamesUI == null) savedGamesUI = FindAnyObjectByType<SavedGamesUI>();
            if (saveManagementUI == null) saveManagementUI = FindAnyObjectByType<SaveManagementUI>();
            if (settingsMenu == null) settingsMenu = FindAnyObjectByType<SettingsMenuUI>();
            if (creditsUI == null) creditsUI = FindAnyObjectByType<CreditsUI>();
            if (loginUI == null) loginUI = FindAnyObjectByType<LoginUI>();
            if (confirmationDialog == null) confirmationDialog = FindAnyObjectByType<ConfirmationDialog>();
            if (mainMenuAnimator == null) mainMenuAnimator = FindAnyObjectByType<MainMenuAnimator>();
            if (menuRoot == null)
            {
                var mr = transform.Find("MenuRoot");
                if (mr != null) menuRoot = mr.gameObject;
            }
            if (menuContainer == null)
            {
                var mc = transform.Find("MenuRoot/MenuContainer");
                if (mc != null) menuContainer = mc.gameObject;
            }
        }

        private static void EnsureAudioSystemsInitialized()
        {
            if (AudioManager.Instance == null)
            {
                var existing = FindAnyObjectByType<AudioManager>();
                if (existing == null)
                {
                    var audioGo = new GameObject("AudioManager");
                    DontDestroyOnLoad(audioGo);
                    audioGo.AddComponent<AudioManager>();
                }
            }

            if (RegionalSoundscapeManager.Instance == null)
            {
                var existing = FindAnyObjectByType<RegionalSoundscapeManager>();
                if (existing == null)
                {
                    var soundscapeGo = new GameObject("RegionalSoundscapeManager");
                    DontDestroyOnLoad(soundscapeGo);
                    var soundscape = soundscapeGo.AddComponent<RegionalSoundscapeManager>();
                    soundscape.EnsureInitialized();
                }
                else
                {
                    existing.EnsureInitialized();
                }
            }
        }

        public void ApplyLocalizedLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            if (mgr == null) return;

            // Main Title
            if (titleText != null)
            {
                LocalizedFontProvider.Apply(titleText);
                titleText.text = mgr.GetForDisplay("menu.title");
            }
            if (subtitleText != null)
            {
                LocalizedFontProvider.Apply(subtitleText);
                subtitleText.text = mgr.GetForDisplay("menu.subtitle");
            }

            // Buttons
            SetButtonLabel(beginGameButton, mgr.GetForDisplay("menu.begin_game"));
            SetButtonLabel(newGameButton, mgr.GetForDisplay("menu.begin_game"));

            SetButtonLabel(previousJourneyButton, mgr.GetForDisplay("menu.previous_journey"));
            SetButtonLabel(continueButton, mgr.GetForDisplay("menu.previous_journey"));

            SetButtonLabel(backupsSavesButton, mgr.GetForDisplay("menu.backups_saves"));
            SetButtonLabel(savedGamesButton, mgr.GetForDisplay("menu.backups_saves"));

            SetButtonLabel(settingsButton, mgr.GetForDisplay("menu.settings"));
            SetButtonLabel(creditsButton, mgr.GetForDisplay("menu.credits"));
            SetButtonLabel(quitButton, mgr.GetForDisplay("menu.quit"));

            UpdateAccountBadge();
            UpdateJourneyButtonsInteractable();
        }

        private static void SetButtonLabel(Button button, string text)
        {
            if (button == null) return;
            var label = button.GetComponentInChildren<Text>(true);
            if (label != null)
            {
                LocalizedFontProvider.Apply(label);
                label.text = text;
            }
        }
    }
}
