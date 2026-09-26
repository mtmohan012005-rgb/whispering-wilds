/**
 * The Whispering Wilds (Kaattu Vazhi / Thadam)
 * Advanced Terrain Elevation & Geological Simulation System
 *
 * Implements heightfield-based elevation curves, regional transitions,
 * river valley cuts, Western Ghats escarpments, analytical normal computation,
 * and 11-layer PBR material classification.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TerrainElevationSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ─── 11 PBR MATERIAL SURFACE TYPES ─────────────────────────────────────────
  const MATERIAL_LAYERS = Object.freeze({
    DRY_RED_SOIL:       { id: 'dry_red_soil',       hex: '#8B3A2B', roughness: 0.88, metalness: 0.0 },
    DARK_WET_SOIL:      { id: 'dark_wet_soil',      hex: '#3D2B1F', roughness: 0.62, metalness: 0.0 },
    AGRICULTURAL_SOIL:  { id: 'agricultural_soil',  hex: '#4A4028', roughness: 0.85, metalness: 0.0 },
    DELTA_GRASS:        { id: 'delta_grass',        hex: '#4A6B2F', roughness: 0.78, metalness: 0.0 },
    DRY_ROADSIDE_GRASS: { id: 'dry_roadside_grass', hex: '#8A8242', roughness: 0.82, metalness: 0.0 },
    COASTAL_GRANITE:    { id: 'coastal_granite',    hex: '#7D786D', roughness: 0.60, metalness: 0.05 },
    WET_MOUNTAIN_ROCK:  { id: 'wet_mountain_rock',  hex: '#3B3D38', roughness: 0.35, metalness: 0.08 },
    SHORE_SAND:         { id: 'shore_sand',         hex: '#C2B280', roughness: 0.70, metalness: 0.0 },
    MANGROVE_TIDAL_MUD: { id: 'mangrove_tidal_mud', hex: '#2C2621', roughness: 0.40, metalness: 0.02 },
    RICE_FIELD_WET:     { id: 'rice_field_wet',     hex: '#303822', roughness: 0.30, metalness: 0.04 },
    TEA_ESTATE_LOAM:    { id: 'tea_estate_loam',    hex: '#4D3220', roughness: 0.75, metalness: 0.0 }
  });

  class TerrainElevationSystem {
    constructor() {
      this.materials = MATERIAL_LAYERS;
    }

    /**
     * Authoritative elevation computation based on real Tamil Nadu geography.
     * Transitions seamlessly from coastal lowlands into Western Ghats peaks.
     */
    getElevation(x, z) {
      let y = 1.0;

      // ───────────────────────────────────────────────────────────────────────
      // A. CHENNAI & GEORGE TOWN (X: -300 to -180)
      // Coastal lowlands, subtle stormwater depressions, flat urban foundation.
      // ───────────────────────────────────────────────────────────────────────
      if (x < -180) {
        const coastalFalloff = Math.sin((x + 300) * 0.025) * 0.4;
        const streetGrading = Math.cos(z * 0.05) * 0.3;
        y = 1.5 + coastalFalloff + streetGrading;

        // Coastal harbor surf dip towards eastern boundary (Z < -60)
        if (z < -60) {
          const surfDrop = Math.max(0, (-60 - z) * 0.04);
          y -= surfDrop;
        }
      }

      // ───────────────────────────────────────────────────────────────────────
      // B. CHENGALPATTU / VILLUPURAM (X: -180 to -80)
      // Rolling red laterite plains, gentle mounds, ancient irrigation tanks (ery).
      // ───────────────────────────────────────────────────────────────────────
      else if (x >= -180 && x < -80) {
        const t = (x + 180) / 100; // 0.0 to 1.0
        const baseRise = 1.5 + t * 3.5;
        const redPlainsRoll = Math.sin(x * 0.04) * 1.2 + Math.cos(z * 0.04) * 0.9;
        const smallMound = Math.exp(-Math.pow((x + 130) / 25, 2) - Math.pow((z - 20) / 25, 2)) * 3.0;

        // Enclosed dry irrigation tank (ery) depression
        const eryDist = Math.hypot(x + 150, z + 40);
        const eryBed = eryDist < 30 ? Math.cos((eryDist / 30) * Math.PI) * 1.8 : 0;

        y = baseRise + redPlainsRoll + smallMound - eryBed;
      }

      // ───────────────────────────────────────────────────────────────────────
      // C. CAUVERY DELTA & PICHAVARAM MANGROVES (X: -80 to 30)
      // Exceptionally flat alluvial delta, rectangular paddy field cuts,
      // and deep winding tidal mangrove channels.
      // ───────────────────────────────────────────────────────────────────────
      else if (x >= -80 && x < 30) {
        const isMangroveSector = (z >= 30);

        if (isMangroveSector) {
          // Pichavaram Mangrove Basin (low tidal creeks dipping below sea level)
          const creekCurve1 = Math.sin(x * 0.08 + Math.cos(z * 0.06) * 2.5);
          const creekCurve2 = Math.cos(z * 0.09 - Math.sin(x * 0.05) * 2.0);
          const tidalChannel = Math.exp(-Math.pow(creekCurve1 * 1.4, 2)) * 2.2 +
                               Math.exp(-Math.pow(creekCurve2 * 1.2, 2)) * 1.8;

          // Mud banks rise subtly between tidal inlets
          y = 0.6 + Math.sin(x * 0.03 + z * 0.03) * 0.5 - tidalChannel;
          // Water surface is at y = 0.0; tidal creek channels drop to -0.6m
          y = Math.max(-0.8, Math.min(y, 1.8));
        } else {
          // Cauvery Delta Agricultural Granary (Paddy bunds & irrigation canals)
          const baseDelta = 1.2 + Math.sin(x * 0.02) * 0.4;
          // Irrigation canals running parallel to river
          const canalProfile = Math.sin(z * 0.12);
          const canalTrench = Math.exp(-Math.pow(canalProfile * 2.5, 2)) * 1.4;

          // Rectangular paddy field bunds (embankments)
          const bundGridX = Math.abs(Math.sin(x * 0.35)) > 0.85 ? 0.35 : 0;
          const bundGridZ = Math.abs(Math.sin(z * 0.35)) > 0.85 ? 0.35 : 0;

          y = baseDelta - canalTrench + (bundGridX + bundGridZ);
        }
      }

      // ───────────────────────────────────────────────────────────────────────
      // D. WESTERN GHATS & KOLLI HAIRPIN ESCARPMENT (X: 30 to 180)
      // Steep climbs, razor ridgelines, waterfall gorges, and continuous switchback terraces.
      // ───────────────────────────────────────────────────────────────────────
      else if (x >= 30 && x < 180) {
        const t = (x - 30) / 150; // 0.0 to 1.0
        // Exponential climb from 3.0m to 58.0m
        const ghatsRamp = Math.pow(t, 1.3) * 55.0;

        // Multi-octave mountain ridgeline folds
        const ridgeA = Math.sin(x * 0.035 + z * 0.045) * (14.0 * t);
        const ridgeB = Math.cos(x * 0.075 - z * 0.065) * (7.5 * t);
        const cragDetail = Math.sin(x * 0.15 + z * 0.18) * (3.0 * t);

        // Deep canyon / waterfall cleft along Z = -15
        const gorgeFactor = Math.exp(-Math.pow((z + 15) / 18, 2)) * (16.0 * t);

        // Hairpin road cuts: flattened terraces winding through the escarpment
        const roadWinding = Math.sin(x * 0.06 + Math.cos(z * 0.04) * 3.0);
        const roadTerrace = Math.exp(-Math.pow(roadWinding * 2.0, 2)) * 1.5;

        y = 2.5 + ghatsRamp + ridgeA + ridgeB + cragDetail - gorgeFactor + roadTerrace;
      }

      // ───────────────────────────────────────────────────────────────────────
      // E. NILGIRIS HIGH COUNTRY & TEA PLATEAUS (X: 180 to 300)
      // Rolling high-altitude plateau, terraced tea estate rows, shola pockets,
      // and prominent Doddabetta-style craggy summits (Y: 55m to 85m).
      // ───────────────────────────────────────────────────────────────────────
      else {
        const t = Math.min(1.0, (x - 180) / 120);
        const plateauBase = 55.0 + t * 18.0;

        // Undulating emerald tea garden contours
        const teaEstateRoll = Math.sin(x * 0.045) * 6.5 + Math.cos(z * 0.05) * 5.0;
        // Fine terracing steps (mimicking tea terrace rows)
        const teaTerraceSteps = (Math.floor((x + z * 0.4) * 0.5) % 3) * 0.6;

        // Doddabetta summit peak cluster at (X: 255, Z: 25)
        const peakDist = Math.hypot(x - 255, z - 25);
        const summitRise = Math.exp(-Math.pow(peakDist / 38, 2)) * 18.0;

        // Shola moist valley depression (cloud forest pocket)
        const sholaPocket = Math.exp(-Math.pow((x - 215) / 30, 2) - Math.pow((z + 40) / 30, 2)) * 7.0;

        y = plateauBase + teaEstateRoll + teaTerraceSteps + summitRise - sholaPocket;
      }

      return y;
    }

    /**
     * Analytical normal calculation using finite central difference.
     */
    getNormal(x, z, step = 0.4) {
      const hL = this.getElevation(x - step, z);
      const hR = this.getElevation(x + step, z);
      const hD = this.getElevation(x, z - step);
      const hU = this.getElevation(x, z + step);

      const dx = (hR - hL) / (2 * step);
      const dz = (hU - hD) / (2 * step);

      // Normal vector = (-dx, 1, -dz) normalized
      const len = Math.hypot(dx, 1, dz);
      return {
        x: -dx / len,
        y: 1.0 / len,
        z: -dz / len,
        slope: Math.acos(Math.max(-1, Math.min(1, 1.0 / len))) * (180 / Math.PI)
      };
    }

    /**
     * Classifies surface material for PBR rendering based on geography, elevation, slope, and moisture.
     */
    getSurfaceMaterial(x, z) {
      const y = this.getElevation(x, z);
      const norm = this.getNormal(x, z);
      const slopeDeg = norm.slope;

      // Steep slopes (> 38°) expose rock
      if (slopeDeg > 38) {
        return (x > 30) ? this.materials.WET_MOUNTAIN_ROCK : this.materials.COASTAL_GRANITE;
      }

      // Coastal & beach sand near water line in Chennai / Mamallapuram
      if (x < -180 && z < -40 && y < 1.0) {
        return this.materials.SHORE_SAND;
      }

      // Pichavaram tidal mud in wetland basin
      if (x >= -80 && x < 30 && z >= 30) {
        if (y <= 0.3) return this.materials.MANGROVE_TIDAL_MUD;
        return this.materials.DARK_WET_SOIL;
      }

      // Cauvery Delta paddy fields & waterways
      if (x >= -80 && x < 30 && z < 30) {
        if (y <= 0.6) return this.materials.RICE_FIELD_WET;
        if (y <= 1.4) return this.materials.AGRICULTURAL_SOIL;
        return this.materials.DELTA_GRASS;
      }

      // Chengalpattu / Villupuram red soil plains
      if (x >= -180 && x < -80) {
        if (slopeDeg < 12 && (x % 14 > 9)) return this.materials.DRY_ROADSIDE_GRASS;
        return this.materials.DRY_RED_SOIL;
      }

      // Nilgiris tea country (high elevation)
      if (x >= 180) {
        if (slopeDeg > 28) return this.materials.WET_MOUNTAIN_ROCK;
        return this.materials.TEA_ESTATE_LOAM;
      }

      // Western Ghats montane zone
      if (x >= 30 && x < 180) {
        if (slopeDeg > 25) return this.materials.WET_MOUNTAIN_ROCK;
        return this.materials.DELTA_GRASS;
      }

      // Default Chennai urban ground
      return this.materials.DRY_RED_SOIL;
    }
  }

  const elevationInstance = new TerrainElevationSystem();

  if (typeof window !== 'undefined') {
    window.TerrainElevationSystem = elevationInstance;
  }

  return elevationInstance;
});
