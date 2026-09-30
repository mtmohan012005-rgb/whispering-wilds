using System;
using UnityEngine;

namespace WhisperingWilds.Wildlife
{
    /// <summary>
    /// Localized habitat zone spawner responsible for managing zone population limits,
    /// safe spawn radius from player, and communicating with WildlifeManager's object pool.
    /// </summary>
    [RequireComponent(typeof(WildlifeHabitatZone))]
    [DisallowMultipleComponent]
    public class WildlifeSpawner : MonoBehaviour
    {
        [Header("Spawn Configuration")]
        [SerializeField] private bool autoSpawnOnStart = true;
        [SerializeField] private float respawnCheckInterval = 30.0f;

        private WildlifeHabitatZone zone;
        private float respawnTimer = 0f;

        private void Awake()
        {
            zone = GetComponent<WildlifeHabitatZone>();
        }

        private void Start()
        {
            if (autoSpawnOnStart && WildlifeManager.Instance != null && zone != null)
            {
                // Register and spawn
                WildlifeManager.Instance.DiscoverHabitatsInScene();
            }
        }

        private void Update()
        {
            respawnTimer += Time.deltaTime;
            if (respawnTimer >= respawnCheckInterval)
            {
                respawnTimer = 0f;
                CheckAndReplenishPopulation();
            }
        }

        public void CheckAndReplenishPopulation()
        {
            if (zone == null || WildlifeManager.Instance == null) return;
            if (zone.AllowedSpecies.Count == 0) return;

            // Count live entities inside this zone
            var allEntities = FindObjectsByType<WildlifeEntity>();
            int insideCount = 0;
            for (int i = 0; i < allEntities.Length; i++)
            {
                if (allEntities[i] != null && allEntities[i].AssignedHabitat == zone)
                {
                    insideCount++;
                }
            }

            if (insideCount < zone.Capacity / 2)
            {
                // Spawn one replacement entity
                var player = GameObject.FindWithTag("Player");
                Vector3 playerPos = player != null ? player.transform.position : Vector3.zero;
                WildlifeSpecies sp = zone.AllowedSpecies[UnityEngine.Random.Range(0, zone.AllowedSpecies.Count)];
                WildlifeManager.Instance.SpawnEntityInHabitat(sp, zone, playerPos);
            }
        }
    }
}
