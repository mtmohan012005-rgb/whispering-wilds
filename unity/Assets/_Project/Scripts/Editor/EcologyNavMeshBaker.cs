using System.Collections.Generic;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;
using WhisperingWilds.World;
using WhisperingWilds.NPC;
using WhisperingWilds.Wildlife;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Bakes a static NavMesh for each gameplay scene using the built-in AI module
    /// (UnityEngine.AI.NavMeshBuilder) so the project does not need the
    /// com.unity.ai.navigation package for authoring-time baking.
    ///
    /// The resulting NavMeshData is written as a project asset and referenced from the
    /// scene's NavMeshSettings so NavMeshAgent queries resolve at runtime.
    /// </summary>
    public static class EcologyNavMeshBaker
    {
        private const string NavMeshAssetFolder = "Assets/_Project/NavMeshData";

        /// <summary>
        /// Ensures every simulated entity carries a real NavMeshAgent plus its navigation
        /// controller. RequireComponent only satisfies dependencies when a component is added at
        /// runtime, so entities restored from serialized scene data can be missing them.
        /// </summary>
        public static void EnsureNavigationComponents(Scene scene)
        {
            GameObject[] roots = scene.GetRootGameObjects();
            int entityCount = 0;

            foreach (GameObject root in roots)
            {
                foreach (NPCCharacter npc in root.GetComponentsInChildren<NPCCharacter>(true))
                {
                    EnsureAgent(npc.gameObject, false);
                    entityCount++;
                }

                foreach (WildlifeEntity animal in root.GetComponentsInChildren<WildlifeEntity>(true))
                {
                    EnsureAgent(animal.gameObject, true);
                    entityCount++;
                }
            }

            if (entityCount > 0)
            {
                Debug.Log($"[EcologyNavMeshBaker] {scene.name}: ensured navigation components on " +
                          $"{entityCount} simulated entities.");
            }
        }

        private static void EnsureAgent(GameObject go, bool isWildlife)
        {
            if (go.GetComponent<NavMeshAgent>() == null)
            {
                go.AddComponent<NavMeshAgent>();
            }

            if (isWildlife)
            {
                if (go.GetComponent<WildlifeNavigationController>() == null)
                {
                    go.AddComponent<WildlifeNavigationController>();
                }
            }
            else if (go.GetComponent<NPCNavigationController>() == null)
            {
                go.AddComponent<NPCNavigationController>();
            }
        }

        private static readonly string[] GameplayScenes =
        {
            "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity",
            "Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity",
            "Assets/_Project/Scenes/04_Thanjavur_Delta.unity",
            "Assets/_Project/Scenes/05_Chettinad_Mansion.unity",
            "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity",
            "Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity"
        };

        [MenuItem("Whispering Wilds/Ecology/Bake NavMesh For All Regions")]
        public static void BakeAllRegions()
        {
            foreach (string scenePath in GameplayScenes)
            {
                BakeScene(scenePath);
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[EcologyNavMeshBaker] Finished baking all gameplay scenes.");
        }

        public static bool BakeScene(string scenePath)
        {
            if (!System.IO.File.Exists(scenePath))
            {
                Debug.LogError($"[EcologyNavMeshBaker] Scene missing: {scenePath}");
                return false;
            }

            Scene scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);

            EnsureNavigationComponents(scene);

            NavMeshBuildSettings settings = NavMesh.GetSettingsByIndex(0);

            List<NavMeshBuildSource> sources = CollectSources(scene);
            if (sources.Count == 0)
            {
                Debug.LogWarning($"[EcologyNavMeshBaker] No walkable sources in {scenePath}; NavMesh left empty.");
                return false;
            }

            Bounds bounds = CalculateWorldBounds(scene);

            NavMeshData data = NavMeshBuilder.BuildNavMeshData(
                settings,
                sources,
                bounds,
                Vector3.zero,
                Quaternion.identity);

            if (data == null)
            {
                Debug.LogError($"[EcologyNavMeshBaker] BuildNavMeshData returned null for {scenePath}.");
                return false;
            }

            string folder = $"{NavMeshAssetFolder}/{Path_GetFileNameWithoutExtension(scenePath)}";
            EnsureFolder(folder);

            string assetPath = $"{folder}/{Path_GetFileNameWithoutExtension(scenePath)}.asset";
            AssetDatabase.DeleteAsset(assetPath);
            AssetDatabase.CreateAsset(data, assetPath);

            AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceUpdate);
            NavMeshData imported = AssetDatabase.LoadAssetAtPath<NavMeshData>(assetPath);
            if (imported == null)
            {
                Debug.LogError($"[EcologyNavMeshBaker] Failed to re-import baked NavMesh at {assetPath}.");
                return false;
            }

            // Wire the baked data into the scene via a NavMeshSceneLink component. Unity's
            // scene-level NavMeshSettings object is editor-internal and cannot be written from
            // script, so the runtime-registration pattern is used instead.
            WireSceneLink(scene, imported, scenePath);

            // Verify the bake by actually registering the data and measuring the triangulation.
            // NavMesh.CalculateTriangulation() reflects the ACTIVE navmesh, so the instance must
            // be added first; measuring without this always reports zero and hides real failures.
            NavMeshDataInstance probe = NavMesh.AddNavMeshData(imported);
            int triangles = 0;
            if (probe.valid)
            {
                triangles = NavMesh.CalculateTriangulation().indices.Length / 3;
                probe.Remove();
            }

            Debug.Log($"[EcologyNavMeshBaker] {scenePath}: baked {sources.Count} sources -> " +
                      $"{triangles} navmesh triangles at '{assetPath}'.");

            EditorSceneManager.SaveScene(scene);

            if (triangles <= 0)
            {
                Debug.LogError($"[EcologyNavMeshBaker] {scenePath} baked ZERO navmesh triangles. " +
                               "Agents will not path in this scene.");
                return false;
            }

            return true;
        }

        private static void WireSceneLink(Scene scene, NavMeshData data, string scenePath)
        {
            GameObject linkObject = null;

            foreach (GameObject root in scene.GetRootGameObjects())
            {
                NavMeshSceneLink existing = root.GetComponent<NavMeshSceneLink>();
                if (existing != null)
                {
                    linkObject = existing.gameObject;
                    break;
                }
            }

            if (linkObject == null)
            {
                linkObject = new GameObject("NavMeshSceneLink");
            }

            NavMeshSceneLink link = linkObject.GetComponent<NavMeshSceneLink>();
            if (link == null)
            {
                link = linkObject.AddComponent<NavMeshSceneLink>();
            }

#if UNITY_EDITOR
            link.SetNavMeshData(data);
#endif
            EditorUtility.SetDirty(link);
        }

        private static List<NavMeshBuildSource> CollectSources(Scene scene)
        {
            List<NavMeshBuildSource> sources = new List<NavMeshBuildSource>();
            GameObject[] roots = scene.GetRootGameObjects();

            foreach (GameObject root in roots)
            {
                MeshFilter[] filters = root.GetComponentsInChildren<MeshFilter>(true);
                MeshRenderer[] renderers = root.GetComponentsInChildren<MeshRenderer>(true);

                if (filters.Length == 0 && renderers.Length == 0)
                {
                    // Terrain surfaces contribute walkable ground.
                    Terrain[] terrains = root.GetComponentsInChildren<Terrain>(true);
                    foreach (Terrain terrain in terrains)
                    {
                        AddTerrainSource(terrain, sources);
                    }
                    continue;
                }

                for (int i = 0; i < filters.Length; i++)
                {
                    MeshFilter filter = filters[i];
                    Mesh shared = filter.sharedMesh;
                    if (shared == null || shared.vertexCount == 0)
                    {
                        continue;
                    }

                    GameObject go = filter.gameObject;
                    if (!IsPotentiallyWalkable(go, renderers))
                    {
                        continue;
                    }

                    NavMeshBuildSource source = new NavMeshBuildSource
                    {
                        shape = NavMeshBuildSourceShape.Mesh,
                        sourceObject = shared,
                        transform = go.transform.localToWorldMatrix
                    };
                    sources.Add(source);
                }
            }

            return sources;
        }

        private static void AddTerrainSource(Terrain terrain, List<NavMeshBuildSource> sources)
        {
            TerrainData data = terrain.terrainData;
            if (data == null)
            {
                return;
            }

            // Terrain contributes its heightmap surface as a box spanning the tile extent.
            Vector3 size = new Vector3(data.size.x, data.size.y, data.size.z);
            Vector3 center = terrain.transform.position + new Vector3(size.x * 0.5f, size.y, size.z * 0.5f);

            sources.Add(new NavMeshBuildSource
            {
                shape = NavMeshBuildSourceShape.Box,
                transform = Matrix4x4.TRS(center, Quaternion.identity, size),
                size = new Vector3(1f, 1f, 1f)
            });
        }

        private static bool IsPotentiallyWalkable(GameObject go, MeshRenderer[] renderers)
        {
            // NavMesh rejects vertical/unwalkable-slope geometry itself during the build, so this
            // only skips decoration that would otherwise bloat the source list.
            string lower = go.name.ToLowerInvariant();
            if (lower.Contains("vegetation")
                || lower.Contains("foliage")
                || lower.Contains("canopy")
                || lower.Contains("grass")
                || lower.Contains("foli")
                || lower.Contains("tree")
                || lower.Contains("prop_foliage"))
            {
                return false;
            }

            // Static batching rewrites mesh transforms; skip non-renderer helpers outright.
            if (go.GetComponent<MeshRenderer>() == null)
            {
                return false;
            }

            return true;
        }

        private static Bounds CalculateWorldBounds(Scene scene)
        {
            Bounds bounds = new Bounds();
            bool initialized = false;

            foreach (GameObject root in scene.GetRootGameObjects())
            {
                foreach (Renderer renderer in root.GetComponentsInChildren<Renderer>(true))
                {
                    if (!initialized)
                    {
                        bounds = renderer.bounds;
                        initialized = true;
                    }
                    else
                    {
                        bounds.Encapsulate(renderer.bounds);
                    }
                }
            }

            if (!initialized)
            {
                bounds = new Bounds(Vector3.zero, new Vector3(400f, 100f, 400f));
            }

            // Pad so agents near the scene edge still have valid polygons.
            bounds.Expand(10f);
            return bounds;
        }

        private static void EnsureFolder(string folder)
        {
            if (AssetDatabase.IsValidFolder(folder))
            {
                return;
            }

            string parent = NavMeshAssetFolder;
            string leaf = System.IO.Path.GetFileName(folder);
            if (!AssetDatabase.IsValidFolder(parent))
            {
                AssetDatabase.CreateFolder("Assets/_Project", "NavMeshData");
            }
            AssetDatabase.CreateFolder(parent, leaf);
        }

        private static string Path_GetFileNameWithoutExtension(string path)
        {
            return System.IO.Path.GetFileNameWithoutExtension(path);
        }
    }
}
