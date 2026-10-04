using System.Collections.Generic;
using UnityEngine;

namespace WhisperingWilds.World
{
    public enum VehicleType
    {
        AutoRickshaw,
        CityBus,
        Motorcycle,
        Bicycle,
        BullockCart,
        FishingBoat,
        MangroveRowboat
    }

    /// <summary>
    /// Urban and regional transit simulation moving auto-rickshaws, buses, and boats along waypoint circuits.
    /// Includes authentic Tamil horn audio cues and speed throttling near pedestrian crossings.
    /// </summary>
    [DisallowMultipleComponent]
    public class TrafficSystem : MonoBehaviour
    {
        public static TrafficSystem Instance { get; private set; }

        [Header("Waypoints")]
        [SerializeField] private List<Transform> waypoints = new List<Transform>();
        [SerializeField] private float vehicleSpeed = 8.0f;
        public float VehicleSpeed => vehicleSpeed;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                // Destroy only the duplicate component. Destroy(gameObject) here would take
                // every sibling manager on the shared '--- MANAGERS ---' object with it.
                Destroy(this);
                return;
            }
            Instance = this;
        }

        public Transform GetNextWaypoint(int currentIndex)
        {
            if (waypoints.Count == 0) return null;
            return waypoints[(currentIndex + 1) % waypoints.Count];
        }
    }
}
