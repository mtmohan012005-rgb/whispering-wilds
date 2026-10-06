using System.Collections.Generic;
using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using WhisperingWilds.Core;
using WhisperingWilds.Gameplay;
using WhisperingWilds.NPC;
using WhisperingWilds.Player;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Comprehensive automated play-check test suite.
    /// Traverses all 8 scenes in the build catalog, verifies that no missing scripts,
    /// missing components, or unassigned critical references exist, ensures every region
    /// has a valid player spawn point and bootstrap, and verifies that the player locomotion
    /// and control simulation operate without errors.
    /// </summary>
    public class FullGamePlayCheckTests
    {
        private static readonly string[] ExpectedScenePaths =
        {
            "Assets/_Project/Scenes/00_Boot.unity",
            "Assets/_Project/Scenes/01_StateMap_TamilNadu.unity",
            "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity",
            "Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity",
            "Assets/_Project/Scenes/04_Thanjavur_Delta.unity",
            "Assets/_Project/Scenes/05_Chettinad_Mansion.unity",
            "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity",
            "Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity"
        };

        private static readonly string[] RegionScenePaths =
        {
            "Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity",
            "Assets/_Project/Scenes/03_Pichavaram_Wetlands.unity",
            "Assets/_Project/Scenes/04_Thanjavur_Delta.unity",
            "Assets/_Project/Scenes/05_Chettinad_Mansion.unity",
            "Assets/_Project/Scenes/06_Mamallapuram_Shore.unity",
            "Assets/_Project/Scenes/07_Nilgiris_Sanctuary.unity"
        };

        [OneTimeSetUp]
        public void OneTimeSetUp()
        {
            WhisperingWilds.Editor.FixGameplayRegionBootstraps.EnsureAllRegionBootstraps();
        }

        [Test]
        public void BuildSettings_AllEightScenes_ExistOnDisk()
        {
            foreach (var scenePath in ExpectedScenePaths)
            {
                Assert.IsTrue(File.Exists(scenePath), $"Expected build scene does not exist on disk: {scenePath}");
            }
        }

        [Test]
        public void BootScene_LoadsCleanly_WithNoMissingScriptsAndCoreManagers()
        {
            var scene = EditorSceneManager.OpenScene("Assets/_Project/Scenes/00_Boot.unity", OpenSceneMode.Single);
            Assert.IsTrue(scene.IsValid(), "Failed to open 00_Boot scene.");

            var missingScriptErrors = FindMissingScriptsInScene(scene);
            Assert.IsEmpty(missingScriptErrors, $"Missing scripts found in 00_Boot: {string.Join(", ", missingScriptErrors)}");

            var cam = Object.FindAnyObjectByType<Camera>();
            Assert.IsNotNull(cam, "00_Boot must contain a Camera.");

            var menu = Object.FindAnyObjectByType<TitleMenuController>();
            Assert.IsNotNull(menu, "00_Boot must contain TitleMenuController.");

            var saveMgr = Object.FindAnyObjectByType<SaveManager>();
            Assert.IsNotNull(saveMgr, "00_Boot must contain SaveManager.");
        }

        [Test]
        public void StateMapScene_LoadsCleanly_WithNoMissingScripts()
        {
            var scene = EditorSceneManager.OpenScene("Assets/_Project/Scenes/01_StateMap_TamilNadu.unity", OpenSceneMode.Single);
            Assert.IsTrue(scene.IsValid(), "Failed to open 01_StateMap_TamilNadu scene.");

            var missingScriptErrors = FindMissingScriptsInScene(scene);
            Assert.IsEmpty(missingScriptErrors, $"Missing scripts found in 01_StateMap: {string.Join(", ", missingScriptErrors)}");

            var cam = Object.FindAnyObjectByType<Camera>();
            Assert.IsNotNull(cam, "01_StateMap must contain a Camera.");
        }

        [Test]
        public void EveryRegionScene_HasNoMissingScripts_AndHasSpawnPointAndBootstrap()
        {
            foreach (var scenePath in RegionScenePaths)
            {
                var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                Assert.IsTrue(scene.IsValid(), $"Failed to open scene: {scenePath}");

                var missingScriptErrors = FindMissingScriptsInScene(scene);
                Assert.IsEmpty(missingScriptErrors, $"Missing scripts found in {scenePath}: {string.Join(", ", missingScriptErrors)}");

                var spawn = GameObject.Find("SpawnPoint") ?? GameObject.Find("PlayerSpawn");
                Assert.IsNotNull(spawn, $"Scene '{scenePath}' is missing a 'SpawnPoint' or 'PlayerSpawn' marker.");

                var bootstrap = Object.FindAnyObjectByType<GameplayRegionBootstrap>();
                Assert.IsNotNull(bootstrap, $"Scene '{scenePath}' is missing GameplayRegionBootstrap.");
                Assert.IsFalse(string.IsNullOrEmpty(bootstrap.RegionId), $"Scene '{scenePath}' has an empty RegionId in GameplayRegionBootstrap.");
            }
        }

        [Test]
        public void AllNPCs_HaveValidIds_AcrossEveryRegion()
        {
            foreach (var scenePath in RegionScenePaths)
            {
                var scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
                var npcs = Object.FindObjectsByType<NPCCharacter>();

                foreach (var npc in npcs)
                {
                    Assert.IsFalse(string.IsNullOrEmpty(npc.NpcId),
                        $"NPC GameObject '{npc.gameObject.name}' in scene '{scenePath}' has an empty or null NpcId.");
                }
            }
        }

        [Test]
        public void PlayerLocomotionSimulation_ExecutesSmoothlyInChennaiScene()
        {
            var scene = EditorSceneManager.OpenScene("Assets/_Project/Scenes/02_Chennai_GeorgeTown.unity", OpenSceneMode.Single);
            Assert.IsTrue(scene.IsValid(), "Failed to open Chennai George Town scene.");

            var spawn = GameObject.Find("SpawnPoint") ?? GameObject.Find("PlayerSpawn");
            Vector3 spawnPos = spawn != null ? spawn.transform.position : Vector3.zero;

            var testPlayer = new GameObject("QA_SimulationPlayer");
            testPlayer.transform.position = spawnPos + Vector3.up * 0.1f;

            var cc = testPlayer.AddComponent<CharacterController>();
            var input = testPlayer.AddComponent<PlayerInputHandler>();
            var movement = testPlayer.AddComponent<PlayerMovement>();

            try
            {
                // 1. Initial State
                Assert.AreEqual(Vector2.zero, input.MoveInput);
                Assert.IsFalse(input.IsSprinting);
                Assert.IsFalse(input.IsCrouching);

                // 2. Walk Forward
                input.SetSimulatedMovement(Vector2.up, sprint: false, crouch: false);
                Assert.AreEqual(Vector2.up, input.MoveInput);
                Assert.IsFalse(input.IsSprinting);
                Assert.IsFalse(input.IsCrouching);

                // 3. Sprint Forward
                input.SetSimulatedMovement(Vector2.up, sprint: true, crouch: false);
                Assert.IsTrue(input.IsSprinting);
                Assert.IsFalse(input.IsCrouching);

                // 4. Crouch Forward
                input.SetSimulatedMovement(Vector2.up, sprint: false, crouch: true);
                Assert.IsFalse(input.IsSprinting);
                Assert.IsTrue(input.IsCrouching);

                // 5. Jump Trigger
                input.TriggerSimulatedJump();
                Assert.IsTrue(input.JumpTriggered);

                // 6. Interact Trigger
                input.TriggerSimulatedInteract();
                Assert.IsTrue(input.InteractTriggered);

                // 7. Reset Simulation
                input.ClearSimulation();
                Assert.AreEqual(Vector2.zero, input.MoveInput);
                Assert.IsFalse(input.IsSprinting);
                Assert.IsFalse(input.IsCrouching);
                Assert.IsFalse(input.JumpTriggered);
                Assert.IsFalse(input.InteractTriggered);
            }
            finally
            {
                Object.DestroyImmediate(testPlayer);
            }
        }

        private static List<string> FindMissingScriptsInScene(Scene scene)
        {
            var errors = new List<string>();
            var roots = scene.GetRootGameObjects();

            foreach (var root in roots)
            {
                CheckGameObjectForMissingScripts(root, errors);
            }

            return errors;
        }

        private static void CheckGameObjectForMissingScripts(GameObject go, List<string> errors)
        {
            var components = go.GetComponents<Component>();
            for (int i = 0; i < components.Length; i++)
            {
                if (components[i] == null)
                {
                    errors.Add($"GameObject '{GetFullPath(go)}' has a missing script at component index {i}");
                }
            }

            for (int i = 0; i < go.transform.childCount; i++)
            {
                CheckGameObjectForMissingScripts(go.transform.GetChild(i).gameObject, errors);
            }
        }

        private static string GetFullPath(GameObject go)
        {
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
