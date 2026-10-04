using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;
using WhisperingWilds.Audio;

namespace WhisperingWilds.World
{
    public enum WeatherType
    {
        Clear = 0,
        PartlyCloudy = 1,
        Cloudy = 2,
        LightRain = 3,
        HeavyRain = 4,
        Thunderstorm = 5,
        Mist = 6,
        Fog = 7,
        Windy = 8,
        HotClear = 9,
        CoolClear = 10
    }

    /// <summary>
    /// Data-driven weather state machine managing atmospheric transitions, smooth interpolation,
    /// particle emitters, ambient lighting, fog, and global surface wetness/puddles.
    /// Responds continuously to RegionalClimateSystem and the 4 Tamil Nadu seasons.
    /// Supports HDRP Volume atmospheric fog overrides with seamless legacy fallback.
    /// </summary>
    [DisallowMultipleComponent]
    public class WeatherSystem : MonoBehaviour
    {
        public static WeatherSystem Instance { get; private set; }

        [Header("Active State")]
        [SerializeField] private WeatherType currentWeather = WeatherType.Clear;
        [SerializeField] private WeatherType targetWeather = WeatherType.Clear;
        [SerializeField] private bool isTransitioning = false;
        [SerializeField] private float transitionDuration = 10.0f; // Smooth 10s atmospheric blend

        [Header("Atmospheric Effects")]
        [SerializeField] private ParticleSystem rainParticleSystem;
        [SerializeField] private float rainMaxEmissionRate = 800f;
        [SerializeField] private float currentWetness = 0.0f;
        [SerializeField] private float currentPuddleIntensity = 0.0f;

        [Header("Fog Configuration")]
        [SerializeField] private float clearFogDensity = 0.002f;
        [SerializeField] private float cloudyFogDensity = 0.008f;
        [SerializeField] private float rainFogDensity = 0.025f;
        [SerializeField] private float mistFogDensity = 0.045f;
        [SerializeField] private float heavyFogDensity = 0.065f;

        [Header("HDRP Volume Integration")]
        [SerializeField] private Volume sceneWeatherVolume;
        private UnityEngine.Rendering.HighDefinition.Fog hdrpFog;

        public WeatherType CurrentWeather => currentWeather;
        public float CurrentWetness => currentWetness;
        public float CurrentPuddleIntensity => currentPuddleIntensity;
        public bool IsTransitioning => isTransitioning;

        public event Action<WeatherType> OnWeatherChanged;
        public event Action<float> OnWetnessChanged;

        private Coroutine transitionRoutine;
        private float autoWeatherCheckTimer = 0f;
        private const float AutoWeatherInterval = 45f; // Check weather shifts periodically

        // Shader property IDs for zero-allocation rendering updates
        private static readonly int GlobalWetnessId = Shader.PropertyToID("_GlobalWetness");
        private static readonly int GlobalPuddleScaleId = Shader.PropertyToID("_GlobalPuddleScale");
        private static readonly int GlobalWindSpeedId = Shader.PropertyToID("_GlobalWindSpeed");

        /// <summary>Rate limit for the (allocating) scene-wide rain emitter lookup. See AcquireRainParticleSystem.</summary>
        private const float RainAcquireRetryIntervalSeconds = 5.0f;
        private float nextRainAcquireTime;

        /// <summary>
        /// Scene-owned bindings (Volume, rain emitter) are acquired once in Start, which runs while
        /// the boot/menu scene is still loaded. Both are therefore stale for the rest of the session
        /// once a region scene becomes active, so they are rebound on every scene load.
        /// </summary>
        private void OnEnable()
        {
            UnityEngine.SceneManagement.SceneManager.sceneLoaded -= HandleSceneLoaded;
            UnityEngine.SceneManagement.SceneManager.sceneLoaded += HandleSceneLoaded;
        }

        private void OnDisable()
        {
            UnityEngine.SceneManagement.SceneManager.sceneLoaded -= HandleSceneLoaded;
        }

