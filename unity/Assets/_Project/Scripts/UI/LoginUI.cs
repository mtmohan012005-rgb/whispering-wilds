using System;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using WhisperingWilds.Localization;
using WhisperingWilds.Online;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Login / Account panel for the main menu.
    ///
    /// Provides Sign In and Create Account modes, communicates with the backend
    /// through AuthService, and never logs passwords or tokens.
    /// </summary>
    public class LoginUI : MonoBehaviour
    {
        [Header("Sign In Fields")]
        [SerializeField] private InputField emailField;
        [SerializeField] private InputField passwordField;
        [SerializeField] private Button signInButton;
        [SerializeField] private Text signInStatusText;

        [Header("Register Fields")]
        [SerializeField] private InputField registerEmailField;
        [SerializeField] private InputField registerNameField;
        [SerializeField] private InputField registerPasswordField;
        [SerializeField] private InputField registerConfirmPasswordField;
        [SerializeField] private Button registerButton;
        [SerializeField] private Text registerStatusText;

        [Header("Navigation")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button switchToRegisterButton;
        [SerializeField] private Button switchToSignInButton;

        [Header("Signed In State")]
        [SerializeField] private Text signedInLabel;
        [SerializeField] private Button signOutButton;

        [Header("Panels")]
        [SerializeField] private GameObject signInPanel;
        [SerializeField] private GameObject registerPanel;
        [SerializeField] private GameObject signedInPanel;

        private bool _isRegistering;
        private bool _buttonsHooked;

        public event Action<bool, string> OnSignInResult;
        public event Action OnBackToMenu;

        private void Awake()
        {
            SetVisible(false);
        }

        private void Start()
        {
            if (!_buttonsHooked)
            {
                HookButtons();
                _buttonsHooked = true;
            }

            // If already signed in, show the signed-in state
            if (AuthService.Instance != null && AuthService.Instance.IsSignedIn)
            {
                ShowSignedIn();
            }
        }

        private void OnDestroy()
        {
            UnhookButtons();
        }

        private UnityAction _signInClick;
        private UnityAction _backClick;
        private UnityAction _switchToRegisterClick;
        private UnityAction _switchToSignInClick;
        private UnityAction _registerClick;
        private UnityAction _signOutClick;

        private void HookButtons()
        {
            _signInClick = OnSignInClicked;
            _backClick = OnBackClicked;
            _switchToRegisterClick = OnSwitchToRegisterClicked;
            _switchToSignInClick = OnSwitchToSignInClicked;
            _registerClick = OnRegisterClicked;
            _signOutClick = OnSignOutClicked;

            if (signInButton != null) signInButton.onClick.AddListener(_signInClick);
            if (backButton != null) backButton.onClick.AddListener(_backClick);
            if (switchToRegisterButton != null) switchToRegisterButton.onClick.AddListener(_switchToRegisterClick);
            if (switchToSignInButton != null) switchToSignInButton.onClick.AddListener(_switchToSignInClick);
            if (registerButton != null) registerButton.onClick.AddListener(_registerClick);
            if (signOutButton != null) signOutButton.onClick.AddListener(_signOutClick);
        }

        private void UnhookButtons()
        {
            if (signInButton != null) signInButton.onClick.RemoveListener(_signInClick);
            if (backButton != null) backButton.onClick.RemoveListener(_backClick);
            if (switchToRegisterButton != null) switchToRegisterButton.onClick.RemoveListener(_switchToRegisterClick);
            if (switchToSignInButton != null) switchToSignInButton.onClick.RemoveListener(_switchToSignInClick);
            if (registerButton != null) registerButton.onClick.RemoveListener(_registerClick);
            if (signOutButton != null) signOutButton.onClick.RemoveListener(_signOutClick);
        }

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
            if (visible)
            {
                ApplyLocalizedLabels();
                ShowSignIn();
            }
        }

        private void ShowSignIn()
        {
            SetPanelActive(signInPanel, true);
            SetPanelActive(registerPanel, false);
            SetPanelActive(signedInPanel, false);
            ClearFields();
        }

        private void ShowRegister()
        {
            SetPanelActive(signInPanel, false);
            SetPanelActive(registerPanel, true);
            SetPanelActive(signedInPanel, false);
            ClearFields();
        }

        private void ShowSignedIn()
        {
            SetPanelActive(signInPanel, false);
            SetPanelActive(registerPanel, false);
            SetPanelActive(signedInPanel, true);

            if (signedInLabel != null && AuthService.Instance?.CurrentUser != null)
            {
                var user = AuthService.Instance.CurrentUser;
                string name = !string.IsNullOrEmpty(user.displayName) ? user.displayName : user.email;
                LocalizationManager mgr = LocalizationManager.Instance;
                string prefix = mgr != null ? mgr.GetForDisplay("login.signed_in_as") : "Signed in as";
                signedInLabel.text = $"{prefix}: {name}";
            }
        }

        private static void SetPanelActive(GameObject panel, bool active)
        {
            if (panel != null) panel.SetActive(active);
        }

        private void ClearFields()
        {
            if (emailField != null) emailField.text = "";
            if (passwordField != null) passwordField.text = "";
            if (registerEmailField != null) registerEmailField.text = "";
            if (registerNameField != null) registerNameField.text = "";
            if (registerPasswordField != null) registerPasswordField.text = "";
            if (registerConfirmPasswordField != null) registerConfirmPasswordField.text = "";
            if (signInStatusText != null) signInStatusText.text = "";
            if (registerStatusText != null) registerStatusText.text = "";
        }

        private void OnSignInClicked()
        {
            if (AuthService.Instance == null)
            {
                SetStatus(signInStatusText, "Authentication service is unavailable.", false);
                return;
            }

            if (AuthService.Instance.IsRequesting)
            {
                SetStatus(signInStatusText, "A request is already in progress.", false);
                return;
            }

            string email = emailField != null ? emailField.text.Trim() : "";
            string password = passwordField != null ? passwordField.text : "";

            if (string.IsNullOrWhiteSpace(email))
            {
                SetStatus(signInStatusText, "Email is required.", false);
                return;
            }

            if (string.IsNullOrWhiteSpace(password))
            {
                SetStatus(signInStatusText, "Password is required.", false);
                return;
            }

            // Disable button while requesting
            if (signInButton != null)
            {
                signInButton.interactable = false;
                SetStatus(signInStatusText, "Signing in...", true);
            }

            AuthService.Instance.SignIn(email, password, (success, message) =>
            {
                if (signInButton != null) signInButton.interactable = true;
                SetStatus(signInStatusText, message, success);

                if (success)
                {
                    OnSignInResult?.Invoke(true, message);
                    ShowSignedIn();
                }
                else
                {
                    OnSignInResult?.Invoke(false, message);
                }
            });
        }

        private void OnRegisterClicked()
        {
            if (AuthService.Instance == null)
            {
                SetStatus(registerStatusText, "Authentication service is unavailable.", false);
                return;
            }

            if (AuthService.Instance.IsRequesting)
            {
                SetStatus(registerStatusText, "A request is already in progress.", false);
                return;
            }

            string email = registerEmailField != null ? registerEmailField.text.Trim() : "";
            string name = registerNameField != null ? registerNameField.text.Trim() : "";
            string password = registerPasswordField != null ? registerPasswordField.text : "";
            string confirm = registerConfirmPasswordField != null ? registerConfirmPasswordField.text : "";

            if (string.IsNullOrWhiteSpace(email))
            {
                SetStatus(registerStatusText, "Email is required.", false);
                return;
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                SetStatus(registerStatusText, "Display name is required.", false);
                return;
            }

            if (string.IsNullOrWhiteSpace(password))
            {
                SetStatus(registerStatusText, "Password is required.", false);
                return;
            }

            if (password != confirm)
            {
                SetStatus(registerStatusText, "Passwords do not match.", false);
                return;
            }

            if (registerButton != null)
            {
                registerButton.interactable = false;
                SetStatus(registerStatusText, "Creating account...", true);
            }

            AuthService.Instance.Register(email, password, confirm, name, (success, message) =>
            {
                if (registerButton != null) registerButton.interactable = true;
                SetStatus(registerStatusText, message, success);

                if (success)
                {
                    // Switch to sign-in after successful registration
                    ShowSignIn();
                    if (emailField != null) emailField.text = email;
                }
            });
        }

        private void OnSignOutClicked()
        {
            if (AuthService.Instance != null)
            {
                AuthService.Instance.SignOut();
                ShowSignIn();
            }
        }

        private void OnBackClicked()
        {
            ClearFields();
            SetVisible(false);
            OnBackToMenu?.Invoke();
        }

        private void OnSwitchToRegisterClicked()
        {
            ShowRegister();
        }

        private void OnSwitchToSignInClicked()
        {
            ShowSignIn();
        }

        private static void SetStatus(Text text, string message, bool success)
        {
            if (text == null) return;
            text.text = message;
            text.color = success ? Color.green : Color.red;
        }

        private void OnLanguageChanged(Language language)
        {
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

        public void ApplyLocalizedLabels()
        {
            LocalizationManager mgr = LocalizationManager.Instance;
            if (mgr == null) return;

            SetButtonText(signInButton, "login.sign_in");
            SetButtonText(backButton, "login.back");
            SetButtonText(switchToRegisterButton, "login.no_account");
            SetButtonText(switchToSignInButton, "login.have_account");
            SetButtonText(registerButton, "login.create_account");
            SetButtonText(signOutButton, "login.sign_out");

            SetPlaceholder(emailField, "login.email_placeholder");
            SetPlaceholder(passwordField, "login.password_placeholder");
            SetPlaceholder(registerEmailField, "login.email_placeholder");
            SetPlaceholder(registerNameField, "login.name_placeholder");
            SetPlaceholder(registerPasswordField, "login.password_placeholder");
            SetPlaceholder(registerConfirmPasswordField, "login.confirm_password_placeholder");
        }

        private void SetButtonText(Button button, string key)
        {
            if (button == null) return;
            Text label = button.GetComponentInChildren<Text>(true);
            if (label == null) return;
            LocalizationManager mgr = LocalizationManager.Instance;
            LocalizedFontProvider.Apply(label);
            label.text = mgr != null ? mgr.GetForDisplay(key) : key;
        }

        private void SetPlaceholder(InputField field, string key)
        {
            if (field == null) return;
            var placeholder = field.placeholder;
            if (placeholder == null) return;
            LocalizationManager mgr = LocalizationManager.Instance;
            // placeholder is a Graphic; cast to Text for font and .text
            if (placeholder is Text textComp)
            {
                LocalizedFontProvider.Apply(textComp);
                textComp.text = mgr != null ? mgr.GetForDisplay(key) : key;
            }
        }
    }
}
