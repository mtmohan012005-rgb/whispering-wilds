using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.Profiling;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.Profiling
{
    [Serializable]
    public struct BenchmarkResult
    {
        public string sceneName;
        public string qualityPreset;
        public float durationSeconds;
        public float averageFPS;
        public float minFPS;
        public float maxFPS;
        public float onePercentLowFPS;
        public float averageFrameTimeMS;
        public long peakAllocatedMemoryMB;
        public int totalFramesSampled;
        public string timestamp;
    }

    /// <summary>
    /// Automated performance benchmarking engine measuring frame consistency,
    /// 1% low pacing, and heap allocations across stress regions for QA reports.
    /// </summary>
    [DisallowMultipleComponent]
    public class PerformanceBenchmarkManager : MonoBehaviour
    {
        public static PerformanceBenchmarkManager Instance { get; private set; }

        [Header("Benchmark Parameters")]
        [SerializeField] private float benchmarkDurationSeconds = 15.0f;
        [SerializeField] private bool autoStartOnLoad = false;

        /// <summary>Whether this benchmark manager auto-starts on scene load. Only true in WW_Benchmark_* scenes when set explicitly.</summary>
        public bool AutoStartOnLoad
        {
            get => autoStartOnLoad;
            set => autoStartOnLoad = value;
        }

        public bool IsBenchmarking { get; private set; } = false;
        public BenchmarkResult LastResult { get; private set; }

        public event Action<BenchmarkResult> OnBenchmarkCompleted;

        private List<float> frameTimes = new List<float>(3600);

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

        private void OnEnable()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
        }

        private void OnDisable()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            // Safety guard: if a non-benchmark scene loads while we're benchmarking, abort immediately.
            bool isBenchmarkScene = scene.name.StartsWith("WW_Benchmark_");
            if (IsBenchmarking && !isBenchmarkScene)
            {
                StopAllCoroutines();
                IsBenchmarking = false;
                Debug.LogWarning($"[PerformanceBenchmarkManager] Benchmark aborted - non-benchmark scene loaded: {scene.name}");
            }
        }

        private void Start()
        {
            // autoStartOnLoad is intentionally NOT checked here.
            // Benchmark scenes use BenchmarkSceneBootstrapper with BenchmarkSessionFlag.
            // This prevents accidental benchmark runs during normal gameplay.
            if (autoStartOnLoad)
            {
                Debug.LogWarning("[PerformanceBenchmarkManager] autoStartOnLoad is TRUE - this should only be set in dedicated benchmark sessions, not in production scenes.");
                StartBenchmark();
            }
        }

        public void StartBenchmark()
        {
            if (IsBenchmarking) return;
            StartCoroutine(RunBenchmarkRoutine());
        }

        private IEnumerator RunBenchmarkRoutine()
        {
            IsBenchmarking = true;
            frameTimes.Clear();

            // Warm up 1 second
            yield return new WaitForSecondsRealtime(1.0f);

            float elapsed = 0f;
            long peakMemory = 0;

            while (elapsed < benchmarkDurationSeconds)
            {
                float dt = Time.unscaledDeltaTime;
                frameTimes.Add(dt);
                elapsed += dt;

                long currentMem = Profiler.GetTotalAllocatedMemoryLong() / (1024 * 1024);
                if (currentMem > peakMemory) peakMemory = currentMem;

                yield return null;
            }

            IsBenchmarking = false;

            // Calculate metrics
            float sumDt = 0f;
            float maxDt = float.MinValue;
            float minDt = float.MaxValue;

            for (int i = 0; i < frameTimes.Count; i++)
            {
                float dt = frameTimes[i];
                sumDt += dt;
                if (dt > maxDt) maxDt = dt;
                if (dt < minDt) minDt = dt;
            }

            float avgDt = sumDt / frameTimes.Count;
            float avgFps = 1.0f / avgDt;
            float minFps = 1.0f / maxDt;
            float maxFps = 1.0f / minDt;

            // 1% Low calculation
            List<float> sortedTimes = new List<float>(frameTimes);
            sortedTimes.Sort();
            int onePercentIndex = Mathf.Clamp(Mathf.RoundToInt(sortedTimes.Count * 0.99f), 0, sortedTimes.Count - 1);
            float onePercentLowFps = 1.0f / sortedTimes[onePercentIndex];

            BenchmarkResult result = new BenchmarkResult
            {
                sceneName = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
                qualityPreset = QualitySettings.names[QualitySettings.GetQualityLevel()],
                durationSeconds = benchmarkDurationSeconds,
                averageFPS = avgFps,
                minFPS = minFps,
                maxFPS = maxFps,
                onePercentLowFPS = onePercentLowFps,
                averageFrameTimeMS = avgDt * 1000f,
                peakAllocatedMemoryMB = peakMemory,
                totalFramesSampled = frameTimes.Count,
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC")
            };

            LastResult = result;
            WriteBenchmarkReport(result);
            OnBenchmarkCompleted?.Invoke(result);

            Debug.Log($"<color=#00FF99><b>[Benchmark Complete]</b></color> Scene: {result.sceneName} | Avg FPS: {result.averageFPS:F1} | 1% Low: {result.onePercentLowFPS:F1} | FrameTime: {result.averageFrameTimeMS:F2}ms | Peak RAM: {result.peakAllocatedMemoryMB} MB");
        }

        private void WriteBenchmarkReport(BenchmarkResult result)
        {
            try
            {
                string path = Path.Combine(Application.persistentDataPath, "benchmark_report.json");
                string json = JsonUtility.ToJson(result, true);
                File.WriteAllText(path, json);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[Benchmark] Could not export JSON log: {ex.Message}");
            }
        }
    }
}
