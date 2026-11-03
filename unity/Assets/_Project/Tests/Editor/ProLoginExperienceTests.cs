#if UNITY_EDITOR
using NUnit.Framework;
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
    }
}
#endif
