using System;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace WhisperingWilds.Editor
{
    public static class BuildSangamExpansionScenes
    {
        private const string SceneFolderPath = "Assets/_Project/Scenes";

        public static void CreateSceneBackup(string scenePath)
        {
            if (File.Exists(scenePath))
            {
                string bakPath = $"{scenePath}.pre-production-upgrade.bak";
                if (!File.Exists(bakPath))
                {
                    File.Copy(scenePath, bakPath);
                    Debug.Log($"[BuildSangamExpansionScenes] Preserved backup: {bakPath}");
                }
            }
        }

        public static void HideNilgirisClues(GameObject root)
        {
            if (root == null) return;
            string[] clueNames = { "Clue_SurveyMarkers", "Clue_FadedMap", "Clue_OriginalBlueprint" };
            foreach (var name in clueNames)
            {
                var t = root.transform.Find(name);
                if (t != null)
                {
                    t.gameObject.SetActive(false);
                }
            }

            // Search recursively in all children
            foreach (Transform child in root.GetComponentsInChildren<Transform>(true))
            {
                foreach (var name in clueNames)
                {
                    if (child.name == name)
                    {
                        child.gameObject.SetActive(false);
                    }
                }
            }
        }

        public static void HideNilgirisRidge(GameObject root)
        {
            if (root == null) return;
            string[] ridgeNames = { "Ridge_Mesh", "Nilgiris_Ridge", "Toda_Mund", "Toda_Hut", "Tea_Bush" };
            foreach (Transform child in root.GetComponentsInChildren<Transform>(true))
            {
                foreach (var name in ridgeNames)
                {
                    if (child.name.Contains(name))
                    {
                        child.gameObject.SetActive(false);
                    }
                }
            }
        }

        public static void BuildMaduraiScene()
        {
            string path = $"{SceneFolderPath}/09_Madurai_Meenakshi.unity";
            CreateSceneBackup(path);

            Scene scene;
            if (File.Exists(path))
            {
                scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            }
            else
            {
                scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                AssembleAllRegions.SetupSun(new Color(1.0f, 0.95f, 0.88f), 1.2f, Quaternion.Euler(50f, -30f, 0f));
                AssembleAllRegions.SetupCommonManagers("madurai_meenakshi", "Madurai Cultural Sanctuary", "மதுரை பண்பாட்டு சரணாலயம்");
                AssembleAllRegions.SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
                AssembleAllRegions.SetupHUD("Madurai Meenakshi", "மதுரை பண்பாட்டு சரணாலயம்");
            }

            // Ensure ground exists
            var envRoot = GameObject.Find("--- MADURAI_ENVIRONMENT ---");
            if (envRoot == null) envRoot = new GameObject("--- MADURAI_ENVIRONMENT ---");

            HideNilgirisClues(envRoot);
            HideNilgirisRidge(envRoot);

            var ground = envRoot.transform.Find("Temple_Courtyard_Stone");
            if (ground == null)
            {
                var g = GameObject.CreatePrimitive(PrimitiveType.Cube);
                g.name = "Temple_Courtyard_Stone";
                g.transform.SetParent(envRoot.transform, false);
                g.transform.position = new Vector3(0f, -0.1f, 0f);
                g.transform.localScale = new Vector3(80f, 0.2f, 80f);
            }

            // Versioned detail root
            var detailRoot = GameObject.Find("--- MADURAI_DETAIL_ROOT ---");
            if (detailRoot != null) UnityEngine.Object.DestroyImmediate(detailRoot);
            detailRoot = new GameObject("--- MADURAI_DETAIL_ROOT ---");
            detailRoot.transform.SetParent(envRoot.transform, false);

            Shader litShader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");

            // 1. Gopuram Tiers (Stepped Dravidian Pyramid Gateway)
            var gopuramRoot = new GameObject("Meenakshi_Gopuram_Tower");
            gopuramRoot.transform.SetParent(detailRoot.transform, false);
            gopuramRoot.transform.position = new Vector3(0f, 0f, 32f);

            for (int i = 0; i < 5; i++)
            {
                var tier = GameObject.CreatePrimitive(PrimitiveType.Cube);
                tier.name = $"Gopuram_Tier_{i + 1}";
                tier.transform.SetParent(gopuramRoot.transform, false);
                float width = 14f - (i * 2.2f);
                float height = 3.5f;
                float depth = 10f - (i * 1.6f);
                tier.transform.localPosition = new Vector3(0f, (i * 3.5f) + 1.75f, 0f);
                tier.transform.localScale = new Vector3(width, height, depth);

                var tierMat = new Material(litShader) { name = $"Gopuram_Tier_{i + 1}_Mat" };
                Color c = (i % 2 == 0) ? new Color(0.85f, 0.55f, 0.35f) : new Color(0.92f, 0.78f, 0.45f);
                if (tierMat.HasProperty("_BaseColor")) tierMat.SetColor("_BaseColor", c);
                tier.GetComponent<MeshRenderer>().sharedMaterial = tierMat;
            }

            // 2. Nayakar Hall Colonnade (Two parallel rows of 6 carved stone pillars = 12 pillars)
            var colonnadeRoot = new GameObject("Nayakar_Pillar_Colonnade");
            colonnadeRoot.transform.SetParent(detailRoot.transform, false);

            var pillarMat = new Material(litShader) { name = "Nayakar_Granite_Pillar_Mat" };
            if (pillarMat.HasProperty("_BaseColor")) pillarMat.SetColor("_BaseColor", new Color(0.40f, 0.40f, 0.42f));

            for (int row = 0; row < 2; row++)
            {
                float xOffset = (row == 0) ? -7.5f : 7.5f;
                for (int col = 0; col < 6; col++)
                {
                    float zOffset = -10f + (col * 5.5f);
                    var pillar = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                    pillar.name = $"Nayakar_Pillar_R{row}_C{col}";
                    pillar.transform.SetParent(colonnadeRoot.transform, false);
                    pillar.transform.position = new Vector3(xOffset, 2.5f, zOffset);
                    pillar.transform.localScale = new Vector3(0.9f, 2.5f, 0.9f);
                    pillar.GetComponent<MeshRenderer>().sharedMaterial = pillarMat;

                    // Dravidian pillar capital
                    var capital = GameObject.CreatePrimitive(PrimitiveType.Cube);
                    capital.name = $"Pillar_Capital_R{row}_C{col}";
                    capital.transform.SetParent(pillar.transform, false);
                    capital.transform.localPosition = new Vector3(0f, 1.0f, 0f);
                    capital.transform.localScale = new Vector3(1.6f, 0.35f, 1.6f);
                    capital.GetComponent<MeshRenderer>().sharedMaterial = pillarMat;
                }
            }

            // 3. Jasmine Bazaar Stalls
            var bazaarRoot = new GameObject("Jasmine_Bazaar_Stalls");
            bazaarRoot.transform.SetParent(detailRoot.transform, false);

            Color[] awningColors = {
                new Color(0.95f, 0.70f, 0.15f), // Marigold Saffron
                new Color(0.85f, 0.25f, 0.20f), // Kumkum Vermilion
                new Color(0.95f, 0.95f, 0.90f), // Jasmine White
                new Color(0.20f, 0.65f, 0.40f)  // Betel Green
            };

            for (int s = 0; s < 4; s++)
            {
                var stall = new GameObject($"Bazaar_Stall_{s + 1:D2}");
                stall.transform.SetParent(bazaarRoot.transform, false);
                stall.transform.position = new Vector3(-18f + (s * 12f), 0f, -18f);

                // Stall Counter
                var counter = GameObject.CreatePrimitive(PrimitiveType.Cube);
                counter.name = "Stall_Counter";
                counter.transform.SetParent(stall.transform, false);
                counter.transform.localPosition = new Vector3(0f, 0.5f, 0f);
                counter.transform.localScale = new Vector3(3.5f, 1.0f, 2.0f);

                // Awning
                var awning = GameObject.CreatePrimitive(PrimitiveType.Cube);
                awning.name = "Stall_Awning";
                awning.transform.SetParent(stall.transform, false);
                awning.transform.localPosition = new Vector3(0f, 2.4f, 0f);
                awning.transform.localScale = new Vector3(4.0f, 0.2f, 2.5f);
                awning.transform.localRotation = Quaternion.Euler(-12f, 0f, 0f);

                var awningMat = new Material(litShader) { name = $"Awning_Mat_{s}" };
                if (awningMat.HasProperty("_BaseColor")) awningMat.SetColor("_BaseColor", awningColors[s]);
                awning.GetComponent<MeshRenderer>().sharedMaterial = awningMat;
            }

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[BuildSangamExpansionScenes] Successfully upgraded: {path}");
        }

        public static void BuildKanyakumariScene()
        {
            string path = $"{SceneFolderPath}/10_Kanyakumari_Cape.unity";
            CreateSceneBackup(path);

            Scene scene;
            if (File.Exists(path))
            {
                scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            }
            else
            {
                scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                AssembleAllRegions.SetupSun(new Color(1.0f, 0.92f, 0.82f), 1.25f, Quaternion.Euler(35f, 45f, 0f));
                AssembleAllRegions.SetupCommonManagers("kanyakumari_cape", "Kanyakumari Oceans Confluence", "கன்னியாகுமரி முக்கடல் சங்கமம்");
                AssembleAllRegions.SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
                AssembleAllRegions.SetupHUD("Kanyakumari Cape", "கன்னியாகுமரி முக்கடல் சங்கமம்");
            }

            var envRoot = GameObject.Find("--- KANYAKUMARI_ENVIRONMENT ---");
            if (envRoot == null) envRoot = new GameObject("--- KANYAKUMARI_ENVIRONMENT ---");

            HideNilgirisClues(envRoot);
            HideNilgirisRidge(envRoot);

            var ground = envRoot.transform.Find("Coastal_Confluence_Rock");
            if (ground == null)
            {
                var g = GameObject.CreatePrimitive(PrimitiveType.Cube);
                g.name = "Coastal_Confluence_Rock";
                g.transform.SetParent(envRoot.transform, false);
                g.transform.position = new Vector3(0f, -0.1f, 0f);
                g.transform.localScale = new Vector3(80f, 0.2f, 80f);
            }

            var detailRoot = GameObject.Find("--- KANYAKUMARI_DETAIL_ROOT ---");
            if (detailRoot != null) UnityEngine.Object.DestroyImmediate(detailRoot);
            detailRoot = new GameObject("--- KANYAKUMARI_DETAIL_ROOT ---");
            detailRoot.transform.SetParent(envRoot.transform, false);

            Shader litShader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");

            // 1. Three Named Sea Water Bodies
            // Arabian Sea (West, Deep Sapphire)
            CreateSeaPlane("Water_ArabianSea", detailRoot.transform, new Vector3(-35f, -0.05f, 15f), new Vector3(30f, 0.1f, 50f), new Color(0.08f, 0.25f, 0.55f), litShader);
            // Indian Ocean (South, Confluence Azure)
            CreateSeaPlane("Water_IndianOcean", detailRoot.transform, new Vector3(0f, -0.05f, -35f), new Vector3(80f, 0.1f, 30f), new Color(0.05f, 0.35f, 0.65f), litShader);
            // Bay of Bengal (East, Turquoise Teal)
            CreateSeaPlane("Water_BayOfBengal", detailRoot.transform, new Vector3(35f, -0.05f, 15f), new Vector3(30f, 0.1f, 50f), new Color(0.10f, 0.45f, 0.50f), litShader);

            // 2. Sunrise / Sunset Lighting Rig
            var lightRig = new GameObject("Kanyakumari_SunriseSunset_Rig");
            lightRig.transform.SetParent(detailRoot.transform, false);
            var dawnSun = lightRig.AddComponent<Light>();
            dawnSun.type = LightType.Directional;
            dawnSun.color = new Color(1.0f, 0.82f, 0.65f); // Golden sunrise tint
            dawnSun.intensity = 1.35f;
            dawnSun.shadows = LightShadows.Soft;
            lightRig.transform.rotation = Quaternion.Euler(22f, 75f, 0f);

            // 3. Lighthouse Base & Coastal Rocks
            var lighthouseBase = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            lighthouseBase.name = "Confluence_Lighthouse_Tower";
            lighthouseBase.transform.SetParent(detailRoot.transform, false);
            lighthouseBase.transform.position = new Vector3(-20f, 8f, 10f);
            lighthouseBase.transform.localScale = new Vector3(4f, 8f, 4f);

            var stoneMat = new Material(litShader) { name = "Lighthouse_Stone_Mat" };
            if (stoneMat.HasProperty("_BaseColor")) stoneMat.SetColor("_BaseColor", new Color(0.88f, 0.88f, 0.85f));
            lighthouseBase.GetComponent<MeshRenderer>().sharedMaterial = stoneMat;

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[BuildSangamExpansionScenes] Successfully upgraded: {path}");
        }

        private static void CreateSeaPlane(string name, Transform parent, Vector3 pos, Vector3 scale, Color color, Shader shader)
        {
            var sea = GameObject.CreatePrimitive(PrimitiveType.Cube);
            sea.name = name;
            sea.transform.SetParent(parent, false);
            sea.transform.position = pos;
            sea.transform.localScale = scale;

            var mat = new Material(shader) { name = $"{name}_Mat" };
            if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", color);
            if (mat.HasProperty("_Color")) mat.SetColor("_Color", color);
            if (mat.HasProperty("_Smoothness")) mat.SetFloat("_Smoothness", 0.95f);
            sea.GetComponent<MeshRenderer>().sharedMaterial = mat;
        }

        public static void BuildAgasthyamalaiScene()
        {
            string path = $"{SceneFolderPath}/11_Agasthyamalai_Wilds.unity";
            CreateSceneBackup(path);

            Scene scene;
            if (File.Exists(path))
            {
                scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            }
            else
            {
                scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                AssembleAllRegions.SetupSun(new Color(0.88f, 0.94f, 1.0f), 1.1f, Quaternion.Euler(40f, -15f, 0f));
                AssembleAllRegions.SetupCommonManagers("agasthyamalai_wilds", "Agasthyamalai Sacred Biosphere", "அகத்தியமலை புனித உயிர்க்கோளம்");
                AssembleAllRegions.SetupPlayerAndCamera(new Vector3(0f, 0.5f, 0f));
                AssembleAllRegions.SetupHUD("Agasthyamalai Wilds", "அகத்தியமலை புனித உயிர்க்கோளம்");
            }

            var envRoot = GameObject.Find("--- AGASTHYAMALAI_ENVIRONMENT ---");
            if (envRoot == null) envRoot = new GameObject("--- AGASTHYAMALAI_ENVIRONMENT ---");

            HideNilgirisClues(envRoot);

            var ground = envRoot.transform.Find("Medicinal_Montane_Ridge");
            if (ground == null)
            {
                var g = GameObject.CreatePrimitive(PrimitiveType.Cube);
                g.name = "Medicinal_Montane_Ridge";
                g.transform.SetParent(envRoot.transform, false);
                g.transform.position = new Vector3(0f, -0.1f, 0f);
                g.transform.localScale = new Vector3(80f, 0.2f, 80f);
            }

            var detailRoot = GameObject.Find("--- AGASTHYAMALAI_DETAIL_ROOT ---");
            if (detailRoot != null) UnityEngine.Object.DestroyImmediate(detailRoot);
            detailRoot = new GameObject("--- AGASTHYAMALAI_DETAIL_ROOT ---");
            detailRoot.transform.SetParent(envRoot.transform, false);

            Shader litShader = Shader.Find("HDRP/Lit") ?? Shader.Find("Standard");

            // 1. Shola Forest Density (Tree Clusters & Medicinal Flora)
            var floraRoot = new GameObject("Shola_Medicinal_Flora");
            floraRoot.transform.SetParent(detailRoot.transform, false);

            var foliageMat = new Material(litShader) { name = "Shola_Canopy_Mat" };
            if (foliageMat.HasProperty("_BaseColor")) foliageMat.SetColor("_BaseColor", new Color(0.12f, 0.38f, 0.18f));

            var trunkMat = new Material(litShader) { name = "Shola_Trunk_Mat" };
            if (trunkMat.HasProperty("_BaseColor")) trunkMat.SetColor("_BaseColor", new Color(0.35f, 0.22f, 0.12f));

            for (int t = 0; t < 8; t++)
            {
                float angle = t * (Mathf.PI * 2f / 8f);
                float radius = 18f + (t % 3 * 4f);
                Vector3 treePos = new Vector3(Mathf.Cos(angle) * radius, 0f, Mathf.Sin(angle) * radius);

                var tree = new GameObject($"Shola_Tree_{t + 1:D2}");
                tree.transform.SetParent(floraRoot.transform, false);
                tree.transform.position = treePos;

                var trunk = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                trunk.name = "Trunk";
                trunk.transform.SetParent(tree.transform, false);
                trunk.transform.localPosition = new Vector3(0f, 2.5f, 0f);
                trunk.transform.localScale = new Vector3(0.8f, 2.5f, 0.8f);
                trunk.GetComponent<MeshRenderer>().sharedMaterial = trunkMat;

                var canopy = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                canopy.name = "Canopy";
                canopy.transform.SetParent(tree.transform, false);
                canopy.transform.localPosition = new Vector3(0f, 5.5f, 0f);
                canopy.transform.localScale = new Vector3(4.5f, 3.5f, 4.5f);
                canopy.GetComponent<MeshRenderer>().sharedMaterial = foliageMat;
            }

            // 2. Player-Triggered Mist Zones
            var mistRoot = new GameObject("Sacred_Mist_Trigger_Zones");
            mistRoot.transform.SetParent(detailRoot.transform, false);

            for (int m = 0; m < 2; m++)
            {
                var mistZone = new GameObject($"Mist_Trigger_Zone_{m + 1:D2}");
                mistZone.transform.SetParent(mistRoot.transform, false);
                mistZone.transform.position = new Vector3(-12f + (m * 24f), 1.5f, 10f);

                var col = mistZone.AddComponent<BoxCollider>();
                col.isTrigger = true;
                col.size = new Vector3(14f, 4f, 14f);
            }

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, path);
            Debug.Log($"[BuildSangamExpansionScenes] Successfully upgraded: {path}");
        }

        public static void UpgradeAllSangamScenes()
        {
            BuildMaduraiScene();
            BuildKanyakumariScene();
            BuildAgasthyamalaiScene();
        }
    }
}
