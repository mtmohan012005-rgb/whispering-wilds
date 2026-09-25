// ============================================================================
// THE WHISPERING WILDS (KAATTU VAZHI) - VEHICLE AUDIO SYSTEM
// Integrates with TransportSystem for authentic Tamil Nadu ground transports:
// auto-rickshaw, vintage Royal Enfield motorcycle, state transport bus, bicycle,
// and rural wooden bullock carts.
// ============================================================================

(function () {
  'use strict';

  class VehicleAudioSystem {
    constructor() {
      this.currentVehicleType = 'auto';
      this.engineState = 'idle'; // 'idle', 'accelerating', 'decelerating', 'stopped'
      this.currentSpeed = 0.0;
      this.lastHornTime = 0;
      this.activeVehicles = new Map();
      this.initialized = false;
    }

    init() {
      this.initialized = true;
      console.log('[VehicleAudioSystem] Initialized vehicle audio engine on VEHICLE bus.');
      return this;
    }

    setVehicleType(type) {
      this.currentVehicleType = (type || 'auto').toLowerCase();
      this.engineState = 'idle';
      this.currentSpeed = 0.0;
      return this;
    }

    updateSpeed(speed) {
      this.currentSpeed = Math.max(0.0, Math.min(1.5, Number(speed) || 0.0));
      if (this.currentSpeed <= 0.05) {
        this.engineState = 'idle';
      } else {
        this.engineState = 'accelerating';
      }

      if (window.audioManager) {
        const soundId = `sfx_vehicle_${this.currentVehicleType}_${this.engineState}`;
        window.audioManager.play(soundId, {
          category: 'vehicle',
          busName: 'VEHICLE',
          volume: 0.7 * Math.max(0.4, this.currentSpeed)
        });
      }
    }

    triggerHorn() {
      this.lastHornTime = Date.now();
      if (window.audioManager) {
        window.audioManager.play(`sfx_vehicle_${this.currentVehicleType}_horn`, {
          category: 'vehicle',
          busName: 'VEHICLE',
          volume: 0.8
        });
      }
    }

    registerVehicle(entityId, type, initialPosition = { x: 0, y: 0, z: 0 }) {
      const emitter = window.AudioEmitter ? new window.AudioEmitter(`vehicle_${entityId}`, {
        busName: 'VEHICLE',
        x: initialPosition.x,
        y: initialPosition.y,
        z: initialPosition.z,
        minDistance: 4.0,
        maxDistance: 60.0
      }) : null;

      this.activeVehicles.set(entityId, {
        id: entityId,
        type: type || 'auto',
        state: 'idle',
        speed: 0,
        emitter
      });

      return emitter;
    }
  }

  const instance = new VehicleAudioSystem();
  VehicleAudioSystem._instance = instance;

  // Static proxies
  for (const prop of Object.getOwnPropertyNames(VehicleAudioSystem.prototype)) {
    if (prop !== 'constructor' && typeof VehicleAudioSystem.prototype[prop] === 'function') {
      VehicleAudioSystem[prop] = function (...args) {
        return VehicleAudioSystem._instance[prop](...args);
      };
    }
  }

  Object.defineProperties(VehicleAudioSystem, {
    currentVehicleType: {
      get() { return VehicleAudioSystem._instance.currentVehicleType; },
      set(v) { VehicleAudioSystem._instance.currentVehicleType = v; }
    },
    engineState: {
      get() { return VehicleAudioSystem._instance.engineState; },
      set(v) { VehicleAudioSystem._instance.engineState = v; }
    },
    currentSpeed: {
      get() { return VehicleAudioSystem._instance.currentSpeed; },
      set(v) { VehicleAudioSystem._instance.currentSpeed = v; }
    },
    lastHornTime: {
      get() { return VehicleAudioSystem._instance.lastHornTime; },
      set(v) { VehicleAudioSystem._instance.lastHornTime = v; }
    }
  });

  if (typeof window !== 'undefined') {
    window.VehicleAudioSystem = VehicleAudioSystem;
    window.vehicleAudioSystem = instance;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VehicleAudioSystem, instance };
  }
})();
