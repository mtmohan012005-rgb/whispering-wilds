using System;
using UnityEngine;

namespace WhisperingWilds.Audio
{
    public enum SurfaceType
    {
        Stone,
        Mud,
        Grass,
        Water,
        Sand
    }

    /// <summary>
    /// Coordinates terrain-adaptive surface audio for player and creature locomotion.
    /// Performs downward physics raycasts to identify surface materials (e.g. Cauvery mud,
    /// Pichavaram mangrove water, Nilgiris montane grass, Mamallapuram shore sand)
    /// and plays calibrated acoustic footsteps at natural stride cadences.
    /// </summary>
    public class SurfaceAudioController : MonoBehaviour
    {
        [Header("Audio Clips")]
        [SerializeField] private AudioClip stoneClip;
        [SerializeField] private AudioClip mudClip;
        [SerializeField] private AudioClip grassClip;
        [SerializeField] private AudioClip waterClip;
        [SerializeField] private AudioClip sandClip;

        [Header("Cadence & Stride Settings")]
        [SerializeField] private float walkStepInterval = 0.52f;
        [SerializeField] private float runStepInterval = 0.34f;
        [SerializeField] private float sprintStepInterval = 0.26f;
        [SerializeField] private float raycastDistance = 1.5f;
        [SerializeField] private LayerMask groundLayerMask = ~0;

        private float stepTimer = 0f;
        public SurfaceType LastDetectedSurface { get; private set; } = SurfaceType.Stone;

        public event Action<SurfaceType> OnFootstepPlayed;

        private void Awake()
        {
            LoadClipsIfMissing();
        }

        public void LoadClipsIfMissing()
        {
#if UNITY_EDITOR
            if (stoneClip == null) stoneClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Footsteps/footstep_stone.wav");
            if (mudClip == null) mudClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Footsteps/footstep_mud.wav");
            if (grassClip == null) grassClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Footsteps/footstep_grass.wav");
            if (waterClip == null) waterClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Footsteps/footstep_water.wav");
            if (sandClip == null) sandClip = UnityEditor.AssetDatabase.LoadAssetAtPath<AudioClip>("Assets/_Project/Audio/Footsteps/footstep_sand.wav");
#endif
        }

        /// <summary>
        /// Evaluates movement velocity and cadence timer, firing footsteps on footfall impacts.
        /// </summary>
        public void UpdateLocomotionFootsteps(float speed, bool isGrounded, Vector3 origin)
        {
            if (!isGrounded || speed < 0.15f)
            {
                stepTimer = 0f;
                return;
            }

            float currentInterval = walkStepInterval;
            if (speed > 4.5f) currentInterval = sprintStepInterval;
            else if (speed > 2.5f) currentInterval = runStepInterval;

            stepTimer += Time.deltaTime;
            if (stepTimer >= currentInterval)
            {
                stepTimer -= currentInterval;
                PlayStepAt(origin);
            }
        }

        /// <summary>
        /// Explicit step trigger (e.g. called from animation events).
        /// </summary>
        public void PlayStepAt(Vector3 origin)
        {
            SurfaceType surface = DetectSurface(origin);
            LastDetectedSurface = surface;
            AudioClip clip = GetClipForSurface(surface);

            if (clip != null && AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX(clip, origin, 0.75f);
            }

            OnFootstepPlayed?.Invoke(surface);
        }

        /// <summary>
        /// Identifies surface type from RaycastHit physical material, tag, or name.
        /// </summary>
        public SurfaceType DetectSurface(Vector3 origin)
        {
            if (Physics.Raycast(origin + Vector3.up * 0.2f, Vector3.down, out RaycastHit hit, raycastDistance, groundLayerMask))
            {
                string hitName = hit.collider.gameObject.name.ToLower();
                string hitTag = hit.collider.gameObject.tag.ToLower();

                if (hitName.Contains("mud") || hitName.Contains("soil") || hitName.Contains("paddy") || hitTag.Contains("mud"))
                    return SurfaceType.Mud;
                if (hitName.Contains("grass") || hitName.Contains("foliage") || hitName.Contains("meadow") || hitTag.Contains("grass"))
                    return SurfaceType.Grass;
                if (hitName.Contains("water") || hitName.Contains("river") || hitName.Contains("canal") || hitTag.Contains("water"))
                    return SurfaceType.Water;
                if (hitName.Contains("sand") || hitName.Contains("beach") || hitName.Contains("shore") || hitTag.Contains("sand"))
                    return SurfaceType.Sand;
                if (hitName.Contains("stone") || hitName.Contains("rock") || hitName.Contains("tile") || hitTag.Contains("stone"))
                    return SurfaceType.Stone;
            }

            return SurfaceType.Stone;
        }

        public AudioClip GetClipForSurface(SurfaceType surface)
        {
            return surface switch
            {
                SurfaceType.Mud => mudClip != null ? mudClip : stoneClip,
                SurfaceType.Grass => grassClip != null ? grassClip : stoneClip,
                SurfaceType.Water => waterClip != null ? waterClip : stoneClip,
                SurfaceType.Sand => sandClip != null ? sandClip : stoneClip,
                _ => stoneClip
            };
        }
    }
}
