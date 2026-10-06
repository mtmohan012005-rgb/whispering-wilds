using NUnit.Framework;
using UnityEngine;
using WhisperingWilds.Audio;
using WhisperingWilds.UI;

namespace WhisperingWilds.Tests.EditMode
{
    /// <summary>
    /// Audio bus setters must clamp into the 0..1 mixer range and keep the documented defaults,
    /// and the settings controller must be able to push its audio values without a live
    /// AudioManager in the frame (graceful degradation).
    /// </summary>
    public class AudioSettingsTests
    {
        private static AudioManager NewAudioManager()
        {
            var go = new GameObject("TestAudio");
            // Awake is not invoked during edit-mode construction, which is exactly what we want:
            // these tests exercise the pure setter/store logic, not the scene singleton wiring.
            return go.AddComponent<AudioManager>();
        }

        [Test]
        public void DefaultBusVolumes_AreAsAuthored()
        {
            AudioManager audio = NewAudioManager();
            Assert.That(audio.masterVolume, Is.EqualTo(1.0f).Within(1e-4f));
            Assert.That(audio.musicVolume, Is.EqualTo(0.8f).Within(1e-4f));
            Assert.That(audio.ambientVolume, Is.EqualTo(0.75f).Within(1e-4f));
            Assert.That(audio.sfxVolume, Is.EqualTo(0.9f).Within(1e-4f));
            Assert.That(audio.voiceVolume, Is.EqualTo(1.0f).Within(1e-4f));
            Assert.That(audio.uiVolume, Is.EqualTo(0.85f).Within(1e-4f));
            Object.DestroyImmediate(audio.gameObject);
        }

        [Test]
        public void Setters_ClampIntoZeroToOneRange()
        {
            AudioManager audio = NewAudioManager();

            audio.SetMasterVolume(2f);
            audio.SetMusicVolume(-1f);
            audio.SetAmbientVolume(1.5f);
            audio.SetSFXVolume(0.4f);
            audio.SetVoiceVolume(-1f);
            audio.SetUiVolume(3f);

            Assert.That(audio.masterVolume, Is.EqualTo(1.0f).Within(1e-4f));
            Assert.That(audio.musicVolume, Is.EqualTo(0f).Within(1e-4f));
            Assert.That(audio.ambientVolume, Is.EqualTo(1.0f).Within(1e-4f));
            Assert.That(audio.sfxVolume, Is.EqualTo(0.4f).Within(1e-4f));
            Assert.That(audio.voiceVolume, Is.EqualTo(0f).Within(1e-4f));
            Assert.That(audio.uiVolume, Is.EqualTo(1.0f).Within(1e-4f));

            Object.DestroyImmediate(audio.gameObject);
        }

        [Test]
        public void SettingsController_AppliesAudioWithoutThrowingWithoutManager()
        {
            // No AudioManager.Instance exists here; ApplyAllSettings must tolerate it.
            var go = new GameObject("TestSettingsController");
            SettingsMenuController ctrl = go.AddComponent<SettingsMenuController>();
            ctrl.masterVolume = 0.5f;
            ctrl.musicVolume = 0.4f;
            Assert.DoesNotThrow(() => ctrl.ApplyAllSettings());
            Object.DestroyImmediate(go);
        }
    }
}