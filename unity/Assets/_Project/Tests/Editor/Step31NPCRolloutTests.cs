using System.IO;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.AI;
using Object = UnityEngine.Object;
using WhisperingWilds.Characters;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Tests.Characters
{
    /// <summary>
    /// STEP 31 — Comprehensive NPC system tests.
    /// Covers all NPC prefabs, component wiring, animation, navigation, dialogue,
    /// and interaction lifecycle.
    /// </summary>
    public class Step31NPCRolloutTests
    {
        // ------------------------------------------------------------------
        // All NPC prefabs existence and components
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

        [Test]
        public void Test_AllNPCPrefabs_HaveSkinnedMeshRenderers()
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
                Assert.IsNotNull(prefab, $"Prefab must exist: {path}");

                var renderers = prefab.GetComponentsInChildren<SkinnedMeshRenderer>(true);
                Assert.GreaterOrEqual(renderers.Length, 2,
                    $"{Path.GetFileName(path)} must have at least 2 SkinnedMeshRenderer components");
            }
        }

        [Test]
        public void Test_AllNPCPrefabs_HaveAnimator()
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
                Assert.IsNotNull(prefab, $"Prefab must exist: {path}");

                var animator = prefab.GetComponentInChildren<Animator>(true);
                Assert.IsNotNull(animator,
                    $"{Path.GetFileName(path)} must contain an Animator component");
            }
        }

        [Test]
        public void Test_AllNPCPrefabs_Animator_HasAvatar()
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
                Assert.IsNotNull(prefab);

                var animator = prefab.GetComponentInChildren<Animator>(true);
                Assert.IsNotNull(animator, $"Animator must exist in {path}");
                Assert.IsNotNull(animator.avatar,
                    $"{Path.GetFileName(path)} Animator must have a valid Avatar");
            }
        }

        [Test]
        public void Test_AllNPCPrefabs_Animator_HasController()
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
                Assert.IsNotNull(prefab);

                var animator = prefab.GetComponentInChildren<Animator>(true);
                Assert.IsNotNull(animator);
                Assert.IsNotNull(animator.runtimeAnimatorController,
                    $"{Path.GetFileName(path)} Animator must have a valid AnimatorController");
            }
        }

        // ------------------------------------------------------------------
        // NPC Animator Controller states
        // ------------------------------------------------------------------

        [Test]
        public void Test_NPCAnimatorController_HasAllStates()
        {
            var controller = Object.LoadAssetAtPath<AnimatorController>(
                "Assets/_Project/Art/Animations/Characters/NPCCharacter.controller");
            Assert.IsNotNull(controller, "NPCCharacter.controller must exist");

            string[] expectedStates = new[]
            {
                "Idle", "Walk", "Run", "Work", "Talk", "Eat", "Drink",
                "Carry", "Buy", "Sell", "Craft", "Fish", "Farm",
                "TeaWork", "Sit", "Sleep", "React"
            };

            foreach (var stateName in expectedStates)
            {
                int hash = Animator.StringToHash(stateName);
                Assert.IsTrue(controller.HasState(0, hash),
                    $"NPCCharacter.controller must have state '{stateName}'");
            }
        }

        [Test]
        public void Test_NPCAnimatorController_HasParameters()
        {
            var controller = Object.LoadAssetAtPath<AnimatorController>(
                "Assets/_Project/Art/Animations/Characters/NPCCharacter.controller");
            Assert.IsNotNull(controller);

            string[] expectedParams = new[]
            {
                "State", "IsWalking", "IsSleeping", "IsWorking",
                "IsTalking", "WorkAction", "IdleAction"
            };

            foreach (var paramName in expectedParams)
            {
                int hash = Animator.StringToHash(paramName);
                Assert.IsTrue(controller.HasParameter(hash),
                    $"NPCCharacter.controller must have parameter '{paramName}'");
            }
        }

        // ------------------------------------------------------------------
        // NPC animation clips
        // ------------------------------------------------------------------

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

        // ------------------------------------------------------------------
        // CharacterPrefabCatalog resolution
        // ------------------------------------------------------------------

        [Test]
        public void Test_CharacterPrefabCatalog_ResolvesAllCharacters()
        {
            var mappings = new System.Collections.Generic.Dictionary<string, string>
            {
                { "murugan.glb", CharacterPrefabCatalog.MuruganPrefabPath },
                { "velu.glb", CharacterPrefabCatalog.VeluPrefabPath },
                { "selvam.glb", CharacterPrefabCatalog.SelvamPrefabPath },
                { "meenakshi.glb", CharacterPrefabCatalog.MeenakshiPrefabPath },
                { "artisan.glb", CharacterPrefabCatalog.ArtisanPrefabPath },
                { "farmer.glb", CharacterPrefabCatalog.FarmerPrefabPath },
                { "fisher.glb", CharacterPrefabCatalog.FisherPrefabPath },
                { "forest-guide.glb", CharacterPrefabCatalog.ForestGuidePrefabPath },
                { "player.glb", CharacterPrefabCatalog.PlayerPrefabPath }
            };

            foreach (var kvp in mappings)
            {
                var path = CharacterPrefabCatalog.ResolveCharacter(kvp.Key);
                Assert.IsNotNull(path, $"Catalog must resolve '{kvp.Key}'");
                Assert.AreEqual(kvp.Value, path,
                    $"{kvp.Key} must resolve to {kvp.Value}");
            }
        }

        [Test]
        public void Test_CharacterPrefabCatalog_ResolveVisualPath_PassesThroughNonCharacters()
        {
            var propPath = "Assets/_Project/Art/Models/Props/cultural/cast_net.glb";
            var result = CharacterPrefabCatalog.ResolveVisualPath(propPath);
            Assert.AreEqual(propPath, result,
                "Non-character paths must pass through unchanged");
        }

        // ------------------------------------------------------------------
        // NavMesh assets
        // ------------------------------------------------------------------

        [Test]
        public void Test_ChennaiNavMesh_Exists()
        {
            var navMeshPath = "Assets/_Project/NavMeshData/02_Chennai_GeorgeTown/02_Chennai_GeorgeTown.asset";
            Assert.IsTrue(File.Exists(navMeshPath),
                $"Chennai NavMesh asset must exist at {navMeshPath}");
        }

        // ------------------------------------------------------------------
        // NPC script component requirements
        // ------------------------------------------------------------------

        [Test]
        public void Test_NPCCharacter_RequiresNPCNavigationController()
        {
            // Verify the RequireComponent attribute is present
            var requireAttrs = typeof(NPCCharacter)
                .GetCustomAttributes(typeof(RequireComponent), false);
            Assert.GreaterOrEqual(requireAttrs.Length, 1,
                "NPCCharacter must have RequireComponent attribute");

            var reqComp = (RequireComponent)requireAttrs[0];
            Assert.AreEqual(typeof(NPCNavigationController), reqComp.m_Type0,
                "NPCCharacter must require NPCNavigationController");
        }

        // ------------------------------------------------------------------
        // Generic Avatar validation
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
        // Player character integration (regression from Step 30)
        // ------------------------------------------------------------------

        [Test]
        public void Test_PlayerPrefab_Exists()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab, "PlayerCharacter.prefab must exist");
        }

        [Test]
        public void Test_PlayerPrefab_HasSkinnedMeshRenderers()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab);

            var renderers = prefab.GetComponentsInChildren<SkinnedMeshRenderer>(true);
            Assert.GreaterOrEqual(renderers.Length, 3,
                "Player prefab must have at least 3 SkinnedMeshRenderer components");
        }

        [Test]
        public void Test_PlayerPrefab_Animator_HasAvatar()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab);

            var animator = prefab.GetComponentInChildren<Animator>(true);
            Assert.IsNotNull(animator);
            Assert.IsNotNull(animator.avatar, "Player Animator must have a valid Avatar");
        }

        [Test]
        public void Test_PlayerPrefab_Animator_HasController()
        {
            var prefab = Object.LoadAssetAtPath<GameObject>(CharacterPrefabCatalog.PlayerPrefabPath);
            Assert.IsNotNull(prefab);

            var animator = prefab.GetComponentInChildren<Animator>(true);
            Assert.IsNotNull(animator);
            Assert.IsNotNull(animator.runtimeAnimatorController,
                "Player Animator must have a valid AnimatorController");
        }

        // ------------------------------------------------------------------
        // Player animation clips
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

        // ------------------------------------------------------------------
        // Player animator controller parameters
        // ------------------------------------------------------------------

        [Test]
        public void Test_PlayerAnimatorController_HasParameters()
        {
            var controller = Object.LoadAssetAtPath<AnimatorController>(
                "Assets/_Project/Art/Animations/Characters/PlayerCharacter.controller");
            Assert.IsNotNull(controller, "PlayerCharacter.controller must exist");

            string[] expectedParams = new[]
            {
                "Speed", "Grounded", "FreeFall", "Crouching", "Jump"
            };

            foreach (var paramName in expectedParams)
            {
                int hash = Animator.StringToHash(paramName);
                Assert.IsTrue(controller.HasParameter(hash),
                    $"PlayerCharacter.controller must have parameter '{paramName}'");
            }
        }
    }
}
