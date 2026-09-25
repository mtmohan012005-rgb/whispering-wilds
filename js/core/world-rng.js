/**
 * The Whispering Wilds (Kaattu Vazhi) - Core Deterministic World PRNG
 * Seeded Mulberry32 & splitmix32 pseudorandom generator for deterministic world generation,
 * sector layout scattering, weather shifts, wildlife encounters, and procedural variation.
 * Guarantees 100% reproducible results given identical world seed.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const rng = factory();
    root.WorldRNG = rng.WorldRNG;
    root.GlobalRNG = rng.instance;
    if (typeof window !== 'undefined') {
      window.WorldRNG = rng.WorldRNG;
      window.GlobalRNG = rng.instance;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class WorldRNG {
    constructor(seed = 133742) {
      this.initialSeed = seed;
      this.s = seed;
    }

    setSeed(seed) {
      this.initialSeed = Number(seed) || 133742;
      this.s = this.initialSeed;
    }

    reset() {
      this.s = this.initialSeed;
    }

    /**
     * Derive a deterministic child PRNG for a specific sector or entity
     */
    derive(subSeed) {
      const hash = this._hashString(String(subSeed));
      return new WorldRNG((this.initialSeed ^ hash) >>> 0);
    }

    _hashString(str) {
      let h = 0x811c9dc5;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
      return h >>> 0;
    }

    // Returns float in [0, 1)
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

    // Returns integer in [min, max] inclusive
    rangeInt(min, max) {
      return Math.floor(this.range(min, max + 1));
    }

    // Returns true with given probability [0..1]
    chance(prob = 0.5) {
      return this.next() < prob;
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

    // 2D position within rectangle
    pointInRect(minX, maxX, minZ, maxZ) {
      return {
        x: this.range(minX, maxX),
        z: this.range(minZ, maxZ)
      };
    }

    // Point in radius
    pointInCircle(centerX, centerZ, radius) {
      const r = radius * Math.sqrt(this.next());
      const theta = this.next() * 2 * Math.PI;
      return {
        x: centerX + r * Math.cos(theta),
        z: centerZ + r * Math.sin(theta)
      };
    }
  }

  const instance = new WorldRNG(133742);
  return { WorldRNG, instance };
});
