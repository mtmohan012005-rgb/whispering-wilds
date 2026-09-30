using UnityEngine;

namespace WhisperingWilds.Player
{
    /// <summary>
    /// Production-grade third-person CharacterController locomotion system.
    /// Handles camera-relative movement, smooth acceleration/deceleration,
    /// slope physics, jump buffering, and coyote time.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    [RequireComponent(typeof(PlayerInputHandler))]
    public class PlayerMovement : MonoBehaviour
    {
        [Header("Movement Speeds (m/s)")]
        [SerializeField] private float walkSpeed = 3.5f;
        [SerializeField] private float runSpeed = 6.0f;
        [SerializeField] private float sprintSpeed = 8.5f;
        [SerializeField] private float crouchSpeed = 2.0f;
        [SerializeField] private float rotationSmoothTime = 0.12f;
        [SerializeField] private float speedChangeRate = 10.0f;

        [Header("Jump & Gravity")]
        [SerializeField] private float jumpHeight = 1.4f;
        [SerializeField] private float gravity = -18.0f;
        [SerializeField] private float jumpTimeout = 0.15f;
        [SerializeField] private float fallTimeout = 0.15f;
        [SerializeField] private float coyoteTimeDuration = 0.12f;

        [Header("Grounding")]
        [SerializeField] private bool isGrounded = true;
        [Tooltip("Offset above the character feet pivot where the ground detection sphere is centered.")]
        [SerializeField] private float groundedOffset = 0.15f;
        [Tooltip("Radius of the ground detection sphere.")]
        [SerializeField] private float groundedRadius = 0.28f;
        [Tooltip("Explicit layer mask for ground surfaces (Default, Terrain, Environment). Excludes NPCs, triggers, and character.")]
        [SerializeField] private LayerMask groundLayers = 1; // Default layer by default

        // Runtime variables
        private CharacterController controller;
        private PlayerInputHandler input;
        private Transform mainCameraTransform;

        private float currentSpeed;
        private float animationBlend;
        private float targetRotation = 0.0f;
        private float rotationVelocity;
        private float verticalVelocity;
        private float terminalVelocity = 53.0f;

        private float jumpTimeoutDelta;
        private float fallTimeoutDelta;
        private float coyoteTimeDelta;

        // Cached once in Awake: LayerMask.GetMask performs string->layer resolution on every call,
        // so it must never be used from the per-frame ground check.
        private int cachedGroundMask;

        [Header("Animation")]
        [SerializeField] private Animator animator;

        [Header("Crouch Dimensions")]
        [SerializeField] private float standingHeight = 1.8f;
        [SerializeField] private float crouchHeight = 1.2f;
        [SerializeField] private Vector3 standingCenter = new Vector3(0f, 0.9f, 0f);
        [SerializeField] private Vector3 crouchCenter = new Vector3(0f, 0.6f, 0f);

        // Public getters for animation and audio systems
        public bool IsGrounded => isGrounded;
        public float CurrentSpeed => currentSpeed;
        public Vector3 Velocity => controller != null ? controller.velocity : Vector3.zero;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            input = GetComponent<PlayerInputHandler>();
            if (animator == null) animator = GetComponentInChildren<Animator>();

            if (Camera.main != null)
            {
                mainCameraTransform = Camera.main.transform;
            }

            // If groundLayers is unset or all layers (~0), default to a clean mask excluding character & triggers
            if (groundLayers == ~0 || groundLayers == 0)
            {
                groundLayers = ~(1 << gameObject.layer | LayerMask.GetMask("Ignore Raycast", "UI", "Water"));
            }

            RefreshGroundMask();
        }

        /// <summary>
        /// Rebuilds the cached ground-check mask. Excludes the character's own layer plus
        /// non-physical layers so NPCs, props and trigger volumes cannot fake grounding.
        /// Must be re-invoked if the object's layer changes at runtime.
        /// </summary>
        private void RefreshGroundMask()
        {
            cachedGroundMask = groundLayers.value & ~(1 << gameObject.layer | LayerMask.GetMask("Ignore Raycast", "UI", "Water"));
        }

        private void Start()
        {
            jumpTimeoutDelta = jumpTimeout;
            fallTimeoutDelta = fallTimeout;
            coyoteTimeDelta = 0.0f;
        }

        private void Update()
        {
            if (mainCameraTransform == null && Camera.main != null)
            {
                mainCameraTransform = Camera.main.transform;
            }

            CheckGrounded();
            HandleGravityAndJump();
            HandleMovement();
            UpdateCrouchDimensions();
            UpdateAnimator();
        }

        private void UpdateCrouchDimensions()
        {
            if (controller == null) return;
            bool crouching = input != null && input.IsCrouching;
            float targetH = crouching ? crouchHeight : standingHeight;
            Vector3 targetC = crouching ? crouchCenter : standingCenter;
            controller.height = Mathf.Lerp(controller.height, targetH, Time.deltaTime * 12f);
            controller.center = Vector3.Lerp(controller.center, targetC, Time.deltaTime * 12f);
        }

        private void UpdateAnimator()
        {
            if (animator == null) animator = GetComponentInChildren<Animator>();
            if (animator == null) return;
            animator.SetFloat("Speed", animationBlend);
            animator.SetBool("Grounded", isGrounded);
            animator.SetBool("FreeFall", verticalVelocity < -4.0f && !isGrounded);
            animator.SetBool("Crouching", input != null && input.IsCrouching);
        }

