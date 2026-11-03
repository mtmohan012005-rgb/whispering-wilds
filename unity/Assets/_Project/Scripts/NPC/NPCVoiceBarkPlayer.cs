using UnityEngine;
using WhisperingWilds.Audio;

namespace WhisperingWilds.NPC
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(AudioSource))]
    public class NPCVoiceBarkPlayer : MonoBehaviour
    {
        [Header("Voice Performance Asset")]
        [Tooltip("Authentic native Tamil vocal recording. Kept null until licensed voice performances are delivered.")]
        public AudioClip speechClip;

        [Header("Audio Settings")]
        [Range(0f, 1f)] public float baseVolume = 1.0f;
        public float minDistance = 2.0f;
        public float maxDistance = 15.0f;

        private AudioSource _audioSource;

        private void Awake()
        {
            InitializeAudioSource();
        }

        public void InitializeAudioSource()
        {
            if (_audioSource == null)
            {
                _audioSource = GetComponent<AudioSource>();
                if (_audioSource == null) _audioSource = gameObject.AddComponent<AudioSource>();
            }

            _audioSource.spatialBlend = 0.75f;
            _audioSource.playOnAwake = false;
            _audioSource.minDistance = minDistance;
            _audioSource.maxDistance = maxDistance;
        }

        public void PlayGreetingBark()
        {
            // If human voice clip is awaiting delivery, gracefully return without error
            if (speechClip == null) return;

            InitializeAudioSource();

            float vol = baseVolume;
            if (AudioManager.Instance != null)
            {
                vol *= AudioManager.Instance.voiceVolume * AudioManager.Instance.masterVolume;
            }

            _audioSource.PlayOneShot(speechClip, vol);
        }
    }
}
