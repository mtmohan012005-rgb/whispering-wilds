using System;
using System.Collections.Generic;
using UnityEngine;
using Unity.Mathematics;

namespace WhisperingWilds.Characters
{
    /// <summary>
    /// Biomechanically accurate ragdoll for the production characters.
    ///
    /// The shipped prefabs carry no Rigidbody / Collider at all, so the previous implementation
    /// collected an empty list and could never ragdoll. This controller builds the ragdoll at
    /// runtime from the rig bones: every limb gets a Rigidbody with a capsule shaped after the
    /// bone, and the bones are linked with configurable joints. Body mass is distributed using
    /// standard human proportions and the whole thing is a strict state machine:
    /// Animated -> Ragdoll -> Recovering -> Animated.
    /// </summary>
    [DefaultExecutionOrder(100)]
    [DisallowMultipleComponent]
    public class CharacterRagdollController : MonoBehaviour
    {
        public enum RagdollState
        {
            Animated,
            Ragdoll,
            Recovering
        }

        [Header("State")]
        [SerializeField] private RagdollState state = RagdollState.Animated;
        [SerializeField] private float totalBodyMass = 72.0f; // Average adult male mass (kg)

        [Header("Auto Trigger")]
        [Tooltip("Ragdoll automatically on a hard landing.")]
        [SerializeField] private bool autoRagdollOnHardFall = true;
        [Tooltip("Vertical speed below which a landing triggers the ragdoll (m/s).")]
        [SerializeField] private float fallVelocityThreshold = -14f;
        [Tooltip("Seconds spent on the floor before the character gets back up.")]
        [SerializeField] private float autoRecoverDelay = 3.5f;
        [Tooltip("Maximum pelvis speed that still counts as 'at rest' for the recovery.")]
        [SerializeField] private float restSpeedThreshold = 0.6f;

        [Header("Joints")]
        [SerializeField] private float jointTravel = 0.01f;

        private struct BoneSpec
        {
            public string bone;
            public string parent;
            public float massFraction;
            public float radius;
            public float height;
            public int direction; // 0 = X, 1 = Y, 2 = Z (capsule axis)
            public Vector3 center;
            public float twistLimit;
            public float swingLimit;
        }

        /// <summary>
        /// Ragdoll skeleton definition. The capsule sizes follow the production rig offsets so the
        /// limbs do not interpenetrate at rest.
        /// </summary>
        private static readonly BoneSpec[] Specs =
        {
            new BoneSpec { bone = "Hips",         parent = null,           massFraction = 0.16f, radius = 0.13f, height = 0.18f, direction = 1, center = new Vector3(0f, -0.02f, 0f), twistLimit = 30f, swingLimit = 40f },
            new BoneSpec { bone = "Spine",        parent = "Hips",         massFraction = 0.14f, radius = 0.12f, height = 0.18f, direction = 1, center = new Vector3(0f, 0.06f, 0f),  twistLimit = 35f, swingLimit = 40f },
            new BoneSpec { bone = "Chest",        parent = "Spine",        massFraction = 0.13f, radius = 0.14f, height = 0.20f, direction = 1, center = new Vector3(0f, 0.03f, 0f),  twistLimit = 35f, swingLimit = 40f },
            new BoneSpec { bone = "Head",         parent = "Chest",        massFraction = 0.07f, radius = 0.11f, height = 0.22f, direction = 1, center = new Vector3(0f, 0.09f, 0f),  twistLimit = 45f, swingLimit = 55f },

            new BoneSpec { bone = "LeftUpperArm",  parent = "Chest",       massFraction = 0.028f, radius = 0.05f, height = 0.20f, direction = 0, center = new Vector3(0.10f, 0f, 0f), twistLimit = 60f, swingLimit = 80f },
            new BoneSpec { bone = "LeftLowerArm",  parent = "LeftUpperArm", massFraction = 0.022f, radius = 0.045f, height = 0.15f, direction = 0, center = new Vector3(0.075f, 0f, 0f), twistLimit = 60f, swingLimit = 80f },
            new BoneSpec { bone = "RightUpperArm", parent = "Chest",       massFraction = 0.028f, radius = 0.05f, height = 0.20f, direction = 0, center = new Vector3(-0.10f, 0f, 0f), twistLimit = 60f, swingLimit = 80f },
            new BoneSpec { bone = "RightLowerArm", parent = "RightUpperArm", massFraction = 0.022f, radius = 0.045f, height = 0.15f, direction = 0, center = new Vector3(-0.075f, 0f, 0f), twistLimit = 60f, swingLimit = 80f },

            new BoneSpec { bone = "LeftUpperLeg",  parent = "Hips",        massFraction = 0.083f, radius = 0.07f, height = 0.42f, direction = 1, center = new Vector3(0f, -0.21f, 0f), twistLimit = 45f, swingLimit = 70f },
            new BoneSpec { bone = "LeftLowerLeg",  parent = "LeftUpperLeg", massFraction = 0.037f, radius = 0.055f, height = 0.42f, direction = 1, center = new Vector3(0f, -0.21f, 0f), twistLimit = 45f, swingLimit = 70f },
            new BoneSpec { bone = "RightUpperLeg", parent = "Hips",        massFraction = 0.083f, radius = 0.07f, height = 0.42f, direction = 1, center = new Vector3(0f, -0.21f,  0f), twistLimit = 45f, swingLimit = 70f },
            new BoneSpec { bone = "RightLowerLeg", parent = "RightUpperLeg", massFraction = 0.037f, radius = 0.055f, height = 0.42f, direction = 1, center = new Vector3(0f, -0.21f, 0f), twistLimit = 45f, swingLimit = 70f },
        };

