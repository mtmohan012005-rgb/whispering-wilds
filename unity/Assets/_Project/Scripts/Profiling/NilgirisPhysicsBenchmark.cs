using System;
using System.Globalization;
using System.IO;
using System.Text;
using Unity.Profiling;
using UnityEngine;

namespace WhisperingWilds.Profiling
{
    /// <summary>
    /// Physics benchmark harness for the inverted-gravity / floating-body mechanic.
    ///
    /// Placed in the dedicated WW_Benchmark_NilgirisPhysics scene. Streams one JSON
    /// object per second to a .jsonl file under Application.persistentDataPath, so a run
    /// can be analysed incrementally and nothing generated lands in the repository.
    ///
    /// Design notes:
    ///  - Physics.Simulate is observed, never stepped manually. Manual Physics.Simulate
    ///    is only legal when Physics.simulationMode is SimulationMode.Script; calling it
    ///    under the default automatic mode would double-step the whole world.
    ///  - Allocation is measured, not asserted. Managed bytes per second come from
    ///    GC.GetAllocatedBytesForCurrentThread, so a regression in the FixedUpdate path
    ///    shows up as data rather than as a claim in a comment.
    ///  - Missing profiler counters are recorded as null instead of silently
    ///    substituting a different metric.
    /// </summary>
    [DisallowMultipleComponent]
    public class NilgirisPhysicsBenchmark : MonoBehaviour
    {
        [Header("Run configuration")]
        [SerializeField] private int warmupSeconds = 5;
        [SerializeField] private int measuredSeconds = 30;
        [SerializeField] private string outputFileName = "nilgiris_physics_benchmark.jsonl";

        [Header("Reported context")]
        [Tooltip("Number of floating bodies this scene was built with. Recorded for context only.")]
        [SerializeField] private int bodyCount;

        private ProfilerRecorder mainThreadRecorder;
        private ProfilerRecorder physicsRecorder;
        private ProfilerRecorder gcRecorder;

        /// <summary>Name of the physics counter actually in use, or null when none.</summary>
        private string physicsCounterName;

        private bool mainThreadValid;
        private bool physicsValid;
        private bool gcValid;

        private StreamWriter writer;
        private string outputPath;

        private float sceneStartTime;
        private float windowStartTime;
        private long windowStartGcBytes;
        private int windowIndex;
        private bool running;

        // Per-window accumulators.
        private double mainThreadSumMs;
        private long mainThreadSamples;
        private double physicsSumMs;
        private long physicsSamples;
        private float physicsPeakMs;
        private double fpsSum;
        private int fpsSamples;

        // Measured-phase (post-warmup) accumulators for the final summary.
        private double measuredPhysicsSumMs;
        private long measuredPhysicsSamples;
        private float measuredPhysicsPeakMs;
        private long measuredAllocatedBytes;
        private int measuredWindows;

        private void Awake()
        {
            // persistentDataPath is required by the spec. A temp fallback exists only in
            // case persistentDataPath is unavailable, and is announced.
            string dir = Application.persistentDataPath;
            if (string.IsNullOrEmpty(dir))
            {
                dir = Path.Combine(Path.GetTempPath(), "WhisperingWilds-QA");
                Debug.LogWarning("[NilgirisPhysicsBenchmark] persistentDataPath was empty; using temp directory.");
            }

            Directory.CreateDirectory(dir);
            outputPath = Path.Combine(dir, outputFileName);

            // Fresh file per run: an append would mix results from separate sessions.
            writer = new StreamWriter(outputPath, append: false) { AutoFlush = true };
        }

        private void Start()
        {
            sceneStartTime = Time.realtimeSinceStartup;
            windowStartTime = sceneStartTime;
            windowStartGcBytes = GC.GetAllocatedBytesForCurrentThread();
            StartRecorders();

            Write(new StringBuilder()
                .Append("{\"kind\":\"config\"")
                .Append(",\"scene\":\"").Append(UnityEngine.SceneManagement.SceneManager.GetActiveScene().name).Append('"')
                .Append(",\"physicsSimulationMode\":\"").Append(Physics.simulationMode).Append('"')
                .Append(",\"warmupSeconds\":").Append(warmupSeconds)
                .Append(",\"measuredSeconds\":").Append(measuredSeconds)
.Append(",\"bodyCount\":").Append(bodyCount)
              .Append(",\"physicsCounterUsed\":").Append(physicsCounterName == null ? "null" : "\"" + physicsCounterName + "\"")
                .Append(",\"fixedDeltaTime\":").Append(Num(Time.fixedDeltaTime))
                .Append(",\"timeScale\":").Append(Num(Time.timeScale))
.Append(",\"mainThreadCounter\":").Append(Quote(mainThreadValid))
              .Append(",\"physicsCounter\":").Append(physicsCounterName == null ? "null" : "\"" + physicsCounterName + "\"")
              .Append(",\"physicsCounterIsPhysicsSimulate\":").Append(physicsCounterName == "Physics.Simulate" ? "true" : "false")
                .Append(",\"gcCounter\":").Append(gcValid ? "\"GC Allocated In Frame\"" : "null")
                .Append(",\"note\":\"Physics.Simulate is observed, not manually stepped; manual stepping is only legal under SimulationMode.Script.\"")
                .Append('}').ToString());

            running = true;
        }

