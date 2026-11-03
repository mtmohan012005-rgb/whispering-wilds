#if UNITY_EDITOR
using System.IO;
using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Audio;

namespace WhisperingWilds.Tests.Editor
{
    [TestFixture]
    public class SurfaceAudioTests
    {
        private GameObject host;
        private SurfaceAudioController surfaceAudio;

        [SetUp]
        public void SetUp()
        {
            host = new GameObject("SurfaceAudioTestHost");
            surfaceAudio = host.AddComponent<SurfaceAudioController>();
        }

        [TearDown]
        public void TearDown()
        {
            if (host != null)
            {
                Object.DestroyImmediate(host);
            }
        }

        [Test]
        public void TestSurfaceFootstepWavs_AllFiveExistOnDisk()
        {
            string[] requiredWavs = new string[]
            {
                "Assets/_Project/Audio/Footsteps/footstep_stone.wav",
                "Assets/_Project/Audio/Footsteps/footstep_mud.wav",
                "Assets/_Project/Audio/Footsteps/footstep_grass.wav",
                "Assets/_Project/Audio/Footsteps/footstep_water.wav",
                "Assets/_Project/Audio/Footsteps/footstep_sand.wav"
            };

            foreach (var relPath in requiredWavs)
            {
                string fullPath = Path.Combine(Application.dataPath, "..", relPath);
                Assert.IsTrue(File.Exists(fullPath), $"Expected footstep audio file at: {relPath}");
                var fileInfo = new FileInfo(fullPath);
                Assert.Greater(fileInfo.Length, 1000, $"Expected valid audio bytes in {relPath}");
            }
        }

        [Test]
        public void TestSurfaceDetection_ReturnsStoneByDefault()
        {
            // Empty space raycast should return default Stone surface
            SurfaceType surface = surfaceAudio.DetectSurface(new Vector3(0f, 1000f, 0f));
            Assert.AreEqual(SurfaceType.Stone, surface);
        }

        [Test]
        public void TestFootstepCadence_FiresEventOnStep()
        {
            bool stepFired = false;
            SurfaceType firedSurface = SurfaceType.Stone;

            surfaceAudio.OnFootstepPlayed += (s) =>
            {
                stepFired = true;
                firedSurface = s;
            };

            // Calling PlayStepAt directly fires the event
            surfaceAudio.PlayStepAt(Vector3.zero);

            Assert.IsTrue(stepFired);
            Assert.AreEqual(SurfaceType.Stone, firedSurface);
            Assert.AreEqual(SurfaceType.Stone, surfaceAudio.LastDetectedSurface);
        }
    }
}
#endif
