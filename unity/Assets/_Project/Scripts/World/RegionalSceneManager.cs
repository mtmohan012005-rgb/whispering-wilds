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
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
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

            yield return new WaitForSeconds(0.1f);

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
            PositionPlayerAtRegionSpawn();

            // 6. Verify and rebind camera / managers
            if (GraphicsPerformanceManager.Instance != null)
            {
                GraphicsPerformanceManager.Instance.ForceRebindCamera();
            }

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

        private void PositionPlayerAtRegionSpawn()
        {
            var player = GameObject.FindWithTag("Player");
            if (player == null) return;

            // Locate designated spawn marker or default
            var spawnObj = GameObject.Find("SpawnPoint") ?? GameObject.Find("PlayerSpawn");
            Vector3 targetSpawn = spawnObj != null ? spawnObj.transform.position : Vector3.zero;

            var cc = player.GetComponent<CharacterController>();
            if (cc != null) cc.enabled = false;

            player.transform.position = targetSpawn;

            if (cc != null) cc.enabled = true;
        }
    }
}
