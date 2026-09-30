using System;
using UnityEngine;
using WhisperingWilds.World;

namespace WhisperingWilds.Wildlife
{
    /// <summary>
    /// Regional ecological coordinator simulating daylight cycles, migration rhythms,
    /// seasonal shifts, and background macro-population changes across Tamil Nadu habitats.
    /// </summary>
    [DisallowMultipleComponent]
    public class WildlifeSimulation : MonoBehaviour
    {
        public static WildlifeSimulation Instance { get; private set; }

        [Header("Simulation Settings")]
        [SerializeField] private float logicalTickInterval = 60.0f; // Every minute of game time

        private float tickTimer = 0f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void Start()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged += HandleHourChanged;
            }
        }

        private void OnDestroy()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged -= HandleHourChanged;
            }
        }

        private void Update()
        {
            tickTimer += Time.deltaTime;
            if (tickTimer >= logicalTickInterval)
            {
                tickTimer = 0f;
                PerformPeriodicSimulation();
            }
        }

        private void HandleHourChanged(int hour)
        {
            if (WildlifeManager.Instance != null)
            {
                WildlifeManager.Instance.AdvanceLogicalEcologySimulation(1.0);
            }
        }

        private void PerformPeriodicSimulation()
        {
            if (WildlifeManager.Instance != null)
            {
                WildlifeManager.Instance.AdvanceLogicalEcologySimulation(0.25);
            }
        }
    }
}
