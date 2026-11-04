using System;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Core;
using WhisperingWilds.Campaign;
using WhisperingWilds.Localization;
using WhisperingWilds.Online;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Cinematic Game Mode Selection Panel (Solo Expedition vs Multiplayer Expedition).
    /// </summary>
    [DisallowMultipleComponent]
    public class GameModeSelectionUI : MonoBehaviour
    {
        public static GameModeSelectionUI Instance { get; private set; }

        [Header("UI References")]
        [SerializeField] private GameObject panelRoot;
        [SerializeField] private Text headerTitleText;
        [SerializeField] private Text headerSubtitleText;

        [Header("Solo Expedition Card")]
        [SerializeField] private Button soloCardButton;
        [SerializeField] private Text soloTitleText;
        [SerializeField] private Text soloDescriptionText;

        [Header("Multiplayer Expedition Card")]
        [SerializeField] private Button multiCardButton;
        [SerializeField] private Text multiTitleText;
        [SerializeField] private Text multiDescriptionText;

        [Header("Navigation")]
        [SerializeField] private Button backButton;

        private void Awake()
        {
            Instance = this;
            if (soloCardButton != null) soloCardButton.onClick.AddListener(OnSoloClicked);
            if (multiCardButton != null) multiCardButton.onClick.AddListener(OnMultiClicked);
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);

            if (panelRoot != null) panelRoot.SetActive(false);
            else gameObject.SetActive(false);
        }

        private void Update()
        {
            if (IsVisible() && Input.GetKeyDown(KeyCode.Escape))
            {
                SetVisible(false);
            }
        }

        public bool IsVisible()
        {
            return panelRoot != null ? panelRoot.activeSelf : gameObject.activeSelf;
        }

        public void SetVisible(bool visible)
        {
            if (panelRoot != null)
            {
                panelRoot.SetActive(visible);
            }
            else
            {
                gameObject.SetActive(visible);
            }

            if (visible)
            {
                ApplyLocalizedLabels();
            }
        }

        public void ApplyLocalizedLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            bool isTamil = mgr != null && mgr.CurrentLanguage == Language.Tamil;

            if (headerTitleText != null)
            {
                LocalizedFontProvider.Apply(headerTitleText);
                headerTitleText.text = mgr != null ? mgr.GetForDisplay("gamemode.title") : "EXPEDITION MODE";
            }

            if (headerSubtitleText != null)
            {
                LocalizedFontProvider.Apply(headerSubtitleText);
                headerSubtitleText.text = mgr != null ? mgr.GetForDisplay("gamemode.subtitle") : "Select your journey across Tamil Nadu";
            }

            if (soloTitleText != null)
            {
                LocalizedFontProvider.Apply(soloTitleText);
                soloTitleText.text = mgr != null ? mgr.GetForDisplay("gamemode.solo_title") : "SOLO EXPEDITION";
            }

            if (soloDescriptionText != null)
            {
                LocalizedFontProvider.Apply(soloDescriptionText);
                soloDescriptionText.text = mgr != null ? mgr.GetForDisplay("gamemode.solo_desc") : "Explore Tamil Nadu alone. Discover living culture, solve mysteries, and traverse ancient regions in single-player.";
            }

            if (multiTitleText != null)
            {
                LocalizedFontProvider.Apply(multiTitleText);
                multiTitleText.text = mgr != null ? mgr.GetForDisplay("gamemode.multi_title") : "MULTIPLAYER EXPEDITION";
            }

            if (multiDescriptionText != null)
            {
                LocalizedFontProvider.Apply(multiDescriptionText);
                multiDescriptionText.text = mgr != null ? mgr.GetForDisplay("gamemode.multi_desc") : "Explore together with other players. Host or join an online expedition using a numeric invitation code.";
            }

            if (backButton != null)
            {
                var txt = backButton.GetComponentInChildren<Text>();
                if (txt != null)
                {
                    LocalizedFontProvider.Apply(txt);
                    txt.text = mgr != null ? mgr.GetForDisplay("menu.back") : "Back";
                }
            }
        }

        private void OnSoloClicked()
        {
            SetVisible(false);

            var titleCtrl = FindAnyObjectByType<TitleMenuController>();
            if (titleCtrl != null)
            {
                titleCtrl.OnNewGameClicked();
            }
            else
            {
                RealtimeManager.Instance?.EnterSoloMode();
                CampaignFlow.Instance?.StartNewGame();
            }
        }

        private void OnMultiClicked()
        {
            SetVisible(false);
            CoopLobbyUI.Show();
        }

        private void OnBackClicked()
        {
            SetVisible(false);
        }
    }
}
