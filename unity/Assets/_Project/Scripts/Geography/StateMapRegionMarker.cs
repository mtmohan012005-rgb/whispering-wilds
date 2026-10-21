using System;
using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.Geography
{
    /// <summary>
    /// Interactive 3D marker placed on cultural region points on the Tamil Nadu state map.
    /// Supports mouse hover, click selection, tooltips, and status visualization.
    /// </summary>
    [RequireComponent(typeof(SphereCollider))]
    public class StateMapRegionMarker : MonoBehaviour
    {
        [Header("Region Data")]
        public string regionId;
        public string englishName;
        public string tamilName;
        public string sceneName;
        public bool isUnlocked = true;
        public double latitude;
        public double longitude;

        [Header("Visuals")]
        [SerializeField] private float hoverScaleMultiplier = 1.35f;
        private Vector3 _originalScale;
        private MeshRenderer _renderer;
        private Color _baseColor;
        private bool _isHovered = false;

        private void Awake()
        {
            _originalScale = transform.localScale;
            _renderer = GetComponent<MeshRenderer>();
            if (_renderer != null && _renderer.sharedMaterial != null)
            {
                _baseColor = _renderer.sharedMaterial.color;
            }

            // Ensure collider is enabled and appropriately sized
            var col = GetComponent<SphereCollider>();
            if (col != null)
            {
                col.isTrigger = true;
                if (col.radius < 5f) col.radius = 12f; // Generous click target for state scale
            }
        }

        private void Start()
        {
            // Authoritatively evaluate unlock status
            if (!string.IsNullOrEmpty(regionId))
            {
                isUnlocked = RegionUnlocks.IsUnlocked(regionId);
            }
        }

        private void OnMouseEnter()
        {
            _isHovered = true;
            transform.localScale = _originalScale * hoverScaleMultiplier;

            if (StateMapHUDController.Instance != null)
            {
                StateMapHUDController.Instance.OnMarkerHoverEnter(this);
            }
        }

        private void OnMouseExit()
        {
            _isHovered = false;
            transform.localScale = _originalScale;

            if (StateMapHUDController.Instance != null)
            {
                StateMapHUDController.Instance.OnMarkerHoverExit(this);
            }
        }

        private void OnMouseDown()
        {
            SelectMarker();
        }

        public void SelectMarker()
        {
            if (StateMapHUDController.Instance != null)
            {
                StateMapHUDController.Instance.SelectRegion(this);
            }
            else
            {
                Debug.Log($"[StateMapRegionMarker] Selected: {englishName} ({regionId})");
            }
        }
    }
}
