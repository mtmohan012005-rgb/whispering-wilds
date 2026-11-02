using System;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Ecology;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Real-time HUD overlay for the Wildlife Research Photography Viewfinder.
    /// Features optical framing brackets, target distance telemetry, behavior observation feedback,
    /// dynamic zoom levels, and real-time research scoring calculations.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeViewfinderHUD : MonoBehaviour
    {
        public static WildlifeViewfinderHUD Instance { get; private set; }

        [Header("UI Hierarchy")]
        [SerializeField] private GameObject viewfinderPanel;
        [SerializeField] private Image reticleCrosshair;
        [SerializeField] private Text speciesLabel;
        [SerializeField] private Text behaviorStateLabel;
        [SerializeField] private Text distanceTelemetryText;
        [SerializeField] private Text predictedScoreText;
        [SerializeField] private Text zoomMultiplierText;

        [Header("Optical Parameters")]
        public float currentZoom = 1.0f;
        public float minZoom = 1.0f;
        public float maxZoom = 5.0f;

        [Header("Ecology Integration")]
        public WildlifeEcologySystem ecologySystem;

        private Transform currentTarget;
        private string currentSpeciesId = "unknown";
        private WildlifeBehavior currentBehavior = WildlifeBehavior.Grazing;
        private bool isViewfinderActive = false;

        public bool IsActive => isViewfinderActive;

        public event Action<bool> OnViewfinderToggled;
        public event Action<PhotoSnapshotResult> OnPhotoCaptured;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            if (viewfinderPanel != null)
            {
                viewfinderPanel.SetActive(false);
            }
        }

        public void OpenViewfinder()
        {
            isViewfinderActive = true;
            if (viewfinderPanel != null)
            {
                viewfinderPanel.SetActive(true);
            }
            UpdateHUD();
            OnViewfinderToggled?.Invoke(true);
        }

        public void CloseViewfinder()
        {
            isViewfinderActive = false;
            if (viewfinderPanel != null)
            {
                viewfinderPanel.SetActive(false);
            }
            OnViewfinderToggled?.Invoke(false);
        }

        public void SetZoom(float zoom)
        {
            currentZoom = Mathf.Clamp(zoom, minZoom, maxZoom);
            if (zoomMultiplierText != null)
            {
                zoomMultiplierText.text = $"{currentZoom:F1}x";
            }
        }

        public void SetTarget(Transform target, string speciesId, WildlifeBehavior behavior)
        {
            currentTarget = target;
            currentSpeciesId = speciesId;
            currentBehavior = behavior;
            UpdateHUD();
        }

        public PhotoSnapshotResult TakeSnapshot(Camera playerCamera = null)
        {
            float distance = 15f;
            bool centered = true;
            bool isAction = currentBehavior == WildlifeBehavior.Fleeing || currentBehavior == WildlifeBehavior.Alert;

            if (currentTarget != null && playerCamera != null)
            {
                distance = Vector3.Distance(playerCamera.transform.position, currentTarget.position);
                Vector3 viewportPos = playerCamera.WorldToViewportPoint(currentTarget.position);
                centered = viewportPos.x >= 0.35f && viewportPos.x <= 0.65f &&
                           viewportPos.y >= 0.35f && viewportPos.y <= 0.65f &&
                           viewportPos.z > 0;
            }

            PhotoSnapshotResult result;
            if (ecologySystem != null)
            {
                result = ecologySystem.EvaluatePhotograph(currentSpeciesId, distance, centered, isAction);
            }
            else
            {
                int baseScore = centered ? 130 : 100;
                if (distance >= 5f && distance <= 20f) baseScore += 50;
                if (isAction) baseScore += 40;
                result = new PhotoSnapshotResult
                {
                    speciesId = currentSpeciesId,
                    distance = distance,
                    isCenteredInFrame = centered,
                    isActionShot = isAction,
                    calculatedResearchScore = baseScore
                };
            }

            OnPhotoCaptured?.Invoke(result);
            return result;
        }

        private void UpdateHUD()
        {
            if (speciesLabel != null)
            {
                speciesLabel.text = currentSpeciesId;
            }

            if (behaviorStateLabel != null)
            {
                behaviorStateLabel.text = currentBehavior.ToString().ToUpper();
            }

            if (distanceTelemetryText != null)
            {
                float dist = currentTarget != null ? Vector3.Distance(transform.position, currentTarget.position) : 0f;
                distanceTelemetryText.text = $"{dist:F1} m";
            }

            if (predictedScoreText != null)
            {
                predictedScoreText.text = currentBehavior == WildlifeBehavior.Alert ? "RESEARCH BONUS: ALERT" : "STANDARD RESEARCH";
            }
        }
    }
}
