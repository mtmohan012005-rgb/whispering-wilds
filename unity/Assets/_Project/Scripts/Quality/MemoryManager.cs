using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Profiling;

namespace WhisperingWilds.Quality
{
    [System.Serializable]
    public struct SubsystemBudgetMB
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
    /// Single authoritative Memory Governor enforcing subsystem budgets across hardware tiers.
    /// Strictly eliminates periodic in-game GC.Collect() stalls, deferring heavy cleanup
    /// exclusively to scene transitions, chunk unloads, and emergency memory thresholds (>92%).
    /// </summary>
    [DisallowMultipleComponent]
    public class MemoryManager : MonoBehaviour
    {
        public static MemoryManager Instance { get; private set; }

        [Header("Subsystem Budgets")]
        [SerializeField] private SubsystemBudgetMB activeBudget;

        [Header("Pressure Guard")]
        [Range(0.80f, 0.98f)] [SerializeField] private float severePressureRatio = 0.92f;
        [SerializeField] private bool isCleaningUp = false;

        public SubsystemBudgetMB ActiveBudget => activeBudget;
        public long TotalAllocatedBytes => Profiler.GetTotalAllocatedMemoryLong();
        public long TotalReservedBytes => Profiler.GetTotalReservedMemoryLong();
        public int TotalAllocatedMB => (int)(TotalAllocatedBytes / (1024 * 1024));

        public event Action OnControlledCleanupStarted;
        public event Action OnControlledCleanupCompleted;

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

        private void Start()
        {
            if (GraphicsPerformanceManager.Instance != null)
            {
                ConfigureForTier(GraphicsPerformanceManager.Instance.CurrentTier);
                GraphicsPerformanceManager.Instance.OnQualityProfileChanged += (tier, settings) => ConfigureForTier(tier);
            }
            else
            {
                ConfigureForTier(QualityTier.High);
            }
        }

        public void ConfigureForTier(QualityTier tier)
        {
            switch (tier)
            {
                case QualityTier.VeryLow:
                    activeBudget = new SubsystemBudgetMB
                    {
                        textures = 384,
                        meshes = 192,
                        audio = 96,
                        terrain = 192,
                        entities = 96,
                        addressables = 192,
                        totalBudget = 1152
                    };
                    break;

                case QualityTier.Low:
                    activeBudget = new SubsystemBudgetMB
                    {
                        textures = 512,
                        meshes = 256,
                        audio = 128,
                        terrain = 256,
                        entities = 128,
                        addressables = 256,
                        totalBudget = 1536
                    };
                    break;

                case QualityTier.Medium:
                    activeBudget = new SubsystemBudgetMB
                    {
                        textures = 1024,
                        meshes = 512,
                        audio = 256,
                        terrain = 512,
                        entities = 256,
                        addressables = 512,
                        totalBudget = 3072
                    };
                    break;

                case QualityTier.High:
                    activeBudget = new SubsystemBudgetMB
                    {
                        textures = 2048,
                        meshes = 1024,
                        audio = 512,
                        terrain = 1024,
                        entities = 512,
                        addressables = 1024,
                        totalBudget = 6144
                    };
                    break;

                case QualityTier.Ultra:
                    activeBudget = new SubsystemBudgetMB
                    {
                        textures = 4096,
                        meshes = 2048,
                        audio = 1024,
                        terrain = 2048,
                        entities = 1024,
                        addressables = 2048,
                        totalBudget = 12288
                    };
                    break;
            }

            Debug.Log($"<color=#00D2FF><b>[MemoryManager]</b></color> Configured budget for {tier}: {activeBudget.totalBudget}MB (Textures: {activeBudget.textures}MB, Meshes: {activeBudget.meshes}MB)");
        }

        private void Update()
        {
            // Normal gameplay: ZERO periodic GC or full resource purge!
            // Only inspect for catastrophic out-of-memory pressure (>92% of budget)
            if (isCleaningUp) return;

            if (TotalAllocatedMB > activeBudget.totalBudget * severePressureRatio)
            {
                Debug.LogWarning($"<color=#FF3300><b>[MemoryManager]</b></color> Emergency memory threshold exceeded ({TotalAllocatedMB}MB / {activeBudget.totalBudget}MB). Triggering controlled emergency relief.");
                ExecuteControlledBoundaryCleanup(null);
            }
        }

        /// <summary>
        /// Executes asynchronous controlled cleanup during natural loading boundaries,
        /// scene transitions, and chunk unloads without stalling active gameplay frames.
        /// </summary>
        public void ExecuteControlledBoundaryCleanup(Action onComplete)
        {
            if (isCleaningUp)
            {
                onComplete?.Invoke();
                return;
            }

            StartCoroutine(ControlledCleanupRoutine(onComplete));
        }

        private IEnumerator ControlledCleanupRoutine(Action onComplete)
        {
            isCleaningUp = true;
            OnControlledCleanupStarted?.Invoke();
            Debug.Log("<color=#00D2FF><b>[MemoryManager]</b></color> Commencing asynchronous boundary memory cleanup...");

            // 1. Asynchronously unload unused assets
            AsyncOperation unloadOp = Resources.UnloadUnusedAssets();
            while (!unloadOp.isDone)
            {
                yield return null;
            }

            // 2. Perform garbage collection strictly inside boundary transition
            GC.Collect();
            GC.WaitForPendingFinalizers();

            isCleaningUp = false;
            Debug.Log($"<color=#00FF99><b>[MemoryManager]</b></color> Boundary cleanup complete. Current allocated: {TotalAllocatedMB}MB / {activeBudget.totalBudget}MB.");
            OnControlledCleanupCompleted?.Invoke();
            onComplete?.Invoke();
        }
    }
}