        private sealed class RagdollPart
        {
            public Transform bone;
            public Rigidbody body;
            public CapsuleCollider collider;
            public ConfigurableJoint joint;
            public Vector3 restLocalPosition;
            public Quaternion restLocalRotation;
        }

        private readonly List<RagdollPart> parts = new List<RagdollPart>();

        private Animator animator;
        private CharacterController characterController;
        private bool wasGrounded;
        private float ragdollTimer;
        private bool ragdollBuilt;

        public RagdollState State => state;
        public bool IsRagdoll => state == RagdollState.Ragdoll;
        public float TotalBodyMass => totalBodyMass;

        private void Awake()
        {
            TryGetComponent(out animator);
            if (animator == null) animator = GetComponentInChildren<Animator>();
            TryGetComponent(out characterController);

            wasGrounded = characterController != null && characterController.isGrounded;
        }

        private void Start()
        {
            BuildRagdoll();
        }

        private void OnDestroy()
        {
            DestroyRagdoll();
        }

        private void Update()
        {
            switch (state)
            {
                case RagdollState.Animated:
                    WatchForHardFall();
                    break;
                case RagdollState.Ragdoll:
                    TickRagdoll();
                    break;
            }
        }

        /// <summary>
        /// Triggers the ragdoll when the character lands hard enough to hurt.
        /// </summary>
        private void WatchForHardFall()
        {
            if (!autoRagdollOnHardFall || characterController == null) return;

            bool grounded = characterController.isGrounded;
            float verticalSpeed = characterController.velocity.y;

            if (!wasGrounded && grounded && verticalSpeed < fallVelocityThreshold)
            {
                EnableRagdoll(Vector3.down * Mathf.Abs(verticalSpeed) * 0.35f);
            }

            wasGrounded = grounded;
        }

        private void TickRagdoll()
        {
            ragdollTimer += Time.deltaTime;
            if (ragdollTimer < autoRecoverDelay) return;

            if (!IsAtRest()) return;

            DisableRagdoll();
        }

        private bool IsAtRest()
        {
            for (int i = 0; i < parts.Count; i++)
            {
                Rigidbody body = parts[i].body;
                if (body == null || body.isKinematic) continue;
                if (body.velocity.sqrMagnitude > restSpeedThreshold * restSpeedThreshold) return false;
                if (body.angularVelocity.sqrMagnitude > 1.2f) return false;
            }
            return true;
        }

