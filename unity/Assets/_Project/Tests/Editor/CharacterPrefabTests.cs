#if UNITY_EDITOR
using System.IO;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Characters;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class CharacterPrefabTests
    {
        [Test]
        public void TestCharacterPrefabCatalog_ResolvesAllNPCs()
        {
            string[] characterKeys = new string[]
            {
                "player",
                "murugan",
                "velu",
                "selvam",
                "meenakshi",
                "artisan",
                "farmer",
                "fisher",
                "forest-guide",
                "kannan",
                "kumaran",
                "siddhar"
            };

            foreach (var key in characterKeys)
            {
                string resolved = CharacterPrefabCatalog.ResolveCharacter(key);
                Assert.IsNotNull(resolved, $"Expected CharacterPrefabCatalog to resolve key: {key}");
                Assert.IsTrue(resolved.EndsWith(".prefab"), $"Resolved path must be a prefab: {resolved}");
            }
        }

        [Test]
        public void TestCharacterPrefabs_AllExistOnDisk()
        {
            string[] requiredPrefabs = new string[]
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
                CharacterPrefabCatalog.TeaWorkerPrefabPath,
                CharacterPrefabCatalog.KumaranPrefabPath,
                CharacterPrefabCatalog.SiddharPrefabPath
            };

            foreach (var relPath in requiredPrefabs)
            {
                string fullPath = Path.Combine(Application.dataPath, "..", relPath);
                Assert.IsTrue(File.Exists(fullPath), $"Expected character prefab to exist at: {relPath}");
                var fileInfo = new FileInfo(fullPath);
                Assert.Greater(fileInfo.Length, 1000, $"Expected valid prefab YAML data in {relPath}");
            }
        }

        [Test]
        public void TestWildlifePrefabs_ExistOnDisk()
        {
            string[] wildlifePrefabs = new string[]
            {
                "Assets/_Project/Prefabs/Wildlife/Wildlife_NilgiriTahr.prefab",
                "Assets/_Project/Prefabs/Wildlife/Wildlife_Elephant.prefab"
            };

            foreach (var relPath in wildlifePrefabs)
            {
                string fullPath = Path.Combine(Application.dataPath, "..", relPath);
                Assert.IsTrue(File.Exists(fullPath), $"Expected wildlife prefab to exist at: {relPath}");
                var fileInfo = new FileInfo(fullPath);
                Assert.Greater(fileInfo.Length, 1000, $"Expected valid wildlife prefab YAML in {relPath}");
            }
        }
    }
}
#endif