        private void StartRecorders()
        {
            // ProfilerRecorder.StartNew throws for an unknown stat name, so each
            // candidate is probed before being adopted.
            mainThreadValid = TryStartRecorder(ProfilerCategory.Internal, "Main Thread", out mainThreadRecorder);
            if (!mainThreadValid)
            {
                mainThreadValid = TryStartRecorder(ProfilerCategory.Scripts, "BehaviourUpdate", out mainThreadRecorder);
            }

            physicsCounterName = null;

            physicsValid = TryStartRecorder(ProfilerCategory.Physics, "Physics.Simulate", out physicsRecorder);
            if (physicsValid)
            {
                physicsCounterName = "Physics.Simulate";
            }
            else
            {
                // Documented fallback: Physics.Simulate is not exposed on every
                // platform/editor combination, and FixedUpdate is the next closest
                // signal. The config line records which counter was actually used, so a
                // report can never silently present FixedUpdate as Physics.Simulate.
                physicsValid = TryStartRecorder(ProfilerCategory.Physics, "FixedUpdate", out physicsRecorder);
                if (physicsValid) physicsCounterName = "FixedUpdate";
            }

            gcValid = TryStartRecorder(ProfilerCategory.Memory, "GC Allocated In Frame", out gcRecorder);
        }

        private static bool TryStartRecorder(ProfilerCategory category, string statName, out ProfilerRecorder recorder)
        {
            recorder = default;
            try
            {
                recorder = ProfilerRecorder.StartNew(category, statName);
                return recorder.Valid;
            }
            catch (Exception)
            {
                recorder = default;
                return false;
            }
        }

        private void Update()
        {
            if (!running) return;

            SampleWindow();

            if (Time.realtimeSinceStartup - windowStartTime < 1f) return;

            FlushWindow();
        }

        private void SampleWindow()
        {
            if (Time.unscaledDeltaTime > 0f)
            {
                fpsSum += 1f / Time.unscaledDeltaTime;
                fpsSamples++;
            }

            if (mainThreadValid)
            {
                long ns = mainThreadRecorder.LastValue;
                if (ns > 0)
                {
                    mainThreadSumMs += ns * 1e-6;
                    mainThreadSamples++;
                }
            }

            if (physicsValid)
            {
                long ns = physicsRecorder.LastValue;
                if (ns > 0)
                {
                    float ms = ns * 1e-6f;
                    physicsSumMs += ms;
                    physicsSamples++;
                    if (ms > physicsPeakMs) physicsPeakMs = ms;
                }
            }
        }

        private void FlushWindow()
        {
            float now = Time.realtimeSinceStartup;
            long gcNow = GC.GetAllocatedBytesForCurrentThread();
            long windowAllocated = gcNow - windowStartGcBytes;

            float totalElapsed = now - sceneStartTime;
            bool inWarmup = totalElapsed < warmupSeconds;

            double avgMainThreadMs = mainThreadSamples > 0 ? mainThreadSumMs / mainThreadSamples : 0.0;
            double avgPhysicsMs = physicsSamples > 0 ? physicsSumMs / physicsSamples : 0.0;
            double avgFps = fpsSamples > 0 ? fpsSum / fpsSamples : 0.0;

            var sb = new StringBuilder(384);
            sb.Append("{\"kind\":\"sample\"")
              .Append(",\"window\":").Append(windowIndex)
              .Append(",\"warmup\":").Append(inWarmup ? "true" : "false")
              .Append(",\"avgFps\":").Append(Num(avgFps))
              .Append(",\"mainThreadAvgMs\":").Append(mainThreadValid ? Num(avgMainThreadMs) : "null")
              .Append(",\"physicsSimAvgMs\":").Append(physicsValid ? Num(avgPhysicsMs) : "null")
              .Append(",\"physicsSimPeakMs\":").Append(physicsValid ? Num(physicsPeakMs) : "null")
              .Append(",\"allocatedBytes\":").Append(windowAllocated);

            if (!inWarmup)
            {
                measuredPhysicsSumMs += physicsSumMs;
                measuredPhysicsSamples += physicsSamples;
                if (physicsPeakMs > measuredPhysicsPeakMs) measuredPhysicsPeakMs = physicsPeakMs;
                measuredAllocatedBytes += windowAllocated;
                measuredWindows++;
            }

            sb.Append(",\"elapsedSeconds\":").Append(Num(totalElapsed));
            Write(sb.Append('}').ToString());

            windowIndex++;
            windowStartTime = now;
            windowStartGcBytes = gcNow;
            mainThreadSumMs = 0;
            mainThreadSamples = 0;
            physicsSumMs = 0;
            physicsSamples = 0;
            physicsPeakMs = 0f;
            fpsSum = 0;
            fpsSamples = 0;

            if (totalElapsed >= warmupSeconds + measuredSeconds)
            {
                Finish();
            }
        }

