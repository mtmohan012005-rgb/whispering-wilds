using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Simulates realistic procedural cloth dynamics for traditional Tamil attire:
    /// the cotton veshti (dhoti) and shoulder thundu (angavastram).
    /// Emulates starched cotton inertia, gravity drape, and wind response
    /// without expensive GPU cloth physics bottlenecks.
    /// </summary>
    [DisallowMultipleComponent]
    public class VeshtiClothPhysicsController : MonoBehaviour
    {
        [Header("Attire Mesh / Bone Targets")]
        [SerializeField] private Transform veshtiHemBone;
        [SerializeField] private Transform thunduFrontTipBone;
        [SerializeField] private Transform thunduBackTipBone;

        [Header("Cotton Material Properties")]
        [Range(1f, 30f)] [SerializeField] private float stiffness = 14f;
        [Range(0.5f, 15f)] [SerializeField] private float damping = 6.5f;
        [Range(0f, 2f)] [SerializeField] private float weightMass = 0.85f;
        [SerializeField] private float maxHemSwayAngle = 22f;

        [Header("Wind Interaction")]
        [SerializeField] private bool respondToWeatherWind = true;
        [Range(0f, 2f)] [SerializeField] private float windTurbulenceMultiplier = 0.75f;

        // Dynamics state tracking
        private Vector3 prevRootPosition;
        private Vector3 rootVelocity;
        private Vector3 rootAcceleration;
        private Vector3 currentHemDisplacement;
        private Vector3 hemVelocity;
        private Quaternion initialHemLocalRot;
        private Quaternion initialThunduFrontLocalRot;
        private Quaternion initialThunduBackLocalRot;

        void Start()
        {
            prevRootPosition = transform.position;

            if (veshtiHemBone != null) initialHemLocalRot = veshtiHemBone.localRotation;
            if (thunduFrontTipBone != null) initialThunduFrontLocalRot = thunduFrontTipBone.localRotation;
            if (thunduBackTipBone != null) initialThunduBackLocalRot = thunduBackTipBone.localRotation;

            // Auto-detect bones from hierarchy if not assigned in Inspector
            if (veshtiHemBone == null)
            {
                veshtiHemBone = FindDeepChild(transform, "Player_Veshti") 
                             ?? FindDeepChild(transform, "Veshti_Hem")
                             ?? FindDeepChild(transform, "Spine1");
                if (veshtiHemBone != null) initialHemLocalRot = veshtiHemBone.localRotation;
            }

            if (thunduFrontTipBone == null)
            {
                thunduFrontTipBone = FindDeepChild(transform, "Player_Angavastram")
                                  ?? FindDeepChild(transform, "Thundu_Front")
                                  ?? FindDeepChild(transform, "LeftShoulder");
                if (thunduFrontTipBone != null) initialThunduFrontLocalRot = thunduFrontTipBone.localRotation;
            }
        }

        void LateUpdate()
        {
            float dt = Time.deltaTime;
            if (dt <= 0f || dt > 0.1f) return;

            // 1. Calculate locomotion acceleration forces
            Vector3 currentPos = transform.position;
            Vector3 newVelocity = (currentPos - prevRootPosition) / dt;
            rootAcceleration = (newVelocity - rootVelocity) / dt;
            rootVelocity = newVelocity;
            prevRootPosition = currentPos;

            // 2. Fetch environmental wind from WeatherSystem if available
            Vector3 environmentalWind = Vector3.zero;
            if (respondToWeatherWind && WeatherSystem.Instance != null)
            {
                // Monsoonal gusts and regional breezes
                float windSpeed = (WeatherSystem.Instance.CurrentWeather == WeatherType.Windy || WeatherSystem.Instance.CurrentWeather == WeatherType.Thunderstorm) ? 12.0f : 4.0f;
                float gust = Mathf.Sin(Time.time * 2.3f) * 0.4f + 0.6f;
                environmentalWind = transform.forward * (-windSpeed * 0.15f * gust);
            }

            // 3. Inertial drag opposes acceleration: F_inertial = -m * a
            Vector3 inertialForce = -rootAcceleration * weightMass * 0.08f;
            Vector3 externalForce = inertialForce + environmentalWind;

            // 4. Spring-damper integration: a = (F - k*x - c*v) / m
            Vector3 springForce = -stiffness * currentHemDisplacement;
            Vector3 dampingForce = -damping * hemVelocity;
            Vector3 netHemAccel = (springForce + dampingForce + externalForce) / Mathf.Max(0.1f, weightMass);

            hemVelocity += netHemAccel * dt;
            currentHemDisplacement += hemVelocity * dt;

            // Clamp max drape sway to prevent garment distortion
            currentHemDisplacement = Vector3.ClampMagnitude(currentHemDisplacement, 0.35f);

            // 5. Apply rotation offset to cloth bones
            ApplyDisplacementToBone(veshtiHemBone, initialHemLocalRot, currentHemDisplacement, maxHemSwayAngle);
            ApplyDisplacementToBone(thunduFrontTipBone, initialThunduFrontLocalRot, currentHemDisplacement * 1.3f, maxHemSwayAngle * 1.4f);
            ApplyDisplacementToBone(thunduBackTipBone, initialThunduBackLocalRot, currentHemDisplacement * 1.1f, maxHemSwayAngle * 1.2f);
        }

        private void ApplyDisplacementToBone(Transform bone, Quaternion initialRot, Vector3 displacement, float maxAngle)
        {
            if (bone == null) return;

            Vector3 localDisp = transform.InverseTransformDirection(displacement);
            float pitch = Mathf.Clamp(-localDisp.z * 100f, -maxAngle, maxAngle);
            float roll = Mathf.Clamp(localDisp.x * 100f, -maxAngle, maxAngle);

            Quaternion deltaRot = Quaternion.Euler(pitch, 0f, roll);
            bone.localRotation = initialRot * deltaRot;
        }

        private Transform FindDeepChild(Transform parent, string childName)
        {
            foreach (Transform child in parent)
            {
                if (child.name.Equals(childName, System.StringComparison.OrdinalIgnoreCase))
                    return child;
                Transform found = FindDeepChild(child, childName);
                if (found != null) return found;
            }
            return null;
        }
    }
}
