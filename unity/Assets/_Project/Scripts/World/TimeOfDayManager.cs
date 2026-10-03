using System;
using UnityEngine;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Manages the 24-hour visual day/night lighting, sun orbital angles, and color gradients.
    /// Synchronizes bidirectionally with the authoritative WorldTimeSystem.
    /// </summary>
    [DisallowMultipleComponent]
    public class TimeOfDayManager : MonoBehaviour
    {
        public static TimeOfDayManager Instance { get; private set; }

        [Header("Sun & Lighting")]
        [SerializeField] private Light sunLight;
        [SerializeField] private Gradient sunColorGradient;
        [SerializeField] private AnimationCurve sunIntensityCurve;

        public float CurrentHour => WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.HourOfDay : localFallbackHour;
        public float CurrentTime24 => CurrentHour;
        public int WholeHour => WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.WholeHour : Mathf.FloorToInt(localFallbackHour);
        public int Minutes => WorldTimeSystem.Instance != null ? WorldTimeSystem.Instance.Minutes : Mathf.FloorToInt((localFallbackHour - WholeHour) * 60f);

        public event Action<int> OnHourChanged;

        private float localFallbackHour = 9.0f;
        private int lastRecordedHour = -1;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;

            InitDefaultLightingGradients();
        }

        private void Start()
        {
            AcquireSunLight();

            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged += HandleWorldHourChanged;
            }
        }

        private void OnDestroy()
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.OnHourChanged -= HandleWorldHourChanged;
            }
        }

        private void AcquireSunLight()
        {
            if (sunLight == null)
            {
                var lights = FindObjectsByType<Light>();
                foreach (var l in lights)
                {
                    if (l.type == LightType.Directional)
                    {
                        sunLight = l;
                        break;
                    }
                }
            }
        }

        private void Update()
        {
            if (WorldTimeSystem.Instance == null)
            {
                // Standalone fallback: 1 real second = 1 in-game minute
                localFallbackHour = (localFallbackHour + (Time.deltaTime / 60f)) % 24f;
                int h = Mathf.FloorToInt(localFallbackHour);
                if (h != lastRecordedHour)
                {
                    lastRecordedHour = h;
                    OnHourChanged?.Invoke(h);
                }
            }

            UpdateSunPosition(CurrentHour);
        }

        private void HandleWorldHourChanged(int hour)
        {
            OnHourChanged?.Invoke(hour);
        }

        private void UpdateSunPosition(float hour)
        {
            if (sunLight == null) AcquireSunLight();
            if (sunLight == null) return;

            // Rotate sun based on time of day (0 = midnight, 6 = dawn, 12 = noon, 18 = dusk)
            float sunAngle = (hour / 24f) * 360f - 90f;
            sunLight.transform.rotation = Quaternion.Euler(sunAngle, 170f, 0f);

            float t = hour / 24f;
            if (sunColorGradient != null)
            {
                sunLight.color = sunColorGradient.Evaluate(t);
            }

            if (sunIntensityCurve != null && sunIntensityCurve.length > 0)
            {
                sunLight.intensity = Mathf.Max(0f, sunIntensityCurve.Evaluate(t));
            }
            else
            {
                // A missing or empty curve evaluates to 0, which silently renders the entire
                // world black. Fall back to a guaranteed-visible daylight floor instead.
                sunLight.intensity = Mathf.Max(0.35f, sunLight.intensity);
            }
        }

        public void SetTimeOfDay(float hour)
        {
            if (WorldTimeSystem.Instance != null)
            {
                WorldTimeSystem.Instance.SetCalendarAndClock(WorldTimeSystem.Instance.Year, WorldTimeSystem.Instance.Month, WorldTimeSystem.Instance.Day, hour);
            }
            else
            {
                localFallbackHour = Mathf.Repeat(hour, 24f);
            }

            UpdateSunPosition(CurrentHour);
        }

        private void InitDefaultLightingGradients()
        {
            if (sunColorGradient == null || sunColorGradient.colorKeys.Length == 0)
            {
                sunColorGradient = new Gradient();
                var colorKeys = new GradientColorKey[]
                {
                    new GradientColorKey(new Color(0.05f, 0.05f, 0.15f), 0.0f),  // Midnight (dark indigo)
                    new GradientColorKey(new Color(1.0f, 0.55f, 0.35f), 0.25f),  // Dawn (warm saffron)
                    new GradientColorKey(new Color(1.0f, 0.98f, 0.90f), 0.5f),   // Noon (bright tropical sunlight)
                    new GradientColorKey(new Color(1.0f, 0.45f, 0.25f), 0.75f),  // Dusk (golden orange)
                    new GradientColorKey(new Color(0.05f, 0.05f, 0.15f), 1.0f)   // Night
                };
                var alphaKeys = new GradientAlphaKey[]
                {
                    new GradientAlphaKey(1.0f, 0.0f),
                    new GradientAlphaKey(1.0f, 1.0f)
                };
                sunColorGradient.SetKeys(colorKeys, alphaKeys);
            }

            if (sunIntensityCurve == null || sunIntensityCurve.length == 0)
            {
                sunIntensityCurve = BuildDefaultSunIntensityCurve();
            }
        }

        /// <summary>
        /// Daylight intensity envelope across a 24h day, keyed on normalized time.
        /// Exposed as a factory so the runtime fallback and the editor default can never diverge.
        /// </summary>
        private static AnimationCurve BuildDefaultSunIntensityCurve()
        {
            return new AnimationCurve(
                new Keyframe(0.0f, 0.05f),
                new Keyframe(0.25f, 0.6f),
                new Keyframe(0.5f, 1.3f),
                new Keyframe(0.75f, 0.6f),
                new Keyframe(1.0f, 0.05f)
            );
        }
    }
}
