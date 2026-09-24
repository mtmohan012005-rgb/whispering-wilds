// ============================================================================
// THE WHISPERING WILDS - TRANSITION SYSTEM
// Manages region boundary detection, async preload, fade/cinematic transition,
// asset cleanup, and cross-region state preservation.
// ============================================================================

(function () {
  'use strict';

  // Cross-region persistent state keys (NEVER reset on region change)
  const CROSS_REGION_STATE = [
    'quests', 'inventory', 'relationships', 'discoveries',
    'storyFlags', 'transportUnlocks', 'time', 'weather',
    'achievements', 'codex', 'collectibles', 'secrets'
  ];

  class TransitionSystem {
    constructor() {
      this._isTransitioning  = false;
      this._currentRegion    = 'george_town';
      this._preloadingRegion = null;
      this._pendingTransition = null;
      this._preloadComplete  = false;
      this._boundaryCheckCooldown = 0;

      if (window.GameLifecycle) {
        window.GameLifecycle.on('enter:TRANSITIONING', () => this._onEnterTransitioning());
        window.GameLifecycle.on('enter:PLAYING',       (e) => {
          if (e.from === 'LOADING_GAME') this._onRegionReady();
        });
      }
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Called from game loop — check region boundary approach
    // -------------------------------------------------------------------------
    checkBoundaryApproach(playerPos, dt) {
      if (this._isTransitioning || this._preloadingRegion) return;
      this._boundaryCheckCooldown -= dt;
      if (this._boundaryCheckCooldown > 0) return;
      this._boundaryCheckCooldown = 2.0; // check every 2 seconds

      const nextRegion = this._detectApproachingRegion(playerPos);
      if (nextRegion && nextRegion !== this._currentRegion) {
        this._beginPreload(nextRegion);
      }
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Force region transition (e.g. story trigger, fast travel)
    // -------------------------------------------------------------------------
    transitionToRegion(regionId, options = {}) {
      if (this._isTransitioning) return false;
      if (!window.VALID_REGIONS?.includes(regionId)) {
        console.warn(`[TransitionSystem] Invalid region: '${regionId}'.`);
        return false;
      }
      if (regionId === this._currentRegion) return false;

      this._pendingTransition = { regionId, options };
      this._beginPreload(regionId);
      return true;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Unload current region (called when returning to menu)
    // -------------------------------------------------------------------------
    unloadCurrent() {
      this._disposeRegionResources(this._currentRegion);
    }

    getCurrentRegion()    { return this._currentRegion; }
    isTransitioning()     { return this._isTransitioning; }

    // -------------------------------------------------------------------------
    // PRIVATE: Preload next region asynchronously
    // -------------------------------------------------------------------------
    async _beginPreload(regionId) {
      if (this._preloadingRegion === regionId) return;
      this._preloadingRegion = regionId;
      this._preloadComplete  = false;

      console.log(`[TransitionSystem] Preloading region: ${regionId}`);

      try {
        // Preload essential assets for next region without unloading current
        const ws = window.worldStreamingSystem || window.threeWorld?.worldStreaming;
        if (ws?.preloadRegion) await ws.preloadRegion(regionId);

        this._preloadComplete = true;
        console.log(`[TransitionSystem] Preload complete: ${regionId}`);

        // If forced transition was requested, trigger it now
        if (this._pendingTransition?.regionId === regionId) {
          this._executeTransition(regionId, this._pendingTransition.options);
        } else if (this._detectPlayerCrossedBoundary(regionId)) {
          // Player crossed boundary while preloading
          this._executeTransition(regionId, {});
        }
      } catch (err) {
        console.error(`[TransitionSystem] Preload failed: ${regionId}`, err);
        this._preloadingRegion = null;
        this._preloadComplete  = false;
      }
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Execute the actual transition
    // -------------------------------------------------------------------------
    async _executeTransition(targetRegion, options) {
      if (this._isTransitioning) return;
      this._isTransitioning = true;

      const lc = window.GameLifecycle;
      if (lc) lc.transitionTo('TRANSITIONING', { from: this._currentRegion, to: targetRegion });

      // 1. Save safe state at transition boundary
      if (!options.skipSave) {
        if (window.CheckpointSystem) {
          window.CheckpointSystem.requestCheckpoint('region_transition', { region: targetRegion });
        }
      }

      // 2. Fade out
      await this._fadeOut(600);

      // 3. Preserve cross-region state (nothing lost)
      this._preserveCrossRegionState();

      // 4. Unload old region resources
      this._disposeRegionResources(this._currentRegion);

      // 5. Activate new region
      await this._activateRegion(targetRegion);

      // 6. Validate and place player
      this._validateAndPlacePlayer(targetRegion, options.spawnPoint);

      // 7. Update systems
      this._updateSystemsForRegion(targetRegion);

      // 8. Fade in
      await this._fadeIn(600);

      // Complete
      const prevRegion       = this._currentRegion;
      this._currentRegion    = targetRegion;
      this._preloadingRegion = null;
      this._preloadComplete  = false;
      this._pendingTransition = null;
      this._isTransitioning  = false;

      if (window.GameState) window.GameState.world.currentRegion = targetRegion;
      if (window.SessionManager) window.SessionManager.setRegion(targetRegion);

      if (lc) lc.transitionTo('PLAYING', { region: targetRegion, from: prevRegion });

      window.GameLifecycle?.emit('regionChanged', { from: prevRegion, to: targetRegion });
      console.log(`[TransitionSystem] Transition complete: ${prevRegion} → ${targetRegion}`);
    }

    _onEnterTransitioning() {
      // Input is locked by lifecycle state — no extra action needed
    }

    _onRegionReady() {
      // Called when LOADING_GAME → PLAYING (initial load)
      const region = window.GameState?.world?.currentRegion || 'george_town';
      this._currentRegion = region;
    }

    // -------------------------------------------------------------------------
    // PRIVATE: State preservation
    // -------------------------------------------------------------------------
    _preserveCrossRegionState() {
      // All cross-region state lives in window.GameState — already authoritative.
      // Transport unlocks: persist to GameState world flags
      const gs = window.GameState;
      if (!gs) return;

      // Ensure discovered transport stops are preserved
      if (window.fastTravelSystem?.getUnlockedStops) {
        gs.world.fastTravelUnlocks = window.fastTravelSystem.getUnlockedStops();
      }
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Region activation / disposal
    // -------------------------------------------------------------------------
    async _activateRegion(regionId) {
      // Activate preloaded region in world streaming
      const ws = window.worldStreamingSystem || window.threeWorld?.worldStreaming;
      if (ws?.activateRegion) await ws.activateRegion(regionId);

      // Traffic
      if (window.trafficSystem?.setRegion) {
        window.trafficSystem.setRegion(regionId.toUpperCase());
      }

      // Living world
      const lw = window.threeWorld?.livingWorld || window.livingWorldSystem;
      if (lw?.setRegion) lw.setRegion(regionId);

      // Audio
      if (window.audioManager?.ambient?.setRegion) {
        window.audioManager.ambient.setRegion(regionId);
      }
      if (window.audioManager?.dynamicMusic?.setRegion) {
        window.audioManager.dynamicMusic.setRegion(regionId);
      }

      // Weather continues without reset
    }

    _disposeRegionResources(regionId) {
      const ws = window.worldStreamingSystem || window.threeWorld?.worldStreaming;
      if (ws?.unloadRegion) ws.unloadRegion(regionId);
    }

    _validateAndPlacePlayer(regionId, spawnPoint) {
      const gs = window.GameState;
      if (!gs) return;

      let spawnPos = spawnPoint;
      if (!spawnPos) {
        // Use region entry point from WORLD_DATA
        const rd = window.WORLD_DATA?.regions?.[regionId];
        spawnPos = rd?.entryPoint || rd?.safeSpawn || { x: 0, y: 0, z: 0 };
      }

      // Validate Y (terrain height)
      if (window.threeWorld?.terrain?.getHeightAt) {
        const terrainY = window.threeWorld.terrain.getHeightAt(spawnPos.x, spawnPos.z);
        spawnPos = { ...spawnPos, y: Math.max(terrainY, spawnPos.y || 0) };
      }

      // Apply to 3D player
      const p3d = window.threeWorld?.player;
      if (p3d?.setPosition) p3d.setPosition(spawnPos.x, spawnPos.y, spawnPos.z);

      // Update GameState
      gs.player.position.x = spawnPos.x;
      gs.player.position.y = spawnPos.y;
      gs.player.position.z = spawnPos.z || 0;
    }

    _updateSystemsForRegion(regionId) {
      // Update biome title
      const biomeEl = document.getElementById('biome-title');
      if (biomeEl) {
        const biomeNames = {
          george_town:    'GEORGE TOWN, CHENNAI (ஜார்ஜ் டவுன்)',
          cauvery_delta:  'CAUVERY DELTA (காவிரி டெல்டா)',
          pichavaram:     'PICHAVARAM MANGROVES (பிச்சாவரம்)',
          chettinad:      'CHETTINAD (செட்டிநாடு)',
          thanjavur:      'THANJAVUR (தஞ்சாவூர்)',
          mamallapuram:   'MAMALLAPURAM (மாமல்லபுரம்)',
          nilgiris:       'NILGIRI MOUNTAINS (நீலகிரி)',
          final_sanctuary:'PASUMAI THADAM (பசுமை தடம்)'
        };
        biomeEl.textContent = biomeNames[regionId] || regionId.toUpperCase();
      }

      // Temperature system region update
      if (window.temperatureSystem?.setRegion) {
        window.temperatureSystem.setRegion(regionId);
      }
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Boundary detection
    // -------------------------------------------------------------------------
    _detectApproachingRegion(playerPos) {
      if (!playerPos || !window.WORLD_DATA?.regions) return null;

      const regions = window.WORLD_DATA.regions;
      for (const [id, data] of Object.entries(regions)) {
        if (id === this._currentRegion) continue;
        if (!data.bounds) continue;
        const margin = 80; // preload margin in world units
        const b = data.bounds;
        if (playerPos.x >= b.minX - margin && playerPos.x <= b.maxX + margin &&
            playerPos.z >= b.minZ - margin && playerPos.z <= b.maxZ + margin) {
          return id;
        }
      }
      return null;
    }

    _detectPlayerCrossedBoundary(regionId) {
      const p3d = window.threeWorld?.player;
      if (!p3d) return false;
      const pos = p3d.getPosition?.() || {};
      const rd  = window.WORLD_DATA?.regions?.[regionId];
      if (!rd?.bounds) return false;
      const b = rd.bounds;
      return pos.x >= b.minX && pos.x <= b.maxX && pos.z >= b.minZ && pos.z <= b.maxZ;
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Fade effects
    // -------------------------------------------------------------------------
    _fadeOut(ms) {
      return new Promise(resolve => {
        const overlay = this._getOrCreateFadeOverlay();
        overlay.style.transition = `opacity ${ms}ms`;
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
        setTimeout(resolve, ms + 50);
      });
    }

    _fadeIn(ms) {
      return new Promise(resolve => {
        const overlay = this._getOrCreateFadeOverlay();
        overlay.style.transition = `opacity ${ms}ms`;
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        setTimeout(resolve, ms + 50);
      });
    }

    _getOrCreateFadeOverlay() {
      let overlay = document.getElementById('ww-transition-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'ww-transition-overlay';
        overlay.style.cssText = [
          'position:fixed;inset:0;z-index:8000;',
          'background:#0a0e14;opacity:0;pointer-events:none;',
          'transition:opacity .6s;'
        ].join('');
        document.body.appendChild(overlay);
      }
      return overlay;
    }

    getDiagnostics() {
      return {
        currentRegion:     this._currentRegion,
        isTransitioning:   this._isTransitioning,
        preloadingRegion:  this._preloadingRegion,
        preloadComplete:   this._preloadComplete,
        pendingTransition: this._pendingTransition
      };
    }
  }

  window.TransitionSystem = new TransitionSystem();

})();
