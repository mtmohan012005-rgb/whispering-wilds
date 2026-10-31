using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Credits and cultural acknowledgements panel for The Whispering Wilds.
    /// </summary>
    public class CreditsUI : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private Text titleText;
        [SerializeField] private Text creditsBodyText;
        [SerializeField] private Button closeButton;

        public static CreditsUI Instance { get; private set; }

        private void Awake()
        {
            Instance = this;
            if (closeButton != null) closeButton.onClick.AddListener(OnCloseClicked);
            gameObject.SetActive(false);
        }

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
            if (visible)
            {
                ApplyLocalizedLabels();
            }
        }

        public void ApplyLocalizedLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            if (titleText != null)
            {
                LocalizedFontProvider.Apply(titleText);
                titleText.text = mgr != null ? mgr.GetForDisplay("credits.title") : "Credits & Cultural Acknowledgements";
            }

            if (creditsBodyText != null)
            {
                LocalizedFontProvider.Apply(creditsBodyText);
                bool isTamil = mgr != null && mgr.CurrentLanguage == Language.Tamil;

                if (isTamil)
                {
                    creditsBodyText.text =
                        "<b>தி விஸ்பரிங் வைல்ட்ஸ் • காட்டு வழி • தடம்</b>\n\n" +
                        "<b>தயாரிப்பு & இயக்கம்:</b> Whispering Wilds Studios\n\n" +
                        "<b>கலாச்சார மற்றும் வரலாற்று ஆய்வு:</b>\n" +
                        "தமிழ்நாட்டின் பன்முகத்தன்மை கொண்ட வரலாற்று தளங்கள், சோழர் & பல்லவர் கால கல்வெட்டுகள், சங்க கால தமிழ் இலக்கியங்கள் மற்றும் மேற்கு தொடர்ச்சி மலை சூழலியல் ஆய்வுகள்.\n\n" +
                        "<b>களப் பகுதிகள்:</b>\n" +
                        "சென்னை ஜார்ஜ் டவுன் • பிச்சாவரம் சதுப்புநிலக் காடு • தஞ்சாவூர் காவிரி டெல்டா • செட்டிநாடு மாளிகைகள் • மாமல்லபுரம் கடற்கரை • நீலகிரி சோலை-தேயிலை வனம் • பழமையான திருக்கோயில்\n\n" +
                        "<b>இசை & ஒலியமைப்பு:</b>\n" +
                        "மோகனம் ராக ஐந்தொலி (Carnatic Pentatonic Scale) மற்றும் நேரடி கள ஒலிப்பதிவுகள்.\n\n" +
                        "<b>தொழில்நுட்ப கட்டமைப்பு:</b>\n" +
                        "Unity 6 HDRP • Direct3D 11 Baseline • Node.js & Socket.IO Services\n\n" +
                        "<b>எழுத்துரு:</b> Noto Sans Tamil (Google Fonts, SIL OFL 1.1)";
                }
                else
                {
                    creditsBodyText.text =
                        "<b>THE WHISPERING WILDS</b>\n\n" +
                        "<b>Development & Direction:</b> Whispering Wilds Studios\n\n" +
                        "<b>Cultural & Historical Heritage Research:</b>\n" +
                        "Grounded in Tamil Nadu's diverse heritage, Sangam literature, Dravidian architecture, Chola & Pallava epigraphy, and the Nilgiri Western Ghats biosphere.\n\n" +
                        "<b>Campaign Regions:</b>\n" +
                        "Chennai George Town • Pichavaram Mangrove Wetlands • Thanjavur Cauvery Delta • Chettinad Mansions • Mamallapuram Shore • Nilgiris Sanctuary • Ancient Temple Ruins\n\n" +
                        "<b>Music & Audio Direction:</b>\n" +
                        "Mohanam Carnatic pentatonic raga themes & field-recorded regional environmental soundscapes.\n\n" +
                        "<b>Technology:</b>\n" +
                        "Unity 6 HDRP Baseline • Direct3D 11 Architecture • Node.js & Socket.IO Networking\n\n" +
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

        private void OnCloseClicked()
        {
            SetVisible(false);
        }
    }
}
