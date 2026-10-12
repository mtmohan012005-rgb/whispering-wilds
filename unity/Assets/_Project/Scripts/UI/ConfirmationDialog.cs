using System;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Localization;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Simple confirmation dialog for critical actions (e.g., New Game overwriting a save).
    /// Displays a centered modal panel with a message and two buttons: Confirm and Cancel.
    /// Uses callbacks so the caller controls what happens after the player responds.
    /// </summary>
    public class ConfirmationDialog : MonoBehaviour
    {
        public static ConfirmationDialog Instance { get; private set; }

        [Header("Dialog Panel")]
        [SerializeField] private GameObject dialogPanel;

        [Header("Text")]
        [SerializeField] private Text messageText;

        [Header("Buttons")]
        [SerializeField] private Button confirmButton;
        [SerializeField] private Button cancelButton;

        private Action onConfirm;
        private Action onCancel;
        private bool isVisible;

        public bool IsVisible => isVisible;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }
            Instance = this;

            if (confirmButton != null) confirmButton.onClick.AddListener(OnConfirmClicked);
            if (cancelButton != null) cancelButton.onClick.AddListener(OnCancelClicked);

            if (dialogPanel != null) dialogPanel.SetActive(false);
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
            // Update button labels when language changes while dialog is visible
            if (isVisible)
            {
                ApplyButtonLabels();
            }
        }

        /// <summary>
        /// Shows the confirmation dialog with a localized message.
        /// </summary>
        /// <param name="messageKey">Localization key for the message.</param>
        /// <param name="onConfirm">Callback when player confirms.</param>
        /// <param name="onCancel">Callback when player cancels (optional).</param>
        public void Show(string messageKey, Action onConfirm, Action onCancel = null)
        {
            this.onConfirm = onConfirm;
            this.onCancel = onCancel;

            LocalizationManager mgr = LocalizationManager.Instance;
            messageText.text = mgr != null ? mgr.GetForDisplay(messageKey) : messageKey;
            LocalizedFontProvider.Apply(messageText);

            ApplyButtonLabels();

            if (dialogPanel != null)
            {
                dialogPanel.SetActive(true);
            }
            isVisible = true;
        }

        /// <summary>
        /// Shows the confirmation dialog with a raw message string.
        /// </summary>
        public void ShowRaw(string message, Action onConfirm, Action onCancel = null)
        {
            this.onConfirm = onConfirm;
            this.onCancel = onCancel;

            messageText.text = message;
            LocalizedFontProvider.Apply(messageText);

            ApplyButtonLabels();

            if (dialogPanel != null)
            {
                dialogPanel.SetActive(true);
            }
            isVisible = true;
        }

        private void ApplyButtonLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;

            if (confirmButton != null)
            {
                Text confirmLabel = confirmButton.GetComponentInChildren<Text>(true);
                if (confirmLabel != null)
                {
                    confirmLabel.text = mgr != null ? mgr.GetForDisplay("dialog.confirm") : "Confirm";
                    LocalizedFontProvider.Apply(confirmLabel);
                }
            }

            if (cancelButton != null)
            {
                Text cancelLabel = cancelButton.GetComponentInChildren<Text>(true);
                if (cancelLabel != null)
                {
                    cancelLabel.text = mgr != null ? mgr.GetForDisplay("dialog.cancel") : "Cancel";
                    LocalizedFontProvider.Apply(cancelLabel);
                }
            }
        }

        private void OnConfirmClicked()
        {
            Hide();
            onConfirm?.Invoke();
        }

        private void OnCancelClicked()
        {
            Hide();
            onCancel?.Invoke();
        }

        private void Hide()
        {
            isVisible = false;
            if (dialogPanel != null)
            {
                dialogPanel.SetActive(false);
            }
            onConfirm = null;
            onCancel = null;
        }

        /// <summary>
        /// Programmatically hides the dialog without triggering callbacks.
        /// </summary>
        public void Dismiss()
        {
            Hide();
        }
    }
}
