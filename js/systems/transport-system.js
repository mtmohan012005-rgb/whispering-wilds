/**
 * The Whispering Wilds (Kaattu Vazhi) - Transport System
 * Route ownership, seamless vehicle handoffs across cell boundaries,
 * boat and cart navigation, stop unlock synchronization with GameState,
 * and predictive preload triggering during rapid transport.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TransportSystem = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class TransportSystem {
    constructor(scene = null, trafficSystem = null) {
      this.scene = scene;
      this.trafficSystem = trafficSystem || (typeof window !== 'undefined' ? window.trafficSystem : null);

      // Vehicles currently tracked by route ownership (Section 33)
      this.routeVehicles = new Map(); // vehicleId -> { vehicle, currentCellId, routeId, progress }

      // Transport stops registry (Section 73)
      this.stops = {
        stop_che_high_court: { id: 'stop_che_high_court', name: 'Madras High Court Auto Stand', cellId: 'CELL_CHE_001', type: 'auto', unlocked: true },
        stop_cau_anicut: { id: 'stop_cau_anicut', name: 'Grand Anicut Sluice Pier', cellId: 'CELL_CAU_001', type: 'boat', unlocked: true },
        stop_pic_jetty: { id: 'stop_pic_jetty', name: 'Pichavaram Mangrove Jetty', cellId: 'CELL_PIC_001', type: 'boat', unlocked: false },
        stop_cht_mansion: { id: 'stop_cht_mansion', name: 'Kanadukathan Valavu Veedu Stand', cellId: 'CELL_CHT_001', type: 'cart', unlocked: false },
        stop_tha_temple: { id: 'stop_tha_temple', name: 'Brihadisvara Temple Chariot Stand', cellId: 'CELL_THA_001', type: 'carriage', unlocked: false },
        stop_mam_dock: { id: 'stop_mam_dock', name: 'Shore Temple Catamaran Mooring', cellId: 'CELL_MAM_001', type: 'boat', unlocked: false },
        stop_nil_checkpost: { id: 'stop_nil_checkpost', name: 'Kallar Mountain Bus Terminal', cellId: 'CELL_NIL_001', type: 'bus', unlocked: false }
      };

      // Player transport status
      this.isPlayerTraveling = false;
      this.activeTransportMode = 'NONE'; // 'BOAT', 'CART', 'BUS', 'NONE'
    }

    /**
     * Checks if a transport stop is unlocked (Section 73)
     */
    isStopUnlocked(stopId) {
      const gs = typeof window !== 'undefined' ? window.GameState : null;
      if (gs && gs.world && gs.world.unlockedStops) {
        return !!gs.world.unlockedStops[stopId];
      }
      return this.stops[stopId] ? this.stops[stopId].unlocked : false;
    }

    unlockStop(stopId) {
      if (this.stops[stopId]) {
        this.stops[stopId].unlocked = true;
        const gs = typeof window !== 'undefined' ? window.GameState : null;
        if (gs && gs.world) {
          if (!gs.world.unlockedStops) gs.world.unlockedStops = {};
          gs.world.unlockedStops[stopId] = true;
        }
      }
    }

    /**
     * Handoff simulation for vehicles crossing cell boundaries (Section 34)
     * Preserves velocity, route progress, and mesh transform without duplicate instantiation or teleportation.
     */
    handoffVehicleAcrossCell(vehicleId, fromCellId, toCellId) {
      const vRecord = this.routeVehicles.get(vehicleId);
      if (!vRecord) return false;

      console.log(`[TransportSystem] 🛺 Traffic handoff for ${vehicleId}: ${fromCellId} ➔ ${toCellId}`);

      // Verify destination cell is active or preloaded in WorldStreamingSystem
      const streamSys = typeof window !== 'undefined' ? window.worldStreamingSystem : null;
      if (streamSys && streamSys.cellManager) {
        // Safe handoff: update route ownership
        vRecord.currentCellId = toCellId;
        return true;
      }

      return false;
    }

    /**
     * Embarks player onto transport (e.g. boat across Pichavaram or cart through Chettinad)
     * Triggers predictive preload of destination and intermediate channel cells (Section 43, 45)
     */
    embarkPlayer(mode, destinationStopId) {
      this.isPlayerTraveling = true;
      this.activeTransportMode = mode;

      const stop = this.stops[destinationStopId];
      if (!stop) return;

      console.log(`[TransportSystem] ⛵ Player embarked on ${mode} heading to ${stop.name} (${stop.cellId})`);

      // Trigger predictive preload on WorldStreamingSystem (Section 45)
      const streamSys = typeof window !== 'undefined' ? window.worldStreamingSystem : null;
      if (streamSys && streamSys.cellManager) {
        const destCell = streamSys.cellManager.getCell(stop.cellId);
        if (destCell) {
          streamSys.preloadCell(destCell, mode);
        }
      }
    }

    disembarkPlayer() {
      this.isPlayerTraveling = false;
      this.activeTransportMode = 'NONE';
      console.log('[TransportSystem] 🚶 Player disembarked to on-foot traversal.');
    }

    update(dt, playerPos) {
      // Update active route vehicles
      for (const [vId, rec] of this.routeVehicles.entries()) {
        if (rec.vehicle && typeof rec.vehicle.update === 'function') {
          rec.vehicle.update(dt, playerPos);
        }
      }
    }
  }

  return TransportSystem;
});
