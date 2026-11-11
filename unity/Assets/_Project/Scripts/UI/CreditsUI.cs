using System;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Professional cinematic Credits panel for The Whispering Wilds.
    /// Dedicated to Solo Developer Mohanraj with interactive social channels.
    /// </summary>
    [DisallowMultipleComponent]
    public class CreditsUI : MonoBehaviour
    {
        public const string InstagramUrl = "https://www.instagram.com/itz_me_mtmohan/";
        public const string YouTubeUrl = "https://www.youtube.com/@its_me_fakemask";

        [Header("UI References")]
        [SerializeField] private Text titleText;
        [SerializeField] private Text roleText;
        [SerializeField] private Text devNameText;
        [SerializeField] private Text creditsBodyText;
        [SerializeField] private Button instagramButton;
        [SerializeField] private Button youtubeButton;
        [SerializeField] private Text instagramLabel;
        [SerializeField] private Text youtubeLabel;
        [SerializeField] private Button closeButton;

        public static CreditsUI Instance { get; private set; }

        private float shimmerTime = 0f;

        private void Awake()
        {
            Instance = this;
            if (closeButton != null) closeButton.onClick.AddListener(OnCloseClicked);
            if (instagramButton != null) instagramButton.onClick.AddListener(OpenInstagram);
            if (youtubeButton != null) youtubeButton.onClick.AddListener(OpenYouTube);
            gameObject.SetActive(false);
        }

        private void Update()
        {
            if (!gameObject.activeInHierarchy) return;

            // Subtle golden shimmer animation for developer name & title
            shimmerTime += Time.unscaledDeltaTime * 1.5f;
            float pulse = 0.85f + Mathf.Sin(shimmerTime) * 0.15f;

            if (devNameText != null)
            {
                Color gold = new Color(1f, 0.84f, 0.35f, 1f);
                devNameText.color = new Color(gold.r * pulse, gold.g * pulse, gold.b * (0.8f + pulse * 0.2f), 1f);
            }
        }

        public bool IsVisible() => gameObject.activeInHierarchy;

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
            var cg = GetComponent<CanvasGroup>();
            if (cg != null)
            {
                cg.alpha = visible ? 1f : 0f;
                cg.interactable = visible;
                cg.blocksRaycasts = visible;
            }
            if (visible)
            {
                ApplyLocalizedLabels();
            }
            else
            {
                if (TitleMenuController.Instance != null)
                    TitleMenuController.Instance.OnSubmenuClosed();
            }
        }

        public void ApplyLocalizedLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            bool isTamil = mgr != null && mgr.CurrentLanguage == Language.Tamil;

            if (titleText != null)
            {
                LocalizedFontProvider.Apply(titleText);
                titleText.text = isTamil ? "காட்டு வழி • தடம்" : "THE WHISPERING WILDS";
            }

            if (roleText != null)
            {
                LocalizedFontProvider.Apply(roleText);
                roleText.text = isTamil ? "தனிநபர் உருவாக்குநர்" : "SOLO DEVELOPER";
            }

            if (devNameText != null)
            {
                LocalizedFontProvider.Apply(devNameText);
                devNameText.text = isTamil ? "மோகன்ராஜ்" : "MOHANRAJ";
            }

            if (instagramLabel != null)
            {
                LocalizedFontProvider.Apply(instagramLabel);
                instagramLabel.text = "Instagram: @itz_me_mtmohan";
            }

            if (youtubeLabel != null)
            {
                LocalizedFontProvider.Apply(youtubeLabel);
                youtubeLabel.text = "YouTube: @its_me_fakemask";
            }

            if (creditsBodyText != null)
            {
                LocalizedFontProvider.Apply(creditsBodyText);
                if (isTamil)
                {
                    creditsBodyText.text =
                        "<b>கலாச்சார மற்றும் வரலாற்று ஆய்வு:</b>\n" +
                        "தமிழ்நாட்டின் பன்முகத்தன்மை கொண்ட வரலாற்று தளங்கள், சோழர் & பல்லவர் கால கல்வெட்டுகள், சங்க கால தமிழ் இலக்கியங்கள் மற்றும் மேற்கு தொடர்ச்சி மலை சூழலியல் ஆய்வுகள்.\n\n" +
                        "<b>களப் பகுதிகள்:</b>\n" +
                        "சென்னை ஜார்ஜ் டவுன் • பிச்சாவரம் சதுப்புநிலக் காடு • தஞ்சாவூர் காவிரி டெல்டா • செட்டிநாடு மாளிகைகள் • மாமல்லபுரம் கடற்கரை • நீலகிரி சோலை-தேயிலை வனம் • பழமையான திருக்கோயில்\n\n" +
                        "<b>இசை & ஒலியமைப்பு:</b>\n" +
                        "மோகனம் ராக கர்நாடக ஐந்தொலி மற்றும் நேரடி கள ஒலிப்பதிவுகள்.\n\n" +
                        "<b>தொழில்நுட்பம்:</b>\n" +
                        "Unity 6 HDRP • Windows x64 Direct3D 11 • Node.js & Socket.IO Services\n\n" +
                        "<b>எழுத்துரு:</b> Noto Sans Tamil (Google Fonts, SIL OFL 1.1)";
                }
                else
                {
                    creditsBodyText.text =
                        "<b>Cultural & Historical Heritage Research:</b>\n" +
                        "Grounded in Tamil Nadu's diverse heritage, Sangam literature, Dravidian architecture, Chola & Pallava epigraphy, and the Nilgiri Western Ghats biosphere.\n\n" +
                        "<b>Campaign Regions:</b>\n" +
                        "Chennai George Town • Pichavaram Mangrove Wetlands • Thanjavur Cauvery Delta • Chettinad Mansions • Mamallapuram Shore • Nilgiris Sanctuary • Ancient Temple Ruins\n\n" +
                        "<b>Music & Audio Direction:</b>\n" +
                        "Mohanam Carnatic pentatonic raga themes & field-recorded regional environmental soundscapes.\n\n" +
                        "<b>Technology:</b>\n" +
                        "Unity 6 HDRP Baseline • Windows x64 Direct3D 11 • Node.js & Socket.IO Networking\n\n" +
                        "<b>Typography:</b> Noto Sans Tamil (Google Fonts, SIL OFL 1.1)";
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

        public void OpenInstagram()
        {
            Debug.Log("<color=#FFD700><b>[CreditsUI]</b></color> Opening Instagram: " + InstagramUrl);
            Application.OpenURL(InstagramUrl);
        }

        public void OpenYouTube()
        {
            Debug.Log("<color=#FFD700><b>[CreditsUI]</b></color> Opening YouTube: " + YouTubeUrl);
            Application.OpenURL(YouTubeUrl);
        }

        private void OnCloseClicked()
        {
            SetVisible(false);
        }
    }
}
