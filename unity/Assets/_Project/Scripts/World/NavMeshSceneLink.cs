using UnityEngine;
using UnityEngine.AI;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Registers a baked static NavMesh into the running scene.
    ///
    /// Unity's built-in AI module bakes NavMeshData into a project asset (see
    /// EcologyNavMeshBaker), but the editor's scene-level NavMeshSettings object is internal
    /// and cannot be reliably written from script. A NavMeshAgent only finds surfaces that have
    /// been added to the active NavMesh, so this component holds the asset reference and calls
    /// NavMesh.AddNavMeshData on load. This is the documented way to ship baked data without the
    /// com.unity.ai.navigation authoring package.
    /// </summary>
    [DisallowMultipleComponent]
    public class NavMeshSceneLink : MonoBehaviour
    {
        [Tooltip("Baked NavMeshData asset for this scene.")]
        [SerializeField] private NavMeshData navMeshData;

        [Tooltip("Log a warning when no NavMesh is present (development only).")]
        [SerializeField] private bool warnWhenMissing = true;

        private NavMeshDataInstance instance;
        private bool registered;

        /// <summary>True when this scene has a NavMesh actually registered with the engine.</summary>
        public bool IsNavMeshRegistered => registered;

        /// <summary>
        /// True when the engine has any usable NavMesh geometry in this scene. Used by tests to
        /// prove agents are pathing on real surfaces rather than falling back to transform motion.
        /// </summary>
        public bool HasUsableNavMesh => registered && NavMesh.CalculateTriangulation().indices.Length > 0;

        private void Awake()
        {
            Register();
        }

        private void OnDestroy()
        {
            Unregister();
        }

        private void Register()
        {
            if (registered)
            {
                return;
            }

            if (navMeshData == null)
            {
                if (warnWhenMissing && Debug.isDebugBuild)
                {
                    Debug.LogWarning($"[NavMeshSceneLink] {name}: no baked NavMeshData assigned; " +
                                     "agents will not path.", this);
                }
                return;
            }

            instance = NavMesh.AddNavMeshData(navMeshData);
            registered = instance.valid;
        }

        private void Unregister()
        {
            if (!registered)
            {
                return;
            }

            instance.Remove();
            registered = false;
        }

#if UNITY_EDITOR
        /// <summary>Editor-only hook used by the scene assembly scripts.</summary>
        public void SetNavMeshData(NavMeshData data)
        {
            if (registered)
            {
                Unregister();
            }

            navMeshData = data;
        }
#endif
    }
}
