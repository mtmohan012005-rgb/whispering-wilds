using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Statistics returned by <see cref="ConvertScene"/> so the caller can log exactly what
    /// was changed instead of asserting "materials fixed".
    /// </summary>
    public struct MaterialUpgradeStats
    {
        /// <summary>Renderers whose material slots now point at an HDRP/Lit material.</summary>
        public int renderersConverted;

        /// <summary>New material assets written to disk under the project's Materials tree.</summary>
        public int materialsCreated;

        /// <summary>Renderers deliberately left alone because they are genuinely unlit (glass, signage glow).</summary>
        public int skippedUnlit;

        /// <summary>Materials that already used an HDRP shader and needed no change.</summary>
        public int alreadyCorrect;
    }

    /// <summary>
    /// Converts importer-generated glTF materials to HDRP/Lit.
    ///
    /// This is the traced root cause of the "black / unlit world" defect, and it is a
    /// shader-assignment problem - not a lighting-brightness problem:
    ///
    /// When Unity imports a .glb it generates materials bound to the glTF Shader Graph.
    /// That graph is authored for the URP Lit sub-target. Running it under HDRP means no
    /// HDRP light ever reaches the surface: the material has no HDRP-compatible lighting
    /// input, so the object receives ambient only and renders effectively black while the
    /// HUD, which is unlit UI, stays perfectly visible. Raising ambient or exposure cannot
    /// fix this because the shading path itself is wrong.
    ///
    /// The fix is to rebind each material's shader to HDRP/Lit and migrate the albedo into
    /// _BaseColor. Note that writing <c>material.color</c> is not sufficient on its own:
    /// <c>color</c> targets the legacy _Color property, whereas HDRP/Lit reads _BaseColor,
    /// so a converted material left on _Color renders with default white albedo.
    ///
    /// Genuinely unlit surfaces (glass, signage, emissive displays) are detected and left
    /// intact - converting them would destroy the effect they exist to produce.
    /// </summary>
    public static class WWMaterialUpgrade
    {
        private const string MaterialRoot = "Assets/_Project/Art/Materials";
        private const string ConvertedRoot = MaterialRoot + "/Converted";

        /// <summary>Shaders that are already correct and must never be rewritten.</summary>
        private static readonly string[] HdrpLitShaders =
        {
            "HDRP/Lit",
            "HDRP/Lit Transparent",
            "HDRP/Lit Unlit",
            "HDRP/Unlit",
            "HDRP/Decal",
            "HDRP/PostProcess",
        };

        /// <summary>Substrings that mark a material as deliberately unlit.</summary>
        private static readonly string[] UnlitMarkers =
        {
            "Unlit", "Glass", "Emissive", "Window", "Signage", "Neon", "Glow", "Lamp",
        };

        /// <summary>
        /// Walks every renderer in the scene and rebinds non-HDRP materials to HDRP/Lit.
        /// Safe to run repeatedly: already-correct materials are skipped, so the conversion
        /// is idempotent and does not accumulate duplicate material assets on re-runs.
        /// </summary>
        public static MaterialUpgradeStats ConvertScene(Scene scene)
        {
            var stats = new MaterialUpgradeStats();
            if (!scene.IsValid() || !scene.isLoaded) return stats;

            // Resolve the HDRP target shader once. If HDRP is not actually active, converting
            // to HDRP/Lit would break a built-in-render-pipeline project, so bail out loudly
            // rather than silently producing magenta.
            Shader lit = Shader.Find("HDRP/Lit");
            if (lit == null)
            {
                Debug.LogError("[WWMaterialUpgrade] Shader 'HDRP/Lit' not found. " +
                               "The project is expected to run HDRP; refusing to convert materials " +
                               "to a shader the pipeline cannot use.");
                return stats;
            }

            EnsureFolder(ConvertedRoot);

            var roots = scene.GetRootGameObjects();
            var seenMaterials = new Dictionary<Material, Material>();

            for (int i = 0; i < roots.Length; i++)
            {
                var renderers = roots[i].GetComponentsInChildren<Renderer>(true);
                for (int r = 0; r < renderers.Length; r++)
                {
                    var renderer = renderers[r];
                    var slots = renderer.sharedMaterials;
                    if (slots == null || slots.Length == 0) continue;

                    bool changed = false;
                    var replaced = new Material[slots.Length];

                    for (int m = 0; m < slots.Length; m++)
                    {
                        var original = slots[m];

                        if (original == null)
                        {
                            replaced[m] = null;
                            continue;
                        }

                        if (IsAlreadyHdrp(original.shader))
                        {
                            stats.alreadyCorrect++;
                            replaced[m] = original;
                            continue;
                        }

                        if (IsIntentionallyUnlit(original))
                        {
                            stats.skippedUnlit++;
                            replaced[m] = original;
                            continue;
                        }

                        Material converted;
                        if (!seenMaterials.TryGetValue(original, out converted))
                        {
                            converted = Convert(original, lit, ref stats);
                            seenMaterials[original] = converted;
                        }

                        replaced[m] = converted;
                        changed = true;
                    }

                    if (changed)
                    {
                        renderer.sharedMaterials = replaced;
                        stats.renderersConverted++;
                    }
                }
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            return stats;
        }

        private static bool IsAlreadyHdrp(Shader shader)
        {
            if (shader == null) return false;
            for (int i = 0; i < HdrpLitShaders.Length; i++)
            {
                if (shader.name == HdrpLitShaders[i]) return true;
            }
            return shader.name.StartsWith("HDRP/");
        }

        private static bool IsIntentionallyUnlit(Material material)
        {
            string shaderName = material.shader != null ? material.shader.name : string.Empty;
            string materialName = material.name ?? string.Empty;

            for (int i = 0; i < UnlitMarkers.Length; i++)
            {
                if (shaderName.IndexOf(UnlitMarkers[i], System.StringComparison.OrdinalIgnoreCase) >= 0) return true;
                if (materialName.IndexOf(UnlitMarkers[i], System.StringComparison.OrdinalIgnoreCase) >= 0) return true;
            }
            return false;
        }

        /// <summary>
        /// Creates an HDRP/Lit material carrying the source albedo, metalness and smoothness.
        /// A new asset is written rather than mutating the imported material in place, because
        /// the imported material belongs to the .glb's importer output and would be
        /// regenerated on the next reimport.
        /// </summary>
        private static Material Convert(Material source, Shader lit, ref MaterialUpgradeStats stats)
        {
            var result = new Material(lit)
            {
                name = source.name + "_HDRPLit"
            };

            // --- Albedo: prefer the importer's base colour, fall back to the legacy _Color
            //     property, and finally to mid-grey so a converted object is never invisible.
            Color albedo = Color.white;
            if (source.HasProperty("_BaseColor"))
            {
                albedo = source.GetColor("_BaseColor");
            }
            else if (source.HasProperty("_Color"))
            {
                albedo = source.GetColor("_Color");
            }

            // glTF importers commonly leave base colour at (1,1,1,1) while the real tint
            // lives in the _BaseMap texture. In that case fall back to white and let the map
            // carry the colour, rather than washing everything out to grey.
            if (albedo.maxColorComponent <= 0.001f)
            {
                albedo = new Color(0.7f, 0.7f, 0.7f, 1f);
            }

            result.SetColor("_BaseColor", albedo);

            // --- Metallic / smoothness. Unity's "Smoothness" is HDRP's metallic/smoothness
            //     workflow _Smoothness; "_Metallic" carries metalness.
            float metallic = source.HasProperty("_Metallic") ? source.GetFloat("_Metallic") : 0f;
            float smoothness = 0.35f;
            if (source.HasProperty("_Smoothness"))
            {
                smoothness = source.GetFloat("_Smoothness");
            }
            else if (source.HasProperty("_Glossiness"))
            {
                // Unity's standard/URP "Glossiness" is inversely related to smoothness.
                smoothness = 1f - source.GetFloat("_Glossiness");
            }

            result.SetFloat("_Metallic", Mathf.Clamp01(metallic));
            result.SetFloat("_Smoothness", Mathf.Clamp01(smoothness));

            // --- Carry the albedo texture across so authored models keep their detail.
            if (source.HasProperty("_BaseMap") && source.GetTexture("_BaseMap") != null)
            {
                result.SetTexture("_BaseMap", source.GetTexture("_BaseMap"));
            }
            else if (source.HasProperty("_MainTex") && source.GetTexture("_MainTex") != null)
            {
                result.SetTexture("_BaseMap", source.GetTexture("_MainTex"));
            }

            // --- Normal map, when the source provided one.
            if (source.HasProperty("_BumpMap") && source.GetTexture("_BumpMap") != null)
            {
                result.SetTexture("_BumpMap", source.GetTexture("_BumpMap"));
                result.EnableKeyword("_NORMALMAP");
            }
            else if (source.HasProperty("_NormalMap") && source.GetTexture("_NormalMap") != null)
            {
                result.SetTexture("_BumpMap", source.GetTexture("_NormalMap"));
                result.EnableKeyword("_NORMALMAP");
            }

            string path = AssetDatabase.GenerateUniqueAssetPath(
                ConvertedRoot + "/" + SanitizeFileName(source.name) + ".mat");

            AssetDatabase.CreateAsset(result, path);
            stats.materialsCreated++;

            // The source material is deliberately left in place. It is an importer-owned
            // sub-asset of the .glb, so removing it would corrupt the model asset and it
            // would simply reappear on the next reimport.

            return result;
        }

        private static string SanitizeFileName(string name)
        {
            if (string.IsNullOrEmpty(name)) return "Material";
            var sb = new System.Text.StringBuilder(name.Length);
            for (int i = 0; i < name.Length; i++)
            {
                char c = name[i];
                sb.Append(char.IsLetterOrDigit(c) || c == '_' || c == '-' ? c : '_');
            }
            return sb.ToString();
        }

        private static void EnsureFolder(string folder)
        {
            if (string.IsNullOrEmpty(folder)) return;

            // Defensive: AssetDatabase wants forward slashes on every platform.
            folder = folder.Replace('\\', '/');
            if (AssetDatabase.IsValidFolder(folder)) return;

            string[] parts = folder.Split('/');
            string current = parts[0]; // "Assets"
            for (int i = 1; i < parts.Length; i++)
            {
                string next = current + "/" + parts[i];
                if (!AssetDatabase.IsValidFolder(next))
                {
                    AssetDatabase.CreateFolder(current, parts[i]);
                }
                current = next;
            }
        }
    }
}
