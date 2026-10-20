using UnityEngine;

[RequireComponent(typeof(AudioSource))]
[RequireComponent(typeof(Rigidbody))]
public class AutoAudioPropagation : MonoBehaviour
{
    [Header("Doppler Realism Parameters")]
    [Range(0f, 5f)] public float dopplerLevelIntensity = 1.5f;
    public float minEnginePitch = 0.75f;
    public float maxEnginePitch = 2.2f;
    public float topSpeedReference = 15f;

    [Header("Environmental Sound Occlusion")]
    public LayerMask structuralObstacleLayers;
    private AudioSource vehicleAudioSource;
    private Rigidbody vehicleRigidbody;
    private Transform playerEarTransform;

    void Start()
    {
        Debug.Log("?? Page 8 Audio System Initialized: Calibrating spatial sound propagation parameters.");
        
        vehicleAudioSource = GetComponent<AudioSource>();
        vehicleRigidbody = GetComponent<Rigidbody>();
        
        // Force establish high-fidelity real-world spatial sound settings
        vehicleAudioSource.spatialBlend = 1.0f; // 100% 3D physical sound space
        vehicleAudioSource.dopplerLevel = dopplerLevelIntensity;
        vehicleAudioSource.rolloffMode = AudioRolloffMode.Logarithmic;
        vehicleAudioSource.minDistance = 2f;
        vehicleAudioSource.maxDistance = 45f;
        vehicleAudioSource.loop = true;

        GameObject player = GameObject.Find("RealWorld_ActivePlayer_Entity") ?? GameObject.FindGameObjectWithTag("Player");
        if (player != null && Camera.main != null)
        {
            playerEarTransform = Camera.main.transform;
        }
    }

    void Update()
    {
        CalculateDynamicEnginePitch();
        ApplyAcousticOcclusionRaycasts();
    }

    private void CalculateDynamicEnginePitch()
    {
        if (vehicleRigidbody == null || vehicleAudioSource == null) return;

        // Map real-world physics velocity magnitude directly to the engine sound frequency pitch
        #if UNITY_6000_0_OR_NEWER
        float currentSpeed = vehicleRigidbody.linearVelocity.magnitude;
        #else
        float currentSpeed = vehicleRigidbody.velocity.magnitude;
        #endif
        
        float speedRatio = currentSpeed / topSpeedReference;
        vehicleAudioSource.pitch = Mathf.Lerp(minEnginePitch, maxEnginePitch, speedRatio);
    }

    private void ApplyAcousticOcclusionRaycasts()
    {
        if (playerEarTransform == null || vehicleAudioSource == null) return;

        // Perform a physical sound raycast tracing path between the vehicle engine and the player's position
        Vector3 soundVectorDirection = playerEarTransform.position - transform.position;
        float spatialDistance = soundVectorDirection.magnitude;

        if (Physics.Raycast(transform.position, soundVectorDirection.normalized, out RaycastHit concreteWallHit, spatialDistance, structuralObstacleLayers))
        {
            // If an Indo-Saracenic brick structure blocks the sound waves, muffle the audio volume naturally
            vehicleAudioSource.volume = Mathf.Lerp(vehicleAudioSource.volume, 0.25f, Time.deltaTime * 4f);
            Debug.Log("?? Audio Engine: Sound waves muffled through concrete architectural structure.");
        }
        else
        {
            // Clear sound propagation pathway
            vehicleAudioSource.volume = Mathf.Lerp(vehicleAudioSource.volume, 1.0f, Time.deltaTime * 3f);
        }
    }
}
