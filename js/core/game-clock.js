/**
 * The Whispering Wilds (Kaattu Vazhi) - Deterministic Game Clock
 * Single authoritative source of world time, 24-hour day/night cycle, seasons,
 * fast-forward, sleep advance, and deterministic ticking across all world systems.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const clock = factory();
    root.GameClock = clock;
    if (typeof window !== 'undefined') {
      window.GameClock = clock;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Authentic Tamil Nadu Seasonal Cycle
  const SEASONS = Object.freeze([
    { id: 'harvest_thai', nameTa: 'தை அறுவடை (Thai Harvest)', months: [1, 2], tempMod: 0, rainChance: 0.1 },
    { id: 'chithirai_summer', nameTa: 'சித்திரை வெயில் (Chithirai Summer)', months: [3, 4, 5], tempMod: 4.5, rainChance: 0.05 },
    { id: 'adi_perukku', nameTa: 'ஆடிப் பெருக்கு (Aadi River Inflow)', months: [6, 7, 8], tempMod: 1.0, rainChance: 0.35 },
    { id: 'karthigai_monsoon', nameTa: 'கார்த்திகை அடைமழை (Karthigai Monsoon)', months: [9, 10, 11, 12], tempMod: -2.5, rainChance: 0.75 }
  ]);

  class GameClockEngine {
    constructor() {
      // 1 real second = 1 game minute by default (timeScale = 60)
      this.timeScale = 60.0;
      this.isPaused = false;

      // Deterministic Date State
      this.day = 14;           // Day 14 (Pongal festival day)
      this.month = 1;          // January (Thai)
      this.year = 1924;        // Historic blueprint era
      this.hour = 9;           // 09:00 AM start
      this.minute = 0;
      this.second = 0;

      this.currentSeason = SEASONS[0];
      this._accumulatedSeconds = 0;

      // Synchronize with GameState if available
      this._syncWithGameState();
    }

    /**
     * Total world time in fractional 24-hour format (e.g. 9.5 = 09:30 AM)
     */
    get time() {
      return this.hour + (this.minute / 60) + (this.second / 3600);
    }

    /**
     * Formatted 12-hour time string with AM/PM (e.g. "9:00 AM")
     */
    get formattedTime() {
      const h12 = this.hour % 12 === 0 ? 12 : this.hour % 12;
      const mStr = String(this.minute).padStart(2, '0');
      const period = this.hour >= 12 ? 'PM' : 'AM';
      return `${h12}:${mStr} ${period}`;
    }

    /**
     * Formatted 24-hour military string (e.g. "09:00")
     */
    get militaryTime() {
      return `${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}`;
    }

    /**
     * Sun altitude / daylight factor: 0.0 (midnight) to 1.0 (noon)
     */
    get daylightFactor() {
      // Peak at 12:00, dawn at 06:00, dusk at 18:00
      const t = this.time;
      if (t < 5.5 || t > 18.5) return 0.0; // Night
      if (t >= 7.0 && t <= 17.0) return 1.0; // Full day
      if (t < 7.0) return (t - 5.5) / 1.5;   // Sunrise
      return (18.5 - t) / 1.5;              // Sunset
    }

    get isNight() {
      const t = this.time;
      return t < 6.0 || t > 18.0;
    }

    /**
     * Advance the clock by delta time in seconds
     */
    update(deltaRealSeconds) {
      if (this.isPaused || deltaRealSeconds <= 0) return;

      const deltaGameSeconds = deltaRealSeconds * this.timeScale;
      this.advanceSeconds(deltaGameSeconds);
    }

    advanceSeconds(gameSeconds) {
      this.second += gameSeconds;
      if (this.second >= 60) {
        const addedMinutes = Math.floor(this.second / 60);
        this.second %= 60;
        this.minute += addedMinutes;

        if (this.minute >= 60) {
          const addedHours = Math.floor(this.minute / 60);
          this.minute %= 60;
          this.hour += addedHours;

          if (this.hour >= 24) {
            const addedDays = Math.floor(this.hour / 24);
            this.hour %= 24;
            this.advanceDays(addedDays);
          }
        }

        this._onTimeTick();
      }
    }

    advanceHours(hours) {
      const addedMinutes = Math.floor(hours * 60);
      this.minute += addedMinutes;
      if (this.minute >= 60) {
        const addedH = Math.floor(this.minute / 60);
        this.minute %= 60;
        this.hour = (this.hour + addedH) % 24;
      }
      this._onTimeTick();
    }

    advanceDays(days) {
      this.day += days;
      // 30 days per month simplification for deterministic world calendar
      if (this.day > 30) {
        const addedMonths = Math.floor((this.day - 1) / 30);
        this.day = ((this.day - 1) % 30) + 1;
        this.month += addedMonths;
        if (this.month > 12) {
          const addedYears = Math.floor((this.month - 1) / 12);
          this.month = ((this.month - 1) % 12) + 1;
          this.year += addedYears;
        }
      }
      this._updateSeason();
    }

    /**
     * Sets exact time of day
     */
    setTime(hour, minute = 0, second = 0) {
      this.hour = Math.max(0, Math.min(23, Math.floor(hour)));
      this.minute = Math.max(0, Math.min(59, Math.floor(minute)));
      this.second = Math.max(0, Math.min(59, Math.floor(second)));
      this._onTimeTick();
    }

    /**
     * Advance clock for resting/sleeping
     */
    sleep(hours) {
      const advanceH = Math.max(0.5, Number(hours) || 8.0);
      this.advanceHours(advanceH);
      return {
        hoursSlept: advanceH,
        newTime: this.formattedTime,
        isDawn: this.hour >= 5 && this.hour <= 7
      };
    }

    pause() {
      this.isPaused = true;
    }

    resume() {
      this.isPaused = false;
    }

    setTimeScale(scale) {
      this.timeScale = Math.max(0, Number(scale) || 60.0);
    }

    _updateSeason() {
      const s = SEASONS.find(season => season.months.includes(this.month));
      if (s && s.id !== this.currentSeason.id) {
        this.currentSeason = s;
        if (typeof window !== 'undefined' && window.EventBus) {
          window.EventBus.emit('SEASON_CHANGED', this.currentSeason);
        }
      }
    }

    _onTimeTick() {
      this._syncWithGameState();

      if (typeof window !== 'undefined' && window.EventBus) {
        window.EventBus.emit('TIME_CHANGED', {
          time: this.time,
          formatted: this.formattedTime,
          military: this.militaryTime,
          daylight: this.daylightFactor,
          isNight: this.isNight,
          day: this.day,
          season: this.currentSeason.id
        });
      }
    }

    _syncWithGameState() {
      if (typeof window !== 'undefined' && window.GameState && window.GameState.world) {
        window.GameState.world.time = this.time;
        window.GameState.world.season = this.currentSeason.id;
        window.GameState.time = this.time;
      }
    }

    serialize() {
      return {
        day: this.day,
        month: this.month,
        year: this.year,
        hour: this.hour,
        minute: this.minute,
        second: this.second,
        timeScale: this.timeScale,
        season: this.currentSeason.id
      };
    }

    deserialize(data) {
      if (!data) return;
      if (typeof data.day === 'number') this.day = data.day;
      if (typeof data.month === 'number') this.month = data.month;
      if (typeof data.year === 'number') this.year = data.year;
      if (typeof data.hour === 'number') this.hour = data.hour;
      if (typeof data.minute === 'number') this.minute = data.minute;
      if (typeof data.second === 'number') this.second = data.second;
      if (typeof data.timeScale === 'number') this.timeScale = data.timeScale;
      this._updateSeason();
      this._syncWithGameState();
    }
  }

  return new GameClockEngine();
});
