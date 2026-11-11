using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace WhisperingWilds.Editor
{
    public static class FixSettingsUILayout
    {
        [MenuItem("WhisperingWilds/Fix Settings UI Layout")]
        public static void FixBootSettingsLayout()
        {
            string scenePath = "Assets/_Project/Scenes/00_Boot.unity";
            var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

            GameObject panel = null;
            var ui = Object.FindFirstObjectByType<WhisperingWilds.UI.SettingsMenuUI>(FindObjectsInactive.Include);
            if (ui != null) panel = ui.gameObject;
            if (panel == null) panel = GameObject.Find("SettingsPanel");
            if (panel == null)
            {
                Debug.LogError("[FixSettingsUILayout] SettingsPanel not found.");
                return;
            }

            // Display page rows
            FixStepperRow(panel.transform, "Page_Display/Row_UiScale", "UI Scale");
            FixToggleRow(panel.transform, "Page_Display/Row_Fullscreen", "Fullscreen");
            FixStepperRow(panel.transform, "Page_Display/Row_Resolution", "Resolution");
            FixToggleRow(panel.transform, "Page_Display/Row_VSync", "VSync");
            FixStepperRow(panel.transform, "Page_Display/Row_FrameLimit", "Frame Rate Limit");

            // Audio
            FixStepperRow(panel.transform, "Page_Audio/Row_MasterVol", "Master Volume");
            FixStepperRow(panel.transform, "Page_Audio/Row_MusicVol", "Music Volume");
            FixStepperRow(panel.transform, "Page_Audio/Row_SfxVol", "SFX Volume");
            FixStepperRow(panel.transform, "Page_Audio/Row_AmbienceVol", "Ambience Volume");
            FixStepperRow(panel.transform, "Page_Audio/Row_DialogueVol", "Dialogue Volume");
            FixStepperRow(panel.transform, "Page_Audio/Row_UiVol", "UI Volume");

            // Controls
            FixStepperRow(panel.transform, "Page_Controls/Row_MouseSens", "Mouse Sensitivity");
            FixToggleRow(panel.transform, "Page_Controls/Row_InvertY", "Invert Y");
            FixToggleRow(panel.transform, "Page_Controls/Row_InvertX", "Invert X");
            FixValueOnlyRow(panel.transform, "Page_Controls/Row_CameraSmooth", "Camera Smoothing");
            FixToggleRow(panel.transform, "Page_Controls/Row_SprintMode", "Sprint Mode");
            FixToggleRow(panel.transform, "Page_Controls/Row_CrouchMode", "Crouch Mode");

            // Accessibility
            FixToggleRow(panel.transform, "Page_Accessibility/Row_Subtitles", "Subtitles");
            FixToggleRow(panel.transform, "Page_Accessibility/Row_SubtitleBg", "Subtitle Background");
            FixToggleRow(panel.transform, "Page_Accessibility/Row_SubtitleSize", "Subtitle Size", "Cycle");
            FixToggleRow(panel.transform, "Page_Accessibility/Row_ScreenShake", "Screen Shake");
            FixToggleRow(panel.transform, "Page_Accessibility/Row_MotionBlur", "Motion Blur");
            FixToggleRow(panel.transform, "Page_Accessibility/Row_Colorblind", "Colorblind Mode", "Cycle");

            // Ensure pages/titles are reasonably placed
            NudgeTitle(panel.transform, "Page_Display/Title", 0.84f);
            NudgeTitle(panel.transform, "Page_Audio/Title", 0.84f);
            NudgeTitle(panel.transform, "Page_Controls/Title", 0.84f);
            NudgeTitle(panel.transform, "Page_Accessibility/Title", 0.84f);

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
            Debug.Log("[FixSettingsUILayout] Settings UI layout updated in 00_Boot.");
        }

        private static void NudgeTitle(Transform root, string path, float y)
        {
            var t = root.Find(path) as RectTransform;
            if (t == null) return;
            t.anchorMin = new Vector2(0.5f, y);
            t.anchorMax = new Vector2(0.5f, y);
            t.anchoredPosition = Vector2.zero;
        }

        private static float GetRowY(string path)
        {
            switch (path)
            {
                // Display
                case "Page_Display/Row_UiScale": return 0.66f;
                case "Page_Display/Row_Fullscreen": return 0.58f;
                case "Page_Display/Row_Resolution": return 0.50f;
                case "Page_Display/Row_VSync": return 0.42f;
                case "Page_Display/Row_FrameLimit": return 0.34f;
                // Audio
                case "Page_Audio/Row_MasterVol": return 0.72f;
                case "Page_Audio/Row_MusicVol": return 0.62f;
                case "Page_Audio/Row_SfxVol": return 0.52f;
                case "Page_Audio/Row_AmbienceVol": return 0.42f;
                case "Page_Audio/Row_DialogueVol": return 0.32f;
                case "Page_Audio/Row_UiVol": return 0.22f;
                // Controls
                case "Page_Controls/Row_MouseSens": return 0.72f;
                case "Page_Controls/Row_InvertY": return 0.62f;
                case "Page_Controls/Row_InvertX": return 0.52f;
                case "Page_Controls/Row_CameraSmooth": return 0.42f;
                case "Page_Controls/Row_SprintMode": return 0.32f;
                case "Page_Controls/Row_CrouchMode": return 0.22f;
                // Accessibility
                case "Page_Accessibility/Row_Subtitles": return 0.72f;
                case "Page_Accessibility/Row_SubtitleBg": return 0.62f;
                case "Page_Accessibility/Row_SubtitleSize": return 0.52f;
                case "Page_Accessibility/Row_ScreenShake": return 0.42f;
                case "Page_Accessibility/Row_MotionBlur": return 0.32f;
                case "Page_Accessibility/Row_Colorblind": return 0.22f;
                default: return 0.5f;
            }
        }

        private static RectTransform ConfigureRow(Transform rowT, string path)
        {
            if (rowT == null) return null;
            var rect = rowT as RectTransform;
            float y = GetRowY(path);
            rect.anchorMin = new Vector2(0.06f, y);
            rect.anchorMax = new Vector2(0.94f, y);
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = Vector2.zero;
            rect.sizeDelta = new Vector2(0f, 46f);
            return rect;
        }

        private static void EnsureLabel(Transform row, string text)
        {
            if (row == null) return;
            var labelT = row.Find("Label") as RectTransform;
            if (labelT == null)
            {
                // create a label if missing (fallback font from any existing text in row/page)
                Font font = null;
                var anyText = row.GetComponentInChildren<Text>();
                if (anyText != null) font = anyText.font;
                var go = new GameObject("Label", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
                go.transform.SetParent(row, false);
                go.transform.SetAsFirstSibling();
                labelT = go.GetComponent<RectTransform>();
                var txt = go.GetComponent<Text>();
                txt.font = font != null ? font : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
                txt.fontSize = 20;
                txt.color = new Color(0.85f, 0.88f, 0.92f);
                txt.alignment = TextAnchor.MiddleLeft;
                txt.text = text;
            }
            else
            {
                var t = labelT.GetComponent<Text>();
                if (t != null && (string.IsNullOrEmpty(t.text) || t.text == "Label" || t.text.StartsWith("Row_")))
                    t.text = text;
            }

            labelT.anchorMin = new Vector2(0f, 0f);
            labelT.anchorMax = new Vector2(0.45f, 1f);
            labelT.offsetMin = new Vector2(8f, 2f);
            labelT.offsetMax = new Vector2(-8f, -2f);
            labelT.anchoredPosition = Vector2.zero;
            labelT.sizeDelta = Vector2.zero;
            var lt = labelT.GetComponent<Text>();
            if (lt != null)
            {
                lt.alignment = TextAnchor.MiddleLeft;
                lt.horizontalOverflow = HorizontalWrapMode.Wrap;
                lt.verticalOverflow = VerticalWrapMode.Truncate;
            }
        }

        private static void LayoutValue(RectTransform value)
        {
            if (value == null) return;
            value.anchorMin = new Vector2(0.58f, 0f);
            value.anchorMax = new Vector2(0.82f, 1f);
            value.offsetMin = new Vector2(4f, 2f);
            value.offsetMax = new Vector2(-4f, -2f);
            value.anchoredPosition = Vector2.zero;
            value.sizeDelta = Vector2.zero;
            var txt = value.GetComponent<Text>();
            if (txt != null)
            {
                txt.alignment = TextAnchor.MiddleCenter;
                txt.horizontalOverflow = HorizontalWrapMode.Overflow;
                txt.verticalOverflow = VerticalWrapMode.Truncate;
            }
        }

        private static void LayoutButton(RectTransform btn, bool left, bool action)
        {
            if (btn == null) return;
            btn.pivot = new Vector2(0.5f, 0.5f);
            if (left)
            {
                btn.anchorMin = new Vector2(0.50f, 0.5f);
                btn.anchorMax = new Vector2(0.50f, 0.5f);
                btn.sizeDelta = new Vector2(44f, 36f);
            }
            else if (!action)
            {
                btn.anchorMin = new Vector2(0.90f, 0.5f);
                btn.anchorMax = new Vector2(0.90f, 0.5f);
                btn.sizeDelta = new Vector2(44f, 36f);
            }
            else
            {
                btn.anchorMin = new Vector2(0.90f, 0.5f);
                btn.anchorMax = new Vector2(0.90f, 0.5f);
                btn.sizeDelta = new Vector2(110f, 36f);
            }
            btn.anchoredPosition = Vector2.zero;
            var txt = btn.GetComponentInChildren<Text>();
            if (txt != null)
            {
                txt.alignment = TextAnchor.MiddleCenter;
                txt.resizeTextForBestFit = true;
                txt.resizeTextMinSize = 12;
                txt.resizeTextMaxSize = 18;
            }
        }

        private static Transform FindRow(Transform panel, string path)
        {
            var t = panel.Find(path);
            if (t == null) Debug.LogWarning($"[FixSettingsUILayout] Missing row: {path}");
            return t;
        }

        private static void FixStepperRow(Transform panel, string path, string labelText)
        {
            var row = FindRow(panel, path);
            if (row == null) return;
            ConfigureRow(row, path);
            EnsureLabel(row, labelText);

            var value = row.Find("Value") as RectTransform;
            LayoutValue(value);

            // Identify left/right buttons by child name or label text
            RectTransform left = null, right = null;
            foreach (Transform child in row)
            {
                if (child.name == "Label" || child.name == "Value") continue;
                var btn = child.GetComponent<Button>();
                if (btn == null) continue;
                var txt = child.GetComponentInChildren<Text>();
                string s = txt != null ? txt.text.Trim() : child.name;
                if (s == "<" || child.name.Contains("Left")) left = child as RectTransform;
                else if (s == ">" || child.name.Contains("Right")) right = child as RectTransform;
            }
            // Fallback: if not identified (e.g. duplicate names "Toggle"), assign by order
            if (left == null || right == null)
            {
                var buttons = new System.Collections.Generic.List<RectTransform>();
                foreach (Transform child in row)
                {
                    if (child.GetComponent<Button>() != null) buttons.Add(child as RectTransform);
                }
                if (buttons.Count >= 2)
                {
                    if (left == null) left = buttons[0];
                    if (right == null) right = buttons[1];
                }
            }
            if (left != null) { left.name = "Btn_Left"; LayoutButton(left, true, false); }
            if (right != null) { right.name = "Btn_Right"; LayoutButton(right, false, false); }
        }

        private static void FixToggleRow(Transform panel, string path, string labelText, string actionLabel = null)
        {
            var row = FindRow(panel, path);
            if (row == null) return;
            ConfigureRow(row, path);
            EnsureLabel(row, labelText);

            var value = row.Find("Value") as RectTransform;
            LayoutValue(value);

            foreach (Transform child in row)
            {
                if (child.name == "Label" || child.name == "Value") continue;
                if (child.GetComponent<Button>() == null) continue;
                child.name = "Btn_Action";
                LayoutButton(child as RectTransform, false, true);
                if (!string.IsNullOrEmpty(actionLabel))
                {
                    var txt = child.GetComponentInChildren<Text>();
                    if (txt != null) txt.text = actionLabel;
                }
            }
        }

        private static void FixValueOnlyRow(Transform panel, string path, string labelText)
        {
            var row = FindRow(panel, path);
            if (row == null) return;
            ConfigureRow(row, path);
            EnsureLabel(row, labelText);
            var value = row.Find("Value") as RectTransform;
            LayoutValue(value);
        }
    }
}
