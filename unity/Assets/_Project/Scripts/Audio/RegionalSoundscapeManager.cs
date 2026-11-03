// ============================================================================
// THE WHISPERING WILDS — REGIONAL SOUNDSCAPE MANAGER
// ============================================================================
//
// Manages multi-layered spatial ambient audio, regional environmental crossfades,
// and periodic acoustic cues across the 6 Tamil Nadu biomes and sacred temple ruins.
// Pairs with AudioManager to maintain master/ambient bus volume integrity.
// ============================================================================

using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Audio
{
    [System.Serializable]
    public class RegionAudioProfile
    {
        public string regionId;
        public string displayName;
        public AudioClip primaryAmbienceClip;
        public AudioClip secondaryAmbienceClip;
        public AudioClip periodicSFXClip;
        public float periodicSFXIntervalMin = 15f;
        public float periodicSFXIntervalMax = 45f;
        [Range(0f, 1f)] public float baseVolume = 1.0f;
    }

    [DisallowMultipleComponent]
    public class RegionalSoundscapeManager : MonoBehaviour
    {
        private static RegionalSoundscapeManager _instance;
        public static RegionalSoundscapeManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    _instance = FindAnyObjectByType<RegionalSoundscapeManager>();
                }
                return _instance;
            }
            private set => _instance = value;
        }

        [Header("Audio Sources")]
        [SerializeField] private AudioSource ambienceSourceA;
        [SerializeField] private AudioSource ambienceSourceB;
        [SerializeField] private AudioSource periodicSFXSource;

        [Header("Crossfade Settings")]
        [Tooltip("Default transition duration between regions in seconds.")]
        public float defaultCrossfadeDuration = 2.0f;

        [Header("Regional Profiles")]
        public List<RegionAudioProfile> regionalProfiles = new List<RegionAudioProfile>();

        // Runtime state
        private AudioSource _activeSource;
        private Coroutine _crossfadeRoutine;
        private Coroutine _periodicSFXRoutine;
        private RegionAudioProfile _currentProfile;

        public string CurrentRegionId => _currentProfile != null ? _currentProfile.regionId : string.Empty;

        public void EnsureInitialized()
        {
            InitializeSources();
            EnsureDefaultProfiles();
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                if (Application.isPlaying) Destroy(gameObject);
                else DestroyImmediate(gameObject);
                return;
            }
            Instance = this;

            EnsureInitialized();
        }

        private void OnDestroy()
        {
            if (Instance == this) Instance = null;
        }

        private void InitializeSources()
        {
            if (ambienceSourceA == null) ambienceSourceA = gameObject.AddComponent<AudioSource>();
            if (ambienceSourceB == null) ambienceSourceB = gameObject.AddComponent<AudioSource>();
            if (periodicSFXSource == null) periodicSFXSource = gameObject.AddComponent<AudioSource>();

            ambienceSourceA.loop = true;
            ambienceSourceB.loop = true;
            periodicSFXSource.loop = false;

            ambienceSourceA.spatialBlend = 0f;
            ambienceSourceB.spatialBlend = 0f;
            periodicSFXSource.spatialBlend = 0.35f; // Spatialized for acoustic immersion

            _activeSource = ambienceSourceA;
        }

        public void EnsureDefaultProfiles()
        {
            if (regionalProfiles == null) regionalProfiles = new List<RegionAudioProfile>();

            AddDefaultProfileIfNotExists("chennai", "George Town Coastal City");
            AddDefaultProfileIfNotExists("pichavaram", "Mangrove Wetlands");
            AddDefaultProfileIfNotExists("thanjavur", "Cauvery Delta Agriculture");
            AddDefaultProfileIfNotExists("chettinad", "Historic Mansions & Crafts");
            AddDefaultProfileIfNotExists("mamallapuram", "Shore Temple & Ocean");
            AddDefaultProfileIfNotExists("nilgiris", "Highland Tea Sanctuary");
            AddDefaultProfileIfNotExists("ancient_temple", "Dravidian Sacred Ruins");
        }

        private void AddDefaultProfileIfNotExists(string id, string name)
        {
            if (!regionalProfiles.Exists(p => p.regionId == id))
            {
                regionalProfiles.Add(new RegionAudioProfile
                {
                    regionId = id,
                    displayName = name,
                    baseVolume = 0.85f
                });
            }
        }

        public RegionAudioProfile GetProfile(string regionId)
        {
            if (string.IsNullOrEmpty(regionId)) return null;
            if (regionalProfiles == null || regionalProfiles.Count == 0) EnsureDefaultProfiles();
            return regionalProfiles.Find(p => string.Equals(p.regionId, regionId, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Transitions ambient soundscape to the target region with a smooth crossfade.
        /// </summary>
        public void TransitionToRegion(string regionId, float duration = -1f)
        {
            RegionAudioProfile profile = GetProfile(regionId);
            if (profile == null)
            {
                Debug.LogWarning($"[SoundscapeManager] Unknown region '{regionId}', ignoring soundscape transition.");
                return;
            }

            if (_currentProfile != null && _currentProfile.regionId == profile.regionId && _activeSource != null && _activeSource.isPlaying)
            {
                return; // Already playing this region
            }

            _currentProfile = profile;
            float fadeTime = duration >= 0f ? duration : defaultCrossfadeDuration;

            if (Application.isPlaying)
            {
                if (_crossfadeRoutine != null) StopCoroutine(_crossfadeRoutine);
                _crossfadeRoutine = StartCoroutine(CrossfadeAmbience(profile, fadeTime));

                if (_periodicSFXRoutine != null) StopCoroutine(_periodicSFXRoutine);
                if (profile.periodicSFXClip != null)
                {
                    _periodicSFXRoutine = StartCoroutine(PeriodicSFXLoop(profile));
                }
            }
        }

        private IEnumerator CrossfadeAmbience(RegionAudioProfile profile, float duration)
        {
            AudioSource oldSource = _activeSource;
            AudioSource newSource = (_activeSource == ambienceSourceA) ? ambienceSourceB : ambienceSourceA;

            float targetVol = profile.baseVolume;
            if (AudioManager.Instance != null)
            {
                targetVol *= AudioManager.Instance.ambientVolume * AudioManager.Instance.masterVolume;
            }

            if (profile.primaryAmbienceClip != null)
            {
                newSource.clip = profile.primaryAmbienceClip;
                newSource.volume = 0f;
                newSource.Play();
            }

            float elapsed = 0f;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);

                if (newSource.clip != null) newSource.volume = t * targetVol;
                if (oldSource.clip != null) oldSource.volume = (1f - t) * targetVol;

                yield return null;
            }

            oldSource.Stop();
            _activeSource = newSource;
            Debug.Log($"[SoundscapeManager] Transitioned to region '{profile.regionId}' ({profile.displayName}).");
        }

        private IEnumerator PeriodicSFXLoop(RegionAudioProfile profile)
        {
            while (true)
            {
                float delay = UnityEngine.Random.Range(profile.periodicSFXIntervalMin, profile.periodicSFXIntervalMax);
                yield return new WaitForSeconds(delay);

                if (profile.periodicSFXClip != null && periodicSFXSource != null)
                {
                    float vol = profile.baseVolume;
                    if (AudioManager.Instance != null)
                    {
                        vol *= AudioManager.Instance.sfxVolume * AudioManager.Instance.masterVolume;
                    }
                    periodicSFXSource.PlayOneShot(profile.periodicSFXClip, vol);
                }
            }
        }

        public void StopSoundscape()
        {
            if (_crossfadeRoutine != null) StopCoroutine(_crossfadeRoutine);
            if (_periodicSFXRoutine != null) StopCoroutine(_periodicSFXRoutine);

            if (ambienceSourceA != null) ambienceSourceA.Stop();
            if (ambienceSourceB != null) ambienceSourceB.Stop();
            if (periodicSFXSource != null) periodicSFXSource.Stop();

            _currentProfile = null;
        }
    }
}