        private void HandleSceneLoaded(UnityEngine.SceneManagement.Scene scene, UnityEngine.SceneManagement.LoadSceneMode mode)
        {
            sceneWeatherVolume = null;
            hdrpFog = null;
            rainParticleSystem = null;

            nextRainAcquireTime = 0f;
            AcquireHdrpVolume();
            AcquireRainParticleSystem();

            // Re-assert the current weather into the newly loaded scene's volume so a region never
            // loads with a fog density left over from whatever weather the previous region had.
            ApplyInstantWeatherVisuals(currentWeather);
        }

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
            AcquireRainParticleSystem();
            AcquireHdrpVolume();
            ApplyInstantWeatherVisuals(currentWeather);

            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged += HandleHourTick;
                WorldTimeSystem.Instance.OnSeasonChanged += HandleSeasonChanged;
            }
        }

        private void AcquireHdrpVolume()
        {
            if (sceneWeatherVolume == null)
            {
                var volumes = FindObjectsByType<Volume>();
                foreach (var v in volumes)
                {
                    if (v.isGlobal || v.gameObject.name.ToLowerInvariant().Contains("fog") || v.gameObject.name.ToLowerInvariant().Contains("sky"))
                    {
                        sceneWeatherVolume = v;
                        break;
                    }
                }
            }

            if (sceneWeatherVolume != null && sceneWeatherVolume.profile != null)
            {
                sceneWeatherVolume.profile.TryGet(out hdrpFog);
            }
        }

        private void OnDestroy()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged -= HandleHourTick;
                WorldTimeSystem.Instance.OnSeasonChanged -= HandleSeasonChanged;
            }
        }

