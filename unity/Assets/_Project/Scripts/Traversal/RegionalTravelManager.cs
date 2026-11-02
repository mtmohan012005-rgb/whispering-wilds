using System;
using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.Traversal
{
    [System.Serializable]
    public struct TravelNode
    {
        public string nodeId;
        public string regionName;
        public List<string> connectedNodeIds;
        public float baseTravelHours;
        public int dangerLevel;
        public bool isUnlocked;
    }

    /// <summary>
    /// Step 7: Core inter-region travel and route traversal manager.
    /// Manages node connectivity, travel resource expenditure (stamina, rations),
    /// and dynamic travel encounter triggers across Tamil Nadu regions.
    /// </summary>
    public class RegionalTravelManager : MonoBehaviour
    {
        [Header("World Map State")]
        public string currentNodeId;
        public List<TravelNode> worldNodes = new List<TravelNode>();

        [Header("Travel Resources")]
        public float currentStamina = 100f;
        public int foodRations = 5;

        public event Action<string, string> OnTravelStarted;
        public event Action<string> OnTravelCompleted;
        public event Action<string> OnEncounterTriggered;

        /// <summary>
        /// Validates if a destination node is connected and unlocked.
        /// </summary>
        public bool CanTravelTo(string targetNodeId)
        {
            if (string.IsNullOrEmpty(targetNodeId)) return false;

            TravelNode currentNode = GetNode(currentNodeId);
            TravelNode targetNode = GetNode(targetNodeId);

            if (string.IsNullOrEmpty(targetNode.nodeId) || !targetNode.isUnlocked) return false;
            if (currentNode.connectedNodeIds == null) return false;

            return currentNode.connectedNodeIds.Contains(targetNodeId);
        }

        /// <summary>
        /// Initiates travel between nodes, calculating resource drain and triggering potential encounters.
        /// </summary>
        public bool InitiateTravel(string targetNodeId)
        {
            if (!CanTravelTo(targetNodeId))
            {
                Debug.LogWarning($"[RegionalTravel] Travel to {targetNodeId} is blocked or invalid.");
                return false;
            }

            TravelNode targetNode = GetNode(targetNodeId);
            string fromNodeId = currentNodeId;
            OnTravelStarted?.Invoke(fromNodeId, targetNodeId);

            // Consume rations/stamina based on travel distance & danger
            float staminaCost = targetNode.baseTravelHours * 5f;
            currentStamina = Mathf.Max(0f, currentStamina - staminaCost);
            foodRations = Mathf.Max(0, foodRations - 1);

            currentNodeId = targetNodeId;
            OnTravelCompleted?.Invoke(currentNodeId);

            // Check if travel triggers an encounter
            EvaluateEncounter(targetNode.dangerLevel);
            return true;
        }

        private void EvaluateEncounter(int dangerLevel)
        {
            float encounterRoll = UnityEngine.Random.value;
            // Higher danger level increases encounter probability
            float threshold = dangerLevel * 0.15f; 

            if (encounterRoll <= threshold)
            {
                OnEncounterTriggered?.Invoke(currentNodeId);
            }
        }

        public TravelNode GetNode(string nodeId)
        {
            if (string.IsNullOrEmpty(nodeId)) return default;
            return worldNodes.Find(n => string.Equals(n.nodeId, nodeId, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Unlocks a travel node by identifier.
        /// </summary>
        public void UnlockNode(string nodeId)
        {
            for (int i = 0; i < worldNodes.Count; i++)
            {
                if (string.Equals(worldNodes[i].nodeId, nodeId, StringComparison.OrdinalIgnoreCase))
                {
                    var node = worldNodes[i];
                    node.isUnlocked = true;
                    worldNodes[i] = node;
                    break;
                }
            }
        }
    }
}
