using System;
using UnityEngine;
using WhisperingWilds.Loops;

namespace WhisperingWilds.Environment
{
    public enum WeatherState
    {
        Clear,
        Overcast,
        MonsoonRain,
        MistyFog
    }

    /// <summary>
    /// Master dynamic time-of-day and weather simulation manager for Tamil Nadu biomes.
    /// Drives real-time sun rotation, atmospheric lighting curves, and dynamic weather states
    /// (Monsoon Rain in Cauvery Delta, Mountain Mist in Nilgiris), directly propagating environmental
    /// moisture into active AgricultureSystem crops.
    /// </summary>
    public class TimeAndWeatherManager : MonoBehaviour
    {
        public static TimeAndWeatherManager Instance { get; private set; }

        [Header("Time Simulation")]
        [Range(0f, 24f)] public float timeOfDay = 10f; // 10:00 AM start
        [Tooltip("Real-time minutes for one full 24-hour cycle.")]
        public float dayDurationMinutes = 24f;
        public bool isTimeAdvancing = true;

        [Header("Sun & Atmosphere")]
        [SerializeField] private Light sunLight;
        [SerializeField] private Gradient sunColorGradient;
        [SerializeField] private AnimationCurve sunIntensityCurve;

        [Header("Weather Simulation")]
        public WeatherState currentWeather = WeatherState.Clear;
        [Tooltip("Millimeters of rainfall added per in-game hour during Monsoon.")]
        public float monsoonRainfallRate = 25f;

        [Header("Agricultural Moisture Link")]
        public AgricultureSystem agricultureSystem;

        private int lastRecordedHour = -1;

        public event Action<int> OnHourPassed;
        public event Action<WeatherState> OnWeatherChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Update()
        {
            if (isTimeAdvancing)
            {
                AdvanceTime(Time.deltaTime);
            }
            UpdateSunTransform();
            UpdateAgriculturalMoisture(Time.deltaTime);
        }

        /// <summary>
        /// Advances the simulation clock and fires hourly events.
        /// </summary>
        public void AdvanceTime(float deltaTimeSeconds)
        {
            float hoursPerSecond = 24f / (dayDurationMinutes * 60f);
            timeOfDay = (timeOfDay + deltaTimeSeconds * hoursPerSecond) % 24f;

            int currentHour = Mathf.FloorToInt(timeOfDay);
            if (currentHour != lastRecordedHour)
            {
                lastRecordedHour = currentHour;
                OnHourPassed?.Invoke(currentHour);
            }
        }

        /// <summary>
        /// Adjusts directional sunlight angle and intensity.
        /// </summary>
        public void UpdateSunTransform()
        {
            if (sunLight == null) return;

            // 0:00 = -90 deg (midnight), 6:00 = 0 deg (sunrise), 12:00 = 90 deg (noon), 18:00 = 180 deg (sunset)
            float sunAngle = (timeOfDay / 24f) * 360f - 90f;
            sunLight.transform.localRotation = Quaternion.Euler(sunAngle, 170f, 0f);

            // Light intensity curve evaluation
            if (sunIntensityCurve != null && sunIntensityCurve.length > 0)
            {
                sunLight.intensity = sunIntensityCurve.Evaluate(timeOfDay / 24f);
            }
            else
            {
                // Fallback math curve: peak at noon, 0 at night
                float normalizedHeight = Mathf.Sin((timeOfDay / 24f) * Mathf.PI);
                sunLight.intensity = Mathf.Max(0.05f, normalizedHeight * 1.5f);
            }
        }

        /// <summary>
        /// Injects rainfall moisture or evaporation directly into connected agricultural plots.
        /// </summary>
        public void UpdateAgriculturalMoisture(float deltaTimeSeconds)
        {
            if (agricultureSystem == null || agricultureSystem.activeCrop == null) return;

            float hoursDelta = (deltaTimeSeconds * 24f) / (dayDurationMinutes * 60f);

            if (currentWeather == WeatherState.MonsoonRain)
            {
                float moistureGain = monsoonRainfallRate * hoursDelta;
                agricultureSystem.activeCrop.currentWaterLevel = Mathf.Min(100f, agricultureSystem.activeCrop.currentWaterLevel + moistureGain);
            }
            else if (currentWeather == WeatherState.Clear && timeOfDay >= 11f && timeOfDay <= 15f)
            {
                // Midday evaporation
                float evaporation = 5f * hoursDelta;
                agricultureSystem.activeCrop.currentWaterLevel = Mathf.Max(0f, agricultureSystem.activeCrop.currentWaterLevel - evaporation);
            }
        }

        /// <summary>
        /// Transitions the world weather state.
        /// </summary>
        public void SetWeather(WeatherState newWeather)
        {
            if (currentWeather == newWeather) return;
            currentWeather = newWeather;
            OnWeatherChanged?.Invoke(newWeather);
        }
    }
}
