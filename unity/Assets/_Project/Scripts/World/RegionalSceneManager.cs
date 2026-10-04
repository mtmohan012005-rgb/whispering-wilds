using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;
using WhisperingWilds.Persistence;
using WhisperingWilds.Quality;
using WhisperingWilds.UI;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Regional streaming controller orchestrating asynchronous additive scene loading,
    /// target preloading, state preservation, validated spawn positioning, and safe reference release.
    /// Never unloads current region before target is safely active; never blindly falls back on invalid region IDs.
    /// </summary>
    [DisallowMultipleComponent]
    public class RegionalSceneManager : MonoBehaviour
    {
        public static RegionalSceneManager Instance { get; private set; }

        [Header("State")]
        [SerializeField] private string activeRegionId = "chennai";
        [SerializeField] private bool isLoadingRegion = false;

        public string ActiveRegionId => activeRegionId;
        public bool IsLoadingRegion => isLoadingRegion;

        public event Action<string> OnRegionLoadStarted;
        public event Action<string> OnRegionLoadCompleted;
        public event Action<string, string> OnRegionLoadFailed;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        /// <summary>
        /// Resolves a Unity scene name (e.g. "05_Chettinad_Mansion") to its canonical
        /// region id (e.g. "chettinad") using the authoritative geography catalogue.
        /// Returns null when the scene is not a known region scene, so callers can fail
        /// explicitly instead of silently defaulting to Chennai.
        /// </summary>
        public static string ResolveRegionIdFromSceneName(string sceneName)
        {
            if (string.IsNullOrEmpty(sceneName)) return null;

            var regions = TamilNaduGeography.AllRegions;
            if (regions == null) return null;

            for (int i = 0; i < regions.Count; i++)
            {
                if (string.Equals(regions[i].sceneName, sceneName, StringComparison.OrdinalIgnoreCase))
                {
                    return regions[i].regionId;
                }
            }

            return null;
        }

        public void TravelToRegion(string targetRegionId)
        {
            if (isLoadingRegion)
            {
                Debug.LogWarning("[RegionalSceneManager] Scene transition already in progress.");
                return;
            }

            if (!TamilNaduGeography.TryGetRegion(targetRegionId, out RegionGeoLocation targetGeo))
            {
                string errorMsg = $"Cannot travel to unknown or invalid region '{targetRegionId}'. Current region '{activeRegionId}' retained.";
                Debug.LogError($"[RegionalSceneManager] {errorMsg}");
                OnRegionLoadFailed?.Invoke(targetRegionId, errorMsg);
                return;
            }

            StartCoroutine(SafeRegionTransitionRoutine(targetGeo));
        }

        private IEnumerator SafeRegionTransitionRoutine(RegionGeoLocation targetGeo)
        {
            isLoadingRegion = true;
            string previousRegionId = activeRegionId;
            OnRegionLoadStarted?.Invoke(targetGeo.regionId);

            Debug.Log($"<color=#00D2FF><b>[RegionalSceneManager]</b></color> Commencing safe transition: {previousRegionId} -> {targetGeo.englishName} ({targetGeo.tamilName})");

            // 1. Show loading screen / HUD fade
            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.SetRegionName(targetGeo.englishName, targetGeo.tamilName);
            }

            // 2. Save important state before transit
            if (WorldPersistenceManager.Instance != null)
            {
                WorldPersistenceManager.Instance.CaptureAndPersistWorldState();
            }
            if (SaveManager.Instance != null)
            {
                SaveManager.Instance.SaveGame(0);
            }

            yield return new WaitForSecondsRealtime(0.1f);

            // 3. Preload target region scene additively
            string targetSceneName = targetGeo.sceneName;
            string currentSceneName = SceneManager.GetActiveScene().name;

            AsyncOperation preloadOp = null;
            try
            {
                preloadOp = SceneManager.LoadSceneAsync(targetSceneName, LoadSceneMode.Additive);
            }
            catch (Exception ex)
            {
                string err = $"Failed to load scene '{targetSceneName}': {ex.Message}";
                Debug.LogError($"[RegionalSceneManager] {err}. Keeping active region {previousRegionId}.");
                isLoadingRegion = false;
                OnRegionLoadFailed?.Invoke(targetGeo.regionId, err);
                yield break;
            }

            if (preloadOp == null)
            {
                string err = $"Could not initiate asynchronous load for scene '{targetSceneName}'.";
                Debug.LogError($"[RegionalSceneManager] {err}. Keeping active region {previousRegionId}.");
                isLoadingRegion = false;
                OnRegionLoadFailed?.Invoke(targetGeo.regionId, err);
                yield break;
            }

            while (!preloadOp.isDone)
            {
                yield return null;
            }

            // 4. Activate target region
            Scene targetScene = SceneManager.GetSceneByName(targetSceneName);
            if (targetScene.IsValid() && targetScene.isLoaded)
            {
                SceneManager.SetActiveScene(targetScene);
            }

            // 5. Move player to validated spawn point
            PositionPlayerAtRegionSpawn(targetScene);

            // 6. Verify and rebind camera / managers
            if (GraphicsPerformanceManager.Instance != null)
            {
                GraphicsPerformanceManager.Instance.ForceRebindCamera();
            }
            var activePlayer = GameObject.FindWithTag("Player");
            WhisperingWilds.Cameras.CameraController.EnsureActiveCameraBound(activePlayer != null ? activePlayer.transform : null);

            // 7. Safely unload old region
            if (!string.IsNullOrEmpty(currentSceneName) && currentSceneName != targetSceneName && currentSceneName != "00_Boot")
            {
                Scene oldScene = SceneManager.GetSceneByName(currentSceneName);
                if (oldScene.IsValid() && oldScene.isLoaded)
                {
                    AsyncOperation unloadOp = SceneManager.UnloadSceneAsync(oldScene);
                    while (unloadOp != null && !unloadOp.isDone)
                    {
                        yield return null;
                    }
                }
            }

            // 8. Controlled boundary cleanup without forced GC stalls
            if (MemoryManager.Instance != null)
            {
                MemoryManager.Instance.ExecuteControlledBoundaryCleanup(null);
            }

            activeRegionId = targetGeo.regionId;
            isLoadingRegion = false;

            Debug.Log($"<color=#00FF99><b>[RegionalSceneManager]</b></color> Safe transition completed: Arrived at {targetGeo.englishName}");
            OnRegionLoadCompleted?.Invoke(targetGeo.regionId);
        }

        private void PositionPlayerAtRegionSpawn(Scene targetScene)
        {
            var player = GameObject.FindWithTag("Player");
            if (player == null)
            {
                Debug.LogError("[RegionalSceneManager] No object tagged 'Player' found; cannot position player at region spawn. Region is still considered loaded.");
                return;
            }

            // The transition runs while the previous region is still loaded, so a global GameObject.Find
            // would happily return the OLD region's marker and drop the player into the new region at
            // the old region's coordinates. The target scene is therefore searched first and by
            // scene scope; the global lookup is only a last resort.
            Transform marker = FindSpawnMarkerInScene(targetScene) ?? FindSpawnMarkerGlobal();

            Vector3 targetSpawn = player.transform.position;
            bool foundMarker = marker != null;
            if (foundMarker)
            {
                targetSpawn = marker.position;
            }

            var cc = player.GetComponent<CharacterController>();
            if (cc != null) cc.enabled = false;

            if (foundMarker)
            {
                player.transform.position = targetSpawn;
                Debug.Log($"[RegionalSceneManager] Player positioned at validated spawn marker ({targetSpawn}).");
            }
            else
            {
                Debug.LogError(
                    $"[RegionalSceneManager] Region scene '{targetScene.name}' defines no 'SpawnPoint' or 'PlayerSpawn' marker. " +
                    "The player keeps its previous world position, which belongs to the region being unloaded. " +
                    "This is a scene authoring error, not a load failure - add a SpawnPoint to the region scene.");
            }

            if (cc != null) cc.enabled = true;
        }

        /// <summary>Scene-scoped marker search: exact name match at any depth inside the target scene only.</summary>
        private static Transform FindSpawnMarkerInScene(Scene scene)
        {
            if (!scene.IsValid() || !scene.isLoaded) return null;

            foreach (var root in scene.GetRootGameObjects())
            {
                Transform hit = FindMarkerRecursive(root.transform);
                if (hit != null) return hit;
            }
            return null;
        }

        private static Transform FindMarkerRecursive(Transform node)
        {
            if (node.name == "SpawnPoint" || node.name == "PlayerSpawn") return node;
            for (int i = 0; i < node.childCount; i++)
            {
                Transform hit = FindMarkerRecursive(node.GetChild(i));
                if (hit != null) return hit;
            }
            return null;
        }

        private static Transform FindSpawnMarkerGlobal()
        {
            GameObject global = GameObject.Find("SpawnPoint") ?? GameObject.Find("PlayerSpawn");
            return global != null ? global.transform : null;
        }
    }
}
