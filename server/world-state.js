// ============================================================================
// THE WHISPERING WILDS - ROOM-LEVEL STATEFUL WORLD SYNC
// ============================================================================

class RoomWorldState {
    constructor(roomCode, seed = 12345) {
        this.roomCode = roomCode;
        this.seed = seed;
        this.createdAt = Date.now();

        // Synchronized environmental and puzzle states
        this.state = {
            seed: this.seed,
            timeOfDayMinutes: 360, // 06:00 AM Sunrise default
            weather: 'clear',
            mechanisms: {
                waterwheel: {
                    dialA: 0,
                    dialB: 0,
                    dialC: 0,
                    sluiceOpen: false,
                    solved: false
                },
                campfire: {
                    lit: false,
                    fuelLevel: 0
                }
            },
            unlockedRegions: ['chennai'],
            completedQuests: []
        };
    }

    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    updateMechanism(mechanismId, payload) {
        if (!this.state.mechanisms[mechanismId]) {
            this.state.mechanisms[mechanismId] = {};
        }
        Object.assign(this.state.mechanisms[mechanismId], payload);

        // Auto-check Chola waterwheel solution (e.g. 3, 2, 4 aligns sluice)
        if (mechanismId === 'waterwheel') {
            const ww = this.state.mechanisms.waterwheel;
            if (ww.dialA === 3 && ww.dialB === 2 && ww.dialC === 4) {
                ww.sluiceOpen = true;
                ww.solved = true;
            }
        }
        return this.state.mechanisms[mechanismId];
    }

    unlockRegion(regionId) {
        if (!this.state.unlockedRegions.includes(regionId)) {
            this.state.unlockedRegions.push(regionId);
            return true;
        }
        return false;
    }

    setWeather(weatherType) {
        this.state.weather = weatherType;
    }

    setTimeOfDay(minutes) {
        this.state.timeOfDayMinutes = minutes % 1440;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomWorldState;
}
