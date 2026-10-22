using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;
using UnityEditor;
using UnityEditor.Animations;
using WhisperingWilds.Characters;

namespace WhisperingWilds.Editor.Characters
{
    /// <summary>
    /// STEP 29 authoring orchestrator. Builds every procedural character asset into real Unity
    /// assets and stamps the prefabs the game actually spawns:
    ///  - PlayerCharacter.prefab (visual rig + appearance system wiring)
    ///  - NPC_Murugan / NPC_Velu / NPC_Selvam / NPC_Meenakshi / NPC_Artisan / NPC_Farmer /
    ///    NPC_Fisher / NPC_ForestGuide / NPC_TeaWorker
    /// Shared assets (meshes, textures, materials, clips, controllers) are created once and
    /// reused so prefab/scene references stay stable; prefabs are rewritten in place.
    /// </summary>
    public static class CharacterAssetBuilder
    {
        const string ProceduralRoot = "Assets/_Project/Art/Characters/Procedural";
        const string ClipDir = ProceduralRoot + "/Clips";
        const string TextureDir = ProceduralRoot + "/Textures";
        const string MaterialDir = ProceduralRoot + "/Materials";
        const string AvatarPath = ProceduralRoot + "/GenericAvatar.asset";
        const string ControllerDir = "Assets/_Project/Art/Animations/Characters";
        const string PlayerControllerPath = ControllerDir + "/PlayerCharacter.controller";
        const string NpcControllerPath = ControllerDir + "/NPCCharacter.controller";

        private const string SkinBase = "skin_";
        private const string HairBase = "hair_";

        [MenuItem("Whispering Wilds/Characters/Build All Characters")]
        public static void BuildAllCharactersMenuItem()
        {
            BuildAllCharacters();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
        }

        public static void BuildAllCharactersBatch()
        {
            try
            {
                Debug.Log("[Characters] Starting batch character build...");
                BuildAllCharacters();
                AssetDatabase.SaveAssets();
                AssetDatabase.Refresh();
                Debug.Log("[Characters] Batch character build finished successfully.");
            }
            catch (Exception ex)
            {
                Debug.LogError($"[Characters] Batch character build failed: {ex}");
                EditorApplication.Exit(1);
            }
        }

