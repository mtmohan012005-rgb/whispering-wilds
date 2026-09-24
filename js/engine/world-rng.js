/**
 * The Whispering Wilds (Kaattu Vazhi) - Deterministic PRNG
 * High-performance, reproducible Mulberry32 random number generator.
 * Used for all procedural asset scattering, foliage instancing, resource placement, and wildlife routines.
 */

var WorldRNG = (typeof window !== 'undefined' && window.WorldRNG) ? window.WorldRNG : class WorldRNG {
  constructor(seed = 133742) {
    this.initialSeed = seed;
    this.s = seed;
  }

  setSeed(seed) {
    this.initialSeed = seed;
    this.s = seed;
  }

  reset() {
    this.s = this.initialSeed;
  }

  // Returns pseudo-random float in [0, 1)
  next() {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns float in [min, max)
  range(min, max) {
    return min + this.next() * (max - min);
  }

  // Returns integer in [min, max]
  rangeInt(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  // Picks random element from array
  choice(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(this.next() * arr.length)];
  }

  // Shuffles array in-place deterministically
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }
}

if (typeof window !== 'undefined') {
  window.WorldRNG = WorldRNG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorldRNG };
}
