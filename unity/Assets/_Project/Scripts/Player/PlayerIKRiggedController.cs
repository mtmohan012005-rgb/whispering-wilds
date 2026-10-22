using System;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;
using UnityEngine;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Analytic foot IK for the procedural production rig.
    ///
    /// The characters ship a Generic avatar (no humanoid IK pass), so the humanoid
    /// Animator.SetIKPosition path never ran and the feet were never anchored. This solver
    /// works directly on the bone transforms instead:
    ///  - analytic two-bone solve (hip -> knee -> ankle) with a forward knee pole,
    ///  - terrain probing with foot planting so the stance foot does not slide,
    ///  - pelvis lowering / lateral shift so both legs can reach uneven terrain,
    ///  - ankle alignment to the ground normal clamped to a human ankle range,
    ///  - veshti hem swing fed in by <see cref="VeshtiClothPhysicsController"/>.
    ///
    /// All state is preallocated in Awake: the per-frame path is allocation free.
    /// </summary>
    [DefaultExecutionOrder(50)]
    [DisallowMultipleComponent]
    public class PlayerIKRiggedController : MonoBehaviour
    {
        private const int LeftLeg = 0;
        private const int RightLeg = 1;
        private const int LegCount = 2;

        [Header("IK Grounding")]
        public bool enableFootIK = true;
        [Range(0f, 1f)] public float footWeight = 1.0f;
        public LayerMask groundLayerMask = ~0;
        [Tooltip("Height above the animated ankle where the ground probe starts.")]
        public float probeHeight = 0.6f;
        public float raycastDistance = 1.8f;
        [Tooltip("Height of the ankle joint above the ground contact point.")]
        public float footOffset = 0.12f;

        [Header("Foot Planting")]
        public bool enableFootLock = true;
        [Tooltip("Distance between the animated ankle and the contact point for the foot to count as grounded.")]
        public float plantSnapDistance = 0.32f;
        [Tooltip("Maximum ankle speed relative to the body for the foot to count as planted.")]
        public float plantSpeedThreshold = 0.55f;
        [Tooltip("Maximum distance the ankle may drift from the planted position before the lock releases.")]
        public float maxPlantDrift = 0.55f;

        [Header("Pelvis Adaptation")]
        public bool enablePelvisCompensation = true;
        [Range(0.05f, 0.8f)] public float maxPelvisDrop = 0.4f;
        [Range(0f, 0.25f)] public float maxPelvisShift = 0.1f;
        [Range(1f, 30f)] public float pelvisDamping = 14f;

        [Header("Ankle Limits")]
        [Range(5f, 60f)] public float maxAnkleAngle = 40f;

        [Header("Cloth Coupling")]
        [Tooltip("How strongly the veshti hem swing rotates the thighs.")]
        [Range(0f, 1f)] public float clothSwingInfluence = 0.6f;

        [Header("Scalability")]
        [Tooltip("0 = Low, 1 = Medium, 2 = High, 3 = Ultra")]
        [SerializeField] private int scalabilityTier = 3;

        private struct LegState
        {
            public Transform upper;
            public Transform lower;
            public Transform foot;
            public Vector3 target;
            public Vector3 targetNormal;
            public Vector3 plantedPosition;
            public Vector3 previousAnkle;
            public bool planted;
            public bool hasGround;
        }

        private readonly LegState[] legs = new LegState[LegCount];

        private NativeArray<FootIkInput> ikInputs;
        private NativeArray<FootIkOutput> ikOutputs;
        private bool ikBuffersReady;

        private Transform hipsBone;
        private Animator animator;
        private CharacterController characterController;
        private VeshtiClothPhysicsController cloth;

        private float appliedPelvisDrop;
        private float appliedPelvisShift;
        private float currentPelvisDrop;
        private float currentPelvisShift;
        private bool rigResolved;

        /// <summary>True when the solver produced a valid pose for both legs this frame.</summary>
        public bool IsSolved { get; private set; }

        /// <summary>The world space position the left ankle is being driven towards.</summary>
        public Vector3 LeftFootTarget => legs[LeftLeg].target;

        /// <summary>The world space position the right ankle is being driven towards.</summary>
        public Vector3 RightFootTarget => legs[RightLeg].target;

        /// <summary>True while a foot holds its ground contact instead of sliding.</summary>
        public bool IsFootPlanted(int legIndex)
        {
            if (legIndex < 0 || legIndex >= LegCount) return false;
            return legs[legIndex].planted;
        }

        private void Awake()
        {
            SyncScalabilityWithQualitySettings();
            ResolveReferences();
            EnsureIkBuffers();
        }

        private void Start()
        {
            ResolveReferences();
        }

        private void OnEnable()
        {
            ResolveReferences();
            EnsureIkBuffers();
        }

        private void OnDisable()
        {
            DisposeIkBuffers();
        }

        private void OnDestroy()
        {
            DisposeIkBuffers();
        }

        /// <summary>
        /// Adapts IK fidelity to the active quality preset so the solver never becomes the
        /// frame budget bottleneck on low end hardware.
        /// </summary>
        public void SyncScalabilityWithQualitySettings()
        {
            scalabilityTier = math.clamp(QualitySettings.GetQualityLevel(), 0, 3);
        }

        /// <summary>Applies the walkable layer mask discovered by the movement controller.</summary>
        public void SetGroundMask(LayerMask mask)
        {
            groundLayerMask = mask;
        }

        private void ResolveReferences()
        {
            if (animator == null)
            {
                TryGetComponent(out animator);
                if (animator == null) animator = GetComponentInChildren<Animator>();
            }

            if (characterController == null)
            {
                TryGetComponent(out characterController);
            }

            if (cloth == null)
            {
                TryGetComponent(out cloth);
            }

            if (animator == null) return;

            Transform rigRoot = animator.transform;
            hipsBone = FindBone(rigRoot, "Hips");

            legs[LeftLeg].upper = FindBone(rigRoot, "LeftUpperLeg");
            legs[LeftLeg].lower = FindBone(rigRoot, "LeftLowerLeg");
            legs[LeftLeg].foot = FindBone(rigRoot, "LeftFoot");

            legs[RightLeg].upper = FindBone(rigRoot, "RightUpperLeg");
            legs[RightLeg].lower = FindBone(rigRoot, "RightLowerLeg");
            legs[RightLeg].foot = FindBone(rigRoot, "RightFoot");

            for (int i = 0; i < LegCount; i++)
            {
                legs[i].previousAnkle = legs[i].foot != null ? legs[i].foot.position : Vector3.zero;
            }

            rigResolved = hipsBone != null
                          && legs[LeftLeg].upper != null && legs[LeftLeg].lower != null && legs[LeftLeg].foot != null
                          && legs[RightLeg].upper != null && legs[RightLeg].lower != null && legs[RightLeg].foot != null;
        }

        private static Transform FindBone(Transform parent, string boneName)
        {
            if (parent == null) return null;
            for (int i = 0; i < parent.childCount; i++)
            {
                Transform child = parent.GetChild(i);
                if (string.Equals(child.name, boneName, StringComparison.Ordinal))
                {
                    return child;
                }
                Transform found = FindBone(child, boneName);
                if (found != null) return found;
            }
            return null;
        }

        private void LateUpdate()
        {
            IsSolved = false;

            if (!enableFootIK || !rigResolved || animator == null || !animator.isActiveAndEnabled)
            {
                return;
            }

            float dt = Time.deltaTime;
            if (dt <= 0f) return;

            // Low preset: solve every other frame, the pose is corrected by the damping anyway.
            if (scalabilityTier == 0 && (Time.frameCount & 1) != 0) return;

            bool grounded = characterController != null ? characterController.isGrounded : true;
            Vector3 bodyVelocity = characterController != null ? characterController.velocity : Vector3.zero;

            ResolveFootTarget(LeftLeg, dt, grounded, bodyVelocity);
            ResolveFootTarget(RightLeg, dt, grounded, bodyVelocity);

            if (enablePelvisCompensation && scalabilityTier >= 1)
            {
                UpdatePelvis(dt, grounded);
            }

            SolveLegs();

            IsSolved = true;
        }

        /// <summary>
        /// Probes the terrain under the animated ankle and decides whether the foot is planted.
        /// The plant test compares the ankle speed relative to the body: a stance foot travels
        /// with the body (relative speed ~ 0) while a swing foot moves fast relative to it.
        /// </summary>
        private void ResolveFootTarget(int index, float dt, bool grounded, Vector3 bodyVelocity)
        {
            LegState leg = legs[index];
            if (leg.foot == null) return;

            Vector3 ankle = leg.foot.position;
            Vector3 ankleVelocity = dt > 0f ? (ankle - leg.previousAnkle) / dt : Vector3.zero;
            leg.previousAnkle = ankle;

            Vector3 relativeVelocity = ankleVelocity - bodyVelocity;

            bool hasGround = Physics.Raycast(
                ankle + Vector3.up * probeHeight, Vector3.down, out RaycastHit hit,
                raycastDistance, groundLayerMask, QueryTriggerInteraction.Ignore);

            leg.hasGround = hasGround;

            if (!hasGround)
            {
                leg.planted = false;
                leg.target = ankle;
                leg.targetNormal = Vector3.up;
                legs[index] = leg;
                return;
            }

            Vector3 groundTarget = hit.point + Vector3.up * footOffset;
            Vector3 normal = hit.normal;

            bool nearGround = (ankle - groundTarget).sqrMagnitude < plantSnapDistance * plantSnapDistance;
            bool slow = relativeVelocity.sqrMagnitude < plantSpeedThreshold * plantSpeedThreshold;

            if (enableFootLock && grounded && nearGround && slow)
            {
                if (!leg.planted)
                {
                    leg.planted = true;
                    leg.plantedPosition = new Vector3(ankle.x, groundTarget.y, ankle.z);
                }
                else
                {
                    Vector3 planted = leg.plantedPosition;
                    // Never sink into rising ground, but follow it upwards.
                    if (Physics.Raycast(planted + Vector3.up * 0.4f, Vector3.down, out RaycastHit lockHit,
                                         0.9f, groundLayerMask, QueryTriggerInteraction.Ignore))
                    {
                        float minimumY = lockHit.point.y + footOffset;
                        if (minimumY > planted.y) planted.y = minimumY;
                    }

                    if ((ankle - planted).sqrMagnitude > maxPlantDrift * maxPlantDrift)
                    {
                        leg.planted = false;
                        leg.target = groundTarget;
                        leg.targetNormal = normal;
                        legs[index] = leg;
                        return;
                    }

                    leg.plantedPosition = planted;
                }

                leg.target = leg.plantedPosition;
                leg.targetNormal = normal;
            }
            else
            {
                leg.planted = false;
                leg.target = groundTarget;
                leg.targetNormal = normal;
            }

            legs[index] = leg;
        }

        /// <summary>
        /// Lowers and shifts the pelvis so the shorter leg can reach its contact point instead of
        /// over extending (which is what produces the classic floating / snapping feet).
        /// </summary>
        private void UpdatePelvis(float dt, bool grounded)
        {
            float drop = 0f;
            float shift = 0f;

            if (grounded)
            {
                for (int i = 0; i < LegCount; i++)
                {
                    LegState leg = legs[i];
                    if (!leg.hasGround || leg.upper == null || leg.lower == null || leg.foot == null) continue;

                    float upperLength = Vector3.Distance(leg.upper.position, leg.lower.position);
                    float lowerLength = Vector3.Distance(leg.lower.position, leg.foot.position);
                    float reach = (upperLength + lowerLength) * 0.99f;

                    Vector3 toTarget = leg.target - leg.upper.position;
                    float horizontal = new Vector2(toTarget.x, toTarget.z).magnitude;
                    float maxVertical = Mathf.Sqrt(Mathf.Max(0f, reach * reach - horizontal * horizontal));
                    float verticalGap = -toTarget.y;
                    float overshoot = verticalGap - maxVertical;

                    if (overshoot > drop) drop = overshoot;
                }

                // Shift the pelvis towards the lower foot so the stance side stays relaxed.
                float leftY = legs[LeftLeg].target.y;
                float rightY = legs[RightLeg].target.y;
                shift = math.clamp((rightY - leftY) * 0.3f, -maxPelvisShift, maxPelvisShift);

                drop = math.clamp(drop, 0f, maxPelvisDrop);
            }

            float blend = math.saturate(dt * pelvisDamping);
            currentPelvisDrop = math.lerp(currentPelvisDrop, drop, blend);
            currentPelvisShift = math.lerp(currentPelvisShift, shift, blend);
            ApplyPelvisOffset(currentPelvisDrop, currentPelvisShift);
        }

        /// <summary>
        /// Writes the pelvis offset on top of the animated pose. The previously applied offset is
        /// removed first so the animation stays the source of truth and the offset never drifts.
        /// </summary>
        private void ApplyPelvisOffset(float drop, float shift)
        {
            if (hipsBone == null) return;

            Vector3 local = hipsBone.localPosition;
            local.y -= appliedPelvisDrop;
            local.x -= appliedPelvisShift;
            local.y -= drop;
            local.x += shift;
            hipsBone.localPosition = local;

            appliedPelvisDrop = drop;
            appliedPelvisShift = shift;
        }

        private void EnsureIkBuffers()
        {
            if (ikBuffersReady) return;

            ikInputs = new NativeArray<FootIkInput>(LegCount, Allocator.Persistent, NativeArrayOptions.ClearMemory);
            ikOutputs = new NativeArray<FootIkOutput>(LegCount, Allocator.Persistent, NativeArrayOptions.ClearMemory);
            ikBuffersReady = true;
        }

        private void DisposeIkBuffers()
        {
            if (!ikBuffersReady) return;

            ikInputs.Dispose();
            ikOutputs.Dispose();
            ikBuffersReady = false;
        }

        /// <summary>
        /// Gathers both legs, solves them in parallel on the job workers, then applies the
        /// resulting rotations. Only the gather/apply touches Transforms; the maths runs off the
        /// main thread and the buffers are reused every frame.
        /// </summary>
        private void SolveLegs()
        {
            EnsureIkBuffers();

            for (int i = 0; i < LegCount; i++)
            {
                ikInputs[i] = BuildLegInput(i);
            }

            new FootIkSolverJob
            {
                inputs = ikInputs,
                outputs = ikOutputs
            }.Schedule(LegCount, 1).Complete();

            for (int i = 0; i < LegCount; i++)
            {
                ApplyLegOutput(i, ikOutputs[i]);
            }
        }

        private FootIkInput BuildLegInput(int index)
        {
            LegState leg = legs[index];

            float weight = math.clamp(footWeight, 0f, 1f);
            if (!leg.hasGround) weight = 0f;

            float3 hip = leg.upper.position;
            float3 knee = leg.lower.position;
            float3 ankle = leg.foot.position;

            return new FootIkInput
            {
                hip = hip,
                target = leg.target,
                targetNormal = leg.targetNormal,
                forward = transform.forward,
                footUp = leg.foot.rotation * Vector3.up,
                upperLength = math.distance(hip, knee),
                lowerLength = math.distance(knee, ankle),
                weight = weight,
                clothPitch = ClothThighPitch(),
                maxAnkleAngle = maxAnkleAngle
            };
        }

        private void ApplyLegOutput(int index, FootIkOutput output)
        {
            if (output.valid == 0 || output.weight <= 0.001f) return;

            LegState leg = legs[index];
            float weight = math.clamp(output.weight, 0f, 1f);

            leg.upper.rotation = Quaternion.Slerp(leg.upper.rotation, ToQuaternion(output.thighRotation), weight);
            leg.lower.rotation = Quaternion.Slerp(leg.lower.rotation, ToQuaternion(output.shinRotation), weight);

            Vector3 currentUp = leg.foot.rotation * Vector3.up;
            Vector3 desiredUp = new Vector3(output.footUp.x, output.footUp.y, output.footUp.z);
            Quaternion desiredFoot = Quaternion.FromToRotation(currentUp, desiredUp) * leg.foot.rotation;
            leg.foot.rotation = Quaternion.Slerp(leg.foot.rotation, desiredFoot, weight);
        }

        private static Quaternion ToQuaternion(quaternion value)
        {
            return new Quaternion(value.value.x, value.value.y, value.value.z, value.value.w);
        }

        /// <summary>
        /// Converts the veshti hem displacement into a thigh pitch so the garment visibly lags
        /// behind the body motion instead of being rigidly welded to the waist.
        /// </summary>
        private float ClothThighPitch()
        {
            if (cloth == null || clothSwingInfluence <= 0f) return 0f;

            Vector3 swing = cloth.HemSwingLocal;
            if (swing.sqrMagnitude < 1e-6f) return 0f;

            // Negative Z means the hem trails behind the waist, which pitches the thigh back.
            return math.clamp(swing.z * 70f * clothSwingInfluence, -18f, 18f);
        }
    }
}
