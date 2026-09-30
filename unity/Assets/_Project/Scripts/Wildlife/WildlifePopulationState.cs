using System;
using UnityEngine;

namespace WhisperingWilds.Wildlife
{
    /// <summary>
    /// Lightweight serializable state representing a population cluster in background / far distance simulation.
    /// Eliminates the overhead of maintaining live GameObjects for far-away wildlife.
    /// </summary>
    [Serializable]
    public class WildlifePopulationState
    {
        public string clusterId;
        public string regionId;
        public WildlifeSpecies species;
        public int currentPopulation;
        public int maxCapacity;
        public Vector3 centroidPosition;
        public float healthRatio = 1.0f;
        public float lastSimulatedHour = 0f;

        public bool IsExtinct => currentPopulation <= 0;

        public void ApplySeasonalGrowth(float growthFactor)
        {
            currentPopulation = Mathf.Clamp(Mathf.RoundToInt(currentPopulation * growthFactor), 0, maxCapacity);
        }
    }
}
