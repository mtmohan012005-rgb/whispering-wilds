#if UNITY_EDITOR
using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Localization;
using WhisperingWilds.Online;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class ProLoginExperienceTests
    {
        private GameObject _hostObj;
        private LoginUI _loginUI;

        [SetUp]
        public void SetUp()
        {
            _hostObj = new GameObject("TestLoginUIHost");
            _loginUI = _hostObj.AddComponent<LoginUI>();
        }

        [TearDown]
        public void TearDown()
        {
            if (_hostObj != null)
            {
                Object.DestroyImmediate(_hostObj);
            }
        }

        [Test]
        public void TestPasswordStrengthEvaluation_WeakMediumStrongEmpty()
        {
            Assert.AreEqual(PasswordStrength.Empty, LoginUI.EvaluatePasswordStrength(null));
            Assert.AreEqual(PasswordStrength.Empty, LoginUI.EvaluatePasswordStrength(""));

            // Weak: under 8 characters
            Assert.AreEqual(PasswordStrength.Weak, LoginUI.EvaluatePasswordStrength("Ab1!"));
            Assert.AreEqual(PasswordStrength.Weak, LoginUI.EvaluatePasswordStrength("short"));
            Assert.AreEqual(PasswordStrength.Weak, LoginUI.EvaluatePasswordStrength("alllowercase1234"));

            // Medium: 8+ chars with uppercase, lowercase, and numbers
            Assert.AreEqual(PasswordStrength.Medium, LoginUI.EvaluatePasswordStrength("AncientTamil2026"));
            Assert.AreEqual(PasswordStrength.Medium, LoginUI.EvaluatePasswordStrength("Whispering123"));

            // Strong: 10+ chars with upper, lower, number, and special character
            Assert.AreEqual(PasswordStrength.Strong, LoginUI.EvaluatePasswordStrength("Temple@Wilds#2026"));
            Assert.AreEqual(PasswordStrength.Strong, LoginUI.EvaluatePasswordStrength("KattuVazhi$Sangam789!"));
        }

        [Test]
        public void TestRememberEmail_PlayerPrefsSecurity_NeverSavesPassword()
        {
            // Verify security rule: password keys must never exist in PlayerPrefs
            Assert.IsFalse(PlayerPrefs.HasKey("WW_PASSWORD"), "Security breach: Password key should never exist in PlayerPrefs.");
            Assert.IsFalse(PlayerPrefs.HasKey("WW_AUTH_TOKEN"), "Security breach: Auth token key should never exist in PlayerPrefs.");
            Assert.IsFalse(PlayerPrefs.HasKey("password"), "Security breach: Generic password key should never exist.");

            // Verify safe email preference keys
            string testEmail = "explorer.sangam@whisperingwilds.com";
            PlayerPrefs.SetInt(LoginUI.RememberEmailEnabledKey, 1);
            PlayerPrefs.SetString(LoginUI.RememberEmailKey, testEmail);
            PlayerPrefs.Save();

            Assert.AreEqual(1, PlayerPrefs.GetInt(LoginUI.RememberEmailEnabledKey));
            Assert.AreEqual(testEmail, PlayerPrefs.GetString(LoginUI.RememberEmailKey));

            // Clean up test preferences
            PlayerPrefs.DeleteKey(LoginUI.RememberEmailKey);
            PlayerPrefs.DeleteKey(LoginUI.RememberEmailEnabledKey);
            PlayerPrefs.Save();
        }

        [Test]
        public void TestLocalization_AllProLoginKeysExistInEnglishAndTamil()
        {
            string[] requiredKeys = new string[]
            {
                "login.title",
                "login.subtitle",
                "login.sign_in",
                "login.sign_out",
                "login.back",
                "login.no_account",
                "login.have_account",
                "login.create_account",
                "login.email_placeholder",
                "login.password_placeholder",
                "login.name_placeholder",
                "login.confirm_password_placeholder",
                "login.signed_in_as",
                "login.show_password",
                "login.hide_password",
                "login.remember_email",
                "login.forgot_password",
                "login.reset_password",
                "login.recovery_token",
                "login.recovery_token_placeholder",
                "login.send_recovery",
                "login.password_strength",
                "login.password_strength_weak",
                "login.password_strength_medium",
                "login.password_strength_strong",
                "login.password_requirements",
                "login.guest_mode",
                "login.account_status",
                "login.cloud_sync_active",
                "login.connecting",
                "login.forgot_desc",
                "login.reset_desc",
                "login.reset_submit",
                "login.back_to_sign_in",
                "login.have_token",
                "login.continue_to_game"
            };

            foreach (string key in requiredKeys)
            {
                bool exists = LocalizationDatabase.TryGetEntry(key, out var entry);
                Assert.IsTrue(exists, $"Missing localization entry for key: '{key}'");
                Assert.IsFalse(string.IsNullOrEmpty(entry.english), $"English translation must not be empty for key: '{key}'");
                Assert.IsFalse(string.IsNullOrEmpty(entry.tamil), $"Tamil translation must not be empty for key: '{key}'");
            }
        }

        [Test]
        public void TestAuthService_RecoveryValidationGuards()
        {
            var authObj = new GameObject("TestAuthService");
            var auth = authObj.AddComponent<AuthService>();

            bool callbackCalled = false;
            bool callbackSuccess = true;
            string callbackMsg = "";

            // Empty email validation in ForgotPassword
            auth.ForgotPassword("", (success, msg) =>
            {
                callbackCalled = true;
                callbackSuccess = success;
                callbackMsg = msg;
            });

            Assert.IsTrue(callbackCalled, "Callback should be invoked on validation failure.");
            Assert.IsFalse(callbackSuccess, "Should fail on empty email.");
            Assert.IsTrue(callbackMsg.Contains("required"), "Should specify email is required.");

            // Empty token validation in ResetPassword
            callbackCalled = false;
            auth.ResetPassword("", "newPassword123", "newPassword123", (success, msg) =>
            {
                callbackCalled = true;
                callbackSuccess = success;
                callbackMsg = msg;
            });

            Assert.IsTrue(callbackCalled, "Callback should be invoked on validation failure.");
            Assert.IsFalse(callbackSuccess, "Should fail on empty token.");
            Assert.IsTrue(callbackMsg.Contains("required"), "Should specify token is required.");

            // Password mismatch validation in ResetPassword
            callbackCalled = false;
            auth.ResetPassword("token123", "passwordA1", "passwordB2", (success, msg) =>
            {
                callbackCalled = true;
                callbackSuccess = success;
                callbackMsg = msg;
            });

            Assert.IsTrue(callbackCalled, "Callback should be invoked on password mismatch.");
            Assert.IsFalse(callbackSuccess, "Should fail on password mismatch.");
            Assert.IsTrue(callbackMsg.Contains("do not match"), "Should specify passwords do not match.");

            Object.DestroyImmediate(authObj);
        }

        [Test]
        public void TestAuthService_NestedResponseMapping()
        {
            var authObj = new GameObject("TestAuthResponseHost");
            var auth = authObj.AddComponent<AuthService>();

            string nestedJson = "{\"success\":true,\"message\":\"Signed in successfully.\",\"data\":{\"user\":{\"id\":\"usr_vaigai_404\",\"email\":\"explorer@whisperingwilds.com\",\"displayName\":\"Sangam Trailblazer\",\"emailVerified\":true}},\"token\":\"ww_session_jwt_9999\"}";

            var result = auth.ParseSignInResponse(nestedJson);
            Assert.IsTrue(result.success, "Result must indicate success.");
            Assert.AreEqual("ww_session_jwt_9999", result.token, "Session token must be populated.");

            var user = result.GetUser();
            Assert.IsNotNull(user, "User must be non-null when data.user is present.");
            Assert.AreEqual("usr_vaigai_404", user.id, "User ID must match.");
            Assert.AreEqual("explorer@whisperingwilds.com", user.email, "User email must match.");
            Assert.AreEqual("Sangam Trailblazer", user.displayName, "Display name must match.");
            Assert.IsTrue(user.emailVerified, "emailVerified must be true.");

            // Also verify profile parser
            string meJson = "{\"success\":true,\"message\":\"Profile retrieved.\",\"data\":{\"user\":{\"id\":\"usr_vaigai_404\",\"email\":\"explorer@whisperingwilds.com\",\"displayName\":\"Sangam Trailblazer\",\"emailVerified\":true}}}";

            var meUser = auth.ParseMeResponse(meJson);
            Assert.IsNotNull(meUser, "ParseMeResponse must extract user.");
            Assert.AreEqual("usr_vaigai_404", meUser.id);
            Assert.AreEqual("Sangam Trailblazer", meUser.displayName);

            // Test manual extraction fallback for malformed/non-JsonUtility payload
            string malformedJson = "{\"success\":true,\"data\":{\"user\":{\"id\":\"manual_1\",\"email\":\"manual@test.com\",\"displayName\":\"Fallback User\",\"emailVerified\":true}}}";
            var fallbackUser = auth.ExtractUserFromResponse(malformedJson);
            Assert.IsNotNull(fallbackUser, "Fallback extractor must succeed.");
            Assert.AreEqual("manual_1", fallbackUser.id);
            Assert.AreEqual("manual@test.com", fallbackUser.email);
            Assert.AreEqual("Fallback User", fallbackUser.displayName);

            Object.DestroyImmediate(authObj);
        }

        [Test]
        public void TestSavedSceneReferences_AllLoginFieldsNonNull()
        {
            string scenePath = "Assets/_Project/Scenes/00_Boot.unity";
            Assert.IsTrue(File.Exists(Path.Combine(Application.dataPath, "_Project/Scenes/00_Boot.unity")), "00_Boot.unity scene must exist.");

            var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Additive);
            try
            {
                LoginUI sceneLoginUI = null;
                foreach (var rootGo in scene.GetRootGameObjects())
                {
                    sceneLoginUI = rootGo.GetComponentInChildren<LoginUI>(true);
                    if (sceneLoginUI != null) break;
                }

                Assert.IsNotNull(sceneLoginUI, "LoginUI must exist in 00_Boot.unity.");
                var so = new SerializedObject(sceneLoginUI);

                string[] requiredSerializedProps = new string[]
                {
                    "emailField", "passwordField", "togglePasswordVisibilityButton", "passwordEyeText",
                    "rememberEmailToggle", "forgotPasswordButton", "signInButton", "signInStatusText",
                    "switchToRegisterButton", "registerEmailField", "registerNameField", "registerPasswordField",
                    "registerConfirmPasswordField", "toggleRegPasswordVisibilityButton", "regPasswordEyeText",
                    "passwordStrengthBar", "passwordStrengthText", "registerRequirementsText", "registerButton",
                    "registerStatusText", "switchToSignInButton", "forgotEmailField", "sendRecoveryButton",
                    "forgotStatusText", "forgotBackToSignInButton", "forgotHaveTokenButton", "forgotInstructionsText",
                    "resetTokenField", "resetPasswordField", "resetConfirmPasswordField",
                    "toggleResetPasswordVisibilityButton", "resetPasswordEyeText", "resetPasswordButton",
                    "resetStatusText", "resetBackToSignInButton", "resetInstructionsText", "signedInLabel",
                    "accountStatusLabel", "signOutButton", "continueButton", "backButton", "guestButton",
                    "loadingSpinner", "signInPanel", "registerPanel", "forgotPasswordPanel",
                    "resetPasswordPanel", "signedInPanel"
                };

                foreach (string propName in requiredSerializedProps)
                {
                    var prop = so.FindProperty(propName);
                    Assert.IsNotNull(prop, $"SerializedProperty '{propName}' should exist on LoginUI.");
                    Assert.IsNotNull(prop.objectReferenceValue, $"Serialized field '{propName}' on LoginUI in 00_Boot.unity must not be null.");
                }
            }
            finally
            {
                EditorSceneManager.CloseScene(scene, true);
            }
        }

        [Test]
        public void TestMissingPanelDetection_ActiveViewIsolation()
        {
            var host = new GameObject("PanelTestHost");
            var ui = host.AddComponent<LoginUI>();
            var so = new SerializedObject(ui);

            var pSignIn = new GameObject("P_SignIn");
            var pRegister = new GameObject("P_Register");
            var pForgot = new GameObject("P_Forgot");
            var pReset = new GameObject("P_Reset");
            var pSignedIn = new GameObject("P_SignedIn");

            pSignIn.transform.SetParent(host.transform);
            pRegister.transform.SetParent(host.transform);
            pForgot.transform.SetParent(host.transform);
            pReset.transform.SetParent(host.transform);
            pSignedIn.transform.SetParent(host.transform);

            so.FindProperty("signInPanel").objectReferenceValue = pSignIn;
            so.FindProperty("registerPanel").objectReferenceValue = pRegister;
            so.FindProperty("forgotPasswordPanel").objectReferenceValue = pForgot;
            so.FindProperty("resetPasswordPanel").objectReferenceValue = pReset;
            so.FindProperty("signedInPanel").objectReferenceValue = pSignedIn;
            so.ApplyModifiedProperties();

            // 1. ShowSignIn
            ui.ShowSignIn();
            Assert.IsTrue(pSignIn.activeSelf, "SignInPanel must be active.");
            Assert.IsFalse(pRegister.activeSelf, "RegisterPanel must be inactive in SignIn view.");
            Assert.IsFalse(pForgot.activeSelf, "ForgotPanel must be inactive in SignIn view.");
            Assert.IsFalse(pReset.activeSelf, "ResetPanel must be inactive in SignIn view.");
            Assert.IsFalse(pSignedIn.activeSelf, "SignedInPanel must be inactive in SignIn view.");

            // 2. ShowRegister
            ui.ShowRegister();
            Assert.IsFalse(pSignIn.activeSelf);
            Assert.IsTrue(pRegister.activeSelf, "RegisterPanel must be active.");
            Assert.IsFalse(pForgot.activeSelf);
            Assert.IsFalse(pReset.activeSelf);
            Assert.IsFalse(pSignedIn.activeSelf);

            // 3. ShowForgotPassword
            ui.ShowForgotPassword();
            Assert.IsFalse(pSignIn.activeSelf);
            Assert.IsFalse(pRegister.activeSelf);
            Assert.IsTrue(pForgot.activeSelf, "ForgotPasswordPanel must be active.");
            Assert.IsFalse(pReset.activeSelf);
            Assert.IsFalse(pSignedIn.activeSelf);

            // 4. ShowResetPassword
            ui.ShowResetPassword();
            Assert.IsFalse(pSignIn.activeSelf);
            Assert.IsFalse(pRegister.activeSelf);
            Assert.IsFalse(pForgot.activeSelf);
            Assert.IsTrue(pReset.activeSelf, "ResetPasswordPanel must be active.");
            Assert.IsFalse(pSignedIn.activeSelf);

            // 5. ShowSignedIn
            ui.ShowSignedIn();
            Assert.IsFalse(pSignIn.activeSelf);
            Assert.IsFalse(pRegister.activeSelf);
            Assert.IsFalse(pForgot.activeSelf);
            Assert.IsFalse(pReset.activeSelf);
            Assert.IsTrue(pSignedIn.activeSelf, "SignedInPanel must be active.");

            Object.DestroyImmediate(host);
        }

        [Test]
        public void TestButtonWiring_AllListenersRegistered()
        {
            var host = new GameObject("WiringHost");
            var ui = host.AddComponent<LoginUI>();
            var so = new SerializedObject(ui);

            var btnRegObj = new GameObject("Btn_SwitchReg", typeof(Button));
            var btnSignObj = new GameObject("Btn_SwitchSign", typeof(Button));
            var btnForgotObj = new GameObject("Btn_Forgot", typeof(Button));
            var pSignIn = new GameObject("P_SignIn");
            var pReg = new GameObject("P_Reg");
            var pForgot = new GameObject("P_Forgot");

            btnRegObj.transform.SetParent(host.transform);
            btnSignObj.transform.SetParent(host.transform);
            btnForgotObj.transform.SetParent(host.transform);
            pSignIn.transform.SetParent(host.transform);
            pReg.transform.SetParent(host.transform);
            pForgot.transform.SetParent(host.transform);

            so.FindProperty("switchToRegisterButton").objectReferenceValue = btnRegObj.GetComponent<Button>();
            so.FindProperty("switchToSignInButton").objectReferenceValue = btnSignObj.GetComponent<Button>();
            so.FindProperty("forgotPasswordButton").objectReferenceValue = btnForgotObj.GetComponent<Button>();
            so.FindProperty("signInPanel").objectReferenceValue = pSignIn;
            so.FindProperty("registerPanel").objectReferenceValue = pReg;
            so.FindProperty("forgotPasswordPanel").objectReferenceValue = pForgot;
            so.ApplyModifiedProperties();

            // Start initializes button hooking via reflection (avoiding EditMode SendMessage native assertions)
            var startMethod = typeof(LoginUI).GetMethod("Start", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            Assert.IsNotNull(startMethod, "LoginUI must declare a Start method.");
            startMethod.Invoke(ui, null);

            // Start in sign in
            ui.ShowSignIn();
            Assert.IsTrue(pSignIn.activeSelf);

            // Trigger switch to register
            btnRegObj.GetComponent<Button>().onClick.Invoke();
            Assert.IsTrue(pReg.activeSelf, "Clicking SwitchToRegister must activate Register panel.");
            Assert.IsFalse(pSignIn.activeSelf);

            // Trigger switch back to sign in
            btnSignObj.GetComponent<Button>().onClick.Invoke();
            Assert.IsTrue(pSignIn.activeSelf, "Clicking SwitchToSignIn must activate SignIn panel.");
            Assert.IsFalse(pReg.activeSelf);

            // Trigger forgot password
            btnForgotObj.GetComponent<Button>().onClick.Invoke();
            Assert.IsTrue(pForgot.activeSelf, "Clicking ForgotPassword must activate ForgotPassword panel.");
            Assert.IsFalse(pSignIn.activeSelf);

            Object.DestroyImmediate(host);
        }

        [Test]
        public void TestGuestMode_TriggersSuccessAndHidesModal()
        {
            var host = new GameObject("GuestHost");
            var ui = host.AddComponent<LoginUI>();
            ui.SetVisible(true);
            Assert.IsTrue(ui.gameObject.activeSelf, "UI should be active initially.");

            bool callbackFired = false;
            bool callbackSuccess = false;
            string callbackMessage = "";
            bool backFired = false;

            ui.OnSignInResult += (success, msg) =>
            {
                callbackFired = true;
                callbackSuccess = success;
                callbackMessage = msg;
            };

            ui.OnBackToMenu += () =>
            {
                backFired = true;
            };

            ui.OnGuestClicked();

            Assert.IsTrue(callbackFired, "OnSignInResult should fire on Guest Mode.");
            Assert.IsTrue(callbackSuccess, "Guest Mode should be a success result.");
            Assert.AreEqual("Guest", callbackMessage, "Guest Mode message should be 'Guest'.");
            Assert.IsTrue(backFired, "OnBackToMenu should be invoked.");
            Assert.IsFalse(ui.gameObject.activeSelf, "Modal should be hidden after Guest Mode is selected.");

            Object.DestroyImmediate(host);
        }

        [Test]
        public void TestAuthService_BaseUrlDynamicResolution()
        {
            var authObj = new GameObject("TestAuthUrl");
            var auth = authObj.AddComponent<AuthService>();

            // Default development base URL in editor
            Assert.IsNotNull(auth.BaseUrl, "BaseUrl must not be null.");

            // Runtime override via SetBaseUrl
            string customEndpoint = "https://custom.wilds.test/api/auth";
            auth.SetBaseUrl(customEndpoint);
            Assert.AreEqual(customEndpoint, auth.BaseUrl, "SetBaseUrl must override BaseUrl.");

            // Production default constant
            Assert.AreEqual("https://thewhisperingwilds.netlify.app", AuthService.ProductionDefaultUrl);

            Object.DestroyImmediate(authObj);
        }
    }
}
#endif
