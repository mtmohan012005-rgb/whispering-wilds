using System.IO;
using NUnit.Framework;
using UnityEngine;
using Object = UnityEngine.Object;
using WhisperingWilds.Characters;

namespace WhisperingWilds.Tests.Characters
{
    /// <summary>
    /// STEP 30 — Character integration tests. Verifies that the production character
    /// assets (prefabs, avatars, animation clips, controllers) exist and are properly
    /// configured. These are editor tests that inspect assets without running the game.
    /// </summary>
    public class Step30CharacterIntegrationTests
    {
        // ------------------------------------------------------------------
        // Player character
        // ------------------------------------------------------------------

        [Test]
        public void Test_PlayerPrefab_Exists()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab, "PlayerCharacter.prefab must exist at the catalog path");
        }

        [Test]
        public void Test_PlayerPrefab_HasSkinnedMeshRenderers()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab, "PlayerCharacter.prefab must exist");

            var renderers = prefab.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            Assert.GreaterOrEqual(renderers.Length, 3,
                "Player prefab must have at least 3 SkinnedMeshRenderer components (body + clothing)");
        }

        [Test]
        public void Test_PlayerPrefab_HasAnimator()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab, "PlayerCharacter.prefab must exist");

            var animator = prefab.GetComponentInChildren<Animator>(true);
            Assert.IsNotNull(animator, "Player prefab must contain an Animator component");
        }

        [Test]
        public void Test_PlayerPrefab_Animator_HasAvatar()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab);

            var animator = prefab.GetComponentInChildren<Animator>(true);
            Assert.IsNotNull(animator, "Animator must exist");
            Assert.IsNotNull(animator.avatar, "Animator must have a valid Avatar assigned");
        }

        [Test]
        public void Test_PlayerPrefab_Animator_HasController()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab);

            var animator = prefab.GetComponentInChildren<Animator>(true);
            Assert.IsNotNull(animator);
            Assert.IsNotNull(animator.runtimeAnimatorController,
                "Animator must have a valid AnimatorController assigned");
        }

        [Test]
        public void Test_PlayerPrefab_SkinnedMesh_HasBones()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab);

            var renderers = prefab.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            Assert.GreaterOrEqual(renderers.Length, 1, "At least one SkinnedMeshRenderer expected");

            var bones = renderers[0].bones;
            Assert.GreaterOrEqual(bones.Length, 30,
                "Primary skinned mesh must have at least 30 bones for a proper humanoid rig");
        }

        // ------------------------------------------------------------------
        // Murugan NPC
        // ------------------------------------------------------------------

        [Test]
        public void Test_MuruganPrefab_Exists()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.MuruganPrefabPath);
            Assert.IsNotNull(prefab, "NPC_Murugan.prefab must exist at the catalog path");
        }

        [Test]
        public void Test_MuruganPrefab_HasSkinnedMeshRenderers()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.MuruganPrefabPath);
            Assert.IsNotNull(prefab);

            var renderers = prefab.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            Assert.GreaterOrEqual(renderers.Length, 2,
                "Murugan prefab must have at least 2 SkinnedMeshRenderer components");
        }

        [Test]
        public void Test_MuruganPrefab_HasAnimator()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.MuruganPrefabPath);
            Assert.IsNotNull(prefab);

            var animator = prefab.GetComponentInChildren<Animator>(true);
            Assert.IsNotNull(animator, "Murugan prefab must contain an Animator component");
        }

        [Test]
        public void Test_MuruganPrefab_Animator_HasAvatar()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.MuruganPrefabPath);
            Assert.IsNotNull(prefab);

            var animator = prefab.GetComponentInChildren<Animator>(true);
            Assert.IsNotNull(animator);
            Assert.IsNotNull(animator.avatar, "Murugan Animator must have a valid Avatar");
        }

        [Test]
        public void Test_MuruganPrefab_Animator_HasController()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.MuruganPrefabPath);
            Assert.IsNotNull(prefab);

            var animator = prefab.GetComponentInChildren<Animator>(true);
            Assert.IsNotNull(animator);
            Assert.IsNotNull(animator.runtimeAnimatorController,
                "Murugan Animator must have a valid AnimatorController");
        }

        // ------------------------------------------------------------------
        // Velu NPC
        // ------------------------------------------------------------------

        [Test]
        public void Test_VeluPrefab_Exists()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.VeluPrefabPath);
            Assert.IsNotNull(prefab, "NPC_Velu.prefab must exist at the catalog path");
        }

        [Test]
        public void Test_VeluPrefab_HasSkinnedMeshRenderers()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.VeluPrefabPath);
            Assert.IsNotNull(prefab);

            var renderers = prefab.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            Assert.GreaterOrEqual(renderers.Length, 2,
                "Velu prefab must have at least 2 SkinnedMeshRenderer components");
        }

        // ------------------------------------------------------------------
        // Generic Avatar
        // ------------------------------------------------------------------

        [Test]
        public void Test_GenericAvatar_Exists()
        {
            var avatarPath = "Assets/_Project/Art/Characters/Procedural/GenericAvatar.asset";
            var avatar = Object.LoadAssetAtPath<Avatar>(avatarPath);
            Assert.IsNotNull(avatar, "GenericAvatar.asset must exist");
        }

        [Test]
        public void Test_GenericAvatar_IsValid()
        {
            var avatarPath = "Assets/_Project/Art/Characters/Procedural/GenericAvatar.asset";
            var avatar = Object.LoadAssetAtPath<Avatar>(avatarPath);
            Assert.IsNotNull(avatar);
            Assert.IsTrue(avatar.isValid, "GenericAvatar must be a valid avatar");
        }

        // ------------------------------------------------------------------
        // Animation clips
        // ------------------------------------------------------------------

        [Test]
        public void Test_PlayerAnimationClips_Exist()
        {
            string[] playerClips = new[]
            {
                "PlayerIdle", "PlayerWalk", "PlayerRun", "PlayerSprint",
                "PlayerCrouchIdle", "PlayerCrouchWalk", "PlayerJump", "PlayerFall", "PlayerLand"
            };

            foreach (var clipName in playerClips)
            {
                var clipPath = $"Assets/_Project/Art/Characters/Procedural/Clips/{clipName}.anim";
                var clip = Object.LoadAssetAtPath<AnimationClip>(clipPath);
                Assert.IsNotNull(clip, $"Player animation clip '{clipName}.anim' must exist");
            }
        }

        [Test]
        public void Test_NPCAnimationClips_Exist()
        {
            string[] npcClips = new[]
            {
                "NPCIdle", "NPCWalk", "NPCRun", "NPCTalk", "NPCWork",
                "NPCEat", "NPCFish", "NPCSit", "NPCSleep"
            };

            foreach (var clipName in npcClips)
            {
                var clipPath = $"Assets/_Project/Art/Characters/Procedural/Clips/{clipName}.anim";
                var clip = Object.LoadAssetAtPath<AnimationClip>(clipPath);
                Assert.IsNotNull(clip, $"NPC animation clip '{clipName}.anim' must exist");
            }
        }

        [Test]
        public void Test_PlayerIdleClip_HasCurves()
        {
            var clip = Object.LoadAssetAtPath<AnimationClip>(
                "Assets/_Project/Art/Characters/Procedural/Clips/PlayerIdle.anim");
            Assert.IsNotNull(clip, "PlayerIdle.anim must exist");

            int curveCount = clip.GetType()
                .GetProperty("curveCount", System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
                ?.GetValue(clip) as int? ?? 0;

            Assert.Greater(curveCount, 0,
                "PlayerIdle.anim must have animation curves (not an empty clip)");
        }

        // ------------------------------------------------------------------
        // Animator Controllers
        // ------------------------------------------------------------------

        [Test]
        public void Test_PlayerAnimatorController_Exists()
        {
            var controller = Object.LoadAssetAtPath<AnimatorController>(
                "Assets/_Project/Art/Animations/Characters/PlayerCharacter.controller");
            Assert.IsNotNull(controller, "PlayerCharacter.controller must exist");
        }

        [Test]
        public void Test_NPCAnimatorController_Exists()
        {
            var controller = Object.LoadAssetAtPath<AnimatorController>(
                "Assets/_Project/Art/Animations/Characters/NPCCharacter.controller");
            Assert.IsNotNull(controller, "NPCCharacter.controller must exist");
        }

        // ------------------------------------------------------------------
        // CharacterPrefabCatalog
        // ------------------------------------------------------------------

        [Test]
        public void Test_CharacterPrefabCatalog_ResolvesMurugan()
        {
            var path = CharacterPrefabCatalog.ResolveCharacter("murugan.glb");
            Assert.IsNotNull(path, "Catalog must resolve 'murugan.glb'");
            Assert.AreEqual(CharacterPrefabCatalog.MuruganPrefabPath, path,
                "murugan.glb must resolve to NPC_Murugan.prefab");
        }

        [Test]
        public void Test_CharacterPrefabCatalog_ResolvesVelu()
        {
            var path = CharacterPrefabCatalog.ResolveCharacter("velu.glb");
            Assert.IsNotNull(path, "Catalog must resolve 'velu.glb'");
            Assert.AreEqual(CharacterPrefabCatalog.VeluPrefabPath, path,
                "velu.glb must resolve to NPC_Velu.prefab");
        }

        [Test]
        public void Test_CharacterPrefabCatalog_ResolvesPlayer()
        {
            var path = CharacterPrefabCatalog.ResolveCharacter("player.glb");
            Assert.IsNotNull(path, "Catalog must resolve 'player.glb'");
            Assert.AreEqual(CharacterPrefabCatalog.PlayerPrefabPath, path,
                "player.glb must resolve to PlayerCharacter.prefab");
        }

        [Test]
        public void Test_CharacterPrefabCatalog_IsLegacyCharacterModel()
        {
            Assert.IsTrue(CharacterPrefabCatalog.IsLegacyCharacterModel("Assets/_Project/Art/Models/Characters/NPCs/murugan.glb"),
                "murugan.glb path must be recognized as legacy character model");
            Assert.IsTrue(CharacterPrefabCatalog.IsLegacyCharacterModel("Assets/_Project/Art/Models/Characters/Player/player.glb"),
                "player.glb path must be recognized as legacy character model");
        }

        // ------------------------------------------------------------------
        // All NPC prefabs
        // ------------------------------------------------------------------

        [Test]
        public void Test_AllNPCPrefabs_Exist()
        {
            string[] npcPrefabPaths = new[]
            {
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

            foreach (var path in npcPrefabPaths)
            {
                var prefab = Object.LoadAssetAtPath<GameObject>(path);
                Assert.IsNotNull(prefab, $"NPC prefab must exist: {path}");
            }
        }

        // ------------------------------------------------------------------
        // NavMesh
        // ------------------------------------------------------------------

        [Test]
        public void Test_ChennaiNavMesh_Exists()
        {
            var navMeshPath = "Assets/_Project/NavMeshData/02_Chennai_GeorgeTown/02_Chennai_GeorgeTown.asset";
            Assert.IsTrue(File.Exists(navMeshPath),
                $"Chennai NavMesh asset must exist at {navMeshPath}");
        }
    }
}
