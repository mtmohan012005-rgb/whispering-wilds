using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.UI;
using System.Collections.Generic;

namespace WhisperingWilds.Editor
{
    public static class AddAudioMuteControls
    {
        [MenuItem("WhisperingWilds/Add Audio Mute Controls")]
        public static void Apply()
        {
            var scene = EditorSceneManager.OpenScene("Assets/_Project/Scenes/00_Boot.unity", OpenSceneMode.Single);
            var ui = Object.FindFirstObjectByType<WhisperingWilds.UI.SettingsMenuUI>(FindObjectsInactive.Include);
            if (ui == null) { Debug.LogError("[AddAudioMuteControls] SettingsMenuUI not found"); return; }
            var panel = ui.transform;

            var map = new Dictionary<string, string> {
                {"Page_Audio/Row_MasterVol", "master"},
                {"Page_Audio/Row_MusicVol", "music"},
                {"Page_Audio/Row_SfxVol", "sfx"},
                {"Page_Audio/Row_AmbienceVol", "ambience"}
            };

            SerializedObject so = new SerializedObject(ui);
            foreach (var kv in map)
            {
                var row = panel.Find(kv.Key);
                if (row == null) { Debug.LogWarning("[AddAudioMuteControls] Missing row " + kv.Key); continue; }
                var rt = row as RectTransform;

                // Layout: label 0-0.45, left arrow, value, right arrow, mute button
                var value = row.Find("Value") as RectTransform;
                if (value != null)
                {
                    value.anchorMin = new Vector2(0.50f, 0f);
                    value.anchorMax = new Vector2(0.68f, 1f);
                    value.offsetMin = new Vector2(4f, 2f);
                    value.offsetMax = new Vector2(-4f, -2f);
                    value.anchoredPosition = Vector2.zero; value.sizeDelta = Vector2.zero;
                    var vtxt = value.GetComponent<Text>(); if (vtxt != null) { vtxt.alignment = TextAnchor.MiddleCenter; vtxt.horizontalOverflow = HorizontalWrapMode.Overflow; }
                }

                RectTransform left = null, right = null, mute = null;
                foreach (Transform child in row)
                {
                    if (child.name == "Label" || child.name == "Value") continue;
                    var btn = child.GetComponent<Button>(); if (btn == null) continue;
                    var txt = child.GetComponentInChildren<Text>();
                    string s = txt != null ? txt.text.Trim() : child.name;
                    if (child.name == "Btn_Mute" || s == "Mute" || s == "Unmute") mute = child as RectTransform;
                    else if (s == "<" || child.name.Contains("Left")) left = child as RectTransform;
                    else if (s == ">" || child.name.Contains("Right")) right = child as RectTransform;
                }
                // fallback by order if needed
                if ((left == null || right == null) && mute == null)
                {
                    var btns = new List<RectTransform>();
                    foreach (Transform child in row) if (child.GetComponent<Button>() != null) btns.Add(child as RectTransform);
                    if (btns.Count >= 2) { left = left ?? btns[0]; right = right ?? btns[1]; }
                }
                if (left != null) { left.name = "Btn_Left"; SetBtn(left, 0.43f, 44f); }
                if (right != null) { right.name = "Btn_Right"; SetBtn(right, 0.75f, 44f); }

                if (mute == null)
                {
                    var go = new GameObject("Btn_Mute", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image), typeof(Button));
                    go.transform.SetParent(row, false);
                    mute = go.GetComponent<RectTransform>();
                    var img = go.GetComponent<Image>(); img.color = new Color(0.35f, 0.22f, 0.22f, 1f);
                    var b = go.GetComponent<Button>(); b.targetGraphic = img;
                    var txtGo = new GameObject("Text", typeof(RectTransform), typeof(CanvasRenderer), typeof(Text));
                    txtGo.transform.SetParent(go.transform, false);
                    var tr = txtGo.GetComponent<RectTransform>(); tr.anchorMin = Vector2.zero; tr.anchorMax = Vector2.one; tr.offsetMin = Vector2.zero; tr.offsetMax = Vector2.zero;
                    var t = txtGo.GetComponent<Text>(); t.text = "Mute"; t.alignment = TextAnchor.MiddleCenter; t.color = new Color(0.94f, 0.92f, 0.84f, 1f); t.fontSize = 14;
                    // try copy font
                    var any = row.GetComponentInChildren<Text>(); if (any != null && any.font != null) t.font = any.font;
                }
                else
                {
                    var txt = mute.GetComponentInChildren<Text>(); if (txt != null && (txt.text != "Mute" && txt.text != "Unmute")) txt.text = "Mute";
                }
                mute.name = "Btn_Mute";
                SetBtn(mute, 0.92f, 84f);
                var mt = mute.GetComponentInChildren<Text>(); if (mt != null) { mt.alignment = TextAnchor.MiddleCenter; mt.resizeTextForBestFit = true; mt.resizeTextMinSize = 11; mt.resizeTextMaxSize = 16; }

                string prop = kv.Value == "master" ? "masterMuteButton" : kv.Value == "music" ? "musicMuteButton" : kv.Value == "sfx" ? "sfxMuteButton" : "ambienceMuteButton";
                var p = so.FindProperty(prop);
                if (p != null) p.objectReferenceValue = mute.GetComponent<Button>();
            }
            so.ApplyModifiedPropertiesWithoutUndo();
            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
            Debug.Log("[AddAudioMuteControls] Applied mute controls to 00_Boot settings audio rows.");
        }

        private static void SetBtn(RectTransform btn, float x, float w)
        {
            btn.anchorMin = new Vector2(x, 0.5f);
            btn.anchorMax = new Vector2(x, 0.5f);
            btn.pivot = new Vector2(0.5f, 0.5f);
            btn.anchoredPosition = Vector2.zero;
            btn.sizeDelta = new Vector2(w, 34f);
        }
    }
}
