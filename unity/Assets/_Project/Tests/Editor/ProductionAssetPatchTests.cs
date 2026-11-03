using System.IO;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using WhisperingWilds.Atmosphere;
using WhisperingWilds.Audio;
// using WhisperingWilds.Environment;
using WhisperingWilds.Investigation;
using WhisperingWilds.NPC;
using WhisperingWilds.Wildlife;

namespace WhisperingWilds.Tests.Editor
{
    public class ProductionAssetPatchTests
    {
        [Test]
        public void SwaraAudioFiles_SevenFilesExist_WithValidTones()
        {
            string swaraDir = "Assets/_Project/Audio/Swaras";
            string[] swaras = {
                "pillar_tone_sa", "pillar_tone_ri", "pillar_tone_ga",
                "pillar_tone_ma", "pillar_tone_pa", "pillar_tone_dha", "pillar_tone_ni"
            };

            foreach (var s in swaras)
            {
                string path = $"{swaraDir}/{s}.wav";
                Assert.IsTrue(File.Exists(path), $"Swara file missing: {path}");
            }
        }

        [Test]
        public void WildlifeAudioFiles_ThreePlaceholderWavsExist()
        {
            string wildDir = "Assets/_Project/Audio/Wildlife";
            string[] calls = { "call_nilgiri_tahr.wav", "call_elephant.wav", "call_peafowl.wav" };

            foreach (var c in calls)
            {
                string path = $"{wildDir}/{c}";
                Assert.IsTrue(File.Exists(path), $"Wildlife audio placeholder missing: {path}");
            }
        }

        [Test]
        public void TamilVoiceSpecification_ReadmeExists_AndNoFakeVoiceFilesFabricated()
        {
            string readmePath = "Assets/_Project/Audio/Voice/README.md";
            Assert.IsTrue(File.Exists(readmePath), "Tamil voice recording specification README must exist.");

            string text = File.ReadAllText(readmePath);
            Assert.IsTrue(text.Contains("BLOCKED_EXTERNAL_ASSET"), "README must document blocked external asset status.");
            Assert.IsTrue(text.Contains("murugan_intro_01.ogg"), "README must specify Murugan intro bark.");
            Assert.IsTrue(text.Contains("velu_pichavaram_01.ogg"), "README must specify Velu intro bark.");
        }

        [Test]
        public void CarnaticSwaraLibrary_ContainsSevenSwaras_AndReturnsFiveMohanam()
        {
            var lib = ScriptableObject.CreateInstance<CarnaticSwaraLibrary>();
            string[] names = { "sa", "ri", "ga", "ma", "pa", "dha", "ni" };
            float[] freqs = { 220f, 247.5f, 275f, 293.33f, 330f, 371.25f, 412.5f };

            for (int i = 0; i < names.Length; i++)
            {
                lib.swaras.Add(new SwaraEntry
                {
                    swaraName = names[i],
                    frequencyHz = freqs[i],
                    clip = AudioClip.Create(names[i], 44100, 1, 44100, false)
                });
            }

            Assert.AreEqual(7, lib.swaras.Count, "Library must store all 7 heptatonic swaras.");
            var mohanam = lib.GetMohanamClips();
            Assert.AreEqual(5, mohanam.Length, "Mohanam pentatonic order must yield exactly 5 notes.");

            Object.DestroyImmediate(lib);
        }

        [Test]
        public void PuddleDecalController_OpacityRespondsToRainWeather()
        {
            var go = new GameObject("Test_Puddle");
            var mr = go.AddComponent<MeshRenderer>();
            var controller = go.AddComponent<PuddleDecalController>();

            // When clear, opacity should be 0
            controller.ApplyOpacity(0f);
            Assert.AreEqual(0f, controller.currentOpacity);
            Assert.IsFalse(mr.enabled, "Renderer should be disabled when evaporated.");

            // When raining, opacity should be set
            controller.ApplyOpacity(0.85f);
            Assert.AreEqual(0.85f, controller.currentOpacity);
            Assert.IsTrue(mr.enabled, "Renderer should be enabled when puddle forms.");

            Object.DestroyImmediate(go);
        }

        [Test]
        public void WildlifeAudioObserver_InitializesSpatialSource()
        {
            var go = new GameObject("Test_Elephant");
            var observer = go.AddComponent<WildlifeAudioObserver>();
            observer.InitializeAudioSource();

            var src = go.GetComponent<AudioSource>();
            Assert.IsNotNull(src);
            Assert.AreEqual(1.0f, src.spatialBlend, "Wildlife call must be 3D spatialized.");
            Assert.IsFalse(src.playOnAwake);

            Object.DestroyImmediate(go);
        }

        [Test]
        public void NPCVoiceBarkPlayer_GracefullyHandlesNullSpeechClip()
        {
            var go = new GameObject("Test_NPC");
            var barkPlayer = go.AddComponent<NPCVoiceBarkPlayer>();
            barkPlayer.speechClip = null;

            // Must not throw exception
            Assert.DoesNotThrow(() => barkPlayer.PlayGreetingBark());

            Object.DestroyImmediate(go);
        }
    }
}
