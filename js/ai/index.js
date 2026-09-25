/**
 * The Whispering Wilds - AI Systems Index
 * Bootstrap: NPC Manager + Wildlife AI + Living Crowd + Game Director.
 * All AI reads from and writes to authoritative GameState.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.AISystems = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IS_DEV = (typeof window !== 'undefined' && window.location &&
                  window.location.hostname === 'localhost');

  class AISystemsManager {
    constructor() {
      this.npcManager  = null;
      this.wildlifeAI  = null;
      this.livingCrowd = null;
      this.director    = null;
      this._initialized = false;
    }

    init(deps) {
      const { gameState, eventBus, spatialQuery, navigationSystem } = deps;

      // ── NPC Manager ─────────────────────────────────────────────────────────
      const NPCMod = (typeof window !== 'undefined' && window.NPCManager) ||
                     (typeof globalThis !== 'undefined' && globalThis.NPCManager);
      if (NPCMod) {
        this.npcManager = new NPCMod.NPCManager();
        this.npcManager.init({ gameState, eventBus, navigation: navigationSystem, spatialQuery });
        this.npcManager.registerDefaultTemplates();
      }

      // ── Wildlife AI ─────────────────────────────────────────────────────────
      const WildMod = (typeof window !== 'undefined' && window.WildlifeAI) ||
                      (typeof globalThis !== 'undefined' && globalThis.WildlifeAI);
      if (WildMod) {
        this.wildlifeAI = new WildMod.WildlifeAI();
        this.wildlifeAI.init({ gameState, eventBus, spatialQuery });
      }

      // ── Living Crowd ─────────────────────────────────────────────────────────
      const CrowdMod = (typeof window !== 'undefined' && window.LivingCrowd) ||
                       (typeof globalThis !== 'undefined' && globalThis.LivingCrowd);
      if (CrowdMod) {
        this.livingCrowd = new CrowdMod.LivingCrowdSystem();
        this.livingCrowd.init({ gameState, eventBus, spatialQuery, npcManager: this.npcManager });
      }

      // ── Game Director ────────────────────────────────────────────────────────
      const DirMod = (typeof window !== 'undefined' && window.GameDirector) ||
                     (typeof globalThis !== 'undefined' && globalThis.GameDirector);
      if (DirMod) {
        this.director = new DirMod.GameDirector();
        this.director.init({
          gameState, eventBus,
          worldMemory:  deps.worldMemory,
          npcManager:   this.npcManager,
          wildlifeAI:   this.wildlifeAI,
          spatialQuery
        });
      }

      this._initialized = true;
      if (IS_DEV) console.log('[AISystems] All AI subsystems initialized');
      if (eventBus) eventBus.emit('AI_SYSTEMS_READY', {});
    }

    update(dt) {
      if (!this._initialized) return;
      if (this.npcManager)  this.npcManager.update(dt);
      if (this.wildlifeAI)  this.wildlifeAI.update(dt);
      if (this.livingCrowd) this.livingCrowd.update(dt);
      if (this.director)    this.director.update(dt);
    }

    destroy() {
      this.npcManager?.destroy();
      this.wildlifeAI?.destroy();
      this.livingCrowd?.destroy();
      this.director?.destroy();
      this._initialized = false;
    }
  }

  return new AISystemsManager();
});
