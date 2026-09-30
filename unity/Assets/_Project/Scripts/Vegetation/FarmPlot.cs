using System;
using UnityEngine;
using WhisperingWilds.World;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Vegetation
{
    /// <summary>
    /// Represents a dedicated agricultural plot or paddy bund bed.
    /// Manages localized soil moisture, irrigation, and acts as the interaction anchor
    /// for NPC farmers executing their NPCScheduleActivity.Working routines.
    /// </summary>
    [DisallowMultipleComponent]
    public class FarmPlot : MonoBehaviour
    {
        [Header("Plot Identification")]
        [SerializeField] private string plotId = "delta_plot_01";
        [SerializeField] private string regionId = "delta";

        [Header("Soil & Water Metrics")]
        [Range(0f, 1f)] [SerializeField] private float soilMoisture = 0.75f;
        [SerializeField] private bool hasActiveCrop = true;

        [Header("Crop Attachment")]
        [SerializeField] private CropInstance crop;
        [SerializeField] private Transform farmerWorkWaypoint;

        public string PlotId => plotId;
        public string RegionId => regionId;
        public float SoilMoisture => soilMoisture;
        public bool HasActiveCrop => hasActiveCrop && crop != null;
        public CropInstance Crop => crop;
        public Vector3 FarmerWorkPosition => farmerWorkWaypoint != null ? farmerWorkWaypoint.position : transform.position;

        private void Awake()
        {
            if (crop == null)
            {
                crop = GetComponentInChildren<CropInstance>();
            }
        }

        /// <summary>
        /// Daily agricultural progression step invoked by VegetationManager.
        /// </summary>
        public void AdvanceDailySimulation(float dailyMoistureLoss, float rainfallBonus, TamilNaduSeason season)
        {
            // Update soil moisture
            soilMoisture = Mathf.Clamp01(soilMoisture - dailyMoistureLoss + rainfallBonus);

            if (crop != null && hasActiveCrop)
            {
                // Advance crop growth by 1 day's unit (1.0 / totalDays)
                var def = PlantCatalog.GetDefinition(crop.PlantId);
                float dailyStep = 1.0f / Mathf.Max(1f, def.totalGrowthDays);
                crop.AdvanceGrowth(dailyStep, soilMoisture, season);
            }
        }

        public void WaterPlot(float amount = 0.5f)
        {
            soilMoisture = Mathf.Clamp01(soilMoisture + amount);
        }

        /// <summary>
        /// Invoked when an NPC Farmer approaches the plot during their morning/afternoon work slot.
        /// </summary>
        public void NPCPerformFarmTending()
        {
            // Replenish canal irrigation
            WaterPlot(0.35f);

            if (crop != null && crop.CurrentStage == GrowthStage.Harvestable)
            {
                // NPC harvests ready crop to farm stock
                crop.Interact(null);
                Debug.Log($"<color=#FFCC00><b>[NPC Farming]</b></color> Farmer harvested ready yield from {plotId}");
            }
        }
    }
}
