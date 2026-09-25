/**
 * The Whispering Wilds (Kaattu Vazhi) - Authoritative Frame Scheduler
 * Orchestrates the canonical 16-step frame execution pipeline with deterministic order,
 * frequency-tiered subsystem scheduling (60 FPS, 30 Hz, 10 Hz, 1 Hz),
 * and anti-jitter delta time capping.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const scheduler = factory();
    root.FrameScheduler = scheduler;
    if (typeof window !== 'undefined') {
      window.FrameScheduler = scheduler;
    }
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 16 Canonical Execution Pipeline Steps
  const PIPELINE_STEPS = Object.freeze([
    'INPUT',             // 1. Input gathering & action mapping
    'GAME_CLOCK',        // 2. Deterministic world clock advance
    'PLAYER_MOVEMENT',   // 3. Authoritative player locomotion & velocity
    'COLLISION',         // 4. Physics & collision boundaries
    'INTERACTION',       // 5. Look-at target & proximity interactables
    'NPC_SIMULATION',    // 6. Living world NPC schedules & AI
    'WILDLIFE_SIM',      // 7. Wildlife routines & spatial activation
    'QUEST_PROGRESSION', // 8. Objective tracking & story triggers
    'WORLD_EVENTS',      // 9. Weather storms, festivals & dynamic events
    'SURVIVAL',          // 10. Vitals (hunger, thirst, body temperature, stamina)
    'ECONOMY',           // 11. Transaction validation & inventory
    'AUDIO_STATE',       // 12. Spatial emitters, dynamic music & soundscapes
    'ANIMATION_STATE',   // 13. Skeletal blending & IK solvers
    'CAMERA',            // 14. 3D orbit / spring-arm camera
    'RENDERING',         // 15. Presentation layer (Three.js & UI pass)
    'TELEMETRY'          // 16. Performance profiling & FPS metrics
  ]);

  class FrameSchedulerEngine {
    constructor() {
      this.PIPELINE_STEPS = PIPELINE_STEPS;
      this.isRunning = false;
      this.lastFrameTime = 0;
      this.rafId = null;

      // Pipeline Hook Handlers: Map of step -> Array of functions
      this._hooks = new Map();
      PIPELINE_STEPS.forEach(step => this._hooks.set(step, []));

      // Frequency Scheduling Accumulators
      this._accumulators = {
        nearbyNpc: 0,      // Target: 20 Hz (0.05s)
        distantNpc: 0,     // Target: 2 Hz (0.5s)
        nearbyWildlife: 0, // Target: 15 Hz (0.066s)
        distantWildlife: 0,// Target: 1 Hz (1.0s)
        worldEvents: 0,    // Target: 1 Hz (1.0s)
        telemetry: 0       // Target: 4 Hz (0.25s)
      };

      // Frame Metrics
      this.fps = 60;
      this.frameTimeMs = 16.67;
      this.stepTimesMs = {};
    }

    /**
     * Register a callback for a specific pipeline step
     * @param {string} step - One of PIPELINE_STEPS
     * @param {Function} callback - Callback(dt, now)
     */
    registerStep(step, callback) {
      if (!this._hooks.has(step)) {
        console.warn(`[FrameScheduler] Unknown pipeline step: '${step}'`);
        return () => {};
      }
      this._hooks.get(step).push(callback);
      return () => {
        const arr = this._hooks.get(step);
        const idx = arr.indexOf(callback);
        if (idx !== -1) arr.splice(idx, 1);
      };
    }

    /**
     * Check if a rate-limited subsystem should run this tick
     */
    shouldRunSubsystem(subsystemId, intervalSec, dt) {
      if (this._accumulators[subsystemId] === undefined) {
        this._accumulators[subsystemId] = 0;
      }
      this._accumulators[subsystemId] += dt;
      if (this._accumulators[subsystemId] >= intervalSec) {
        this._accumulators[subsystemId] %= intervalSec;
        return true;
      }
      return false;
    }

    /**
     * Executes a single authoritative frame across all 16 pipeline steps
     */
    tick(now = performance.now()) {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = now;
      }

      // Delta time capped between 1ms and 100ms (prevents physics explosion on tab-switch)
      const rawDt = (now - this.lastFrameTime) / 1000.0;
      const dt = Math.max(0.001, Math.min(0.1, rawDt));
      this.lastFrameTime = now;

      this.frameTimeMs = dt * 1000.0;
      this.fps = dt > 0 ? (1.0 / dt) : 60;

      // ── RUN ALL 16 STEPS IN STRICT SEQUENCE ───────────────────────────────
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        const step = PIPELINE_STEPS[i];
        const hooks = this._hooks.get(step);
        if (hooks && hooks.length > 0) {
          const t0 = performance.now();
          for (let j = 0; j < hooks.length; j++) {
            try {
              hooks[j](dt, now);
            } catch (err) {
              console.error(`[FrameScheduler] Error in step '${step}':`, err);
            }
          }
          this.stepTimesMs[step] = performance.now() - t0;
        }
      }
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.lastFrameTime = performance.now();

      const loop = (now) => {
        if (!this.isRunning) return;
        this.tick(now);
        this.rafId = requestAnimationFrame(loop);
      };

      this.rafId = requestAnimationFrame(loop);
    }

    stop() {
      this.isRunning = false;
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    destroy() {
      this.stop();
      this._hooks.forEach(list => list.length = 0);
    }
  }

  return new FrameSchedulerEngine();
});
