using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.QA
{
    [DisallowMultipleComponent]
    public class StandaloneSmokeTest : MonoBehaviour
    {
        private readonly StringBuilder log = new StringBuilder();
        private bool running = false;

        private static bool ShouldRun()
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length; i++)
                if (args[i].Equals("-smokeTest", StringComparison.OrdinalIgnoreCase)) return true;
            string env = Environment.GetEnvironmentVariable("WW_SMOKE_TEST");
            return !string.IsNullOrEmpty(env) && env != "0";
        }

        private void Awake()
        {
            if (!ShouldRun()) return;
            DontDestroyOnLoad(this);
            running = true;
            StartCoroutine(Run());
        }

        private IEnumerator Run()
        {
            log.AppendLine("SMOKE START");
            yield return new WaitForSeconds(1f);
            log.AppendLine("Boot scene: " + SceneManager.GetActiveScene().name);
            log.AppendLine("Cam exists: " + (Camera.main != null));
            log.AppendLine("SMOKE OK");
            Write();
        }

        private void Write()
        {
            try { System.IO.File.WriteAllText(System.IO.Path.Combine(Application.persistentDataPath, "standalone_smoke_test.txt"), log.ToString()); } catch { }
        }
    }
}
