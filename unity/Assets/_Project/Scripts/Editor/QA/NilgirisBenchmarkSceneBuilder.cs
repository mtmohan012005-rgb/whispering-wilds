#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using WhisperingWilds.Profiling;
using WhisperingWilds.PhysicsZones;

namespace WhisperingWilds.EditorTools
{
    /// <summary>
    /// Generates the dedicated WW_Benchmark_NilgirisPhysics scene.
    ///
    /// The scene is generated rather than hand-authored because it is throwaway
    /// measurement scaffolding: keeping it reproducible from source means the prop
    /// count and zone size can be changed and regenerated, instead of drifting as
    /// manual scene edits.
    ///
    /// Props are plain cubes on purpose. This scene measures the physics mechanic,
    /// not art, and the brief forbids fake models in gameplay content; benchmark
    /// primitives stay inside the benchmark scene and are never referenced by a
    /// playable scene.
    /// </summary>
    public static class NilgirisBenchmarkSceneBuilder
    {
        public const string ScenePath = "Assets/_Project/Scenes/QA/WW_Benchmark_NilgirisPhysics.unity";
        private const string SceneName = "WW_Benchmark_NilgirisPhysics";

        [MenuItem("Tools/Benchmark/Generate Nilgiris Physics Scene")]
        public static void Generate()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var light = new GameObject("Directional Light");
            var lightComp = light.AddComponent<Light>();
            lightComp.type = LightType.Directional;
            lightComp.intensity = 1f;
            lightComp.shadows = LightShadows.None;
            light.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            var cam = new GameObject("Main Camera");
            cam.tag = "MainCamera";
            var camComp = cam.AddComponent<Camera>();
            camComp.clearFlags = CameraClearFlags.SolidColor;
            camComp.backgroundColor = new Color(0.08f, 0.09f, 0.12f, 1f);
            camComp.farClipPlane = 200f;
            cam.transform.position = new Vector3(0f, 18f, -26f);
            cam.transform.rotation = Quaternion.Euler(25f, 0f, 0f);

            // Ground
            var ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "Ground";
            ground.transform.localScale = new Vector3(60f, 1f, 60f);
            ground.transform.position = new Vector3(0f, -0.5f, 0f);
            Object.DestroyImmediate(ground.GetComponent<MeshRenderer>());

            // Inverted-gravity zone: 40x10x40 box trigger sitting on the ground.
            var zone = new GameObject("AntigravityZone");
            var zoneCollider = zone.AddComponent<BoxCollider>();
            zoneCollider.isTrigger = true;
            zoneCollider.size = new Vector3(40f, 10f, 40f);
            zone.transform.position = new Vector3(0f, 5f, 0f);

            var zoneManager = zone.AddComponent<AntigravityZoneManager>();
            var so = new SerializedObject(zoneManager);
            so.FindProperty("zoneId").stringValue = "benchmark_nilgiris";
            // No quality override: the benchmark must measure whatever tier the
            // player is actually running, otherwise it validates nothing real.
            so.FindProperty("maxActiveBodiesOverride").intValue = 0;
            so.ApplyModifiedPropertiesWithoutUndo();

            int bodyCount = CreateProps();

            var harness = new GameObject("NilgirisPhysicsBenchmark");
            var bench = harness.AddComponent<NilgirisPhysicsBenchmark>();
            var benchSo = new SerializedObject(bench);
            benchSo.FindProperty("warmupSeconds").intValue = 5;
            benchSo.FindProperty("measuredSeconds").intValue = 30;
            benchSo.FindProperty("bodyCount").intValue = bodyCount;
            benchSo.ApplyModifiedPropertiesWithoutUndo();

            Directory.CreateDirectory(Path.GetDirectoryName(ScenePath));
            EditorSceneManager.SaveScene(scene, ScenePath);
            AssetDatabase.SaveAssets();

            Debug.Log($"[NilgirisBenchmarkSceneBuilder] Wrote {ScenePath} with {bodyCount} bodies.");
        }

        /// <summary>
        /// Builds a throwaway player containing only the benchmark scene.
        ///
        /// Uses an explicit scene list rather than EditorBuildSettings on purpose: the
        /// shipping build must keep booting into 00_Boot, so adding a measurement scene
        /// to the shipping scene list would be the wrong trade. Output goes to a caller
        /// supplied path outside the repository.
        /// </summary>
        public static void BuildBenchmarkPlayer()
        {
            string outputPath = System.Environment.GetEnvironmentVariable("WW_BENCH_BUILD_PATH");
            if (string.IsNullOrEmpty(outputPath))
            {
                Debug.LogError("[NilgirisBenchmarkSceneBuilder] WW_BENCH_BUILD_PATH not set.");
                return;
            }

            Directory.CreateDirectory(Path.GetDirectoryName(outputPath));

            var options = new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = outputPath,
                target = BuildTarget.StandaloneWindows64,
                targetGroup = BuildTargetGroup.Standalone,
                options = BuildOptions.Development
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            var summary = report.summary;

            if (summary.result == BuildResult.Succeeded)
            {
                Debug.Log($"[NilgirisBenchmarkSceneBuilder] Benchmark player built: {summary.totalSize} bytes -> {outputPath}");
            }
            else
            {
                Debug.LogError($"[NilgirisBenchmarkSceneBuilder] Build failed: {summary.result} with {summary.totalErrors} errors.");
            }
        }

        private static int CreateProps()
        {
            const int columns = 10;
            const int rows = 6;
            const float spacing = 2.4f;
            float originX = -((columns - 1) * spacing) * 0.5f;
            float originZ = -((rows - 1) * spacing) * 0.5f;

            int count = 0;
            for (int x = 0; x < columns; x++)
            {
                for (int z = 0; z < rows; z++)
                {
                    var prop = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    prop.name = $"BenchProp_{count:000}";
                    prop.tag = "Interactable";
                    prop.transform.position = new Vector3(
                        originX + x * spacing,
                        1f + (count % 5) * 1.1f,
                        originZ + z * spacing);
                    prop.transform.localScale = Vector3.one * (0.6f + (count % 3) * 0.25f);

                    var rb = prop.AddComponent<Rigidbody>();
                    rb.mass = 2f + (count % 7);
                    rb.collisionDetectionMode = CollisionDetectionMode.Discrete;
                    rb.interpolation = RigidbodyInterpolation.None;

                    prop.AddComponent<AntigravityBodyState>();
                    count++;
                }
            }

            return count;
        }
    }
}
#endif