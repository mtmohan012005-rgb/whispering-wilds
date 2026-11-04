#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;

namespace WhisperingWilds.EditorTools
{
    /// <summary>
    /// Utility to strip orphaned (missing) MonoBehaviour references from the
    /// "--- MANAGERS ---" GameObject hierarchy. Run from the menu
    /// "WhisperingWilds/Cleanup Orphaned Scripts".
    /// </summary>
    public static class CleanupOrphanedScripts
    {
        [MenuItem("WhisperingWilds/Cleanup Orphaned Scripts")]
        public static void CleanSceneManagers()
        {
            GameObject managers = GameObject.Find("--- MANAGERS ---");
            if (managers == null)
            {
                Debug.LogWarning("[Cleanup] '--- MANAGERS ---' GameObject not found in the active scene.");
                return;
            }

            GameObjectUtility.RemoveMonoBehavioursWithMissingScript(managers);
            Debug.Log("[Cleanup] Successfully purged orphaned MonoBehaviour references from '--- MANAGERS ---'.");
        }
    }
}
#endif