/// <summary>
        /// Finds the region's rain emitter.
        ///
        /// FindObjectsByType allocates an array of every particle system in the scene and the name
        /// check allocates a lowercase copy per candidate, so this must not run per frame. It is
        /// retried on a timer from <see cref="UpdateRainEmission"/> (which runs for the whole 10 s
        /// blend) and on scene load, not every frame. When no rain emitter is authored the lookup
        /// simply keeps failing on a timer; <c>RuntimeVisualDiagnostics</c> reports the missing
        /// emitter rather than this loop silently pretending rain exists.
        /// </summary>
        private void AcquireRainParticleSystem()
        {
            if (rainParticleSystem != null) return;
            if (Time.realtimeSinceStartup < nextRainAcquireTime) return;
            nextRainAcquireTime = Time.realtimeSinceStartup + RainAcquireRetryIntervalSeconds;

            var psList = FindObjectsByType<ParticleSystem>(FindObjectsInactive.Include);
            for (int i = 0; i < psList.Length; i++)
            {
                ParticleSystem ps = psList[i];
                if (ps != null && ps.name.IndexOf("rain", System.StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    rainParticleSystem = ps;
                    return;
                }
            }
        }

        private void Update()
        {
            autoWeatherCheckTimer += Time.deltaTime;
            if (autoWeatherCheckTimer >= AutoWeatherInterval)
            {
                autoWeatherCheckTimer = 0f;
                EvaluatePeriodicWeatherShift();
            }

            // Gradually dry surfaces if sunny/dry, or increase wetness during rain
            UpdateSurfaceWetness(Time.deltaTime);
        }

        private void HandleHourTick(int hour)
        {
            // Evaluate weather shifts on major diurnal boundaries
            if (hour % 3 == 0)
            {
                EvaluatePeriodicWeatherShift();
            }
        }

        private void HandleSeasonChanged(TamilNaduSeason season)
        {
            EvaluatePeriodicWeatherShift();
        }

        /// <summary>
        /// Rolls for data-driven, climate-appropriate weather changes.
        /// </summary>
        public void EvaluatePeriodicWeatherShift()
        {
            if (isTransitioning) return;

            RegionalClimateSystem climate = RegionalClimateSystem.Instance;
            float rainProb = climate != null ? climate.CurrentRainProbability : 0.25f;
            string regionId = climate != null ? climate.ActiveRegionId : "chennai";
            TamilNaduSeason season = WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.CurrentSeason : TamilNaduSeason.NortheastMonsoon;

            float roll = UnityEngine.Random.value;
            WeatherType nextWeather = WeatherType.Clear;

            if (regionId.Contains("nilgiri"))
            {
                // High Nilgiris: high chance of Mist/Fog and mountain showers
                if (roll < 0.35f) nextWeather = WeatherType.Mist;
                else if (roll < 0.60f && (season == TamilNaduSeason.SouthwestMonsoon)) nextWeather = WeatherType.HeavyRain;
                else if (roll < 0.80f) nextWeather = WeatherType.PartlyCloudy;
                else nextWeather = WeatherType.CoolClear;
            }
            else if (regionId.Contains("pichavaram"))
            {
                // Mangrove wetlands: humidity, afternoon rain, sea mist
                if (roll < rainProb) nextWeather = roll < (rainProb * 0.4f) ? WeatherType.Thunderstorm : WeatherType.LightRain;
                else if (roll < 0.70f) nextWeather = WeatherType.Cloudy;
                else nextWeather = WeatherType.PartlyCloudy;
            }
            else if (regionId.Contains("chettinad"))
            {
                // Semi-arid inland: Hot clear, dry winds
                if (season == TamilNaduSeason.Summer) nextWeather = roll < 0.85f ? WeatherType.HotClear : WeatherType.Windy;
                else if (roll < rainProb) nextWeather = WeatherType.LightRain;
                else nextWeather = WeatherType.Clear;
            }
            else
            {
                // Coastal / Delta: NE Monsoon brings strong storms, pleasant winter
                if (season == TamilNaduSeason.NortheastMonsoon && roll < rainProb)
                {
                    nextWeather = roll < (rainProb * 0.35f) ? WeatherType.Thunderstorm : WeatherType.HeavyRain;
                }
                else if (roll < rainProb)
                {
                    nextWeather = WeatherType.LightRain;
                }
                else if (season == TamilNaduSeason.Winter)
                {
                    nextWeather = WeatherType.CoolClear;
                }
                else if (season == TamilNaduSeason.Summer)
                {
                    nextWeather = WeatherType.HotClear;
                }
                else
                {
                    nextWeather = roll < 0.5f ? WeatherType.PartlyCloudy : WeatherType.Clear;
                }
            }

            if (nextWeather != currentWeather)
            {
                ChangeWeather(nextWeather, transitionDuration);
            }
        }

        public void ChangeWeather(WeatherType newWeather, float duration = 8.0f)
        {
            if (currentWeather == newWeather && !isTransitioning) return;

            if (transitionRoutine != null) StopCoroutine(transitionRoutine);
            transitionRoutine = StartCoroutine(WeatherTransitionRoutine(newWeather, duration));
        }

        private IEnumerator WeatherTransitionRoutine(WeatherType target, float duration)
        {
            isTransitioning = true;
            targetWeather = target;
            WeatherType previous = currentWeather;

            Debug.Log($"<color=#00D2FF><b>[WeatherSystem]</b></color> Commencing smooth transition: {previous} -> {target} over {duration:F1}s");

            float elapsed = 0f;
            float startFog = RenderSettings.fogDensity;
            Color startFogColor = RenderSettings.fogColor;

            GetTargetFogSettings(target, out float endFog, out Color endFogColor);

            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                float smoothT = Mathf.SmoothStep(0f, 1f, t);

                // Blend fog density & color
                float currentDensity = Mathf.Lerp(startFog, endFog, smoothT);
                Color currentColor = Color.Lerp(startFogColor, endFogColor, smoothT);

                if (hdrpFog != null)
                {
                    hdrpFog.enabled.value = true;
                    hdrpFog.albedo.value = currentColor;
                    hdrpFog.meanFreePath.value = Mathf.Clamp(1.0f / Mathf.Max(0.0001f, currentDensity * 40f), 8f, 600f);
                }

                RenderSettings.fog = true;
                RenderSettings.fogDensity = currentDensity;
                RenderSettings.fogColor = currentColor;

                // Update rain emitter
                UpdateRainEmission(target, smoothT, previous);

                yield return null;
            }

            currentWeather = target;
            isTransitioning = false;
            ApplyInstantWeatherVisuals(currentWeather);

            Debug.Log($"<color=#00FF99><b>[WeatherSystem]</b></color> Atmosphere stabilized at: {currentWeather}");
            OnWeatherChanged?.Invoke(currentWeather);
        }

        private void UpdateRainEmission(WeatherType target, float progress, WeatherType previous)
        {
            if (rainParticleSystem == null) AcquireRainParticleSystem();
            if (rainParticleSystem == null) return;

            var emission = rainParticleSystem.emission;
            bool targetHasRain = IsRainWeather(target);
            bool prevHasRain = IsRainWeather(previous);

            if (targetHasRain && !rainParticleSystem.isPlaying)
            {
                rainParticleSystem.Play();
            }

            float targetEmissionRate = target == WeatherType.HeavyRain || target == WeatherType.Thunderstorm ? rainMaxEmissionRate : (target == WeatherType.LightRain ? rainMaxEmissionRate * 0.35f : 0f);
            float startEmissionRate = prevHasRain ? (previous == WeatherType.LightRain ? rainMaxEmissionRate * 0.35f : rainMaxEmissionRate) : 0f;

            emission.rateOverTime = Mathf.Lerp(startEmissionRate, targetEmissionRate, progress);

            if (!targetHasRain && progress >= 0.99f && rainParticleSystem.isPlaying)
            {
                rainParticleSystem.Stop();
            }
        }

        private void UpdateSurfaceWetness(float dt)
        {
            bool isRaining = IsRainWeather(currentWeather);
            float targetWet = isRaining ? 1.0f : 0.0f;
            float speed = isRaining ? 0.08f : 0.02f; // Dries slowly, wets quickly

            float prevWet = currentWetness;
            currentWetness = Mathf.MoveTowards(currentWetness, targetWet, dt * speed);
            currentPuddleIntensity = Mathf.Clamp01((currentWetness - 0.3f) / 0.7f);

            if (Mathf.Abs(prevWet - currentWetness) > 0.005f)
            {
                Shader.SetGlobalFloat(GlobalWetnessId, currentWetness);
                Shader.SetGlobalFloat(GlobalPuddleScaleId, currentPuddleIntensity);
                OnWetnessChanged?.Invoke(currentWetness);
            }

            float wind = RegionalClimateSystem.Instance != null ? RegionalClimateSystem.Instance.CurrentWindSpeedKmh : 12f;
            if (currentWeather == WeatherType.Thunderstorm || currentWeather == WeatherType.Windy) wind *= 1.8f;
            Shader.SetGlobalFloat(GlobalWindSpeedId, wind);
        }

        private bool IsRainWeather(WeatherType type)
        {
            return type == WeatherType.LightRain || type == WeatherType.HeavyRain || type == WeatherType.Thunderstorm;
        }

        private void GetTargetFogSettings(WeatherType type, out float density, out Color color)
        {
            switch (type)
            {
                case WeatherType.Clear:
                case WeatherType.HotClear:
                    density = clearFogDensity;
                    color = new Color(0.72f, 0.86f, 1.0f);
                    break;
                case WeatherType.CoolClear:
                    density = clearFogDensity * 1.5f;
                    color = new Color(0.80f, 0.88f, 0.96f);
                    break;
                case WeatherType.PartlyCloudy:
                    density = clearFogDensity * 1.8f;
                    color = new Color(0.68f, 0.75f, 0.85f);
                    break;
                case WeatherType.Cloudy:
                case WeatherType.Windy:
                    density = cloudyFogDensity;
                    color = new Color(0.58f, 0.63f, 0.70f);
                    break;
                case WeatherType.LightRain:
                    density = rainFogDensity * 0.7f;
                    color = new Color(0.50f, 0.55f, 0.60f);
                    break;
                case WeatherType.HeavyRain:
                case WeatherType.Thunderstorm:
                    density = rainFogDensity;
                    color = new Color(0.38f, 0.42f, 0.48f);
                    break;
                case WeatherType.Mist:
                    density = mistFogDensity;
                    color = new Color(0.84f, 0.87f, 0.92f);
                    break;
                case WeatherType.Fog:
                    density = heavyFogDensity;
                    color = new Color(0.88f, 0.90f, 0.93f);
                    break;
                default:
                    density = clearFogDensity;
                    color = Color.gray;
                    break;
            }
        }

        private void ApplyInstantWeatherVisuals(WeatherType type)
        {
            GetTargetFogSettings(type, out float density, out Color color);

            if (hdrpFog != null)
            {
                hdrpFog.enabled.value = true;
                hdrpFog.albedo.value = color;
                hdrpFog.meanFreePath.value = Mathf.Clamp(1.0f / Mathf.Max(0.0001f, density * 40f), 8f, 600f);
            }

            RenderSettings.fog = true;
            RenderSettings.fogDensity = density;
            RenderSettings.fogColor = color;

            if (rainParticleSystem != null)
            {
                var emission = rainParticleSystem.emission;
                if (IsRainWeather(type))
                {
                    emission.rateOverTime = type == WeatherType.LightRain ? rainMaxEmissionRate * 0.35f : rainMaxEmissionRate;
                    if (!rainParticleSystem.isPlaying) rainParticleSystem.Play();
                }
                else
                {
                    emission.rateOverTime = 0f;
                    if (rainParticleSystem.isPlaying) rainParticleSystem.Stop();
                }
            }
        }
    }
}
