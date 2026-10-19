using UnityEngine;

[RequireComponent(typeof(Animator))]
public class PlayerIKRiggedController : MonoBehaviour
{
    private Animator animator;
    
    [Header("IK Grounding Settings")]
    public bool enableFootIK = true;
    [Range(0, 1f)] public float footWeight = 1.0f;
    public LayerMask groundLayerMask;
    public float raycastDistance = 1.5f;
    public float footOffset = 0.1f;

    void Start()
    {
        animator = GetComponent<Animator>();
    }

    void OnAnimatorIK(int layerIndex)
    {
        if (!animator || !enableFootIK) return;

        animator.SetIKPositionWeight(AvatarIKGoal.LeftFoot, footWeight);
        animator.SetIKPositionWeight(AvatarIKGoal.RightFoot, footWeight);
        animator.SetIKRotationWeight(AvatarIKGoal.LeftFoot, footWeight);
        animator.SetIKRotationWeight(AvatarIKGoal.RightFoot, footWeight);

        ProcessFootGrounding(AvatarIKGoal.LeftFoot);
        ProcessFootGrounding(AvatarIKGoal.RightFoot);
    }

    private void ProcessFootGrounding(AvatarIKGoal footGoal)
    {
        Vector3 footPosition = animator.GetIKPosition(footGoal);
        RaycastHit hit;

        Vector3 rayOrigin = footPosition + Vector3.up * 0.5f;
        if (Physics.Raycast(rayOrigin, Vector3.down, out hit, raycastDistance, groundLayerMask))
        {
            Vector3 targetFootPos = hit.point;
            targetFootPos.y += footOffset;
            animator.SetIKPosition(footGoal, targetFootPos);

            Quaternion surfaceRotation = Quaternion.FromToRotation(Vector3.up, hit.normal) * animator.GetIKRotation(footGoal);
            animator.SetIKRotation(footGoal, surfaceRotation);
        }
    }
}
