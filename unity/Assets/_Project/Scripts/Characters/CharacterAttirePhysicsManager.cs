using System.Collections.Generic;
using UnityEngine;
using WhisperingWilds.Player;
using WhisperingWilds.World;

namespace WhisperingWilds.Characters
{
    /// <summary>
    /// Scene wide wind source for the character attire. It owns the single directional wind zone
    /// used by the region (monsoon gusts) and publishes the resulting wind vector so every
    /// <see cref="VeshtiClothPhysicsController"/> reacts to the same weather instead of each
    /// garment running its own isolated simulation.
    ///
    /// The previous version of this script drove a Unity <c>Cloth</c> component, which the skinned
    /// veshti mesh never had, so it did nothing at all.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    [DisallowMultipleComponent]
    public class CharacterAttirePhysicsManager : MonoBehaviour
    {
        [Header("Cultural Garment Controls")]
        [Tooltip("Global multiplier applied to the wind that reaches the garments.")]
        [Range(0f, 3f)] public float windTurbulenceMultiplier = 1f;
        [Tooltip("Seconds between refreshes of the registered garment controllers.")]
        [SerializeField] private float refreshInterval = 2f;

        private readonly List<VeshtiClothPhysicsController> controllers = new List<VeshtiClothPhysicsController>();
        private WindZone globalWindZone;
        private float refreshTimer;

        /// <summary>The active manager, used by the garment solvers as the wind source.</summary>
        public static CharacterAttirePhysicsManager Instance { get; private set; }

        /// <summary>Current world space wind vector including the gust modulation.</summary>
        public Vector3 GlobalWind { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(this);
                return;
            }

            Instance = this;
        }

        private void OnEnable()
        {
            // Automatically isolate external weather parameters
            globalWindZone = FindFirstObjectByType<WindZone>();
            if (globalWindZone == null)
            {
                GameObject windObj = new GameObject("Dynamic_Monsoon_Wind");
                globalWindZone = windObj.AddComponent<WindZone>();
                globalWindZone.mode = WindZoneMode.Directional;
            }

            RefreshControllers();
        }

        private void OnDisable()
        {
            if (Instance == this) Instance = null;
        }

        private void Update()
        {
            refreshTimer -= Time.deltaTime;
            if (refreshTimer <= 0f)
            {
                refreshTimer = refreshInterval;
                RefreshControllers();
            }

            GlobalWind = ComputeWind();
        }

        /// <summary>
        /// Combines the regional wind speed with the wind zone turbulence to produce the gust
        /// vector shared by every garment.
        /// </summary>
        private Vector3 ComputeWind()
        {
            float windSpeedKmh = 12f;
            RegionalClimateSystem climate = RegionalClimateSystem.Instance;
            if (climate != null) windSpeedKmh = climate.CurrentWindSpeedKmh;

            WeatherSystem weather = WeatherSystem.Instance;
            bool heavyWeather = weather != null &&
                                (weather.CurrentWeather == WeatherType.Windy ||
                                 weather.CurrentWeather == WeatherType.Thunderstorm);
            if (heavyWeather) windSpeedKmh *= 1.8f;

            float gust = 1f;
            if (globalWindZone != null)
            {
                gust = globalWindZone.windMain + Mathf.PingPong(Time.time * 1.5f, Mathf.Max(0.01f, globalWindZone.windTurbulence));
            }
            else
            {
                gust = 0.6f + 0.4f * Mathf.Sin(Time.time * 2.3f);
            }

            float windSpeed = windSpeedKmh / 3.6f;
            float magnitude = windSpeed * windSpeed * 0.04f * gust * windTurbulenceMultiplier;

            Vector3 direction = globalWindZone != null ? globalWindZone.transform.forward : transform.forward;
            return direction * magnitude;
        }

        /// <summary>
        /// Rebuilds the registry of garment controllers. Done on an interval so the scene never
        /// pays for a scene wide search every frame.
        /// </summary>
        private void RefreshControllers()
        {
            controllers.Clear();
            VeshtiClothPhysicsController[] found = FindObjectsByType<VeshtiClothPhysicsController>(FindObjectsSortMode.None);
            for (int i = 0; i < found.Length; i++)
            {
                controllers.Add(found[i]);
            }
        }

        /// <summary>Number of garment controllers currently registered.</summary>
        public int RegisteredControllerCount => controllers.Count;
    }
}
