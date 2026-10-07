// ==========================================================================
// THE WHISPERING WILDS - HEADLESS BENCHMARK DRIVER (EDITOR BATCH)
// ==========================================================================
// Batch-mode entry point that sequentially enters each WW_Benchmark_* scene,
// activates the in-memory BenchmarkSessionFlag, waits for the authored
// PerformanceBenchmarkManager run to finish, then aggregates every scene's
// BenchmarkResult into Application.persistentDataPath/benchmark_report.json.
//
// Usage:
//   Unity.exe -batchmode -projectPath <proj> -executeMethod
//     WhisperingWilds.Editor.QA.RunHeadlessBenchmark.RunFromCommandLine
//     -benchmarkScene Assets/_Project/Scenes/WW_Benchmark_Chennai.unity
//     -benchmarkScene Assets/_Project/Scenes/WW_Benchmark_Pichavaram.unity
//     -logFile <path>
// ==========================================================================

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using WhisperingWilds.Profiling;

namespace WhisperingWilds.Editor.QA
{
    public static class RunHeadlessBenchmark
    {
        private const double SceneTimeoutSeconds = 240.0;
        private const double ExitGraceSeconds = 20.0;
        private const string LogTag = "[HeadlessBenchmark]";

        private static readonly string[] DefaultScenes =
        {
            "Assets/_Project/Scenes/WW_Benchmark_Chennai.unity",
            "Assets/_Project/Scenes/WW_Benchmark_Pichavaram.unity"
        };

        [Serializable]
        private sealed class ReportEnvelope
        {
            public string generator = "whispering-wilds-headless-benchmark";
            public string editorVersion = Application.unityVersion;
            public string platform = Application.platform.ToString();
            public string timestamp = DateTime.UtcNow.ToString("o");
            public List<BenchmarkResult> scenes;
        }

        private enum Phase { Loading, Benchmarking, ExitingPlayMode, Done }

        private static readonly Queue<string> PendingScenes = new Queue<string>();
        private static readonly List<BenchmarkResult> Completed = new List<BenchmarkResult>();
        private static readonly List<string> Failures = new List<string>();

        private static Phase _phase = Phase.Loading;
        private static double _phaseStarted;
        private static string _currentSceneName = "none";
        private static string _reportPath;
        private static bool _finalized;
        private static bool _managerSubscribed;
        private static bool _receivedResult;
        private static double _runDeadline;

        public static void RunFromCommandLine()
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++)
            {
                if (string.Equals(args[i], "-benchmarkScene", StringComparison.OrdinalIgnoreCase))
                {
                    PendingScenes.Enqueue(args[i + 1]);
                }
                else if (string.Equals(args[i], "-benchmarkOut", StringComparison.OrdinalIgnoreCase))
                {
                    _reportPath = args[i + 1];
                }
            }

            if (PendingScenes.Count == 0)
            {
                foreach (string scene in DefaultScenes) PendingScenes.Enqueue(scene);
            }

            if (string.IsNullOrEmpty(_reportPath))
            {
                _reportPath = Path.Combine(Application.persistentDataPath, "benchmark_report.json");
            }

            _phase = Phase.Loading;
            _phaseStarted = EditorApplication.timeSinceStartup;
            _runDeadline = _phaseStarted + 840.0;
            EditorApplication.update += Tick;

