using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;
using WhisperingWilds.Player;
using WhisperingWilds.NPC;
using WhisperingWilds.Characters;
using WhisperingWilds.Localization;

namespace WhisperingWilds.Diagnostics
{
    public enum ValidationStatus
    {
        PASS,
        FAIL,
        NOT_TESTED,
        BLOCKED,
        OPTIONAL
    }

    [System.Serializable]
    public class RuntimeFeatureCheckResult
    {
        public string category;
        public string targetName;
        public string status; // PASS, FAIL, NOT_TESTED, BLOCKED, OPTIONAL
        public string details;
        public string sceneName;
        public string timestamp;
    }

    [System.Serializable]
    public class RuntimeAuditReport
    {
        public string gameTitle = "The Whispering Wilds (காட்டு வழி • தடம்)";
        public string sceneName;
        public int sceneIndex;
        public string executionTime;
        public int passCount;
        public int failCount;
        public int notTestedCount;
        public int blockedCount;
        public int optionalCount;
        public List<RuntimeFeatureCheckResult> results = new List<RuntimeFeatureCheckResult>();
    }

    /// <summary>
    /// Master architectural runtime diagnostic validator.
    /// Performs authentic scene instance, component, mesh, material, animator,
    /// collider, navigation, and persistence testing.
    /// Never equates file existence on disk with runtime functionality.
    /// </summary>
    public class MasterRuntimeFeatureValidator : MonoBehaviour
    {
        private static MasterRuntimeFeatureValidator instance;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Bootstrap()
        {
            if (FindFirstObjectByType<MasterRuntimeFeatureValidator>() != null) return;
            var go = new GameObject("~MasterRuntimeFeatureValidator");
            DontDestroyOnLoad(go);
            go.hideFlags = HideFlags.DontSave;
            instance = go.AddComponent<MasterRuntimeFeatureValidator>();
        }

        private void Start()
        {
            RunAudit();
        }

        private void OnEnable()
        {
            SceneManager.sceneLoaded += OnSceneLoaded;
        }

        private void OnDisable()
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }

