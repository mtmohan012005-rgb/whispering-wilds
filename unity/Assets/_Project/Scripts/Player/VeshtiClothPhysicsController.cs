using System;
using UnityEngine;
using Unity.Mathematics;
using WhisperingWilds.World;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Secondary motion for the traditional Tamil attire: the veshti (dhoti) with its kasavu zari
    /// border and the shoulder thundu (angavastram).
    ///
    /// The previous version drove bones that do not exist in the production rig
    /// (Player_Veshti / Veshti_Hem / Spine1) and therefore fell back to the left shoulder, which
    /// made the garment swing from the neck. This version binds to the real rig:
    ///  - a verlet chain hangs from the waist (Hips) and produces the hem displacement,
    ///  - the hem lag is fed into <see cref="PlayerIKRiggedController"/> so the thighs carry the
    ///    skirt while the ankle stays planted,
    ///  - the pelvis counter rotates and the thundu lags over the shoulders,
    ///  - wind is taken from the regional climate simulation.
    /// Every offset is written as a delta on top of the animated pose so the animation stays the
    /// source of truth and nothing drifts over time.
    /// </summary>
    [DefaultExecutionOrder(-50)]
    [DisallowMultipleComponent]
    public class VeshtiClothPhysicsController : MonoBehaviour
    {
        private const int ChainNodes = 6;

        [Header("Rig Bindings")]
        [Tooltip("Waist anchor the veshti hangs from. Resolved from the rig when left empty.")]
        [SerializeField] private Transform waistAnchor;
        [SerializeField] private Transform hipsBone;
        [SerializeField] private Transform spineBone;
        [SerializeField] private Transform leftShoulderBone;
        [SerializeField] private Transform rightShoulderBone;

        [Header("Cotton Material Dynamics")]
        [Range(1f, 35f)] [SerializeField] private float stiffness = 14f;
        [Range(0.5f, 20f)] [SerializeField] private float damping = 6.5f;
        [Range(0.1f, 3f)] [SerializeField] private float weightMass = 0.85f;
        [Range(1f, 60f)] [SerializeField] private float maxHemSwayAngle = 24f;

        [Header("Kasavu Zari Border Momentum")]
        [Tooltip("Additional inertial momentum applied to the bottom border gold/copper kasavu lining.")]
        [Range(0f, 2f)] [SerializeField] private float kasavuBorderInertia = 0.65f;

        [Header("Aerodynamics & Wind")]
        [SerializeField] private bool respondToWeatherWind = true;
        [Range(0f, 2f)] [SerializeField] private float windTurbulenceMultiplier = 0.75f;
        [Range(0f, 1f)] [SerializeField] private float aerodynamicDragCoeff = 0.35f;
        public LayerMask groundLayerMask = ~0;

        [Header("Scalability")]
        [Tooltip("0 = Low, 1 = Medium, 2 = High, 3 = Ultra")]
        [SerializeField] private int scalabilityTier = 3;

        // Verlet chain state (preallocated).
        private readonly Vector3[] nodes = new Vector3[ChainNodes];
        private readonly Vector3[] previousNodes = new Vector3[ChainNodes];

        private Vector3 prevRootPosition;
        private Vector3 rootVelocity;
        private Vector3 rootAcceleration;
        private Vector3 hemSwingLocal;
        private Vector3 thunduSwingLocal;
        private Quaternion appliedHipsDelta = Quaternion.identity;
        private Quaternion appliedSpineDelta = Quaternion.identity;
        private Quaternion appliedLeftShoulderDelta = Quaternion.identity;
        private Quaternion appliedRightShoulderDelta = Quaternion.identity;

        private float chainLength = 0.86f;
        private float segmentLength;
        private bool chainInitialised;

        private Animator animator;
        private PlayerAppearanceManager appearanceManager;

        /// <summary>
        /// Hem displacement relative to the waist in character local space.
        /// Negative Z means the garment trails behind the body.
        /// </summary>
        public Vector3 HemSwingLocal => hemSwingLocal;

        /// <summary>True once the verlet chain is running against a resolved rig.</summary>
        public bool IsSimulating => chainInitialised && waistAnchor != null;

        private void Awake()
        {
            TryGetComponent(out appearanceManager);
            SyncScalabilityWithQualitySettings();
        }

        private void Start()
        {
            prevRootPosition = transform.position;
            ResolveRig();
            segmentLength = chainLength / (ChainNodes - 1);

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

        /// <summary>
        /// Resolves the real rig bones. The old names (Player_Veshti / Veshti_Hem / Spine1) never
        /// existed, which is why the hem used to be anchored to the shoulder.
        /// </summary>
        private void ResolveRig()
        {
            if (animator == null)
            {
                TryGetComponent(out animator);
                if (animator == null) animator = GetComponentInChildren<Animator>();
            }

            if (animator == null) return;

            Transform rigRoot = animator.transform;
            hipsBone = FindBone(rigRoot, "Hips");
            spineBone = FindBone(rigRoot, "Spine");
            leftShoulderBone = FindBone(rigRoot, "LeftShoulder");
            rightShoulderBone = FindBone(rigRoot, "RightShoulder");

            // The waist sits at the bottom of the pelvis, the hem hangs to just below the knee.
            waistAnchor = hipsBone != null ? hipsBone : spineBone;

            if (waistAnchor != null)
            {
                chainLength = 0.86f;
                segmentLength = chainLength / (ChainNodes - 1);
            }
        }

        private static Transform FindBone(Transform parent, string boneName)
        {
            if (parent == null) return null;
            for (int i = 0; i < parent.childCount; i++)
            {
                Transform child = parent.GetChild(i);
                if (string.Equals(child.name, boneName, StringComparison.Ordinal)) return child;
                Transform found = FindBone(child, boneName);
                if (found != null) return found;
            }
            return null;
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
            if (waistAnchor == null) return;

            // In Low scalability tier, simulate every other frame.
            if (scalabilityTier == 0 && (Time.frameCount & 1) != 0) return;

            Vector3 currentPosition = transform.position;
            Vector3 newVelocity = (currentPosition - prevRootPosition) / dt;
            rootAcceleration = (newVelocity - rootVelocity) / dt;
            rootVelocity = newVelocity;
            prevRootPosition = currentPosition;

            if (!chainInitialised)
            {
                InitialiseChain();
            }

            Vector3 wind = ComputeWind();
            SimulateChain(dt, wind);

            ApplyRigOffsets(dt);
        }

        /// <summary>
        /// Wind from the scene wide attire manager (which owns the regional wind zone) and, when
        /// no manager is present, from the regional climate simulation directly.
        /// </summary>
        private Vector3 ComputeWind()
        {
            Vector3 wind = Vector3.zero;
            if (!respondToWeatherWind) return wind;

            Characters.CharacterAttirePhysicsManager manager = Characters.CharacterAttirePhysicsManager.Instance;
            if (manager != null)
            {
                return manager.GlobalWind;
            }

            float windSpeedKmh = 12f;
            RegionalClimateSystem climate = RegionalClimateSystem.Instance;
            if (climate != null) windSpeedKmh = climate.CurrentWindSpeedKmh;

            WeatherSystem weather = WeatherSystem.Instance;
            bool heavyWeather = weather != null &&
                                (weather.CurrentWeather == WeatherType.Windy ||
                                 weather.CurrentWeather == WeatherType.Thunderstorm);
            if (heavyWeather) windSpeedKmh *= 1.8f;

            // Wind force scales with the square of the speed, as air drag does.
            float windSpeed = windSpeedKmh / 3.6f;
            float gust = 0.6f + 0.4f * Mathf.Sin(Time.time * 2.3f);
            float magnitude = windSpeed * windSpeed * 0.04f * gust * windTurbulenceMultiplier;

            Vector3 direction = transform.forward;
            if (weather != null && weather.CurrentWeather == WeatherType.Thunderstorm)
            {
                direction = Quaternion.Euler(0f, Mathf.Sin(Time.time * 0.7f) * 35f, 0f) * direction;
            }

            return direction * magnitude;
        }

        private void InitialiseChain()
        {
            Vector3 anchor = waistAnchor.position;
            for (int i = 0; i < ChainNodes; i++)
            {
                float t = i / (float)(ChainNodes - 1);
                nodes[i] = anchor + Vector3.down * (t * chainLength);
                previousNodes[i] = nodes[i];
            }
            chainInitialised = true;
        }

        /// <summary>
        /// Verlet integration of the hem chain with distance constraints and ground collision.
        /// The kasavu border adds inertia to the lower nodes, which is what makes the hem lag
        /// behind a stop and swing out on a turn.
        /// </summary>
        private void SimulateChain(float dt, Vector3 wind)
        {
            Vector3 anchor = waistAnchor.position;

            float mass = math.max(0.1f, weightMass);
            float drag = math.clamp(1f - aerodynamicDragCoeff * dt * 2f, 0f, 1f);
            float dampingFactor = math.clamp(1f - (damping / 60f), 0.5f, 0.995f);

            Vector3 inertialForce = -rootAcceleration * mass * (0.06f + kasavuBorderInertia * 0.04f);
            Vector3 acceleration = Vector3.down * 9.81f * mass * 0.25f + wind * 0.35f + inertialForce;

            float dtSq = dt * dt;

            for (int i = 1; i < ChainNodes; i++)
            {
                // The weighted border swings more than the upper fabric.
                float borderFactor = 1f + kasavuBorderInertia * 0.35f * (i / (float)(ChainNodes - 1));

                Vector3 current = nodes[i];
                Vector3 velocity = (current - previousNodes[i]) * dampingFactor * drag;
                previousNodes[i] = current;

                nodes[i] = current + velocity * borderFactor + acceleration * dtSq * borderFactor;
            }

            nodes[0] = anchor;

            int iterations = scalabilityTier >= 2 ? 4 : 2;
            float stiffnessFactor = math.clamp(stiffness / 14f, 0.25f, 2f);

            for (int iteration = 0; iteration < iterations; iteration++)
            {
                for (int i = 1; i < ChainNodes; i++)
                {
                    Vector3 delta = nodes[i] - nodes[i - 1];
                    float distance = delta.magnitude;
                    if (distance < 1e-5f) continue;

                    float correction = (distance - segmentLength) / distance * math.min(1f, stiffnessFactor);
                    if (i == 1)
                    {
                        // The waist anchor is pinned.
                        nodes[i] -= delta * correction;
                    }
                    else
                    {
                        nodes[i] -= delta * correction * 0.5f;
                        nodes[i - 1] += delta * correction * 0.5f;
                    }
                }
                nodes[0] = anchor;
            }

            // Ground collision for the lower nodes only.
            for (int i = ChainNodes - 2; i < ChainNodes; i++)
            {
                if (Physics.Raycast(nodes[i] + Vector3.up * 0.25f, Vector3.down, out RaycastHit hit, 0.7f,
                                     groundLayerMask, QueryTriggerInteraction.Ignore))
                {
                    float floor = hit.point.y + 0.03f;
                    if (nodes[i].y < floor)
                    {
                        nodes[i].y = floor;
                        previousNodes[i] = nodes[i];
                    }
                }
            }

            Vector3 restHem = anchor + Vector3.down * chainLength;
            Vector3 hemDelta = nodes[ChainNodes - 1] - restHem;
            float maxDisplacement = math.max(0.05f, maxHemSwayAngle * Mathf.Deg2Rad * chainLength);
            hemDelta = Vector3.ClampMagnitude(hemDelta, maxDisplacement);

            Vector3 localSwing = transform.InverseTransformDirection(hemDelta);
            float blend = math.saturate(dt * 12f);
            hemSwingLocal = Vector3.Lerp(hemSwingLocal, localSwing, blend);

            // The thundu is lighter than the veshti, so it reacts faster and further.
            thunduSwingLocal = Vector3.Lerp(thunduSwingLocal, localSwing * 1.35f, math.saturate(dt * 18f));
        }

        /// <summary>
        /// Writes the secondary motion onto the rig as deltas on top of the animated pose.
        /// The thighs are deliberately not touched here: they belong to the IK solver, which reads
        /// <see cref="HemSwingLocal"/> so the skirt follows while the ankle stays planted.
        /// </summary>
        private void ApplyRigOffsets(float dt)
        {
            float lateral = math.clamp(hemSwingLocal.x, -0.35f, 0.35f);
            float depth = math.clamp(hemSwingLocal.z, -0.35f, 0.35f);

            // The body leans against the garment lag.
            float hipsRoll = math.clamp(-lateral * 14f, -7f, 7f);
            float hipsPitch = math.clamp(-depth * 11f, -6f, 6f);
            ApplyDelta(hipsBone, Quaternion.Euler(hipsPitch, 0f, hipsRoll), ref appliedHipsDelta);

            // A small counter twist through the spine sells the momentum transfer.
            float spineTwist = math.clamp(-lateral * 9f, -5f, 5f);
            ApplyDelta(spineBone, Quaternion.Euler(0f, spineTwist, 0f), ref appliedSpineDelta);

            // The thundu drags over the shoulders.
            float thunduPitch = math.clamp(thunduSwingLocal.z * 12f, -6f, 6f);
            float thunduRoll = math.clamp(thunduSwingLocal.x * 10f, -5f, 5f);
            ApplyDelta(leftShoulderBone, Quaternion.Euler(thunduPitch, 0f, thunduRoll), ref appliedLeftShoulderDelta);
            ApplyDelta(rightShoulderBone, Quaternion.Euler(thunduPitch, 0f, -thunduRoll), ref appliedRightShoulderDelta);
        }

        /// <summary>
        /// Applies a local space rotation delta while removing the delta applied on the previous
        /// frame, so the animated pose is always the baseline and offsets never accumulate.
        /// </summary>
        private static void ApplyDelta(Transform bone, Quaternion delta, ref Quaternion appliedDelta)
        {
            if (bone == null) return;

            Quaternion baseRotation = bone.localRotation * Quaternion.Inverse(appliedDelta);
            bone.localRotation = baseRotation * delta;
            appliedDelta = delta;
        }
    }
}
