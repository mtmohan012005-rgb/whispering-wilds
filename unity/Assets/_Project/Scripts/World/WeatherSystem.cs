using System;
using UnityEngine;

namespace WhisperingWilds.World
{
    public enum WeatherType
    {
        Clear,
        Overcast,
        MonsoonRain,
        Thunderstorm,
        MountainMist
    }

    /// <summary>
    /// Controls atmospheric weather states, monsoon rain particles, and fog transitions.
    /// </summary>
    public class WeatherSystem : MonoBehaviour
    {
        public static WeatherSystem Instance { get; private set; }

        [Header("Current Weather")]
        [SerializeField] private WeatherType currentWeather = WeatherType.Clear;

        [Header("Atmospheric Effects")]
        [SerializeField] private ParticleSystem rainParticleSystem;
        [SerializeField] private float rainFogDensity = 0.02f;
        [SerializeField] private float mistFogDensity = 0.045f;
        [SerializeField] private float clearFogDensity = 0.003f;

        public WeatherType CurrentWeather => currentWeather;

        public event Action<WeatherType> OnWeatherChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            ApplyWeatherEffects(currentWeather);
        }

        public void ChangeWeather(WeatherType newWeather)
        {
            if (currentWeather == newWeather) return;

            currentWeather = newWeather;
            ApplyWeatherEffects(currentWeather);
            Debug.Log($"<color=#00D2FF><b>[Weather]</b></color> Atmosphere shifted to: {currentWeather}");
            OnWeatherChanged?.Invoke(currentWeather);
        }

        private void ApplyWeatherEffects(WeatherType weather)
        {
            RenderSettings.fog = true;

            switch (weather)
            {
                case WeatherType.Clear:
                    if (rainParticleSystem != null) rainParticleSystem.Stop();
                    RenderSettings.fogDensity = clearFogDensity;
                    RenderSettings.fogColor = new Color(0.7f, 0.85f, 1.0f);
                    break;

                case WeatherType.Overcast:
                    if (rainParticleSystem != null) rainParticleSystem.Stop();
                    RenderSettings.fogDensity = clearFogDensity * 2f;
                    RenderSettings.fogColor = new Color(0.6f, 0.65f, 0.7f);
                    break;

                case WeatherType.MonsoonRain:
                case WeatherType.Thunderstorm:
                    if (rainParticleSystem != null) rainParticleSystem.Play();
                    RenderSettings.fogDensity = rainFogDensity;
                    RenderSettings.fogColor = new Color(0.45f, 0.5f, 0.55f);
                    break;

                case WeatherType.MountainMist:
                    if (rainParticleSystem != null) rainParticleSystem.Stop();
                    RenderSettings.fogDensity = mistFogDensity;
                    RenderSettings.fogColor = new Color(0.85f, 0.88f, 0.92f);
                    break;
            }
        }
    }
}
