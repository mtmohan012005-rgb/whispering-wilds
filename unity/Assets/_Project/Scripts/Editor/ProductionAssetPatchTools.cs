using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using WhisperingWilds.Audio;
using WhisperingWilds.Atmosphere;
using WhisperingWilds.Investigation;
using WhisperingWilds.NPC;
using WhisperingWilds.Wildlife;

namespace WhisperingWilds.Editor
{
    public static class ProductionAssetPatchTools
    {
        private const string MaterialsPath = "Assets/_Project/Art/Materials";
        private const string PrefabsVfxPath = "Assets/_Project/Prefabs/VFX";
        private const string SwarasPath = "Assets/_Project/Audio/Swaras";
        private const string WildlifeAudioPath = "Assets/_Project/Audio/Wildlife";
        private const string AudioAssetsPath = "Assets/_Project/Audio";

        [MenuItem("Tools/Whispering Wilds/01 - Create Missing HDRP Materials and VFX Prefab")]
        public static void CreateMissingHdrpMaterialsAndVfx()
        {
            EnsureDirectoryExists(MaterialsPath);
            EnsureDirectoryExists(PrefabsVfxPath);

            Shader litShader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");

            // 1. HDRP_PuddleDecal.mat
            string puddleMatPath = $"{MaterialsPath}/HDRP_PuddleDecal.mat";
            var puddleMat = AssetDatabase.LoadAssetAtPath<Material>(puddleMatPath);
            if (puddleMat == null)
            {
                puddleMat = new Material(litShader) { name = "HDRP_PuddleDecal" };
                AssetDatabase.CreateAsset(puddleMat, puddleMatPath);
            }

            var puddleTex = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/_Project/Art/Textures/Environment/puddle_mask.png");
            if (puddleTex != null)
            {
                if (puddleMat.HasProperty("_BaseColorMap")) puddleMat.SetTexture("_BaseColorMap", puddleTex);
                if (puddleMat.HasProperty("_MainTex")) puddleMat.SetTexture("_MainTex", puddleTex);
            }
            if (puddleMat.HasProperty("_BaseColor")) puddleMat.SetColor("_BaseColor", new Color(0.7f, 0.85f, 0.95f, 0.85f));
            if (puddleMat.HasProperty("_Smoothness")) puddleMat.SetFloat("_Smoothness", 0.98f);
            if (puddleMat.HasProperty("_Metallic")) puddleMat.SetFloat("_Metallic", 0.1f);
            EditorUtility.SetDirty(puddleMat);

            // 2. AthangudiTile_HDRP.mat
            string athangudiMatPath = $"{MaterialsPath}/AthangudiTile_HDRP.mat";
            var athangudiMat = AssetDatabase.LoadAssetAtPath<Material>(athangudiMatPath);
            if (athangudiMat == null)
            {
                athangudiMat = new Material(litShader) { name = "AthangudiTile_HDRP" };
                AssetDatabase.CreateAsset(athangudiMat, athangudiMatPath);
            }

            var athangudiTex = AssetDatabase.LoadAssetAtPath<Texture2D>("Assets/_Project/Art/Textures/Architecture/athangudi_tile_pattern.png");
            if (athangudiTex != null)
            {
                if (athangudiMat.HasProperty("_BaseColorMap")) athangudiMat.SetTexture("_BaseColorMap", athangudiTex);
                if (athangudiMat.HasProperty("_MainTex")) athangudiMat.SetTexture("_MainTex", athangudiTex);
            }
            if (athangudiMat.HasProperty("_BaseColor")) athangudiMat.SetColor("_BaseColor", Color.white);
            if (athangudiMat.HasProperty("_Smoothness")) athangudiMat.SetFloat("_Smoothness", 0.88f); // Glossy polished cement
            EditorUtility.SetDirty(athangudiMat);

            // 3. SanctumSunbeams.prefab
            string sunbeamsPrefabPath = $"{PrefabsVfxPath}/SanctumSunbeams.prefab";
            var sunbeamsRoot = new GameObject("SanctumSunbeams");

            // Dust particles child
            var dustChild = new GameObject("Dust_Motes_Particles");
            dustChild.transform.SetParent(sunbeamsRoot.transform, false);
            var ps = dustChild.AddComponent<ParticleSystem>();
            var main = ps.main;
            main.startLifetime = 6.0f;
            main.startSpeed = 0.15f;
            main.startSize = 0.04f;
            main.startColor = new Color(1.0f, 0.85f, 0.45f, 0.65f); // Golden specks
            main.maxParticles = 120;
            var emission = ps.emission;
            emission.rateOverTime = 20f;
            var shape = ps.shape;
            shape.shapeType = ParticleSystemShapeType.Box;
            shape.scale = new Vector3(8f, 10f, 8f);

            // Translucent light shafts
            Shader unlitShader = Shader.Find("HDRP/Unlit") ?? Shader.Find("Unlit/Transparent") ?? litShader;
            var beamMat = new Material(unlitShader) { name = "Sanctum_Sunbeam_Shaft_Mat" };
            if (beamMat.HasProperty("_UnlitColor")) beamMat.SetColor("_UnlitColor", new Color(1.0f, 0.92f, 0.70f, 0.15f));
            if (beamMat.HasProperty("_BaseColor")) beamMat.SetColor("_BaseColor", new Color(1.0f, 0.92f, 0.70f, 0.15f));
            if (beamMat.HasProperty("_Color")) beamMat.SetColor("_Color", new Color(1.0f, 0.92f, 0.70f, 0.15f));

            for (int b = 0; b < 2; b++)
            {
                var shaft = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                shaft.name = $"Light_Shaft_{b + 1:D2}";
                shaft.transform.SetParent(sunbeamsRoot.transform, false);
                shaft.transform.localPosition = new Vector3(-2f + (b * 4f), 5f, 0f);
                shaft.transform.localRotation = Quaternion.Euler(35f, 20f, 0f);
                shaft.transform.localScale = new Vector3(1.2f, 6.0f, 1.2f);
                shaft.GetComponent<MeshRenderer>().sharedMaterial = beamMat;
                var col = shaft.GetComponent<Collider>();
                if (col != null) UnityEngine.Object.DestroyImmediate(col);
            }

            PrefabUtility.SaveAsPrefabAsset(sunbeamsRoot, sunbeamsPrefabPath);
            UnityEngine.Object.DestroyImmediate(sunbeamsRoot);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[ProductionAssetPatchTools] 01 - Created HDRP materials and SanctumSunbeams prefab successfully.");
        }

