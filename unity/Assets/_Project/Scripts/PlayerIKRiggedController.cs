using System;
using UnityEngine;
using Unity.Mathematics;

/// <summary>
/// Hyper-realistic Inverse Kinematics (IK) controller for natural foot placement and pelvis adaptation
/// across uneven terrain (e.g. mangrove stilt roots, Tamil Nadu rocky hillocks, Nilgiri mountain boulders).
/// Leverages Unity.Mathematics and TryGetComponent protection for zero-allocation per-frame performance.
/// Scalable across Low-to-Ultra quality presets.
/// </summary>
[RequireComponent(typeof(Animator))]
[DisallowMultipleComponent]
public class PlayerIKRiggedController : MonoBehaviour
{
    private Animator animator;

    [Header("IK Grounding Settings")]
    public bool enableFootIK = true;
    [Range(0, 1f)] public float footWeight = 1.0f;
    public LayerMask groundLayerMask = ~0;
    public float raycastDistance = 1.6f;
    public float footOffset = 0.09f;

    [Header("Pelvis & Hips Adaptation")]
    [Tooltip("Adjust pelvis height so the leg on lower terrain can plant naturally without floating.")]
    public bool enablePelvisCompensation = true;
    [Range(0.1f, 1.0f)] public float maxPelvisDrop = 0.55f;
    [Range(1f, 30f)] public float pelvisDamping = 16f;
    [Range(1f, 30f)] public float footDamping = 20f;

    [Header("Ankle Rotation Limits")]
    [Range(10f, 60f)] public float maxAnkleAngle = 45f;

    [Header("Scalability & Performance")]
    [Tooltip("Scalability preset: 0 = Low, 1 = Medium, 2 = High, 3 = Ultra")]
    [SerializeField] private int scalabilityTier = 3;

    // Runtime smoothed values (zero-allocation)
    private Vector3 currentLeftFootPos;
    private Vector3 currentRightFootPos;
    private Quaternion currentLeftFootRot = Quaternion.identity;
    private Quaternion currentRightFootRot = Quaternion.identity;
    private float currentPelvisOffset = 0f;
    private float lastLeftHitDist = 0f;
    private float lastRightHitDist = 0f;
    private bool hasLeftHit = false;
    private bool hasRightHit = false;

    private void Awake()
    {
        TryGetComponent(out animator);
        SyncScalabilityWithQualitySettings();
    }

    private void Start()
    {
        if (animator == null)
        {
            TryGetComponent(out animator);
        }

        SyncScalabilityWithQualitySettings();
    }

    /// <summary>
    /// Dynamically adjusts IK fidelity to preserve target frame pacing across Low-to-Ultra presets.
    /// </summary>
    public void SyncScalabilityWithQualitySettings()
    {
        int qLevel = QualitySettings.GetQualityLevel();
        scalabilityTier = math.clamp(qLevel, 0, 3);
    }

    private void OnAnimatorIK(int layerIndex)
    {
        if (!enableFootIK || animator == null) return;

        bool computePelvis = enablePelvisCompensation && scalabilityTier >= 1;

        float weight = footWeight;
        animator.SetIKPositionWeight(AvatarIKGoal.LeftFoot, weight);
        animator.SetIKPositionWeight(AvatarIKGoal.RightFoot, weight);
        animator.SetIKRotationWeight(AvatarIKGoal.LeftFoot, weight);
        animator.SetIKRotationWeight(AvatarIKGoal.RightFoot, weight);

        float dt = Time.deltaTime;
        if (dt <= 0f) dt = 0.0166f;

        // 1. Process left and right feet grounding
        ProcessFootGrounding(AvatarIKGoal.LeftFoot, ref currentLeftFootPos, ref currentLeftFootRot, ref lastLeftHitDist, ref hasLeftHit, dt);
        ProcessFootGrounding(AvatarIKGoal.RightFoot, ref currentRightFootPos, ref currentRightFootRot, ref lastRightHitDist, ref hasRightHit, dt);

        // 2. Dynamic Pelvis / Hips Height Compensation for uneven terrain
        if (computePelvis && (hasLeftHit || hasRightHit))
        {
            float targetPelvisOffset = 0f;
            if (hasLeftHit && hasRightHit)
            {
                // If one foot sits lower than the other on a rock/root, drop hips towards the lower ground
                float lowerOffset = math.min(lastLeftHitDist, lastRightHitDist);
                targetPelvisOffset = math.clamp(lowerOffset, -maxPelvisDrop, 0f);
            }
            else if (hasLeftHit)
            {
                targetPelvisOffset = math.clamp(lastLeftHitDist, -maxPelvisDrop, 0f);
            }
            else
            {
                targetPelvisOffset = math.clamp(lastRightHitDist, -maxPelvisDrop, 0f);
            }

            currentPelvisOffset = math.lerp(currentPelvisOffset, targetPelvisOffset, math.saturate(dt * pelvisDamping));
            Vector3 pelvisPos = animator.bodyPosition + new Vector3(0f, currentPelvisOffset, 0f);
            animator.bodyPosition = pelvisPos;
        }
    }

    private void ProcessFootGrounding(AvatarIKGoal footGoal, ref Vector3 currentPos, ref Quaternion currentRot, ref float hitDeltaY, ref bool hitValid, float dt)
    {
        Vector3 animatedFootPos = animator.GetIKPosition(footGoal);
        Quaternion animatedFootRot = animator.GetIKRotation(footGoal);

        // Raycast origin raised by 0.55m to account for step-overs and roots
        Vector3 rayOrigin = animatedFootPos + Vector3.up * 0.55f;
        float checkDist = raycastDistance;

        hitValid = Physics.Raycast(rayOrigin, Vector3.down, out RaycastHit hit, checkDist, groundLayerMask, QueryTriggerInteraction.Ignore);

        if (hitValid)
        {
            // Target ground contact point
            Vector3 targetPos = hit.point + Vector3.up * footOffset;
            hitDeltaY = targetPos.y - animatedFootPos.y;

            // Smoothly damp foot position
            if (currentPos == Vector3.zero) currentPos = targetPos;
            currentPos = Vector3.Lerp(currentPos, targetPos, math.saturate(dt * footDamping));
            animator.SetIKPosition(footGoal, currentPos);

            // Align foot rotation with terrain normal (mangroves, mountain rocks)
            Vector3 groundNormal = hit.normal;
            float angle = Vector3.Angle(Vector3.up, groundNormal);

            if (angle <= maxAnkleAngle && scalabilityTier >= 1)
            {
                Quaternion surfaceRot = Quaternion.FromToRotation(Vector3.up, groundNormal) * animatedFootRot;
                if (currentRot == Quaternion.identity) currentRot = surfaceRot;
                currentRot = Quaternion.Slerp(currentRot, surfaceRot, math.saturate(dt * footDamping));
                animator.SetIKRotation(footGoal, currentRot);
            }
            else
            {
                animator.SetIKRotation(footGoal, animatedFootRot);
            }
        }
        else
        {
            hitDeltaY = 0f;
            currentPos = animatedFootPos;
            currentRot = animatedFootRot;
            animator.SetIKPosition(footGoal, animatedFootPos);
            animator.SetIKRotation(footGoal, animatedFootRot);
        }
    }
}

namespace WhisperingWilds.Player
{
    // Namespace alias so code referencing WhisperingWilds.Player.PlayerIKRiggedController resolves seamlessly
    public class PlayerIKRiggedController : global::PlayerIKRiggedController { }
}
