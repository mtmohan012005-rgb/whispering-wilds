using System;
using UnityEngine;

namespace WhisperingWilds.World
{
    public enum DayPhase
    {
        Dawn = 0,         // 05:00 - 07:00
        Morning = 1,      // 07:00 - 11:30
        Noon = 2,         // 11:30 - 14:00
        Afternoon = 3,    // 14:00 - 17:00
        Sunset = 4,       // 17:00 - 18:30
        Evening = 5,      // 18:30 - 21:00
        Night = 6,        // 21:00 - 24:00
        LateNight = 7     // 00:00 - 05:00
    }

    /// <summary>
    /// Single authoritative master calendar and world clock for The Whispering Wilds.
    /// Drives year, month, day, 24-hour cycle, DayPhase, and the 4 Tamil Nadu seasons.
    /// Supports developer fast-forwarding and batch time-skipping for sleeping/offline simulation.
    /// </summary>
    [DisallowMultipleComponent]
    public class WorldTimeSystem : MonoBehaviour
    {
        public static WorldTimeSystem Instance { get; private set; }

        [Header("Calendar Setup")]
        [Tooltip("Starting in-game year (e.g. 2026).")]
        [SerializeField] private int year = 2026;

        [Tooltip("Current month (1 = January, 12 = December).")]
        [Range(1, 12)] [SerializeField] private int month = 10; // Start in October (NE Monsoon)

        [Tooltip("Current day of month (1 to 30).")]
        [Range(1, 30)] [SerializeField] private int day = 15;

        [Header("Clock Setup")]
        [Tooltip("Current fractional hour of the day (0.0 to 24.0).")]
        [Range(0f, 24f)] [SerializeField] private float hourOfDay = 9.0f; // 09:00 AM

        [Header("Simulation Speed Configuration")]
        [Tooltip("In-game minutes elapsed per one real-time second. E.g. 1.0 = 1 real minute yields 1 game hour.")]
        [SerializeField] private float inGameMinutesPerRealSecond = 1.0f;

        [Tooltip("Multiplier for fast-forwarding during testing or sleep (1x, 10x, 100x, 1000x).")]
        [SerializeField] private float fastForwardMultiplier = 1.0f;

        [SerializeField] private bool pauseClock = false;

        // Current state caching
        public int Year => year;
        public int Month => month;
        public int Day => day;
        public float HourOfDay => hourOfDay;
        public int WholeHour => Mathf.FloorToInt(hourOfDay);
        public int CurrentHour => WholeHour;
        public int Minutes => Mathf.FloorToInt((hourOfDay - WholeHour) * 60f);
        public int Seconds => Mathf.FloorToInt((((hourOfDay - WholeHour) * 60f) - Minutes) * 60f);

        public TamilNaduSeason CurrentSeason { get; private set; } = TamilNaduSeason.NortheastMonsoon;
        public DayPhase CurrentDayPhase { get; private set; } = DayPhase.Morning;
        public float FastForwardMultiplier => fastForwardMultiplier;
        public bool IsPaused => pauseClock;

        // Cumulative simulation counters
        public double TotalElapsedInGameHours { get; private set; } = 0.0;
        public int TotalElapsedInGameDays { get; private set; } = 0;

        // Events
        public event Action<int> OnHourChanged;
        public event Action<int, int, int> OnDayChanged; // day, month, year
        public event Action<TamilNaduSeason> OnSeasonChanged;
        public event Action<DayPhase> OnDayPhaseChanged;
        public event Action<double> OnWorldTimeAdvanced; // elapsed in-game hours

        private int lastRecordedHour = -1;
        private int lastRecordedDay = -1;
        private TamilNaduSeason lastRecordedSeason = (TamilNaduSeason)(-1);
        private DayPhase lastRecordedPhase = (DayPhase)(-1);

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

            UpdateSeasonAndPhase(true);
        }

        private void Update()
        {
            if (pauseClock) return;

            // Calculate hours to advance this frame
            float deltaHours = (inGameMinutesPerRealSecond * fastForwardMultiplier * Time.deltaTime) / 60f;
            AdvanceTimeInternal(deltaHours, false);
        }

        /// <summary>
        /// Increments the world time and handles rollover across hours, days, months, and years.
        /// </summary>
        private void AdvanceTimeInternal(float deltaHours, bool isBatchSimulation)
        {
            if (deltaHours <= 0f) return;

            hourOfDay += deltaHours;
            TotalElapsedInGameHours += deltaHours;

            // Day rollover (assuming a uniform 30-day simplified Tamil calendar per month)
            while (hourOfDay >= 24f)
            {
                hourOfDay -= 24f;
                day++;
                TotalElapsedInGameDays++;

                if (day > 30)
                {
                    day = 1;
                    month++;
                    if (month > 12)
                    {
                        month = 1;
                        year++;
                    }
                }
            }

            UpdateSeasonAndPhase(isBatchSimulation);
        }

