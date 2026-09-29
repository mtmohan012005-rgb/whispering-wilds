using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using WhisperingWilds.Player;

namespace WhisperingWilds.Cameras
{
    /// <summary>
    /// Smooth third-person orbit camera with terrain/wall collision avoidance,
    /// shoulder framing, and gamepad/mouse sensitivity controls.
    /// </summary>
    [DisallowMultipleComponent]
    public class CameraController : MonoBehaviour
    {
        [Header("Target Tracking")]
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 targetOffset = new Vector3(0.35f, 1.4f, 0f); // Over-the-shoulder framing

        [Header("Distance & Collision")]
        [SerializeField] private float defaultDistance = 3.5f;
        [SerializeField] private float minDistance = 0.8f;
        [SerializeField] private float maxDistance = 6.0f;
        [SerializeField] private float collisionRadius = 0.2f;
        [SerializeField] private LayerMask collisionLayers = ~0;

        [Header("Rotation Limits")]
        [SerializeField] private float minPitch = -30f;
        [SerializeField] private float maxPitch = 70f;
        [SerializeField] private float rotationDamping = 15f;
        [SerializeField] private float zoomDamping = 10f;

        private float currentYaw;
        private float currentPitch = 15f;
        private float currentDistance;
        private float targetDistance;
        private PlayerInputHandler input;

        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
            if (target != null)
            {
                input = target.GetComponent<PlayerInputHandler>();
                currentYaw = target.eulerAngles.y;
            }
        }

        private void Start()
        {
            targetDistance = defaultDistance;
            currentDistance = defaultDistance;

            if (target != null)
            {
                input = target.GetComponent<PlayerInputHandler>();
                currentYaw = target.eulerAngles.y;
            }

            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        private void LateUpdate()
        {
            if (target == null) return;

            HandleCursorToggle();
            HandleOrbitInput();
            HandleZoomInput();
            UpdateCameraPosition();
        }

        private void HandleCursorToggle()
        {
#if ENABLE_INPUT_SYSTEM
            var kb = Keyboard.current;
            if (kb != null && kb.escapeKey.wasPressedThisFrame)
            {
                if (Cursor.lockState == CursorLockMode.Locked)
                {
                    Cursor.lockState = CursorLockMode.None;
                    Cursor.visible = true;
                }
                else
                {
                    Cursor.lockState = CursorLockMode.Locked;
                    Cursor.visible = false;
                }
            }
#endif
        }

        private void HandleOrbitInput()
        {
            if (input == null) return;

            Vector2 look = input.LookInput;
            currentYaw += look.x;
            currentPitch = Mathf.Clamp(currentPitch - look.y, minPitch, maxPitch);
        }

        private void HandleZoomInput()
        {
#if ENABLE_INPUT_SYSTEM
            var mouse = Mouse.current;
            if (mouse != null)
            {
                float scroll = mouse.scroll.ReadValue().y;
                if (Mathf.Abs(scroll) > 0.01f)
                {
                    targetDistance = Mathf.Clamp(targetDistance - Mathf.Sign(scroll) * 0.5f, minDistance, maxDistance);
                }
            }
#endif
        }

        private void UpdateCameraPosition()
        {
            // Calculate orbit center
            Vector3 focusPoint = target.position + targetOffset;

            // Calculate rotation
            Quaternion targetRotation = Quaternion.Euler(currentPitch, currentYaw, 0f);

            // Compute ideal position
            Vector3 desiredPosition = focusPoint - (targetRotation * Vector3.forward * targetDistance);

            // SphereCast collision pushout to prevent clipping through walls / terrain
            Vector3 rayDirection = (desiredPosition - focusPoint).normalized;
            float maxCastDistance = targetDistance;

            if (Physics.SphereCast(focusPoint, collisionRadius, rayDirection, out RaycastHit hit, maxCastDistance, collisionLayers, QueryTriggerInteraction.Ignore))
            {
                currentDistance = Mathf.Clamp(hit.distance - 0.05f, minDistance, targetDistance);
            }
            else
            {
                currentDistance = Mathf.Lerp(currentDistance, targetDistance, Time.deltaTime * zoomDamping);
            }

            Vector3 finalPosition = focusPoint - (targetRotation * Vector3.forward * currentDistance);

            transform.position = finalPosition;
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * rotationDamping);
        }
    }
}
