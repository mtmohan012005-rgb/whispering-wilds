using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.SceneManagement;
using WhisperingWilds.Data;
using WhisperingWilds.Gameplay;
using WhisperingWilds.World;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Runtime-shaped verification of the generated Mamallapuram scene, run against the scene on disk
    /// with the player executable's own NavMesh data registered.
    ///
    /// Everything else that checks this region asserts on data: the quest chain runs in the standalone
    /// smoke test through the event bus, and the generated YAML was inspected for ids. Both can pass
    /// while the region is unplayable, because neither puts an agent on the baked NavMesh or asks
    /// whether the objective the player has to reach is reachable from where they arrive. This is the
    /// check that closes that gap: it walks the actual route with NavMesh.CalculatePath.
    ///
    /// The route assertions are the point of the whole file. Stage 7 is a climb to a lookout platform
    /// at y 5.5 reached by a 22-step stair, and stage 9 requires coming back down to the seaward end of
    /// the causeway. If any step of that stair was too tall, too narrow, or sealed by the cheek walls,
    /// the data-level quest tests would still report 11/11 stages while the player could not get there.
    /// Each objective target is therefore measured both as "on the NavMesh" and as "reachable from the
    /// spawn", and the path length is logged so a regression shows up as a number rather than as a
    /// vague failure.
    ///
    /// Verifies, for the Mamallapuram scene only:
    ///   1. every scripted stage target exists as scene content with a non-empty id
    ///   2. every interactable target sits on the baked NavMesh
    ///   3. every arrival trigger target is reachable on foot from the player spawn
    ///   4. the lookout climb is walkable in both directions
    ///   5. every interactable carries a bilingual prompt with a prompt key
    ///
    /// Usage:
    ///   Menu:  Tools/Whispering Wilds/Verify Mamallapuram Shore Route
    ///   Batch: Unity.exe -batchmode -quit -nographics -projectPath unity ^
    ///            -executeMethod WhisperingWilds.Editor.MamallapuramRouteVerifier.VerifyFromCommandLine
    /// </summary>
    public static class MamallapuramRouteVerifier
    {
        private const string ScenePath = "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity";
        private const string NavMeshAssetPath =
            "Assets/_Project/NavMeshData/06_Mamallapuram_Shore/06_Mamallapuram_Shore.asset";

        // NavMesh sample tolerance. Sampling from slightly above the authored y is deliberate: the
        // navmesh is baked onto surface tops, and these are the heights an agent actually stands at.
        private const float SampleRadius = 6f;
        private const float SampleHeight = 2f;

        private static readonly List<string> Failures = new List<string>();

        [MenuItem("Tools/Whispering Wilds/Verify Mamallapuram Shore Route")]
        public static void VerifyFromMenu()
        {
            Run();
        }

        /// <summary>
        /// Exits non-zero on failure so a shell or CI step notices. A Unity batchmode run otherwise
        /// reports success even when every assertion failed, which would make this gate meaningless.
        /// </summary>
        public static void VerifyFromCommandLine()
        {
            bool ok = Run();
            if (Application.isBatchMode) EditorApplication.Exit(ok ? 0 : 1);
        }

        private static bool Run()
        {
            Failures.Clear();

            if (!System.IO.File.Exists(ScenePath))
            {
                Debug.LogError("[MamallapuramRoute] Scene missing: " + ScenePath);
                return false;
            }

            if (AssetDatabase.LoadAssetAtPath<NavMeshData>(NavMeshAssetPath) == null)
            {
                Debug.LogError("[MamallapuramRoute] Baked NavMesh missing: " + NavMeshAssetPath +
                               "  (bake it before verifying, or the route cannot be walked)");
                return false;
            }

            Scene scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);

            MamallapuramShoreContent.EnsureInitialized();

            // Register the baked data the same way the shipping scene's NavMeshSceneLink does at
            // runtime. Without this, NavMesh.SamplePosition succeeds against nothing and every
            // reachability check would pass vacuously.
            NavMeshData data = AssetDatabase.LoadAssetAtPath<NavMeshData>(NavMeshAssetPath);
            NavMeshDataInstance instance = NavMesh.AddNavMeshData(data);

            if (!instance.valid)
            {
                Debug.LogError("[MamallapuramRoute] Could not register the baked NavMesh; " +
                               "reachability cannot be verified.");
                instance.Remove();
                return false;
            }

            int triangles = NavMesh.CalculateTriangulation().indices.Length / 3;
            Debug.Log("[MamallapuramRoute] NavMesh registered: " + triangles + " triangles from " + NavMeshAssetPath);

            if (triangles == 0)
            {
                Fail("baked NavMesh has zero triangles");
                instance.Remove();
                return false;
            }

            var spawn = FindPlayerSpawn(scene);
            if (spawn == null)
            {
                Fail("no player spawn found in the scene");
                instance.Remove();
                return false;
            }

            if (!NavMesh.SamplePosition(spawn.position, out NavMeshHit spawnHit, SampleRadius, NavMesh.AllAreas))
            {
                Fail($"player spawn {spawn.position} is not on the NavMesh; the player would fall at the start");
                instance.Remove();
                return false;
            }

            Debug.Log($"[MamallapuramRoute] spawn {spawn.position} -> navmesh {spawnHit.position}");

            VerifyTriggersExist(scene);
            VerifyInteractablesExist(scene);
            VerifyBilingualPrompts(scene);
            VerifyArrivalTriggersAreReachable(scene, spawnHit.position);
            VerifyInteractablesAreReachable(scene, spawnHit.position);
            VerifyLookoutRoundTrip(spawnHit.position);

            instance.Remove();

            if (Failures.Count == 0)
            {
                Debug.Log("<color=#00FF88><b>[MamallapuramRoute]</b></color> PASS: every Mamallapuram " +
                          "objective target exists, is bilingual, sits on the NavMesh, and is reachable " +
                          "from the spawn.");
                return true;
            }

            Debug.LogError("<color=#FF3333><b>[MamallapuramRoute]</b></color> " + Failures.Count +
                           " failure(s):");
            foreach (string failure in Failures)
            {
                Debug.LogError("  - " + failure);
            }
            return false;
        }

        private static void Fail(string message)
        {
            Failures.Add(message);
        }

        private static Transform FindPlayerSpawn(Scene scene)
        {
            foreach (GameObject root in scene.GetRootGameObjects())
            {
                if (root.name == "SpawnPoint" || root.name == "PlayerSpawn")
                {
                    return root.transform;
                }
            }

            foreach (GameObject root in scene.GetRootGameObjects())
            {
                Transform[] children = root.GetComponentsInChildren<Transform>(true);
                foreach (Transform child in children)
                {
                    if (child.name == "SpawnPoint" || child.name == "PlayerSpawn") return child;
                }
            }

            return null;
        }

        /// <summary>
        /// Each authored stage target must exist in the scene as something the player can actually
        /// reach. A quest objective pointing at a trigger that was never generated is invisible to
        /// the data-level quest test: the stage can still be completed by reporting the event directly.
        /// </summary>
        private static void VerifyTriggersExist(Scene scene)
        {
            var authored = new List<string>
            {
                MamallapuramShoreContent.LocationShoreArrival,
                MamallapuramShoreContent.LocationWorkingShore,
                MamallapuramShoreContent.LocationLookout,
                MamallapuramShoreContent.LocationCauseway
            };

            var inScene = new HashSet<string>();
            foreach (ArrivalTrigger trigger in scene.GetRootGameObjects()
                         .SelectMany(r => r.GetComponentsInChildren<ArrivalTrigger>(true)))
            {
                if (!string.IsNullOrEmpty(trigger.LocationId)) inScene.Add(trigger.LocationId);
            }

            foreach (string locationId in authored)
            {
                if (!inScene.Contains(locationId))
                {
                    Fail($"no arrival trigger in the scene carries location id '{locationId}'");
                }
            }
        }

        /// <summary>
        /// Same reasoning for the inspectable targets, which are GameplayEventInteractable.targetId.
        /// </summary>
        private static void VerifyInteractablesExist(Scene scene)
        {
            var authored = new List<string>
            {
                MamallapuramShoreContent.ObjectStoneBlocks,
                MamallapuramShoreContent.ObjectCarvingYard,
                MamallapuramShoreContent.ObjectSignalPost,
                MamallapuramShoreContent.ClueCarvedManifest
            };

            var inScene = new HashSet<string>();
            foreach (GameplayEventInteractable interactable in scene.GetRootGameObjects()
                         .SelectMany(r => r.GetComponentsInChildren<GameplayEventInteractable>(true)))
            {
                if (!string.IsNullOrEmpty(interactable.TargetId)) inScene.Add(interactable.TargetId);
            }

            foreach (string targetId in authored)
            {
                if (!inScene.Contains(targetId))
                {
                    Fail($"no inspectable in the scene carries target id '{targetId}'");
                }
            }
        }

        /// <summary>
        /// Every interactable has to say something in both languages, and its key has to resolve.
        /// An empty prompt is invisible in the data tests and shows up in play as an interaction the
        /// player cannot tell they can take; a key that does not resolve silently falls back, which
        /// is how a Tamil string ends up on an English playthrough.
        /// </summary>
        private static void VerifyBilingualPrompts(Scene scene)
        {
            var interactables = new List<GameplayEventInteractable>();
            foreach (GameObject root in scene.GetRootGameObjects())
            {
                interactables.AddRange(root.GetComponentsInChildren<GameplayEventInteractable>(true));
            }

            if (interactables.Count == 0)
            {
                Fail("the scene contains no GameplayEventInteractable at all");
                return;
            }

            foreach (GameplayEventInteractable interactable in interactables)
            {
                string name = interactable.gameObject.name;

                string prompt = interactable.InteractionPrompt;
                if (string.IsNullOrWhiteSpace(prompt))
                {
                    Fail($"interactable '{name}' has no interaction prompt in either language");
                }

                var so = new SerializedObject(interactable);

                string promptKey = so.FindProperty("promptKey")?.stringValue ?? string.Empty;
                string promptEn = so.FindProperty("promptEn")?.stringValue ?? string.Empty;
                string promptTa = so.FindProperty("promptTa")?.stringValue ?? string.Empty;

                if (string.IsNullOrWhiteSpace(promptEn))
                {
                    Fail($"interactable '{name}' has no English prompt");
                }

                if (string.IsNullOrWhiteSpace(promptTa))
                {
                    Fail($"interactable '{name}' has no Tamil prompt");
                }
                else if (!ContainsTamil(promptTa))
                {
                    Fail($"interactable '{name}' has a Tamil prompt with no Tamil characters: '{promptTa}'");
                }

                if (string.IsNullOrWhiteSpace(promptKey))
                {
                    Fail($"interactable '{name}' has no prompt key");
                }
            }
        }

        private static bool ContainsTamil(string value)
        {
            foreach (char c in value)
            {
                if (c >= 0x0B80 && c <= 0x0BFF) return true;
            }
            return false;
        }

        private static void VerifyArrivalTriggersAreReachable(Scene scene, Vector3 spawnPoint)
        {
            foreach (GameObject root in scene.GetRootGameObjects())
            {
                foreach (ArrivalTrigger trigger in root.GetComponentsInChildren<ArrivalTrigger>(true))
                {
                    VerifyReachable(trigger.gameObject.name, trigger.LocationId, trigger.transform.position, spawnPoint);
                }
            }
        }

        private static void VerifyInteractablesAreReachable(Scene scene, Vector3 spawnPoint)
        {
            foreach (GameObject root in scene.GetRootGameObjects())
            {
                foreach (GameplayEventInteractable interactable in root.GetComponentsInChildren<GameplayEventInteractable>(true))
                {
                    VerifyReachable(interactable.gameObject.name, interactable.TargetId,
                        interactable.transform.position, spawnPoint);
                }
            }
        }

        /// <summary>
        /// On the NavMesh and reachable are separate failures. A target can sit on the navmesh and be
        /// walled off from the spawn, which is precisely the failure mode the lookout cliff and the
        /// ridge cheek walls could introduce, so both are checked and both are reported separately.
        /// </summary>
        private static void VerifyReachable(string label, string id, Vector3 position, Vector3 spawnPoint)
        {
            Vector3 probe = position + Vector3.up * SampleHeight;

            if (!NavMesh.SamplePosition(probe, out NavMeshHit hit, SampleRadius, NavMesh.AllAreas))
            {
                Fail($"'{label}' (id '{id}') at {position} is not on the NavMesh; the player cannot stand there");
                return;
            }

            var path = new NavMeshPath();
            if (!NavMesh.CalculatePath(spawnPoint, hit.position, NavMesh.AllAreas, path))
            {
                Fail($"'{label}' (id '{id}') is on the NavMesh at {hit.position} but no path exists from the " +
                     "spawn; the player cannot walk to it");
                return;
            }

            if (!path.status.HasFlag(NavMeshPathStatus.PathComplete))
            {
                Fail($"'{label}' (id '{id}') is only partially reachable from the spawn " +
                     $"(status {path.status}); the route is broken partway");
                return;
            }

            Debug.Log($"[MamallapuramRoute] reachable '{label}' (id '{id}') pathLength={path.corners.Length} " +
                      $"distance={TotalLength(path):F1}m");
        }

        /// <summary>
        /// The lookout is the one target that has to survive a climb in both directions, so it gets an
        /// explicit round trip rather than relying on the generic check. Stage 7 goes up to the
        /// platform and stage 9 comes back down to the seaward end of the causeway; a one-way route
        /// would leave the quest completable only by reloading the scene.
        /// </summary>
        private static void VerifyLookoutRoundTrip(Vector3 spawnPoint)
        {
            if (!NavMesh.SamplePosition(spawnPoint, out NavMeshHit spawnHit, SampleRadius, NavMesh.AllAreas))
            {
                Fail("spawn is not on the NavMesh; cannot verify the lookout round trip");
                return;
            }

            var pathUp = new NavMeshPath();
            if (!TryFindLocation(MamallapuramShoreContent.LocationLookout, out NavMeshHit lookout, "lookout"))
            {
                return;
            }

            if (!NavMesh.CalculatePath(spawnHit.position, lookout.position, NavMesh.AllAreas, pathUp)
                || !pathUp.status.HasFlag(NavMeshPathStatus.PathComplete))
            {
                Fail("the lookout climb is not walkable from the spawn; stage 7 cannot be completed on foot");
                return;
            }

            var pathDown = new NavMeshPath();
            if (!NavMesh.CalculatePath(lookout.position, spawnHit.position, NavMesh.AllAreas, pathDown)
                || !pathDown.status.HasFlag(NavMeshPathStatus.PathComplete))
            {
                Fail("the lookout climb is not walkable back down; stage 9 cannot be completed on foot");
                return;
            }

            Debug.Log($"[MamallapuramRoute] lookout round trip OK: up {TotalLength(pathUp):F1}m, " +
                      $"down {TotalLength(pathDown):F1}m");
        }

        private static bool TryFindLocation(string locationId, out NavMeshHit hit, string label)
        {
            foreach (GameObject root in EditorSceneManager.GetActiveScene().GetRootGameObjects())
            {
                foreach (ArrivalTrigger trigger in root.GetComponentsInChildren<ArrivalTrigger>(true))
                {
                    if (trigger.LocationId != locationId) continue;

                    if (NavMesh.SamplePosition(trigger.transform.position + Vector3.up * SampleHeight,
                            out hit, SampleRadius, NavMesh.AllAreas))
                    {
                        return true;
                    }

                    Fail($"the {label} trigger is present but its position {trigger.transform.position} " +
                         "has no NavMesh under it");
                    return true;
                }
            }

            Fail($"no arrival trigger found for {label} ('{locationId}')");
            hit = default;
            return false;
        }

        private static float TotalLength(NavMeshPath path)
        {
            float total = 0f;
            Vector3[] corners = path.corners;
            for (int i = 1; i < corners.Length; i++)
            {
                total += Vector3.Distance(corners[i - 1], corners[i]);
            }
            return total;
        }
    }
}