        public static void BuildAllCharacters()
        {
            // ---- reusable shared assets (created once, stable GUIDs) ----
            var textures = LoadOrBuildTextures();
            var normals = LoadOrBuildNormals();
            var materials = LoadOrBuildMaterials(textures, normals);

            // Reference rig used to bake bind poses; discarded afterwards (bone order is stable).
            var refRig = new GameObject("_CharacterFactoryRefRig");
            var refBones = CharacterFactory.BuildRig(refRig.transform);
            var boneCache = new Dictionary<string, Transform>(refBones);

            Mesh LoadOrCreateMesh(string name, Func<Dictionary<string, int>, Mesh> build, bool forceRebuild = false)
            {
                string path = $"{ProceduralRoot}/{name}.asset";
                var mesh = AssetDatabase.LoadAssetAtPath<Mesh>(path);
                if (mesh == null || forceRebuild)
                {
                    var idx = new Dictionary<string, int>(StringComparer.Ordinal);
                    for (int i = 0; i < CharacterFactory.RigBoneNames.Length; i++) idx[CharacterFactory.RigBoneNames[i]] = i;
                    var newMesh = build(idx);
                    newMesh.bindposes = Utils.BoneWorldToLocal(refBones);
                    if (mesh == null)
                    {
                        AssetDatabase.CreateAsset(newMesh, path);
                        mesh = newMesh;
                    }
                    else
                    {
                        mesh.Clear();
                        EditorUtility.CopySerialized(newMesh, mesh);
                        AssetDatabase.SaveAssets();
                    }
                    AssetDatabase.SaveAssets();
                }
                return mesh;
            }

            var bodyMesh = LoadOrCreateMesh("Mesh_Body", CharacterFactory.BuildBodyMesh);
            var handsMesh = LoadOrCreateMesh("Mesh_Hands", CharacterFactory.BuildHandsMesh);
            var headMale = LoadOrCreateMesh("Mesh_HeadMale", d => CharacterFactory.BuildHeadMesh(d, false), true);
            var headFemale = LoadOrCreateMesh("Mesh_HeadFemale", d => CharacterFactory.BuildHeadMesh(d, true), true);

            // Distinct culturally grounded 3D character head meshes
            var headGeneric = LoadOrCreateMesh("Mesh_Head_GenericMale", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.GenericMale), true);
            var headMurugan = LoadOrCreateMesh("Mesh_Head_Murugan", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.Murugan), true);
            var headVelu = LoadOrCreateMesh("Mesh_Head_Velu", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.Velu), true);
            var headSelvam = LoadOrCreateMesh("Mesh_Head_Selvam", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.Selvam), true);
            var headMeenakshi = LoadOrCreateMesh("Mesh_Head_Meenakshi", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.Meenakshi), true);
            var headArtisan = LoadOrCreateMesh("Mesh_Head_Artisan", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.Artisan), true);
            var headFarmer = LoadOrCreateMesh("Mesh_Head_Farmer", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.Farmer), true);
            var headFisher = LoadOrCreateMesh("Mesh_Head_Fisher", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.Fisher), true);
            var headForestGuide = LoadOrCreateMesh("Mesh_Head_ForestGuide", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.ForestGuide), true);
            var headTeaWorker = LoadOrCreateMesh("Mesh_Head_TeaWorker", d => CharacterFactory.BuildRoleHeadMesh(d, CharacterFactory.NpcHeadRole.TeaWorker), true);

            var upperShirt = LoadOrCreateMesh("Mesh_UpperShirt", CharacterFactory.BuildUpperShirtMesh);
            var upperBlouse = LoadOrCreateMesh("Mesh_UpperBlouse", CharacterFactory.BuildUpperBlouseMesh);
            var lowerVeshti = LoadOrCreateMesh("Mesh_LowerVeshti", CharacterFactory.BuildLowerVeshtiMesh);
            var lowerLungi = LoadOrCreateMesh("Mesh_LowerLungi", CharacterFactory.BuildLowerLungiMesh);
            var lowerSari = LoadOrCreateMesh("Mesh_LowerSariSkirt", CharacterFactory.BuildLowerSariSkirtMesh);
            var thunduMesh = LoadOrCreateMesh("Mesh_AccessoryThundu", CharacterFactory.BuildAccessoryThunduMesh);
            var palluMesh = LoadOrCreateMesh("Mesh_AccessoryPallu", CharacterFactory.BuildAccessoryPalluMesh);
            // Clips must be authored while the reference rig is still alive: the curve paths are
            // derived from the real bone hierarchy (RigRoot/CharacterOffset/Root/Hips/...).
            var clips = LoadOrBuildClips(boneCache);
            var playerController = LoadOrBuildPlayerController(clips);
            var npcController = LoadOrBuildNpcController(clips);

            UnityEngine.Object.DestroyImmediate(refRig);

            // ---- prefabs (rewritten in place every run) ----
            EnsureDirectory(CharacterPrefabCatalog.CharacterPrefabRoot);
            BuildPlayerPrefab(materials, clips, playerController, bodyMesh, handsMesh, headGeneric,
                upperShirt, lowerVeshti, thunduMesh);
            BuildNpcPrefab(CharacterPrefabCatalog.MuruganPrefabPath, "Murugan", false, materials,
                npcController, bodyMesh, handsMesh, headMurugan, upperShirt, lowerVeshti, thunduMesh,
                Archetype("skin_wheat", "hair_black", "fabric_cream", "veshti_white", "pallu_cream"));
            BuildNpcPrefab(CharacterPrefabCatalog.VeluPrefabPath, "Velu", false, materials,
                npcController, bodyMesh, handsMesh, headVelu, upperShirt, lowerVeshti, thunduMesh,
                Archetype("skin_bronze", "hair_black", "fabric_mustard", "veshti_navy", "thundu_red"));
            BuildNpcPrefab(CharacterPrefabCatalog.SelvamPrefabPath, "Selvam", false, materials,
                npcController, bodyMesh, handsMesh, headSelvam, upperShirt, lowerLungi, palluMesh,
                Archetype("skin_deep", "hair_black", "fabric_white", "lungi_red", null));
            BuildNpcPrefab(CharacterPrefabCatalog.MeenakshiPrefabPath, "Meenakshi", true, materials,
                npcController, bodyMesh, handsMesh, headMeenakshi, upperBlouse, lowerSari, palluMesh,
                Archetype("skin_wheat", "hair_black", "sari_crimson", "sari_crimson", "pallu_red"));
            BuildNpcPrefab(CharacterPrefabCatalog.ArtisanPrefabPath, "Artisan", false, materials,
                npcController, bodyMesh, handsMesh, headArtisan, upperShirt, lowerVeshti, thunduMesh,
                Archetype("skin_bronze", "hair_black", "fabric_blue", "veshti_white", "thundu_red"));
            BuildNpcPrefab(CharacterPrefabCatalog.FarmerPrefabPath, "Farmer", false, materials,
                npcController, bodyMesh, handsMesh, headFarmer, upperShirt, lowerVeshti, thunduMesh,
                Archetype("skin_wheat", "hair_black", "fabric_cream", "veshti_white", "pallu_cream"));
            BuildNpcPrefab(CharacterPrefabCatalog.FisherPrefabPath, "Fisher", false, materials,
                npcController, bodyMesh, handsMesh, headFisher, upperShirt, lowerLungi, palluMesh,
                Archetype("skin_deep", "hair_brown", "fabric_white", "lungi_blue", null));
            BuildNpcPrefab(CharacterPrefabCatalog.ForestGuidePrefabPath, "ForestGuide", false, materials,
                npcController, bodyMesh, handsMesh, headForestGuide, upperShirt, lowerVeshti, thunduMesh,
                Archetype("skin_bronze", "hair_black", "fabric_mustard", "veshti_navy", "wool_shawl"));
            BuildNpcPrefab(CharacterPrefabCatalog.TeaWorkerPrefabPath, "TeaWorker", false, materials,
                npcController, bodyMesh, handsMesh, headTeaWorker, upperShirt, lowerVeshti, thunduMesh,
                Archetype("skin_wheat", "hair_black", "fabric_green", "veshti_white", "wool_shawl"));

            Debug.Log($"[Characters] Build all characters complete. " +
                      $"Prefabs: {CharacterPrefabCatalog.PlayerPrefabPath} + 9 NPC prefabs; clips: {clips.Count}; shared meshes + textures + materials.");
        }

        // ------------------------------------------------------------------
        // Archetypes
        // ------------------------------------------------------------------
        private struct ArchetypeSpec
        {
            public string skin, hair, upper, lower, accessory;
        }

        private static ArchetypeSpec Archetype(string skin, string hair, string upper, string lower, string accessory)
            => new ArchetypeSpec { skin = skin, hair = hair, upper = upper, lower = lower, accessory = accessory };

        // ------------------------------------------------------------------
        // Prefab composition
        // ------------------------------------------------------------------
        private sealed class CharacterRigParts
        {
            public GameObject Root;
            public GameObject RigRoot;
            public GameObject Body, Hands, Head, Upper, Lower, Accessory;
        }

        private static void BuildPlayerPrefab(
            Dictionary<string, Material> materials, Dictionary<string, AnimationClip> clips,
            AnimatorController controller, Mesh body, Mesh hands, Mesh head, Mesh upper, Mesh lower, Mesh accessory)
        {
            string path = CharacterPrefabCatalog.PlayerPrefabPath;
            var root = new GameObject("PlayerCharacter");
            var parts = ComposeVisual(root, materials, controller, body, hands, head, upper, lower, accessory,
                false, "skin_wheat", "hair_black", "sari_crimson", "sari_crimson", "pallu_red");

            // CharacterController for locomotion and editor rig audit verification
            var cc = root.AddComponent<CharacterController>();
            cc.height = 1.8f;
            cc.radius = 0.35f;
            cc.center = new Vector3(0f, 0.9f, 0f);

            // ---- PlayerVisualState wiring ----
            var visual = root.AddComponent<PlayerVisualState>();
            var so = new SerializedObject(visual);
            so.FindProperty("garmentUpper").objectReferenceValue = parts.Upper.GetComponent<SkinnedMeshRenderer>();
            so.FindProperty("garmentLower").objectReferenceValue = parts.Lower.GetComponent<SkinnedMeshRenderer>();
            so.FindProperty("garmentAccessory").objectReferenceValue = parts.Accessory.GetComponent<SkinnedMeshRenderer>();
            so.FindProperty("skinBodyRenderer").objectReferenceValue = parts.Body.GetComponent<SkinnedMeshRenderer>();
            so.FindProperty("skinHandsRenderer").objectReferenceValue = parts.Hands.GetComponent<SkinnedMeshRenderer>();
            so.FindProperty("headRenderer").objectReferenceValue = parts.Head.GetComponent<SkinnedMeshRenderer>();
            so.FindProperty("hairBraidRenderer").objectReferenceValue = null;
            so.FindProperty("rootBone").objectReferenceValue = FindBoneRecursive(parts.RigRoot.transform, CharacterFactory.RootBone);
            so.FindProperty("authoredHipHeight").floatValue = CharacterFactory.HipWorldY;

            FillOptionList(so, "skinTones", new[] { "skin_fair", "skin_wheat", "skin_bronze", "skin_deep" }, materials);
            FillOptionList(so, "hairColors", new[] { "hair_black", "hair_brown", "hair_grey" }, materials);

            var outfits = so.FindProperty("outfits");
            outfits.ClearArray();
            void AddOutfit(int index, string outfitName, string upperMat, string lowerMat, string accMat)
            {
                outfits.InsertArrayElementAtIndex(index);
                var elem = outfits.GetArrayElementAtIndex(index);
                elem.FindPropertyRelative("outfit").enumValueIndex = index;
                elem.FindPropertyRelative("upper").objectReferenceValue = materials[upperMat];
                elem.FindPropertyRelative("lower").objectReferenceValue = materials[lowerMat];
                elem.FindPropertyRelative("accessory").objectReferenceValue = accMat == null ? null : materials[accMat];
            }
            // Order must match RegionalOutfitType enum.
            AddOutfit(0, "EverydayChennai", "fabric_white", "veshti_navy", "thundu_red");
            AddOutfit(1, "CauveryVillage", "fabric_cream", "veshti_white", "pallu_cream");
            AddOutfit(2, "ThanjavurFestival", "fabric_cream", "veshti_festival", "thundu_red");
            AddOutfit(3, "PichavaramFisher", "fabric_white", "lungi_red", "pallu_cream");
            AddOutfit(4, "NilgiriColdWeather", "fabric_green", "lungi_blue", "wool_shawl");
            so.ApplyModifiedPropertiesWithoutUndo();

            PrefabUtility.SaveAsPrefabAsset(root, path);
            UnityEngine.Object.DestroyImmediate(root);
        }

        private static void BuildNpcPrefab(
            string path, string displayName, bool female,
            Dictionary<string, Material> materials, AnimatorController controller,
            Mesh body, Mesh hands, Mesh head, Mesh upper, Mesh lower, Mesh accessory,
            ArchetypeSpec archetype)
        {
            var root = new GameObject("NPC_" + displayName);
            ComposeVisual(root, materials, controller, body, hands, head, upper, lower, accessory,
                female, archetype.skin, archetype.hair, archetype.upper, archetype.lower, archetype.accessory);

            // Interaction collider for NPC interaction and editor rig audit verification
            var col = root.AddComponent<CapsuleCollider>();
            col.height = 1.8f;
            col.radius = 0.4f;
            col.center = new Vector3(0f, 0.9f, 0f);

            // Autonomous NPC character component
            var npc = root.AddComponent<WhisperingWilds.NPC.NPCCharacter>();
            npc.SetCharacterProfile(displayName, displayName, "", "Resident");

            PrefabUtility.SaveAsPrefabAsset(root, path);
            UnityEngine.Object.DestroyImmediate(root);
        }

        private static CharacterRigParts ComposeVisual(
            GameObject root, Dictionary<string, Material> materials, AnimatorController controller,
            Mesh body, Mesh hands, Mesh head, Mesh upper, Mesh lower, Mesh accessory,
            bool female, string skinKey, string hairKey, string upperKey, string lowerKey, string accessoryKey)
        {
            var rigRoot = new GameObject("RigRoot");
            rigRoot.transform.SetParent(root.transform, false);

            var bones = CharacterFactory.BuildRig(rigRoot.transform);
            var parts = new CharacterRigParts { Root = root, RigRoot = rigRoot };

            // Bind poses are baked into the shared meshes against the reference rig; the runtime
            // rig is structurally identical, so bind poses and bone indices line up 1:1.
            Material[] skinMats = { materials[skinKey] };
            Material[] headMats = { materials[skinKey], materials["features"], materials[hairKey] };

            parts.Body = AddSkinned(rigRoot.transform, "Mesh_Body", body, bones, materials[skinKey]);
            parts.Hands = AddSkinned(rigRoot.transform, "Mesh_Hands", hands, bones, materials[skinKey]);
            parts.Head = AddSkinnedMulti(rigRoot.transform, female ? "Mesh_Head" : "Mesh_Head", head, bones, headMats);
            parts.Upper = AddSkinned(rigRoot.transform, "Mesh_Garment_Upper", upper, bones, materials[upperKey]);
            parts.Lower = AddSkinned(rigRoot.transform, "Mesh_Garment_Lower", lower, bones, materials[lowerKey]);
            parts.Accessory = accessoryKey == null
                ? AddSkinned(rigRoot.transform, "Mesh_Garment_Accessory", accessory, bones, materials["fabric_white"])
                : AddSkinned(rigRoot.transform, "Mesh_Garment_Accessory", accessory, bones, materials[accessoryKey]);
            if (accessoryKey == null) parts.Accessory.SetActive(false);

            var animator = rigRoot.AddComponent<Animator>();
            animator.runtimeAnimatorController = controller;
            animator.applyRootMotion = false;
            animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
            animator.avatar = LoadOrCreateSharedAvatar(rigRoot);
            return parts;
        }

        /// <summary>
        /// A Generic avatar built with AvatarBuilder is an editor-only object; assigned directly to a
        /// prefab it loads as null in a built player. Persist it as an asset (stable GUID, created once)
        /// and reference that from every prefab — all prefabs share an identical rig, so one avatar works.
        /// </summary>
        private static Avatar LoadOrCreateSharedAvatar(GameObject rigRoot)
        {
            var avatar = AssetDatabase.LoadAssetAtPath<Avatar>(AvatarPath);
            if (avatar == null)
            {
                avatar = CharacterFactory.BuildGenericAvatar(rigRoot);
                if (avatar == null)
                    Debug.LogError($"[Characters] Generic avatar build FAILED for '{rigRoot.name}'. Animator will not drive the rig.");
                else
                {
                    AssetDatabase.CreateAsset(avatar, AvatarPath);
                    AssetDatabase.SaveAssets();
                }
            }
            return avatar;
        }

        private static GameObject AddSkinned(Transform parent, string name, Mesh mesh, Dictionary<string, Transform> boneMap, Material material)
            => AddSkinnedMulti(parent, name, mesh, boneMap, new[] { material });

        private static GameObject AddSkinnedMulti(Transform parent, string name, Mesh mesh, Dictionary<string, Transform> boneMap, Material[] materials)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            var smr = go.AddComponent<SkinnedMeshRenderer>();
            smr.sharedMesh = mesh;
            smr.rootBone = boneMap[CharacterFactory.RootBone];
            smr.bones = Array.ConvertAll(CharacterFactory.RigBoneNames, n => boneMap[n]);
            smr.sharedMaterials = materials;
            return go;
        }

        private static Transform FindBoneRecursive(Transform parent, string name)
        {
            for (int i = 0; i < parent.childCount; i++)
            {
                Transform child = parent.GetChild(i);
                if (child.name == name) return child;
                Transform nested = FindBoneRecursive(child, name);
                if (nested != null) return nested;
            }
            return null;
        }

        private static void FillOptionList(SerializedObject so, string propertyName, string[] ids, Dictionary<string, Material> mats)
        {
            var list = so.FindProperty(propertyName);
            list.ClearArray();
            for (int i = 0; i < ids.Length; i++)
            {
                list.InsertArrayElementAtIndex(i);
                var elem = list.GetArrayElementAtIndex(i);
                elem.FindPropertyRelative("id").stringValue = ids[i];
                elem.FindPropertyRelative("material").objectReferenceValue = mats.ContainsKey(ids[i]) ? mats[ids[i]] : null;
            }
        }

        // ------------------------------------------------------------------
        // Shared asset loading
        // ------------------------------------------------------------------
        private static Dictionary<string, Texture2D> LoadOrBuildTextures()
        {
            var result = new Dictionary<string, Texture2D>();
            EnsureDirectory(TextureDir);
            var built = CharacterFactory.BuildTextures();
            foreach (var pair in built)
            {
                string path = $"{TextureDir}/{pair.Key}.png";
                var existing = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                if (existing == null)
                {
                    CharacterFactory.SaveTexture(path, pair.Value);
                    existing = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                }
                result[pair.Key] = existing;
            }
            return result;
        }

        private static Dictionary<string, Texture2D> LoadOrBuildNormals()
        {
            var result = new Dictionary<string, Texture2D>();
            EnsureDirectory(TextureDir);
            // Normals are derived from the height/skin signal. The albedo assets on disk are
            // imported non-readable, so sample fresh readable CPU copies instead.
            var cpuAlbedo = CharacterFactory.BuildTextures();
            var built = CharacterFactory.BuildNormals(cpuAlbedo);
            foreach (var pair in built)
            {
                string path = $"{TextureDir}/{pair.Key}_normal.png";
                var existing = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                if (existing == null)
                {
                    CharacterFactory.SaveTexture(path, pair.Value);
                    existing = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                }
                result[pair.Key] = existing;
            }
            return result;
        }

        private static Dictionary<string, Material> LoadOrBuildMaterials(Dictionary<string, Texture2D> albedo, Dictionary<string, Texture2D> normals)
        {
            var result = new Dictionary<string, Material>();
            EnsureDirectory(MaterialDir);
            foreach (var pair in albedo)
            {
                string path = $"{MaterialDir}/M_{pair.Key}.mat";
                var mat = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (mat == null)
                {
                    float smooth = pair.Key.StartsWith(SkinBase) ? 0.55f
                        : pair.Key.StartsWith(HairBase) ? 0.40f
                        : pair.Key == "features" ? 0.30f
                        : pair.Key.StartsWith("sari") || pair.Key.StartsWith("pallu") ? 0.70f
                        : pair.Key.StartsWith("wool") ? 0.25f
                        : 0.38f;
                    mat = CharacterFactory.BuildHdrpMaterial("M_" + pair.Key, pair.Value,
                        normals.TryGetValue(pair.Key, out var n) ? n : null, smooth);
                    AssetDatabase.CreateAsset(mat, path);
                    AssetDatabase.SaveAssets();
                    // Default imported PNGs are sRGB; keep HDRP Lit input valid.
                    var settings = AssetImporter.GetAtPath(AssetDatabase.GetAssetPath(pair.Value));
                    if (settings is TextureImporter imp)
                    {
                        imp.sRGBTexture = true;
                        imp.SaveAndReimport();
                    }
                }
                result[pair.Key] = mat;
            }
            return result;
        }

        private static Dictionary<string, AnimationClip> LoadOrBuildClips(Dictionary<string, Transform> bones)
        {
            var result = new Dictionary<string, AnimationClip>();
            EnsureDirectory(ClipDir);

            // Clips are re-authored into the existing .anim assets instead of being recreated:
            // the asset GUID has to stay stable because the animator controllers and every
            // character prefab reference these clips.
            var clips = CharacterFactory.BuildClips(bones, (name, duration) =>
            {
                string path = $"{ClipDir}/{name}.anim";
                var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(path);
                if (clip == null)
                {
                    clip = new AnimationClip
                    {
                        name = name,
                        frameRate = CharacterFactory.ClipFrameRate,
                        wrapMode = WrapMode.Loop
                    };
                    AssetDatabase.CreateAsset(clip, path);
                }
                return clip;
            });

            foreach (var pair in clips)
            {
                var clip = pair.Value;
                // m_LoopTime drives the Animator: without it a locomotion clip plays once and
                // freezes on its last frame instead of cycling.
                AnimationClipSettings settings = AnimationUtility.GetAnimationClipSettings(clip);
                settings.loopTime = CharacterFactory.ClipShouldLoop(pair.Key);
                settings.loopBlend = true;
                AnimationUtility.SetAnimationClipSettings(clip, settings);

                EditorUtility.SetDirty(clip);
                result[pair.Key] = clip;
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.ImportAsset(ClipDir, ImportAssetOptions.ForceUpdate);
            return result;
        }

        // ------------------------------------------------------------------
        // Animator Controllers
        // ------------------------------------------------------------------
        private static AnimatorController LoadOrBuildPlayerController(Dictionary<string, AnimationClip> clips)
        {
            var existing = AssetDatabase.LoadAssetAtPath<AnimatorController>(PlayerControllerPath);
            if (existing != null) return existing;

            EnsureDirectory(ControllerDir);
            var controller = AnimatorController.CreateAnimatorControllerAtPath(PlayerControllerPath);
            if (controller.parameters.Length > 0) controller.RemoveParameter(0);
            controller.AddParameter("Speed", AnimatorControllerParameterType.Float);
            controller.AddParameter("Grounded", AnimatorControllerParameterType.Bool);
            controller.AddParameter("FreeFall", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Crouching", AnimatorControllerParameterType.Bool);
            controller.AddParameter("Jump", AnimatorControllerParameterType.Trigger);

            var sm = controller.layers[0].stateMachine;

            var groundTree = new BlendTree { name = "GroundLocomotion", blendType = BlendTreeType.Simple1D, blendParameter = "Speed", useAutomaticThresholds = false };
            groundTree.AddChild(clips["PlayerIdle"], 0f);
            groundTree.AddChild(clips["PlayerWalk"], 1.3f);
            groundTree.AddChild(clips["PlayerRun"], 3.4f);
            groundTree.AddChild(clips["PlayerSprint"], 7.2f);

            var crouchTree = new BlendTree { name = "CrouchLocomotion", blendType = BlendTreeType.Simple1D, blendParameter = "Speed", useAutomaticThresholds = false };
            crouchTree.AddChild(clips["PlayerCrouchIdle"], 0f);
            crouchTree.AddChild(clips["PlayerCrouchWalk"], 1.4f);

            var ground = AddState(sm, "Ground", groundTree, Vector2.zero);
            var crouch = AddState(sm, "Crouch", crouchTree, new Vector2(1, 0));
            var jump = AddState(sm, "Jump", clips["PlayerJump"], new Vector2(2, 0));
            var fall = AddState(sm, "Fall", clips["PlayerFall"], new Vector2(3, 0));
            var land = AddState(sm, "Land", clips["PlayerLand"], new Vector2(4, 0));
            sm.defaultState = ground;

            Transition(ground, crouch, false, 0f, 0.1f, ("Crouching", AnimatorConditionMode.If, 1f));
            Transition(crouch, ground, false, 0f, 0.1f, ("Crouching", AnimatorConditionMode.IfNot, 0f));
            Transition(ground, jump, false, 0f, 0f, ("Jump", AnimatorConditionMode.If, 1f));
            Transition(ground, fall, false, 0f, 0.1f, ("FreeFall", AnimatorConditionMode.If, 1f));
            Transition(jump, fall, false, 0f, 0.1f, ("FreeFall", AnimatorConditionMode.If, 1f));
            Transition(jump, land, false, 0f, 0.1f, ("Grounded", AnimatorConditionMode.If, 1f));
            Transition(fall, land, false, 0f, 0.1f, ("Grounded", AnimatorConditionMode.If, 1f));
            Transition(land, ground, true, 0.15f, 0.1f);

            AssetDatabase.SaveAssets();
            return controller;
        }

        private static AnimatorController LoadOrBuildNpcController(Dictionary<string, AnimationClip> clips)
        {
            var existing = AssetDatabase.LoadAssetAtPath<AnimatorController>(NpcControllerPath);
            if (existing != null) return existing;

            EnsureDirectory(ControllerDir);
            var controller = AnimatorController.CreateAnimatorControllerAtPath(NpcControllerPath);
            controller.AddParameter("State", AnimatorControllerParameterType.Int);
            controller.AddParameter("Speed", AnimatorControllerParameterType.Float);
            controller.AddParameter("IsWalking", AnimatorControllerParameterType.Bool);
            controller.AddParameter("IsSleeping", AnimatorControllerParameterType.Bool);
            controller.AddParameter("IsWorking", AnimatorControllerParameterType.Bool);
            controller.AddParameter("IsTalking", AnimatorControllerParameterType.Bool);
            controller.AddParameter("WorkAction", AnimatorControllerParameterType.Trigger);
            controller.AddParameter("IdleAction", AnimatorControllerParameterType.Trigger);

            var sm = controller.layers[0].stateMachine;

            // State names MUST equal NPCAnimState enum names (NPCAnimationDriver.CrossFade on string).
            var idle = AddState(sm, "Idle", clips["NPCIdle"], Vector2.zero);
            var run = AddState(sm, "Run", clips["NPCRun"], new Vector2(1, 0));
            var walk = AddState(sm, "Walk", clips["NPCWalk"], new Vector2(2, 0));
            var work = AddState(sm, "Work", clips["NPCWork"], new Vector2(3, 0));
            var talk = AddState(sm, "Talk", clips["NPCTalk"], new Vector2(4, 0));
            var eat = AddState(sm, "Eat", clips["NPCEat"], new Vector2(5, 0));
            var sit = AddState(sm, "Sit", clips["NPCSit"], new Vector2(6, 0));
            var sleep = AddState(sm, "Sleep", clips["NPCSleep"], new Vector2(7, 0));
            AddState(sm, "Drink", clips["NPCEat"], new Vector2(0, 1));
            AddState(sm, "Carry", clips["NPCWalk"], new Vector2(1, 1));
            AddState(sm, "Buy", clips["NPCTalk"], new Vector2(2, 1));
            AddState(sm, "Sell", clips["NPCTalk"], new Vector2(3, 1));
            AddState(sm, "Craft", clips["NPCWork"], new Vector2(4, 1));
            AddState(sm, "Fish", clips["NPCFish"], new Vector2(5, 1));
            AddState(sm, "Farm", clips["NPCWork"], new Vector2(6, 1));
            AddState(sm, "TeaWork", clips["NPCWork"], new Vector2(7, 1));
            AddState(sm, "React", clips["NPCTalk"], new Vector2(8, 1));
            sm.defaultState = idle;

            // Bool-gated transitions mirror exactly what NPCCharacter writes, so the driver and
            // the direct state writes stay consistent.
            Transition(idle, sleep, false, 0f, 0.2f, ("IsSleeping", AnimatorConditionMode.If, 1f));
            Transition(sleep, idle, false, 0f, 0.2f, ("IsSleeping", AnimatorConditionMode.IfNot, 0f));
            Transition(idle, talk, false, 0f, 0.2f, ("IsTalking", AnimatorConditionMode.If, 1f));
            Transition(talk, idle, false, 0f, 0.2f, ("IsTalking", AnimatorConditionMode.IfNot, 0f));
            Transition(idle, work, false, 0f, 0.2f, ("IsWorking", AnimatorConditionMode.If, 1f));
            Transition(work, idle, false, 0f, 0.2f, ("IsWorking", AnimatorConditionMode.IfNot, 0f));
            Transition(idle, walk, false, 0f, 0.2f, ("IsWalking", AnimatorConditionMode.If, 1f));
            Transition(walk, idle, false, 0f, 0.2f, ("IsWalking", AnimatorConditionMode.IfNot, 0f));
            Transition(idle, run, false, 0f, 0.2f, ("Speed", AnimatorConditionMode.Greater, 2.5f));
            Transition(run, idle, false, 0f, 0.2f, ("Speed", AnimatorConditionMode.Less, 2.5f));
            Transition(idle, sit, false, 0f, 0.2f, ("State", AnimatorConditionMode.Equals, 13f)); // NPCState.Resting


            AssetDatabase.SaveAssets();
            return controller;
        }

        private static AnimatorState AddState(AnimatorStateMachine sm, string name, Motion motion, Vector2 pos)
        {
            var state = sm.AddState(name, pos);
            state.motion = motion;
            state.writeDefaultValues = true;
            return state;
        }

        private static void Transition(AnimatorState from, AnimatorState to, bool hasExitTime, float exitTime, float duration,
            params (string param, AnimatorConditionMode mode, float value)[] conditions)
        {
            var transition = from.AddTransition(to);
            transition.hasExitTime = hasExitTime;
            transition.exitTime = exitTime;
            transition.duration = duration;
            foreach (var (param, mode, value) in conditions)
            {
                transition.AddCondition(mode, value, param);
            }
        }

        // ------------------------------------------------------------------
        // Helpers
        // ------------------------------------------------------------------
        private static void EnsureDirectory(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            string parent = Path.GetDirectoryName(path).Replace('\\', '/');
            string leaf = Path.GetFileName(path);
            if (!string.IsNullOrEmpty(parent) && !AssetDatabase.IsValidFolder(parent)) EnsureDirectory(parent);
            AssetDatabase.CreateFolder(parent, leaf);
        }

        private static class Utils
        {
            public static Matrix4x4[] BoneWorldToLocal(Dictionary<string, Transform> bones)
            {
                var result = new Matrix4x4[CharacterFactory.RigBoneNames.Length];
                for (int i = 0; i < CharacterFactory.RigBoneNames.Length; i++)
                    result[i] = bones[CharacterFactory.RigBoneNames[i]].worldToLocalMatrix;
                return result;
            }
        }
    }
}