        /// <summary>
        /// Creates the ragdoll bodies and joints from the rig. Safe to call more than once.
        /// </summary>
        private void BuildRagdoll()
        {
            if (ragdollBuilt || animator == null) return;

            Transform rigRoot = animator.transform;
            parts.Clear();

            for (int i = 0; i < Specs.Length; i++)
            {
                BoneSpec spec = Specs[i];
                Transform bone = FindBone(rigRoot, spec.bone);
                if (bone == null) continue;

                var body = bone.gameObject.AddComponent<Rigidbody>();
                body.isKinematic = true;
                body.useGravity = true;
                body.mass = math.max(0.1f, totalBodyMass * spec.massFraction);
                body.interpolation = RigidbodyInterpolation.Interpolate;
                body.angularDrag = 0.6f;
                body.linearDamping = 0.05f;
                body.maxAngularVelocity = 12f;
                body.collisionDetectionMode = CollisionDetectionMode.Discrete;

                var collider = bone.gameObject.AddComponent<CapsuleCollider>();
                collider.direction = spec.direction;
                collider.radius = spec.radius;
                collider.height = math.max(spec.height, spec.radius * 2f + 0.001f);
                collider.center = spec.center;
                collider.enabled = false;

                parts.Add(new RagdollPart
                {
                    bone = bone,
                    body = body,
                    collider = collider,
                    joint = null,
                    restLocalPosition = bone.localPosition,
                    restLocalRotation = bone.localRotation
                });
            }

            LinkJoints(rigRoot);
            ragdollBuilt = true;
        }

        /// <summary>
        /// Links every limb to its parent with a configurable joint anchored at the bone origin.
        /// </summary>
        private void LinkJoints(Transform rigRoot)
        {
            for (int i = 0; i < parts.Count; i++)
            {
                BoneSpec spec = Specs[i];
                if (string.IsNullOrEmpty(spec.parent)) continue;

                Transform parentBone = FindBone(rigRoot, spec.parent);
                RagdollPart parentPart = FindPart(spec.parent);
                if (parentBone == null || parentPart == null || parentPart.body == null) continue;

                Transform bone = parts[i].bone;
                var joint = bone.gameObject.AddComponent<ConfigurableJoint>();
                joint.connectedBody = parentPart.body;
                joint.autoConfigureConnectedAnchor = false;
                joint.anchor = Vector3.zero;
                joint.connectedAnchor = parentBone.InverseTransformPoint(bone.position);

                joint.xMotion = ConfigurableJointMotion.Limited;
                joint.yMotion = ConfigurableJointMotion.Limited;
                joint.zMotion = ConfigurableJointMotion.Limited;
                joint.linearLimit = new SoftJointLimit { limit = jointTravel };
                joint.linearLimitSpring = new SoftJointLimitSpring { spring = 400f, damper = 40f };

                joint.angularXMotion = ConfigurableJointMotion.Limited;
                joint.angularYMotion = ConfigurableJointMotion.Limited;
                joint.angularZMotion = ConfigurableJointMotion.Limited;
                joint.lowAngularXLimit = new SoftJointLimit { limit = spec.twistLimit };
                joint.highAngularXLimit = new SoftJointLimit { limit = spec.twistLimit };
                joint.angularYLimit = new SoftJointLimit { limit = spec.swingLimit };
                joint.angularZLimit = new SoftJointLimit { limit = spec.swingLimit };
                joint.angularXLimitSpring = new SoftJointLimitSpring { spring = 60f, damper = 8f };
                joint.angularYZLimitSpring = new SoftJointLimitSpring { spring = 60f, damper = 8f };

                joint.projectionMode = JointProjectionMode.PositionAndRotation;
                joint.projectionDistance = 0.15f;
                joint.projectionAngle = 20f;
                joint.enableCollision = false;

                Rigidbody body = parts[i].body;
                parts[i].joint = joint;
                SetJointActive(joint, false);
            }
        }

