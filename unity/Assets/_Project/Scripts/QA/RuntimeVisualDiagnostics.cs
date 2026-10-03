using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.QA
{
    [DisallowMultipleComponent]
    public class RuntimeVisualDiagnostics : MonoBehaviour
    {
        private const string Flag = "-runtimeVisualDiag";
        private readonly StringBuilder report = new StringBuilder();
        private float nextReportTime = 5f;

        private static bool ShouldRun()
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
                if (args[i].Equals(Flag, StringComparison.OrdinalIgnoreCase)) return true;
            string env = Environment.GetEnvironmentVariable("WW_RUNTIME_VISUAL_DIAG");
            return !string.IsNullOrEmpty(env) && env != "0";
        }

        private void Awake()
        {
            if (!ShouldRun()) return;
            DontDestroyOnLoad(this);
            report.AppendLine("=== RUNTIME VISUAL DIAGNOSTICS ===");
            report.AppendLine("Time: " + DateTime.UtcNow.ToString("o"));
            report.AppendLine("Scene: " + SceneManager.GetActiveScene().name);
            LogState();
        }

        private void Update()
        {
            if (Time.time >= nextReportTime)
            {
                nextReportTime = Time.time + 10f;
                report.AppendLine("--- tick ---");
                LogState();
                Write();
            }
        }

        private void LogState()
        {
            var cam = Camera.main;
            if (cam != null)
            {
                report.AppendLine("cam.near=" + cam.nearClipPlane + " far=" + cam.farClipPlane);
                report.AppendLine("cam.clear=" + cam.clearFlags);
            }
            else report.AppendLine("cam:null");

            var lights = FindObjectsByType<Light>();
            report.AppendLine("lights.enabled=" + CountEnabled(lights));
            report.AppendLine("renderers.total=" + FindObjectsByType<Renderer>().Length);
        }

        private int CountEnabled(Light[] lights)
        {
            int c = 0; for (int i = 0; i < lights.Length; i++) if (lights[i].enabled) c++; return c;
        }

        private void Write()
        {
            try { File.WriteAllText(Path.Combine(Application.persistentDataPath, "runtime_visual_diagnostics.txt"), report.ToString()); } catch { }
        }
    }
}
