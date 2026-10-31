using System;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using WhisperingWilds.Core;
using WhisperingWilds.Localization;
using WhisperingWilds.Player;
using WhisperingWilds.Persistence;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Step 2 Execution: In-game pause menu providing safe pausing, saving, settings access,
    /// and clean return to the main menu without state corruption.
    /// Freezes time, releases the cursor, and disables player locomotion and camera orbit while open.
    /// </summary>
    public class InGamePauseMenuUI : MonoBehaviour
    {
        public static InGamePauseMenuUI Instance { get; private set; }

        [Header("UI Hierarchy")]
        [SerializeField] private GameObject pausePanel;
        [SerializeField] private Text titleText;
        [SerializeField] private Button resumeButton;
        [SerializeField] private Button saveButton;
        [SerializeField] private Button settingsButton;
        [SerializeField] private Button mainMenuButton;
        [SerializeField] private Text notificationText;

        private bool isPaused = false;
        private PlayerInputHandler playerInput;

        public bool IsPaused => isPaused;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            if (pausePanel == null)
            {
                BuildDynamicPauseMenu();
            }

            if (pausePanel != null)
            {
                pausePanel.SetActive(false);
            }

            BindButtons();
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

        private void OnLanguageChanged(Language lang)
        {
            ApplyLocalizedLabels();
        }

        private void Start()
        {
            ApplyLocalizedLabels();
        }

        private void Update()
        {
            if (playerInput == null)
            {
                var player = GameObject.FindWithTag("Player");
                if (player != null)
                {
                    playerInput = player.GetComponent<PlayerInputHandler>();
                }
            }

            bool cancelPressed = false;
            if (playerInput != null && playerInput.CancelTriggered)
            {
                cancelPressed = true;
                playerInput.ConsumeCancel();
            }
#if ENABLE_INPUT_SYSTEM
            var kb = Keyboard.current;
            var gp = Gamepad.current;
            if (kb != null && kb.escapeKey.wasPressedThisFrame) cancelPressed = true;
            if (gp != null && gp.startButton.wasPressedThisFrame) cancelPressed = true;
#else
            if (Input.GetKeyDown(KeyCode.Escape)) cancelPressed = true;
#endif

            if (cancelPressed)
            {
                var gm = GameManager.Instance;
                if (!isPaused)
                {
                    // Only open pause menu if in Gameplay state (do not interrupt dialogue, photo mode, or journal)
                    if (gm == null || gm.CurrentState == GameState.Gameplay)
                    {
                        PauseGame();
                    }
                }
                else
                {
                    ResumeGame();
                }
            }
        }

        public void PauseGame()
        {
            isPaused = true;
            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetGameState(GameState.Paused);
            }
            else
            {
                Time.timeScale = 0f;
                Cursor.lockState = CursorLockMode.None;
                Cursor.visible = true;
            }

            ApplyLocalizedLabels();
            if (pausePanel != null)
            {
                pausePanel.SetActive(true);
            }
        }

        public void ResumeGame()
        {
            isPaused = false;
            if (pausePanel != null)
            {
                pausePanel.SetActive(false);
            }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetGameState(GameState.Gameplay);
            }
            else
            {
                Time.timeScale = 1f;
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        public void SaveGame()
        {
            try
            {
                if (SaveManager.Instance != null)
                {
                    SaveManager.Instance.SaveCurrentGame();
                }
                else
                {
                    SaveSystem.SaveGame();
                }

                ShowNotification("menu.save_success");
                Debug.Log("<color=#00FF99><b>[InGamePauseMenuUI]</b></color> Game progress saved successfully.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[InGamePauseMenuUI] Error saving game: {ex.Message}");
            }
        }

        public void OpenSettings()
        {
            var settings = SettingsMenuController.Instance;
            if (settings != null)
            {
                settings.SetVisible(true);
            }
            else
            {
                var settingsUI = FindAnyObjectByType<SettingsMenuUI>();
                if (settingsUI != null) settingsUI.SetVisible(true);
            }
        }

        public void ReturnToMainMenu()
        {
            Time.timeScale = 1f;
            isPaused = false;

            // Auto-save before returning
            try
            {
                SaveSystem.SaveGame();
            }
            catch { }

            if (GameManager.Instance != null)
            {
                GameManager.Instance.SetGameState(GameState.MainMenu);
            }

            SceneManager.LoadScene("00_Boot");
        }

        private void BindButtons()
        {
            if (resumeButton != null) resumeButton.onClick.AddListener(ResumeGame);
            if (saveButton != null) saveButton.onClick.AddListener(SaveGame);
            if (settingsButton != null) settingsButton.onClick.AddListener(OpenSettings);
            if (mainMenuButton != null) mainMenuButton.onClick.AddListener(ReturnToMainMenu);
        }

        public void ApplyLocalizedLabels()
        {
            var mgr = LocalizationManager.Instance;
            if (titleText != null)
            {
                LocalizedFontProvider.Apply(titleText);
                titleText.text = mgr != null ? mgr.GetForDisplay("menu.pause_title") : "PAUSED";
            }
            SetBtnText(resumeButton, "menu.resume", "Resume Game");
            SetBtnText(saveButton, "menu.save_game", "Save Progress");
            SetBtnText(settingsButton, "menu.settings", "Settings");
            SetBtnText(mainMenuButton, "menu.return_to_main", "Return to Main Menu");
        }

        private void SetBtnText(Button btn, string key, string fallback)
        {
            if (btn == null) return;
            var txt = btn.GetComponentInChildren<Text>();
            if (txt != null)
            {
                LocalizedFontProvider.Apply(txt);
                var mgr = LocalizationManager.Instance;
                txt.text = mgr != null ? mgr.GetForDisplay(key) : fallback;
            }
        }

        private void ShowNotification(string key)
        {
            var mgr = LocalizationManager.Instance;
            string msg = mgr != null ? mgr.GetForDisplay(key) : "Game saved.";

            if (notificationText != null)
            {
                LocalizedFontProvider.Apply(notificationText);
                notificationText.text = msg;
                notificationText.gameObject.SetActive(true);
            }

            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.ShowNotificationKey(key, 3f);
            }
        }

        private void BuildDynamicPauseMenu()
        {
            var canvasObj = GameObject.Find("HUD_Canvas");
            Canvas canvas = canvasObj != null ? canvasObj.GetComponent<Canvas>() : FindAnyObjectByType<Canvas>();
            if (canvas == null)
            {
                var newCanvas = new GameObject("PauseMenu_Canvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
                canvas = newCanvas.GetComponent<Canvas>();
                canvas.renderMode = RenderMode.ScreenSpaceOverlay;
                canvas.sortingOrder = 999;
            }

            pausePanel = new GameObject("InGamePausePanel", typeof(RectTransform), typeof(Image));
            pausePanel.transform.SetParent(canvas.transform, false);

            var rt = pausePanel.GetComponent<RectTransform>();
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.sizeDelta = Vector2.zero;

            var bgImg = pausePanel.GetComponent<Image>();
            bgImg.color = new Color(0.04f, 0.05f, 0.07f, 0.88f);

            // Container card
            var card = new GameObject("Card", typeof(RectTransform), typeof(Image));
            card.transform.SetParent(pausePanel.transform, false);
            var cardRt = card.GetComponent<RectTransform>();
            cardRt.sizeDelta = new Vector2(400f, 440f);
            var cardImg = card.GetComponent<Image>();
            cardImg.color = new Color(0.12f, 0.14f, 0.18f, 0.95f);

            // Title
            var titleObj = new GameObject("Title", typeof(RectTransform), typeof(Text));
            titleObj.transform.SetParent(card.transform, false);
            var titleRt = titleObj.GetComponent<RectTransform>();
            titleRt.anchoredPosition = new Vector2(0f, 160f);
            titleRt.sizeDelta = new Vector2(360f, 48f);
            titleText = titleObj.GetComponent<Text>();
            titleText.fontSize = 28;
            titleText.alignment = TextAnchor.MiddleCenter;
            titleText.color = new Color(0.95f, 0.85f, 0.5f);

            // Buttons
            resumeButton = CreateButton(card.transform, "Btn_Resume", new Vector2(0f, 70f), "Resume Game");
            saveButton = CreateButton(card.transform, "Btn_Save", new Vector2(0f, 10f), "Save Progress");
            settingsButton = CreateButton(card.transform, "Btn_Settings", new Vector2(0f, -50f), "Settings");
            mainMenuButton = CreateButton(card.transform, "Btn_MainMenu", new Vector2(0f, -110f), "Return to Main Menu");

            // Notification
            var notifObj = new GameObject("Notification", typeof(RectTransform), typeof(Text));
            notifObj.transform.SetParent(card.transform, false);
            var notifRt = notifObj.GetComponent<RectTransform>();
            notifRt.anchoredPosition = new Vector2(0f, -170f);
            notifRt.sizeDelta = new Vector2(360f, 32f);
            notificationText = notifObj.GetComponent<Text>();
            notificationText.fontSize = 14;
            notificationText.alignment = TextAnchor.MiddleCenter;
            notificationText.color = new Color(0.3f, 0.9f, 0.5f);
            notificationText.gameObject.SetActive(false);
        }

        private Button CreateButton(Transform parent, string name, Vector2 pos, string label)
        {
            var btnObj = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(Button));
            btnObj.transform.SetParent(parent, false);

            var rt = btnObj.GetComponent<RectTransform>();
            rt.anchoredPosition = pos;
            rt.sizeDelta = new Vector2(320f, 44f);

            var img = btnObj.GetComponent<Image>();
            img.color = new Color(0.2f, 0.24f, 0.3f, 1f);

            var btn = btnObj.GetComponent<Button>();
            var colors = btn.colors;
            colors.highlightedColor = new Color(0.35f, 0.42f, 0.52f, 1f);
            colors.pressedColor = new Color(0.15f, 0.18f, 0.22f, 1f);
            btn.colors = colors;

            var txtObj = new GameObject("Text", typeof(RectTransform), typeof(Text));
            txtObj.transform.SetParent(btnObj.transform, false);
            var txtRt = txtObj.GetComponent<RectTransform>();
            txtRt.sizeDelta = rt.sizeDelta;
            var txt = txtObj.GetComponent<Text>();
            txt.text = label;
            txt.fontSize = 16;
            txt.alignment = TextAnchor.MiddleCenter;
            txt.color = Color.white;
            LocalizedFontProvider.Apply(txt);

            return btn;
        }
    }
}
