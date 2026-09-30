using System;
using System.Collections.Generic;

namespace WhisperingWilds.Persistence
{
    [Serializable]
    public class SavedFarmPlotState
    {
        public string plotId;
        public string regionId;
        public string plantId;
        public int growthStage; // Cast from GrowthStage
        public float soilMoisture;
        public int plantedWorldDay;
        public float health;
    }

    [Serializable]
    public class SavedFruitTreeState
    {
        public string treeId;
        public string plantId;
        public int cycleStage; // Cast from FruitTreeCycleStage
        public int lastHarvestDay;
    }

    [Serializable]
    public class SavedWildlifePopulationState
    {
        public string cellId;
        public string regionId;
        public int species; // Cast from WildlifeSpecies
        public int count;
    }

    /// <summary>
    /// Compact, highly structured snapshot of the living Tamil Nadu world state.
    /// Strictly persists logical state only, never thousands of raw GameObject transforms.
    /// </summary>
    [Serializable]
    public class WorldStateData
    {
        public int schemaVersion = 1;
        public string lastSavedTimestampUtc;
        public double totalElapsedHours = 0.0;
        public int worldYear = 2026;
        public int worldMonth = 10;
        public int worldDay = 15;
        public float worldHour = 9.0f;
        public int currentSeason = 2; // NortheastMonsoon
        public string currentRegionId = "chennai";

        public List<SavedFarmPlotState> farmPlots = new List<SavedFarmPlotState>();
        public List<SavedFruitTreeState> fruitTrees = new List<SavedFruitTreeState>();
        public List<SavedWildlifePopulationState> wildlifePopulations = new List<SavedWildlifePopulationState>();
    }
}
