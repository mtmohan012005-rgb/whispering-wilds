using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using WhisperingWilds.Campaign;
using WhisperingWilds.Gameplay;
using WhisperingWilds.World;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Utility ensuring that every regional scene has a GameplayRegionBootstrap component
    /// with the correct region ID assigned, and repairs missing component references.
    /// </summary>
    public static class FixGameplayRegionBootstraps
    {
        private static readonly (string scenePath, string regionId)[] Targets =
        {
            ("Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity", "pichavaram"),
            ("Assets/_Project/Scenes/04_Thanjavur_Delta.unity", "delta"),
            ("Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity", "nilgiris")
        };

        [MenuItem("Tools/Whispering Wilds/Ensure Region Bootstraps In All Scenes")]
        public static void EnsureAllRegionBootstraps()
        {
            foreach (var (scenePath, regionId) in Targets)
            {
                var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                var existing = Object.FindAnyObjectByType<GameplayRegionBootstrap>();
                if (existing == null)
                {
                    var managers = GameObject.Find("--- MANAGERS ---");
                    GameObject host = managers != null ? managers : new GameObject("--- REGION BOOTSTRAP ---");

                    var bootstrap = host.AddComponent<GameplayRegionBootstrap>();
                    var so = new SerializedObject(bootstrap);
                    var prop = so.FindProperty("regionId");
                    if (prop != null)
                    {
                        prop.stringValue = regionId;
                        so.ApplyModifiedPropertiesWithoutUndo();
                    }
                    EditorSceneManager.MarkSceneDirty(scene);
                    EditorSceneManager.SaveScene(scene);
                    Debug.Log($"<color=#00FFAA>[FixBootstrap]</color> Attached GameplayRegionBootstrap ({regionId}) in {scenePath}");
                }
            }

            FixChettinadMansionDials();
        }

        public static void FixChettinadMansionDials()
        {
            string scenePath = "Assets/_Project/Scenes/05_Chettinad_Mansion.unity";
            var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
            var controller = Object.FindAnyObjectByType<MansionPuzzleController>();
            if (controller == null) return;

            var dialComponents = new List<MansionDial>();
            for (int i = 0; i < 3; i++)
            {
                var dialGo = GameObject.Find($"Medallion_Dial_{i + 1:00}");
                if (dialGo != null)
                {
                    GameObjectUtility.RemoveMonoBehavioursWithMissingScript(dialGo);
                    var dial = dialGo.GetComponent<MansionDial>();
                    if (dial == null) dial = dialGo.AddComponent<MansionDial>();

                    var dialSo = new SerializedObject(dial);
                    dialSo.FindProperty("controller").objectReferenceValue = controller;
                    dialSo.FindProperty("dialIndex").intValue = i;
                    dialSo.FindProperty("value").intValue = ChettinadMansionContent.DialMinValue;
                    dialSo.ApplyModifiedPropertiesWithoutUndo();

                    dialComponents.Add(dial);
                }
            }

            var controllerSo = new SerializedObject(controller);
            var dialsProp = controllerSo.FindProperty("dials");
            if (dialsProp != null)
            {
                dialsProp.arraySize = dialComponents.Count;
                for (int i = 0; i < dialComponents.Count; i++)
                {
                    dialsProp.GetArrayElementAtIndex(i).objectReferenceValue = dialComponents[i];
                }
                controllerSo.ApplyModifiedPropertiesWithoutUndo();
            }

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
            Debug.Log("<color=#00FFAA>[FixBootstrap]</color> Restored MansionDial components in Chettinad Mansion!");
        }
    }
}
