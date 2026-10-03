using UnityEngine;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.Geography
{
    /// <summary>
    /// Guarantees the state map exists at runtime.
    ///
    /// The production build regenerates 01_StateMap_TamilNadu from code before every build
    /// (BuildPipelineAutomation -> AssembleAllRegions), which overwrites anything hand-placed in
    /// that scene. Rather than fight the scene generator, the state overview is created
    /// programmatically the moment the scene loads, so the shipped build always shows the map.
    ///
    /// Strictly authoring-independent: all data comes from Resources, never the network.
    /// </summary>
    public static class TamilNaduStateMapBootstrap
    {
        private const string SceneName = "01_StateMap_TamilNadu";

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Install()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
            SceneManager.sceneLoaded += OnSceneLoaded;
            TryAttach(SceneManager.GetActiveScene());
        }

        private static void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            TryAttach(scene);
        }

        private static void TryAttach(Scene scene)
        {
            if (!scene.IsValid() || !scene.isLoaded) return;
            if (scene.name != SceneName) return;
            // Single-instance guard: the map must exist once, not once per load event.
            if (Object.FindAnyObjectByType<TamilNaduStateMapView>() != null) return;

            // Generated assets live under Resources/Geography/Generated/, so Resources.Load
            // needs the sub-path, not the bare filename.
            var mapData = Resources.Load<TamilNaduMapData>("Geography/Generated/TamilNaduMapData");
            if (mapData == null)
            {
                Debug.LogError("[TamilNaduStateMap] Resources/Geography/Generated/TamilNaduMapData.asset " +
                               "missing - run 'Whispering Wilds > Geography > Import Tamil Nadu Map Data'.");
                return;
            }

            var go = new GameObject("TamilNaduStateMapView");
            var view = go.AddComponent<TamilNaduStateMapView>();
            view.SetMapData(mapData);

            if (Camera.main != null)
            {
                // Frame the whole state from above rather than relying on scene-authored framing.
                FrameCamera(mapData, Camera.main);
            }

            Debug.Log($"[TamilNaduStateMap] attached (places={mapData.places.Count}, " +
                      $"rivers={mapData.rivers.Count}, roads={mapData.roads.Count}, cells={mapData.regionCells.Count}).");
        }

        /// <summary>Positions the camera to see the full state outline.</summary>
        private static void FrameCamera(TamilNaduMapData mapData, Camera cam)
        {
            var bounds = new Bounds(Vector3.zero, Vector3.zero);
            bool any = false;

            if (mapData.stateOutline != null) { bounds = mapData.stateOutline.bounds; any = true; }
            if (mapData.coastline != null)
            {
                if (!any) { bounds = mapData.coastline.bounds; any = true; }
                else bounds.Encapsulate(mapData.coastline.bounds);
            }

            if (!any) return;

            // Frame the whole state. The old code also offset the camera south by
            // extents.z * 1.15, which pushed the northern half of Tamil Nadu off-screen and
            // wasted most of the frame. Centre on the bounds instead.
            float aspect = cam.aspect > 0.01f ? cam.aspect : 1.78f;
            float halfH = bounds.extents.z * 1.08f;
            float halfW = bounds.extents.x * 1.08f;
            // Fit whichever axis binds, converting the horizontal requirement through the aspect.
            float needed = Mathf.Max(halfH, halfW / aspect);
            float fov = cam.fieldOfView * Mathf.Deg2Rad;
            float height = needed / Mathf.Tan(fov * 0.5f);

            cam.transform.position = bounds.center + new Vector3(0f, height, 0f);
            cam.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            cam.farClipPlane = Mathf.Max(cam.farClipPlane, height * 4f);
            Debug.Log($"[TamilNaduStateMap] camera framed on {bounds.center} at height {height:F1} (aspect {aspect:F2})");
        }
    }
}