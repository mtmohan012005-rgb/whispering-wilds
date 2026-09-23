/**
 * The Whispering Wilds (Kaattu Vazhi)
 * Daily Routine & Living World Clock System (DailyRoutineSystem)
 * Synchronizes NPC occupations, household chores, and ambient village activity with
 * the 24-hour world clock, weather variations, and staggered transitions.
 */

class DailyRoutineSystem {
  constructor() {
    // Current world time in decimal hours (e.g. 9.5 = 09:30 AM)
    this.currentHour = 9.0;
    this.currentWeather = 'clear';

    // Staggered offsets for individual NPCs to avoid robotic simultaneous state changes
    this.staggerOffsets = new Map(); // npcId -> offsetMinutes (-15 to +15)

    // Daily milestones (Section 30)
    this.milestones = [
      { hour: 5.0, phase: 'DAWN_PREPARATION', desc: 'Shop prep, street cleaning, flower sorting, tea stoves lit' },
      { hour: 6.0, phase: 'MORNING_KOLAM', desc: 'Entrance sweeping, rice-flour kolam drawing, temple bell chimes' },
      { hour: 8.0, phase: 'WORK_COMMENCE', desc: 'Shops open, paddy field labor begins, commuters increase' },
      { hour: 12.0, phase: 'MIDDAY_HEAT', desc: 'Sun at peak, reduced pedestrian pace, veranda shade rest' },
      { hour: 14.0, phase: 'AFTERNOON_WORK', desc: 'Artisans resume carving, tool maintenance, net mending' },
      { hour: 17.0, phase: 'EVENING_BAZAAR', desc: 'Markets bustling, tea kadai rush, vibrant street chatter' },
      { hour: 19.0, phase: 'DUSK_LAMPLIGHT', desc: 'Kuthu vilakku and agal lamps lit, evening temple pooja' },
      { hour: 21.0, phase: 'NIGHT_WIND_DOWN', desc: 'Dinner served on plantain leaves, shops shuttering' },
      { hour: 22.0, phase: 'NOCTURNAL_STILLNESS', desc: 'Quiet streets, crickets, distant coastal breeze' }
    ];
  }

  getNPCOffset(npcId) {
    if (!this.staggerOffsets.has(npcId)) {
      // Deterministic offset based on ID hash
      let hash = 0;
      for (let i = 0; i < npcId.length; i++) hash = (hash << 5) - hash + npcId.charCodeAt(i);
      const offset = ((Math.abs(hash) % 31) - 15) / 60.0; // -0.25h to +0.25h
      this.staggerOffsets.set(npcId, offset);
    }
    return this.staggerOffsets.get(npcId);
  }

  getCurrentPhase(hour = this.currentHour) {
    let active = this.milestones[0];
    for (const m of this.milestones) {
      if (hour >= m.hour) {
        active = m;
      }
    }
    return active;
  }

  update(worldClockHour, weatherType = 'clear') {
    this.currentHour = worldClockHour !== undefined ? worldClockHour : this.currentHour;
    this.currentWeather = weatherType;

    // Check weather modifications (Section 31)
    const isHeavyRain = (weatherType === 'storm' || weatherType === 'rain');

    // Notify living world NPCs if present
    if (window.livingWorld && window.livingWorld.npcs) {
      for (const [npcId, npc] of window.livingWorld.npcs.entries()) {
        const offset = this.getNPCOffset(npcId);
        const adjustedHour = (this.currentHour + offset + 24) % 24;
        const phase = this.getCurrentPhase(adjustedHour);

        if (isHeavyRain && npc.occupation !== 'tea_master') {
          // Seek nearest sheltered canopy during storm
          npc.currentWeatherBehavior = 'SHELTER_INDOORS';
        } else {
          npc.currentWeatherBehavior = 'NORMAL';
        }

        // Apply phase label if appropriate
        npc.currentDailyPhase = phase.phase;
      }
    }
  }

  getTimeFormatted() {
    const totalMinutes = Math.floor(this.currentHour * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${ampm}`;
  }
}

window.DailyRoutineSystem = DailyRoutineSystem;
