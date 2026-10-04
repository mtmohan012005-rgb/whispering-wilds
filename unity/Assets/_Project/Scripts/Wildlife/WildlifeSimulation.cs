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
        [Tooltip("Real seconds between ecological ticks. Unrelated to game-clock units.")]
        [SerializeField] private float realSecondsBetweenTicks = 5.0f;

        /// <summary>
        /// In-game HOURS of ecological drift applied per tick. The logical layer must advance on
        /// the game clock, not on real seconds: with a 24h day compressed into a few minutes of real
        /// time, tying the tick to Time.deltaTime makes ecology drift orders of magnitude slower
        /// than the world it is meant to model.
        /// </summary>
        [SerializeField] private float gameHoursPerTick = 1.0f;

        private float tickTimer = 0f;

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
            if (tickTimer >= realSecondsBetweenTicks)
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
            if (WildlifeManager.Instance == null)
            {
                return;
            }

            // Scale the per-tick drift by however much game time actually elapsed, so pausing or
            // fast-forwarding the clock changes ecological speed consistently instead of running
            // on a fixed real-time cadence.
            float hours = gameHoursPerTick;
            if (WorldTimeSystem.Instance != null)
            {
                hours = Mathf.Max(0f, (float)WorldTimeSystem.Instance.FastForwardMultiplier) * gameHoursPerTick;
            }

            if (hours > 0f)
            {
                WildlifeManager.Instance.AdvanceLogicalEcologySimulation(hours);
            }
        }
    }
}