            string queued = string.Join(", ", PendingScenes.Select(s => Path.GetFileNameWithoutExtension(s)));
            Debug.Log($"{LogTag} Starting headless benchmark run. scenes=[{queued}] report={_reportPath}");
            Debug.Log($"{LogTag} persistentDataPath={Application.persistentDataPath}");
        }

        private static void Tick()
        {
            if (_finalized) return;

            double now = EditorApplication.timeSinceStartup;

            if (_phase != Phase.Done && now - _phaseStarted > SceneTimeoutSeconds + ExitGraceSeconds)
            {
                Failures.Add($"{_currentSceneName} timed out during {_phase}");
                if (EditorApplication.isPlaying) EditorApplication.ExitPlaymode();
                _phase = Phase.Done;
                FinalizeAndExit();
                return;
            }

            if (_phase != Phase.Done && now > _runDeadline)
            {
                Failures.Add("global run deadline exceeded before all scenes completed");
                if (EditorApplication.isPlaying) EditorApplication.ExitPlaymode();
                _phase = Phase.Done;
                FinalizeAndExit();
                return;
            }

            switch (_phase)
            {
                case Phase.Loading when !EditorApplication.isPlaying:
                    if (TryOpenNextScene())
                    {
                        _managerSubscribed = false;
                        _receivedResult = false;
                        BenchmarkSessionFlag.Activate();
                        _phase = Phase.Benchmarking;
                        _phaseStarted = now;
                        EditorApplication.EnterPlaymode();
                        Debug.Log($"{LogTag} Entering play mode for scene '{_currentSceneName}'.");
                    }
                    else
                    {
                        _phase = Phase.Done;
                        FinalizeAndExit();
                    }
                    break;

                case Phase.Benchmarking when EditorApplication.isPlaying:
                    PerformanceBenchmarkManager manager = PerformanceBenchmarkManager.Instance;
                    if (manager != null && !_managerSubscribed)
                    {
                        manager.OnBenchmarkCompleted += OnBenchmarkCompletedHandler;
                        _managerSubscribed = true;
                        Debug.Log($"{LogTag} Subscribed to benchmark completion in scene '{_currentSceneName}'.");
                    }

                    if (_receivedResult)
                    {
                        _phase = Phase.ExitingPlayMode;
                        _phaseStarted = now;
                        EditorApplication.ExitPlaymode();
                    }
                    break;

                case Phase.ExitingPlayMode when !EditorApplication.isPlaying:
                    PerformanceBenchmarkManager exitingManager = PerformanceBenchmarkManager.Instance;
                    if (exitingManager != null && _managerSubscribed)
                    {
                        exitingManager.OnBenchmarkCompleted -= OnBenchmarkCompletedHandler;
                        _managerSubscribed = false;
                    }
                    _phase = Phase.Loading;
                    _phaseStarted = now;
                    Debug.Log($"{LogTag} Exited play mode for '{_currentSceneName}'. {PendingScenes.Count} scene(s) remaining.");
                    break;
            }
        }

        private static void OnBenchmarkCompletedHandler(BenchmarkResult result)
        {
            _receivedResult = true;
            Completed.Add(result);
            Debug.Log($"{LogTag} Scene complete. scene={result.sceneName} avgFPS={result.averageFPS:F1} minFPS={result.minFPS:F1} maxFPS={result.maxFPS:F1} onePercentLow={result.onePercentLowFPS:F1} frames={result.totalFramesSampled} peakMemMB={result.peakAllocatedMemoryMB}");
        }

        private static bool TryOpenNextScene()
        {
            if (PendingScenes.Count == 0) return false;

            string scenePath = PendingScenes.Dequeue();
            _currentSceneName = Path.GetFileNameWithoutExtension(scenePath);
            EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
            Debug.Log($"{LogTag} Opened scene '{_currentSceneName}' ({scenePath}).");
            return true;
        }

        private static void FinalizeAndExit()
        {
            _finalized = true;
            EditorApplication.update -= Tick;
            WriteReport();

            int exitCode = Failures.Count == 0 ? 0 : 1;
            foreach (string failure in Failures)
            {
                Debug.LogError($"{LogTag} FAILURE: {failure}");
            }
            Debug.Log($"{LogTag} Benchmark run finished. scenesRecorded={Completed.Count} failures={Failures.Count} exitCode={exitCode}");
            EditorApplication.Exit(exitCode);
        }

        private static void WriteReport()
        {
            try
            {
                string directory = Path.GetDirectoryName(_reportPath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                ReportEnvelope envelope = new ReportEnvelope
                {
                    scenes = new List<BenchmarkResult>(Completed)
                };

                File.WriteAllText(_reportPath, JsonUtility.ToJson(envelope, true), Encoding.UTF8);
                Debug.Log($"{LogTag} Wrote aggregated benchmark report to {_reportPath} ({Completed.Count} scenes).");
            }
            catch (Exception ex)
            {
                Debug.LogError($"{LogTag} Failed to write report to {_reportPath}: {ex.Message}");
            }
        }
    }
}