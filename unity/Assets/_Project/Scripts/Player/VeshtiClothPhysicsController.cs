using System;
using UnityEngine;
using Unity.Mathematics;
using WhisperingWilds.World;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Advanced procedural secondary motion and cloth physics controller for traditional Tamil attire:
    /// the cotton veshti (dhoti) and shoulder thundu (angavastram/kasavu).
    /// Simulates starched cotton inertia, weighted hem (zari border) momentum, aerodynamic drag,
    /// dynamic weight distribution, and WeatherSystem wind gust interaction.
    /// Uses Unity.Mathematics and TryGetComponent protection for zero-allocation performance
    /// across Low-to-Ultra scalability presets.
    /// </summary>
    [DisallowMultipleComponent]
    public class VeshtiClothPhysicsController : MonoBehaviour
    {
        [Header("Attire Mesh / Bone Targets")]
        [SerializeField] private Transform veshtiHemBone;
        [SerializeField] private Transform thunduFrontTipBone;
        [SerializeField] private Transform thunduBackTipBone;

        [Header("Cotton Material Dynamics")]
        [Range(1f, 35f)] [SerializeField] private float stiffness = 14f;
        [Range(0.5f, 20f)] [SerializeField] private float damping = 6.5f;
        [Range(0.1f, 3f)] [SerializeField] private float weightMass = 0.85f;
        [SerializeField] private float maxHemSwayAngle = 24f;

        [Header("Kasavu Zari Border Momentum")]
        [Tooltip("Additional inertial momentum applied to the bottom border gold/copper kasavu lining.")]
        [Range(0f, 2f)] [SerializeField] private float kasavuBorderInertia = 0.65f;

        [Header("Aerodynamics & Wind")]
        [SerializeField] private bool respondToWeatherWind = true;
        [Range(0f, 2f)] [SerializeField] private float windTurbulenceMultiplier = 0.75f;
        [Range(0f, 1f)] [SerializeField] private float aerodynamicDragCoeff = 0.35f;

        [Header("Scalability")]
        [SerializeField] private int scalabilityTier = 3;

        // Dynamics state tracking (zero-allocation)
        private Vector3 prevRootPosition;
        private Vector3 rootVelocity;
        private Vector3 rootAcceleration;
        private Vector3 currentHemDisplacement;
        private Vector3 hemVelocity;
        private Quaternion initialHemLocalRot = Quaternion.identity;
        private Quaternion initialThunduFrontLocalRot = Quaternion.identity;
        private Quaternion initialThunduBackLocalRot = Quaternion.identity;

        private PlayerAppearanceManager appearanceManager;

        private void Awake()
        {
            TryGetComponent(out appearanceManager);
            SyncScalabilityWithQualitySettings();
        }

        private void Start()
        {
            prevRootPosition = transform.position;

            if (veshtiHemBone != null) initialHemLocalRot = veshtiHemBone.localRotation;
            if (thunduFrontTipBone != null) initialThunduFrontLocalRot = thunduFrontTipBone.localRotation;
            if (thunduBackTipBone != null) initialThunduBackLocalRot = thunduBackTipBone.localRotation;

            AutoDetectBonesIfUnset();

            if (appearanceManager == null)
            {
                TryGetComponent(out appearanceManager);
            }

            if (appearanceManager != null)
            {
                appearanceManager.OnOutfitChanged += OnOutfitChanged;
                ApplyAttirePreset(appearanceManager.CurrentOutfit);
            }

            SyncScalabilityWithQualitySettings();
        }

        private void OnDestroy()
        {
            if (appearanceManager != null)
            {
                appearanceManager.OnOutfitChanged -= OnOutfitChanged;
            }
        }

        public void SyncScalabilityWithQualitySettings()
        {
            scalabilityTier = math.clamp(QualitySettings.GetQualityLevel(), 0, 3);
        }

        private void AutoDetectBonesIfUnset()
        {
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

            if (thunduBackTipBone == null)
            {
                thunduBackTipBone = FindDeepChild(transform, "Thundu_Back")
                                 ?? FindDeepChild(transform, "RightShoulder");
                if (thunduBackTipBone != null) initialThunduBackLocalRot = thunduBackTipBone.localRotation;
            }
        }

        private void OnOutfitChanged(RegionalOutfitType outfit)
        {
            ApplyAttirePreset(outfit);
        }

        /// <summary>
        /// Adjusts cloth physical properties (stiffness, mass, damping, kasavu weight)
        /// to authentically match regional Tamil fabrics.
        /// </summary>
        public void ApplyAttirePreset(RegionalOutfitType outfit)
        {
            switch (outfit)
            {
                case RegionalOutfitType.EverydayChennai:
                    // Starched light cotton
                    stiffness = 14f;
                    damping = 6.5f;
                    weightMass = 0.85f;
                    kasavuBorderInertia = 0.5f;
                    break;
                case RegionalOutfitType.CauveryVillage:
                    // Tucked working dhoti with higher resistance and tighter drape
                    stiffness = 18f;
                    damping = 8.5f;
                    weightMass = 0.75f;
                    kasavuBorderInertia = 0.3f;
                    break;
                case RegionalOutfitType.ThanjavurFestival:
                    // Heavy ceremonial silk pattu veshti with dense metallic gold kasavu border
                    stiffness = 11f;
                    damping = 5.0f;
                    weightMass = 1.30f;
                    kasavuBorderInertia = 1.25f;
                    break;
                case RegionalOutfitType.PichavaramFisher:
                    // High-tied dhoti for water/mangroves
                    stiffness = 20f;
                    damping = 9.0f;
                    weightMass = 0.70f;
                    kasavuBorderInertia = 0.2f;
                    break;
                case RegionalOutfitType.NilgiriColdWeather:
                    // Thick woolen weave shawl / heavy thermal drape
                    stiffness = 16f;
                    damping = 7.5f;
                    weightMass = 1.50f;
                    kasavuBorderInertia = 0.6f;
                    break;
            }
        }

        private void LateUpdate()
        {
            float dt = Time.deltaTime;
            if (dt <= 0f || dt > 0.1f) return;

            // In Low scalability tier, skip every other frame or clamp calculation
            if (scalabilityTier == 0 && (Time.frameCount % 2 != 0)) return;

            // 1. Calculate locomotion acceleration forces
            Vector3 currentPos = transform.position;
            Vector3 newVelocity = (currentPos - prevRootPosition) / dt;
            rootAcceleration = (newVelocity - rootVelocity) / dt;
            rootVelocity = newVelocity;
            prevRootPosition = currentPos;

            // 2. Aerodynamic Drag Opposing Velocity: F_drag = -0.5 * C_d * v * |v|
            Vector3 aerodynamicDrag = Vector3.zero;
            float speed = rootVelocity.magnitude;
            if (speed > 0.05f)
            {
                aerodynamicDrag = -rootVelocity.normalized * (0.5f * aerodynamicDragCoeff * speed * speed);
            }

            // 3. Environmental wind from WeatherSystem
            Vector3 environmentalWind = Vector3.zero;
            if (respondToWeatherWind && WeatherSystem.Instance != null)
            {
                bool heavyWeather = WeatherSystem.Instance.CurrentWeather == WeatherType.Windy || 
                                    WeatherSystem.Instance.CurrentWeather == WeatherType.Thunderstorm;
                float windSpeed = heavyWeather ? 13.5f : 4.5f;
                float gust = math.sin(Time.time * 2.3f) * 0.4f + 0.6f;
                environmentalWind = transform.forward * (-windSpeed * 0.15f * gust * windTurbulenceMultiplier);
            }

            // 4. Kasavu border weighted inertial force: F_inertial = -m * a * (1 + kasavuInertia)
            float totalEffectiveMass = weightMass * (1f + kasavuBorderInertia * 0.35f);
            Vector3 inertialForce = -rootAcceleration * totalEffectiveMass * 0.085f;
            Vector3 externalForce = inertialForce + aerodynamicDrag + environmentalWind;

            // 5. Spring-damper integration: a = (F - k*x - c*v) / m
            Vector3 springForce = -stiffness * currentHemDisplacement;
            Vector3 dampingForce = -damping * hemVelocity;
            Vector3 netHemAccel = (springForce + dampingForce + externalForce) / math.max(0.1f, totalEffectiveMass);

            hemVelocity += netHemAccel * dt;
            currentHemDisplacement += hemVelocity * dt;

            // Clamp max drape sway to prevent garment distortion
            currentHemDisplacement = Vector3.ClampMagnitude(currentHemDisplacement, 0.38f);

            // 6. Apply secondary rotational offsets to cloth bones
            ApplyDisplacementToBone(veshtiHemBone, initialHemLocalRot, currentHemDisplacement, maxHemSwayAngle);

            if (scalabilityTier >= 1)
            {
                ApplyDisplacementToBone(thunduFrontTipBone, initialThunduFrontLocalRot, currentHemDisplacement * 1.35f, maxHemSwayAngle * 1.4f);
            }

            if (scalabilityTier >= 2)
            {
                ApplyDisplacementToBone(thunduBackTipBone, initialThunduBackLocalRot, currentHemDisplacement * 1.15f, maxHemSwayAngle * 1.2f);
            }
        }

        private void ApplyDisplacementToBone(Transform bone, Quaternion initialRot, Vector3 displacement, float maxAngle)
        {
            if (bone == null) return;

            Vector3 localDisp = transform.InverseTransformDirection(displacement);
            float pitch = math.clamp(-localDisp.z * 105f, -maxAngle, maxAngle);
            float roll = math.clamp(localDisp.x * 105f, -maxAngle, maxAngle);

            Quaternion deltaRot = Quaternion.Euler(pitch, 0f, roll);
            bone.localRotation = initialRot * deltaRot;
        }

        private Transform FindDeepChild(Transform parent, string childName)
        {
            for (int i = 0; i < parent.childCount; i++)
            {
                Transform child = parent.GetChild(i);
                if (child.name.Equals(childName, StringComparison.OrdinalIgnoreCase))
                    return child;
                Transform found = FindDeepChild(child, childName);
                if (found != null) return found;
            }
            return null;
        }
    }
}
