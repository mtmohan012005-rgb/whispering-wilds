using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Geography;

namespace WhisperingWilds.Editor.Geography
{
    public static class TamilNaduStateMapWiring
    {
        private const string MapDataAssetPath = "Assets/_Project/Geography/Generated/TamilNaduMapData.asset";
        private const string StateMapScenePath = "Assets/_Project/Scenes/01_StateMap_TamilNadu.unity";
        private const string ViewObjectName = "TamilNaduStateMapView";

        [MenuItem("Whispering Wilds/Geography/Wire State Map Scene", priority = 11)]
        public static void Wire()
        {
            var mapData = AssetDatabase.LoadAssetAtPath<TamilNaduMapData>(MapDataAssetPath);
            if (mapData == null)
            {
                Debug.LogError("[TamilNaduStateMapWiring] Run 'Import Tamil Nadu Map Data' first.");
                return;
            }

            if (EditorSceneManager.GetActiveScene().path != StateMapScenePath)
            {
                Scene opened = EditorSceneManager.OpenScene(StateMapScenePath, OpenSceneMode.Single);
                if (!opened.IsValid() || !opened.isLoaded)
                {
                    Debug.LogError($"[TamilNaduStateMapWiring] Could not open {StateMapScenePath}");
                    return;
                }
            }

            Scene scene = SceneManager.GetActiveScene();
            var existing = GameObject.Find(ViewObjectName);
            var viewGo = existing != null ? existing : new GameObject(ViewObjectName);

            var view = viewGo.GetComponent<TamilNaduStateMapView>();
            if (view == null) view = viewGo.AddComponent<TamilNaduStateMapView>();

            var so = new SerializedObject(view);
            so.FindProperty("mapData").objectReferenceValue = mapData;
            so.ApplyModifiedPropertiesWithoutUndo();

            view.Rebuild();

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);

            Debug.Log($"[TamilNaduStateMapWiring] Wired {ViewObjectName} in {scene.name} " +
                      $"(outline={(mapData.stateOutline != null)}, coast={(mapData.coastline != null)}, " +
                      $"rivers={mapData.rivers.Count}, roads={mapData.roads.Count}, " +
                      $"places={mapData.places.Count}, cells={mapData.regionCells.Count}).");
        }
    }
}