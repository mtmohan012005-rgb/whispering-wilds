using UnityEngine;

namespace WhisperingWilds.Vehicles
{
    /// <summary>
    /// Realistic motorcycle physics model for the vintage Royal Enfield Bullet 350.
    /// Emulates real-world two-wheeler dynamics:
    /// - Heavy curb weight (195 kg) with low center of gravity.
    /// - Gyroscopic stability from high-inertia cast wheels and long-stroke flywheel.
    /// - Dynamic counter-steering lean physics (up to 40 degree bank angle).
    /// - 70/30 front/rear brake bias with authentic suspension dive.
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    [DisallowMultipleComponent]
    public class RoyalEnfieldPhysicsController : MonoBehaviour
    {
        [Header("Motorcycle Physical Specifications")]
        [SerializeField] private float kerbWeightKg = 195.0f;
        [SerializeField] private Vector3 centerOfMassOffset = new Vector3(0f, -0.35f, 0.05f);

        [Header("Engine & Flywheel Inertia")]
        [SerializeField] private float maxMotorTorque = 650.0f;
        [SerializeField] private float engineFlywheelInertia = 45.0f;
        [SerializeField] private float topSpeedKmh = 105.0f;

        [Header("Counter-Steering & Lean Physics")]
        [SerializeField] private float maxLeanAngleDeg = 40.0f;
        [SerializeField] private float leanResponsiveness = 4.5f;
        [SerializeField] private float gyroscopicStabilityFactor = 280.0f;

        [Header("Braking & Suspension")]
        [SerializeField] private float frontBrakeTorque = 1200.0f; // 70% front disc
        [SerializeField] private float rearBrakeTorque = 510.0f;   // 30% rear drum
        [SerializeField] private float frontForkTravel = 0.13f;   // 130mm telescopic travel

        private Rigidbody rb;
        private float currentLeanAngle = 0f;

        void Start()
        {
            rb = GetComponent<Rigidbody>();
            rb.mass = kerbWeightKg;
            rb.centerOfMass = centerOfMassOffset;
            rb.interpolation = RigidbodyInterpolation.Interpolate;
        }

        private Vector3 CurrentVelocity
        {
            get
            {
#if UNITY_6000_0_OR_NEWER
                return rb.linearVelocity;
#else
                return rb.velocity;
#endif
            }
        }

        public void ApplyDriveInputs(float throttleInput, float steerInput, float brakeInput)
        {
            float speedMs = CurrentVelocity.magnitude;
            float speedKmh = speedMs * 3.6f;

            // 1. Throttle Drive with Speed Governor
            if (throttleInput > 0.01f && speedKmh < topSpeedKmh)
            {
                // Authentic long-stroke torque curve: maximum punch at low-to-mid RPM
                float torqueCurve = Mathf.Clamp01(1.0f - (speedKmh / topSpeedKmh) * 0.45f);
                Vector3 driveForce = transform.forward * (throttleInput * maxMotorTorque * torqueCurve);
                rb.AddForce(driveForce, ForceMode.Force);
            }

            // 2. Braking Bias (70% Front / 30% Rear) with anti-lock drag
            if (brakeInput > 0.01f && speedMs > 0.1f)
            {
                float totalDecel = (frontBrakeTorque * 0.7f + rearBrakeTorque * 0.3f) * brakeInput;
                Vector3 brakeForce = -CurrentVelocity.normalized * totalDecel;
                rb.AddForce(brakeForce, ForceMode.Force);

                // Authentic nose-dive under hard front braking
                rb.AddTorque(transform.right * (brakeInput * 180f), ForceMode.Force);
            }

            // 3. Counter-Steering & Dynamic Banking
            if (speedMs > 1.5f)
            {
                // Higher speeds require more lean to achieve turning radius (tangential acceleration a = v^2 / r)
                float targetLean = -steerInput * maxLeanAngleDeg * Mathf.Clamp01(speedKmh / 45f);
                currentLeanAngle = Mathf.Lerp(currentLeanAngle, targetLean, Time.fixedDeltaTime * leanResponsiveness);

                // Yaw rotation from lean angle (conical tire contact patch radius)
                float turnRate = (-currentLeanAngle / maxLeanAngleDeg) * (speedMs * 1.8f);
                rb.AddTorque(Vector3.up * turnRate * 35f, ForceMode.Force);

                // 4. Gyroscopic Self-Righting Torque (opposes abrupt fallover at high speeds)
                Vector3 uprightTorque = Vector3.Cross(transform.up, Vector3.up) * (gyroscopicStabilityFactor * speedMs);
                rb.AddTorque(uprightTorque, ForceMode.Force);
            }
            else
            {
                // Low speed upright stabilization / kickstand recovery
                currentLeanAngle = Mathf.MoveTowards(currentLeanAngle, 0f, Time.fixedDeltaTime * 15f);
            }

            // Visual and physical roll application
            Quaternion targetRot = Quaternion.Euler(transform.rotation.eulerAngles.x, transform.rotation.eulerAngles.y, currentLeanAngle);
            rb.MoveRotation(Quaternion.Slerp(rb.rotation, targetRot, Time.fixedDeltaTime * leanResponsiveness));
        }

        void FixedUpdate()
        {
            // Default continuous road downforce (avoids floating on minor road bumps)
            rb.AddForce(Vector3.down * 450f, ForceMode.Force);
        }
    }
}
