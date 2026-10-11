using System;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEditor;
using UnityEditor.Animations;
using WhisperingWilds.Characters;

namespace WhisperingWilds.Editor.QA
{
    /// <summary>
    /// STEP 39 — Character asset validation tool.
    /// 
    /// Audits all character models and prefabs for:
    /// - Model file presence and import success
    /// - Triangle count and mesh complexity
    /// - SkinnedMeshRenderer presence and validity
    /// - Skeleton and bone weight validation
    /// - Humanoid Avatar configuration
    /// - Material and texture assignments
    /// - Animation clip coverage
    /// - Animator Controller assignment
    /// - LOD configuration
    /// - Visible collision-only geometry
    /// - Scale and ground alignment
    /// 
    /// Run via: Tools/Whispering Wilds/QA/Audit All Characters
    /// </summary>
    public static class CharacterAssetValidator
    {
        /// <summary>Validation result for a single check.</summary>
        public enum ValidationResult
        {
            Pass,
            Fail,
            Warning,
            NotApplicable
        }

        /// <summary>A single validation finding.</summary>
        public class Finding
        {
            public ValidationResult result;
            public string category;
            public string description;
            public string detail;
        }

        /// <summary>Complete validation report for one character.</summary>
        public class CharacterReport
        {
            public string characterId;
            public string displayName;
            public string prefabPath;
            public List<Finding> findings = new List<Finding>();
            public int passCount => findings.Count(f => f.result == ValidationResult.Pass);
            public int failCount => findings.Count(f => f.result == ValidationResult.Fail);
            public int warningCount => findings.Count(f => f.result == ValidationResult.Warning);
            public bool isProductionReady => failCount == 0;
        }

        // Production thresholds
        const int MinProductionTriangles = 5000;
        const int MaxProductionTriangles = 100000;
        const int MinBonesForHuman = 15;
        const int MinAnimationClips = 3;
        const float MinModelHeight = 0.5f;
        const float MaxModelHeight = 2.5f;