        /// <summary>
        /// A Joint is a Component and cannot be disabled through a bool. Freezing every motion axis
        /// releases the bone while keeping the joint in place, which is how the ragdoll is parked
        /// when the character is animated.
        /// </summary>
        private static void SetJointActive(ConfigurableJoint joint, bool active)
        {
            if (joint == null) return;

            joint.xMotion = active ? ConfigurableJointMotion.Limited : ConfigurableJointMotion.Free;
            joint.yMotion = active ? ConfigurableJointMotion.Limited : ConfigurableJointMotion.Free;
            joint.zMotion = active ? ConfigurableJointMotion.Limited : ConfigurableJointMotion.Free;
            joint.angularXMotion = active ? ConfigurableJointMotion.Limited : ConfigurableJointMotion.Free;
            joint.angularYMotion = active ? ConfigurableJointMotion.Limited : ConfigurableJointMotion.Free;
            joint.angularZMotion = active ? ConfigurableJointMotion.Limited : ConfigurableJointMotion.Free;
        }

        private RagdollPart FindPart(string boneName)
        {
            for (int i = 0; i < parts.Count; i++)
            {
                if (parts[i].bone != null && string.Equals(parts[i].bone.name, boneName, StringComparison.Ordinal))
                {
                    return parts[i];
                }
            }
            return default;
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

        /// <summary>
        /// Switches the character into physical simulation. The impact velocity is applied as a
        /// velocity change so the fall momentum is carried into the ragdoll.
        /// </summary>
        public void EnableRagdoll(Vector3 impactVelocity)
        {
            if (state == RagdollState.Ragdoll) return;
            if (!ragdollBuilt) BuildRagdoll();
            if (parts.Count == 0) return;

            state = RagdollState.Ragdoll;
            ragdollTimer = 0f;

            if (animator != null) animator.enabled = false;
            if (characterController != null) characterController.enabled = false;

            for (int i = 0; i < parts.Count; i++)
            {
                RagdollPart part = parts[i];
                if (part.collider != null) part.collider.enabled = true;
                SetJointActive(part.joint, true);
                if (part.body == null) continue;

                part.body.isKinematic = false;
                part.body.detectCollisions = true;
                part.body.linearVelocity = characterController != null ? characterController.velocity : Vector3.zero;
                part.body.angularVelocity = Vector3.zero;
                part.body.AddForce(impactVelocity, ForceMode.VelocityChange);
            }
        }

        /// <summary>
        /// Returns the character to animation: the ragdoll bodies are frozen, the rest pose is
        /// restored and the collider / animator are handed back.
        /// </summary>
        public void DisableRagdoll()
        {
            if (state != RagdollState.Ragdoll) return;

            state = RagdollState.Recovering;

            for (int i = 0; i < parts.Count; i++)
            {
                RagdollPart part = parts[i];
                SetJointActive(part.joint, false);
                if (part.collider != null) part.collider.enabled = false;
                if (part.body == null) continue;

                part.body.isKinematic = true;
                part.body.detectCollisions = false;
                part.body.linearVelocity = Vector3.zero;
                part.body.angularVelocity = Vector3.zero;

                if (part.bone != null)
                {
                    part.bone.localPosition = part.restLocalPosition;
                    part.bone.localRotation = part.restLocalRotation;
                }
            }

            if (animator != null) animator.enabled = true;
            if (characterController != null)
            {
                characterController.enabled = true;
                wasGrounded = characterController.isGrounded;
            }

            state = RagdollState.Animated;
            ragdollTimer = 0f;
        }

        /// <summary>Removes the runtime ragdoll bodies and joints.</summary>
        private void DestroyRagdoll()
        {
            for (int i = 0; i < parts.Count; i++)
            {
                RagdollPart part = parts[i];
                if (part.joint != null) Destroy(part.joint);
                if (part.collider != null) Destroy(part.collider);
                if (part.body != null) Destroy(part.body);
            }
            parts.Clear();
            ragdollBuilt = false;
        }
    }
}
