using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.UI;
using WhisperingWilds.Online;

namespace WhisperingWilds.Editor
{
    public static class CaptureLoginInEngine
    {
        [MenuItem("Whispering Wilds/Capture In-Engine Login Screenshots")]
        public static void CaptureAll()
        {
            Debug.Log("[CaptureLoginInEngine] Opening 00_Boot scene...");
            var scene = EditorSceneManager.OpenScene("Assets/_Project/Scenes/00_Boot.unity", OpenSceneMode.Single);

            var canvas = GameObject.FindObjectOfType<Canvas>();
            var cam = Camera.main ?? GameObject.FindObjectOfType<Camera>();
            var loginUI = GameObject.FindObjectOfType<LoginUI>(true);

            if (canvas == null || cam == null || loginUI == null)
            {
                Debug.LogError($"[CaptureLoginInEngine] Missing dependencies: canvas={canvas}, cam={cam}, loginUI={loginUI}");
                return;
            }

            // Hide MenuRoot so login panel is pristine and isolated
            var menuRoot = GameObject.Find("MenuRoot") ?? canvas.transform.Find("MenuRoot")?.gameObject;
            if (menuRoot != null) menuRoot.SetActive(false);

            // Ensure LoginModal is active
            loginUI.gameObject.SetActive(true);
            if (loginUI.Animator != null)
            {
                loginUI.Animator.InitializeReferences();
                loginUI.Animator.ResetVisualsToVisible();
            }

            // Configure canvas to render with camera into RenderTexture
            var origRenderMode = canvas.renderMode;
            var origCamera = canvas.worldCamera;
            var origPlaneDist = canvas.planeDistance;

            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = cam;
            canvas.planeDistance = 1.0f;

            // Output directories
            string projectRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
            string docsDir = Path.Combine(projectRoot, "docs", "screenshots");
            string brainDir = Environment.GetEnvironmentVariable("BRAIN_DIR") ?? @"C:\Users\mohan\.gemini\antigravity\brain\955190fd-76fd-4764-9675-aac1bc7fe6b9";

            Directory.CreateDirectory(docsDir);
            Directory.CreateDirectory(brainDir);

            var resolutions = new (int width, int height, string label)[]
            {
                (1920, 1080, "1920x1080"),
                (1366, 768, "1366x768")
            };

            // Using serialized object to configure sample fields for pristine screenshots
            var so = new SerializedObject(loginUI);

            // 1. Sign In
            loginUI.ShowSignIn();
            var emailProp = so.FindProperty("emailField");
            if (emailProp?.objectReferenceValue is InputField emailInput)
            {
                emailInput.text = "explorer@whisperingwilds.com";
            }
            var passProp = so.FindProperty("passwordField");
            if (passProp?.objectReferenceValue is InputField passInput)
            {
                passInput.text = "••••••••••••";
            }
            CaptureView("login_01_signin", resolutions, cam, docsDir, brainDir);

            // 2. Create Account / Register
            loginUI.ShowRegister();
            var regNameProp = so.FindProperty("registerNameField");
            if (regNameProp?.objectReferenceValue is InputField regNameInput)
            {
                regNameInput.text = "Arun Kumar";
            }
            var regEmailProp = so.FindProperty("registerEmailField");
            if (regEmailProp?.objectReferenceValue is InputField regEmailInput)
            {
                regEmailInput.text = "arun.kumar@sangam.in";
            }
            var regPassProp = so.FindProperty("registerPasswordField");
            if (regPassProp?.objectReferenceValue is InputField regPassInput)
            {
                regPassInput.text = "KaveriDelta#2026!";
            }
            // Trigger password strength meter
            var strengthTextProp = so.FindProperty("passwordStrengthText");
            if (strengthTextProp?.objectReferenceValue is Text strengthText)
            {
                strengthText.text = "Strong / \u0BB5\u0BB2\u0BBF\u0BAE\u0BC8\u0BAF\u0BBE\u0BA9 \u0B95\u0B9F\u0BB5\u0BC1\u0B9A\u0BCD\u0B9A\u0BCA\u0BB2\u0BCD";
                strengthText.color = new Color(0.2f, 0.85f, 0.4f);
            }
            var strengthBarProp = so.FindProperty("passwordStrengthBar");
            if (strengthBarProp?.objectReferenceValue is Image strengthBar)
            {
                strengthBar.color = new Color(0.2f, 0.85f, 0.4f);
                if (strengthBar.type == Image.Type.Filled) strengthBar.fillAmount = 1f;
            }
            CaptureView("login_02_register", resolutions, cam, docsDir, brainDir);

            // 3. Forgot Password
            loginUI.ShowForgotPassword();
            var forgotEmailProp = so.FindProperty("forgotEmailField");
            if (forgotEmailProp?.objectReferenceValue is InputField forgotEmailInput)
            {
                forgotEmailInput.text = "explorer@whisperingwilds.com";
            }
            var forgotStatusProp = so.FindProperty("forgotStatusText");
            if (forgotStatusProp?.objectReferenceValue is Text forgotStatus)
            {
                forgotStatus.text = "A reset token has been dispatched to your email address.";
                forgotStatus.color = new Color(0.9f, 0.78f, 0.35f);
            }
            CaptureView("login_03_forgot", resolutions, cam, docsDir, brainDir);

            // 4. Signed-In Account View
            loginUI.ShowSignedIn();
            var signedInLabelProp = so.FindProperty("signedInLabel");
            if (signedInLabelProp?.objectReferenceValue is Text signedInLabel)
            {
                signedInLabel.text = "Signed in as: Arun Kumar (arun.kumar@sangam.in)";
            }
            var accountStatusLabelProp = so.FindProperty("accountStatusLabel");
            if (accountStatusLabelProp?.objectReferenceValue is Text accountStatusLabel)
            {
                accountStatusLabel.text = "\u2726 Cloud save active \u2022 Verified Explorer (Cauvery Delta)";
                accountStatusLabel.color = new Color(0.35f, 0.85f, 0.55f);
            }
            CaptureView("login_04_signedin", resolutions, cam, docsDir, brainDir);

            // Restore canvas and menuRoot
            canvas.renderMode = origRenderMode;
            canvas.worldCamera = origCamera;
            canvas.planeDistance = origPlaneDist;
            if (menuRoot != null) menuRoot.SetActive(true);

            Debug.Log("[CaptureLoginInEngine] All 8 in-engine login screenshots captured successfully.");
        }

