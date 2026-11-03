using System;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;
using WhisperingWilds.Localization;
using WhisperingWilds.Online;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Password strength rating tiers.
    /// </summary>
    public enum PasswordStrength
    {
        Empty = 0,
        Weak = 1,
        Medium = 2,
        Strong = 3
    }

    /// <summary>
    /// PRO Login Experience / Account controller for The Whispering Wilds.
    ///
    /// Provides cinematic AAA-quality authentication flows:
    /// 1. Sign In (with Show/Hide password toggle, Remember Email, Forgot Password)
    /// 2. Create Account (with Password Strength meter, Requirements, Show/Hide password)
    /// 3. Forgot Password (account enumeration protected recovery dispatch)
    /// 4. Reset Password (token validation, new password update)
    /// 5. Signed-In Account View (Explorer identity, cloud save sync status, sign out)
    /// 6. Guest / Play Offline exploration mode
    ///
    /// Never persists plaintext passwords or raw session tokens to PlayerPrefs.
    /// </summary>
    public class LoginUI : MonoBehaviour
    {
        public const string RememberEmailKey = "WW_REMEMBERED_EMAIL";
        public const string RememberEmailEnabledKey = "WW_REMEMBER_EMAIL_ENABLED";

        [Header("Sign In Fields")]
        [SerializeField] private InputField emailField;
        [SerializeField] private InputField passwordField;
        [SerializeField] private Button togglePasswordVisibilityButton;
        [SerializeField] private Text passwordEyeText;
        [SerializeField] private Toggle rememberEmailToggle;
        [SerializeField] private Button forgotPasswordButton;
        [SerializeField] private Button signInButton;
        [SerializeField] private Text signInStatusText;
        [SerializeField] private Button switchToRegisterButton;

        [Header("Register Fields")]
        [SerializeField] private InputField registerEmailField;
        [SerializeField] private InputField registerNameField;
        [SerializeField] private InputField registerPasswordField;
        [SerializeField] private InputField registerConfirmPasswordField;
        [SerializeField] private Button toggleRegPasswordVisibilityButton;
        [SerializeField] private Text regPasswordEyeText;
        [SerializeField] private Image passwordStrengthBar;
        [SerializeField] private Text passwordStrengthText;
        [SerializeField] private Text registerRequirementsText;
        [SerializeField] private Button registerButton;
        [SerializeField] private Text registerStatusText;
        [SerializeField] private Button switchToSignInButton;

        [Header("Forgot Password Fields")]
        [SerializeField] private InputField forgotEmailField;
        [SerializeField] private Button sendRecoveryButton;
        [SerializeField] private Text forgotStatusText;
        [SerializeField] private Button forgotBackToSignInButton;
        [SerializeField] private Button forgotHaveTokenButton;
        [SerializeField] private Text forgotInstructionsText;

        [Header("Reset Password Fields")]
        [SerializeField] private InputField resetTokenField;
        [SerializeField] private InputField resetPasswordField;
        [SerializeField] private InputField resetConfirmPasswordField;
        [SerializeField] private Button toggleResetPasswordVisibilityButton;
        [SerializeField] private Text resetPasswordEyeText;
        [SerializeField] private Button resetPasswordButton;
        [SerializeField] private Text resetStatusText;
        [SerializeField] private Button resetBackToSignInButton;
        [SerializeField] private Text resetInstructionsText;

        [Header("Signed In State")]
        [SerializeField] private Text signedInLabel;
        [SerializeField] private Text accountStatusLabel;
        [SerializeField] private Button signOutButton;
        [SerializeField] private Button continueButton;

        [Header("Shared Navigation & Indicators")]
        [SerializeField] private Button backButton;
        [SerializeField] private Button guestButton;
        [SerializeField] private GameObject loadingSpinner;

        [Header("Panels")]
        [SerializeField] private GameObject signInPanel;
        [SerializeField] private GameObject registerPanel;
        [SerializeField] private GameObject forgotPasswordPanel;
        [SerializeField] private GameObject resetPasswordPanel;
        [SerializeField] private GameObject signedInPanel;

        private bool _isPasswordVisible;
        private bool _isRegPasswordVisible;
        private bool _isResetPasswordVisible;
        private bool _buttonsHooked;

        public event Action<bool, string> OnSignInResult;
        public event Action OnBackToMenu;

        private void Awake()
        {
            SetVisible(false);
            LoadRememberedEmail();
        }

        private void Start()
        {
            if (!_buttonsHooked)
            {
                HookButtons();
                _buttonsHooked = true;
            }

            if (AuthService.Instance != null && AuthService.Instance.IsSignedIn)
            {
                ShowSignedIn();
            }
        }

        private void Update()
        {
            // Rotate loading spinner if active
            if (loadingSpinner != null && loadingSpinner.activeInHierarchy)
            {
                loadingSpinner.transform.Rotate(0f, 0f, -220f * Time.unscaledDeltaTime);
            }

            // Keyboard navigation (Enter to submit active view, Escape to exit/back)
            if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter))
            {
                SubmitActivePanel();
            }
            else if (Input.GetKeyDown(KeyCode.Escape))
            {
                HandleEscapeNavigation();
            }
        }

        private void OnDestroy()
        {
            UnhookButtons();
        }

        private void HookButtons()
        {
            if (signInButton != null) signInButton.onClick.AddListener(OnSignInClicked);
            if (backButton != null) backButton.onClick.AddListener(OnBackClicked);
            if (guestButton != null) guestButton.onClick.AddListener(OnGuestClicked);
            if (switchToRegisterButton != null) switchToRegisterButton.onClick.AddListener(ShowRegister);
            if (switchToSignInButton != null) switchToSignInButton.onClick.AddListener(ShowSignIn);
            if (registerButton != null) registerButton.onClick.AddListener(OnRegisterClicked);
            if (signOutButton != null) signOutButton.onClick.AddListener(OnSignOutClicked);
            if (continueButton != null) continueButton.onClick.AddListener(OnGuestClicked);

            if (togglePasswordVisibilityButton != null)
                togglePasswordVisibilityButton.onClick.AddListener(TogglePasswordVisibility);
            if (toggleRegPasswordVisibilityButton != null)
                toggleRegPasswordVisibilityButton.onClick.AddListener(ToggleRegPasswordVisibility);
            if (toggleResetPasswordVisibilityButton != null)
                toggleResetPasswordVisibilityButton.onClick.AddListener(ToggleResetPasswordVisibility);

            if (forgotPasswordButton != null)
                forgotPasswordButton.onClick.AddListener(ShowForgotPassword);
            if (sendRecoveryButton != null)
                sendRecoveryButton.onClick.AddListener(OnSendRecoveryClicked);
            if (forgotBackToSignInButton != null)
                forgotBackToSignInButton.onClick.AddListener(ShowSignIn);
            if (forgotHaveTokenButton != null)
                forgotHaveTokenButton.onClick.AddListener(ShowResetPassword);

            if (resetPasswordButton != null)
                resetPasswordButton.onClick.AddListener(OnResetPasswordClicked);
            if (resetBackToSignInButton != null)
                resetBackToSignInButton.onClick.AddListener(ShowSignIn);

            // Hook password field typing for live strength evaluation
            if (registerPasswordField != null)
            {
                registerPasswordField.onValueChanged.AddListener(OnRegisterPasswordChanged);
            }
        }

        private void UnhookButtons()
        {
            if (signInButton != null) signInButton.onClick.RemoveListener(OnSignInClicked);
            if (backButton != null) backButton.onClick.RemoveListener(OnBackClicked);
            if (guestButton != null) guestButton.onClick.RemoveListener(OnGuestClicked);
            if (switchToRegisterButton != null) switchToRegisterButton.onClick.RemoveListener(ShowRegister);
            if (switchToSignInButton != null) switchToSignInButton.onClick.RemoveListener(ShowSignIn);
            if (registerButton != null) registerButton.onClick.RemoveListener(OnRegisterClicked);
            if (signOutButton != null) signOutButton.onClick.RemoveListener(OnSignOutClicked);
            if (continueButton != null) continueButton.onClick.RemoveListener(OnGuestClicked);

            if (togglePasswordVisibilityButton != null)
                togglePasswordVisibilityButton.onClick.RemoveListener(TogglePasswordVisibility);
            if (toggleRegPasswordVisibilityButton != null)
                toggleRegPasswordVisibilityButton.onClick.RemoveListener(ToggleRegPasswordVisibility);
            if (toggleResetPasswordVisibilityButton != null)
                toggleResetPasswordVisibilityButton.onClick.RemoveListener(ToggleResetPasswordVisibility);

            if (forgotPasswordButton != null)
                forgotPasswordButton.onClick.RemoveListener(ShowForgotPassword);
            if (sendRecoveryButton != null)
                sendRecoveryButton.onClick.RemoveListener(OnSendRecoveryClicked);
            if (forgotBackToSignInButton != null)
                forgotBackToSignInButton.onClick.RemoveListener(ShowSignIn);
            if (forgotHaveTokenButton != null)
                forgotHaveTokenButton.onClick.RemoveListener(ShowResetPassword);

            if (resetPasswordButton != null)
                resetPasswordButton.onClick.RemoveListener(OnResetPasswordClicked);
            if (resetBackToSignInButton != null)
                resetBackToSignInButton.onClick.RemoveListener(ShowSignIn);

            if (registerPasswordField != null)
            {
                registerPasswordField.onValueChanged.RemoveListener(OnRegisterPasswordChanged);
            }
        }

        public void SetVisible(bool visible)
        {
            gameObject.SetActive(visible);
            if (visible)
            {
                ApplyLocalizedLabels();
                if (AuthService.Instance != null && AuthService.Instance.IsSignedIn)
                {
                    ShowSignedIn();
                }
                else
                {
                    ShowSignIn();
                }
            }
        }

        public void ShowSignIn()
        {
            SetPanelActive(signInPanel, true);
            SetPanelActive(registerPanel, false);
            SetPanelActive(forgotPasswordPanel, false);
            SetPanelActive(resetPasswordPanel, false);
            SetPanelActive(signedInPanel, false);
            SetLoading(false);
            ClearStatusTexts();
            LoadRememberedEmail();
            UpdatePasswordVisibilityVisuals();
        }

        public void ShowRegister()
        {
            SetPanelActive(signInPanel, false);
            SetPanelActive(registerPanel, true);
            SetPanelActive(forgotPasswordPanel, false);
            SetPanelActive(resetPasswordPanel, false);
            SetPanelActive(signedInPanel, false);
            SetLoading(false);
            ClearStatusTexts();
            OnRegisterPasswordChanged(registerPasswordField != null ? registerPasswordField.text : "");
            UpdatePasswordVisibilityVisuals();
        }

        public void ShowForgotPassword()
        {
            SetPanelActive(signInPanel, false);
            SetPanelActive(registerPanel, false);
            SetPanelActive(forgotPasswordPanel, true);
            SetPanelActive(resetPasswordPanel, false);
            SetPanelActive(signedInPanel, false);
            SetLoading(false);
            ClearStatusTexts();
            // Pre-fill email from sign in if available
            if (forgotEmailField != null && emailField != null && !string.IsNullOrWhiteSpace(emailField.text))
            {
                forgotEmailField.text = emailField.text.Trim();
            }
        }

        public void ShowResetPassword()
        {
            SetPanelActive(signInPanel, false);
            SetPanelActive(registerPanel, false);
            SetPanelActive(forgotPasswordPanel, false);
            SetPanelActive(resetPasswordPanel, true);
            SetPanelActive(signedInPanel, false);
            SetLoading(false);
            ClearStatusTexts();
            UpdatePasswordVisibilityVisuals();
        }

        public void ShowSignedIn()
        {
            SetPanelActive(signInPanel, false);
            SetPanelActive(registerPanel, false);
            SetPanelActive(forgotPasswordPanel, false);
            SetPanelActive(resetPasswordPanel, false);
            SetPanelActive(signedInPanel, true);
            SetLoading(false);

            if (AuthService.Instance?.CurrentUser != null)
            {
                var user = AuthService.Instance.CurrentUser;
                string name = !string.IsNullOrEmpty(user.displayName) ? user.displayName : user.email;
                LocalizationManager mgr = LocalizationManager.Instance;
                string prefix = mgr != null ? mgr.GetForDisplay("login.signed_in_as") : "Signed in as";
                if (signedInLabel != null)
                {
                    signedInLabel.text = $"{prefix}: {name}";
                }
                if (accountStatusLabel != null)
                {
                    string status = mgr != null ? mgr.GetForDisplay("login.cloud_sync_active") : "Cloud save & expedition sync active";
                    accountStatusLabel.text = $"• {status}";
                }
            }
        }

        private static void SetPanelActive(GameObject panel, bool active)
        {
            if (panel != null) panel.SetActive(active);
        }

        private void SetLoading(bool loading)
        {
            if (loadingSpinner != null)
            {
                loadingSpinner.SetActive(loading);
            }

            if (signInButton != null) signInButton.interactable = !loading;
            if (registerButton != null) registerButton.interactable = !loading;
            if (sendRecoveryButton != null) sendRecoveryButton.interactable = !loading;
            if (resetPasswordButton != null) resetPasswordButton.interactable = !loading;
        }

        private void ClearStatusTexts()
        {
            if (signInStatusText != null) signInStatusText.text = "";
            if (registerStatusText != null) registerStatusText.text = "";
            if (forgotStatusText != null) forgotStatusText.text = "";
            if (resetStatusText != null) resetStatusText.text = "";
        }

        private void ClearFields()
        {
            if (passwordField != null) passwordField.text = "";
            if (registerEmailField != null) registerEmailField.text = "";
            if (registerNameField != null) registerNameField.text = "";
            if (registerPasswordField != null) registerPasswordField.text = "";
            if (registerConfirmPasswordField != null) registerConfirmPasswordField.text = "";
            if (resetTokenField != null) resetTokenField.text = "";
            if (resetPasswordField != null) resetPasswordField.text = "";
            if (resetConfirmPasswordField != null) resetConfirmPasswordField.text = "";
            ClearStatusTexts();
        }

        // --- Remember Email Logic (Secure - No Passwords Stored) ---

        private void LoadRememberedEmail()
        {
            bool remember = PlayerPrefs.GetInt(RememberEmailEnabledKey, 0) == 1;
            if (rememberEmailToggle != null)
            {
                rememberEmailToggle.isOn = remember;
            }

            if (remember && PlayerPrefs.HasKey(RememberEmailKey))
            {
                string savedEmail = PlayerPrefs.GetString(RememberEmailKey, "");
                if (emailField != null && !string.IsNullOrEmpty(savedEmail))
                {
                    emailField.text = savedEmail;
                }
            }
        }

        private void SaveRememberedEmail(string email, bool remember)
        {
            if (remember)
            {
                PlayerPrefs.SetInt(RememberEmailEnabledKey, 1);
                PlayerPrefs.SetString(RememberEmailKey, email);
                PlayerPrefs.Save();
            }
            else
            {
                PlayerPrefs.SetInt(RememberEmailEnabledKey, 0);
                PlayerPrefs.DeleteKey(RememberEmailKey);
                PlayerPrefs.Save();
            }
        }

        // --- Password Visibility Toggles ---

        public void TogglePasswordVisibility()
        {
            _isPasswordVisible = !_isPasswordVisible;
            if (passwordField != null)
            {
                passwordField.contentType = _isPasswordVisible
                    ? InputField.ContentType.Standard
                    : InputField.ContentType.Password;
                passwordField.ForceLabelUpdate();
            }
            UpdatePasswordVisibilityVisuals();
        }

        public void ToggleRegPasswordVisibility()
        {
            _isRegPasswordVisible = !_isRegPasswordVisible;
            if (registerPasswordField != null)
            {
                registerPasswordField.contentType = _isRegPasswordVisible
                    ? InputField.ContentType.Standard
                    : InputField.ContentType.Password;
                registerPasswordField.ForceLabelUpdate();
            }
            if (registerConfirmPasswordField != null)
            {
                registerConfirmPasswordField.contentType = _isRegPasswordVisible
                    ? InputField.ContentType.Standard
                    : InputField.ContentType.Password;
                registerConfirmPasswordField.ForceLabelUpdate();
            }
            UpdatePasswordVisibilityVisuals();
        }

        public void ToggleResetPasswordVisibility()
        {
            _isResetPasswordVisible = !_isResetPasswordVisible;
            if (resetPasswordField != null)
            {
                resetPasswordField.contentType = _isResetPasswordVisible
                    ? InputField.ContentType.Standard
                    : InputField.ContentType.Password;
                resetPasswordField.ForceLabelUpdate();
            }
            if (resetConfirmPasswordField != null)
            {
                resetConfirmPasswordField.contentType = _isResetPasswordVisible
                    ? InputField.ContentType.Standard
                    : InputField.ContentType.Password;
                resetConfirmPasswordField.ForceLabelUpdate();
            }
            UpdatePasswordVisibilityVisuals();
        }

        private void UpdatePasswordVisibilityVisuals()
        {
            string eyeIcon = _isPasswordVisible ? "HIDE" : "SHOW";
            if (passwordEyeText != null) passwordEyeText.text = eyeIcon;

            string regEyeIcon = _isRegPasswordVisible ? "HIDE" : "SHOW";
            if (regPasswordEyeText != null) regPasswordEyeText.text = regEyeIcon;

            string resetEyeIcon = _isResetPasswordVisible ? "HIDE" : "SHOW";
            if (resetPasswordEyeText != null) resetPasswordEyeText.text = resetEyeIcon;
        }

        // --- Password Strength Evaluation ---

        public static PasswordStrength EvaluatePasswordStrength(string password)
        {
            if (string.IsNullOrEmpty(password))
            {
                return PasswordStrength.Empty;
            }

            if (password.Length < 8)
            {
                return PasswordStrength.Weak;
            }

            bool hasUpper = Regex.IsMatch(password, @"[A-Z]");
            bool hasLower = Regex.IsMatch(password, @"[a-z]");
            bool hasDigit = Regex.IsMatch(password, @"[0-9]");
            bool hasSpecial = Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':"",.<>?/\\|`~]");

            if (password.Length >= 10 && hasUpper && hasLower && hasDigit && hasSpecial)
            {
                return PasswordStrength.Strong;
            }

            if (hasUpper && hasLower && hasDigit)
            {
                return PasswordStrength.Medium;
            }

            return PasswordStrength.Weak;
        }

        private void OnRegisterPasswordChanged(string pwd)
        {
            PasswordStrength strength = EvaluatePasswordStrength(pwd);
            LocalizationManager mgr = LocalizationManager.Instance;

            Color barColor;
            string label;
            float fillAmount;

            switch (strength)
            {
                case PasswordStrength.Strong:
                    barColor = new Color(0.18f, 0.85f, 0.45f); // Vibrant Emerald Green
                    label = mgr != null ? mgr.GetForDisplay("login.password_strength_strong") : "Strong Password";
                    fillAmount = 1.0f;
                    break;
                case PasswordStrength.Medium:
                    barColor = new Color(0.95f, 0.75f, 0.2f); // Antique Gold
                    label = mgr != null ? mgr.GetForDisplay("login.password_strength_medium") : "Medium (good, add special char)";
                    fillAmount = 0.65f;
                    break;
                case PasswordStrength.Weak:
                    barColor = new Color(0.92f, 0.28f, 0.25f); // Crimson
                    label = mgr != null ? mgr.GetForDisplay("login.password_strength_weak") : "Weak (min 8 chars, mixed case & numbers)";
                    fillAmount = 0.30f;
                    break;
                default:
                    barColor = new Color(0.3f, 0.35f, 0.4f);
                    label = "";
                    fillAmount = 0.0f;
                    break;
            }

            if (passwordStrengthBar != null)
            {
                passwordStrengthBar.color = barColor;
                // If using filled image or rect transform sizing
                if (passwordStrengthBar.type == Image.Type.Filled)
                {
                    passwordStrengthBar.fillAmount = fillAmount;
                }
            }

            if (passwordStrengthText != null)
            {
                passwordStrengthText.text = label;
                passwordStrengthText.color = barColor;
            }
        }

        // --- Action Handlers ---

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
            bool remember = rememberEmailToggle != null && rememberEmailToggle.isOn;

            if (string.IsNullOrWhiteSpace(email))
            {
                SetStatus(signInStatusText, "Email address is required.", false);
                return;
            }

            if (!IsValidEmail(email))
            {
                SetStatus(signInStatusText, "Please enter a valid email address.", false);
                return;
            }

            if (string.IsNullOrWhiteSpace(password))
            {
                SetStatus(signInStatusText, "Password is required.", false);
                return;
            }

            SetLoading(true);
            SetStatus(signInStatusText, "Signing in...", true);

            AuthService.Instance.SignIn(email, password, remember, (success, message) =>
            {
                SetLoading(false);
                SetStatus(signInStatusText, message, success);

                if (success)
                {
                    SaveRememberedEmail(email, remember);
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
                SetStatus(registerStatusText, "Email address is required.", false);
                return;
            }

            if (!IsValidEmail(email))
            {
                SetStatus(registerStatusText, "Please enter a valid email address.", false);
                return;
            }

            if (string.IsNullOrWhiteSpace(name))
            {
                SetStatus(registerStatusText, "Explorer display name is required.", false);
                return;
            }

            if (string.IsNullOrWhiteSpace(password))
            {
                SetStatus(registerStatusText, "Password is required.", false);
                return;
            }

            if (password.Length < 8)
            {
                SetStatus(registerStatusText, "Password must be at least 8 characters long.", false);
                return;
            }

            if (password != confirm)
            {
                SetStatus(registerStatusText, "Passwords do not match.", false);
                return;
            }

            SetLoading(true);
            SetStatus(registerStatusText, "Creating explorer account...", true);

            AuthService.Instance.Register(email, password, confirm, name, (success, message) =>
            {
                SetLoading(false);
                SetStatus(registerStatusText, message, success);

                if (success)
                {
                    // Switch to sign-in view with email pre-populated
                    ShowSignIn();
                    if (emailField != null) emailField.text = email;
                    SetStatus(signInStatusText, "Account created! You can now sign in.", true);
                }
            });
        }

        private void OnSendRecoveryClicked()
        {
            if (AuthService.Instance == null)
            {
                SetStatus(forgotStatusText, "Authentication service is unavailable.", false);
                return;
            }

            string email = forgotEmailField != null ? forgotEmailField.text.Trim() : "";

            if (string.IsNullOrWhiteSpace(email))
            {
                SetStatus(forgotStatusText, "Email address is required.", false);
                return;
            }

            if (!IsValidEmail(email))
            {
                SetStatus(forgotStatusText, "Please enter a valid email address.", false);
                return;
            }

            SetLoading(true);
            SetStatus(forgotStatusText, "Dispatching recovery instructions...", true);

            AuthService.Instance.ForgotPassword(email, (success, message) =>
            {
                SetLoading(false);
                SetStatus(forgotStatusText, message, success);
            });
        }

        private void OnResetPasswordClicked()
        {
            if (AuthService.Instance == null)
            {
                SetStatus(resetStatusText, "Authentication service is unavailable.", false);
                return;
            }

            string token = resetTokenField != null ? resetTokenField.text.Trim() : "";
            string newPassword = resetPasswordField != null ? resetPasswordField.text : "";
            string confirmPassword = resetConfirmPasswordField != null ? resetConfirmPasswordField.text : "";

            if (string.IsNullOrWhiteSpace(token))
            {
                SetStatus(resetStatusText, "Recovery token is required.", false);
                return;
            }

            if (string.IsNullOrWhiteSpace(newPassword))
            {
                SetStatus(resetStatusText, "New password is required.", false);
                return;
            }

            if (newPassword.Length < 8)
            {
                SetStatus(resetStatusText, "Password must be at least 8 characters long.", false);
                return;
            }

            if (newPassword != confirmPassword)
            {
                SetStatus(resetStatusText, "Passwords do not match.", false);
                return;
            }

            SetLoading(true);
            SetStatus(resetStatusText, "Updating password...", true);

            AuthService.Instance.ResetPassword(token, newPassword, confirmPassword, (success, message) =>
            {
                SetLoading(false);
                SetStatus(resetStatusText, message, success);

                if (success)
                {
                    ShowSignIn();
                    SetStatus(signInStatusText, "Password updated successfully. Please sign in.", true);
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

        public void OnGuestClicked()
        {
            Debug.Log("<color=#00D2FF><b>[LoginUI]</b></color> Continuing in Guest / Play Offline mode.");
            SetVisible(false);
            OnBackToMenu?.Invoke();
        }

        private void OnBackClicked()
        {
            ClearFields();
            SetVisible(false);
            OnBackToMenu?.Invoke();
        }

        private void SubmitActivePanel()
        {
            if (signInPanel != null && signInPanel.activeSelf)
            {
                OnSignInClicked();
            }
            else if (registerPanel != null && registerPanel.activeSelf)
            {
                OnRegisterClicked();
            }
            else if (forgotPasswordPanel != null && forgotPasswordPanel.activeSelf)
            {
                OnSendRecoveryClicked();
            }
            else if (resetPasswordPanel != null && resetPasswordPanel.activeSelf)
            {
                OnResetPasswordClicked();
            }
            else if (signedInPanel != null && signedInPanel.activeSelf)
            {
                OnGuestClicked();
            }
        }

        private void HandleEscapeNavigation()
        {
            if (forgotPasswordPanel != null && forgotPasswordPanel.activeSelf)
            {
                ShowSignIn();
            }
            else if (resetPasswordPanel != null && resetPasswordPanel.activeSelf)
            {
                ShowSignIn();
            }
            else if (registerPanel != null && registerPanel.activeSelf)
            {
                ShowSignIn();
            }
            else
            {
                OnBackClicked();
            }
        }

        private static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email)) return false;
            return Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
        }

        private static void SetStatus(Text text, string message, bool success)
        {
            if (text == null) return;
            text.text = message;
            text.color = success ? new Color(0.2f, 0.88f, 0.45f) : new Color(0.95f, 0.3f, 0.28f);
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
            SetButtonText(guestButton, "login.guest_mode");
            SetButtonText(switchToRegisterButton, "login.no_account");
            SetButtonText(switchToSignInButton, "login.have_account");
            SetButtonText(registerButton, "login.create_account");
            SetButtonText(signOutButton, "login.sign_out");
            SetButtonText(continueButton, "login.continue_to_game");
            SetButtonText(forgotPasswordButton, "login.forgot_password");
            SetButtonText(sendRecoveryButton, "login.send_recovery");
            SetButtonText(forgotBackToSignInButton, "login.back_to_sign_in");
            SetButtonText(forgotHaveTokenButton, "login.have_token");
            SetButtonText(resetPasswordButton, "login.reset_submit");
            SetButtonText(resetBackToSignInButton, "login.back_to_sign_in");

            SetPlaceholder(emailField, "login.email_placeholder");
            SetPlaceholder(passwordField, "login.password_placeholder");
            SetPlaceholder(registerEmailField, "login.email_placeholder");
            SetPlaceholder(registerNameField, "login.name_placeholder");
            SetPlaceholder(registerPasswordField, "login.password_placeholder");
            SetPlaceholder(registerConfirmPasswordField, "login.confirm_password_placeholder");
            SetPlaceholder(forgotEmailField, "login.email_placeholder");
            SetPlaceholder(resetTokenField, "login.recovery_token_placeholder");
            SetPlaceholder(resetPasswordField, "login.password_placeholder");
            SetPlaceholder(resetConfirmPasswordField, "login.confirm_password_placeholder");

            if (forgotInstructionsText != null)
            {
                forgotInstructionsText.text = mgr.GetForDisplay("login.forgot_desc");
            }
            if (resetInstructionsText != null)
            {
                resetInstructionsText.text = mgr.GetForDisplay("login.reset_desc");
            }
            if (registerRequirementsText != null)
            {
                registerRequirementsText.text = mgr.GetForDisplay("login.password_requirements");
            }

            if (rememberEmailToggle != null)
            {
                Text toggleLabel = rememberEmailToggle.GetComponentInChildren<Text>(true);
                if (toggleLabel != null)
                {
                    LocalizedFontProvider.Apply(toggleLabel);
                    toggleLabel.text = mgr.GetForDisplay("login.remember_email");
                }
            }

            UpdatePasswordVisibilityVisuals();
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
            if (placeholder is Text textComp)
            {
                LocalizedFontProvider.Apply(textComp);
                textComp.text = mgr != null ? mgr.GetForDisplay(key) : key;
            }
        }
    }
}
