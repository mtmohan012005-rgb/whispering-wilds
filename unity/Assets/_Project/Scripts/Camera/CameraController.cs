using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif
using WhisperingWilds.Player;
using WhisperingWilds.UI;

namespace WhisperingWilds.Cameras
{
    /// <summary>
    /// Smooth third-person orbit camera with terrain/wall collision avoidance,
    /// shoulder framing, FOV syncing, camera smoothing, and screen shake support.
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

        [Header("Shake & Effects")]
        [SerializeField] private bool screenShakeEnabled = true;

        private float currentYaw;
        private float currentPitch = 15f;
        private float currentDistance;
        private float targetDistance;
        private PlayerInputHandler input;

        private float shakeTimer = 0f;
        private float shakeIntensity = 0f;
        private Vector3 currentShakeOffset = Vector3.zero;

        public bool ScreenShakeEnabled =>
            SettingsMenuController.Instance != null ? SettingsMenuController.Instance.screenShakeEnabled : screenShakeEnabled;

        public float RotationDamping
        {
            get => SettingsMenuController.Instance != null ? SettingsMenuController.Instance.cameraSmoothing : rotationDamping;
            set => rotationDamping = value;
        }

        public static CameraController EnsureActiveCameraBound(Transform playerTransform = null)
        {
            if (Camera.main == null) return null;
            var ctrl = Camera.main.GetComponent<CameraController>();
            if (ctrl == null) ctrl = Camera.main.gameObject.AddComponent<CameraController>();
            if (playerTransform != null) ctrl.SetTarget(playerTransform);
            else if (ctrl.target == null)
            {
                var p = GameObject.FindWithTag("Player");
                if (p != null) ctrl.SetTarget(p.transform);
            }
            return ctrl;
        }

        public void SetTarget(Transform newTarget)
        {
            target = newTarget;
            if (target != null)
            {
                input = target.GetComponent<PlayerInputHandler>();
                currentYaw = target.eulerAngles.y;
            }

            ApplySettingsFov();
        }

        public void ApplySettingsFov()
        {
            var settings = SettingsMenuController.Instance;
            if (settings == null) return;

            var cam = GetComponent<Camera>();
            if (cam != null) cam.fieldOfView = settings.fov;
        }

        public void TriggerShake(float intensity, float duration)
        {
            if (!ScreenShakeEnabled)
            {
                shakeTimer = 0f;
                currentShakeOffset = Vector3.zero;
                return;
            }

            shakeIntensity = intensity;
            shakeTimer = duration;
        }

        private void Start()
        {
            targetDistance = defaultDistance;
            currentDistance = defaultDistance;

            if (target == null)
            {
                var playerObj = GameObject.FindWithTag("Player");
                if (playerObj != null) SetTarget(playerObj.transform);
            }
            else
            {
                input = target.GetComponent<PlayerInputHandler>();
                currentYaw = target.eulerAngles.y;
                ApplySettingsFov();
            }

            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        private void LateUpdate()
        {
            if (target == null)
            {
                var playerObj = GameObject.FindWithTag("Player");
                if (playerObj != null) SetTarget(playerObj.transform);
                else return;
            }

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

            // Screen Shake calculation
            if (shakeTimer > 0f && ScreenShakeEnabled)
            {
                shakeTimer -= Time.deltaTime;
                currentShakeOffset = Random.insideUnitSphere * shakeIntensity;
            }
            else
            {
                currentShakeOffset = Vector3.zero;
            }

            transform.position = finalPosition + currentShakeOffset;
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, Time.deltaTime * RotationDamping);
        }
    }
}