        [MenuItem("Tools/Whispering Wilds/02 - Wire Swaras, Wildlife Calls and NPC Voice Hooks")]
        public static void WireSwarasWildlifeAndNpcVoice()
        {
            // A. Create/Update CarnaticSwaraLibrary asset
            string libraryPath = $"{AudioAssetsPath}/CarnaticSwaraLibrary.asset";
            var library = AssetDatabase.LoadAssetAtPath<CarnaticSwaraLibrary>(libraryPath);
            if (library == null)
            {
                library = ScriptableObject.CreateInstance<CarnaticSwaraLibrary>();
                AssetDatabase.CreateAsset(library, libraryPath);
            }

            library.swaras.Clear();
            string[] swaraFiles = {
                "pillar_tone_sa", "pillar_tone_ri", "pillar_tone_ga",
                "pillar_tone_ma", "pillar_tone_pa", "pillar_tone_dha", "pillar_tone_ni"
            };
            string[] swaraSyllables = { "ச", "ரி", "க", "ம", "ப", "த", "நி" };
            float[] freqs = { 220.0f, 247.5f, 275.0f, 293.33f, 330.0f, 371.25f, 412.5f };

            for (int i = 0; i < swaraFiles.Length; i++)
            {
                var clip = AssetDatabase.LoadAssetAtPath<AudioClip>($"{SwarasPath}/{swaraFiles[i]}.wav");
                library.swaras.Add(new SwaraEntry
                {
                    swaraName = swaraFiles[i],
                    tamilSyllable = swaraSyllables[i],
                    frequencyHz = freqs[i],
                    clip = clip
                });
            }
            EditorUtility.SetDirty(library);

            // B. Wire 5 Mohanam clips to AcousticPillarPuzzle in 08_Ancient_Temple_Ruins.unity
            string templeScenePath = "Assets/_Project/Scenes/08_Ancient_Temple_Ruins.unity";
            if (File.Exists(templeScenePath))
            {
                BuildSangamExpansionScenes.CreateSceneBackup(templeScenePath);
                var scene = EditorSceneManager.OpenScene(templeScenePath, OpenSceneMode.Single);
                var puzzle = UnityEngine.Object.FindAnyObjectByType<AcousticPillarPuzzle>();
                if (puzzle != null)
                {
                    var mohanamClips = library.GetMohanamClips();
                    if (mohanamClips != null && mohanamClips.Length == 5)
                    {
                        puzzle.noteClips = mohanamClips;
                        EditorUtility.SetDirty(puzzle);
                        EditorSceneManager.MarkSceneDirty(scene);
                        EditorSceneManager.SaveScene(scene, templeScenePath);
                        Debug.Log("[ProductionAssetPatchTools] Assigned 5 Mohanam swaras to AcousticPillarPuzzle.");
                    }
                }
            }

            // C. Wire Wildlife Prefabs (Elephant and Tahr)
            WireWildlifePrefab("Assets/_Project/Prefabs/Wildlife/Wildlife_Elephant.prefab", $"{WildlifeAudioPath}/call_elephant.wav");
            WireWildlifePrefab("Assets/_Project/Prefabs/Wildlife/Wildlife_NilgiriTahr.prefab", $"{WildlifeAudioPath}/call_nilgiri_tahr.wav");

            // D. Wire NPCVoiceBarkPlayer to NPCs in scenes
            string[] npcScenes = {
                "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity",
                "Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity",
                "Assets/_Project/Scenes/04_Thanjavur_Delta.unity",
                "Assets/_Project/Scenes/05_Chettinad_Mansion.unity",
                "Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity"
            };

            foreach (var scenePath in npcScenes)
            {
                if (File.Exists(scenePath))
                {
                    BuildSangamExpansionScenes.CreateSceneBackup(scenePath);
                    var s = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                    var npcs = UnityEngine.Object.FindObjectsByType<NPCCharacter>(FindObjectsSortMode.None);
                    bool modified = false;

                    foreach (var npc in npcs)
                    {
                        var barkPlayer = npc.GetComponent<NPCVoiceBarkPlayer>();
                        if (barkPlayer == null)
                        {
                            barkPlayer = npc.gameObject.AddComponent<NPCVoiceBarkPlayer>();
                            barkPlayer.speechClip = null; // Awaiting human voice recordings
                            modified = true;
                        }
                    }

                    // Special: in Chettinad, assign Athangudi material to floor
                    if (scenePath.Contains("Chettinad"))
                    {
                        var athangudiMat = AssetDatabase.LoadAssetAtPath<Material>($"{MaterialsPath}/AthangudiTile_HDRP.mat");
                        if (athangudiMat != null)
                        {
                            var groundObj = GameObject.Find("Mansion_Courtyard_Floor") ?? GameObject.Find("Courtyard_Floor");
                            if (groundObj != null)
                            {
                                var mr = groundObj.GetComponent<MeshRenderer>();
                                if (mr != null) { mr.sharedMaterial = athangudiMat; modified = true; }
                            }
                        }
                    }

                    // Special: in Chennai, add Puddle Decal object
                    if (scenePath.Contains("Chennai"))
                    {
                        var puddleMat = AssetDatabase.LoadAssetAtPath<Material>($"{MaterialsPath}/HDRP_PuddleDecal.mat");
                        var puddleObj = GameObject.Find("Market_Puddle_Decal");
                        if (puddleObj == null)
                        {
                            puddleObj = GameObject.CreatePrimitive(PrimitiveType.Quad);
                            puddleObj.name = "Market_Puddle_Decal";
                            puddleObj.transform.position = new Vector3(-2f, 0.02f, 4f);
                            puddleObj.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
                            puddleObj.transform.localScale = new Vector3(3.5f, 3.5f, 1f);
                            var col = puddleObj.GetComponent<Collider>();
                            if (col != null) UnityEngine.Object.DestroyImmediate(col);
                            if (puddleMat != null) puddleObj.GetComponent<MeshRenderer>().sharedMaterial = puddleMat;
                            puddleObj.AddComponent<PuddleDecalController>();
                            modified = true;
                        }
                    }

                    if (modified)
                    {
                        EditorSceneManager.MarkSceneDirty(s);
                        EditorSceneManager.SaveScene(s, scenePath);
                    }
                }
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[ProductionAssetPatchTools] 02 - Wired Swaras, Wildlife calls and NPC Voice Hooks successfully.");
        }

        private static void WireWildlifePrefab(string prefabPath, string audioPath)
        {
            if (!File.Exists(prefabPath)) return;
            var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
            if (prefab == null) return;

            var inst = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
            if (inst == null) return;

            var observer = inst.GetComponent<WildlifeAudioObserver>();
            if (observer == null) observer = inst.AddComponent<WildlifeAudioObserver>();

            var clip = AssetDatabase.LoadAssetAtPath<AudioClip>(audioPath);
            if (clip != null)
            {
                observer.alertClip = clip;
                observer.ambientCallClip = clip;
            }

            PrefabUtility.SaveAsPrefabAsset(inst, prefabPath);
            UnityEngine.Object.DestroyImmediate(inst);
            Debug.Log($"[ProductionAssetPatchTools] Wired audio observer on {prefabPath}");
        }

        [MenuItem("Tools/Whispering Wilds/03 - Upgrade Existing Madurai, Kanyakumari and Agasthyamalai Scenes")]
        public static void RunAllProductionAssetPatchSteps()
        {
            CreateMissingHdrpMaterialsAndVfx();
            WireSwarasWildlifeAndNpcVoice();
            UpgradeExistingSangamScenes();
            EditorApplication.Exit(0);
        }

        public static void UpgradeExistingSangamScenes()
        {
            BuildSangamExpansionScenes.UpgradeAllSangamScenes();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("[ProductionAssetPatchTools] 03 - Upgraded Madurai, Kanyakumari and Agasthyamalai Scenes successfully.");
        }

        private static void EnsureDirectoryExists(string assetPath)
        {
            string fullPath = Path.Combine(Directory.GetCurrentDirectory(), assetPath);
            if (!Directory.Exists(fullPath))
            {
                Directory.CreateDirectory(fullPath);
            }
        }
    }
}
