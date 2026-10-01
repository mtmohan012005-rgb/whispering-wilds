using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;
using WhisperingWilds.Editor;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Authoritative production and QA build automation for The Whispering Wilds.
    /// Strictly separates production retail builds (gameplay scenes only) from QA benchmark builds.
    /// Generates verified build reports conforming to production acceptance criteria.
    /// </summary>
    public static class BuildPipelineAutomation
    {
        public static readonly string[] ProductionGameplayScenes = new string[]
        {
            "Assets/_Project/Scenes/00_Boot.unity",
            "Assets/_Project/Scenes/01_StateMap_TamilNadu.unity",
            "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity",
            "Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity",
            "Assets/_Project/Scenes/04_Thanjavur_Delta.unity",
            "Assets/_Project/Scenes/05_Chettinad_Mansion.unity",
            "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity",
            "Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity"
        };

        public static readonly string[] BenchmarkScenes = new string[]
        {
            "Assets/_Project/Scenes/WW_Benchmark_Chennai.unity",
            "Assets/_Project/Scenes/WW_Benchmark_Pichavaram.unity",
            "Assets/_Project/Scenes/WW_Benchmark_Delta.unity",
            "Assets/_Project/Scenes/WW_Benchmark_Nilgiris.unity"
        };

        [MenuItem("Tools/Whispering Wilds/Build Production Windows x64 (Retail)")]
        public static bool BuildProductionWindows()
        {
            string buildDir = "Build/Windows";
            string exePath = Path.Combine(buildDir, "TheWhisperingWilds.exe");
            if (!Directory.Exists(buildDir)) Directory.CreateDirectory(buildDir);

            // Re-generate authoritative 00_Boot.unity and regional scenes with living ecology
            BuildBootScene.CreateBootScene();
            AssembleWhisperingWilds.BuildPlayableChennaiScene();
            AssembleAllRegions.BuildAllScenes();

            // Bake static NavMesh AFTER scene assembly so ground geometry exists, and BEFORE the
            // build so NavMeshAgent pathing works in the shipping player.
            EcologyNavMeshBaker.BakeAllRegions();

            // Register only gameplay scenes in build settings
            EditorBuildSettingsScene[] buildScenes = new EditorBuildSettingsScene[ProductionGameplayScenes.Length];
            for (int i = 0; i < ProductionGameplayScenes.Length; i++)
            {
                buildScenes[i] = new EditorBuildSettingsScene(ProductionGameplayScenes[i], true);
            }
            EditorBuildSettings.scenes = buildScenes;

            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = ProductionGameplayScenes,
                locationPathName = exePath,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };

            Debug.Log($"<color=#00D2FF><b>[BuildPipeline]</b></color> Starting PRODUCTION Windows x64 build with {ProductionGameplayScenes.Length} gameplay scenes...");
            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;

            bool success = summary.result == BuildResult.Succeeded;
            if (success)
            {
                Debug.Log($"<color=#00FF88><b>[BuildPipeline]</b></color> PRODUCTION BUILD SUCCEEDED! Path: {exePath} Size: {summary.totalSize / (1024 * 1024)} MB in {summary.totalTime.TotalSeconds:F1}s.");
                WriteBuildReportJson("PRODUCTION_BUILD", summary, exePath, ProductionGameplayScenes);
            }
            else
            {
                Debug.LogError($"<color=#FF3333><b>[BuildPipeline]</b></color> PRODUCTION BUILD FAILED with {summary.totalErrors} errors!");
            }
            return success;
        }

        [MenuItem("Tools/Whispering Wilds/Build QA Benchmark Windows x64")]
        public static bool BuildQABenchmarkWindows()
        {
            string buildDir = "Build/Windows_QA";
            string exePath = Path.Combine(buildDir, "TheWhisperingWilds_QA.exe");
            if (!Directory.Exists(buildDir)) Directory.CreateDirectory(buildDir);

            string[] allScenes = new string[ProductionGameplayScenes.Length + BenchmarkScenes.Length];
            ProductionGameplayScenes.CopyTo(allScenes, 0);
            BenchmarkScenes.CopyTo(allScenes, ProductionGameplayScenes.Length);

            EditorBuildSettingsScene[] buildScenes = new EditorBuildSettingsScene[allScenes.Length];
            for (int i = 0; i < allScenes.Length; i++)
            {
                buildScenes[i] = new EditorBuildSettingsScene(allScenes[i], true);
            }
            EditorBuildSettings.scenes = buildScenes;

            BuildPlayerOptions options = new BuildPlayerOptions
            {
                scenes = allScenes,
                locationPathName = exePath,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.Development | BuildOptions.AllowDebugging
            };

            Debug.Log($"<color=#00D2FF><b>[BuildPipeline]</b></color> Starting QA BENCHMARK Windows x64 build with {allScenes.Length} scenes...");
            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;

            bool success = summary.result == BuildResult.Succeeded;
            if (success)
            {
                Debug.Log($"<color=#00FF88><b>[BuildPipeline]</b></color> QA BENCHMARK BUILD SUCCEEDED! Path: {exePath} Size: {summary.totalSize / (1024 * 1024)} MB in {summary.totalTime.TotalSeconds:F1}s.");
                WriteBuildReportJson("QA_BENCHMARK_BUILD", summary, exePath, allScenes);
            }
            else
            {
                Debug.LogError($"<color=#FF3333><b>[BuildPipeline]</b></color> QA BENCHMARK BUILD FAILED with {summary.totalErrors} errors!");
            }
            return success;
        }

        private static void WriteBuildReportJson(string buildType, BuildSummary summary, string exePath, string[] scenes)
        {
            try
            {
                string json = "{\n" +
                    $"  \"buildType\": \"{buildType}\",\n" +
                    $"  \"result\": \"{summary.result}\",\n" +
                    $"  \"executablePath\": \"{exePath.Replace('\\', '/')}\",\n" +
                    $"  \"totalSizeBytes\": {summary.totalSize},\n" +
                    $"  \"totalSizeMB\": {summary.totalSize / (1024 * 1024)},\n" +
                    $"  \"durationSeconds\": {summary.totalTime.TotalSeconds:F2},\n" +
                    $"  \"unityVersion\": \"{Application.unityVersion}\",\n" +
                    $"  \"targetPlatform\": \"StandaloneWindows64\",\n" +
                    $"  \"sceneCount\": {scenes.Length},\n" +
                    $"  \"timestamp\": \"{DateTime.UtcNow:o}\"\n" +
                    "}";

                File.WriteAllText("BUILD_REPORT.json", json);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[BuildPipeline] Could not write BUILD_REPORT.json: {ex.Message}");
            }
        }
    }
}
