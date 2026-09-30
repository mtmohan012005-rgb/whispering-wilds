using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Quality;

namespace WhisperingWilds.Profiling
{
    /// <summary>
    /// Placed in each WW_Benchmark_* scene.
    /// Auto-starts the benchmark ONLY when the scene was explicitly entered
    /// via BenchmarkSessionFlag.IsActive - preventing accidental benchmark
    /// runs during normal play if a scene is loaded directly.
    ///
    /// Usage:
    ///   Before loading a benchmark scene, call BenchmarkSessionFlag.Activate().
    ///   The flag is automatically cleared after this bootstrapper reads it.
    /// </summary>
    [DisallowMultipleComponent]
    public class BenchmarkSceneBootstrapper : MonoBehaviour
    {
        [Header("Benchmark Scene Settings")]
        [Tooltip("Override quality tier only during this benchmark scene. None = use current player setting.")]
        [SerializeField] private QualityTier overrideQualityTier = QualityTier.High;
        [SerializeField] private bool applyQualityOverride = false;

        [Header("Camera Path")]
        [Tooltip("Optional: Assign a fly-through path object to animate during the benchmark run.")]
        [SerializeField] private GameObject benchmarkCameraPath;

        private void Start()
        {
            // Only benchmark if explicitly flagged - safety guard for production gameplay
            if (!BenchmarkSessionFlag.IsActive)
            {
                Debug.Log("[BenchmarkSceneBootstrapper] Scene entered without benchmark flag - benchmark mode SUPPRESSED.");
                return;
            }

            // Consume the flag so re-entering this scene normally won't re-trigger it
            BenchmarkSessionFlag.Deactivate();

            // Apply optional quality override for this benchmark
            if (applyQualityOverride && GraphicsPerformanceManager.Instance != null)
            {
                GraphicsPerformanceManager.Instance.ApplyProfile(overrideQualityTier);
                Debug.Log($"[BenchmarkSceneBootstrapper] Quality override applied: {overrideQualityTier}");
            }

            // Activate camera path if assigned
            if (benchmarkCameraPath != null)
            {
                benchmarkCameraPath.SetActive(true);
            }

            // Start the benchmark
            if (PerformanceBenchmarkManager.Instance != null)
            {
                Debug.Log($"[BenchmarkSceneBootstrapper] Activating benchmark in scene: {SceneManager.GetActiveScene().name}");
                PerformanceBenchmarkManager.Instance.StartBenchmark();
            }
            else
            {
                Debug.LogWarning("[BenchmarkSceneBootstrapper] PerformanceBenchmarkManager not found - benchmark aborted.");
            }
        }
    }

    /// <summary>
    /// Lightweight static flag (non-persistent) to signal that the next
    /// benchmark scene load should activate benchmark mode.
    /// This is NOT a PlayerPrefs or file - it lives only in memory, so it
    /// cannot persist across sessions and cannot accidentally enable benchmarks
    /// in production without an explicit API call.
    /// </summary>
    public static class BenchmarkSessionFlag
    {
        private static bool _isActive = false;

        public static bool IsActive => _isActive;

        /// <summary>Call before loading a WW_Benchmark_* scene to enable auto-benchmark.</summary>
        public static void Activate()
        {
            _isActive = true;
            Debug.Log("[BenchmarkSessionFlag] Benchmark session flag SET - next benchmark scene will auto-run.");
        }

        /// <summary>Called by BenchmarkSceneBootstrapper to consume the flag.</summary>
        public static void Deactivate()
        {
            _isActive = false;
        }
    }
}
