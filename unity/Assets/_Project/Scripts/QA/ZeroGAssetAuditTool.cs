#if UNITY_EDITOR
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace WhisperingWilds.QA
{
    /// <summary>
    /// Static audit of zero-g / antigravity-ready assets under Art/Models.
    ///
    /// Path note: the Step 10 brief asks for this file at Scripts/QA/. That folder is
    /// inside the player assembly, so the whole body is guarded by UNITY_EDITOR. Moving it
    /// to an Editor/ folder would also work, but keeping the requested path avoids
    /// relocating code the brief named explicitly.
    ///
    /// Path correctness note: this uses AssetDatabase.FindAssets rather than
    /// Directory.GetFiles + Path.GetFileName. The models live in per-region
    /// subfolders (chennai/, chettinad/, delta/, mamallapuram/, wildlife/), and
    /// flattening to a bare filename makes every lookup miss, which produces an audit
    /// that silently reports "clean" for every asset. That failure mode is worse than
    /// no audit at all.
    ///
    /// Report location note: the report is written OUTSIDE the tracked repository so
    /// QA output never lands in Git.
    /// </summary>
    public static class ZeroGAssetAuditTool
    {
        private const float MinMassKg = 0.1f;
        private const float MaxMassKg = 5000f;
        private const string ModelsRoot = "Assets/_Project/Art/Models";
        private const string InteractableTag = "Interactable";

        /// <summary>Tags the project must define for zero-g to function.</summary>
        private static readonly string[] RequiredTags = { InteractableTag, "Player" };

        /// <summary>
        /// Authoritative tag check.
        ///
        /// CompareTag against a missing tag does not throw; it logs an error and returns
        /// false. Any code that infers "the tag is missing" from a CompareTag result is
        /// therefore unreliable, both at runtime and in a player build. InternalEditorUtility.tags
        /// is the real list, so this is what the audit reports.
        ///
        /// A missing tag is not cosmetic: with no Interactable tag, zero-g fields silently
        /// admit zero bodies while still looking like a working scene.
        /// </summary>
        [MenuItem("Tools/Zero-G Asset Audit/Validate Tags")]
        public static void ValidateRequiredTags()
        {
            Debug.Log("[ZeroGAssetAudit] Project dataPath: " + Application.dataPath);

            string tagFile = System.IO.Path.Combine(
                System.IO.Directory.GetParent(Application.dataPath).FullName,
                "ProjectSettings/TagManager.asset");

            Debug.Log("[ZeroGAssetAudit] TagManager path: " + tagFile
                      + " exists=" + System.IO.File.Exists(tagFile));

            if (System.IO.File.Exists(tagFile))
            {
                Debug.Log("[ZeroGAssetAudit] Raw tags section: "
                          + System.IO.File.ReadAllText(tagFile).Replace("\r\n", " / ").Substring(0, 160));
            }

            var loaded = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset");
            Debug.Log("[ZeroGAssetAudit] AssetDatabase objects for TagManager: " + loaded.Length);

            // Authoritative read: the deserialized ProjectSettings object itself.
            for (int i = 0; i < loaded.Length; i++)
            {
                var so = new SerializedObject(loaded[i]);
                var tagsProp = so.FindProperty("tags");
                if (tagsProp == null) continue;

                var sb = new System.Text.StringBuilder();
                sb.Append("[ZeroGAssetAudit] SerializedObject tags (").Append(tagsProp.arraySize).Append("): ");
                for (int t = 0; t < tagsProp.arraySize; t++)
                {
                    sb.Append(tagsProp.GetArrayElementAtIndex(t).stringValue).Append(", ");
                }
                Debug.Log(sb.ToString());
            }

            var defined = new HashSet<string>(UnityEditorInternal.InternalEditorUtility.tags, StringComparer.Ordinal);

            Debug.Log("[ZeroGAssetAudit] All tags visible to the editor (" + defined.Count + "): "
                      + string.Join(", ", defined));

            for (int i = 0; i < RequiredTags.Length; i++)
            {
                string tag = RequiredTags[i];
                bool ok = defined.Contains(tag);
                Debug.Log($"[ZeroGAssetAudit] Tag '{tag}': {(ok ? "DEFINED" : "MISSING")}");

                if (!ok)
                {
                    Debug.LogError(
                        $"[ZeroGAssetAudit] Tag '{tag}' is missing from ProjectSettings/TagManager.asset. " +
                        "Add it under the 'tags:' list; note that the key must stay indented under TagManager.");
                }
            }
        }

        public enum Severity
        {
            Info,
            Warning,
            Error
        }

        private struct Issue
        {
            public string assetPath;
            public string objectName;
            public Severity severity;
            public string message;
        }

        [MenuItem("Tools/Zero-G Asset Audit")]
        public static void RunFromMenu()
        {
            string path = RunAudit();
            Debug.Log($"[ZeroGAssetAudit] Report written to: {path}");
        }

        /// <summary>Returns the absolute path of the report it wrote.</summary>
        public static string RunAudit()
        {
            var issues = new List<Issue>();
            int modelsScanned = 0;

            string[] guids = AssetDatabase.FindAssets("t:Model", new[] { ModelsRoot });
            Array.Sort(guids, StringComparer.Ordinal);

            for (int i = 0; i < guids.Length; i++)
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(guids[i]);
                if (!IsModelFile(assetPath)) continue;

                modelsScanned++;
                InspectModel(assetPath, issues);
            }

            string reportPath = ResolveReportPath();
            File.WriteAllText(reportPath, BuildReport(modelsScanned, issues), new UTF8Encoding(false));
            return reportPath;
        }

        private static bool IsModelFile(string path)
        {
            if (string.IsNullOrEmpty(path)) return false;
            string ext = Path.GetExtension(path).ToLowerInvariant();
            return ext == ".glb" || ext == ".gltf";
        }

        private static void InspectModel(string assetPath, List<Issue> issues)
        {
            GameObject root = AssetDatabase.LoadAssetAtPath<GameObject>(assetPath);
            if (root == null)
            {
                issues.Add(new Issue
                {
                    assetPath = assetPath,
                    objectName = Path.GetFileNameWithoutExtension(assetPath),
                    severity = Severity.Error,
                    message = "Model asset could not be loaded."
                });
                return;
            }

            string name = Path.GetFileNameWithoutExtension(assetPath);

            Collider[] colliders = root.GetComponentsInChildren<Collider>(true);
            Rigidbody[] bodies = root.GetComponentsInChildren<Rigidbody>(true);

            // Tags are assigned on scene instances, not on imported model assets, so a
            // static asset audit cannot observe the Interactable tag. It is reported
            // explicitly rather than guessed, and the ERROR rules below are applied to
            // assets that ARE authored as interactable (detected via an Interactable
            // marker child or an explicit opt-out below).
            bool authoredInteractive = IsAuthoredInteractive(root);

            if (!authoredInteractive)
            {
                issues.Add(new Issue
                {
                    assetPath = assetPath,
                    objectName = name,
                    severity = Severity.Info,
                    message = colliders.Length == 0
                        ? "Non-interactive prop: no collider. Expected; not an error."
                        : "Non-interactive prop: collider present, no physics required."
                });
                return;
            }

            if (bodies.Length == 0)
            {
                issues.Add(new Issue
                {
                    assetPath = assetPath,
                    objectName = name,
                    severity = Severity.Error,
                    message = "Interactable asset has no Rigidbody; it cannot float."
                });
            }

            if (colliders.Length == 0)
            {
                issues.Add(new Issue
                {
                    assetPath = assetPath,
                    objectName = name,
                    severity = Severity.Error,
                    message = "Interactable asset has no Collider; it cannot be detected by the zone trigger."
                });
            }

            for (int b = 0; b < bodies.Length; b++)
            {
                Rigidbody rb = bodies[b];
                float mass = rb.mass;

                // IsKinematic bodies never respond to the field, so mass is not meaningful.
                if (rb.isKinematic) continue;

                if (float.IsNaN(mass) || float.IsInfinity(mass))
                {
                    issues.Add(new Issue
                    {
                        assetPath = assetPath,
                        objectName = name + "/" + rb.name,
                        severity = Severity.Error,
                        message = "Rigidbody mass is not a finite number."
                    });
                }
                else if (mass < MinMassKg || mass > MaxMassKg)
                {
                    issues.Add(new Issue
                    {
                        assetPath = assetPath,
                        objectName = name + "/" + rb.name,
                        severity = Severity.Warning,
                        message = string.Format(
                            CultureInfo.InvariantCulture,
                            "Mass {0:0.###} kg outside expected range {1}-{2} kg.",
                            mass, MinMassKg, MaxMassKg)
                    });
                }
            }
        }

        /// <summary>
        /// A model counts as authored-interactive when it contains a child explicitly
        /// named as an interactable marker. Deliberately explicit so the audit never
        /// invents interactivity.
        /// </summary>
        private static bool IsAuthoredInteractive(GameObject root)
        {
            Transform[] all = root.GetComponentsInChildren<Transform>(true);
            for (int i = 0; i < all.Length; i++)
            {
                if (all[i].name == "Interactable") return true;
            }
            return false;
        }

        /// <summary>
        /// Report path is deliberately outside the repository. Override with
        /// WW_AUDIT_REPORT_PATH for automation.
        /// </summary>
        private static string ResolveReportPath()
        {
            string overridePath = Environment.GetEnvironmentVariable("WW_AUDIT_REPORT_PATH");
            if (!string.IsNullOrEmpty(overridePath)) return overridePath;

            string dir = Path.Combine(Path.GetTempPath(), "WhisperingWilds-QA", "step10");
            Directory.CreateDirectory(dir);
            return Path.Combine(dir, "ASSET_AUDIT_REPORT.json");
        }

        private static string BuildReport(int modelsScanned, List<Issue> issues)
        {
            int errors = 0, warnings = 0, infos = 0;
            for (int i = 0; i < issues.Count; i++)
            {
                switch (issues[i].severity)
                {
                    case Severity.Error: errors++; break;
                    case Severity.Warning: warnings++; break;
                    default: infos++; break;
                }
            }

            var sb = new StringBuilder(4096);
            sb.Append("{\n");
            sb.Append("  \"generatedUtc\": \"").Append(DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture)).Append("\",\n");
            sb.Append("  \"modelsRoot\": \"").Append(ModelsRoot).Append("\",\n");
            sb.Append("  \"modelsScanned\": ").Append(modelsScanned).Append(",\n");
            sb.Append("  \"interactableTag\": \"").Append(InteractableTag).Append("\",\n");
            sb.Append("  \"massRangeKg\": { \"min\": ").Append(MinMassKg.ToString("0.###", CultureInfo.InvariantCulture))
              .Append(", \"max\": ").Append(MaxMassKg.ToString("0.###", CultureInfo.InvariantCulture)).Append(" },\n");
            sb.Append("  \"summary\": { \"errors\": ").Append(errors)
              .Append(", \"warnings\": ").Append(warnings)
              .Append(", \"info\": ").Append(infos).Append(" },\n");
            sb.Append("  \"notes\": [\n");
            sb.Append("    \"Tags are assigned on scene instances, not on imported model assets, so interactivity cannot be observed statically. A model is treated as authored-interactive only when it contains a child transform named 'Interactable'.\",\n");
            sb.Append("    \"Absence of an 'Interactable' marker is reported as Info, never as an error.\"\n");
            sb.Append("  ],\n");
            sb.Append("  \"issues\": [\n");

            for (int i = 0; i < issues.Count; i++)
            {
                Issue issue = issues[i];
                sb.Append("    { \"asset\": \"").Append(Escape(issue.assetPath))
                  .Append("\", \"object\": \"").Append(Escape(issue.objectName))
                  .Append("\", \"severity\": \"").Append(issue.severity.ToString().ToLowerInvariant())
                  .Append("\", \"message\": \"").Append(Escape(issue.message)).Append("\" }");
                sb.Append(i < issues.Count - 1 ? ",\n" : "\n");
            }

            sb.Append("  ]\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        private static string Escape(string value)
        {
            if (string.IsNullOrEmpty(value)) return string.Empty;
            return value.Replace("\\", "\\\\").Replace("\"", "\\\"");
        }
    }
}
#endif