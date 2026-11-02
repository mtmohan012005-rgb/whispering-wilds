using System;
using UnityEngine;

namespace WhisperingWilds.Loops
{
    public enum RegionClimate
    {
        CauveryDelta, // Water-dependent paddy
        Nilgiris,     // High-altitude tea / mist
        Coastal       // Palm sap / tropical
    }

    public enum CropState
    {
        Seeded,
        Sprouting,
        Maturing,
        ReadyForHarvest,
        Withered
    }

    [System.Serializable]
    public class CropInstance
    {
        public string cropId;
        public RegionClimate targetClimate;
        public CropState currentState = CropState.Seeded;
        public float growthProgress = 0f; // 0.0 to 100.0
        public float requiredWaterLevel = 50f;
        public float currentWaterLevel = 50f;
    }

    /// <summary>
    /// Regional Loops: Agriculture and farming system.
    /// Manages crop growth cycles tailored to regional environments (Cauvery Delta paddy vs. Nilgiris tea).
    /// </summary>
    public class AgricultureSystem : MonoBehaviour
    {
        [Header("Active Plot State")]
        public CropInstance activeCrop;
        [Tooltip("Rate at which growth progresses per in-game hour.")]
        public float baseGrowthRate = 10f;

        public event Action<string, CropState> OnCropStateChanged;

        /// <summary>
        /// Plants a new crop in the active plot.
        /// </summary>
        public void PlantCrop(string cropId, RegionClimate climate, float waterRequirement = 50f)
        {
            activeCrop = new CropInstance
            {
                cropId = cropId,
                targetClimate = climate,
                currentState = CropState.Seeded,
                growthProgress = 0f,
                requiredWaterLevel = waterRequirement,
                currentWaterLevel = waterRequirement
            };
            OnCropStateChanged?.Invoke(cropId, activeCrop.currentState);
        }

        /// <summary>
        /// Simulates growth progress and environmental moisture effects over a given time interval.
        /// </summary>
        public void SimulateTick(float deltaTimeHours, float environmentalMoisture)
        {
            if (activeCrop == null || activeCrop.currentState == CropState.ReadyForHarvest || activeCrop.currentState == CropState.Withered)
                return;

            // Adjust water level based on environment & irrigation
            activeCrop.currentWaterLevel = Mathf.Clamp(activeCrop.currentWaterLevel + (environmentalMoisture - 5f) * deltaTimeHours, 0f, 100f);

            // Check if water is sufficient
            if (activeCrop.currentWaterLevel < (activeCrop.requiredWaterLevel * 0.3f))
            {
                // Withering due to drought
                activeCrop.currentState = CropState.Withered;
                OnCropStateChanged?.Invoke(activeCrop.cropId, activeCrop.currentState);
                return;
            }

            // Progress growth
            activeCrop.growthProgress += baseGrowthRate * deltaTimeHours;
            UpdateCropState();
        }

        private void UpdateCropState()
        {
            CropState previousState = activeCrop.currentState;

            if (activeCrop.growthProgress >= 100f)
            {
                activeCrop.currentState = CropState.ReadyForHarvest;
                activeCrop.growthProgress = 100f;
            }
            else if (activeCrop.growthProgress >= 60f)
            {
                activeCrop.currentState = CropState.Maturing;
            }
            else if (activeCrop.growthProgress >= 20f)
            {
                activeCrop.currentState = CropState.Sprouting;
            }

            if (previousState != activeCrop.currentState)
            {
                OnCropStateChanged?.Invoke(activeCrop.cropId, activeCrop.currentState);
            }
        }

        /// <summary>
        /// Harvests the active crop if ready. Returns true if harvest succeeded.
        /// </summary>
        public bool TryHarvest(out string harvestedCropId)
        {
            harvestedCropId = null;
            if (activeCrop != null && activeCrop.currentState == CropState.ReadyForHarvest)
            {
                harvestedCropId = activeCrop.cropId;
                activeCrop = null;
                return true;
            }
            return false;
        }
    }
}
