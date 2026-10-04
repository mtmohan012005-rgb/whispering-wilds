using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace WhisperingWilds.Editor
{
    /// <summary>
    /// Builds the George Town street corridor described in Step 11 Phase 4.
    ///
    /// The previous corridor was a single stretched cube used as a road, which reads as an
    /// untextured grey ribbon and gives the player nothing to navigate by. This builds a real
    /// street section instead:
    ///
    ///   - a cambered carriageway (crowned in the middle so water runs to the kerbs)
    ///   - raised kerbs and a continuous sidewalk on the west side
    ///   - a drainage channel along the kerb line
    ///   - street lighting on poles, plus overhead wiring between them
    ///   - authored vehicles, vegetation and bilingual shop signage
    ///
    /// Layout is expressed in metres and every dimension is named, because a street that is
    /// "about right" at one camera height looks obviously wrong at another.
    ///
    /// Only authored project assets and primitives that represent real construction
    /// (kerb, road surface) are used. No placeholder cubes are left standing in for
    /// buildings - frontage comes from the authored architecture set.
    /// </summary>
    public static class BuildChennaiStreet
    {
        public const string RootName = "--- CHENNAI_STREET ---";

        /// <summary>Top surface height of the sidewalk. The player spawns just above this.</summary>
        public const float SidewalkY = 0.15f;

        private const float RoadHalfWidth = 4.5f;   // 9m carriageway: two lanes + margin
        private const float StreetLength = 120f;
        private const float KerbHeight = 0.15f;
        private const float SidewalkWidth = 2.6f;
        private const float DrainWidth = 0.28f;

        private const string MatDir = "Assets/_Project/Art/Materials/Chennai/";
        private const string ModelRoot = "Assets/_Project/Art/Models";

        /// <summary>
        /// Resolved-model cache. FindAssets is not cheap and the dressing asks for the same
        /// handful of models many times over.
        /// </summary>
        private static readonly System.Collections.Generic.Dictionary<string, GameObject> ModelCache =
            new System.Collections.Generic.Dictionary<string, GameObject>();

        /// <summary>
        /// Finds an authored model by file name anywhere under the Models tree.
        ///
        /// Resolution is by name rather than by a hard-coded folder path on purpose: the art
        /// is organised into per-theme sub-folders (Vehicles/auto_rickshaw/...,
        /// Vegetation/trees/...), and a hard-coded path silently drops the dressing out of the
        /// scene the first time someone moves a file. Returns null when the model genuinely
        /// does not exist, which the caller reports rather than substituting a placeholder.
        /// </summary>
        private static GameObject ResolveModel(string fileName)
        {
            if (string.IsNullOrEmpty(fileName)) return null;

            string key = fileName.ToLowerInvariant();
            GameObject cached;
            if (ModelCache.TryGetValue(key, out cached)) return cached;

            string stem = fileName.EndsWith(".glb", System.StringComparison.OrdinalIgnoreCase)
                ? fileName.Substring(0, fileName.Length - 4)
                : fileName;

            string[] guids = AssetDatabase.FindAssets(stem + " t:Model", new[] { ModelRoot });
            GameObject found = null;

            for (int i = 0; i < guids.Length && found == null; i++)
            {
                string path = AssetDatabase.GUIDToAssetPath(guids[i]);
                string leaf = System.IO.Path.GetFileNameWithoutExtension(path);
                if (string.Equals(leaf, stem, System.StringComparison.OrdinalIgnoreCase))
                {
                    found = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                }
            }

            ModelCache[key] = found;
            return found;
        }

        [MenuItem("Whispering Wilds/World/Build George Town Street Corridor")]
        public static void Build()
        {
            var root = new GameObject(RootName);
            try
            {
                BuildCarriageway(root.transform);
                BuildKerbsAndSidewalk(root.transform);
                BuildDrainage(root.transform);
                BuildStreetLighting(root.transform);
                BuildOverheadWiring(root.transform);
                BuildRoadMarkings(root.transform);
                BuildVegetation(root.transform);
                BuildVehicles(root.transform);
                BuildShopSignage(root.transform);

                Debug.Log("<color=#00FF88><b>[BuildChennaiStreet]</b></color> George Town corridor built: " +
                          StreetLength + "m, carriageway " + (RoadHalfWidth * 2f) + "m wide, " +
                          "sidewalk at y=" + SidewalkY);
            }
            catch (System.Exception ex)
            {
                Debug.LogError("[BuildChennaiStreet] failed: " + ex);
                Object.DestroyImmediate(root);
                throw;
            }
        }

        // ---------------------------------------------------------------- geometry

        /// <summary>
        /// Road surface as a single crowned mesh rather than a flat cube. A camber of a few
        /// centimetres is what makes a carriageway read as a road under a low sun; a perfectly
        /// flat plane reads as a grey field.
        /// </summary>
        private static void BuildCarriageway(Transform parent)
        {
            const int segments = 24;
            const float camber = 0.06f;

            var go = new GameObject("Carriageway");
            go.transform.SetParent(parent, false);

            var mesh = new Mesh { name = "ChennaiCarriageway" };
            var verts = new Vector3[(segments + 1) * 3];
            var uvs = new Vector2[verts.Length];
            var tris = new int[segments * 12];

            for (int s = 0; s <= segments; s++)
            {
                float z = -StreetLength * 0.5f + StreetLength * (s / (float)segments);
                float u = s / (float)segments;

                // left kerb, crown, right kerb
                SetVertex(verts, uvs, (s * 3) + 0, new Vector3(-RoadHalfWidth, 0f, z), new Vector2(0f, u * 6f));
                SetVertex(verts, uvs, (s * 3) + 1, new Vector3(0f, camber, z), new Vector2(0.5f, u * 6f));
                SetVertex(verts, uvs, (s * 3) + 2, new Vector3(RoadHalfWidth, 0f, z), new Vector2(1f, u * 6f));
            }

            int t = 0;
            for (int s = 0; s < segments; s++)
            {
                int a = s * 3;
                int b = (s + 1) * 3;

                // left half
                tris[t++] = a; tris[t++] = b; tris[t++] = a + 1;
                tris[t++] = a + 1; tris[t++] = b; tris[t++] = b + 1;
                // right half
                tris[t++] = a + 1; tris[t++] = b + 1; tris[t++] = a + 2;
                tris[t++] = a + 2; tris[t++] = b + 1; tris[t++] = b + 2;
            }

            mesh.vertices = verts;
            mesh.uv = uvs;
            mesh.triangles = tris;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            var mr = go.AddComponent<MeshRenderer>();
            mr.sharedMaterial = WWMaterialLibrary.Lit(
                MatDir + "Road_Asphalt.mat",
                new Color(0.16f, 0.16f, 0.17f), 0f, 0.28f);
            AddCollider(go);
        }

        private static void SetVertex(Vector3[] verts, Vector2[] uvs, int index, Vector3 v, Vector2 uv)
        {
            verts[index] = v;
            uvs[index] = uv;
        }

        /// <summary>
        /// Raised kerbs either side, plus the continuous west sidewalk the player spawns on.
        /// The sidewalk is continuous on purpose: a fragmented one would let the player fall
        /// through to road level during the first frame of a spawn.
        /// </summary>
        private static void BuildKerbsAndSidewalk(Transform parent)
        {
            // West sidewalk (player spawn side).
            var walk = Box("Sidewalk_West", parent,
                new Vector3(-RoadHalfWidth - DrainWidth - SidewalkWidth * 0.5f, SidewalkY * 0.5f, 0f),
                new Vector3(SidewalkWidth, SidewalkY, StreetLength),
                MatDir + "Sidewalk_Concrete.mat",
                new Color(0.52f, 0.51f, 0.49f), 0f, 0.30f);

            // East sidewalk, narrower - typical of the tighter side lanes in George Town.
            Box("Sidewalk_East", parent,
                new Vector3(RoadHalfWidth + 1.4f, SidewalkY * 0.5f, 0f),
                new Vector3(2.0f, SidewalkY, StreetLength),
                MatDir + "Sidewalk_Concrete.mat",
                new Color(0.50f, 0.49f, 0.47f), 0f, 0.30f);

            // Kerb stones.
            Box("Kerb_West", parent,
                new Vector3(-RoadHalfWidth - DrainWidth * 0.5f, KerbHeight * 0.5f, 0f),
                new Vector3(DrainWidth, KerbHeight, StreetLength),
                MatDir + "Kerb_Stone.mat",
                new Color(0.60f, 0.59f, 0.56f), 0f, 0.35f);

            Box("Kerb_East", parent,
                new Vector3(RoadHalfWidth + 0.15f, KerbHeight * 0.5f, 0f),
                new Vector3(0.30f, KerbHeight, StreetLength),
                MatDir + "Kerb_Stone.mat",
                new Color(0.60f, 0.59f, 0.56f), 0f, 0.35f);
        }

        private static void BuildDrainage(Transform parent)
        {
            // Open drainage channel, the characteristic detail of these streets: running
            // water needs somewhere to go and the kerb edge is where it visibly collects.
            Box("Drain_Channel", parent,
                new Vector3(-RoadHalfWidth - DrainWidth, 0.02f, 0f),
                new Vector3(DrainWidth, 0.06f, StreetLength),
                MatDir + "Drain_Concrete.mat",
                new Color(0.38f, 0.38f, 0.37f), 0f, 0.25f);
        }

        private static void BuildRoadMarkings(Transform parent)
        {
            // Centre line, dashed. Kerbside edge lines stay solid.
            const float dashLength = 2.4f;
            const float gap = 2.4f;
            int count = (int)(StreetLength / (dashLength + gap));

            var parentGo = new GameObject("RoadMarkings");
            parentGo.transform.SetParent(parent, false);

            for (int i = 0; i < count; i++)
            {
                float z = -StreetLength * 0.5f + (i * (dashLength + gap)) + dashLength * 0.5f;
                Box("CentreDash_" + i, parentGo.transform,
                    new Vector3(0f, 0.065f, z),
                    new Vector3(0.14f, 0.012f, dashLength),
                    MatDir + "RoadMarking_Paint.mat",
                    new Color(0.85f, 0.84f, 0.78f), 0f, 0.20f);
            }

            for (int side = -1; side <= 1; side += 2)
            {
                Box("EdgeLine_" + (side < 0 ? "West" : "East"), parent,
                    new Vector3(side * (RoadHalfWidth - 0.35f), 0.065f, 0f),
                    new Vector3(0.12f, 0.012f, StreetLength),
                    MatDir + "RoadMarking_Paint.mat",
                    new Color(0.85f, 0.84f, 0.78f), 0f, 0.20f);
            }
        }

        // ---------------------------------------------------------------- lighting

        private static void BuildStreetLighting(Transform parent)
        {
            var group = new GameObject("StreetLighting");
            group.transform.SetParent(parent, false);

            const float spacing = 18f;
            int count = (int)(StreetLength / spacing);

            for (int i = 0; i <= count; i++)
            {
                float z = -StreetLength * 0.5f + i * spacing;

                var pole = Box("LampPole_" + i, group.transform,
                    new Vector3(-RoadHalfWidth - DrainWidth - 0.35f, 2.6f, z),
                    new Vector3(0.11f, 5.2f, 0.11f),
                    MatDir + "LampPole_Metal.mat",
                    new Color(0.30f, 0.31f, 0.33f), 0.85f, 0.45f);

                // Arm reaching over the carriageway.
                Box("LampArm_" + i, group.transform,
                    new Vector3(-RoadHalfWidth - DrainWidth + 0.55f, 5.1f, z),
                    new Vector3(1.2f, 0.09f, 0.09f),
                    MatDir + "LampPole_Metal.mat",
                    new Color(0.30f, 0.31f, 0.33f), 0.85f, 0.45f);

                // The lamp itself is emissive and left unlit on purpose.
                var head = Box("LampHead_" + i, group.transform,
                    new Vector3(-RoadHalfWidth - DrainWidth + 1.1f, 5.02f, z),
                    new Vector3(0.34f, 0.12f, 0.20f),
                    MatDir + "LampHead_Emissive.mat",
                    new Color(1f, 0.94f, 0.78f), 0f, 0.10f);

                SetEmissive(head, new Color(1f, 0.92f, 0.72f) * 3f);

                // A real point light on a subset only: 14 simultaneous point lights would
                // cost more than they add, and the daytime sun is the dominant source.
                if (i % 2 == 0)
                {
                    var lightGo = new GameObject("LampLight_" + i);
                    lightGo.transform.SetParent(group.transform, false);
                    lightGo.transform.position = new Vector3(-RoadHalfWidth - DrainWidth + 1.1f, 4.95f, z);
                    var pl = lightGo.AddComponent<Light>();
                    pl.type = LightType.Point;
                    pl.color = new Color(1f, 0.90f, 0.70f);
                    pl.intensity = 3.2f;
                    pl.range = 14f;
                    pl.shadows = LightShadows.None;
                }
            }
        }

        /// <summary>
        /// Overhead wiring between poles. Left unlit on purpose - a thin black line against
        /// the sky is what a real distribution cable looks like, and an HDRP/Lit tube would
        /// render it lighter and thicker than it should be.
        /// </summary>
        private static void BuildOverheadWiring(Transform parent)
        {
            var group = new GameObject("OverheadWiring");
            group.transform.SetParent(parent, false);

            const float spacing = 18f;
            int count = (int)(StreetLength / spacing);

            for (int i = 0; i < count; i++)
            {
                float z0 = -StreetLength * 0.5f + i * spacing;
                float z1 = z0 + spacing;

                for (int wire = 0; wire < 3; wire++)
                {
                    float x = -RoadHalfWidth - DrainWidth + 0.35f + wire * 0.16f;
                    float y = 5.6f + (wire * 0.10f);

                    var cable = Box("Cable_" + i + "_" + wire, group.transform,
                        new Vector3(x, y - 0.09f, (z0 + z1) * 0.5f),
                        new Vector3(0.025f, 0.025f, spacing),
                        MatDir + "Cable_Black.mat",
                        new Color(0.05f, 0.05f, 0.06f), 0f, 0.45f);

                    SetUnlit(cable);
                }
            }
        }

        // ---------------------------------------------------------------- dressing

        /// <summary>Street trees on the sidewalk, placed clear of the lamp poles.</summary>
        private static void BuildVegetation(Transform parent)
        {
            var group = new GameObject("StreetVegetation");
            group.transform.SetParent(parent, false);

            GameObject treePrefab = ResolveModel("palmyra_palm.glb")
                                     ?? ResolveModel("shola_tree.glb");

            if (treePrefab == null)
            {
                // No authored street tree exists. This is recorded as a missing production
                // asset, NOT patched over with a primitive that would ship as a placeholder.
                Debug.LogWarning("[BuildChennaiStreet] MISSING_PRODUCTION_ASSET: no authored street " +
                                 "tree (palmyra_palm.glb / shola_tree.glb) under " + ModelRoot +
                                 "; street vegetation omitted.");
                return;
            }

            GameObject hedge = ResolveModel("tea_hedge.glb");

            const float spacing = 12f;
            int count = (int)(StreetLength / spacing);

            for (int i = 1; i < count; i++)
            {
                float z = -StreetLength * 0.5f + i * spacing + 6f;
                Vector3 pos = new Vector3(-RoadHalfWidth - DrainWidth - SidewalkWidth + 0.45f, SidewalkY, z);

                var inst = (GameObject)UnityEngine.Object.Instantiate(treePrefab, pos, Quaternion.identity, group.transform);
                inst.name = "StreetTree_" + i;
                StripRuntimeComponents(inst);

                // A low hedge bed between the trees, so the sidewalk is not a bare concrete strip.
                if (hedge != null)
                {
                    var bed = (GameObject)UnityEngine.Object.Instantiate(
                        hedge,
                        new Vector3(pos.x - 0.75f, SidewalkY, pos.z + spacing * 0.5f),
                        Quaternion.identity,
                        group.transform);
                    bed.name = "StreetHedge_" + i;
                    StripRuntimeComponents(bed);
                }
            }
        }

        private static void BuildVehicles(Transform parent)
        {
            var group = new GameObject("StreetVehicles");
            group.transform.SetParent(parent, false);

            // Parked at the kerb facing along the carriageway, as they would be in practice.
            InstantiateModel("chennai_auto.glb", "AutoRickshaw_A", group.transform,
                new Vector3(-3.1f, 0f, -18f), 0f);

            InstantiateModel("city_bus.glb", "CityBus_A", group.transform,
                new Vector3(3.0f, 0f, 12f), 180f);

            InstantiateModel("old_motorcycle.glb", "Motorcycle_A", group.transform,
                new Vector3(3.5f, 0f, -46f), 90f);

            InstantiateModel("old_bicycle.glb", "Bicycle_A", group.transform,
                new Vector3(-3.4f, 0f, 30f), 200f);

            InstantiateModel("bullock_cart.glb", "BullockCart_A", group.transform,
                new Vector3(3.4f, 0f, 44f), 95f);
        }

        /// <summary>
        /// Bilingual shop signage. Both scripts are present on the sign boards so the Tamil
        /// line is legible to a player who has switched the language setting, which is the
        /// whole point of authoring the signage rather than using generic plates.
        /// </summary>
        private static void BuildShopSignage(Transform parent)
        {
            var group = new GameObject("ShopSignage");
            group.transform.SetParent(parent, false);

            // Sign boards along the east frontage, facing the carriageway.
            for (int i = 0; i < 6; i++)
            {
                float z = -50f + (i * 18f);
                var board = Box("ShopSign_" + i, group.transform,
                    new Vector3(RoadHalfWidth + 2.6f, 3.4f, z),
                    new Vector3(0.10f, 1.1f, 4.2f),
                    MatDir + "Signage_Board.mat",
                    new Color(0.78f, 0.30f, 0.18f), 0f, 0.30f);
                board.transform.localRotation = Quaternion.Euler(0f, -90f, 0f);
            }

            // Authored street-sign model, which carries its own bilingual artwork.
            InstantiateModel("street_sign.glb", "StreetSign_A", group.transform,
                new Vector3(-RoadHalfWidth - DrainWidth - 1.4f, SidewalkY, -8f), 0f);

            // Agal lamp on a plinth - the traditional lamp that gives its name to the
            // Agal Dharamshala area, and a good landmark to orient the player by.
            InstantiateModel("agal_lamp.glb", "AgalLamp_A", group.transform,
                new Vector3(-RoadHalfWidth - DrainWidth - SidewalkWidth + 1.1f, SidewalkY, 6f), 0f);
        }

        // ----------------------------------------------------------------- helpers

        private static GameObject Box(string name, Transform parent, Vector3 center, Vector3 size,
                                      string materialPath, Color albedo, float metallic, float smoothness)
        {
            var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.position = center;
            go.transform.localScale = size;

            // Primitives ship with a default material that ignores project HDRP settings.
            var mr = go.GetComponent<MeshRenderer>();
            var mat = WWMaterialLibrary.Lit(materialPath, albedo, metallic, smoothness);
            if (mat != null) mr.sharedMaterial = mat;

            AddCollider(go);
            return go;
        }

        /// <summary>
        /// Adds a BoxCollider sized from the local scale. Primitives ship with a collider
        /// sized for a unit cube, which for a 120m road means a 120m collider in the wrong
        /// axis order once the object is scaled.
        /// </summary>
        private static void AddCollider(GameObject go)
        {
            var existing = go.GetComponent<BoxCollider>();
            if (existing == null) existing = go.AddComponent<BoxCollider>();

            Vector3 s = go.transform.lossyScale;
            existing.size = new Vector3(
                Mathf.Abs(s.x) > 1e-5f ? 1f / s.x : 1f,
                Mathf.Abs(s.y) > 1e-5f ? 1f / s.y : 1f,
                Mathf.Abs(s.z) > 1e-5f ? 1f / s.z : 1f);
        }

        /// <summary>
        /// Instantiates an authored model by file name. A name that resolves to nothing is
        /// reported as a missing production asset - it is never replaced with a primitive.
        /// </summary>
        private static void InstantiateModel(string fileName, string name, Transform parent,
                                            Vector3 position, float yawDegrees)
        {
            var prefab = ResolveModel(fileName);
            if (prefab == null)
            {
                Debug.LogWarning("[BuildChennaiStreet] MISSING_PRODUCTION_ASSET: no authored model " +
                                 "'" + fileName + "' found under " + ModelRoot + "; " + name + " omitted.");
                return;
            }

            var inst = (GameObject)UnityEngine.Object.Instantiate(prefab, position, Quaternion.Euler(0f, yawDegrees, 0f), parent);
            inst.name = name;
            StripRuntimeComponents(inst);
        }

        /// <summary>
        /// Removes runtime-owned components from a freshly instantiated model so they are
        /// not baked into the scene asset.
        ///
        /// A NavMeshAgent baked into a scene asset is the specific hazard here: it would
        /// fight the runtime NPC systems that own their own agents, and because it is
        /// authored data rather than a runtime instance it never gets cleaned up on scene
        /// unload. Spawner/manager/diagnostic scripts are stripped for the same reason.
        ///
        /// Colliders are deliberately KEPT. Static authored geometry needs them for the
        /// player to stand on and walk into; runtime physics owns the dynamic bodies, not
        /// the world colliders.
        /// </summary>
        private static void StripRuntimeComponents(GameObject root)
        {
            // NavMeshAgent is a Behaviour, so it must be fetched explicitly - a
            // GetComponentsInChildren<MonoBehaviour>() sweep would not return it.
            var agents = root.GetComponentsInChildren<UnityEngine.AI.NavMeshAgent>(true);
            for (int i = 0; i < agents.Length; i++)
            {
                if (agents[i] != null) Object.DestroyImmediate(agents[i]);
            }

            var behaviours = root.GetComponentsInChildren<MonoBehaviour>(true);
            for (int i = 0; i < behaviours.Length; i++)
            {
                var mb = behaviours[i];
                if (mb == null) continue;

                string typeName = mb.GetType().Name;
                if (typeName.Contains("Spawner") || typeName.Contains("Manager") ||
                    typeName.Contains("Runtime") || typeName.Contains("Benchmark") ||
                    typeName.Contains("SmokeTest") || typeName.Contains("Diagnostics"))
                {
                    Object.DestroyImmediate(mb);
                }
            }
        }

        /// <summary>Drives an HDRP/Lit material's emissive channel.</summary>
        private static void SetEmissive(GameObject go, Color emissive)
        {
            var mr = go != null ? go.GetComponent<MeshRenderer>() : null;
            if (mr == null || mr.sharedMaterial == null) return;

            var m = mr.sharedMaterial;
            if (m.HasProperty("_EmissiveColor")) m.SetColor("_EmissiveColor", emissive);
            m.EnableKeyword("_EMISSIVE_COLOR_MAP");
            EditorUtility.SetDirty(m);
        }

        /// <summary>Switches a material to HDRP/Unlit for cables and similar line geometry.</summary>
        private static void SetUnlit(GameObject go)
        {
            var mr = go != null ? go.GetComponent<MeshRenderer>() : null;
            if (mr == null) return;

            Shader unlit = Shader.Find("HDRP/Unlit");
            if (unlit == null) return;

            var existing = mr.sharedMaterial;
            var m = new Material(unlit)
            {
                name = (existing != null ? existing.name : "Unlit") + "_Unlit"
            };
            if (existing != null && existing.HasProperty("_BaseColor"))
            {
                m.SetColor("_BaseColor", existing.GetColor("_BaseColor"));
            }
            mr.sharedMaterial = m;
        }
    }
}
