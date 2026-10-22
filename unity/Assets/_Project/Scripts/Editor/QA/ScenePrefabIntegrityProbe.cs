using System.IO;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace WhisperingWilds.Editor.QA
{
    public static class ScenePrefabIntegrityProbe
    {
        public static void Run()
        {
            var sb = new StringBuilder();
            var guids = AssetDatabase.FindAssets("t:Scene", new[] { "Assets/_Project/Scenes" });
            int missing = 0;

            foreach (string guid in guids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                var scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
                int sceneMissing = 0;
                foreach (var root in scene.GetRootGameObjects())
                {
                    foreach (var t in root.GetComponentsInChildren<Transform>(true))
                    {
                        var go = t.gameObject;
                        if (!PrefabUtility.IsPartOfPrefabInstance(go)) continue;
                        if (PrefabUtility.GetPrefabInstanceStatus(go) != PrefabInstanceStatus.MissingAsset) continue;
                        if (!PrefabUtility.IsPartOfPrefabInstance(t)) continue;
                        if (PrefabUtility.GetPrefabInstanceStatus(t) == PrefabInstanceStatus.MissingAsset
                            && PrefabUtility.GetNearestPrefabInstanceRoot(go) == go)
                        {
                            sb.AppendLine($"  MISSING {path}: {go.name}");
                            sceneMissing++;
                        }
                    }
                }

                if (sceneMissing > 0)
                {
                    sb.AppendLine($"{Path.GetFileName(path)}: {sceneMissing} missing prefab instance root(s)");
                    missing += sceneMissing;
                }
            }

            sb.AppendLine($"TOTAL MISSING ROOTS: {missing}");
            Debug.Log("[ScenePrefabIntegrityProbe]\n" + sb);
            File.WriteAllText("C:/Users/mohan/AppData/Local/Temp/opencode/prefab-integrity.txt", sb.ToString());
        }
    }
}
