using System;
using UnityEngine;
using UnityEngine.Profiling;

namespace WhisperingWilds.Quality
{
    [System.Serializable]
    public struct SubsystemMemoryBudgetMB
    {
        public int textures;
        public int meshes;
        public int audio;
        public int terrain;
        public int entities;
        public int addressables;
        public int totalBudget;
    }

    /// <summary>
    /// Explicit memory budget governor for low-end to ultra PC targets.
    /// Manages Mipmap texture streaming, monitors heap/VRAM metrics, and executes
    /// garbage collection and asset unloading during scene streaming transitions.
    /// </summary>
    [DisallowMultipleComponent]
    public class MemoryBudgetManager : MonoBehaviour
    {
        public static MemoryBudgetManager Instance { get; private set; }

        [Header("Budgets (MB)")]
        [SerializeField] private SubsystemMemoryBudgetMB currentBudget;

        [Header("Cleanup Thresholds")]
        [SerializeField] private float memoryWarningThresholdRatio = 0.85f;
        [SerializeField] private float autoCleanupIntervalSeconds = 60.0f;

        public long TotalAllocatedBytes => Profiler.GetTotalAllocatedMemoryLong();
        public long TotalReservedBytes => Profiler.GetTotalReservedMemoryLong();
        public long TotalUnusedReservedBytes => Profiler.GetTotalUnusedReservedMemoryLong();

        private float cleanupTimer = 0f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            ConfigureBudgetsForHardware();
        }

        private void Start()
        {
            ConfigureTextureStreaming();
        }

        private void Update()
        {
            cleanupTimer += Time.unscaledDeltaTime;
            if (cleanupTimer >= autoCleanupIntervalSeconds)
            {
                cleanupTimer = 0f;
                CheckAndCleanMemory();
            }
        }

        public void ConfigureBudgetsForHardware()
        {
            int sysRamMB = SystemInfo.systemMemorySize;

            if (sysRamMB <= 8192) // <= 8GB (Low-End)
            {
                currentBudget = new SubsystemMemoryBudgetMB
                {
                    textures = 512,
                    meshes = 256,
                    audio = 128,
                    terrain = 256,
                    entities = 128,
                    addressables = 256,
                    totalBudget = 1536
                };
            }
            else if (sysRamMB <= 16384) // 8GB - 16GB (Mid-Range)
            {
                currentBudget = new SubsystemMemoryBudgetMB
                {
                    textures = 1024,
                    meshes = 512,
                    audio = 256,
                    terrain = 512,
                    entities = 256,
                    addressables = 512,
                    totalBudget = 3072
                };
            }
            else // > 16GB (High / Ultra)
            {
                currentBudget = new SubsystemMemoryBudgetMB
                {
                    textures = 2048,
                    meshes = 1024,
                    audio = 512,
                    terrain = 1024,
                    entities = 512,
                    addressables = 1024,
                    totalBudget = 6144
                };
            }
        }

        public void ConfigureTextureStreaming()
        {
            QualitySettings.streamingMipmapsActive = true;
            QualitySettings.streamingMipmapsMemoryBudget = currentBudget.textures;
            QualitySettings.streamingMipmapsRenderersPerFrame = 512;
            QualitySettings.streamingMipmapsMaxLevelReduction = 3;
            QualitySettings.streamingMipmapsAddAllCameras = true;

            Debug.Log($"<color=#00D2FF><b>[MemoryBudgetManager]</b></color> Texture streaming configured with {currentBudget.textures}MB texture budget. Total budget: {currentBudget.totalBudget}MB.");
        }

        public void CheckAndCleanMemory()
        {
            long allocatedMB = TotalAllocatedBytes / (1024 * 1024);
            if (allocatedMB > currentBudget.totalBudget * memoryWarningThresholdRatio)
            {
                Debug.LogWarning($"<color=#FF9900><b>[MemoryBudgetManager]</b></color> High memory usage ({allocatedMB} MB / {currentBudget.totalBudget} MB). Initiating resource purge...");
                ExecuteDeterministicPurge();
            }
        }

        public void ExecuteDeterministicPurge()
        {
            Resources.UnloadUnusedAssets();
            GC.Collect();
            Debug.Log("<color=#00FF99><b>[MemoryBudgetManager]</b></color> Memory purge complete: Unused resources freed, GC collected.");
        }
    }
}