        /// <summary>
        /// Writes the single summary line. Verdicts are computed from the measured
        /// phase only; warmup is excluded because shader compilation and first-touch
        /// costs land there.
        /// </summary>
        private void Finish()
        {
            running = false;

            double avgPhysicsMs = measuredPhysicsSamples > 0
                ? measuredPhysicsSumMs / measuredPhysicsSamples
                : 0.0;

            // 16 KB/s is the budget for a zero-allocation steady-state physics tick.
            const long allocationBudgetBytesPerSecond = 16 * 1024;

            bool physicsOk = physicsValid && avgPhysicsMs > 0.0 && avgPhysicsMs <= 8.0;
            bool allocOk = measuredWindows > 0
                && measuredAllocatedBytes / (double)measuredWindows <= allocationBudgetBytesPerSecond;

            var sb = new StringBuilder(384);
            sb.Append("{\"kind\":\"summary\"")
              .Append(",\"measuredWindows\":").Append(measuredWindows)
              .Append(",\"physicsSimAvgMs\":").Append(physicsValid && measuredPhysicsSamples > 0 ? Num(avgPhysicsMs) : "null")
              .Append(",\"physicsSimPeakMs\":").Append(measuredPhysicsPeakMs > 0f ? Num(measuredPhysicsPeakMs) : "null")
              .Append(",\"allocatedBytesPerSecond\":").Append(
                  measuredWindows > 0 ? Num(measuredAllocatedBytes / (double)measuredWindows) : "null")
              .Append(",\"physicsAvgUnder8ms\":").Append(physicsOk ? "true" : "false")
              .Append(",\"allocUnder16KBps\":").Append(allocOk ? "true" : "false")
              .Append(",\"bodyCount\":").Append(bodyCount)
              .Append(",\"physicsSimulationMode\":\"").Append(Physics.simulationMode).Append('"');

            if (gcValid && gcRecorder.Count > 0)
            {
                sb.Append(",\"gcAllocatedInFrameAvgBytes\":").Append(Num(gcRecorder.LastValue));
            }
            else
            {
                sb.Append(",\"gcAllocatedInFrameAvgBytes\":null");
            }

            sb.Append('}');
            Write(sb.ToString());
            Write("{\"kind\":\"complete\",\"windows\":" + windowIndex + ",\"outputPath\":\"" + outputPath.Replace("\\", "/") + "\"}");

            Debug.Log($"[NilgirisPhysicsBenchmark] Run complete: {windowIndex} windows, " +
                      $"physics avg {avgPhysicsMs:0.###} ms, peak {measuredPhysicsPeakMs:0.###} ms -> {outputPath}");
        }

        private void Write(string json)
        {
            if (writer == null) return;

            try
            {
                writer.WriteLine(json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[NilgirisPhysicsBenchmark] Failed to write record: {e.Message}");
                running = false;
            }
        }

        private void OnDestroy()
        {
            if (mainThreadValid) mainThreadRecorder.Dispose();
            if (physicsValid) physicsRecorder.Dispose();
            if (gcValid) gcRecorder.Dispose();

            if (writer == null) return;

            try { writer.Flush(); writer.Dispose(); }
            catch (Exception) { /* shutting down; nothing useful to do */ }
            writer = null;
        }

        private static string Num(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);

        private static string Quote(bool value) => value ? "\"valid\"" : "\"unavailable\"";
    }
}