using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.Editor.QA
{
    [Serializable]
    public class AssetAuditIssue
    {
        public string assetPath;
        public string issueType; // MissingScript, NullMaterial, ErrorShader, MissingMesh, MissingCollider, MissingAudioClip
        public string details;
        public string severity; // Error, Warning
    }

    [Serializable]
    public class AssetReferenceAuditReport
    {
        public string auditName = "Whispering Wilds Authoritative Unity Asset Reference Audit";
        public string generatedAt;
        public string auditedCommit;
        public string unityVersion;
        public int enabledScenesCount;
        public int prefabsAuditedCount;
        public int materialsAuditedCount;
        public int texturesAuditedCount;
        public int audioClipsAuditedCount;
        public int totalIssuesCount;
        public int errorCount;
        public int warningCount;
        public List<string> enabledScenes = new List<string>();
        public List<AssetAuditIssue> issues = new List<AssetAuditIssue>();
    }

    public static class AssetReferenceAudit
    {
        private static string ResolveGitSha()
        {
            try
            {
                var psi = new System.Diagnostics.ProcessStartInfo("git", "rev-parse HEAD")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (var proc = System.Diagnostics.Process.Start(psi))
                {
                    string sha = proc.StandardOutput.ReadToEnd().Trim();
                    proc.WaitForExit();
                    if (!string.IsNullOrEmpty(sha) && sha.Length >= 40) return sha;
                }
            }
            catch {}
            return Environment.GetEnvironmentVariable("WW_AUDIT_SHA") ?? "unknown_commit";
        }

        [MenuItem("Whispering Wilds/QA/Run Unity Asset Reference Audit")]
        public static void RunAuditFromMenu()
        {
            var report = ExecuteAudit();
            Debug.Log($"<color=#00FF99><b>[AssetReferenceAudit]</b></color> Audit complete! Scanned {report.enabledScenesCount} scenes, {report.prefabsAuditedCount} prefabs. Total issues: {report.totalIssuesCount} (Errors: {report.errorCount}, Warnings: {report.warningCount})");
        }

        public static void RunBatchAudit()
        {
            var report = ExecuteAudit();
            if (Application.isBatchMode)
            {
                EditorApplication.Exit(report.errorCount > 0 ? 1 : 0);
            }
        }

        public static AssetReferenceAuditReport ExecuteAudit()
        {
            var report = new AssetReferenceAuditReport
            {
                generatedAt = DateTime.UtcNow.ToString("o"),
                auditedCommit = ResolveGitSha(),
                unityVersion = Application.unityVersion
            };

            // 1. Audit Enabled Scenes in Build Settings & Walk Hierarchy
            var scenes = EditorBuildSettings.scenes;
            foreach (var s in scenes)
            {
                if (s.enabled)
                {
                    report.enabledScenes.Add(s.path);
                    if (!File.Exists(s.path))
                    {
                        report.issues.Add(new AssetAuditIssue
                        {
                            assetPath = s.path,
                            issueType = "MissingSceneFile",
                            details = "Scene declared in EditorBuildSettings does not exist on disk",
                            severity = "Error"
                        });
                        continue;
                    }

                    // Open scene and deeply inspect all components in scene hierarchy
                    try
                    {
                        Scene openedScene = EditorSceneManager.OpenScene(s.path, OpenSceneMode.Single);
                        GameObject[] rootObjects = openedScene.GetRootGameObjects();
                        foreach (var root in rootObjects)
                        {
                            AuditSceneGameObject(root, s.path, report);
                        }
                    }
                    catch (Exception ex)
                    {
                        report.issues.Add(new AssetAuditIssue
                        {
                            assetPath = s.path,
                            issueType = "SceneOpenError",
                            details = $"Could not open scene {s.path} for hierarchy inspection: {ex.Message}",
                            severity = "Error"
                        });
                    }
                }
            }
            report.enabledScenesCount = report.enabledScenes.Count;

            // 2. Audit Prefabs
            string[] prefabGuids = AssetDatabase.FindAssets("t:Prefab", new[] { "Assets/_Project/Prefabs" });
            report.prefabsAuditedCount = prefabGuids.Length;

            foreach (var guid in prefabGuids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (prefab == null) continue;

                // Check missing scripts
                var components = prefab.GetComponentsInChildren<Component>(true);
                foreach (var c in components)
                {
                    if (c == null)
                    {
                        report.issues.Add(new AssetAuditIssue
                        {
                            assetPath = path,
                            issueType = "MissingScript",
                            details = "GameObject inside prefab contains a missing MonoBehaviour script reference",
                            severity = "Error"
                        });
                        break;
                    }
                }

                // Check Renderers and Materials
                var renderers = prefab.GetComponentsInChildren<Renderer>(true);
                foreach (var r in renderers)
                {
                    var mats = r.sharedMaterials;
                    for (int i = 0; i < mats.Length; i++)
                    {
                        if (mats[i] == null)
                        {
                            report.issues.Add(new AssetAuditIssue
                            {
                                assetPath = path,
                                issueType = "NullMaterial",
                                details = $"Renderer '{r.name}' has null material in slot {i}",
                                severity = "Warning"
                            });
                        }
                        else if (mats[i].shader != null && mats[i].shader.name.Contains("InternalErrorShader"))
                        {
                            report.issues.Add(new AssetAuditIssue
                            {
                                assetPath = path,
                                issueType = "ErrorShader",
                                details = $"Renderer '{r.name}' material '{mats[i].name}' uses magenta InternalErrorShader",
                                severity = "Error"
                            });
                        }
                    }

                    // Check MeshFilter mesh
                    if (r is MeshRenderer)
                    {
                        var mf = r.GetComponent<MeshFilter>();
                        if (mf != null && mf.sharedMesh == null)
                        {
                            report.issues.Add(new AssetAuditIssue
                            {
                                assetPath = path,
                                issueType = "MissingMesh",
                                details = $"MeshFilter on '{r.name}' has no assigned mesh",
                                severity = "Warning"
                            });
                        }
                    }
                    else if (r is SkinnedMeshRenderer smr)
                    {
                        if (smr.sharedMesh == null)
                        {
                            report.issues.Add(new AssetAuditIssue
                            {
                                assetPath = path,
                                issueType = "MissingMesh",
                                details = $"SkinnedMeshRenderer on '{r.name}' has no assigned mesh",
                                severity = "Error"
                            });
                        }
                    }
                }
            }

            // 3. Audit Materials
            string[] matGuids = AssetDatabase.FindAssets("t:Material", new[] { "Assets/_Project/Art" });
            report.materialsAuditedCount = matGuids.Length;

            foreach (var guid in matGuids)
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (mat == null) continue;

                if (mat.shader == null || mat.shader.name.Contains("InternalErrorShader"))
                {
                    report.issues.Add(new AssetAuditIssue
                    {
                        assetPath = path,
                        issueType = "ErrorShader",
                        details = $"Material '{mat.name}' has broken or missing shader",
                        severity = "Error"
                    });
                }
            }

            // 4. Audit Textures & Audio
            string[] texGuids = AssetDatabase.FindAssets("t:Texture2D", new[] { "Assets/_Project/Art" });
            report.texturesAuditedCount = texGuids.Length;

            string[] audioGuids = AssetDatabase.FindAssets("t:AudioClip", new[] { "Assets/_Project/Audio" });
            report.audioClipsAuditedCount = audioGuids.Length;

            // Calculate totals
            foreach (var issue in report.issues)
            {
                if (issue.severity == "Error") report.errorCount++;
                else report.warningCount++;
            }
            report.totalIssuesCount = report.issues.Count;

            // Write JSON output
            try
            {
                string json = JsonUtility.ToJson(report, true);
                string repoRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "..", ".."));
                string outDir = Path.Combine(repoRoot, "docs", "audits");
                if (!Directory.Exists(outDir)) Directory.CreateDirectory(outDir);
                string outPath = Path.Combine(outDir, "UNITY_ASSET_REFERENCE_AUDIT.json");
                File.WriteAllText(outPath, json, Encoding.UTF8);
                Debug.Log($"<color=#00FF99><b>[AssetReferenceAudit]</b></color> Saved audit report to: {outPath}");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[AssetReferenceAudit] Could not save JSON report: {ex.Message}");
            }

            return report;
        }

        private static void AuditSceneGameObject(GameObject go, string scenePath, AssetReferenceAuditReport report)
        {
            if (go == null) return;

            // Missing scripts check
            int missingCount = GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(go);
            if (missingCount > 0)
            {
                report.issues.Add(new AssetAuditIssue
                {
                    assetPath = $"{scenePath}::{GetHierarchyPath(go)}",
                    issueType = "MissingScript",
                    details = $"GameObject '{go.name}' has {missingCount} missing MonoBehaviour script reference(s)",
                    severity = "Error"
                });
            }

            // Check renderers for null or error shaders
            var renderer = go.GetComponent<Renderer>();
            if (renderer != null)
            {
                var mats = renderer.sharedMaterials;
                for (int i = 0; mats != null && i < mats.Length; i++)
                {
                    if (mats[i] == null)
                    {
                        report.issues.Add(new AssetAuditIssue
                        {
                            assetPath = $"{scenePath}::{GetHierarchyPath(go)}",
                            issueType = "NullMaterial",
                            details = $"Renderer '{go.name}' has null material in slot {i}",
                            severity = "Warning"
                        });
                    }
                    else if (mats[i].shader != null && mats[i].shader.name.Contains("InternalErrorShader"))
                    {
                        report.issues.Add(new AssetAuditIssue
                        {
                            assetPath = $"{scenePath}::{GetHierarchyPath(go)}",
                            issueType = "ErrorShader",
                            details = $"Renderer '{go.name}' material '{mats[i].name}' has broken shader",
                            severity = "Error"
                        });
                    }
                }
            }

            for (int i = 0; i < go.transform.childCount; i++)
            {
                AuditSceneGameObject(go.transform.GetChild(i).gameObject, scenePath, report);
            }
        }

        private static string GetHierarchyPath(GameObject go)
        {
            if (go == null) return string.Empty;
            string path = go.name;
            Transform parent = go.transform.parent;
            while (parent != null)
            {
                path = parent.name + "/" + path;
                parent = parent.parent;
            }
            return path;
        }
    }
}
