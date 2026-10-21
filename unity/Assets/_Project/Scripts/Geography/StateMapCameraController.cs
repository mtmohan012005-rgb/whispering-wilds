using System;
using UnityEngine;

namespace WhisperingWilds.Geography
{
    /// <summary>
    /// Interactive camera controller for the Tamil Nadu state map scene (01_StateMap_TamilNadu).
    /// Provides smooth pan, zoom, bounds clamping, and reset controls via mouse, keyboard, or gamepad.
    ///
    /// Controls:
    /// - Pan: WASD, Arrow keys, or Mouse Drag (Right-click, Middle-click, or Left-drag on background)
    /// - Zoom: Mouse Scroll Wheel, Q / E, or Numpad +/-
    /// - Reset View: 'R' key or Home key
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public class StateMapCameraController : MonoBehaviour
    {
        [Header("Movement & Speed")]
        [Tooltip("Pan movement speed across the map surface.")]
        [SerializeField] private float panSpeed = 600f;

        [Tooltip("Mouse drag pan sensitivity.")]
        [SerializeField] private float mouseDragSensitivity = 1.2f;

        [Tooltip("Zoom sensitivity when scrolling.")]
        [SerializeField] private float zoomSpeed = 800f;

        [Tooltip("Damping factor for smooth movement.")]
        [SerializeField] private float smoothDampTime = 0.08f;

        [Header("Height / Zoom Limits")]
        [Tooltip("Minimum camera height / closest zoom (150 scene units).")]
        [SerializeField] private float minHeight = 150f;
        [Tooltip("Maximum camera height / state overview (2800 scene units).")]
        [SerializeField] private float maxHeight = 2800f;

        [Header("Map Extents / Clamping")]
        [SerializeField] private bool enableClamping = true;
        [SerializeField] private Vector2 mapCenter = new Vector2(0f, 0f);
        [SerializeField] private Vector2 mapExtents = new Vector2(1500f, 1800f);

        public float MinHeight => minHeight;
        public float MaxHeight => maxHeight;
        public Vector3 TargetPosition => _targetPosition;
        public Vector3 InitialPosition => _initialPosition;
        public bool IsClampingEnabled => enableClamping;

        public void SetTargetPositionForTesting(Vector3 pos)
        {
            _targetPosition = pos;
            ClampTargetPosition();
        }

        private Camera _camera;
        private Vector3 _targetPosition;
        private Vector3 _velocity = Vector3.zero;
        private Vector3 _initialPosition;
        private Quaternion _initialRotation;
        private Vector3 _lastMousePosition;
        private bool _isDragging = false;
        private bool _leftDragAllowed = false;

        private void Awake()
        {
            _camera = GetComponent<Camera>();
            _initialPosition = transform.position;
            _initialRotation = transform.rotation;
            _targetPosition = transform.position;
        }

        private void Start()
        {
            // Center bounds on the state map relief board if found
            var mapData = Resources.Load<TamilNaduMapData>("Geography/Generated/TamilNaduMapData");
            if (mapData != null && mapData.stateOutline != null)
            {
                Bounds b = mapData.stateOutline.bounds;
                if (mapData.coastline != null) b.Encapsulate(mapData.coastline.bounds);
                mapCenter = new Vector2(b.center.x, b.center.z);
                mapExtents = new Vector2(b.extents.x * 1.4f, b.extents.z * 1.4f);
            }
        }

        private void Update()
        {
            HandleKeyboardPan();
            HandleMouseDrag();
            HandleScrollZoom();
            HandleReset();

            if (enableClamping)
            {
                ClampTargetPosition();
            }

            transform.position = Vector3.SmoothDamp(transform.position, _targetPosition, ref _velocity, smoothDampTime);
        }

        private void HandleKeyboardPan()
        {
            float horizontal = Input.GetAxisRaw("Horizontal");
            float vertical = Input.GetAxisRaw("Vertical");

            if (Mathf.Abs(horizontal) > 0.01f || Mathf.Abs(vertical) > 0.01f)
            {
                // Speed scales proportionally with altitude so high overview moves comfortably
                float altitudeFactor = Mathf.Clamp(_targetPosition.y / 1000f, 0.4f, 2.5f);
                Vector3 moveDelta = new Vector3(horizontal, 0f, vertical).normalized * (panSpeed * altitudeFactor * Time.deltaTime);
                _targetPosition += moveDelta;
            }
        }

        private void HandleMouseDrag()
        {
            // Right-click or Middle-click drag always pans
            // Left-click pans when initiated on non-interactive background (not over markers or UI)
            if (Input.GetMouseButtonDown(0))
            {
                bool hitInteractive = false;
                if (UnityEngine.EventSystems.EventSystem.current != null &&
                    UnityEngine.EventSystems.EventSystem.current.IsPointerOverGameObject())
                {
                    hitInteractive = true;
                }
                else if (_camera != null)
                {
                    Ray ray = _camera.ScreenPointToRay(Input.mousePosition);
                    if (Physics.Raycast(ray, out RaycastHit hit, 5000f))
                    {
                        if (hit.collider.GetComponent<StateMapRegionMarker>() != null)
                        {
                            hitInteractive = true;
                        }
                    }
                }
                _leftDragAllowed = !hitInteractive;
            }

            if (Input.GetMouseButtonUp(0))
            {
                _leftDragAllowed = false;
            }

            bool dragRequested = Input.GetMouseButton(1) || Input.GetMouseButton(2) || (Input.GetMouseButton(0) && _leftDragAllowed);

            if (dragRequested)
            {
                if (!_isDragging)
                {
                    _isDragging = true;
                    _lastMousePosition = Input.mousePosition;
                }
                else
                {
                    Vector3 mouseDelta = Input.mousePosition - _lastMousePosition;
                    float altitudeFactor = Mathf.Clamp(_targetPosition.y / 1000f, 0.3f, 2.2f);
                    Vector3 worldDelta = new Vector3(-mouseDelta.x, 0f, -mouseDelta.y) * (mouseDragSensitivity * altitudeFactor);
                    _targetPosition += worldDelta;
                    _lastMousePosition = Input.mousePosition;
                }
            }
            else
            {
                _isDragging = false;
            }
        }

        private void HandleScrollZoom()
        {
            float scroll = Input.GetAxis("Mouse ScrollWheel");
            if (Mathf.Abs(scroll) > 0.001f)
            {
                float zoomDelta = -scroll * zoomSpeed * 10f;
                _targetPosition.y = Mathf.Clamp(_targetPosition.y + zoomDelta, minHeight, maxHeight);
            }

            // Keyboard zoom (Q to zoom in, E to zoom out)
            if (Input.GetKey(KeyCode.Q) || Input.GetKey(KeyCode.KeypadMinus))
            {
                _targetPosition.y = Mathf.Clamp(_targetPosition.y - zoomSpeed * Time.deltaTime, minHeight, maxHeight);
            }
            if (Input.GetKey(KeyCode.E) || Input.GetKey(KeyCode.KeypadPlus))
            {
                _targetPosition.y = Mathf.Clamp(_targetPosition.y + zoomSpeed * Time.deltaTime, minHeight, maxHeight);
            }
        }

        private void HandleReset()
        {
            if (Input.GetKeyDown(KeyCode.R) || Input.GetKeyDown(KeyCode.Home))
            {
                ResetView();
            }
        }

        public void ResetView()
        {
            _targetPosition = _initialPosition;
            _velocity = Vector3.zero;
        }

        public void FocusOnPosition(Vector3 worldPos, float targetAltitude = 450f)
        {
            _targetPosition = new Vector3(worldPos.x, targetAltitude, worldPos.z);
        }

        private void ClampTargetPosition()
        {
            float minX = mapCenter.x - mapExtents.x;
            float maxX = mapCenter.x + mapExtents.x;
            float minZ = mapCenter.y - mapExtents.y;
            float maxZ = mapCenter.y + mapExtents.y;

            _targetPosition.x = Mathf.Clamp(_targetPosition.x, minX, maxX);
            _targetPosition.z = Mathf.Clamp(_targetPosition.z, minZ, maxZ);
            _targetPosition.y = Mathf.Clamp(_targetPosition.y, minHeight, maxHeight);
        }

        public void SetInitialFrame(Vector3 pos, Quaternion rot)
        {
            _initialPosition = pos;
            _initialRotation = rot;
            _targetPosition = pos;
            transform.position = pos;
            transform.rotation = rot;
        }
    }
}