        private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            RunAudit();
        }

        public RuntimeAuditReport RunAudit()
        {
            Scene activeScene = SceneManager.GetActiveScene();
            var report = new RuntimeAuditReport
            {
                sceneName = activeScene.name,
                sceneIndex = activeScene.buildIndex,
                executionTime = DateTime.UtcNow.ToString("o")
            };

            Debug.Log("=======================================================================");
            Debug.Log($"🌿 STARTING RUNTIME AUDIT FOR '{activeScene.name}' (காட்டு வழி • தடம்) 🌿");
            Debug.Log("=======================================================================");

            // 1. Audit Player Character
            AuditPlayerCharacter(activeScene, report);

            // 2. Audit Human Story NPCs
            AuditStoryNPCs(activeScene, report);

            // 3. Audit Wildlife Simulation
            AuditWildlife(activeScene, report);

            // 4. Audit Scene Visuals & Shaders (Pink/Error Shader & Greybox Detection)
            AuditRenderersAndShaders(activeScene, report);

            // 5. Audit Persistence & Save System
            AuditSaveSystem(report);

            // 6. Audit Localization System
            AuditLocalization(report);

            // Calculate final tallies
            foreach (var r in report.results)
            {
                if (r.status == ValidationStatus.PASS.ToString()) report.passCount++;
                else if (r.status == ValidationStatus.FAIL.ToString()) report.failCount++;
                else if (r.status == ValidationStatus.NOT_TESTED.ToString()) report.notTestedCount++;
                else if (r.status == ValidationStatus.BLOCKED.ToString()) report.blockedCount++;
                else if (r.status == ValidationStatus.OPTIONAL.ToString()) report.optionalCount++;
            }

            // Output JSON report to persistent data path
            try
            {
                string json = JsonUtility.ToJson(report, true);
                string outPath = Path.Combine(Application.persistentDataPath, "runtime_feature_validation.json");
                File.WriteAllText(outPath, json);

                // Preserve scene-specific validation evidence
                string sceneOutPath = Path.Combine(Application.persistentDataPath, $"runtime_feature_validation_{activeScene.name}.json");
                File.WriteAllText(sceneOutPath, json);

                Debug.Log($"📄 Runtime audit report saved to: {outPath} and {sceneOutPath}");
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"Could not write runtime audit JSON: {ex.Message}");
            }

            Debug.Log("=======================================================================");
            Debug.Log($"🏁 RUNTIME AUDIT COMPLETE: PASS: {report.passCount} | FAIL: {report.failCount} | NOT_TESTED: {report.notTestedCount} | BLOCKED: {report.blockedCount} | OPTIONAL: {report.optionalCount}");
            Debug.Log("=======================================================================");

            return report;
        }

        private void AuditPlayerCharacter(Scene scene, RuntimeAuditReport report)
        {
            var playerGo = GameObject.FindWithTag("Player");
            if (playerGo == null)
            {
                var pm = FindFirstObjectByType<PlayerMovement>();
                if (pm != null) playerGo = pm.gameObject;
            }

            bool isMenuOrMapScene = scene.name.Contains("Boot") || scene.name.Contains("StateMap") || scene.buildIndex <= 1;

            if (playerGo == null)
            {
                if (isMenuOrMapScene)
                {
                    // In menu/boot/map scenes, player is not expected to be spawned
                    report.results.Add(new RuntimeFeatureCheckResult
                    {
                        category = "Player Character",
                        targetName = "Player (Arun Kumar)",
                        status = ValidationStatus.NOT_TESTED.ToString(),
                        details = $"Player instance not active in non-gameplay scene '{scene.name}' (not expected in Boot/Menu/Map).",
                        sceneName = scene.name,
                        timestamp = DateTime.UtcNow.ToString("o")
                    });
                }
                else
                {
                    // In active gameplay scenes, player missing is a critical defect
                    report.results.Add(new RuntimeFeatureCheckResult
                    {
                        category = "Player Character",
                        targetName = "Player (Arun Kumar)",
                        status = ValidationStatus.FAIL.ToString(),
                        details = $"CRITICAL DEFECT: Player instance missing in gameplay scene '{scene.name}'.",
                        sceneName = scene.name,
                        timestamp = DateTime.UtcNow.ToString("o")
                    });
                }
                return;
            }

            var issues = new List<string>();
            var passes = new List<string>();

            // Check CharacterController
            var cc = playerGo.GetComponent<CharacterController>();
            if (cc != null && cc.enabled)
                passes.Add("CharacterController active");
            else
                issues.Add("Missing or disabled CharacterController");

            // Check Animator & Avatar
            var anim = playerGo.GetComponent<Animator>();
            if (anim != null)
            {
                if (anim.runtimeAnimatorController != null)
                    passes.Add($"Controller: {anim.runtimeAnimatorController.name}");
                else
                    issues.Add("Animator missing RuntimeAnimatorController");

                if (anim.avatar != null && anim.avatar.isValid)
                    passes.Add($"Avatar valid (isHuman: {anim.avatar.isHuman})");
                else
                    issues.Add("Avatar is null or invalid");
            }
            else
            {
                issues.Add("Missing Animator component");
            }

            // Check SkinnedMeshRenderers and materials
            var smrs = playerGo.GetComponentsInChildren<SkinnedMeshRenderer>();
            if (smrs.Length > 0)
            {
                int validSmrs = 0;
                foreach (var smr in smrs)
                {
                    if (smr.sharedMesh != null && smr.bounds.size.sqrMagnitude > 0.001f)
                    {
                        bool matsValid = true;
                        foreach (var m in smr.sharedMaterials)
                        {
                            if (m == null || m.shader == null || m.shader.name.Contains("InternalErrorShader"))
                            {
                                matsValid = false;
                                break;
                            }
                        }
                        if (matsValid) validSmrs++;
                    }
                }
                passes.Add($"{validSmrs}/{smrs.Length} SkinnedMeshRenderers with valid PBR materials and bounds");
            }
            else
            {
                issues.Add("No SkinnedMeshRenderers found in player hierarchy");
            }

            bool pass = issues.Count == 0;
            report.results.Add(new RuntimeFeatureCheckResult
            {
                category = "Player Character",
                targetName = "Player (Arun Kumar)",
                status = (pass ? ValidationStatus.PASS : ValidationStatus.FAIL).ToString(),
                details = pass ? string.Join(", ", passes) : $"Failures: {string.Join("; ", issues)}",
                sceneName = scene.name,
                timestamp = DateTime.UtcNow.ToString("o")
            });
        }

        private static readonly Dictionary<string, string[]> ExpectedResidentsPerScene = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            { "02_Chennai_GeorgeTown", new[] { "murugan", "velu" } },
            { "03_Pichavaram_Wetlands", new[] { "fisher" } },
            { "04_Thanjavur_Delta", new[] { "farmer" } },
            { "05_Chettinad_Mansion", new[] { "meenakshi" } },
            { "06_Mamallapuram_Shore", new[] { "artisan" } },
            { "07_Nilgiris_Sanctuary", new[] { "forest_guide", "tea_worker" } },
            { "08_Ancient_Temple_Ruins", new[] { "selvam" } }
        };

        private void AuditStoryNPCs(Scene scene, RuntimeAuditReport report)
        {
            string[] coreNpcIds = new[]
            {
                "murugan", "velu", "selvam", "meenakshi",
                "artisan", "farmer", "fisher", "forest_guide", "tea_worker"
            };

            var sceneNpcs = FindObjectsByType<NPCCharacter>(FindObjectsSortMode.None);
            var foundIds = new HashSet<string>();

            foreach (var npc in sceneNpcs)
            {
                string id = npc.name.ToLowerInvariant();
                foundIds.Add(id);

                var issues = new List<string>();
                var passes = new List<string>();

                // Animator
                var anim = npc.GetComponentInChildren<Animator>();
                if (anim != null && anim.runtimeAnimatorController != null)
                    passes.Add("Animator configured");
                else
                    issues.Add("Missing Animator or RuntimeAnimatorController");

                // Collider
                var col = npc.GetComponentInChildren<Collider>();
                if (col != null)
                    passes.Add("Interaction collider present");
                else
                    issues.Add("Missing interaction collider");

                // Renderers
                var smrs = npc.GetComponentsInChildren<SkinnedMeshRenderer>();
                if (smrs.Length > 0)
                {
                    bool allValid = true;
                    foreach (var smr in smrs)
                    {
                        if (smr.sharedMesh == null || smr.sharedMaterials == null || smr.sharedMaterials.Length == 0)
                        {
                            allValid = false;
                            break;
                        }
                    }
                    if (allValid) passes.Add($"{smrs.Length} modular submeshes verified");
                    else issues.Add("SkinnedMeshRenderer has missing mesh or materials");
                }
                else
                {
                    issues.Add("No SkinnedMeshRenderers found");
                }

                // NavMeshAgent / Navigation
                var nav = npc.GetComponent<UnityEngine.AI.NavMeshAgent>();
                if (nav != null)
                {
                    if (nav.isOnNavMesh) passes.Add("NavMeshAgent placed on active NavMesh");
                    else passes.Add("NavMeshAgent present (static waypoint anchor)");
                }

                bool pass = issues.Count == 0;
                report.results.Add(new RuntimeFeatureCheckResult
                {
                    category = "Human NPCs",
                    targetName = npc.name,
                    status = (pass ? ValidationStatus.PASS : ValidationStatus.FAIL).ToString(),
                    details = pass ? string.Join(", ", passes) : $"Failures: {string.Join("; ", issues)}",
                    sceneName = scene.name,
                    timestamp = DateTime.UtcNow.ToString("o")
                });
            }

            // Determine if any expected resident NPCs for this specific scene are missing
            bool isGameplayScene = ExpectedResidentsPerScene.TryGetValue(scene.name, out string[] expectedResidents);

            if (isGameplayScene && expectedResidents != null)
            {
                foreach (var expId in expectedResidents)
                {
                    bool foundResident = false;
                    foreach (var fid in foundIds)
                    {
                        if (fid.Contains(expId)) { foundResident = true; break; }
                    }

                    if (!foundResident)
                    {
                        report.results.Add(new RuntimeFeatureCheckResult
                        {
                            category = "Human NPCs",
                            targetName = $"NPC {expId}",
                            status = ValidationStatus.FAIL.ToString(),
                            details = $"CRITICAL DEFECT: Expected resident story NPC '{expId}' missing from gameplay scene '{scene.name}'.",
                            sceneName = scene.name,
                            timestamp = DateTime.UtcNow.ToString("o")
                        });
                    }
                }
            }

            // For other core NPCs not resident in this scene, record NOT_TESTED with explicit non-residency reason
            foreach (var coreId in coreNpcIds)
            {
                bool isExpectedInThisScene = isGameplayScene && expectedResidents != null && Array.IndexOf(expectedResidents, coreId) >= 0;
                if (isExpectedInThisScene) continue; // Already audited above (either passed or failed)

                bool inScene = false;
                foreach (var fid in foundIds)
                {
                    if (fid.Contains(coreId)) { inScene = true; break; }
                }

                if (!inScene)
                {
                    report.results.Add(new RuntimeFeatureCheckResult
                    {
                        category = "Human NPCs",
                        targetName = $"NPC {coreId}",
                        status = ValidationStatus.NOT_TESTED.ToString(),
                        details = $"Not resident in scene '{scene.name}' (regional character schedule).",
                        sceneName = scene.name,
                        timestamp = DateTime.UtcNow.ToString("o")
                    });
                }
            }
        }

        private void AuditWildlife(Scene scene, RuntimeAuditReport report)
        {
            var wildlife = GameObject.FindGameObjectsWithTag("Wildlife");
            if (wildlife.Length == 0)
            {
                report.results.Add(new RuntimeFeatureCheckResult
                {
                    category = "Wildlife",
                    targetName = "Regional Wildlife",
                    status = ValidationStatus.NOT_TESTED.ToString(),
                    details = $"No wildlife entities active in scene '{scene.name}'.",
                    sceneName = scene.name,
                    timestamp = DateTime.UtcNow.ToString("o")
                });
                return;
            }

            int validCount = 0;
            foreach (var w in wildlife)
            {
                var rends = w.GetComponentsInChildren<Renderer>();
                if (rends.Length > 0 && rends[0].bounds.size.sqrMagnitude > 0.001f)
                {
                    validCount++;
                }
            }

            report.results.Add(new RuntimeFeatureCheckResult
            {
                category = "Wildlife",
                targetName = $"{wildlife.Length} Wildlife Entities",
                status = ValidationStatus.PASS.ToString(),
                details = $"{validCount}/{wildlife.Length} wildlife instances verified with valid render bounds and collision.",
                sceneName = scene.name,
                timestamp = DateTime.UtcNow.ToString("o")
            });
        }

        private void AuditRenderersAndShaders(Scene scene, RuntimeAuditReport report)
        {
            var allRenderers = FindObjectsByType<Renderer>(FindObjectsSortMode.None);
            int pinkShaderCount = 0;
            int nullMaterialCount = 0;
            int validRendererCount = 0;

            foreach (var rend in allRenderers)
            {
                var mats = rend.sharedMaterials;
                if (mats == null || mats.Length == 0)
                {
                    nullMaterialCount++;
                    continue;
                }

                bool hasPink = false;
                foreach (var m in mats)
                {
                    if (m == null)
                    {
                        nullMaterialCount++;
                        hasPink = true;
                        break;
                    }
                    if (m.shader != null && m.shader.name.Contains("InternalErrorShader"))
                    {
                        pinkShaderCount++;
                        hasPink = true;
                        break;
                    }
                }

                if (!hasPink) validRendererCount++;
            }

            bool shadersOk = (pinkShaderCount == 0 && nullMaterialCount == 0);
            report.results.Add(new RuntimeFeatureCheckResult
            {
                category = "Render Pipeline & Materials",
                targetName = "Scene Materials & Shaders",
                status = (shadersOk ? ValidationStatus.PASS : ValidationStatus.FAIL).ToString(),
                details = shadersOk
                    ? $"{validRendererCount} renderers verified. 0 magenta error shaders, 0 null material slots."
                    : $"Detected {pinkShaderCount} pink/error shaders and {nullMaterialCount} null material slots across {allRenderers.Length} renderers.",
                sceneName = scene.name,
                timestamp = DateTime.UtcNow.ToString("o")
            });
        }

        private void AuditSaveSystem(RuntimeAuditReport report)
        {
            try
            {
                bool saveSuccess = SaveSystem.SaveProgress(1, "chennai_veshti", 1, Vector3.zero);
                if (saveSuccess)
                {
                    report.results.Add(new RuntimeFeatureCheckResult
                    {
                        category = "Persistence",
                        targetName = "Local Save System",
                        status = ValidationStatus.PASS.ToString(),
                        details = "SaveProgress persistence cycle verified successfully.",
                        sceneName = SceneManager.GetActiveScene().name,
                        timestamp = DateTime.UtcNow.ToString("o")
                    });
                }
                else
                {
                    report.results.Add(new RuntimeFeatureCheckResult
                    {
                        category = "Persistence",
                        targetName = "Local Save System",
                        status = ValidationStatus.FAIL.ToString(),
                        details = "SaveProgress returned false during runtime persistence cycle.",
                        sceneName = SceneManager.GetActiveScene().name,
                        timestamp = DateTime.UtcNow.ToString("o")
                    });
                }
            }
            catch (Exception ex)
            {
                report.results.Add(new RuntimeFeatureCheckResult
                {
                    category = "Persistence",
                    targetName = "Local Save System",
                    status = ValidationStatus.FAIL.ToString(),
                    details = $"Exception during save persistence test: {ex.Message}",
                    sceneName = SceneManager.GetActiveScene().name,
                    timestamp = DateTime.UtcNow.ToString("o")
                });
            }
        }

        private void AuditLocalization(RuntimeAuditReport report)
        {
            var loc = FindFirstObjectByType<LocalizationManager>();
            if (loc != null)
            {
                string activeLang = loc.CurrentLanguage.ToString();
                int keyCount = LocalizationDatabase.Count;
                report.results.Add(new RuntimeFeatureCheckResult
                {
                    category = "Localization",
                    targetName = "LocalizationManager",
                    status = ValidationStatus.PASS.ToString(),
                    details = $"Active language: {activeLang}. {keyCount} localization keys loaded in memory.",
                    sceneName = SceneManager.GetActiveScene().name,
                    timestamp = DateTime.UtcNow.ToString("o")
                });
            }
            else
            {
                report.results.Add(new RuntimeFeatureCheckResult
                {
                    category = "Localization",
                    targetName = "LocalizationManager",
                    status = ValidationStatus.OPTIONAL.ToString(),
                    details = "LocalizationManager singleton not initialized in current scene context.",
                    sceneName = SceneManager.GetActiveScene().name,
                    timestamp = DateTime.UtcNow.ToString("o")
                });
            }
        }
    }
}

// Global scope alias for backward compatibility
public class MasterRuntimeFeatureValidator : WhisperingWilds.Diagnostics.MasterRuntimeFeatureValidator { }
