using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Audio
{
    public enum AudioBus
    {
        Master,
        Ambience,
        Music,
        SFX,
        Voice,
        UI
    }

    /// <summary>
    /// Central audio bus and spatial sound manager.
    /// Supports regional music cross-fading and audio pooling.
    /// </summary>
    [DisallowMultipleComponent]
    public class AudioManager : MonoBehaviour
    {
        private static AudioManager _instance;
        public static AudioManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = UnityEngine.Object.FindAnyObjectByType<AudioManager>();
                    if (_instance != null && _instance.ambientSource == null)
                    {
                        _instance.InitializeSources();
                    }
                }
                return _instance;
            }
            private set => _instance = value;
        }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource musicSourceA;
        [SerializeField] private AudioSource musicSourceB;
        [SerializeField] private AudioSource ambientSource;
        [SerializeField] private AudioSource uiSource;

        [Header("Bus Volumes (0.0 to 1.0)")]
        [Range(0f, 1f)] public float masterVolume = 1.0f;
        [Range(0f, 1f)] public float musicVolume = 0.8f;
        [Range(0f, 1f)] public float ambientVolume = 0.75f;
        [Range(0f, 1f)] public float sfxVolume = 0.9f;
        [Range(0f, 1f)] public float voiceVolume = 1.0f;
        [Range(0f, 1f)] public float uiVolume = 0.85f;

        private AudioSource activeMusicSource;
        private Coroutine musicCrossfadeRoutine;

private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                if (Application.isPlaying) Destroy(this);
                else DestroyImmediate(this);
                return;
            }
            Instance = this;
            if (Application.isPlaying) DontDestroyOnLoad(gameObject);

            InitializeSources();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

