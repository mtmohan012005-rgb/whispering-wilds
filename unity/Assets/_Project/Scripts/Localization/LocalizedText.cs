using UnityEngine;
using UnityEngine.UI;

namespace WhisperingWilds.Localization
{
    /// <summary>
    /// Binds a legacy <see cref="UnityEngine.UI.Text"/> label to a localization key so the text
    /// refreshes the moment the language changes, with no scene reload and no hard-coded
    /// English/Tamil conditionals inside the UI scripts.
    /// </summary>
    /// <remarks>
    /// The project uses uGUI <see cref="UnityEngine.UI.Text"/> rather than TextMeshPro, so this
    /// component targets <see cref="Text"/> deliberately.
    /// </remarks>
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Text))]
    public class LocalizedText : MonoBehaviour
    {
        [Tooltip("LocalizationDatabase key rendered by this label.")]
        [SerializeField] private string localizationKey;

        [Tooltip("Optional fallback shown if the key is missing entirely.")]
        [SerializeField] private string designerPreview = "";

        private Text _label;
        private bool _subscribed;

        public string LocalizationKey
        {
            get => localizationKey;
            set
            {
                localizationKey = value;
                Refresh();
            }
        }

        private void Awake()
        {
            _label = GetComponent<Text>();
        }

        private void OnEnable()
        {
            Subscribe();
            Refresh();
        }

        private void OnDisable()
        {
            Unsubscribe();
        }

        /// <summary>Registers an arbitrary target, for labels driven by scripts rather than the inspector.</summary>
        public void Bind(string key, Text target)
        {
            localizationKey = key;
            _label = target != null ? target : GetComponent<Text>();
            Subscribe();
            Refresh();
        }

        private void Subscribe()
        {
            if (_subscribed || LocalizationManager.Instance == null) return;
            LocalizationManager.Instance.OnLanguageChanged += Refresh;
            _subscribed = true;
        }

        private void Unsubscribe()
        {
            if (!_subscribed || LocalizationManager.Instance == null) return;
            LocalizationManager.Instance.OnLanguageChanged -= Refresh;
            _subscribed = false;
        }

        /// <summary>Re-reads the active language and rewrites the label.</summary>
        public void Refresh()
        {
            if (_label == null) _label = GetComponent<Text>();
            if (_label == null) return;

            if (string.IsNullOrEmpty(localizationKey))
            {
                _label.text = designerPreview;
                return;
            }

            _label.text = LocalizationManager.Instance != null
                ? LocalizationManager.Instance.Get(localizationKey)
                : localizationKey;
        }

        /// <summary>Convenience for buttons that need both a label and a localized tooltip.</summary>
        public void RefreshWithFormat(params object[] args)
        {
            if (_label == null) _label = GetComponent<Text>();
            if (_label == null || string.IsNullOrEmpty(localizationKey)) return;
            _label.text = LocalizationManager.Instance != null
                ? LocalizationManager.Instance.Get(localizationKey, args)
                : localizationKey;
        }
    }
}
