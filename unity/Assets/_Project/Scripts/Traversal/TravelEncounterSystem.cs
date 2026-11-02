using System;
using UnityEngine;
using WhisperingWilds.NPC;

namespace WhisperingWilds.Traversal
{
    public enum EncounterType
    {
        MerchantCaravan,
        WildlifeAmbush,
        WeatherBlockade,
        MysticShrine
    }

    [System.Serializable]
    public struct TravelEncounter
    {
        public string encounterId;
        public EncounterType type;
        public string description;
        public string requiredMemoryFlag; // Ties into persistent relationship memories
    }

    /// <summary>
    /// Step 7: Manages dynamic travel encounters triggered during transit between regions.
    /// Supports memory-gated narrative encounters and roadside events.
    /// </summary>
    public class TravelEncounterSystem : MonoBehaviour
    {
        [Header("Active Encounters Database")]
        public TravelEncountersDatabase encounterDatabase;

        public event Action<string, EncounterType> OnEncounterStarted;

        public void TriggerEncounter(string nodeId, EncounterType type)
        {
            Debug.Log($"[TravelEncounter] Encounter triggered at node {nodeId} of type {type}. Launching resolution interface...");
            OnEncounterStarted?.Invoke(nodeId, type);
        }

        /// <summary>
        /// Validates if an encounter's memory prerequisites are satisfied.
        /// </summary>
        public bool IsEncounterAvailable(TravelEncounter encounter, string npcId = null)
        {
            if (string.IsNullOrEmpty(encounter.requiredMemoryFlag))
                return true;

            if (string.IsNullOrEmpty(npcId))
                return false;

            return NPCMemoryStore.HasMemory(npcId, encounter.requiredMemoryFlag);
        }
    }

    [CreateAssetMenu(fileName = "TravelEncountersDatabase", menuName = "WhisperingWilds/Travel/Encounters Database")]
    public class TravelEncountersDatabase : ScriptableObject
    {
        public TravelEncounter[] allEncounters;
    }
}
