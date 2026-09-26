/**
 * The Whispering Wilds (Kaattu Vazhi / Thadam)
 * Realistic Road Network System
 *
 * Implements 8 authentic road classes across Tamil Nadu:
 * Major Highway, State Highway, Town Road, Village Road, Dirt Farm Road,
 * Ghat Mountain Hairpins (matching Photo 1), Plantation Track, and Mangrove Boat Channel.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RoadNetworkSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ROAD_CLASSES = Object.freeze({
    MAJOR_HIGHWAY: {
      id: 'MAJOR_HIGHWAY',
      name: 'Grand Southern Trunk Road (NH 45 / GST)',
      width: 12.0,
      surface: 'asphalt',
      speedMultiplier: 1.35,
      color: 0x22262b,
      shoulderColor: 0x5a483a,
      hasLaneMarking: true,
      hasShoulder: true
    },
    STATE_HIGHWAY: {
      id: 'STATE_HIGHWAY',
      name: 'Villupuram-Delta State Highway (SH 49)',
      width: 8.0,
      surface: 'weathered_asphalt',
      speedMultiplier: 1.20,
      color: 0x343a40,
      shoulderColor: 0x8b3a2b,
      hasLaneMarking: true,
      hasShoulder: true
    },
    TOWN_ROAD: {
      id: 'TOWN_ROAD',
      name: 'George Town Commercial Street',
      width: 6.5,
      surface: 'uneven_pavement',
      speedMultiplier: 1.05,
      color: 0x474e57,
      shoulderColor: 0x64748b,
      hasLaneMarking: false,
      hasShoulder: false
    },
    VILLAGE_ROAD: {
      id: 'VILLAGE_ROAD',
      name: 'Rural Panchayat Village Road',
      width: 4.8,
      surface: 'compacted_tar_red_earth',
      speedMultiplier: 1.10,
      color: 0x554238,
      shoulderColor: 0x8b3a2b,
      hasLaneMarking: false,
      hasShoulder: true
    },
    DIRT_FARM_ROAD: {
      id: 'DIRT_FARM_ROAD',
      name: 'Cauvery Paddy Bund Farm Track',
      width: 3.2,
      surface: 'dual_wheel_rut_earth',
      speedMultiplier: 0.95,
      color: 0x4a3c2e,
      shoulderColor: 0x4a6b2f,
      hasLaneMarking: false,
      hasShoulder: false
    },
    MOUNTAIN_ROAD: {
      id: 'MOUNTAIN_ROAD',
      name: 'Western Ghats 70-Hairpin Pass (Kolli/Nilgiris)',
      width: 7.2,
      surface: 'banked_mountain_asphalt',
      speedMultiplier: 1.15,
      color: 0x2a3038,
      shoulderColor: 0x7d786d,
      hasLaneMarking: true,
      hasShoulder: true,
      hasRetainingWall: true,
      hasGuardStones: true
    },
    PLANTATION_TRACK: {
      id: 'PLANTATION_TRACK',
      name: 'Nilgiris Tea Estate Cobble Track',
      width: 2.8,
      surface: 'stone_cobble_track',
      speedMultiplier: 0.90,
      color: 0x3d352e,
      shoulderColor: 0x4d3220,
      hasLaneMarking: false,
      hasShoulder: false
    },
    MANGROVE_BOAT_CHANNEL: {
      id: 'MANGROVE_BOAT_CHANNEL',
      name: 'Pichavaram Tidal Waterway Corridors',
      width: 6.0,
      surface: 'water_current_channel',
      speedMultiplier: 1.25, // for boats
      color: 0x1d2e28,
      shoulderColor: 0x2c2621,
      isWaterway: true
    }
  });

  // Authoritative road spline segments linking Chennai down to Nilgiris
  const CORRIDORS = [
    // 1. Chennai GST Highway (X: -290 to -180)
    {
      classId: 'MAJOR_HIGHWAY',
      points: [
        { x: -285, z: 5 }, { x: -250, z: 2 }, { x: -220, z: -4 }, { x: -185, z: -2 }
      ]
    },
    // 2. George Town Bazaar Loop
    {
      classId: 'TOWN_ROAD',
      points: [
        { x: -285, z: 25 }, { x: -260, z: 22 }, { x: -245, z: 30 }, { x: -230, z: 18 }
      ]
    },
    // 3. Villupuram State Highway (X: -180 to -80)
    {
      classId: 'STATE_HIGHWAY',
      points: [
        { x: -185, z: -2 }, { x: -150, z: -8 }, { x: -120, z: 4 }, { x: -80, z: -5 }
      ]
    },
    // 4. Cauvery Delta Paddy Bund Track
    {
      classId: 'DIRT_FARM_ROAD',
      points: [
        { x: -75, z: -25 }, { x: -45, z: -20 }, { x: -15, z: -22 }, { x: 25, z: -15 }
      ]
    },
    // 5. Pichavaram Boat Channel (X: -60 to 20, Z: 40 to 90)
    {
      classId: 'MANGROVE_BOAT_CHANNEL',
      points: [
        { x: -60, z: 50 }, { x: -40, z: 70 }, { x: -10, z: 65 }, { x: 15, z: 85 }
      ]
    },
    // 6. Western Ghats 70-Hairpin Mountain Pass (X: 30 to 180) - Winding Switchbacks (matching Photo 1)
    {
      classId: 'MOUNTAIN_ROAD',
      points: [
        { x: 35,  z: -10 },
        { x: 55,  z: 18 },  // Hairpin 1
        { x: 70,  z: -15 }, // Hairpin 2
        { x: 88,  z: 22 },  // Hairpin 3
        { x: 105, z: -20 }, // Hairpin 4
        { x: 125, z: 15 },  // Hairpin 5
        { x: 145, z: -10 }, // Hairpin 6
        { x: 165, z: 8 },   // Hairpin 7
        { x: 180, z: 0 }    // Summit Threshold
      ]
    },
    // 7. Nilgiris Tea Estate Plantation Track (X: 185 to 290)
    {
      classId: 'PLANTATION_TRACK',
      points: [
        { x: 185, z: 0 }, { x: 215, z: 12 }, { x: 245, z: -8 }, { x: 280, z: 15 }
      ]
    }
  ];

  class RoadNetworkSystem {
    constructor() {
      this.roadClasses = ROAD_CLASSES;
      this.corridors = CORRIDORS;
    }

    /**
     * Determines whether an (x, z) location is on or near an established road corridor.
     */
    queryRoadAt(x, z) {
      let closestDist = Infinity;
      let activeCorridor = null;
      let activeClass = null;

      for (const corridor of this.corridors) {
        const roadClass = this.roadClasses[corridor.classId];
        const pts = corridor.points;

        for (let i = 0; i < pts.length - 1; i++) {
          const d = this._distToSegment(x, z, pts[i].x, pts[i].z, pts[i + 1].x, pts[i + 1].z);
          if (d < closestDist) {
            closestDist = d;
            activeCorridor = corridor;
            activeClass = roadClass;
          }
        }
      }

      const halfWidth = activeClass ? activeClass.width * 0.5 : 2.0;
      const onRoad = closestDist <= halfWidth;
      const onShoulder = closestDist <= (halfWidth + 2.5);

      return {
        onRoad,
        onShoulder,
        distanceToCenter: closestDist,
        roadClass: activeClass,
        speedMultiplier: onRoad ? (activeClass ? activeClass.speedMultiplier : 1.0) : 1.0,
        surfaceName: activeClass ? activeClass.surface : 'wild_ground'
      };
    }

    _distToSegment(px, pz, ax, az, bx, bz) {
      const dx = bx - ax;
      const dz = bz - az;
      const lenSq = dx * dx + dz * dz;
      if (lenSq === 0) return Math.hypot(px - ax, pz - az);

      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lenSq));
      const projX = ax + t * dx;
      const projZ = az + t * dz;
      return Math.hypot(px - projX, pz - projZ);
    }
  }

  const roadInstance = new RoadNetworkSystem();

  if (typeof window !== 'undefined') {
    window.RoadNetworkSystem = roadInstance;
  }

  return roadInstance;
});
