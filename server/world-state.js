// ============================================================================
// THE WHISPERING WILDS - ROOM-LEVEL STATEFUL WORLD SYNC
// ============================================================================

function asIntInRange(min, max) {
    return (value) => {
        const n = Number(value);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) return undefined;
        return n;
    };
}

function asBoolean(value) {
    if (typeof value !== 'boolean') return undefined;
    return value;
}

function asNumberInRange(min, max) {
    return (value) => {
        const n = Number(value);
        if (!Number.isFinite(n) || n < min || n > max) return undefined;
        return n;
    };
}

const MECHANISM_RULES = {
    waterwheel: {
        dialA: asIntInRange(0, 9),
        dialB: asIntInRange(0, 9),
        dialC: asIntInRange(0, 9)
    },
    campfire: {
        lit: asBoolean,
        fuelLevel: asNumberInRange(0, 100)
    },
    temple_folklore: {
        dial0: asIntInRange(0, 2),
        dial1: asIntInRange(0, 2),
        dial2: asIntInRange(0, 2)
    },
    navagraha_shadow: {
        pedestal0Angle: asNumberInRange(0, 360),
        pedestal1Angle: asNumberInRange(0, 360),
        pedestal2Angle: asNumberInRange(0, 360)
    },
    acoustic_pillar: {
        struckPillar: asIntInRange(0, 4)
    }
};

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
                },
                temple_folklore: {
                    dial0: 0,
                    dial1: 0,
                    dial2: 0,
                    solved: false
                },
                navagraha_shadow: {
                    pedestal0Angle: 0,
                    pedestal1Angle: 0,
                    pedestal2Angle: 0,
                    solved: false
                },
                acoustic_pillar: {
                    currentStep: 0,
                    lastStruck: -1,
                    solved: false
                }
            },
            unlockedRegions: ['chennai'],
            completedQuests: []
        };
    }

    getSnapshot() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Apply a client mechanism update through a strict per-mechanism allowlist.
     * Unknown mechanism IDs, unknown fields and out-of-range values are rejected
     * rather than merged into room state.
     */
    updateMechanism(mechanismId, payload) {
        const rule = MECHANISM_RULES[mechanismId];
        if (!rule) {
            return { valid: false, reason: 'Unknown mechanism' };
        }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return { valid: false, reason: 'Invalid mechanism payload' };
        }

        const suppliedFields = Object.keys(payload);
        const unknownField = suppliedFields.find((field) => !Object.prototype.hasOwnProperty.call(rule, field));
        if (unknownField) {
            return { valid: false, reason: `Field "${unknownField}" is not permitted on ${mechanismId}` };
        }

        const accepted = {};
        for (const [field, sanitizer] of Object.entries(rule)) {
            if (!Object.prototype.hasOwnProperty.call(payload, field)) continue;
            const value = sanitizer(payload[field]);
            if (value === undefined) {
                return { valid: false, reason: `Invalid value for ${field}` };
            }
            accepted[field] = value;
        }

        if (Object.keys(accepted).length === 0) {
            return { valid: false, reason: 'No permitted mechanism fields supplied' };
        }

        Object.assign(this.state.mechanisms[mechanismId], accepted);

        // Auto-check Chola waterwheel solution (e.g. 3, 2, 4 aligns sluice).
        // Clients can never set solved state directly.
        if (mechanismId === 'waterwheel') {
            const ww = this.state.mechanisms.waterwheel;
            if (ww.dialA === 3 && ww.dialB === 2 && ww.dialC === 4) {
                ww.sluiceOpen = true;
                ww.solved = true;
            }
        } else if (mechanismId === 'temple_folklore') {
            const tf = this.state.mechanisms.temple_folklore;
            if (tf.dial0 === 0 && tf.dial1 === 2 && tf.dial2 === 1) {
                tf.solved = true;
            }
        } else if (mechanismId === 'navagraha_shadow') {
            const ns = this.state.mechanisms.navagraha_shadow;
            const d0 = Math.abs((ns.pedestal0Angle % 360) - 45);
            const d1 = Math.abs((ns.pedestal1Angle % 360) - 90);
            const d2 = Math.abs((ns.pedestal2Angle % 360) - 135);
            if (d0 <= 5 && d1 <= 5 && d2 <= 5) {
                ns.solved = true;
            }
        } else if (mechanismId === 'acoustic_pillar') {
            const ap = this.state.mechanisms.acoustic_pillar;
            const expectedSequence = [0, 2, 3, 1, 4];
            if (accepted.struckPillar === expectedSequence[ap.currentStep]) {
                ap.currentStep++;
                ap.lastStruck = accepted.struckPillar;
                if (ap.currentStep >= expectedSequence.length) {
                    ap.solved = true;
                }
            } else {
                ap.currentStep = (accepted.struckPillar === expectedSequence[0]) ? 1 : 0;
                ap.lastStruck = accepted.struckPillar;
            }
        }
        return { valid: true, state: this.state.mechanisms[mechanismId] };
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
