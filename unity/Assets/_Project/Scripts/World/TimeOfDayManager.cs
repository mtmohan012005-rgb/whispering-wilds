using System;
using UnityEngine;

namespace WhisperingWilds.World
{
    /// <summary>
    /// Manages the 24-hour day/night cycle and drives directional sunlight and NPC schedules.
    /// </summary>
    public class TimeOfDayManager : MonoBehaviour
    {
        public static TimeOfDayManager Instance { get; private set; }

        [Header("Time Configuration")]
        [Range(0f, 24f)] [SerializeField] private float timeOfDay = 9.0f; // 09:00 AM start
        [SerializeField] private float dayDurationMinutes = 24.0f; // 1 real minute = 1 in-game hour
        [SerializeField] private bool pauseTime = false;

        [Header("Sun & Lighting")]
        [SerializeField] private Light sunLight;
        [SerializeField] private Gradient sunColorGradient;
        [SerializeField] private AnimationCurve sunIntensityCurve;

        public float CurrentHour => timeOfDay;
        public int WholeHour => Mathf.FloorToInt(timeOfDay);
        public int Minutes => Mathf.FloorToInt((timeOfDay - WholeHour) * 60f);

        public event Action<int> OnHourChanged;

        private int lastRecordedHour = -1;

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
            if (!pauseTime)
            {
                // Advance time
                float hoursPerSecond = 24f / (dayDurationMinutes * 60f);
                timeOfDay = (timeOfDay + hoursPerSecond * Time.deltaTime) % 24f;
            }

            UpdateSunPosition();
            CheckHourChange();
        }

        private void UpdateSunPosition()
        {
            if (sunLight == null) return;

            // Rotate sun based on time of day (0 = midnight, 6 = dawn, 12 = noon, 18 = dusk)
            float sunAngle = (timeOfDay / 24f) * 360f - 90f;
            sunLight.transform.rotation = Quaternion.Euler(sunAngle, 170f, 0f);

            // Sun color & intensity
            float t = timeOfDay / 24f;
            if (sunColorGradient != null)
            {
                sunLight.color = sunColorGradient.Evaluate(t);
            }

            if (sunIntensityCurve != null)
            {
                sunLight.intensity = sunIntensityCurve.Evaluate(t);
            }
        }

        private void CheckHourChange()
        {
            int currentHour = WholeHour;
            if (currentHour != lastRecordedHour)
            {
                lastRecordedHour = currentHour;
                OnHourChanged?.Invoke(currentHour);
            }
        }

        public void SetTimeOfDay(float hour)
        {
            timeOfDay = Mathf.Repeat(hour, 24f);
            UpdateSunPosition();
            CheckHourChange();
        }
    }
}