        private void UpdateSeasonAndPhase(bool notifyAll)
        {
            // 1. Day Phase
            DayPhase newPhase = CalculateDayPhase(hourOfDay);
            if (newPhase != lastRecordedPhase || notifyAll)
            {
                lastRecordedPhase = newPhase;
                CurrentDayPhase = newPhase;
                OnDayPhaseChanged?.Invoke(newPhase);
            }

            // 2. Hour Change
            int currentWholeHour = WholeHour;
            if (currentWholeHour != lastRecordedHour || notifyAll)
            {
                lastRecordedHour = currentWholeHour;
                OnHourChanged?.Invoke(currentWholeHour);
            }

            // 3. Day Change
            if (day != lastRecordedDay || notifyAll)
            {
                lastRecordedDay = day;
                OnDayChanged?.Invoke(day, month, year);
            }

            // 4. Season Change
            TamilNaduSeason newSeason = TamilNaduSeasonExtensions.GetSeasonForMonth(month);
            if (newSeason != lastRecordedSeason || notifyAll)
            {
                lastRecordedSeason = newSeason;
                CurrentSeason = newSeason;
                Debug.Log($"<color=#FFCC00><b>[WorldTimeSystem]</b></color> Seasonal calendar transition: {newSeason} ({newSeason.GetTamilName()})");
                OnSeasonChanged?.Invoke(newSeason);
            }
        }

        public static DayPhase CalculateDayPhase(float hour)
        {
            if (hour >= 5.0f && hour < 7.0f) return DayPhase.Dawn;
            if (hour >= 7.0f && hour < 11.5f) return DayPhase.Morning;
            if (hour >= 11.5f && hour < 14.0f) return DayPhase.Noon;
            if (hour >= 14.0f && hour < 17.0f) return DayPhase.Afternoon;
            if (hour >= 17.0f && hour < 18.5f) return DayPhase.Sunset;
            if (hour >= 18.5f && hour < 21.0f) return DayPhase.Evening;
            if (hour >= 21.0f && hour < 24.0f) return DayPhase.Night;
            return DayPhase.LateNight;
        }

        /// <summary>
        /// Advances the world simulation in a single efficient leap without frame-by-frame updates.
        /// Essential for sleep, fast-travel, resting, or offline catch-up.
        /// </summary>
        public void AdvanceWorldSimulation(double elapsedHours)
        {
            if (elapsedHours <= 0) return;

            Debug.Log($"<color=#00D2FF><b>[WorldTimeSystem]</b></color> Advancing batch world simulation by {elapsedHours:F2} hours...");
            AdvanceTimeInternal((float)elapsedHours, true);
            OnWorldTimeAdvanced?.Invoke(elapsedHours);
        }

        /// <summary>
        /// Directly sets the clock time of day.
        /// </summary>
        public void SetTime(float targetHour)
        {
            hourOfDay = Mathf.Repeat(targetHour, 24f);
            UpdateSeasonAndPhase(true);
        }

        /// <summary>
        /// Directly sets the calendar date and clock time.
        /// </summary>
        public void SetCalendarAndClock(int targetYear, int targetMonth, int targetDay, float targetHour)
        {
            year = targetYear;
            month = Mathf.Clamp(targetMonth, 1, 12);
            day = Mathf.Clamp(targetDay, 1, 30);
            hourOfDay = Mathf.Repeat(targetHour, 24f);

            UpdateSeasonAndPhase(true);
        }

        /// <summary>
        /// Directly switches the active Tamil Nadu seasonal phase.
        /// </summary>
        public void SetSeason(TamilNaduSeason targetSeason)
        {
            switch (targetSeason)
            {
                case TamilNaduSeason.Summer: month = 4; break;
                case TamilNaduSeason.SouthwestMonsoon: month = 7; break;
                case TamilNaduSeason.NortheastMonsoon: month = 11; break;
                case TamilNaduSeason.Winter: month = 1; break;
            }
            UpdateSeasonAndPhase(true);
        }

        /// <summary>
        /// Developer tool fast-forward mode (1x, 10x, 100x, 1000x).
        /// </summary>
        public void SetFastForwardMultiplier(float multiplier)
        {
            fastForwardMultiplier = Mathf.Max(0.1f, multiplier);
            Debug.Log($"[WorldTimeSystem] Simulation speed set to {fastForwardMultiplier}x");
        }

        public void SetClockPaused(bool paused)
        {
            pauseClock = paused;
        }

        public string GetFormattedDateString()
        {
            return $"Year {year}, Month {month:00}, Day {day:00}";
        }

        public string GetFormattedTimeString()
        {
            return $"{WholeHour:00}:{Minutes:00}:{Seconds:00}";
        }
    }
}
