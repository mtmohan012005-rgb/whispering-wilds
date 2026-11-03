#if UNITY_EDITOR
using System.IO;
using System.Text.RegularExpressions;
using NUnit.Framework;
using UnityEngine;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class SangamScenesTests
    {
        private readonly string[] sangamScenes = new string[]
        {
            "Assets/_Project/Scenes/09_Madurai_Meenakshi.unity",
            "Assets/_Project/Scenes/10_Kanyakumari_Cape.unity",
            "Assets/_Project/Scenes/11_Agasthyamalai_Wilds.unity"
        };

        [Test]
        public void TestSangamScenes_AllThreeExistOnDisk()
        {
            foreach (var relPath in sangamScenes)
            {
                string fullPath = Path.Combine(Application.dataPath, "..", relPath);
                Assert.IsTrue(File.Exists(fullPath), $"Expected Sangam scene file at: {relPath}");

                string metaPath = fullPath + ".meta";
                Assert.IsTrue(File.Exists(metaPath), $"Expected Sangam scene meta file at: {metaPath}");

                var fileInfo = new FileInfo(fullPath);
                Assert.Greater(fileInfo.Length, 10000, $"Expected full YAML scene hierarchy in: {relPath}");
            }
        }

        [Test]
        public void TestSangamScenes_RegisteredInEditorBuildSettings()
        {
            string buildSettingsPath = Path.Combine(Application.dataPath, "..", "ProjectSettings/EditorBuildSettings.asset");
            Assert.IsTrue(File.Exists(buildSettingsPath), "EditorBuildSettings.asset must exist");

            string content = File.ReadAllText(buildSettingsPath);

            foreach (var relPath in sangamScenes)
            {
                Assert.IsTrue(content.Contains(relPath), $"Expected scene {relPath} to be registered in EditorBuildSettings.asset");
            }
        }

        [Test]
        public void TestSangamScenes_GUIDParityWithMetaFiles()
        {
            string buildSettingsPath = Path.Combine(Application.dataPath, "..", "ProjectSettings/EditorBuildSettings.asset");
            string buildSettingsContent = File.ReadAllText(buildSettingsPath);

            foreach (var relPath in sangamScenes)
            {
                string metaPath = Path.Combine(Application.dataPath, "..", relPath + ".meta");
                string metaContent = File.ReadAllText(metaPath);

                var metaMatch = Regex.Match(metaContent, @"^guid:\s+([a-f0-9]{32})", RegexOptions.Multiline);
                Assert.IsTrue(metaMatch.Success, $"Failed to parse GUID from {metaPath}");
                string metaGuid = metaMatch.Groups[1].Value;

                // Match in EditorBuildSettings: path followed by guid
                string escapedPath = Regex.Escape(relPath);
                var buildMatch = Regex.Match(buildSettingsContent, @"path:\s*" + escapedPath + @"\s+guid:\s+([a-f0-9]{32})");
                Assert.IsTrue(buildMatch.Success, $"Failed to find scene {relPath} entry with GUID in EditorBuildSettings.asset");
                string buildGuid = buildMatch.Groups[1].Value;

                Assert.AreEqual(metaGuid, buildGuid, $"GUID mismatch for {relPath}: meta has {metaGuid}, build settings has {buildGuid}");
            }
        }
    }
}
#endif
