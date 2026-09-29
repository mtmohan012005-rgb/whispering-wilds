using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Automated production build pipeline compiling standalone Windows x64 executables
    /// including all 8 regional Tamil Nadu scenes, 4 benchmark suites, and native runtime data.
    /// </summary>
    public static class BuildPipelineAutomation
    {
        [MenuItem("Tools/Whispering Wilds/Build Windows x64 Executable")]
        public static void BuildStandaloneWindowsPlayer()
        {
            string buildDir = "Build/Windows";
            string exePath = Path.Combine(buildDir, "TheWhisperingWilds.exe");
            if (!Directory.Exists(buildDir)) Directory.CreateDirectory(buildDir);

            // Ensure all 12 scenes are registered
            AssembleAllRegions.RegisterAllScenesInBuildSettings();

            string[] scenes = new string[]
            {
                "Assets/_Project/Scenes/00_Boot.unity",
                "Assets/_Project/Scenes/01_StateMap_TamilNadu.unity",
                "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity",
                "Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity",
                "Assets/_Project/Scenes/04_Thanjavur_Delta.unity",
                "Assets/_Project/Scenes/05_Chettinad_Mansion.unity",
                "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity",
                "Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity",
                "Assets/_Project/Scenes/WW_Benchmark_Chennai.unity",
                "Assets/_Project/Scenes/WW_Benchmark_Pichavaram.unity",
                "Assets/_Project/Scenes/WW_Benchmark_Delta.unity",
                "Assets/_Project/Scenes/WW_Benchmark_Nilgiris.unity"
            };

            BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions
            {
                scenes = scenes,
                locationPathName = exePath,
                target = BuildTarget.StandaloneWindows64,
                options = BuildOptions.None
            };

            Debug.Log($"<color=#00D2FF><b>[BuildPipelineAutomation]</b></color> Starting Windows x64 compilation: {exePath} with {scenes.Length} scenes...");
            BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
            BuildSummary summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"<color=#00FF88><b>[BuildPipelineAutomation]</b></color> BUILD SUCCEEDED! Total size: {summary.totalSize / (1024 * 1024)} MB in {summary.totalTime.TotalSeconds:F1}s.");
            }
            else
            {
                Debug.LogError($"<color=#FF3333><b>[BuildPipelineAutomation]</b></color> BUILD FAILED with {summary.totalErrors} errors!");
            }
        }
    }
}
