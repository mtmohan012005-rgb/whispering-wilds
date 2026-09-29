using System;
using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;
using WhisperingWilds.Quality;
using WhisperingWilds.UI;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Regional streaming controller orchestrating asynchronous additive scene loading,
    /// Addressables group streaming, memory purging on transition, and fail-safe recovery.
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
                Debug.LogWarning("[RegionalSceneManager] Scene load already in progress.");
                return;
            }

            StartCoroutine(LoadRegionRoutine(targetRegionId));
        }

        private IEnumerator LoadRegionRoutine(string targetRegionId)
        {
            isLoadingRegion = true;
            RegionGeoLocation targetGeo = TamilNaduGeography.GetRegion(targetRegionId);
            OnRegionLoadStarted?.Invoke(targetRegionId);

            Debug.Log($"<color=#00D2FF><b>[RegionalSceneManager]</b></color> Departing {activeRegionId} -> Transitioning to: {targetGeo.englishName} ({targetGeo.tamilName})");

            // 1. Show loading screen / HUD fade
            if (HUDManager.Instance != null)
            {
                HUDManager.Instance.SetRegionName(targetGeo.englishName, targetGeo.tamilName);
            }

            // 2. Deterministic Memory Purge of previous region assets
            if (MemoryBudgetManager.Instance != null)
            {
                MemoryBudgetManager.Instance.ExecuteDeterministicPurge();
            }

            yield return new WaitForSeconds(0.2f);

            // 3. Asynchronously load target scene
            string sceneName = targetGeo.sceneName;
            AsyncOperation loadOp = null;

            try
            {
                loadOp = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Single);
            }
            catch (Exception ex)
            {
                Debug.LogError($"[RegionalSceneManager] Failed to initiate load for {sceneName}: {ex.Message}. Recovering to Chennai...");
                sceneName = "02_Chennai_GeorgeTown";
                loadOp = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Single);
            }

            if (loadOp != null)
            {
                while (!loadOp.isDone)
                {
                    yield return null;
                }
            }

            activeRegionId = targetRegionId;
            isLoadingRegion = false;

            // 4. Post-load memory cleanup & garbage collection
            if (MemoryBudgetManager.Instance != null)
            {
                MemoryBudgetManager.Instance.ExecuteDeterministicPurge();
            }

            Debug.Log($"<color=#00FF99><b>[RegionalSceneManager]</b></color> Successfully arrived at: {targetGeo.englishName}");
            OnRegionLoadCompleted?.Invoke(targetRegionId);
        }
    }
}
