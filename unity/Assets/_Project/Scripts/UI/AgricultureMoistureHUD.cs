using System;
using UnityEngine;
using UnityEngine.UI;
using WhisperingWilds.Loops;

namespace WhisperingWilds.UI
{
    /// <summary>
    /// Runtime HUD widget for field agriculture and crop irrigation monitoring.
    /// Tracks soil moisture levels, growth progress, and displays active drought warnings
    /// when water levels fall below the critical threshold (30%).
    /// </summary>
    [DisallowMultipleComponent]
    public class AgricultureMoistureHUD : MonoBehaviour
    {
        public static AgricultureMoistureHUD Instance { get; private set; }

        [Header("UI References")]
        [SerializeField] private GameObject hudRoot;
        [SerializeField] private Text cropNameText;
        [SerializeField] private Text climateText;
        [SerializeField] private Text moistureValueText;
        [SerializeField] private Image moistureFillBar;
        [SerializeField] private Image growthProgressBar;
        [SerializeField] private GameObject droughtWarningIndicator;

        [Header("Agriculture Reference")]
        public AgricultureSystem agricultureSystem;

        public const float DroughtThreshold = 30f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            if (agricultureSystem == null)
            {
                agricultureSystem = FindFirstObjectByType<AgricultureSystem>();
            }

            if (agricultureSystem != null)
            {
                agricultureSystem.OnCropStateChanged += OnCropStateChanged;
            }

            RefreshHUD();
        }

        private void OnDestroy()
        {
            if (agricultureSystem != null)
            {
                agricultureSystem.OnCropStateChanged -= OnCropStateChanged;
            }
        }

        public void BindSystem(AgricultureSystem system)
        {
            if (agricultureSystem != null)
            {
                agricultureSystem.OnCropStateChanged -= OnCropStateChanged;
            }

            agricultureSystem = system;

            if (agricultureSystem != null)
            {
                agricultureSystem.OnCropStateChanged += OnCropStateChanged;
            }

            RefreshHUD();
        }

        private void OnCropStateChanged(string cropId, CropState state)
        {
            RefreshHUD();
        }

        public void RefreshHUD()
        {
            if (agricultureSystem == null || agricultureSystem.activeCrop == null)
            {
                if (hudRoot != null) hudRoot.SetActive(false);
                return;
            }

            if (hudRoot != null) hudRoot.SetActive(true);

            var crop = agricultureSystem.activeCrop;

            if (cropNameText != null)
            {
                cropNameText.text = crop.cropId;
            }

            if (climateText != null)
            {
                climateText.text = crop.targetClimate.ToString();
            }

            float moistureRatio = Mathf.Clamp01(crop.currentWaterLevel / Mathf.Max(1f, crop.requiredWaterLevel));

            if (moistureValueText != null)
            {
                moistureValueText.text = $"{crop.currentWaterLevel:F0}%";
            }

            if (moistureFillBar != null)
            {
                moistureFillBar.fillAmount = moistureRatio;
                moistureFillBar.color = crop.currentWaterLevel < DroughtThreshold ? Color.red : Color.cyan;
            }

            if (growthProgressBar != null)
            {
                growthProgressBar.fillAmount = Mathf.Clamp01(crop.growthProgress / 100f);
            }

            if (droughtWarningIndicator != null)
            {
                bool isDrought = crop.currentWaterLevel < DroughtThreshold && crop.currentState != CropState.Withered;
                droughtWarningIndicator.SetActive(isDrought);
            }
        }
    }
}
