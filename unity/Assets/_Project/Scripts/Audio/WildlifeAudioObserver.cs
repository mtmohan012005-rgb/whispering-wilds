using UnityEngine;
using WhisperingWilds.Ecology;

namespace WhisperingWilds.Audio
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(AudioSource))]
    public class WildlifeAudioObserver : MonoBehaviour
    {
        [Header("Clips")]
        public AudioClip alertClip;
        public AudioClip ambientCallClip;

        [Header("Acoustic Properties")]
        [Range(0f, 1f)] public float volume = 0.85f;
        public float minDistance = 3.0f;
        public float maxDistance = 35.0f;

        private AudioSource _audioSource;
        private AnimalAIController _aiController;

        private void Awake()
        {
            InitializeAudioSource();
            _aiController = GetComponent<AnimalAIController>();
        }

        public void InitializeAudioSource()
        {
            if (_audioSource == null)
            {
                _audioSource = GetComponent<AudioSource>();
                if (_audioSource == null) _audioSource = gameObject.AddComponent<AudioSource>();
            }

            _audioSource.spatialBlend = 1.0f; // 3D spatialized
            _audioSource.playOnAwake = false;
            _audioSource.rolloffMode = AudioRolloffMode.Logarithmic;
            _audioSource.minDistance = minDistance;
            _audioSource.maxDistance = maxDistance;
        }

        public void PlayAlertCall()
        {
            if (alertClip == null) return;
            InitializeAudioSource();

            float busVol = volume;
            if (AudioManager.Instance != null)
            {
                busVol *= AudioManager.Instance.sfxVolume * AudioManager.Instance.masterVolume;
            }

            _audioSource.PlayOneShot(alertClip, busVol);
        }

        public void PlayAmbientCall()
        {
            if (ambientCallClip == null) return;
            InitializeAudioSource();

            float busVol = volume;
            if (AudioManager.Instance != null)
            {
                busVol *= AudioManager.Instance.sfxVolume * AudioManager.Instance.masterVolume;
            }

            _audioSource.PlayOneShot(ambientCallClip, busVol);
        }
    }
}