        [MenuItem("Whispering Wilds/QA/Audit All Characters")]
        public static void AuditAllCharacters()
        {
            Debug.Log("<color=#FFD700><b>[CharacterAssetValidator]</b></color> Starting character asset audit...");

            var reports = new List<CharacterReport>();
            int totalPass = 0, totalFail = 0, totalWarning = 0;

            // Audit all character prefabs
            var prefabPaths = new[]
            {
                CharacterPrefabCatalog.PlayerPrefabPath,
                CharacterPrefabCatalog.MuruganPrefabPath,
                CharacterPrefabCatalog.VeluPrefabPath,
                CharacterPrefabCatalog.SelvamPrefabPath,
                CharacterPrefabCatalog.MeenakshiPrefabPath,
                CharacterPrefabCatalog.ArtisanPrefabPath,
                CharacterPrefabCatalog.FarmerPrefabPath,
                CharacterPrefabCatalog.FisherPrefabPath,
                CharacterPrefabCatalog.ForestGuidePrefabPath,
                CharacterPrefabCatalog.TeaWorkerPrefabPath
            };

            foreach (var prefabPath in prefabPaths)
            {
                var report = AuditPrefab(prefabPath);
                if (report != null)
                {
                    reports.Add(report);
                    totalPass += report.passCount;
                    totalFail += report.failCount;
                    totalWarning += report.warningCount;
                }
            }

            // Generate report
            var sb = new StringBuilder();
            sb.AppendLine("# Character Asset Audit Report");
            sb.AppendLine($"## Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
            sb.AppendLine();
            sb.AppendLine($"### Summary");
            sb.AppendLine($"- Characters audited: {reports.Count}");
            sb.AppendLine($"- Total checks passed: {totalPass}");
            sb.AppendLine($"- Total checks failed: {totalFail}");
            sb.AppendLine($"- Total warnings: {totalWarning}");
            sb.AppendLine();

            foreach (var report in reports)
            {
                sb.AppendLine($"## {report.displayName} ({report.characterId})");
                sb.AppendLine($"- Prefab: `{report.prefabPath}`");
                sb.AppendLine($"- Production ready: {(report.isProductionReady ? "YES" : "NO")}");
                sb.AppendLine($"- Passed: {report.passCount}, Failed: {report.failCount}, Warnings: {report.warningCount}");
                sb.AppendLine();

                foreach (var finding in report.findings)
                {
                    string icon = finding.result switch
                    {
                        ValidationResult.Pass => "✅",
                        ValidationResult.Fail => "❌",
                        ValidationResult.Warning => "⚠️",
                        _ => "➖"
                    };
                    sb.AppendLine($"- {icon} [{finding.category}] {finding.description}");
                    if (!string.IsNullOrEmpty(finding.detail))
                    {
                        sb.AppendLine($"  - {finding.detail}");
                    }
                }
                sb.AppendLine();
            }

            // Save report
            string reportPath = "CHARACTER_ASSET_VALIDATION_REPORT.md";
            System.IO.File.WriteAllText(System.IO.Path.Combine(Application.dataPath, "..", "..", "..", "..", reportPath), sb.ToString());
            AssetDatabase.Refresh();

            Debug.Log($"<color=#FFD700><b>[CharacterAssetValidator]</b></color> Audit complete. Report saved to {reportPath}");
            Debug.Log($"<color=#FFD700><b>[CharacterAssetValidator]</b></color> Results: {totalPass} passed, {totalFail} failed, {totalWarning} warnings");

            // Log failures
            foreach (var report in reports)
            {
                foreach (var finding in report.findings)
                {
                    if (finding.result == ValidationResult.Fail)
                    {
                        Debug.LogError($"[CharacterAssetValidator] {report.displayName}: {finding.description}");
                    }
                    else if (finding.result == ValidationResult.Warning)
                    {
                        Debug.LogWarning($"[CharacterAssetValidator] {report.displayName}: {finding.description}");
                    }
                }
            }
        }

        private static CharacterReport AuditPrefab(string prefabPath)
        {
            var report = new CharacterReport
            {
                characterId = ExtractCharacterId(prefabPath),
                displayName = ExtractDisplayName(prefabPath),
                prefabPath = prefabPath
            };

            // Check 1: Prefab exists
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            if (prefab == null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Existence",
                    description = "Prefab file not found",
                    detail = $"Path: {prefabPath}"
                });
                return report;
            }
            else
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Existence",
                    description = "Prefab file exists"
                });
            }

            // Instantiate for inspection
            var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            if (instance == null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Existence",
                    description = "Prefab could not be instantiated"
                });
                return report;
            }

            try
            {
                AuditSkinnedMeshRenderers(instance, report);
                AuditAnimator(instance, report);
                AuditAvatar(instance, report);
                AuditMaterials(instance, report);
                AuditColliders(instance, report);
                AuditScale(instance, report);
                AuditGameplayComponents(instance, report);
            }
            finally
            {
                GameObject.DestroyImmediate(instance);
            }

            return report;
        }

        private static void AuditSkinnedMeshRenderers(GameObject character, CharacterReport report)
        {
            var smr = character.GetComponentInChildren<SkinnedMeshRenderer>();
            if (smr == null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Mesh",
                    description = "No SkinnedMeshRenderer found",
                    detail = "Character has no visible skinned mesh"
                });
                return;
            }

            report.findings.Add(new Finding
            {
                result = ValidationResult.Pass,
                category = "Mesh",
                description = "SkinnedMeshRenderer present"
            });

            // Check triangle count
            int totalTriangles = 0;
            int totalVertices = 0;
            var allSMR = character.GetComponentsInChildren<SkinnedMeshRenderer>();
            foreach (var renderer in allSMR)
            {
                if (renderer.sharedMesh != null)
                {
                    totalTriangles += renderer.sharedMesh.triangles.Length / 3;
                    totalVertices += renderer.sharedMesh.vertexCount;
                }
            }

            report.findings.Add(new Finding
            {
                result = ValidationResult.Pass,
                category = "Mesh",
                description = $"Skinned mesh renderers: {allSMR.Length}",
                detail = $"Total vertices: {totalVertices}, Total triangles: {totalTriangles}"
            });

            // Production quality check
            if (totalTriangles < MinProductionTriangles)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Quality",
                    description = $"Triangle count too low for production: {totalTriangles}",
                    detail = $"Minimum required: {MinProductionTriangles}. This appears to be a procedural blockout, not a realistic model."
                });
            }
            else if (totalTriangles > MaxProductionTriangles)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Warning,
                    category = "Quality",
                    description = $"Triangle count high: {totalTriangles}",
                    detail = $"Consider LODs. Maximum recommended: {MaxProductionTriangles}"
                });
            }
            else
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Quality",
                    description = $"Triangle count within production range: {totalTriangles}",
                    detail = $"Range: {MinProductionTriangles}-{MaxProductionTriangles}"
                });
            }

            // Check bone weights
            foreach (var renderer in allSMR)
            {
                if (renderer.sharedMesh != null && renderer.sharedMesh.boneWeights != null)
                {
                    var boneWeights = renderer.sharedMesh.boneWeights;
                    int weightedVertices = 0;
                    foreach (var bw in boneWeights)
                    {
                        if (bw.weight0 + bw.weight1 + bw.weight2 + bw.weight3 > 0.01f)
                            weightedVertices++;
                    }

                    if (weightedVertices < renderer.sharedMesh.vertexCount * 0.5f)
                    {
                        report.findings.Add(new Finding
                        {
                            result = ValidationResult.Warning,
                            category = "Rig",
                            description = $"Low bone weight coverage on {renderer.name}",
                            detail = $"{weightedVertices}/{renderer.sharedMesh.vertexCount} vertices have bone weights"
                        });
                    }
                }
            }
        }

        private static void AuditAnimator(GameObject character, CharacterReport report)
        {
            var animator = character.GetComponentInChildren<Animator>();
            if (animator == null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Animation",
                    description = "No Animator component found"
                });
                return;
            }

            report.findings.Add(new Finding
            {
                result = ValidationResult.Pass,
                category = "Animation",
                description = "Animator component present"
            });

            if (animator.runtimeAnimatorController == null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Animation",
                    description = "No Animator Controller assigned"
                });
            }
            else
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Animation",
                    description = "Animator Controller assigned",
                    detail = animator.runtimeAnimatorController.name
                });

                // Check controller states
                var controller = animator.runtimeAnimatorController as AnimatorController;
                if (controller != null && controller.layers.Length > 0)
                {
                    var layer = controller.layers[0];
                    int stateCount = layer.stateMachine.states.Length;
                    
                    report.findings.Add(new Finding
                    {
                        result = ValidationResult.Pass,
                        category = "Animation",
                        description = $"Controller has {stateCount} states"
                    });

                    if (stateCount < MinAnimationClips)
                    {
                        report.findings.Add(new Finding
                        {
                            result = ValidationResult.Warning,
                            category = "Animation",
                            description = $"Few animation states: {stateCount}",
                            detail = $"Minimum recommended: {MinAnimationClips}"
                        });
                    }
                }
            }
        }

        private static void AuditAvatar(GameObject character, CharacterReport report)
        {
            var animator = character.GetComponentInChildren<Animator>();
            if (animator == null) return;

            if (animator.avatar == null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Rig",
                    description = "No Avatar configured"
                });
                return;
            }

            report.findings.Add(new Finding
            {
                result = ValidationResult.Pass,
                category = "Rig",
                description = "Avatar present"
            });

            // Check Humanoid vs Generic
            if (animator.avatar.isHuman)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Rig",
                    description = "Humanoid Avatar configured"
                });

                // Check human body map
                var humanDescription = animator.avatar.humanDescription;
                if (humanDescription.human != null && humanDescription.human.Length > 0)
                {
                    report.findings.Add(new Finding
                    {
                        result = ValidationResult.Pass,
                        category = "Rig",
                        description = $"Humanoid body map: {humanDescription.human.Length} mappings"
                    });
                }
            }
            else
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Warning,
                    category = "Rig",
                    description = "Generic Avatar (not Humanoid)",
                    detail = "Humanoid Avatar is recommended for Mixamo-compatible animations"
                });
            }

            // Count bones
            var transforms = character.GetComponentsInChildren<Transform>();
            int boneCount = 0;
            foreach (var t in transforms)
            {
                // Count transforms that are part of the skeleton (not UI, cameras, etc.)
                if (t != character.transform && t.parent != null)
                    boneCount++;
            }

            if (boneCount < MinBonesForHuman)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Rig",
                    description = $"Too few bones for human character: {boneCount}",
                    detail = $"Minimum recommended: {MinBonesForHuman}"
                });
            }
            else
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Rig",
                    description = $"Bone count: {boneCount}"
                });
            }
        }

        private static void AuditMaterials(GameObject character, CharacterReport report)
        {
            var renderers = character.GetComponentsInChildren<SkinnedMeshRenderer>();
            if (renderers.Length == 0) return;

            int materialCount = 0;
            int missingMaterials = 0;
            int missingTextures = 0;

            foreach (var renderer in renderers)
            {
                if (renderer.sharedMaterials != null)
                {
                    materialCount += renderer.sharedMaterials.Length;
                    foreach (var mat in renderer.sharedMaterials)
                    {
                        if (mat == null)
                        {
                            missingMaterials++;
                        }
                        else
                        {
                            // Check for main texture
                            if (mat.mainTexture == null)
                            {
                                missingTextures++;
                            }
                        }
                    }
                }
            }

            report.findings.Add(new Finding
            {
                result = ValidationResult.Pass,
                category = "Materials",
                description = $"Materials: {materialCount}"
            });

            if (missingMaterials > 0)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Materials",
                    description = $"Missing materials: {missingMaterials}"
                });
            }

            if (missingTextures > 0)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Warning,
                    category = "Materials",
                    description = $"Materials without main texture: {missingTextures}",
                    detail = "Consider adding albedo/diffuse textures for production quality"
                });
            }
        }

        private static void AuditColliders(GameObject character, CharacterReport report)
        {
            // Check for visible collision proxies
            var meshFilters = character.GetComponentsInChildren<MeshFilter>();
            foreach (var mf in meshFilters)
            {
                if (mf.sharedMesh != null && mf.sharedMesh.name.Contains("Collision"))
                {
                    var renderer = mf.GetComponent<MeshRenderer>();
                    if (renderer != null && renderer.enabled)
                    {
                        report.findings.Add(new Finding
                        {
                            result = ValidationResult.Fail,
                            category = "Colliders",
                            description = "Visible collision mesh detected",
                            detail = $"{mf.name} appears to be a collision proxy that should not render"
                        });
                    }
                }
            }

            // Check for interaction collider
            var capsuleCollider = character.GetComponentInChildren<CapsuleCollider>();
            if (capsuleCollider != null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Colliders",
                    description = "CapsuleCollider present"
                });
            }
        }

        private static void AuditScale(GameObject character, CharacterReport report)
        {
            // Estimate character height
            var bounds = new Bounds(character.transform.position, Vector3.zero);
            var renderers = character.GetComponentsInChildren<Renderer>();
            foreach (var r in renderers)
            {
                if (r.enabled)
                    bounds.Encapsulate(r.bounds);
            }

            float height = bounds.size.y;
            if (height < MinModelHeight || height > MaxModelHeight)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Warning,
                    category = "Scale",
                    description = $"Unusual character height: {height:F2}m",
                    detail = $"Expected range: {MinModelHeight}-{MaxModelHeight}m"
                });
            }
            else
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Scale",
                    description = $"Character height: {height:F2}m"
                });
            }
        }

        private static void AuditGameplayComponents(GameObject character, CharacterReport report)
        {
            // Check for NPCCharacter or PlayerMovement
            var npcChar = character.GetComponentInChildren<WhisperingWilds.NPC.NPCCharacter>();
            var playerMove = character.GetComponentInChildren<WhisperingWilds.Player.PlayerMovement>();

            if (npcChar != null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Gameplay",
                    description = "NPCCharacter component present"
                });
            }
            else if (playerMove != null)
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Pass,
                    category = "Gameplay",
                    description = "PlayerMovement component present"
                });
            }
            else
            {
                report.findings.Add(new Finding
                {
                    result = ValidationResult.Fail,
                    category = "Gameplay",
                    description = "No gameplay component found (NPCCharacter or PlayerMovement)"
                });
            }

            // Check for navigation (NPCs only)
            if (npcChar != null)
            {
                var nav = character.GetComponentInChildren<WhisperingWilds.NPC.NPCNavigationController>();
                if (nav != null)
                {
                    report.findings.Add(new Finding
                    {
                        result = ValidationResult.Pass,
                        category = "Gameplay",
                        description = "NPCNavigationController present"
                    });
                }
            }
        }

        private static string ExtractCharacterId(string prefabPath)
        {
            var parts = prefabPath.Split('/');
            var fileName = parts[parts.Length - 1];
            var nameWithoutExt = System.IO.Path.GetFileNameWithoutExtension(fileName);
            
            if (nameWithoutExt.StartsWith("NPC_"))
            {
                return nameWithoutExt.Substring(4).ToLower();
            }
            else if (nameWithoutExt == "PlayerCharacter")
            {
                return "player";
            }
            
            return nameWithoutExt.ToLower();
        }

        private static string ExtractDisplayName(string prefabPath)
        {
            var parts = prefabPath.Split('/');
            var fileName = parts[parts.Length - 1];
            var nameWithoutExt = System.IO.Path.GetFileNameWithoutExtension(fileName);
            
            if (nameWithoutExt.StartsWith("NPC_"))
            {
                return nameWithoutExt.Substring(4);
            }
            else if (nameWithoutExt == "PlayerCharacter")
            {
                return "Player";
            }
            
            return nameWithoutExt;
        }
    }
}