        private static void CaptureView(string baseName, (int width, int height, string label)[] resolutions, Camera cam, string docsDir, string brainDir)
        {
            Canvas.ForceUpdateCanvases();

            foreach (var (w, h, label) in resolutions)
            {
                var rt = new RenderTexture(w, h, 24, RenderTextureFormat.ARGB32);
                rt.antiAliasing = 4;
                var origRt = cam.targetTexture;
                cam.targetTexture = rt;

                cam.Render();

                RenderTexture.active = rt;
                var tex = new Texture2D(w, h, TextureFormat.RGB24, false);
                tex.ReadPixels(new Rect(0, 0, w, h), 0, 0);
                tex.Apply();

                cam.targetTexture = origRt;
                RenderTexture.active = null;
                UnityEngine.Object.DestroyImmediate(rt);

                byte[] pngBytes = tex.EncodeToPNG();
                UnityEngine.Object.DestroyImmediate(tex);

                string fileName = $"{baseName}_{label}.png";
                string docsPath = Path.Combine(docsDir, fileName);
                string brainPath = Path.Combine(brainDir, fileName);

                File.WriteAllBytes(docsPath, pngBytes);
                File.WriteAllBytes(brainPath, pngBytes);

                Debug.Log($"[CaptureLoginInEngine] Saved {fileName} ({pngBytes.Length:N0} bytes) to {docsPath}");
            }
        }
    }
}