        private void CheckGrounded()
        {
            // Position sphere slightly above the character's feet (transform.position.y + groundedOffset)
            // so the probe extends through and slightly below the feet without floating above the waist.
            Vector3 spherePosition = new Vector3(transform.position.x, transform.position.y + groundedOffset, transform.position.z);
            
            // Mask out the character itself and non-physical layers to avoid false grounding on NPCs/props/triggers
            int mask = cachedGroundMask;

            bool sphereHit = Physics.CheckSphere(spherePosition, groundedRadius, mask, QueryTriggerInteraction.Ignore);
            isGrounded = (controller != null && controller.isGrounded) || sphereHit;

            if (isGrounded)
            {
                coyoteTimeDelta = coyoteTimeDuration;
            }
            else if (coyoteTimeDelta > 0.0f)
            {
                coyoteTimeDelta -= Time.deltaTime;
            }
        }

        private void OnDrawGizmosSelected()
        {
            Color transparentGreen = new Color(0.0f, 1.0f, 0.0f, 0.35f);
            Color transparentRed = new Color(1.0f, 0.0f, 0.0f, 0.35f);

            Gizmos.color = isGrounded ? transparentGreen : transparentRed;
            Vector3 spherePosition = new Vector3(transform.position.x, transform.position.y + groundedOffset, transform.position.z);
            Gizmos.DrawSphere(spherePosition, groundedRadius);
        }

        private void HandleMovement()
        {
            // Determine target speed based on input state
            float targetSpeed = runSpeed;

            if (input.IsCrouching)
            {
                targetSpeed = crouchSpeed;
            }
            else if (input.IsSprinting)
            {
                targetSpeed = sprintSpeed;
            }
            else if (input.MoveInput.magnitude < 0.6f && input.MoveInput != Vector2.zero)
            {
                targetSpeed = walkSpeed;
            }

            // Zero speed if no directional input
            if (input.MoveInput == Vector2.zero)
            {
                targetSpeed = 0.0f;
            }

            // Smoothly accelerate / decelerate
            float currentHorizontalSpeed = new Vector3(controller.velocity.x, 0.0f, controller.velocity.z).magnitude;
            float speedOffset = 0.1f;
            float inputMagnitude = input.MoveInput.magnitude;

            if (currentHorizontalSpeed < targetSpeed - speedOffset || currentHorizontalSpeed > targetSpeed + speedOffset)
            {
                currentSpeed = Mathf.Lerp(currentHorizontalSpeed, targetSpeed * inputMagnitude, Time.deltaTime * speedChangeRate);
                currentSpeed = Mathf.Round(currentSpeed * 1000f) / 1000f;
            }
            else
            {
                currentSpeed = targetSpeed;
            }

            animationBlend = Mathf.Lerp(animationBlend, targetSpeed, Time.deltaTime * speedChangeRate);
            if (animationBlend < 0.01f) animationBlend = 0f;

            // Compute camera-relative movement vector
            Vector3 inputDirection = new Vector3(input.MoveInput.x, 0.0f, input.MoveInput.y).normalized;

            if (input.MoveInput != Vector2.zero)
            {
                targetRotation = Mathf.Atan2(inputDirection.x, inputDirection.z) * Mathf.Rad2Deg + 
                                 (mainCameraTransform != null ? mainCameraTransform.eulerAngles.y : 0.0f);
                
                float rotation = Mathf.SmoothDampAngle(transform.eulerAngles.y, targetRotation, ref rotationVelocity, rotationSmoothTime);
                transform.rotation = Quaternion.Euler(0.0f, rotation, 0.0f);
            }

            Vector3 targetDirection = Quaternion.Euler(0.0f, targetRotation, 0.0f) * Vector3.forward;

            // Move the CharacterController
            controller.Move(targetDirection.normalized * (currentSpeed * Time.deltaTime) + 
                            new Vector3(0.0f, verticalVelocity, 0.0f) * Time.deltaTime);
        }

        private void HandleGravityAndJump()
        {
            if (isGrounded)
            {
                fallTimeoutDelta = fallTimeout;

                // Stop vertical velocity from dropping indefinitely when grounded
                if (verticalVelocity < 0.0f)
                {
                    verticalVelocity = -2f;
                }

                // Jump handling
                if (input.JumpTriggered && jumpTimeoutDelta <= 0.0f)
                {
                    // v = sqrt(h * -2 * g)
                    verticalVelocity = Mathf.Sqrt(jumpHeight * -2f * gravity);
                    input.ConsumeJump();
                    if (animator != null) animator.SetTrigger("Jump");
                }

                if (jumpTimeoutDelta >= 0.0f)
                {
                    jumpTimeoutDelta -= Time.deltaTime;
                }
            }
            else
            {
                jumpTimeoutDelta = jumpTimeout;

                // Coyote time jump allowance
                if (input.JumpTriggered && coyoteTimeDelta > 0.0f)
                {
                    verticalVelocity = Mathf.Sqrt(jumpHeight * -2f * gravity);
                    coyoteTimeDelta = 0.0f;
                    input.ConsumeJump();
                }

                if (fallTimeoutDelta >= 0.0f)
                {
                    fallTimeoutDelta -= Time.deltaTime;
                }
            }

            // Apply gravity over time if under terminal velocity
            if (verticalVelocity < terminalVelocity)
            {
                verticalVelocity += gravity * Time.deltaTime;
            }
        }
    }
}
