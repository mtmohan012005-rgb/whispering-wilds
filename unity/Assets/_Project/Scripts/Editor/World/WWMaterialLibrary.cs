using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Creates and caches shared HDRP/Lit materials for authored scene geometry.
    ///
    /// Two problems this exists to prevent:
    ///
    /// 1. Inline <c>new Material(...)</c> per renderer creates a distinct material instance
    ///    per object. That breaks batching, bloats memory, and - worse - makes it impossible
    ///    to retune a surface later, because there is no single asset to edit. Everything
    ///    here is written to disk once and then shared.
    ///
    /// 2. Assigning <c>material.color</c> on an HDRP/Lit material silently does nothing
    ///    visually: <c>color</c> targets the legacy _Color property, while HDRP/Lit reads
    ///    _BaseColor. Every setter here writes _BaseColor explicitly.
    /// </summary>
    public static class WWMaterialLibrary
    {
        private const string MaterialRoot = "Assets/_Project/Art/Materials";

        private static readonly Dictionary<string, Material> Cache = new Dictionary<string, Material>();

        private static Shader _litShader;
        private static Shader _LitShader
        {
            get
            {
                if (_litShader == null)
                {
                    _litShader = Shader.Find("HDRP/Lit");
                    if (_litShader == null)
                    {
                        Debug.LogError("[WWMaterialLibrary] Shader 'HDRP/Lit' not found. " +
                                       "This project runs HDRP; cannot author lit materials.");
                    }
                }
                return _litShader;
            }
        }

        /// <summary>
        /// Returns a shared HDRP/Lit material at <paramref name="assetPath"/>, creating it on
        /// first use. If the asset already exists it is loaded and its colour/metallic/smoothness
        /// values are applied, so re-running scene assembly is idempotent and does not spawn
        /// <c>Material 1</c>, <c>Material 2</c>, ... duplicates.
        /// </summary>
        /// <param name="assetPath">Project-relative path, e.g. "Assets/_Project/Art/Materials/Chennai/Wall.mat".</param>
        /// <param name="albedo">Base colour written to _BaseColor (linear space).</param>
        /// <param name="metallic">0 = dielectric, 1 = metal.</param>
        /// <param name="smoothness">0 = fully rough, 1 = mirror.</param>
        public static Material Lit(string assetPath, Color albedo, float metallic, float smoothness)
        {
            if (string.IsNullOrEmpty(assetPath)) assetPath = MaterialRoot + "/DefaultLit.mat";

            Material cached;
            if (Cache.TryGetValue(assetPath, out cached) && cached != null)
            {
                ApplyLit(cached, albedo, metallic, smoothness);
                return cached;
            }

            var existing = AssetDatabase.LoadAssetAtPath<Material>(assetPath);
            if (existing != null)
            {
                ApplyLit(existing, albedo, metallic, smoothness);
                EditorUtility.SetDirty(existing);
                Cache[assetPath] = existing;
                return existing;
            }

            Shader shader = _LitShader;
            if (shader == null) return null;

            var created = new Material(shader)
            {
                name = System.IO.Path.GetFileNameWithoutExtension(assetPath)
            };
            ApplyLit(created, albedo, metallic, smoothness);

            EnsureAssetFolder(System.IO.Path.GetDirectoryName(assetPath));
            AssetDatabase.CreateAsset(created, assetPath);

            Cache[assetPath] = created;
            return created;
        }

        /// <summary>Convenience overload for the common dielectric case.</summary>
        public static Material Lit(string assetPath, Color albedo)
        {
            return Lit(assetPath, albedo, 0f, 0.35f);
        }

        /// <summary>Writes the HDRP property names, never the legacy ones.</summary>
        private static void ApplyLit(Material m, Color albedo, float metallic, float smoothness)
        {
            if (m == null) return;

            if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", albedo);
            if (m.HasProperty("_Metallic")) m.SetFloat("_Metallic", Mathf.Clamp01(metallic));
            if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", Mathf.Clamp01(smoothness));

            // Keep the legacy property in sync too, so a renderer that still reads _Color
            // (an unconverted glTF material, for instance) does not render pure white.
            if (m.HasProperty("_Color")) m.SetColor("_Color", albedo);
        }

        /// <summary>Clears the in-memory cache. Used by tests and by scene rebuilds.</summary>
        public static void ClearCache()
        {
            Cache.Clear();
            _litShader = null;
        }

        private static void EnsureAssetFolder(string folder)
        {
            if (string.IsNullOrEmpty(folder)) return;

            // AssetDatabase paths are always forward-slash, but System.IO.Path.GetDirectoryName
            // returns backslashes on Windows. Normalise before splitting, otherwise the whole
            // path arrives as one element, the loop never runs, and CreateAsset fails with
            // "Parent directory must exist".
            folder = folder.Replace('\\', '/');

            if (folder.StartsWith("Assets") == false) return;
            if (AssetDatabase.IsValidFolder(folder)) return;

            string[] parts = folder.Split('/');
            string current = parts[0];
            for (int i = 1; i < parts.Length; i++)
            {
                string next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                {
                    string created = AssetDatabase.CreateFolder(current, parts[i]);
                    if (string.IsNullOrEmpty(created))
                    {
                        Debug.LogError("[WWMaterialLibrary] failed to create folder '" + next +
                                       "' while preparing material assets.");
                        return;
                    }
                }
                current = next;
            }
        }
    }
}