private void InitializeSources()
        {
            if (musicSourceA == null) musicSourceA = gameObject.AddComponent<AudioSource>();
            if (musicSourceB == null) musicSourceB = gameObject.AddComponent<AudioSource>();
            if (ambientSource == null) ambientSource = gameObject.AddComponent<AudioSource>();
            if (uiSource == null) uiSource = gameObject.AddComponent<AudioSource>();

            musicSourceA.loop = true;
            musicSourceB.loop = true;
            ambientSource.loop = true;
            ambientSource.spatialBlend = 0f;

            activeMusicSource = musicSourceA;
            ApplyVolumes();
        }

        /// <summary>
        /// Refreshes every playing source from the current bus volumes so the stored settings are
        /// always the live mixer state, and the ambient bus actually reaches playback instead of
        /// being a stored-and-ignored field.
        /// </summary>
        public void ApplyVolumes()
        {
            if (ambientSource == null && gameObject != null) InitializeSources();
            float master = Mathf.Clamp01(masterVolume);
            if (ambientSource != null) ambientSource.volume = Mathf.Clamp01(ambientVolume) * master;
            if (uiSource != null) uiSource.volume = Mathf.Clamp01(uiVolume) * master;

            // Keep the active music source at the target music level; inactive/fading source is managed by crossfade.
            if (activeMusicSource != null && activeMusicSource.isPlaying && musicCrossfadeRoutine == null)
            {
                activeMusicSource.volume = Mathf.Clamp01(musicVolume) * master;
            }
        }

        /// <summary>Plays an ambient loop through the ambient bus, honouring the ambient + master volumes.</summary>
        public void PlayAmbient(AudioClip clip)
        {
            if (clip == null || ambientSource == null) return;
            ambientSource.clip = clip;
            ambientSource.volume = ambientVolume * masterVolume;
            if (!ambientSource.isPlaying) ambientSource.Play();
        }

        public void StopAmbient()
        {
            if (ambientSource != null && ambientSource.isPlaying) ambientSource.Stop();
        }

        public void PlayMusic(AudioClip clip, float fadeDuration = 1.5f)
        {
            if (clip == null) return;
            if (activeMusicSource == null || musicSourceA == null || musicSourceB == null) InitializeSources();
            if (activeMusicSource != null && activeMusicSource.clip == clip && activeMusicSource.isPlaying) return;

            if (musicCrossfadeRoutine != null) StopCoroutine(musicCrossfadeRoutine);
            musicCrossfadeRoutine = StartCoroutine(CrossfadeMusicRoutine(clip, fadeDuration));
        }

        public void StopMusic(float fadeDuration = 0.5f)
        {
            if (musicCrossfadeRoutine != null) StopCoroutine(musicCrossfadeRoutine);
            musicCrossfadeRoutine = StartCoroutine(FadeOutMusicRoutine(fadeDuration));
        }

        private IEnumerator FadeOutMusicRoutine(float duration)
        {
            AudioSource a = musicSourceA;
            AudioSource b = musicSourceB;
            float startA = a != null ? a.volume : 0f;
            float startB = b != null ? b.volume : 0f;
            float elapsed = 0f;
            duration = Mathf.Max(0.01f, duration);
            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                if (a != null) a.volume = Mathf.Lerp(startA, 0f, t);
                if (b != null) b.volume = Mathf.Lerp(startB, 0f, t);
                yield return null;
            }
            if (a != null) a.Stop();
            if (b != null) b.Stop();
            if (a != null) a.clip = null;
            if (b != null) b.clip = null;
            activeMusicSource = musicSourceA;
            musicCrossfadeRoutine = null;
        }

        private IEnumerator CrossfadeMusicRoutine(AudioClip newClip, float duration)
        {
            AudioSource oldSource = activeMusicSource != null ? activeMusicSource : musicSourceA;
            AudioSource newSource = (oldSource == musicSourceA) ? musicSourceB : musicSourceA;

            newSource.clip = newClip;
            newSource.loop = true;
            newSource.volume = 0f;
            if (!newSource.isPlaying) newSource.Play();

            float oldStart = (oldSource != null && oldSource.isPlaying) ? oldSource.volume : 0f;
            float target = Mathf.Clamp01(musicVolume) * Mathf.Clamp01(masterVolume);
            float elapsed = 0f;
            duration = Mathf.Max(0.01f, duration);

            while (elapsed < duration)
            {
                elapsed += Time.unscaledDeltaTime; // menu-safe (Time.timeScale may be 0)
                float t = Mathf.Clamp01(elapsed / duration);
                newSource.volume = t * target;
                if (oldSource != null && oldSource.isPlaying) oldSource.volume = Mathf.Lerp(oldStart, 0f, t);
                yield return null;
            }

            newSource.volume = target;
            if (oldSource != null && oldSource != newSource)
            {
                oldSource.Stop();
                oldSource.clip = null;
            }
            activeMusicSource = newSource;
            musicCrossfadeRoutine = null;
        }

        public void PlaySFX(AudioClip clip, Vector3 position, float volumeMultiplier = 1f)
        {
            if (clip == null) return;
            AudioSource.PlayClipAtPoint(clip, position, sfxVolume * masterVolume * volumeMultiplier);
        }

        public void PlayUISound(AudioClip clip)
        {
            if (clip == null || uiSource == null) return;
            uiSource.PlayOneShot(clip, uiVolume * masterVolume);
        }

public void SetMasterVolume(float vol) { masterVolume = Mathf.Clamp01(vol); ApplyVolumes(); }
        public void SetMusicVolume(float vol) { musicVolume = Mathf.Clamp01(vol); ApplyVolumes(); }
        public void SetAmbientVolume(float vol) { ambientVolume = Mathf.Clamp01(vol); ApplyVolumes(); }
        public void SetSFXVolume(float vol) { sfxVolume = Mathf.Clamp01(vol); ApplyVolumes(); }
        public void SetVoiceVolume(float vol) { voiceVolume = Mathf.Clamp01(vol); ApplyVolumes(); }
        public void SetUiVolume(float vol) { uiVolume = Mathf.Clamp01(vol); ApplyVolumes(); }
    }
}
